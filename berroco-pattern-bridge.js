(function () {
  "use strict";

  // Preserve the richer Berroco yarn and pattern catalogs before
  // berroco-family-safe.js replaces BERROCO_FAMILY_* globals.
  // catalog-integration.js later discovers these preserved arrays and
  // fills missing label/spec fields back into the safer records.
  window.BERROCO_FULL_YARN_CATALOG = Array.isArray(window.BERROCO_FAMILY_YARN_CATALOG)
    ? window.BERROCO_FAMILY_YARN_CATALOG.map((yarn) => ({ ...yarn }))
    : [];

  window.BERROCO_FULL_PATTERN_CATALOG = Array.isArray(window.BERROCO_FAMILY_PATTERN_CATALOG)
    ? window.BERROCO_FAMILY_PATTERN_CATALOG.map((pattern) => ({ ...pattern }))
    : [];
})();
