import type { NextRequest } from "next/server";

type NominatimSearchResult = {
  lat: string;
  lon: string;
  name?: string;
  display_name?: string;
  address?: Record<string, string | undefined>;
};

function normalizeQuerySpaces(s: string): string {
  return s
    .trim()
    .replace(/[\u2018\u2019\u201B\u2032]/g, "'")
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ");
}

/** CN / JP fullwidth punctuation often used instead of commas in one-line addresses */
function normalizeCjkAddressPunctuation(s: string): string {
  return s.replace(/[，、；]/g, " ");
}

/**
 * Strip 号 + mall name + 楼层 + optional L3011-style unit at end (no commas).
 * e.g. …中山北路3222号月星环球港3楼L3011-L3012 → …中山北路3222
 */
function stripChineseMallAndFloorAfterHao(s: string): string {
  let t = s.trim();
  t = t.replace(
    /(\d+)号[\u4e00-\u9fff]{1,48}?\d+[楼樓](?:\s*[Ll][\d\-A-Za-z]*)?$/u,
    "$1",
  );
  t = t.replace(
    /(\d+)号(\d+[楼樓](?:\s*[Ll][\d\-A-Za-z]*)?)$/u,
    "$1",
  );
  return t;
}

/** Nominatim often fails 路3222 — insert a break before the house number */
function insertSpaceAfterChineseRoadBeforeDigits(s: string): string {
  return s
    .replace(/([路街巷弄])(?=\d)/gu, "$1 ")
    .replace(/(大道)(?=\d)/gu, "$1 ");
}

function stripTrailingChineseHao(s: string): string {
  return s.replace(/(\d+)号$/u, "$1");
}

function chineseAddressGeocodeCandidates(raw: string): string[] {
  if (!/[\u3000-\u303f\u4e00-\u9fff\uf900-\ufaff]/.test(raw)) return [];

  const base = normalizeQuerySpaces(normalizeCjkAddressPunctuation(raw));
  const mallStripped = normalizeQuerySpaces(
    stripChineseMallAndFloorAfterHao(base),
  );
  const roadSpaced = normalizeQuerySpaces(
    insertSpaceAfterChineseRoadBeforeDigits(mallStripped),
  );
  const roadSpacedNoHao = normalizeQuerySpaces(
    stripTrailingChineseHao(roadSpaced),
  );
  const roadFirst = normalizeQuerySpaces(
    insertSpaceAfterChineseRoadBeforeDigits(base),
  );
  const roadFirstThenMall = normalizeQuerySpaces(
    stripChineseMallAndFloorAfterHao(roadFirst),
  );
  const roadFirstThenMallSpaced = normalizeQuerySpaces(
    insertSpaceAfterChineseRoadBeforeDigits(roadFirstThenMall),
  );

  const ordered = [
    mallStripped,
    roadSpaced,
    roadSpacedNoHao,
    roadFirstThenMall,
    roadFirstThenMallSpaced,
    roadFirst,
  ];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const q of ordered) {
    if (q.length < 2 || seen.has(q)) continue;
    seen.add(q);
    out.push(q);
  }
  return out;
}

/** Move postal out of comma segments: "〒604-8202 Kyoto" → "Kyoto". */
function cleanPostalInCommaSegments(s: string): string {
  return s
    .split(",")
    .map((part) => {
      const p = part.trim();
      const withMark = p.match(/^〒\s*(\d{3}-?\d{4})\s+(.+)$/u);
      if (withMark) return withMark[2].trim();
      const plain = p.match(/^(\d{3}-?\d{4})\s+(.+)$/u);
      if (plain) return plain[2].trim();
      return p.replace(/^〒\s*/u, "").trim();
    })
    .filter(Boolean)
    .join(", ");
}

/**
 * Drop floor / level clauses that often break Nominatim (e.g. "G. floor",
 * "ground floor", "1F", ordinal floors). Keeps street numbers like "No. 969".
 */
function stripLevelMentions(s: string): string {
  let t = s;
  // Leading CSV clause: "F3 Floor, …" / "12F, …" (common in CN/HK mall addresses)
  t = t.replace(/^[fF]\s*\d+(?:\s*(?:floor|fl\.?))?\s*,\s*/u, "");
  t = t.replace(/^\d{1,2}\s*f(?:\s+floor)?\s*,\s*/iu, "");
  t = t.replace(
    /\b(?:g\.?\s*floor|g\s+floor|ground\s+floor|gf\b|g\s*\/\s*f)\b/giu,
    " ",
  );
  t = t.replace(/\b(?:basement|cellar|b\s*\/\s*f|b\d+)\b/giu, " ");
  t = t.replace(/\b\d{1,2}(?:st|nd|rd|th)\s+floor\b/giu, " ");
  t = t.replace(/\b\d+\s*F\b/giu, " ");
  t = t.replace(/\b[fF]\s*\d+(?:\s*(?:floor|fl\.?))?\b/gu, " ");
  t = t.replace(/\s*Ｂ?\d+\s*階?\s*$/u, "");
  t = t.replace(/\s+,/g, ",").replace(/\s+/g, " ").replace(/\s*,\s*,/g, ", ");
  return t.replace(/^,\s*|,\s*$/g, "").trim();
}

/**
 * Try dropping trailing comma clauses (building names, block numbers) —
 * Nominatim often returns [] for full JP + English + katakana lines.
 * Keep ≥3 segments: two-part prefixes like "No. 7, Lane 434" match unrelated
 * "Lane 434" hits (e.g. UAE) before city/country context is applied.
 */
function commaPrefixVariants(s: string): string[] {
  const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length < 4) return [];
  const out: string[] = [];
  for (let n = parts.length - 1; n >= 3; n--) {
    out.push(parts.slice(0, n).join(", "));
  }
  return out;
}

/**
 * Leading CSV segments Nominatim often cannot resolve (floors, mall towers,
 * building numbers). Peel until we hit a street / district line.
 */
function shouldDropLeadingAddressSegment(seg: string): boolean {
  const s = seg.trim();
  if (!s) return false;

  if (/^building\s+\d+/i.test(s)) return true;
  if (/^bldg\.?\s*\d+/i.test(s)) return true;
  if (/^block\s+[a-z0-9-]+$/i.test(s)) return true;
  if (/^tower\s+/i.test(s)) return true;
  if (/^#\s*\d+/i.test(s)) return true;

  if (/^f\s*\d+(?:\s*(?:floor|fl\.?))?$/i.test(s)) return true;
  if (/^\d{1,2}\s*f(?:\s+floor)?$/i.test(s)) return true;
  if (/^\d{1,2}(?:st|nd|rd|th)\s+floor$/i.test(s)) return true;
  if (/^(?:basement|cellar)$/i.test(s)) return true;

  if (/\b(?:north|south|east|west|central|main)\s+tower$/i.test(s)) return true;

  if (/\b(?:plaza|mall)\s*$/i.test(s)) return true;
  if (/\b(?:shopping|commercial)\s+(?:plaza|mall|center|centre)$/i.test(s))
    return true;

  return false;
}

function leadingCommaStripVariants(s: string): string[] {
  const segments = s.split(",").map((p) => p.trim()).filter(Boolean);
  const out: string[] = [];
  let start = 0;
  while (start < segments.length) {
    const first = segments[start] ?? "";
    if (!shouldDropLeadingAddressSegment(first)) break;
    start += 1;
    const rest = segments.slice(start).join(", ");
    if (rest.length >= 2) out.push(rest);
  }
  return out;
}

const MAX_CANDIDATES = 40;

/** If the user typed these, reject Nominatim rows outside Greater China */
const CHINA_REGION_HINT_RE =
  /\b(shanghai|beijing|chongqing|tianjin|guangzhou|shenzhen|hangzhou|chengdu|nanjing|wuhan|xian|xi'an|suzhou|qingdao|dalian|ningbo|xiamen|changsha|fuzhou|kunming|hefei|zhengzhou|harbin|jinan|changchun|shijiazhuang|taiyuan|hohhot|urumqi|lhasa|nanning|guiyang|lanzhou|haikou|yinchuan|xining|hong\s*kong|macau|huangpu|jing'an|jingan|putuo|xuhui|changning|yangpu|minhang|baoshan|jiading|pudong|songjiang|jinshan|qingpu|fengxian|chongming|中国|上海|北京|香港|澳门|黄浦|徐汇|长宁|静安|普陀|虹口|杨浦|闵行|宝山|嘉定|浦东|松江|金山|青浦|奉贤|崇明|天津|重庆|广东|江苏|浙江|四川|湖北|湖南|福建|辽宁|山东|陕西|河南|河北|安徽|云南|广西)\b/i;

function querySuggestsChinaRegion(q: string): boolean {
  if (CHINA_REGION_HINT_RE.test(q)) return true;
  if (
    /\b(prc|people['’]s\s+republic\s+of\s+china|republic\s+of\s+china)\b/i.test(
      q,
    )
  )
    return true;
  if (/\bchina\b/i.test(q)) return true;
  return false;
}

function nominatimRowInChinaRegion(r: NominatimSearchResult): boolean {
  const c = (r.address?.country ?? "").toLowerCase();
  if (
    c === "china" ||
    c === "中国" ||
    /hong kong|香港/.test(c) ||
    /macau|macao|澳门/.test(c)
  )
    return true;
  const dn = r.display_name ?? "";
  if (/\b(中国|china)\b/i.test(dn)) return true;
  if (/香港|hong kong|澳门|macau|macao/i.test(dn)) return true;
  return false;
}

/** "…, Lane 434, …" is rarely in Nominatim; keep road + district + city */
function stripCommaLaneNumberClause(s: string): string {
  return normalizeQuerySpaces(s.replace(/,\s*lane\s+\d+\s*,/gi, ", "));
}

function stripLeadingNoClause(s: string): string {
  return normalizeQuerySpaces(s.replace(/^no\.?\s*\d+\s*,\s*/i, ""));
}

/**
 * Nominatim misses some international English strings (e.g. "Jongno District"
 * in Korea, "South Korea" vs "Korea", unit suffixes). Try relaxed variants.
 * Japanese mixed addresses: strip 〒+postal from segments, strip floors, then
 * try shorter comma-prefix queries (ward / chōme level geocodes reliably).
 * English addresses: strip "G. floor" / "ground floor" etc. before search.
 */
function geocodeSearchCandidates(raw: string): string[] {
  const base = normalizeQuerySpaces(raw);
  const postalCleaned = normalizeQuerySpaces(cleanPostalInCommaSegments(base));
  const levelStripped = normalizeQuerySpaces(stripLevelMentions(base));
  const cleaned = normalizeQuerySpaces(
    stripLevelMentions(postalCleaned),
  );

  const seen = new Set<string>();
  const ordered: string[] = [];
  const push = (s: string) => {
    const t = normalizeQuerySpaces(s);
    if (t.length < 2 || seen.has(t)) return;
    if (ordered.length >= MAX_CANDIDATES) return;
    seen.add(t);
    ordered.push(t);
  };

  // Original first; CN one-line addresses (路+号+商场+楼) need mall/floor strip + spacing.
  push(base);
  const laneStripped = stripCommaLaneNumberClause(base);
  push(laneStripped);
  push(stripLeadingNoClause(base));
  push(stripLeadingNoClause(laneStripped));
  for (const cn of chineseAddressGeocodeCandidates(raw)) {
    push(cn);
    push(normalizeQuerySpaces(stripLevelMentions(cn)));
    for (const v of leadingCommaStripVariants(cn)) {
      push(v);
      for (const c of commaPrefixVariants(v)) push(c);
    }
  }
  for (const v of leadingCommaStripVariants(base)) {
    push(v);
    for (const c of commaPrefixVariants(v)) push(c);
  }
  for (const v of leadingCommaStripVariants(cleaned)) {
    push(v);
    for (const c of commaPrefixVariants(v)) push(c);
  }
  for (const v of leadingCommaStripVariants(levelStripped)) {
    push(v);
    for (const c of commaPrefixVariants(v)) push(c);
  }
  for (const v of leadingCommaStripVariants(postalCleaned)) {
    push(v);
    for (const c of commaPrefixVariants(v)) push(c);
  }

  push(levelStripped);
  push(cleaned);
  push(postalCleaned);
  for (const v of commaPrefixVariants(cleaned)) push(v);
  for (const v of commaPrefixVariants(levelStripped)) push(v);
  for (const v of commaPrefixVariants(postalCleaned)) push(v);
  for (const v of commaPrefixVariants(base)) push(v);
  push(base.replace(/^Japan,\s*/i, ""));
  push(cleaned.replace(/^Japan,\s*/i, ""));

  // English "… District" (common for wards / 구) — often breaks geocoding
  push(base.replace(/\s+District\b/gi, " "));
  // Country synonyms
  push(base.replace(/\bSouth Korea\b/gi, "Korea"));
  push(base.replace(/\bUnited Kingdom\b/gi, "UK"));
  push(
    base.replace(
      /\bPeople(?:'|’)?s\s+Republic\s+of\s+China\b/gi,
      "China",
    ),
  );
  // Japanese-style "Tokyo Prefecture" etc.
  push(base.replace(/\s+Prefecture\b/gi, " "));
  push(
    base
      .replace(/\s+District\b/gi, " ")
      .replace(/\bSouth Korea\b/gi, "Korea"),
  );

  const firstComma = base.indexOf(",");
  if (firstComma > 0) {
    const streetLine = base.slice(0, firstComma).trimEnd();
    const afterFirstComma = base.slice(firstComma);
    const relaxedStreet = streetLine
      .replace(/\s+[bB]\d{1,5}$/u, "")
      .replace(
        /\s+(?:apt|apartment|unit|suite|ste)\.?\s*[a-zA-Z0-9#-]+$/iu,
        "",
      )
      .replace(/\s+#\s*\d+[a-zA-Z]?$/iu, "")
      .trimEnd();
    if (relaxedStreet !== streetLine) {
      push(relaxedStreet + afterFirstComma);
    }
  }

  const collapsedUnits = base
    .replace(/\s+[bB]\d{1,5}\b/gu, " ")
    .replace(/\s+,/g, ",")
    .replace(/\s+/g, " ")
    .trim();
  push(collapsedUnits);

  return ordered;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query) {
    return Response.json({ error: "Missing q parameter." }, { status: 400 });
  }

  const candidates = geocodeSearchCandidates(query);

  try {
    for (const q of candidates) {
      const params = new URLSearchParams({
        q,
        format: "jsonv2",
        limit: "3",
        addressdetails: "1",
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        {
          cache: "no-store",
          headers: {
            Accept: "application/json",
            /** Prefer English labels but allow local names in results for international queries */
            "Accept-Language": "en,zh-Hans,zh,ja,ko,es,fr,de",
            "User-Agent": "Food-Map/1.0",
          },
        },
      );

      if (!response.ok) {
        return Response.json({ error: "Geocoding failed." }, { status: 502 });
      }

      const results = (await response.json()) as NominatimSearchResult[];
      const wantChina = querySuggestsChinaRegion(query);
      const best = wantChina
        ? results.find(nominatimRowInChinaRegion) ?? null
        : results[0] ?? null;
      if (!best) continue;

      const lat = Number.parseFloat(best.lat);
      const lng = Number.parseFloat(best.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

      const city =
        best.address?.city ??
        best.address?.town ??
        best.address?.city_district ??
        best.address?.borough ??
        best.address?.suburb ??
        best.address?.village ??
        best.address?.municipality ??
        best.address?.quarter ??
        best.address?.neighbourhood ??
        best.address?.county ??
        "";
      const country = best.address?.country ?? "";
      const label =
        best.name?.trim() ||
        best.display_name?.split(",")[0]?.trim() ||
        query;

      return Response.json({
        result: {
          lat,
          lng,
          label,
          city,
          country,
          displayName: best.display_name ?? query,
        },
      });
    }

    return Response.json({ result: null });
  } catch {
    return Response.json({ error: "Geocoding failed." }, { status: 502 });
  }
}
