import type { ParsedPAData } from "../types";
import { normalizeOwnerNames } from "./nameUtils";

export function parseBrowardPA(html: string): ParsedPAData {
  const data: ParsedPAData = {};

  // ---------------------------
  // FOLIO NUMBER
  // ---------------------------
  const folioMatch = html.match(/getParcelInfo\(&quot;(\d{12})&quot;/);
  if (folioMatch) {
    data.folio = folioMatch[1];
  }

  // ---------------------------
  // OWNER NAME
  // ---------------------------
  const ownerMatch = html.match(/<td><div>([A-Z ,]+)<\/div><\/td>/i);
  if (ownerMatch) {
    data.ownerName = normalizeOwnerNames(ownerMatch[1]);
  }
  
  // ---------------------------
  // SITE ADDRESS
  // ---------------------------
  const addressMatch = html.match(
    /<td class="mblhide"><div>([\dA-Z\s,]+FL\s*\d{5}(?:-\d{4})?)<\/div>/i
  );
  if (addressMatch) {
    const fullAddress = addressMatch[1].replace(/\s+/g, " ").trim();
    data.siteAddress = fullAddress;

    // Street
    data.street = fullAddress.split(",")[0].trim();

    // ZIP
    const zipMatch = fullAddress.match(/\b\d{5}(?:-\d{4})?\b/);
    if (zipMatch) data.zip = zipMatch[0];

    // City
    const cityMatch = fullAddress.match(/([A-Z\s]+),\s*FL/i);
    if (cityMatch) data.city = cityMatch[1].trim();
  }

  // ---------------------------
  // LEGAL DESCRIPTION
  // ---------------------------
  const legalMatch = html.match(
    /<div id="legalDescId"[^>]*>([^<]+)<\/div>/i
  );
  
  if (legalMatch) {
    data.legalDescription = legalMatch[1].replace(/\s+/g, " ").trim();
  }

  return data;
}
