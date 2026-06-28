export interface ParsedLegalDescription {
  lot: string | null;
  block: string | null;
  building: string | null;
  unit: string | null;
  tract: string | null;
  parcel: string | null;
  section: string | null;
  township: string | null;
  range: string | null;
  folio: string | null;
}

export function parseLegalDescription(input: string): ParsedLegalDescription {
  const text = input.toUpperCase();

  const lot = matchValue(text, /\b(LOT|LT|L|LOT#|LT#|L#)\b\s*([A-Z0-9\-]+)/);
  const block = matchValue(text, /\b(BLOCK|BLK|BK|BLOCK#|BLK#|BK#)\b\s*([A-Z0-9\-]+)/);
  const building = matchValue(text, /\b(BUILDING|BLDG|BLD|BLDG#|BLD#)\b\s*([A-Z0-9\-]+)/);
  const unit = matchValue(text, /\b(UNIT|UN|U|UNIT#|UN#|U#)\b\s*([A-Z0-9\-]+)/);
  const tract = matchValue(text, /\b(TRACT|TR|TRACT#|TR#)\b\s*([A-Z0-9\-]+)/);
  const parcel = matchValue(text, /\b(PARCEL|PAR|PARCEL#|PAR#)\b\s*([A-Z0-9\-]+)/);
  const section = matchValue(text, /\b(SEC)\b\s*([A-Z0-9\-]+)/);
  const township = matchValue(text, /\b(TWP)\b\s*([A-Z0-9\-]+)/);
  const range = matchValue(text, /\b(RNG)\b\s*([A-Z0-9\-]+)/);
  const folio = matchValue(
    text,
    /\b(FOLIO|FOL|PARCEL ID|PID)\b\s*([A-Z0-9\-]+)/
  );

  return {
    lot,
    block,
    building,
    unit,
    tract,
    parcel,
    section,
    township,
    range,
    folio,
  };
}

function matchValue(text: string, regex: RegExp): string | null {
  const m = text.match(regex);
  if (!m) return null;
  return m[2] ?? null;
}
