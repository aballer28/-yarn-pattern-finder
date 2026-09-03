(function () {
  "use strict";
  // berroco-family-safe.js intentionally replaces the yarn catalog.
  // Preserve the larger verified pattern catalog first so catalog-integration.js can merge it later.
  window.BERROCO_FULL_PATTERN_CATALOG = Array.isArray(window.BERROCO_FAMILY_PATTERN_CATALOG)
    ? window.BERROCO_FAMILY_PATTERN_CATALOG.map((pattern) => ({ ...pattern }))
    : [];
})();
