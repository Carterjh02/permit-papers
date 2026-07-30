import { openBrowser, closeBrowser } from "../launchBrowser";
import { countySearchUrls } from "../counties";
import fs from "fs";
import path from "path";

export async function searchPalmBeach(
  address: string
): Promise<{ screenshot: Buffer; html: string }> {
  const { browser, page } = await openBrowser();

  try {
    await page.goto(countySearchUrls.palmBeach, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#realsrchVal", { timeout: 15000 });
    await page.fill("#realsrchVal", address);
    await page.keyboard.press("Enter");
    await page.waitForSelector("#searchGrid tbody tr", { timeout: 30000 });

    const rows = await page.$$("#searchGrid tbody tr");
    let parcelId: string | null = null;

    for (const row of rows) {
      const locationCell = await row.$("td:nth-child(3)");
      const locationText = (await locationCell?.innerText())?.trim().toLowerCase() ?? "";
      if (locationText.includes(address.toLowerCase())) {

        const parcelCell = await row.$("td:nth-child(5)");
        parcelId = (await parcelCell?.innerText())?.trim() ?? null;
        break;
      }
    }

    if (!parcelId) {
      throw new Error("No matching row found for address: " + address);
    }

    const detailsUrl = `https://pbcpao.gov/Property/Details?parcelId=${parcelId}`;
    await page.goto(detailsUrl, { waitUntil: "networkidle" });

    await page.waitForSelector("#MainContent_lblLocation", { timeout: 30000 });

    // Capture HTML for parser (store separately, not returned)
    const html = await page.content();
    const debugDir = path.join(process.cwd(), "debug");
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir);
    }
    
    fs.writeFileSync(path.join(debugDir, "palmbeach-html.html"), html);

    // Screenshot (returned)
    const screenshot = await page.screenshot({ fullPage: true });

    return { screenshot, html } ; 
  } finally {
    await closeBrowser(browser);
  }
}
