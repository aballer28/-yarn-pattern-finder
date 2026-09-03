(function () {
  "use strict";
  // Deprecated by the 2026-09-03 full audit. The active image pipeline is:
  // yarn-image-catalog.js -> Koigu merge -> catalog integration/audit ->
  // exact-yarn-images.js -> api/yarn-image.js.
  // This file intentionally performs no runtime work.
  window.GARN_SWATCH_DEPRECATED_IMAGE_FILES = [...(window.GARN_SWATCH_DEPRECATED_IMAGE_FILES || []), "yarn-image.js"];
})();
