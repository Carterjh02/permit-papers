import { parseBrowardPA } from "./parsers/broward";
import { parsePalmBeachPA } from "./parsers/palmBeach";
import type { ParsedPAData } from "./types";

export function parsePAData(ocrText: string, county: string): ParsedPAData {
  console.log("🔵 [PA_PARSE] COUNTY:", county);

  switch (county.toLowerCase()) {
    case "broward":
      return parseBrowardPA(ocrText);

    case "palmbeach":
      return parsePalmBeachPA(ocrText);

    default:
      throw new Error(`No parser implemented for county: ${county}`);
  }
}
