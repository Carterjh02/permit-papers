export const countySearchUrls = {
    broward: "https://web.bcpa.net/BcpaClient/#/Record-Search",
    palmBeach: "https://www.pbcgov.com/papa/",
    saintLucie: "https://www.pa.stlucieco.gov/",
    // add more counties here
  };
  
  export const zipToCounty: Record<string, string> = {
    "33063": "broward",
    "33433": "palmBeach",
    "33101": "miamiDade",
    // add more zip → county mappings
  };
  
  export function getCountyFromZip(zip: string): string | null {
    return zipToCounty[zip] ?? null;
  }