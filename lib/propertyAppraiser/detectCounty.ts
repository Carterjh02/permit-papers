import { getCountyFromZip } from "./counties";

export function detectCounty(input: {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  folio?: string;
  subdivision?: string;
  county?: string;
}) {
  const city = (input.city || "").toLowerCase();
  const zip = (input.zip || "").replace(/\D/g, "");
  const countyHint = (input.county || "").toLowerCase();
  const subdivision = (input.subdivision || "").toLowerCase();

  // explicit county field wins
  if (countyHint.includes("broward")) return "broward";
  if (countyHint.includes("palm")) return "palmBeach";
  if (countyHint.includes("lucie")) return "saintLucie";
  if (countyHint.includes("dade") || countyHint.includes("miami"))
    return "miamidade";

  // subdivision hints
  if (
    subdivision.includes("davie") ||
    subdivision.includes("fort lauderdale") ||
    subdivision.includes("hollywood")
  )
    return "broward";

  if (
    subdivision.includes("west palm") ||
    subdivision.includes("boynton") ||
    subdivision.includes("delray")
  )
    return "palmBeach";

  if (
    subdivision.includes("port st lucie") ||
    subdivision.includes("fort pierce")
  )
    return "saintLucie";

  if (
    subdivision.includes("miami") ||
    subdivision.includes("hialeah") ||
    subdivision.includes("doral") ||
    subdivision.includes("kendall")
  )
    return "miamidade";

  // city name detection
  if (
    city.includes("davie") ||
    city.includes("fort lauderdale") ||
    city.includes("hollywood")
  )
    return "broward";

  if (
    city.includes("west palm") ||
    city.includes("boynton") ||
    city.includes("delray")
  )
    return "palmBeach";

  if (
    city.includes("port st lucie") ||
    city.includes("fort pierce")
  )
    return "saintLucie";

  if (
    city.includes("miami") ||
    city.includes("hialeah") ||
    city.includes("doral") ||
    city.includes("kendall") ||
    city.includes("homestead") ||
    city.includes("aventura") ||
    city.includes("coral gables")
  )
    return "miamidade";

  // ZIP detection (new logic)
  const zipCounty = getCountyFromZip(zip);
  if (zipCounty) return zipCounty;

  return null;
}
