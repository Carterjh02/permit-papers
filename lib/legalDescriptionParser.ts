// lib/legalDescriptionParser.ts

export type ParsedLegal = {
  lotNumber: string | null;
  blockNumber: string | null;
  subdivision: string | null;
  buildingNumber: string | null;
  unitNumber: string | null;
};

export function parseLegalDescription(input: string | null): ParsedLegal {
  if (!input) {
    return {
      lotNumber: null,
      blockNumber: null,
      subdivision: null,
      buildingNumber: null,
      unitNumber: null,
    };
  }

  const text = input.toUpperCase();

  // Strict patterns — only match when clearly formatted
  const lotPattern = /\b(?:LOT|LT|L)\s*([A-Z0-9\-]+)/;
  const blockPattern = /\b(?:BLOCK|BLK|BK)\s*([A-Z0-9\-]+)/;
  const subdivisionPattern = /\b(?:SUBDIVISION|SUBDIV|SUBD)\s*([A-Z0-9\s\-]+)/;
  const buildingPattern = /\b(?:BLDG|BLD|BUILDING)\s*([A-Z0-9\-]+)/;
  const unitPattern = /\b(?:UNIT|UN|APT)\s*([A-Z0-9\-]+)/;

  const lotMatch = text.match(lotPattern);
  const blockMatch = text.match(blockPattern);
  const subdivisionMatch = text.match(subdivisionPattern);
  const buildingMatch = text.match(buildingPattern);
  const unitMatch = text.match(unitPattern);

  return {
    lotNumber: lotMatch ? lotMatch[1] : null,
    blockNumber: blockMatch ? blockMatch[1] : null,
    subdivision: subdivisionMatch ? subdivisionMatch[1].trim() : null,
    buildingNumber: buildingMatch ? buildingMatch[1] : null,
    unitNumber: unitMatch ? unitMatch[1] : null,
  };
}
