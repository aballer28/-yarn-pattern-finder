// Garn Swatch — exact per-yarn image resolver
// Uses each yarn's own product/source page. Rejects reused generic images.
(function () {
  "use strict";

  const CACHE_KEY = "garnSwatchExactYarnImagesV2";
  let cache = {};
  try { cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}"); } catch (_) {}

  const keyOf = y => `${String(y.brand||"").trim()}|${String(y.name||"").trim()}`;
  const pageOf = y => y.productUrl || y.sourceUrl || y.imagePage || y.url || "";
  const valid = u => /^https?:\/\//i.test(String(u || ""));

  // Existing exact image data remains authoritative.
  function seed(arr) {
    if (!Array.isArray(arr)) return;
    arr.forEach(y => {
      if (y && valid(y.image) && !/api\.microlink\.io/i.test(y.image)) {
        cache[keyOf(y)] = y.image;
      }
    });
  }

  Object.keys(window).forEach(k => {
    if (Array.isArray(window[k]) && /YARN/i.test(k)) seed(window[k]);
  });

  function applyCached(arr) {
    if (!Array.isArray(arr)) return;
    arr.forEach(y => {
      if (!y) return;
      const hit = cache[keyOf(y)];
      if (valid(hit)) y.image = hit;
      else if (/api\.microlink\.io/i.test(String(y.image||""))) delete y.image;
    });
  }

  Object.keys(window).forEach(k => {
    if (Array.isArray(window[k]) && /YARN/i.test(k)) applyCached(window[k]);
  });

  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));

  // Resolve missing images from each yarn's OWN page.
  // Microlink is used only as metadata extraction; we reject any image that is
  // returned for multiple different yarns, preventing the old generic-image bug.
  const yarns = Array.isArray(window.YARN_CATALOG) ? window.YARN_CATALOG : [];
  const missing = yarns.filter(y => !valid(y.image) && valid(pageOf(y)));
  const seenImageToKey = new Map();
  let changed = false;

  async function resolveOne(y) {
    const page = pageOf(y);
    const k = keyOf(y);
    try {
      const endpoint = "https://api.microlink.io/?url=" + encodeURIComponent(page) + "&meta=true";
      const r = await fetch(endpoint);
      if (!r.ok) return;
      const j = await r.json();
      const img = j && j.data && j.data.image && j.data.image.url;
      if (!valid(img)) return;

      const other = seenImageToKey.get(img);
      if (other && other !== k) return; // reject generic/reused image
      seenImageToKey.set(img, k);

      cache[k] = img;
      y.image = img;
      changed = true;
    } catch (_) {}
  }

  async function run() {
    // modest concurrency to avoid hammering product sites / metadata service
    for (let i = 0; i < missing.length; i += 6) {
      await Promise.all(missing.slice(i, i + 6).map(resolveOne));
    }
    if (changed) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      // Refresh once so app.js renders the newly cached exact images.
      if (!sessionStorage.getItem("garnSwatchImagesRefreshed")) {
        sessionStorage.setItem("garnSwatchImagesRefreshed", "1");
        location.reload();
      }
    }
  }

  run();
})();