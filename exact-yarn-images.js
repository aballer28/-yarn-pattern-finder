// Garn Swatch — exact image loader for ALL yarn and pattern catalogs.
// Existing verified direct images are preserved.
// Missing images use the Vercel /api/yarn-image resolver against the item's OWN page.

(function () {
  "use strict";

  function validImage(value) {
    const v = String(value || "");
    return /^https?:\/\//i.test(v) &&
      !/api\.microlink\.io/i.test(v);
  }

  function validPage(value) {
    return /^https?:\/\//i.test(String(value || ""));
  }

  function pageFor(item) {
    return (
      item.productUrl ||
      item.imagePage ||
      item.sourceUrl ||
      item.url ||
      item.patternUrl ||
      item.ravelryUrl ||
      ""
    );
  }

  function setExactImage(item, kind) {
    if (!item || typeof item !== "object") return;

    // Keep already verified/direct pictures.
    if (validImage(item.image)) return;

    // Remove the previous generic Microlink fallback.
    if (/api\.microlink\.io/i.test(String(item.image || ""))) {
      delete item.image;
    }

    const page = pageFor(item);
    const name = item.name || item.displayName || item.title || "";

    if (!validPage(page) || !name) return;

    item.image =
      "/api/yarn-image?url=" +
      encodeURIComponent(page) +
      "&name=" +
      encodeURIComponent(name) +
      "&kind=" +
      encodeURIComponent(kind);
  }

  Object.keys(window).forEach(function (key) {
    const value = window[key];
    if (!Array.isArray(value)) return;

    const isYarn = /YARN/i.test(key);
    const isPattern = /PATTERN/i.test(key);

    if (!isYarn && !isPattern) return;

    value.forEach(function (item) {
      setExactImage(item, isPattern ? "pattern" : "yarn");
    });
  });

  // Main integrated catalogs are the ones app.js consumes.
  if (Array.isArray(window.YARN_CATALOG)) {
    window.YARN_CATALOG.forEach(function (item) {
      setExactImage(item, "yarn");
    });
  }

  if (Array.isArray(window.PATTERN_CATALOG)) {
    window.PATTERN_CATALOG.forEach(function (item) {
      setExactImage(item, "pattern");
    });
  }
})();
