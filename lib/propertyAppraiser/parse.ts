import { parseBrowardPA } from "./parsers/broward";

export function parsePAData(ocrText: string, county: string) {
  console.log("🔵 [PA_PARSE] COUNTY:", county);
  switch (county) {
    case "broward":
      return parseBrowardPA(ocrText);

    default:
      throw new Error(`No parser implemented for county: ${county}`);
  }
}
