import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log("🌴 Opening Palm Beach PA…");

  await page.goto("https://pbcpao.gov/index.htm", {
    waitUntil: "domcontentloaded",
  });

  // Wait for the REAL property search box
  await page.waitForSelector("#realsrchVal", { timeout: 15000 });

  console.log("🌴 Found #realsrchVal");

  // Type a test address (you can change this)
  const testAddress = "9953 TORINO DR";
  await page.fill("#realsrchVal", testAddress);

  console.log("🌴 Typed address:", testAddress);

  // Press Enter to trigger the search
  await page.keyboard.press("Enter");

  console.log("🌴 Submitted search… waiting for navigation");

  // Palm Beach PA navigates to a SPA results page
  await page.waitForLoadState("networkidle");

  // Screenshot the results page
  const buffer = await page.screenshot({ fullPage: true });

  console.log("🌴 Screenshot captured. Saving…");

  // Save screenshot
  await page.screenshot({
    path: "debug/palmbeach-search-result.png",
    fullPage: true,
  });

  console.log("🌴 Saved to debug/palmbeach-search-result.png");

  // Keep browser open so you can inspect the DOM manually
  await page.waitForTimeout(999999);
}

main();
