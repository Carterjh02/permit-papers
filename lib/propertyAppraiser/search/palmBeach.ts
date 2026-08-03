import { openBrowser, closeBrowser } from "../launchBrowser";
import { countySearchUrls } from "../counties";
import fs from "fs";
import path from "path";

function normalizePalmBeachAddress(address: string) {
  return address
    .toUpperCase()
    .replace(/\bDRIVE\b/g, "DR")
    .replace(/\bSTREET\b/g, "ST")
    .replace(/\bROAD\b/g, "RD")
    .replace(/\bAVENUE\b/g, "AVE")
    .replace(/\bBOULEVARD\b/g, "BLVD")
    .replace(/\bCOURT\b/g, "CT")
    .replace(/\bLANE\b/g, "LN")
    .replace(/\bTERRACE\b/g, "TER")
    .replace(/\bPLACE\b/g, "PL")
    .replace(/\bCIRCLE\b/g, "CIR")
    .trim();
}

export async function searchPalmBeach(
  address: string
): Promise<{ screenshot: Buffer; html: string }> {
  const { browser, page } = await openBrowser();

  try {
    const normalized = normalizePalmBeachAddress(address);

    await page.goto(countySearchUrls.palmBeach, { waitUntil: "networkidle" });
    await page.waitForSelector("#realsrchVal", { timeout: 15000 });
    await page.fill("#realsrchVal", normalized);

    // Palm Beach redirects after Enter
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle" }),
      page.keyboard.press("Enter"),
    ]);

    // Wait for the results table element to exist
    const tableExists = await page.$("#searchGrid");
    if (!tableExists) {
      const html = await page.content();
      const debugDir = path.join(process.cwd(), "debug");
      if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir);
      fs.writeFileSync(path.join(debugDir, "palmbeach-no-table.html"), html);
      throw new Error("Palm Beach: searchGrid table not found");
    }

    // Wait for DataTables to finish populating rows
    await page.waitForFunction(
      () => {
        const table = document.querySelector("#searchGrid");
        return table && table.querySelectorAll("tbody tr").length > 0;
      },
      { timeout: 30000 }
    );

    const rows = await page.$$("#searchGrid tbody tr");
    let parcelId: string | null = null;

    for (const row of rows) {
      const locationCell = await row.$("td:nth-child(3)");
      const locationText =
        (await locationCell?.innerText())?.trim().toUpperCase() ?? "";

      if (locationText.includes(normalized.split(" ")[0])) {
        const parcelCell = await row.$("td:nth-child(5)");
        parcelId = (await parcelCell?.innerText())?.trim() ?? null;
        break;
      }
    }

    if (!parcelId) {
      const html = await page.content();
      const debugDir = path.join(process.cwd(), "debug");
      if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir);
      fs.writeFileSync(path.join(debugDir, "palmbeach-no-match.html"), html);
      throw new Error("Palm Beach: No matching row found");
    }

    const detailsUrl = `https://pbcpao.gov/Property/Details?parcelId=${parcelId}`;
    await page.goto(detailsUrl, { waitUntil: "networkidle" });

    await page.waitForSelector("#MainContent_lblLocation", { timeout: 30000 });

    const html = await page.content();

    const debugDir = path.join(process.cwd(), "debug");
    if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir);
    fs.writeFileSync(path.join(debugDir, "palmbeach-html.html"), html);

    const screenshot = await page.screenshot({ fullPage: true });

    return { screenshot, html };
  } finally {
    await closeBrowser(browser);
  }
}
