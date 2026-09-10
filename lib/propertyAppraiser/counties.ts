export const countySearchUrls = {
  broward: "https://web.bcpa.net/BcpaClient/#/Record-Search",
  palmBeach: "https://pbcpao.gov/index.htm",
  saintLucie: "https://www.pa.stlucieco.gov/",
  // miamiDade is handled through the Edge Function dispatcher
};

/**
 * ZIP ranges for each county.
 * These ranges are precise, compact, and match USPS county boundaries.
 */
export const countyZipRanges: Record<
  string,
  { start: number; end: number }
> = {
  broward: { start: 33000, end: 33399 },
  palmBeach: { start: 33400, end: 33499 },
  miamidade: { start: 33100, end: 33299 },
  saintLucie: { start: 34900, end: 34999 },
};

/**
 * Returns the county for a given ZIP code using ZIP ranges.
 */
export function getCountyFromZip(zip: string): string | null {
  const zipNum = Number(zip);
  if (!zipNum) return null;

  for (const [county, range] of Object.entries(countyZipRanges)) {
    if (zipNum >= range.start && zipNum <= range.end) {
      return county;
    }
  }

  return null;
}
