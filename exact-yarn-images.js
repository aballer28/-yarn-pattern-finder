// Garn Swatch — exact image loader for ALL yarn and pattern catalogs.
// Special handling for DROPS and West Yorkshire Spinners.
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

  function normalize(s) {
    return String(s || "")
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function dropsSlug(name) {
    return String(name || "")
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  const WYS_PAGES = {
    "bluefaced leicester aran naturals":
      "https://wyspinners.com/products/fleece-bluefaced-leicester-aran-yarn",
    "bluefaced leicester roving naturals":
      "https://wyspinners.com/products/fleece-bluefaced-leicester-aran-roving-yarn",
    "bluefaced leicester dk naturals":
      "https://wyspinners.com/products/fleece-bluefaced-leicester-dk-yarn",
    "bluefaced leicester dk":
      "https://wyspinners.com/products/fleece-bluefaced-leicester-dk-yarn",
    "jacob aran":
      "https://wyspinners.com/products/fleece-jacob-aran-yarn",
    "croft aran":
      "https://wyspinners.com/products/the-croft-aran-yarn",
    "the croft aran":
      "https://wyspinners.com/products/the-croft-aran-yarn",
    "elements dk":
      "https://wyspinners.com/products/elements-dk-yarn",
    "colour lab aran":
      "https://wyspinners.com/products/colourlab-aran-yarn",
    "colourlab aran":
      "https://wyspinners.com/products/colourlab-aran-yarn",
    "exquisite lace":
      "https://wyspinners.com/products/exquisite-lace-yarn"
  };

  function exactSpecialCase(item) {
    if (!item || typeof item !== "object") return false;

    const brand = normalize(item.brand);
    const name = String(item.name || item.displayName || item.title || "");
    const n = normalize(name);

    // DROPS has a stable, yarn-specific official shademap image path.
    if (brand === "drops" && name) {
      const slug = dropsSlug(name);
      item.sourceUrl =
        "https://www.garnstudio.com/yarn.php?show=drops-" +
        slug +
        "&cid=17";
      item.imagePage = item.sourceUrl;
      item.image =
        "https://images.garnstudio.com/img/shademap/" +
        slug +
        "/drops-" +
        slug +
        "1.jpg";
      return true;
    }

    // WYS records in the catalog were pointing at old Berroco pages.
    // Force them to the actual WYS product page so the API extracts
    // the picture from the correct individual yarn.
    if (brand === "west yorkshire spinners") {
      const page = WYS_PAGES[n];
      if (page) {
        item.sourceUrl = page;
        item.imagePage = page;
        item.image =
          "/api/yarn-image?url=" +
          encodeURIComponent(page) +
          "&name=" +
          encodeURIComponent(name) +
          "&kind=yarn";
        return true;
      }
    }

    return false;
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

    // Fix known problem brands first, even if a bad image was already present.
    if (exactSpecialCase(item)) return;

    // Keep existing direct images.
    if (validImage(item.image)) return;

    // Remove old generic Microlink fallback.
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
