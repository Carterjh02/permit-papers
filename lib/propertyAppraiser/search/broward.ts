import { openBrowser, closeBrowser } from "../launchBrowser";
import { countySearchUrls } from "../counties";

export async function searchBroward(address: string): Promise<Buffer> {
  const { browser, page } = await openBrowser();

  try {
    await page.goto(countySearchUrls.broward);
    await page.waitForLoadState("domcontentloaded");

    await page.waitForSelector("#txtField", { timeout: 15000 });
    await page.fill("#txtField", address);

    await page.click("#searchButton");
    await page.waitForLoadState("networkidle");

    // OLD WORKING SELECTOR — THIS IS WHAT WORKED BEFORE
    await page.waitForSelector("#parcelresult", {
      timeout: 30000,
      state: "visible",
    });

    return await page.screenshot({ fullPage: true });
  } finally {
    await closeBrowser(browser);
  }
}
