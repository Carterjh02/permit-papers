import { openBrowser, closeBrowser } from "../launchBrowser";
import { countySearchUrls } from "../counties";

/**
 * Saint Lucie County Property Appraiser search.
 *
 * For now, this:
 * - Opens browser
 * - Navigates to the PA search URL
 * - Attempts a basic address search
 * - Screenshots the results page
 *
 * You can refine selectors once we see the actual HTML.
 */
export async function searchSaintLucie(address: string): Promise<Buffer> {
  const { browser, page } = await openBrowser();

  try {
    const url = countySearchUrls.saintLucie;
    await page.goto(url, { waitUntil: "networkidle" });

    // TODO: adjust these selectors to match Saint Lucie PA search form
    // These are placeholders that will compile and run.
    await page.fill("input[type='text']", address);
    console.log("🟦 [PA_DEBUG] SaintLucie: Received address:", address);

    await page.click("input[type='submit']");

    // Give the site a moment to render results
    await page.waitForTimeout(3000);

    const screenshot = await page.screenshot({ fullPage: true });
    return screenshot;
    console.log("🟦 [PA_DEBUG] SaintLucie: Screenshot size:", screenshot.length);
  } finally {
    await closeBrowser(browser);
  }
}