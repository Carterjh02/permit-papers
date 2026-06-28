import { ExtractedInfo, ExtractedInfoSchema } from "@/lib/types/ocr";

/**
 * Stage 1: labeled parsing (high confidence)
 * Stage 2: fallback parsing (medium/low confidence)
 */
export function parseCustomerInfo(text: string): ExtractedInfo {
  const cleaned = text.replace(/\r/g, "").trim();

  // -------------------------------
  // Stage 1 — labeled extraction
  // -------------------------------
  const matchField = (labels: string[]): string | undefined => {
    const pattern = new RegExp(`(?:${labels.join("|")}):?\\s*(.+)`, "i");
    return cleaned.match(pattern)?.[1]?.trim();
  };

  const name = matchField(["Name", "Customer Name", "Owner"]);
  const address = matchField(["Address", "Street", "Street Address"]);
  const city = matchField(["City", "Town"]);
  const state = matchField(["State", "ST"]);
  const zip = matchField(["Zip", "ZIP", "Postal Code"]);
  const folio = matchField(["Folio", "Folio Number", "Parcel"]);
  const subdivision = matchField(["Subdivision", "Sub-Division", "Community"]);

  // Confidence for labeled matches
  const labeledConfidence = (value: string | undefined) =>
    value ? 0.95 : 0;

  const labeledHitCount = [name, address, city, state, zip].filter(Boolean).length;

  if (labeledHitCount >= 3) {
    return ExtractedInfoSchema.parse({
      name,
      nameConfidence: labeledConfidence(name),

      address,
      addressConfidence: labeledConfidence(address),

      city,
      cityConfidence: labeledConfidence(city),

      state,
      stateConfidence: labeledConfidence(state),

      zip,
      zipConfidence: labeledConfidence(zip),

      folio,
      folioConfidence: labeledConfidence(folio),

      subdivision,
      subdivisionConfidence: labeledConfidence(subdivision),

      rawText: cleaned,
    });
  }

  // -------------------------------
  // Stage 2 — fallback parsing
  // -------------------------------
  let fallbackName = name;
  let fallbackAddress = address;
  let fallbackCity = city;
  let fallbackState = state;
  let fallbackZip = zip;

  let nameConf = labeledConfidence(name);
  let addressConf = labeledConfidence(address);
  let cityConf = labeledConfidence(city);
  let stateConf = labeledConfidence(state);
  let zipConf = labeledConfidence(zip);

  const lines = cleaned
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Heuristic: first line is often the name
  if (!fallbackName && lines.length > 0 && lines[0].split(" ").length <= 4) {
    fallbackName = lines[0];
    nameConf = 0.6;
  }

  // Find ZIP line
  const zipLine = lines.find((l) => /\b\d{5}(?:-\d{4})?\b/.test(l));
  if (zipLine) {
    const zipMatch = zipLine.match(/\b\d{5}(?:-\d{4})?\b/);
    if (zipMatch) {
      fallbackZip = zipMatch[0];
      zipConf = 0.7;
    }

    const parts = zipLine.split(/\s+/);
    if (parts.length >= 3) {
      if (!fallbackState) {
        fallbackState = parts[parts.length - 2];
        stateConf = 0.6;
      }
      if (!fallbackCity) {
        fallbackCity = parts.slice(0, parts.length - 2).join(" ");
        cityConf = 0.6;
      }
    }
  }

  // Address is usually the line before ZIP
  if (!fallbackAddress && zipLine) {
    const idx = lines.indexOf(zipLine);
    if (idx > 0) {
      fallbackAddress = lines[idx - 1];
      addressConf = 0.6;
    }
  }

  // -------------------------------
  // Final assembly
  // -------------------------------
  const result = {
    name: fallbackName,
    nameConfidence: nameConf,

    address: fallbackAddress,
    addressConfidence: addressConf,

    city: fallbackCity,
    cityConfidence: cityConf,

    state: fallbackState,
    stateConfidence: stateConf,

    zip: fallbackZip,
    zipConfidence: zipConf,

    folio,
    folioConfidence: labeledConfidence(folio),

    subdivision,
    subdivisionConfidence: labeledConfidence(subdivision),

    rawText: cleaned,
  };

  return ExtractedInfoSchema.parse(result);
}
