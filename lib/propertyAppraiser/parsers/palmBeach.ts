import type { ParsedPAData } from "../types";

/**
 * Types for the Palm Beach JSON model
 */
interface PalmBeachModel {
  propertyDetail: {
    AddressLine1?: string;
    AddressLine3?: string;
    FormattedPCN?: string;
    LegalDesc?: string;
  };
  ownerInfo?: string[];
}

/**
 * Parse Palm Beach Property Appraiser HTML using embedded JSON model
 */
export function parsePalmBeachPA(html: string): ParsedPAData {
  const data: ParsedPAData = {};

  // ---------------------------
  // EXTRACT JSON MODEL
  // ---------------------------
  const modelMatch = html.match(/var\s+model\s*=\s*(\{.*?\});/);
  if (!modelMatch) {
    console.log("❌ PalmBeach: JSON model not found");
    return data;
  }

  let model: PalmBeachModel;
  try {
    model = JSON.parse(modelMatch[1]);
  } catch (err) {
    console.log("❌ PalmBeach: Failed to parse JSON model", err);
    return data;
  }

  const pd = model.propertyDetail;
  const owners = model.ownerInfo || [];

  // ---------------------------
  // OWNER NAME (smart formatting)
  // ---------------------------
  function formatOwnerName(name: string): string {
    name = name.replace(/&/g, "").trim(); // remove trailing ampersands

    // Case 1: "LAST, FIRST M"
    if (name.includes(",")) {
      const [last, first] = name.split(",").map((s: string) => s.trim());
      return `${first} ${last}`.trim();
    }

    // Case 2: "LAST FIRST" → "FIRST LAST"
    const parts = name.split(" ").filter(Boolean);
    if (parts.length === 2) {
      const [last, first] = parts;
      return `${first} ${last}`.trim();
    }

    // Case 3: Multi‑word last names or trusts → leave as-is
    return name.trim();
  }

  const formattedOwners = owners.map((o: string) => formatOwnerName(o));

  // If all share same last name → merge into "First & First Last"
  if (formattedOwners.length > 1) {
    const lastNames = formattedOwners.map(
      (n: string) => n.split(" ").pop() || ""
    );
    const allSameLast = lastNames.every(
      (l: string) => l === lastNames[0]
    );

    if (allSameLast) {
      const last = lastNames[0];
      const firstNames = formattedOwners
        .map((n: string) => n.split(" ")[0])
        .join(" & ");
      data.ownerName = `${firstNames} ${last}`.trim();
    } else {
      data.ownerName = formattedOwners.join(" & ").trim();
    }
  } else {
    data.ownerName = formattedOwners[0] || undefined;
  }

  // ---------------------------
  // ADDRESS EXTRACTION
  // ---------------------------
  const line1 = pd.AddressLine1?.trim(); // street
  const line3 = pd.AddressLine3?.trim(); // city + state + zip

  data.siteAddress = line1;
  data.street = line1;

  // Parse city + state + zip from AddressLine3
  let mailingCity: string | undefined = undefined;
  let mailingZip: string | undefined = undefined;

  if (line3) {
    const parts = line3.split(/\s+/);

    // ZIP is always first 5 digits
    const zipSegment = parts.find((p: string) => /\d{5}/.test(p)) || "";
    const zipMatch = zipSegment.match(/\d{5}/);
    mailingZip = zipMatch ? zipMatch[0] : undefined;

    // City is everything before the state (FL)
    const flIndex = parts.indexOf("FL");
    if (flIndex > 0) {
      mailingCity = parts.slice(0, flIndex).join(" ");
    }
  }

  // ---------------------------
  // PARTIAL MATCH RULE
  // ---------------------------
  function normalize(s: string): string {
    return s.replace(/\s+/g, " ").trim().toUpperCase();
  }

  const searchedStreet = normalize(line1 || "");
  const mailingStreet = normalize(pd.AddressLine1 || "");

  // If street number + name match → use mailing city + ZIP
  if (searchedStreet && mailingStreet.includes(searchedStreet)) {
    data.city = mailingCity;
    data.zip = mailingZip;
  }

  // ---------------------------
  // FOLIO / PARCEL ID
  // ---------------------------
  if (pd.FormattedPCN) {
    data.folio = pd.FormattedPCN.replace(/-/g, "").trim();
  }

  // ---------------------------
  // LEGAL DESCRIPTION
  // ---------------------------
  if (pd.LegalDesc) {
    data.legalDescription = pd.LegalDesc.replace(/\s+/g, " ").trim();
  }

  return data;
}
