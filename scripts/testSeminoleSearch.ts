import { chromium } from "playwright";
import fs from "fs";

async function main() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log("🟩 Opening Seminole County Parcel Search…");

  await page.goto("https://scpafl.org/search/parcels", {
    waitUntil: "domcontentloaded",
  });

  // Slow down: let the page fully hydrate
  await page.waitForTimeout(1500);

  const addressTabSelector = 'a.nav-link[href$="_Address"]';

  await page.waitForSelector(addressTabSelector, { timeout: 20000 });
  console.log("🟩 Found Address tab");

  // REAL DOM CLICK (Bootstrap requires this)
  await page.evaluate((selector) => {
    const el = document.querySelector(selector);
    if (el) (el as HTMLElement).click();
  }, addressTabSelector);

  console.log("🟩 Triggered REAL DOM click on Address tab");

  // Slow down: allow Bootstrap to animate the tab switch
  await page.waitForTimeout(1500);

  // Wait for tab to become active
  await page.waitForFunction(
    (selector) => {
      const el = document.querySelector(selector);
      return el && el.classList.contains("active");
    },
    addressTabSelector,
    { timeout: 20000 }
  );
  console.log("🟩 Address tab is active");

  // Slow down: allow UserWay overlays to modify DOM
  await page.waitForTimeout(2000);

  // Wait for tab content to be visible
  await page.waitForSelector("div.tab-pane.show.active", { timeout: 20000 });
  console.log("🟩 Address tab content is visible");

  // Scroll into view (UserWay requires this)
  await page.evaluate(() => {
    const el = document.querySelector("div.tab-pane.show.active");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  console.log("🟩 Scrolled tab content into view");

  // Slow down: allow inputs to become visible
  await page.waitForTimeout(2000);

  // Now inputs should be visible
  await page.waitForSelector("#StreetAddress", { timeout: 20000, state: "visible" });
  await page.waitForSelector("#StreetName", { timeout: 20000, state: "visible" });
  await page.waitForSelector("#StreetType", { timeout: 20000, state: "visible" });
  console.log("🟩 Address search inputs are now visible");

  const streetNumber = "241";
  const streetName = "Hanging Moss";
  const streetType = "Cir";

  await page.fill("#StreetAddress", streetNumber);
  await page.waitForTimeout(500);

  await page.fill("#StreetName", streetName);
  await page.waitForTimeout(500);

  await page.fill("#StreetType", streetType);
  await page.waitForTimeout(500);

  console.log("🟩 Filled address fields");

  await page.waitForSelector("button.btn.btn-success", { timeout: 20000 });

  // Slow down before clicking search
  await page.waitForTimeout(1000);

  await page.click("button.btn.btn-success");
  console.log("🟩 Clicked Search");

  // Slow down: allow Kendo grid to initialize
  await page.waitForTimeout(2500);

  console.log("🟩 Waiting for results table…");

  await page.waitForFunction(
    () =>
      Array.from(document.querySelectorAll("td"))
        .some(td => td.innerText.includes("241 HANGING MOSS CIR")),
    { timeout: 30000 }
  );

  console.log("🟩 Found matching address row");

  const row = await page.$("td:has-text('241 HANGING MOSS CIR')");
  if (!row) throw new Error("❌ Could not click matching row");

  // Slow down before clicking row
  await page.waitForTimeout(1500);

  await row.click();
  console.log("🟩 Clicked property row… loading details page");

  // Slow down: allow full page navigation
  await page.waitForTimeout(5000);

  console.log("🟩 Details page loaded:", page.url());

  const html = await page.evaluate(() => document.documentElement.outerHTML);
  console.log("🟩 Captured HTML, size:", html.length);

  if (!fs.existsSync("debug")) fs.mkdirSync("debug");

  fs.writeFileSync("debug/seminole-html.html", html, "utf8");
  console.log("🟩 Saved to debug/seminole-html.html");

  await page.screenshot({
    path: "debug/seminole-search-result.png",
    fullPage: true,
  });

  console.log("🟩 Screenshot saved to debug/seminole-search-result.png");

  await page.waitForTimeout(999999);
}

main();
