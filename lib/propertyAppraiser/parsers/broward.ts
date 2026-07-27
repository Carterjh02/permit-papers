import { countyCities } from "../cityDictionary";
import type { ParsedPAData } from "../types";

export function parseBrowardPA(ocrText: string): ParsedPAData {
  const data: ParsedPAData = {};
  const text = ocrText.replace(/\s+/g, " ").trim();

  // ---------------------------
  // OWNER NAME (line BEFORE Owner(s):)
  // ---------------------------
  const ownerBlock = text.match(/([A-Z ,&]+)\s+Owner\(s\):/i);
  console.log("🔵 [BROWARD_OWNER_MATCH]:", ownerBlock);
  if (ownerBlock) {
    const rawOwner = ownerBlock[1].trim();
    const owners = rawOwner.split(/\s*&\s*|\s+AND\s+/i).map((o) => {
      const parts = o.split(",").map((p) => p.trim());
      return parts.length === 2 ? `${parts[1]} ${parts[0]}` : o;
    });
    data.ownerName = owners.join(" & ");
  }

  // ---------------------------
  // PROPERTY ADDRESS
  // ---------------------------
  // Find the "Property" → "Address:" block
  const propertyBlock = text.match(/Property\s+([A-Z0-9 .,-]+?)\s+Address:/i);
  console.log("🔵 [BROWARD_PROPERTY_BLOCK]:", propertyBlock);

  if (propertyBlock) {
    // This is the real site address
    let fullAddress = propertyBlock[1].trim();

    // Remove trailing junk like "Neighborhood ..."
    fullAddress = fullAddress.replace(/\bNeighborhood\b.*$/i, "").trim();

    data.siteAddress = fullAddress;

    // Extract ZIP
    const zipMatch = fullAddress.match(/(\d{5})$/);
    if (zipMatch) data.zip = zipMatch[1];

    // Remove ZIP for slicing
    let withoutZip = fullAddress.replace(/\s*\d{5}$/, "").trim();

    // Remove trailing comma
    withoutZip = withoutZip.replace(/,\s*$/, "").trim();

    // Detect city from dictionary
    const cities = countyCities["broward"];
    const upper = withoutZip.toUpperCase();
    const foundCity = cities.find((city) =>
      upper.endsWith(city.toUpperCase())
    );

    if (foundCity) {
      data.city = foundCity;

      const street = withoutZip.slice(
        0,
        withoutZip.length - foundCity.length
      ).trim();

      data.street = street.replace(/,\s*$/, "").trim();
    } else {
      const parts = withoutZip.split(",");
      data.street = parts[0].trim();
      data.city = parts[1]?.trim() || "";
    }
  }

  // ---------------------------
  // MAILING ADDRESS
  // ---------------------------
  const mailingMatch = text.match(/Mailing\s+Address:\s*([A-Z0-9 .,-]+)/i);
  console.log("🔵 [BROWARD_MAILING_MATCH]:", mailingMatch);
  if (mailingMatch) {
    data.mailingAddress = mailingMatch[1].trim();
  }

  // ---------------------------
  // FOLIO / PROPERTY ID
  // ---------------------------
  const folioMatch = text.match(/Property\s+ID:\s*(?:Property\s*)?(\d{12})/i);
  console.log("🔵 [BROWARD_FOLIO_MATCH]:", folioMatch);
  if (folioMatch) {
    data.folio = folioMatch[1].trim();
  }

  // ---------------------------
  // LEGAL DESCRIPTION
  // ---------------------------
  const legalMatch = text.match(
    /Abbr\.?\s*Legal\s*Des\.?:\s*([A-Z0-9 \-]+?(?:LOT|BLK)[A-Z0-9 \-]+)/i
  );
  console.log("🔵 [BROWARD_LEGAL_MATCH]:", legalMatch);
  
  if (legalMatch) {
    let legal = legalMatch[1].trim();
  
    // Remove the "If you see a factual error..." tail
    legal = legal.replace(/If you see a factual error.*$/i, "").trim();
  
    // Remove anything after "Next Parcel" if OCR merges blocks
    legal = legal.replace(/Next Parcel.*/i, "").trim();
  
    data.legalDescription = legal;
  }

  console.log("🔵 [BROWARD_PARSED]:", data);
  return data;
}
