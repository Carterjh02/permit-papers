import { chromium, Browser, Page } from "playwright";

export interface BrowserContext {
  browser: Browser;
  page: Page;
}

/**
 * Opens a headless Chromium browser and returns the browser + page.
 */
export async function openBrowser(): Promise<BrowserContext> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  return { browser, page };
}

/**
 * Closes the given browser instance.
 */
export async function closeBrowser(browser: Browser): Promise<void> {
  await browser.close();
}