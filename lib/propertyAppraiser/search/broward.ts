import { openBrowser, closeBrowser } from "../launchBrowser";
import { countySearchUrls } from "../counties";

export async function searchBroward(address: string): Promise<{
  html: string;
  screenshot: Buffer;
}> {
  const { browser, page } = await openBrowser();

  try {
    await page.goto(countySearchUrls.broward, {
      waitUntil: "domcontentloaded",
    });

    await page.waitForSelector("#txtField", { timeout: 15000 });
    await page.fill("#txtField", address);

    await page.click("#searchButton");

    // ⭐ SPA update delay — guaranteed to work
    await page.waitForTimeout(5000);

    // ⭐ Extract full rendered DOM
    const html = await page.evaluate(() => {
      return document.documentElement.outerHTML;
    });

    const screenshot = await page.screenshot({ fullPage: true });

    return { html, screenshot };
  } finally {
    await closeBrowser(browser);
  }
}
