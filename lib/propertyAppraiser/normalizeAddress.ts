export function normalizeAddress(address: string): string {
    if (!address) return "";
  
    let a = address.toLowerCase().trim();
  
    // Remove punctuation
    a = a.replace(/[.,]/g, "");
  
    // Collapse double spaces
    a = a.replace(/\s+/g, " ");
  
    // Common suffix replacements
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
      way: "wy",
    };
  
    for (const full in suffixes) {
      const abbr = suffixes[full];
      const regex = new RegExp(`\\b${full}\\b`, "gi");
      a = a.replace(regex, abbr);
    }
  
    return a;
  }
  