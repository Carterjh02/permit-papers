export function normalizeAddress(address: string): string {
  if (!address) return "";

  let a = address.toLowerCase().trim();

  // ---------------------------
  // Remove apartment / unit / building numbers
  // ---------------------------
  a = a
    .replace(/#\s*[\w-]+/gi, "")        // #204, #3B, #2-104
    .replace(/\bapt\s*[\w-]+/gi, "")    // apt 3b
    .replace(/\bunit\s*[\w-]+/gi, "")   // unit 7
    .replace(/\bbldg\s*[\w-]+/gi, "")   // bldg 2-104
    .replace(/\bflr\s*[\w-]+/gi, "")    // flr 3
    .replace(/\s{2,}/g, " ")            // collapse double spaces
    .trim();

  // ---------------------------
  // Remove punctuation
  // ---------------------------
  a = a.replace(/[.,]/g, "");

  // ---------------------------
  // Collapse double spaces again
  // ---------------------------
  a = a.replace(/\s+/g, " ");

  // ---------------------------
  // Street suffix normalization
  // ---------------------------
  const suffixes: Record<string, string> = {
    street: "st",
    stree: "st",
    avenue: "ave",
    boulevard: "blvd",
    road: "rd",
    drive: "dr",
    court: "ct",
    lane: "ln",
    terrace: "ter",
    place: "pl",
    circle: "cir",
    highway: "hwy",
  };

  for (const full in suffixes) {
    const abbr = suffixes[full];
    const regex = new RegExp(`\\b${full}\\b`, "gi");
    a = a.replace(regex, abbr);
  }

  return a.trim();
}
