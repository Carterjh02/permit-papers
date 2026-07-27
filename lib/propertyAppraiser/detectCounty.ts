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

  // ZIP‑code ranges
  const zipNum = Number(zip);

  if (zipNum >= 33000 && zipNum <= 33399) return "broward";
  if (zipNum >= 33400 && zipNum <= 33499) return "palmBeach";
  if (zipNum >= 34900 && zipNum <= 34999) return "saintLucie";

  return null;
}
