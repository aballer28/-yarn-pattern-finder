// Garn Swatch — automatic product image fallback
// Runs after catalog-integration.js and before app.js.
// Existing direct images always win. For yarns that only have a
// manufacturer product/source page, Microlink resolves that page's
// Open Graph product image into an image URL the browser can display.

(function () {
  "use strict";

  function validHttpUrl(value) {
    return /^https?:\/\//i.test(String(value || "").trim());
  }

  function productImageFromPage(pageUrl) {
    if (!validHttpUrl(pageUrl)) return null;
    return "https://api.microlink.io/?url=" +
      encodeURIComponent(pageUrl) +
      "&embed=image.url";
  }

  function addFallbackImage(item) {
    if (!item || typeof item !== "object") return item;
    if (validHttpUrl(item.image)) return item;

    const page =
      item.imagePage ||
      item.sourceUrl ||
      item.url ||
      item.patternUrl ||
      item.ravelryUrl;

    const image = productImageFromPage(page);
    if (image) item.image = image;

    return item;
  }

  [
    "YARN_CATALOG",
    "KFI_YARN_CATALOG",
    "KNIT_PICKS_YARN_CATALOG",
    "YARN_IMAGE_CATALOG",
    "KELBOURNE_FAMILY_YARN_CATALOG",
    "PATTERN_CATALOG",
    "KFI_PATTERN_CATALOG",
    "KELBOURNE_FAMILY_PATTERN_CATALOG",
    "EXTERNAL_PATTERN_CATALOG",
    "KNIT_PICKS_PATTERN_CATALOG"
  ].forEach(function (key) {
    if (Array.isArray(window[key])) {
      window[key].forEach(addFallbackImage);
    }
  });

  // Also scan every catalog-ish array so newly added brands automatically
  // receive image fallbacks without editing this file again.
  Object.keys(window).forEach(function (key) {
    if (!/(YARN|PATTERN).*CATALOG|CATALOG.*(YARN|PATTERN)/i.test(key)) return;
    const value = window[key];
    if (!Array.isArray(value)) return;
    value.forEach(addFallbackImage);
  });
})();
