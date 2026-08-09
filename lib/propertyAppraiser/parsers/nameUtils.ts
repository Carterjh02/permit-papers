/**
 * Normalize owner names for Broward + Palm Beach
 * Always returns: "First Last" or "First & First Last"
 */
export function normalizeOwnerNames(raw: string | string[]): string | undefined {
  if (!raw) return undefined;

  // Convert single string → array
  const names = Array.isArray(raw) ? raw : [raw];

  // ---------------------------
  // 1. Remove trust entries
  // ---------------------------
  const filtered = names.filter(n => {
    const upper = n.toUpperCase();
    return !upper.includes(" TR") && !upper.includes("TRUST");
  });

  if (filtered.length === 0) return undefined;

  // ---------------------------
  // 2. Normalize each name
  // ---------------------------
  const normalized = filtered.map(n => {
    let name = n.trim().replace(/\s+/g, " ");

    // Remove trailing commas
    name = name.replace(/,+$/, "");

    // Remove standalone one-letter fragments
    name = name
      .split(" ")
      .filter(part => part.length > 1)
      .join(" ");

    // Case: "LAST, FIRST MIDDLE"
    if (name.includes(",")) {
      const [last, rest] = name.split(",").map(s => s.trim());
      const first = rest.split(" ")[0]; // ignore middle names
      return `${first} ${last}`.trim();
    }

    // Case: "LAST FIRST MIDDLE"
    const parts = name.split(" ");
    if (parts.length >= 2) {
      const last = parts[0];
      const first = parts[1];
      return `${first} ${last}`.trim();
    }

    return name;
  });

  // ---------------------------
  // 3. Only keep first two names
  // ---------------------------
  const two = normalized.slice(0, 2);

  if (two.length === 1) return two[0];

  // ---------------------------
  // 4. Merge shared last names
  // ---------------------------
  const lastNames = two.map(n => n.split(" ").pop());
  const allSameLast = lastNames.every(l => l === lastNames[0]);

  if (allSameLast) {
    const last = lastNames[0];
    const firstNames = two.map(n => n.split(" ")[0]).join(" & ");
    return `${firstNames} ${last}`;
  }

  // ---------------------------
  // 5. Different last names → "First Last & First Last"
  // ---------------------------
  return two.join(" & ");
}
