import type { PlaceCategory } from "./types";

/**
 * Category markers stay distinct on the map; chips are glass pills on dark chrome.
 */
export const CATEGORY_STYLES: Record<
  PlaceCategory,
  { label: string; chip: string; marker: string; ring: string }
> = {
  Food: {
    label: "Food",
    chip: "rounded-md border border-violet-400/40 bg-violet-950/70 px-2 py-0.5 text-[11px] font-semibold text-violet-100",
    marker: "#64748b",
    ring: "rgba(100, 116, 139, 0.22)",
  },
  Activities: {
    label: "Activities",
    chip: "rounded-md border border-cyan-400/40 bg-cyan-950/70 px-2 py-0.5 text-[11px] font-semibold text-cyan-100",
    marker: "#3b82f6",
    ring: "rgba(59, 130, 246, 0.24)",
  },
  Shopping: {
    label: "Shopping",
    chip: "rounded-md border border-amber-400/40 bg-amber-950/70 px-2 py-0.5 text-[11px] font-semibold text-amber-100",
    marker: "#d97706",
    ring: "rgba(217, 119, 6, 0.24)",
  },
};

/** Category pills on white modal / light surfaces (detail sheet). */
export const CATEGORY_CHIP_LIGHT: Record<PlaceCategory, string> = {
  Food: "rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-900",
  Activities:
    "rounded-md border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[11px] font-semibold text-cyan-900",
  Shopping:
    "rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-900",
};

export const ALL_CATEGORIES: PlaceCategory[] = [
  "Food",
  "Activities",
  "Shopping",
];
