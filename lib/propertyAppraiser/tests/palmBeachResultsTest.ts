import { chromium } from "playwright";
import fs from "fs";
import path from "path";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const url =
    "https://pbcpao.gov/MasterSearch/SearchResults?propertyType=RE&searchvalue=412%20tuskegee%20dr";

  console.log("Navigating to:", url);
  await page.goto(url, { waitUntil: "networkidle" });

  // Wait for the results table to appear
  await page.waitForSelector("table", { timeout: 30000 });

  // Capture full HTML
  const html = await page.content();

  // Save to debug folder
  const debugDir = path.join(process.cwd(), "debug");
  if (!fs.existsSync(debugDir)) {
    fs.mkdirSync(debugDir);
  }

  const filePath = path.join(debugDir, "palmbeach-results.html");
  fs.writeFileSync(filePath, html);
  console.log("✅ Saved HTML to:", filePath);

  await browser.close();
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
