const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const profileId = '76561198031651004';
const wishlistPageUrl = `https://store.steampowered.com/wishlist/profiles/${profileId}/`;
const wishlistDataUrl = `https://store.steampowered.com/wishlist/profiles/${profileId}/wishlistdata/`;
const outputPath = path.join(__dirname, '..', 'data', 'steam-wishlist-latest.json');

function cleanText(value) {
  return value ? String(value).replace(/\s+/g, ' ').trim() : null;
}

function normalizePrice(app) {
  if (!app || !app.subs || !Array.isArray(app.subs) || app.subs.length === 0) {
    return null;
  }

  const sub = app.subs[0];

  return {
    discount_pct: sub.discount_pct ?? null,
    price: sub.price ?? null,
    discount_original_price: sub.discount_original_price ?? null,
    discount_final_price: sub.discount_final_price ?? null,
    formatted_original_price: sub.formatted_original_price ?? null,
    formatted_final_price: sub.formatted_final_price ?? null
  };
}

function normalizeData(data) {
  const apps = Object.entries(data).map(([appId, app]) => ({
    id: `steam-${appId}`,
    appid: appId,
    source: 'Steam',
    product: cleanText(app.name),
    url: `https://store.steampowered.com/app/${appId}/`,
    review_score: app.review_score ?? null,
    review_desc: app.review_desc ?? null,
    reviews_total: app.reviews_total ?? null,
    reviews_percent: app.reviews_percent ?? null,
    release_date: app.release_date ?? null,
    priority: app.priority ?? null,
    added: app.added ?? null,
    price: normalizePrice(app),
    checkedAt: new Date().toISOString()
  }));

  apps.sort((a, b) => (a.product || '').localeCompare(b.product || ''));
  return apps;
}

async function readWishlistWithBrowser() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    locale: 'en-US',
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9'
    }
  });

  const page = await context.newPage();

  await page.goto(wishlistPageUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  await page.waitForTimeout(5000);

  const title = await page.title();
  const bodyText = await page.locator('body').innerText();

  if (/sign in|login|התחבר|כניסה/i.test(bodyText)) {
    console.log('Steam may be showing a login page. If a browser window is open, sign in and run again.');
  }

  const response = await page.evaluate(async (url) => {
    const res = await fetch(url, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json,text/plain,*/*'
      }
    });

    const text = await res.text();

    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      contentType: res.headers.get('content-type'),
      text
    };
  }, wishlistDataUrl);

  await browser.close();

  if (!response.ok) {
    throw new Error(`Steam wishlist request failed: ${response.status} ${response.statusText}`);
  }

  try {
    return JSON.parse(response.text);
  } catch (error) {
    const sample = response.text.slice(0, 500).replace(/\s+/g, ' ');
    throw new Error(`Steam did not return JSON. Page title: ${title}. Content-Type: ${response.contentType}. Sample: ${sample}`);
  }
}

async function main() {
  const data = await readWishlistWithBrowser();
  const apps = normalizeData(data);

  const result = {
    source: 'Steam Wishlist',
    profileId,
    wishlistPageUrl,
    wishlistDataUrl,
    checkedAt: new Date().toISOString(),
    count: apps.length,
    items: apps
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');

  console.log(`Saved ${apps.length} Steam wishlist item(s) to ${outputPath}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
