// Garn Swatch — exact-image-only policy
// Removes generic/fallback image URLs. Existing exact yarn images remain.
// This intentionally does NOT invent or reuse a brand image for multiple yarns.
(function () {
  "use strict";
  const bad = /api\.microlink\.io/i;

  Object.keys(window).forEach(function (key) {
    const arr = window[key];
    if (!Array.isArray(arr)) return;
    arr.forEach(function (item) {
      if (!item || typeof item !== "object") return;
      if (item.image && bad.test(String(item.image))) {
        delete item.image;
      }
    });
  });
})();
