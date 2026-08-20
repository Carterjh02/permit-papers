import type { ParsedPAData } from "../types";
import { normalizeOwnerNames } from "./nameUtils";

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

  /* ---------------------------------------------------------
     EXTRACT JSON MODEL (more robust)
  --------------------------------------------------------- */
  const modelMatch = html.match(/var\s+model\s*=\s*(\{[\s\S]*?\});/i);
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

  const pd = model.propertyDetail || {};
  const owners = model.ownerInfo || [];

  /* ---------------------------------------------------------
     OWNER NAME (clean + normalize)
  --------------------------------------------------------- */

  // 1. Clean raw Palm Beach owner strings
  let cleanedOwners = owners
    .map((o) => o.replace(/&/g, "").trim())
    .filter((o) => o.length > 0);

  // 2. Palm Beach sometimes returns 3+ owners; keep only first two
  if (cleanedOwners.length > 2) {
    cleanedOwners = cleanedOwners.slice(0, 2);
  }

  // 3. Branch: single-owner vs multi-owner
  if (cleanedOwners.length === 1) {
    const parts = cleanedOwners[0].split(/\s+/);

    if (parts.length === 2) {
      // Case: LAST FIRST
      const last = parts[0];
      const first = parts[1];
      data.ownerName = `${first} ${last}`.trim();
    } else if (parts.length >= 3) {
      const last = parts[0];
      const second = parts[1];
      const tail = parts[parts.length - 1];

      // If tail is a single letter → middle initial → ignore it
      if (/^[A-Z]$/i.test(tail)) {
        data.ownerName = `${second} ${last}`.trim();
      } else {
        // Tail is a full name → treat tail as FIRST NAME
        data.ownerName = `${last} ${tail}`.trim();
      }
    } else {
      data.ownerName = cleanedOwners[0];
    }
  } else if (cleanedOwners.length > 1) {
    data.ownerName = normalizeOwnerNames(cleanedOwners);
  }

  /* ---------------------------------------------------------
     ADDRESS EXTRACTION
  --------------------------------------------------------- */
  const line1 = pd.AddressLine1?.trim();
  const line3 = pd.AddressLine3?.trim();

  data.siteAddress = line1;
  data.street = line1;

  let mailingCity: string | undefined;
  let mailingZip: string | undefined;

  if (line3) {
    const parts = line3.split(/\s+/);

    // ZIP = first 5 digits found
    const zipSegment = parts.find((p) => /\d{5}/.test(p)) || "";
    const zipMatch = zipSegment.match(/\d{5}/);
    mailingZip = zipMatch ? zipMatch[0] : undefined;

    // City = everything before "FL"
    const flIndex = parts.indexOf("FL");
    if (flIndex > 0) {
      mailingCity = parts.slice(0, flIndex).join(" ");
    }
  }

  /* ---------------------------------------------------------
     PARTIAL MATCH RULE
  --------------------------------------------------------- */
  function normalize(s: string): string {
    return s.replace(/\s+/g, " ").trim().toUpperCase();
  }

  const searchedStreet = normalize(line1 || "");
  const mailingStreet = normalize(pd.AddressLine1 || "");

  if (searchedStreet && mailingStreet.includes(searchedStreet)) {
    data.city = mailingCity;
    data.zip = mailingZip;
  }

  /* ---------------------------------------------------------
     FOLIO / PARCEL ID
  --------------------------------------------------------- */
  if (pd.FormattedPCN) {
    data.folio = pd.FormattedPCN.trim();
  }

  /* ---------------------------------------------------------
     LEGAL DESCRIPTION
  --------------------------------------------------------- */
  if (pd.LegalDesc) {
    data.legalDescription = pd.LegalDesc.replace(/\s+/g, " ").trim();
  }

  return data;
}
