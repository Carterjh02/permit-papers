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
): Promise<{ screenshot: Buffer; html: string; sketchBuffer?: Buffer }> {
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

    // ---------------------------
    // TABLE OR DIRECT DETAILS?
    // ---------------------------
    const tableExists = await page.$("#searchGrid");

    let parcelId: string | null = null;

    if (!tableExists) {
      // Check if already on details page
      const detailsExists = await page.$("#MainContent_lblLocation");

      if (detailsExists) {
        const html = await page.content();
      
        /* const debugDir = path.join(process.cwd(), "debug");
        if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir);
        fs.writeFileSync(path.join(debugDir, "palmbeach-html.html"), html); */
      
        const screenshot = await page.screenshot({ fullPage: true });
      
        // ---------------------------
        // Capture Palm Beach sketch image
        // ---------------------------
        let sketchBuffer: Buffer | undefined;
      
        try {
          const sketchElement = await page.$('img[src*="GetBuildingSketch"]');
          if (sketchElement) {
            sketchBuffer = await sketchElement.screenshot();
            console.log("🟩 [PA_DEBUG] Palm Beach sketch image captured (direct page).");
          } else {
            console.warn("⚠️ [PA_DEBUG] Palm Beach sketch element not found (direct page).");
          }
        } catch (err) {
          console.error("❌ [PA_DEBUG] Palm Beach sketch capture failed:", err);
        }
      
        return { screenshot, html, sketchBuffer };
      }      

      // No table AND not on details page → error
      // const html = await page.content();
      /* const debugDir = path.join(process.cwd(), "debug");
      if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir);
      fs.writeFileSync(path.join(debugDir, "palmbeach-no-table.html"), html); */

      throw new Error("Palm Beach: searchGrid table not found");
    }

    // ---------------------------
    // TABLE EXISTS → WAIT FOR ROWS
    // ---------------------------
    await page.waitForFunction(
      () => {
        const table = document.querySelector("#searchGrid");
        return table && table.querySelectorAll("tbody tr").length > 0;
      },
      { timeout: 30000 }
    );

    const rows = await page.$$("#searchGrid tbody tr");

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

      // const html = await page.content();
      /* const debugDir = path.join(process.cwd(), "debug");
      if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir);
      fs.writeFileSync(path.join(debugDir, "palmbeach-no-match.html"), html); */

      throw new Error("Palm Beach: No matching row found");
    }

    // ---------------------------
    // LOAD DETAILS PAGE
    // ---------------------------
    const detailsUrl = `https://pbcpao.gov/Property/Details?parcelId=${parcelId}`;
    await page.goto(detailsUrl, { waitUntil: "networkidle" });

    await page.waitForSelector("#MainContent_lblLocation", { timeout: 30000 });

    const html = await page.content();

    const debugDir = path.join(process.cwd(), "debug");
    if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir);
    fs.writeFileSync(path.join(debugDir, "palmbeach-html.html"), html);

    const screenshot = await page.screenshot({ fullPage: true });

    // ---------------------------
    // Capture Palm Beach sketch image
    // ---------------------------
    let sketchBuffer: Buffer | undefined;

    try {
      // Find the sketch <img> element on the details page
      const sketchElement = await page.$('img[src*="/Property/GetBuildingSketch"]');
      if (sketchElement) {
        sketchBuffer = await sketchElement.screenshot();
        console.log("🟩 [PA_DEBUG] Palm Beach sketch image captured from results page.");
      } else {
        console.warn("⚠️ [PA_DEBUG] Palm Beach sketch element not found on results page.");
      }
    } catch (err) {
      console.error("❌ [PA_DEBUG] Palm Beach sketch capture failed:", err);
    }

    return { screenshot, html, sketchBuffer };
  } finally {
    await closeBrowser(browser);
  }
}
