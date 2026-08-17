import { openBrowser, closeBrowser } from "../launchBrowser";
import { countySearchUrls } from "../counties";
// import fs from "fs";
// import path from "path";

export async function searchBroward(address: string): Promise<{
  html: string;
  screenshot: Buffer;
  sketchBuffer?: Buffer;
}> {
  const { browser, page } = await openBrowser();

  try {
    await page.goto(countySearchUrls.broward, { waitUntil: "domcontentloaded" });

    await page.waitForSelector("#txtField", { timeout: 15000 });
    await page.fill("#txtField", address);
    console.log("🟦 [PA_DEBUG] Broward: Received address:", address);

    await page.click("#searchButton");
    await page.waitForTimeout(5000);

    // Extract full rendered DOM
    const html = await page.evaluate(() => document.documentElement.outerHTML);

    /* const debugDir = path.join(process.cwd(), "debug");
    if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir);
    const debugPath = path.join(debugDir, "broward-html.html");
    fs.writeFileSync(debugPath, html); */ 

    const screenshot = await page.screenshot({ fullPage: true });

    // ---------------------------
    // Extract folio number
    // ---------------------------
    const folioMatch = html.match(/<div id="folioNumberId">.*?>(\d{12})<\/a>/i);
    let sketchBuffer: Buffer | undefined;

    if (folioMatch) {
      const folio = folioMatch[1].trim();
      console.log("🟦 [PA_DEBUG] Broward folio extracted:", folio);

      // ---------------------------
      // Build and capture sketch image
      // ---------------------------
      const sketchUrl = `https://web.bcpa.net/RecPatriotSketch.asp?Folio=${folio}&cpt=`;
      console.log("🟦 [PA_DEBUG] Broward sketch URL:", sketchUrl);

      try {
        await page.goto(sketchUrl, { waitUntil: "domcontentloaded" });

        // Wait for the sketch image or canvas to load
        await page.waitForSelector("img, canvas", { timeout: 10000 });

        // Capture only the sketch element
        const sketchElement = await page.$("img, canvas");
        if (sketchElement) {
          sketchBuffer = await sketchElement.screenshot();
          console.log("🟩 [PA_DEBUG] Broward sketch image captured from viewer.");
        } else {
          console.warn("⚠️ [PA_DEBUG] Sketch element not found on viewer page.");
        }
      } catch (err) {
        console.error("❌ [PA_DEBUG] Broward sketch capture failed:", err);
      }
    } else {
      console.log("❌ [PA_DEBUG] Broward folio not found — sketch skipped.");
    }

    // ✅ Always return at the end of the try block
    return { html, screenshot, sketchBuffer };
  } finally {
    await closeBrowser(browser);
  }
}
