// Dictionary of known abbreviations and expansions
export const CITY_ABBREVIATIONS: Record<string, string> = {
  ft: "fort",
  "ft.": "fort",
  st: "saint",
  "st.": "saint",
  mt: "mount",
  "mt.": "mount",
  spr: "springs",
  "spr.": "springs",
};

// Normalize a city name for consistent matching
export function normalizeCityName(input: string): string {
  if (!input) return "";

  // Lowercase + remove punctuation
  const clean = input
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // remove punctuation
    .trim();

  // Split into words
  const words = clean.split(/\s+/);

  // Expand abbreviations
  const expanded = words.map((word) => {
    return CITY_ABBREVIATIONS[word] || word;
  });

  return expanded.join(" ").trim();
}