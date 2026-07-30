import { chromium } from "playwright";
import fs from "fs";
import path from "path";

async function main() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto("https://pbcpao.gov/index.htm", { waitUntil: "domcontentloaded" });

  // Get full HTML
  const html = await page.content();

  // Ensure debug directory exists
  const debugDir = path.join(process.cwd(), "debug");
  if (!fs.existsSync(debugDir)) {
    fs.mkdirSync(debugDir);
  }

  // Write HTML to file
  const filePath = path.join(debugDir, "palmbeach.html");
  fs.writeFileSync(filePath, html, "utf8");

  console.log("✔ Palm Beach HTML written to:", filePath);

  // Optional screenshot
  await page.screenshot({ path: path.join(debugDir, "palmbeach.png"), fullPage: true });

  console.log("✔ Screenshot saved to:", path.join(debugDir, "palmbeach.png"));

  // Keep browser open for manual inspection
  await page.waitForTimeout(999999);
}

main();
