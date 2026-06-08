/** Two-step browser confirms — both must be accepted. */

export function confirmDeletePlace(placeName: string): boolean {
  const first = window.confirm(
    `Remove “${placeName}” from your map? This cannot be undone.`,
  );
  if (!first) return false;
  return window.confirm(
    `Delete “${placeName}” permanently? Click OK only if you are sure.`,
  );
}

export function confirmDeleteAll(placeCount: number): boolean {
  if (placeCount <= 0) return false;
  const noun = placeCount === 1 ? "place" : "places";
  const first = window.confirm(
    `Delete all ${placeCount} saved ${noun}? This cannot be undone.`,
  );
  if (!first) return false;
  return window.confirm(
    `Final step: remove every place from this map (${placeCount} total)?`,
  );
}
