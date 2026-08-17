import { chromium } from "playwright";
import fs from "fs";
import path from "path";

async function main() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log("🟫 Opening Broward PA…");

  await page.goto("https://web.bcpa.net/BcpaClient/#/Record-Search", {
    waitUntil: "domcontentloaded",
  });

  // Fill search box
  await page.waitForSelector("#txtField", { timeout: 15000 });
  const testAddress = "1326 Ginger Cir Weston, FL 33326";
  await page.fill("#txtField", testAddress);
  console.log("🟫 Typed address:", testAddress);

  // Click search (no navigation detection)
  await page.click("#searchButton");
  console.log("🟫 Clicked search button");

  // WAIT FOR DOM TO UPDATE (SPA behavior)
  await page.waitForTimeout(5000);

  // Extract full rendered DOM
  const html = await page.evaluate(() => {
    return document.documentElement.outerHTML;
  });

  // Save HTML
  const debugDir = path.join(process.cwd(), "debug");
  if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir);

  fs.writeFileSync(path.join(debugDir, "broward-html.html"), html);
  console.log("🟫 Saved HTML → debug/broward-html.html");

  await browser.close();
}

main();
