// ============================================================
// GARN SWATCH — FULL CATALOG INTEGRATION
// ============================================================
// Loads the standalone catalog files into the original Garn
// Swatch data structure WITHOUT requiring a rewrite of app.js.
//
// Also repairs the two catalog mix-ups found in the repo:
// - Lise Tailor
// - UK Alpaca
//
// Yarn duplicates are merged by BRAND + YARN NAME.
// Pattern duplicates are left to app.js's existing pattern
// deduplication system.
// ============================================================

(function () {
  "use strict";

  // ==========================================================
  // HELPERS
  // ==========================================================

  function text(value) {
    return String(value || "").trim();
  }

  function normalized(value) {
    return text(value)
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[®™©]/g, "")
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function yarnKey(yarn) {
    return `${normalized(yarn.brand)}|${normalized(yarn.name)}`;
  }

  function isPlainObject(value) {
    return value && typeof value === "object" && !Array.isArray(value);
  }

  function looksLikeYarn(item) {
    if (!isPlainObject(item)) return false;
    if (!text(item.brand) || !text(item.name)) return false;

    // Do not accidentally treat patterns as yarns.
    if (
      item.usedYarns ||
      item.designer ||
      item.patternUrl ||
      item.pdfUrl
    ) {
      return false;
    }

    return Boolean(
      item.weight ||
      item.cycWeight ||
      item.yards ||
      item.meters ||
      item.grams ||
      item.ounces ||
      item.fiber ||
      item.fiberFamily ||
      item.knitGauge ||
      item.crochetGauge ||
      item.needleSize ||
      item.hookSize ||
      item.status ||
      item.catalogOnly
    );
  }

  function looksLikePattern(item) {
    if (!isPlainObject(item)) return false;
    if (!text(item.name)) return false;

    return Boolean(
      item.usedYarns ||
      item.craft ||
      item.project ||
      item.designer ||
      item.patternUrl ||
      item.pdfUrl ||
      item.skillLevel ||
      item.free === true
    );
  }


  // ==========================================================
  // REPAIR: LISE TAILOR
  //
  // The repo copy of lise-tailor-catalog.js currently contains
  // Luca-S data, so that file is intentionally NOT loaded.
  // ==========================================================

  window.LISE_TAILOR_BRANDS = [
    "Lise Tailor"
  ];

  window.LISE_TAILOR_YARN_CATALOG = [

    {
      brand: "Lise Tailor",
      name: "Merino",
      displayName: "Lise Tailor Merino Fingering",
      status: "current",
      weight: "Fingering",
      cycWeight: 1,
      grams: 50,
      meters: 175,
      yards: 191,
      fiber: "100% Merino Wool",
      care: "Machine washable on wool cycle; 20°C recommended, 30°C maximum",
      sourceUrl: "https://lisetailor.com/en/pages/nos-laines",
      imagePage: "https://lisetailor.com/en/pages/nos-laines"
    },

    {
      brand: "Lise Tailor",
      name: "Silk Mohair",
      displayName: "Lise Tailor Silk Mohair",
      status: "current",
      weight: "Lace",
      cycWeight: 0,
      grams: 25,
      meters: 210,
      yards: 230,
      fiber: "72% Kid Mohair, 28% Mulberry Silk",
      sourceUrl: "https://lisetailor.com/en/pages/nos-laines",
      imagePage: "https://lisetailor.com/en/pages/nos-laines"
    },

    {
      brand: "Lise Tailor",
      name: "Silk Merino",
      displayName: "Lise Tailor Silk Merino",
      status: "current",
      weight: "Fingering",
      grams: 50,
      meters: 200,
      yards: 219,
      sourceUrl: "https://lisetailor.com/en/pages/nos-laines",
      imagePage: "https://lisetailor.com/en/pages/nos-laines"
    },

    {
      brand: "Lise Tailor",
      name: "Cumulus",
      displayName: "Lise Tailor Cumulus",
      status: "current",
      weight: "DK / Light",
      grams: 50,
      meters: 100,
      yards: 109,
      fiber: "78% Kid Mohair, 13% Superwash Merino, 9% Polyamide",
      sourceUrl: "https://lisetailor.com/en/pages/nos-laines",
      imagePage: "https://lisetailor.com/en/pages/nos-laines"
    },

    {
      brand: "Lise Tailor",
      name: "Aube",
      displayName: "Lise Tailor Aube",
      status: "current",
      fiber: "100% Merino Wool",
      needleSize: "5.5 mm",
      sourceUrl: "https://lisetailor.com/en/pages/nos-laines",
      imagePage: "https://lisetailor.com/en/pages/nos-laines"
    },

    {
      brand: "Lise Tailor",
      name: "Filena",
      displayName: "Lise Tailor Filena",
      status: "current",
      sourceUrl: "https://lisetailor.com/en/pages/nos-laines",
      imagePage: "https://lisetailor.com/en/pages/nos-laines"
    }
  ];


  // ==========================================================
  // REPAIR: UK ALPACA
  //
  // The repo copy of uk-alpaca-catalog.js currently contains
  // Vobelle data, so that file is intentionally NOT loaded.
  // ==========================================================

  window.UK_ALPACA_BRANDS = [
    "UK Alpaca"
  ];

  window.UK_ALPACA_YARN_CATALOG = [

    {
      brand: "UK Alpaca",
      name: "Superfine Alpaca 4-Ply",
      status: "current",
      weight: "Fingering / 4 Ply",
      cycWeight: 1,
      fiberFamily: "Alpaca",
      sourceUrl: "https://www.ukalpaca.com/",
      imagePage: "https://www.ukalpaca.com/"
    },

    {
      brand: "UK Alpaca",
      name: "Superfine Alpaca DK",
      status: "current",
      weight: "DK",
      cycWeight: 3,
      fiberFamily: "Alpaca",
      sourceUrl: "https://www.ukalpaca.com/",
      imagePage: "https://www.ukalpaca.com/"
    },

    {
      brand: "UK Alpaca",
      name: "Superfine Alpaca Speckledy DK",
      status: "current",
      weight: "DK",
      cycWeight: 3,
      fiberFamily: "Alpaca",
      sourceUrl: "https://www.ukalpaca.com/",
      imagePage: "https://www.ukalpaca.com/"
    },

    {
      brand: "UK Alpaca",
      name: "Superfine Alpaca Chunky",
      status: "current",
      weight: "Chunky / Bulky",
      cycWeight: 5,
      fiberFamily: "Alpaca",
      sourceUrl: "https://www.ukalpaca.com/",
      imagePage: "https://www.ukalpaca.com/"
    },

    {
      brand: "UK Alpaca",
      name: "Baby Alpaca & Silk 4-Ply",
      status: "current",
      weight: "Fingering / 4 Ply",
      cycWeight: 1,
      fiberFamily: "Baby Alpaca / Silk",
      sourceUrl: "https://www.ukalpaca.com/",
      imagePage: "https://www.ukalpaca.com/"
    },

    {
      brand: "UK Alpaca",
      name: "Baby Alpaca & Silk DK",
      status: "current",
      weight: "DK",
      cycWeight: 3,
      fiberFamily: "Baby Alpaca / Silk",
      sourceUrl: "https://www.ukalpaca.com/",
      imagePage: "https://www.ukalpaca.com/"
    },

    {
      brand: "UK Alpaca",
      name: "Suri Alpaca 4-Ply",
      status: "current",
      weight: "Fingering / 4 Ply",
      cycWeight: 1,
      fiberFamily: "Suri Alpaca",
      sourceUrl: "https://www.ukalpaca.com/",
      imagePage: "https://www.ukalpaca.com/"
    }
  ];


  // ==========================================================
  // UK ALPACA PATTERNS
  // ==========================================================

  window.UK_ALPACA_PATTERN_CATALOG = [

    {
      name: "Bashful Basque",
      sourceBrand: "UK Alpaca",
      brands: ["UK Alpaca"],
      craft: "knit",
      usedYarns: ["UK Alpaca|Superfine Alpaca 4-Ply"],
      sourceUrl: "https://www.ukalpaca.com/products/knitting-patterns/4-ply-knitting-patterns/"
    },

    {
      name: "Beaded Cowl",
      sourceBrand: "UK Alpaca",
      brands: ["UK Alpaca"],
      craft: "knit",
      project: "Cowl",
      usedYarns: ["UK Alpaca|Superfine Alpaca 4-Ply"],
      sourceUrl: "https://www.ukalpaca.com/products/knitting-patterns/4-ply-knitting-patterns/"
    },

    {
      name: "Beaded Fingerless Mitts",
      sourceBrand: "UK Alpaca",
      brands: ["UK Alpaca"],
      craft: "knit",
      project: "Mittens",
      usedYarns: ["UK Alpaca|Superfine Alpaca 4-Ply"],
      sourceUrl: "https://www.ukalpaca.com/products/knitting-patterns/4-ply-knitting-patterns/"
    },

    {
      name: "Beaded Slouch Beanie",
      sourceBrand: "UK Alpaca",
      brands: ["UK Alpaca"],
      craft: "knit",
      project: "Hat",
      usedYarns: ["UK Alpaca|Superfine Alpaca 4-Ply"],
      sourceUrl: "https://www.ukalpaca.com/products/knitting-patterns/4-ply-knitting-patterns/"
    },

    {
      name: "Blue Skies Shawl",
      sourceBrand: "UK Alpaca",
      brands: ["UK Alpaca"],
      craft: "knit",
      project: "Shawl",
      usedYarns: ["UK Alpaca|Superfine Alpaca 4-Ply"],
      sourceUrl: "https://www.ukalpaca.com/products/knitting-patterns/4-ply-knitting-patterns/"
    },

    {
      name: "Cloud Hopper",
      sourceBrand: "UK Alpaca",
      brands: ["UK Alpaca"],
      craft: "knit",
      usedYarns: ["UK Alpaca|Superfine Alpaca 4-Ply"],
      sourceUrl: "https://www.ukalpaca.com/products/knitting-patterns/4-ply-knitting-patterns/"
    },

    {
      name: "Diamond Dazzler",
      sourceBrand: "UK Alpaca",
      brands: ["UK Alpaca"],
      craft: "knit",
      usedYarns: ["UK Alpaca|Superfine Alpaca 4-Ply"],
      sourceUrl: "https://www.ukalpaca.com/products/knitting-patterns/4-ply-knitting-patterns/"
    },

    {
      name: "Erin Shawl",
      sourceBrand: "UK Alpaca",
      brands: ["UK Alpaca"],
      craft: "knit",
      project: "Shawl",
      usedYarns: ["UK Alpaca|Superfine Alpaca 4-Ply"],
      sourceUrl: "https://www.ukalpaca.com/products/knitting-patterns/4-ply-knitting-patterns/"
    },

    {
      name: "Fair Isle Frenzy",
      sourceBrand: "UK Alpaca",
      brands: ["UK Alpaca"],
      craft: "knit",
      usedYarns: ["UK Alpaca|Superfine Alpaca 4-Ply"],
      sourceUrl: "https://www.ukalpaca.com/products/knitting-patterns/4-ply-knitting-patterns/"
    },

    {
      name: "Honeysuckle & Bindweed Scarf",
      sourceBrand: "UK Alpaca",
      brands: ["UK Alpaca"],
      craft: "knit",
      project: "Scarf",
      usedYarns: ["UK Alpaca|Superfine Alpaca 4-Ply"],
      sourceUrl: "https://www.ukalpaca.com/products/knitting-patterns/4-ply-knitting-patterns/"
    },

    {
      name: "Lexie Triangular Shawl",
      sourceBrand: "UK Alpaca",
      brands: ["UK Alpaca"],
      craft: "knit",
      project: "Shawl",
      usedYarns: ["UK Alpaca|Superfine Alpaca 4-Ply"],
      sourceUrl: "https://www.ukalpaca.com/products/knitting-patterns/4-ply-knitting-patterns/"
    },

    {
      name: "Orange Beauty",
      sourceBrand: "UK Alpaca",
      brands: ["UK Alpaca"],
      craft: "knit",
      usedYarns: ["UK Alpaca|Superfine Alpaca 4-Ply"],
      sourceUrl: "https://www.ukalpaca.com/products/knitting-patterns/4-ply-knitting-patterns/"
    },

    {
      name: "Precious Shawl",
      sourceBrand: "UK Alpaca",
      brands: ["UK Alpaca"],
      craft: "knit",
      project: "Shawl",
      usedYarns: ["UK Alpaca|Superfine Alpaca 4-Ply"],
      sourceUrl: "https://www.ukalpaca.com/products/knitting-patterns/4-ply-knitting-patterns/"
    },

    {
      name: "Sea Stripe Scarf",
      sourceBrand: "UK Alpaca",
      brands: ["UK Alpaca"],
      craft: "knit",
      project: "Scarf",
      usedYarns: ["UK Alpaca|Superfine Alpaca 4-Ply"],
      sourceUrl: "https://www.ukalpaca.com/products/knitting-patterns/4-ply-knitting-patterns/"
    },

    {
      name: "Serena Summer Top",
      sourceBrand: "UK Alpaca",
      brands: ["UK Alpaca"],
      craft: "knit",
      project: "Top",
      usedYarns: ["UK Alpaca|Superfine Alpaca 4-Ply"],
      sourceUrl: "https://www.ukalpaca.com/products/knitting-patterns/4-ply-knitting-patterns/"
    },

    {
      name: "Stolen Kisses Wedding Shawl",
      sourceBrand: "UK Alpaca",
      brands: ["UK Alpaca"],
      craft: "knit",
      project: "Shawl",
      usedYarns: ["UK Alpaca|Superfine Alpaca 4-Ply"],
      sourceUrl: "https://www.ukalpaca.com/products/knitting-patterns/4-ply-knitting-patterns/"
    },

    {
      name: "Tendu Sweater",
      sourceBrand: "UK Alpaca",
      brands: ["UK Alpaca"],
      craft: "knit",
      project: "Sweater",
      usedYarns: ["UK Alpaca|Superfine Alpaca 4-Ply"],
      sourceUrl: "https://www.ukalpaca.com/products/knitting-patterns/4-ply-knitting-patterns/"
    },

    {
      name: "Triangle Shawl",
      sourceBrand: "UK Alpaca",
      brands: ["UK Alpaca"],
      craft: "knit",
      project: "Shawl",
      usedYarns: ["UK Alpaca|Superfine Alpaca 4-Ply"],
      sourceUrl: "https://www.ukalpaca.com/products/knitting-patterns/4-ply-knitting-patterns/"
    },

    {
      name: "Veronica Shawl",
      sourceBrand: "UK Alpaca",
      brands: ["UK Alpaca"],
      craft: "knit",
      project: "Shawl",
      usedYarns: ["UK Alpaca|Superfine Alpaca 4-Ply"],
      sourceUrl: "https://www.ukalpaca.com/products/knitting-patterns/4-ply-knitting-patterns/"
    },

    {
      name: "Voe Shawl",
      sourceBrand: "UK Alpaca",
      brands: ["UK Alpaca"],
      craft: "knit",
      project: "Shawl",
      usedYarns: ["UK Alpaca|Superfine Alpaca 4-Ply"],
      sourceUrl: "https://www.ukalpaca.com/products/knitting-patterns/4-ply-knitting-patterns/"
    },

    {
      name: "Wrapping Blanket",
      sourceBrand: "UK Alpaca",
      brands: ["UK Alpaca"],
      craft: "knit",
      project: "Blanket",
      usedYarns: ["UK Alpaca|Superfine Alpaca 4-Ply"],
      sourceUrl: "https://www.ukalpaca.com/products/knitting-patterns/4-ply-knitting-patterns/"
    },

    {
      name: "Fair Isle Slipover",
      sourceBrand: "UK Alpaca",
      brands: ["UK Alpaca"],
      craft: "knit",
      project: "Vest",
      usedYarns: ["UK Alpaca|Superfine Alpaca DK"],
      sourceUrl: "https://www.ukalpaca.com/"
    }
  ];


  // ==========================================================
  // YARNSPIRATIONS FAMILY EXPANSION
  //
  // The master Yarnspirations file contains large family lists.
  // Convert those names into searchable yarn records even when
  // only some of them have complete technical records.
  // ==========================================================

  const yarnspirationsFamilies =
    window.YARNSPIRATIONS_YARN_FAMILIES || {};

  Object.entries(yarnspirationsFamilies).forEach(
    ([brand, names]) => {

      if (!Array.isArray(names)) return;

      names.forEach((name) => {

        if (!text(name)) return;

        const exists =
          (window.YARNSPIRATIONS_CORE_YARNS || []).some(
            (item) =>
              normalized(item.brand) === normalized(brand) &&
              normalized(item.name) === normalized(name)
          );

        if (exists) return;

        window.YARNSPIRATIONS_CORE_YARNS =
          window.YARNSPIRATIONS_CORE_YARNS || [];

        window.YARNSPIRATIONS_CORE_YARNS.push({
          brand,
          name,
          status: "current",
          sourceUrl:
            "https://www.yarnspirations.com/collections/yarn"
        });
      });
    }
  );


  // ==========================================================
  // LION BRAND FAMILY EXPANSION
  // ==========================================================

  if (Array.isArray(window.LION_BRAND_YARN_FAMILIES)) {

    window.LION_BRAND_EXPANDED_YARNS = [];

    window.LION_BRAND_YARN_FAMILIES.forEach((entry) => {

      const name =
        typeof entry === "string"
          ? entry
          : entry && entry.name;

      if (!text(name)) return;

      window.LION_BRAND_EXPANDED_YARNS.push({
        brand: "Lion Brand",
        name,
        status: "current",
        sourceUrl: "https://www.lionbrand.com/collections/yarn"
      });
    });
  }


  // ==========================================================
  // COLLECT ALL YARN ARRAYS
  // ==========================================================

  const discoveredYarns = [];

  Object.keys(window).forEach((key) => {

    const value = window[key];

    if (!Array.isArray(value)) return;

    // Only inspect catalog-ish variables.
    if (!/YARN/i.test(key)) return;

    value.forEach((item) => {

      if (looksLikeYarn(item)) {
        discoveredYarns.push({ ...item });
      }
    });
  });


  // ==========================================================
  // EXPLICIT CATALOGS WITH NONSTANDARD VARIABLE NAMES
  // ==========================================================

  [
    window.YARNSPIRATIONS_CORE_YARNS,
    window.LION_BRAND_EXPANDED_YARNS,
    window.LISE_TAILOR_YARN_CATALOG,
    window.UK_ALPACA_YARN_CATALOG
  ].forEach((catalog) => {

    if (!Array.isArray(catalog)) return;

    catalog.forEach((item) => {

      if (looksLikeYarn(item)) {
        discoveredYarns.push({ ...item });
      }
    });
  });


  // ==========================================================
  // MERGE YARNS
  //
  // Existing app/catalog data wins when it already contains
  // a field. New catalogs fill missing details.
  // ==========================================================

  const yarnMap = new Map();

  const originalYarns =
    Array.isArray(window.YARN_CATALOG)
      ? window.YARN_CATALOG
      : [];

  [...discoveredYarns, ...originalYarns].forEach((incoming) => {

    if (!looksLikeYarn(incoming)) return;

    const key = yarnKey(incoming);
    const existing = yarnMap.get(key);

    if (!existing) {
      yarnMap.set(key, { ...incoming });
      return;
    }

    yarnMap.set(key, {
      ...incoming,
      ...existing,

      image:
        existing.image ||
        incoming.image ||
        null,

      imagePage:
        existing.imagePage ||
        incoming.imagePage ||
        null,

      sourceUrl:
        existing.sourceUrl ||
        incoming.sourceUrl ||
        null,

      knitGauge:
        existing.knitGauge ||
        incoming.knitGauge,

      crochetGauge:
        existing.crochetGauge ||
        incoming.crochetGauge,

      fiber:
        existing.fiber ||
        incoming.fiber,

      weight:
        existing.weight ||
        incoming.weight,

      yards:
        existing.yards ||
        incoming.yards,

      meters:
        existing.meters ||
        incoming.meters,

      grams:
        existing.grams ||
        incoming.grams
    });
  });

  window.YARN_CATALOG =
    [...yarnMap.values()]
      .filter((item) => item.brand && item.name)
      .sort((a, b) => {

        const brandCompare =
          text(a.brand).localeCompare(text(b.brand));

        if (brandCompare !== 0) return brandCompare;

        return text(a.name).localeCompare(text(b.name));
      });


  // ==========================================================
  // COLLECT STANDALONE PATTERN ARRAYS
  //
  // Existing KFI / Knit Picks / external indexes stay separate
  // because app.js already handles those directly.
  // ==========================================================

  const skipPatternGlobals = new Set([
    "KFI_PATTERN_INDEX",
    "NOVELTY_PATTERN_CATALOG",
    "EXTERNAL_PATTERN_CATALOG",
    "KNIT_PICKS_PATTERN_CATALOG"
  ]);

  const discoveredPatterns = [];

  Object.keys(window).forEach((key) => {

    if (skipPatternGlobals.has(key)) return;

    if (!/PATTERN/i.test(key)) return;

    const value = window[key];

    if (!Array.isArray(value)) return;

    value.forEach((item) => {

      if (looksLikePattern(item)) {
        discoveredPatterns.push({ ...item });
      }
    });
  });


  // ==========================================================
  // ADD REPAIRED UK ALPACA PATTERNS
  // ==========================================================

  (window.UK_ALPACA_PATTERN_CATALOG || [])
    .forEach((pattern) => {
      discoveredPatterns.push({ ...pattern });
    });


  // ==========================================================
  // BASIC PATTERN DEDUPE BEFORE app.js
  //
  // app.js performs the deeper Ravelry / manufacturer dedupe.
  // ==========================================================

  const patternMap = new Map();

  const originalPatterns =
    Array.isArray(window.PATTERN_CATALOG)
      ? window.PATTERN_CATALOG
      : [];

  [...discoveredPatterns, ...originalPatterns]
    .forEach((pattern) => {

      if (!looksLikePattern(pattern)) return;

      const brand =
        pattern.sourceBrand ||
        pattern.brand ||
        (Array.isArray(pattern.brands)
          ? pattern.brands[0]
          : "");

      const key = [
        normalized(pattern.name),
        normalized(pattern.craft),
        normalized(brand)
      ].join("|");

      const existing = patternMap.get(key);

      if (!existing) {
        patternMap.set(key, { ...pattern });
        return;
      }

      patternMap.set(key, {
        ...pattern,
        ...existing,

        usedYarns: [
          ...new Set([
            ...(existing.usedYarns || []),
            ...(pattern.usedYarns || [])
          ])
        ],

        image:
          existing.image ||
          pattern.image,

        url:
          existing.url ||
          pattern.url,

        sourceUrl:
          existing.sourceUrl ||
          pattern.sourceUrl
      });
    });

  window.PATTERN_CATALOG =
    [...patternMap.values()];


  // ==========================================================
  // FINAL CATALOG INFORMATION
  // ==========================================================

  window.GARN_SWATCH_INTEGRATION = {

    integrated: true,

    yarnCount:
      window.YARN_CATALOG.length,

    standalonePatternCount:
      window.PATTERN_CATALOG.length,

    repairedCatalogs: [
      "Lise Tailor",
      "UK Alpaca"
    ],

    excludedBadFiles: [
      "lise-tailor-catalog.js",
      "uk-alpaca-catalog.js"
    ]
  };

})();
