const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const shoppingPath = path.join(__dirname, '..', 'shopping.json');
const outputPath = path.join(__dirname, '..', 'data', 'aliexpress-latest.json');

function cleanText(value) {
  return value ? String(value).trim() : null;
}

function normalizeAliExpressUrl(url) {
  const match = String(url).match(/item\/(\d+)\.html/);
  if (!match) return url;
  return `https://www.aliexpress.com/item/${match[1]}.html`;
}

function extractPrice(bodyText) {
  const match = bodyText.match(/₪\s?\d+(\.\d+)?/);
  return match ? match[0].replace(/\s+/g, '') : null;
}

async function extractAliExpress(page, item) {
  const url = normalizeAliExpressUrl(item.link || item.url);

  await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  await page.waitForTimeout(9000);

  const title = await page.title();
  const bodyText = await page.locator('body').innerText();

  const ratingMatch = bodyText.match(/\b\d\.\d\b/);
  const reviewsMatch = bodyText.match(/(\d+)\s+(חוות דעת|דירוגים|reviews|ratings)/i);
  const soldMatch = bodyText.match(/(\d+)\s*(נמכר|נמכרו|sold)/i);
  const storeMatch = bodyText.match(/שם החנות\s*\n(.+)/);

  return {
    id: item.id,
    source: 'AliExpress',
    url,
    title: cleanText(title),
    price: extractPrice(bodyText),
    rating: ratingMatch ? ratingMatch[0] : null,
    reviews: reviewsMatch ? reviewsMatch[1] : null,
    sold: soldMatch ? soldMatch[1] : null,
    store: storeMatch ? cleanText(storeMatch[1]) : null,
    checkedAt: new Date().toISOString()
  };
}

async function main() {
  const shopping = JSON.parse(fs.readFileSync(shoppingPath, 'utf8'));
  const items = shopping.items.filter(item => item.website === 'AliExpress');

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    locale: 'en-US',
    timezoneId: 'Asia/Jerusalem',
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9'
    }
  });
  const page = await context.newPage();

  const results = [];

  for (const item of items) {
    console.log(`Checking ${item.id}`);
    try {
      const result = await extractAliExpress(page, item);
      results.push(result);
      console.log(`OK ${item.id}: ${result.price || 'no price'}`);
    } catch (error) {
      results.push({
        id: item.id,
        source: 'AliExpress',
        url: item.link || item.url,
        error: error.message,
        checkedAt: new Date().toISOString()
      });
      console.log(`FAILED ${item.id}: ${error.message}`);
    }
  }

  await browser.close();

  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`Saved ${results.length} result(s) to ${outputPath}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
