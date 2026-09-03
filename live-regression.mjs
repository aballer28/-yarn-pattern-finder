import fs from "node:fs/promises";
import { chromium } from "playwright";

const base = String(process.env.LIVE_URL || "https://yarn-pattern-finder.vercel.app").replace(/\/$/, "");
const report = { generatedAt: new Date().toISOString(), base, desktop: {}, mobile: {}, failures: [], consoleErrors: [] };
const fail = (message) => report.failures.push(message);

async function runPage(page, bucket, mobile = false) {
  const started = Date.now();
  page.on("console", (msg) => { if (msg.type() === "error") report.consoleErrors.push(msg.text()); });
  page.on("pageerror", (error) => report.consoleErrors.push(String(error.message || error)));
  const response = await page.goto(base, { waitUntil: "domcontentloaded", timeout: 45000 });
  bucket.status = response?.status() || 0;
  if (!response || response.status() >= 400) { fail(`${mobile ? "mobile" : "desktop"}: page returned ${bucket.status}`); return; }
  await page.waitForSelector("#brandSelect", { timeout: 30000 });
  await page.waitForSelector("#patternSort", { timeout: 30000 });
  bucket.loadMs = Date.now() - started;
  bucket.title = await page.title();
  bucket.brandCount = await page.locator("#brandSelect option").count();
  bucket.sortOptions = await page.locator("#patternSort option").allTextContents();
  if (bucket.brandCount < 5) fail(`${mobile ? "mobile" : "desktop"}: too few brands loaded (${bucket.brandCount})`);
  const expectedSorts = ["Closest Match", "Alphabetical A–Z", "Alphabetical Z–A", "Newest–oldest", "Oldest–newest"];
  for (const label of expectedSorts) if (!bucket.sortOptions.includes(label)) fail(`missing sort option: ${label}`);

  const brands = await page.locator("#brandSelect option").allTextContents();
  if (brands.includes("Koigu")) {
    await page.selectOption("#brandSelect", { label: "Koigu" });
    const yarns = await page.locator("#yarnSelect option").allTextContents();
    if (yarns.includes("KPPPM")) {
      await page.selectOption("#yarnSelect", { label: "KPPPM" });
      const meta = await page.locator("#yarnMeta").innerText();
      if (!/KPPPM/i.test(meta)) fail(`${mobile ? "mobile" : "desktop"}: selecting Koigu KPPPM did not update yarn details`);
    }
  }

  // Held-together UI must be a real input flow, not just matcher metadata.
  if (await page.locator("#holdTogether").count()) {
    await page.check("#holdTogether");
    const secondVisible = await page.locator("#secondYarnFields").isVisible();
    if (!secondVisible) fail(`${mobile ? "mobile" : "desktop"}: second-yarn controls did not appear`);
    if (await page.locator("#combinedGauge").count()) {
      await page.fill("#combinedGauge", "20");
      const basis = await page.locator("#matchBasis").innerText();
      if (!/20/.test(basis)) fail(`${mobile ? "mobile" : "desktop"}: combined swatch gauge did not update matching basis`);
    }
    await page.uncheck("#holdTogether");
  }

  await page.click("#crochet");
  if ((await page.getAttribute("#crochet", "aria-pressed")) !== "true") fail(`${mobile ? "mobile" : "desktop"}: crochet toggle did not activate`);
  await page.click("#knit");
  if ((await page.getAttribute("#knit", "aria-pressed")) !== "true") fail(`${mobile ? "mobile" : "desktop"}: knitting toggle did not reactivate`);

  await page.fill("#patternSearch", "hat");
  await page.waitForTimeout(250);
  bucket.patternCardsAfterSearch = await page.locator("#allPatternGrid article.pattern").count();

  // Sorting must actually reorder the rendered cards, not just change a select value.
  const readNames = async () => (await page.locator("#allPatternGrid article.pattern h3").allTextContents()).map((x) => x.trim()).filter(Boolean);
  await page.fill("#patternSearch", "");
  await page.waitForTimeout(250);
  await page.selectOption("#patternSort", "az");
  await page.waitForTimeout(100);
  const azNames = await readNames();
  if (azNames.length > 1) {
    const expected = [...azNames].sort((a,b)=>a.localeCompare(b));
    if (azNames.some((name,i)=>name!==expected[i])) fail(`${mobile ? "mobile" : "desktop"}: A–Z sort did not order visible patterns alphabetically`);
  }
  await page.selectOption("#patternSort", "za");
  await page.waitForTimeout(100);
  const zaNames = await readNames();
  if (zaNames.length > 1) {
    const expected = [...zaNames].sort((a,b)=>b.localeCompare(a));
    if (zaNames.some((name,i)=>name!==expected[i])) fail(`${mobile ? "mobile" : "desktop"}: Z–A sort did not order visible patterns alphabetically`);
  }
  await page.selectOption("#patternSort", "closest");
  await page.waitForTimeout(100);

  // Pattern buttons must never masquerade a collection/listing page as an exact design.
  const patternLinks = await page.locator("#allPatternGrid article.pattern .pattern-links a").evaluateAll((links) =>
    links.slice(0, 100).map((a) => ({ text: (a.textContent || "").trim(), href: a.href }))
  );
  const genericCollection = /\/(?:collections?|patterns?|designs?|products?)\/?(?:[?#].*)?$/i;
  for (const link of patternLinks) {
    if (/view pattern|open pattern pdf/i.test(link.text) && genericCollection.test(link.href)) {
      fail(`${mobile ? "mobile" : "desktop"}: exact pattern button points to a collection page: ${link.href}`);
    }
    if (/view on ravelry/i.test(link.text) && !/ravelry\.com\/patterns\/library\/[^/?#]+/i.test(link.href)) {
      fail(`${mobile ? "mobile" : "desktop"}: Ravelry button is not a direct pattern URL: ${link.href}`);
    }
  }

  // Reverse calculator must produce finite, customer-safe output.
  if (await page.locator("#buyAnswer").count()) {
    const reverseText = `${await page.locator("#buyAnswer").innerText()} ${await page.locator("#buyDetails").innerText()}`;
    if (/\b(?:undefined|null|nan|infinity)\b/i.test(reverseText)) {
      fail(`${mobile ? "mobile" : "desktop"}: reverse skein calculator rendered an invalid value`);
    }
  }

  bucket.brokenImages = await page.locator("img").evaluateAll((images) => images.filter((img) => img.complete && img.naturalWidth === 0).map((img) => img.src).slice(0, 50));
  if (bucket.brokenImages.length) fail(`${mobile ? "mobile" : "desktop"}: ${bucket.brokenImages.length} broken image(s) detected`);

  bucket.horizontalOverflow = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - window.innerWidth));
  if (mobile && bucket.horizontalOverflow > 3) fail(`mobile: horizontal overflow ${bucket.horizontalOverflow}px`);

  bucket.undefinedText = await page.locator("body").evaluate((body) => /\bundefined\b/.test(body.innerText));
  if (bucket.undefinedText) fail(`${mobile ? "mobile" : "desktop"}: rendered page contains undefined`);
}

let browser;
try {
  browser = await chromium.launch({ headless: true });
  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await runPage(await desktopContext.newPage(), report.desktop, false);
  await desktopContext.close();
  const mobileContext = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await runPage(await mobileContext.newPage(), report.mobile, true);
  await mobileContext.close();
} catch (error) {
  fail(String(error.stack || error));
} finally {
  if (browser) await browser.close();
}
report.consoleErrors = [...new Set(report.consoleErrors)].slice(0, 100);
if (report.consoleErrors.length) fail(`${report.consoleErrors.length} browser console/page error(s)`);
report.passed = report.failures.length === 0;
await fs.writeFile("live-regression-report.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 2;
