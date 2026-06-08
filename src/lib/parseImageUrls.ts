/** Split pasted URLs from commas or newlines; trim and drop empties. */
export function parseImageUrls(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
