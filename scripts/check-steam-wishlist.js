const fs = require('fs');
const path = require('path');

const profileId = '76561198031651004';
const wishlistUrl = `https://store.steampowered.com/wishlist/profiles/${profileId}/wishlistdata/`;
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

async function main() {
  const response = await fetch(wishlistUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'application/json,text/plain,*/*'
    }
  });

  if (!response.ok) {
    throw new Error(`Steam wishlist request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
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

  const result = {
    source: 'Steam Wishlist',
    profileId,
    wishlistUrl,
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
