import { chromium } from "playwright";
import fs from "fs";

async function main() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log("🌴 Opening Miami-Dade PA…");

  await page.goto("https://apps.miamidadepa.gov/PropertySearch/#/", {
    waitUntil: "domcontentloaded",
  });

  // Wait for the dynamic input field
  await page.waitForSelector("input.k-input-inner", { timeout: 15000 });
  console.log("🌴 Found search input");

  // Type a test address (you can change this)
  const testAddress = "14608 SW 95 Ln";
  await page.fill("input.k-input-inner", testAddress);
  console.log("🌴 Typed address:", testAddress);

  // Click the search icon
  await page.click("span.k-button-icon.k-i-search");
  console.log("🌴 Submitted search… waiting for results");

  // Wait for ANY folio link to appear
  await page.waitForFunction(
    `Array.from(document.querySelectorAll('a')).some(a => /\\d{2}-\\d{4}-\\d{3}-\\d{4}/.test(a.innerText))`,
    { timeout: 45000 }
  );
  console.log("🌴 Folio link detected");

  // Find the folio link
  const folioLinkEl = await page.$("a:has-text('-')");
  if (!folioLinkEl) throw new Error("❌ No folio link found");

  // Click it
  await folioLinkEl.click();
  console.log("🌴 Clicked folio link… waiting for details page");

  // Wait for SPA to load details
  await page.waitForTimeout(8000);

  console.log("🌴 Details page loaded");

  // Extract HTML
  const html = (await page.evaluate(() => document.documentElement.outerHTML)) as string;
  console.log("🌴 Captured HTML, size:", html.length);

  // Save HTML to debug folder
  fs.writeFileSync("debug/miamiDade-html.html", html, "utf8");
  console.log("🌴 Saved to debug/miamiDade-html.html");

  // Screenshot for diagnostics
  await page.screenshot({
    path: "debug/miamiDade-search-result.png",
    fullPage: true,
  });
  console.log("🌴 Screenshot saved to debug/miamiDade-search-result.png");

  // Keep browser open for inspection
  await page.waitForTimeout(999999);
}

main();
