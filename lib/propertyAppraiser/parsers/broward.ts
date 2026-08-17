import type { ParsedPAData } from "../types";
import { normalizeOwnerNames } from "./nameUtils";

export function parseBrowardPA(html: string): ParsedPAData {
  const data: ParsedPAData = {};

  // ---------------------------
  // FOLIO NUMBER
  // ---------------------------
  const folioMatch = html.match(/<div id="folioNumberId">.*?>(\d{12})<\/a>/i);
  if (folioMatch) {
    data.folio = folioMatch[1].trim();
  }

  // ---------------------------
  // OWNER NAME (multi-owner support)
  // ---------------------------
  const ownerMatches = html.matchAll(/<div id="ownerName(Id|2Id)">([^<]+)<\/div>/gi);
  const owners = Array.from(ownerMatches, m => m[2].replace(/&amp;/gi, "&").trim());
  
  if (owners.length > 0) {
    data.ownerName = normalizeOwnerNames(owners);
  }
  
  // ---------------------------
  // SITE ADDRESS (deterministic slicing + unit support)
  // ---------------------------
  const addressMatch = html.match(/<div id="situsAddressId">.*?>([^<]+)<\/a>/i);
  if (addressMatch) {
    const fullAddress = addressMatch[1].replace(/\s+/g, " ").trim();
    data.siteAddress = fullAddress;
  
    // Dictionary of street suffixes
    const suffixes = [
      "STREET", "ST", "AVENUE", "AVE", "BOULEVARD", "BLVD",
      "ROAD", "RD", "DRIVE", "DR", "COURT", "CT",
      "LANE", "LN", "TERRACE", "TER", "PLACE", "PL",
      "CIRCLE", "CIR", "HIGHWAY", "HWY", "WAY", "WY"
    ];
  
    // Find which suffix appears in the address
    const suffixRegex = new RegExp(`\\b(${suffixes.join("|")})\\b`, "i");
    const suffixMatch = fullAddress.match(suffixRegex);
  
    if (suffixMatch) {
      const suffix = suffixMatch[1];
      let idx = fullAddress.indexOf(suffix) + suffix.length;
  
      // Check for unit markers immediately after suffix
      const remainderAfterSuffix = fullAddress.slice(idx).trim();
      const unitRegex = /^(#\s*\d+|UNIT\s*\d+|APT\s*\d+|BLDG\s*\d+)/i;
      const unitMatch = remainderAfterSuffix.match(unitRegex);
  
      if (unitMatch) {
        // Extend street to include unit portion
        idx += unitMatch[0].length + 1; // +1 for space
      }
  
      // STREET (including unit if present)
      data.street = fullAddress.slice(0, idx).trim();
  
      // Remaining portion after street
      const remainder = fullAddress.slice(idx).trim();
  
      // CITY = everything before comma
      const cityMatch = remainder.match(/^(.+?),/);
      if (cityMatch) {
        data.city = cityMatch[1].trim();
      }
  
      // ZIP = everything after comma → first 5 digits only
      const zipMatch = remainder.match(/,?\s*(\d{5})/);
      if (zipMatch) {
        data.zip = zipMatch[1];
      }
    }
  }  

  // ---------------------------
  // LEGAL DESCRIPTION (with AKA support)
  // ---------------------------
  const legalMatch = html.match(/<div id="legalDescId"[^>]*>([^<]+)<\/div>/i);
  if (legalMatch) {
    const rawLegal = legalMatch[1].replace(/\s+/g, " ").trim();
  
    // If AKA exists, extract everything after it
    const akaIndex = rawLegal.toUpperCase().indexOf("AKA:");
    if (akaIndex !== -1) {
      // Extract text after AKA:
      const akaText = rawLegal.slice(akaIndex + 4).trim(); // skip "AKA:"
      data.legalDescription = akaText;
    } else {
      // Fallback to full legal description
      data.legalDescription = rawLegal;
    }
  }  

  // ---------------------------
  // PROPERTY IMAGE (Sketch)
  // ---------------------------
  const imageMatch = html.match(/<img[^>]+src="([^"]+Photographs[^"]+)"/i);
  if (imageMatch) {
    data.imageUrl = imageMatch[1].trim();
  }

  console.log("🟦 [PA_DEBUG:BROWARD_PARSED]", {
    ownerName: data.ownerName,
    siteAddress: data.siteAddress,
    street: data.street,
    city: data.city,
    zip: data.zip,
    legalDescription: data.legalDescription,
    folio: data.folio,
    imageUrl: data.imageUrl,
  });

  return data;
}
