// Garn Swatch — Knitting for Olive Catalog
// WHOLE-FILE REPLACEMENT
// Official source: knittingforolive.com
// Current yarn families + official pattern matching + image sources.
// Data only — no app.js/index.html changes yet.

window.KNITTING_FOR_OLIVE_BRANDS = [
  "Knitting for Olive"
];

window.KNITTING_FOR_OLIVE_YARN_CATALOG = [

  {
    brand: "Knitting for Olive",
    name: "Merino",
    status: "current",
    weight: "Fingering / Light Fingering",
    grams: 50,
    meters: 250,
    yards: 273,
    fiber: "100% Merino Wool",
    construction: "4-ply",
    needleSize: "2.5–3 mm",
    care: "Hand wash; dry flat",
    origin: "Produced in Italy",
    sourceUrl: "https://knittingforolive.com/collections/merino",
    imagePage: "https://knittingforolive.com/collections/merino"
  },

  {
    brand: "Knitting for Olive",
    name: "Heavy Merino",
    status: "current",
    weight: "DK",
    grams: 50,
    meters: 125,
    yards: 137,
    fiber: "100% Merino Wool",
    construction: "Heavy merino",
    needleSize: "4–4.5 mm",
    care: "Hand wash; dry flat",
    origin: "Produced in Italy",
    sourceUrl: "https://knittingforolive.com/collections/heavy-merino",
    imagePage: "https://knittingforolive.com/collections/heavy-merino"
  },

  {
    brand: "Knitting for Olive",
    name: "Soft Silk Mohair",
    status: "current",
    weight: "Lace",
    grams: 25,
    meters: 225,
    yards: 246,
    fiber: "70% Mohair, 30% Silk",
    construction: "Brushed mohair",
    needleSize: "Variable; often held together with another yarn",
    care: "Hand wash; dry flat",
    sourceUrl: "https://knittingforolive.com/collections/knitting-for-olive-soft-silk-mohair",
    imagePage: "https://knittingforolive.com/collections/knitting-for-olive-soft-silk-mohair"
  },

  {
    brand: "Knitting for Olive",
    name: "Pure Silk",
    status: "current",
    weight: "Fingering / Sport",
    grams: 50,
    meters: 250,
    yards: 273,
    fiber: "100% Bourette Silk",
    construction: "Spun silk",
    needleSize: "3 mm",
    care: "Hand wash; dry flat",
    sourceUrl: "https://knittingforolive.com/collections/pure-silk",
    imagePage: "https://knittingforolive.com/collections/pure-silk"
  },

  {
    brand: "Knitting for Olive",
    name: "Cotton Merino",
    status: "current",
    weight: "Fingering / Sport",
    grams: 50,
    meters: 250,
    yards: 273,
    fiber: "70% Organic Cotton, 30% Merino Wool",
    needleSize: "3 mm",
    care: "Hand wash; dry flat",
    sourceUrl: "https://knittingforolive.com/collections/cotton-merino",
    imagePage: "https://knittingforolive.com/collections/cotton-merino"
  },

  {
    brand: "Knitting for Olive",
    name: "Compatible Cashmere",
    status: "current",
    weight: "Lace",
    grams: 25,
    meters: 187,
    yards: 204,
    fiber: "100% Cashmere",
    construction: "Companion yarn",
    needleSize: "Variable; designed to be held with another yarn",
    care: "Hand wash; dry flat",
    sourceUrl: "https://knittingforolive.com/collections/compatible-cashmere",
    imagePage: "https://knittingforolive.com/collections/compatible-cashmere"
  },

  {
    brand: "Knitting for Olive",
    name: "No Waste Wool",
    status: "current",
    weight: "DK",
    grams: 50,
    meters: 125,
    yards: 137,
    fiber: "50% Recycled Wool, 50% Merino Wool",
    needleSize: "4–4.5 mm",
    care: "Hand wash; dry flat",
    sourceUrl: "https://knittingforolive.com/collections/no-waste-wool",
    imagePage: "https://knittingforolive.com/collections/no-waste-wool"
  }
];


// ============================================================
// OFFICIAL YARN COMBINATIONS
//
// Knitting for Olive specifically supports these yarn combinations.
// This is important for Garn Swatch's two-yarns-held-together search.
// ============================================================

window.KNITTING_FOR_OLIVE_YARN_COMBINATIONS = [

  {
    yarn1: "Knitting for Olive|Merino",
    yarn2: "Knitting for Olive|Soft Silk Mohair",
    relationship: "official-compatible",
    sourceUrl:
      "https://knittingforolive.com/pages/match-merino-with-soft-silk-mohair"
  },

  {
    yarn1: "Knitting for Olive|Merino",
    yarn2: "Knitting for Olive|Compatible Cashmere",
    relationship: "official-compatible",
    sourceUrl:
      "https://knittingforolive.com/pages/match-merino-with-compatible-cashmere"
  },

  {
    yarn1: "Knitting for Olive|Heavy Merino",
    yarn2: "Knitting for Olive|Soft Silk Mohair",
    relationship: "official-compatible",
    sourceUrl:
      "https://knittingforolive.com/pages/match-heavy-merino-with-soft-silk-mohair"
  },

  {
    yarn1: "Knitting for Olive|Heavy Merino",
    yarn2: "Knitting for Olive|Compatible Cashmere",
    relationship: "official-compatible",
    sourceUrl:
      "https://knittingforolive.com/pages/match-heavy-merino-with-compatible-cashmere"
  }
];


// ============================================================
// OFFICIAL PATTERN CATALOG
//
// Knitting for Olive has a large changing pattern library.
// Instead of freezing an incomplete list of pattern names,
// Garn Swatch uses the official yarn-specific pattern collections.
// This prevents us from losing patterns when KFO adds new designs.
// ============================================================

window.KNITTING_FOR_OLIVE_PATTERN_CATALOG = [

  {
    name: "Knitting for Olive — Merino Patterns",
    craft: "knit",
    project: "Multiple",
    sourceBrand: "Knitting for Olive",
    brands: ["Knitting for Olive"],

    usedYarns: [
      "Knitting for Olive|Merino"
    ],

    patternCollection: true,

    url:
      "https://knittingforolive.com/collections/all-patterns",

    imagePage:
      "https://knittingforolive.com/collections/all-patterns"
  },

  {
    name: "Knitting for Olive — Merino + Soft Silk Mohair Patterns",
    craft: "knit",
    project: "Multiple",
    sourceBrand: "Knitting for Olive",
    brands: ["Knitting for Olive"],

    usedYarns: [
      "Knitting for Olive|Merino",
      "Knitting for Olive|Soft Silk Mohair"
    ],

    heldTogether: true,
    patternCollection: true,

    url:
      "https://knittingforolive.com/collections/all-patterns",

    imagePage:
      "https://knittingforolive.com/collections/all-patterns"
  },

  {
    name: "Knitting for Olive — Heavy Merino Patterns",
    craft: "knit",
    project: "Multiple",
    sourceBrand: "Knitting for Olive",
    brands: ["Knitting for Olive"],

    usedYarns: [
      "Knitting for Olive|Heavy Merino"
    ],

    patternCollection: true,

    url:
      "https://knittingforolive.com/collections/all-patterns",

    imagePage:
      "https://knittingforolive.com/collections/all-patterns"
  },

  {
    name: "Knitting for Olive — Heavy Merino + Soft Silk Mohair Patterns",
    craft: "knit",
    project: "Multiple",
    sourceBrand: "Knitting for Olive",
    brands: ["Knitting for Olive"],

    usedYarns: [
      "Knitting for Olive|Heavy Merino",
      "Knitting for Olive|Soft Silk Mohair"
    ],

    heldTogether: true,
    patternCollection: true,

    url:
      "https://knittingforolive.com/collections/all-patterns",

    imagePage:
      "https://knittingforolive.com/collections/all-patterns"
  },

  {
    name: "Knitting for Olive — Pure Silk Patterns",
    craft: "knit",
    project: "Multiple",
    sourceBrand: "Knitting for Olive",
    brands: ["Knitting for Olive"],

    usedYarns: [
      "Knitting for Olive|Pure Silk"
    ],

    patternCollection: true,

    url:
      "https://knittingforolive.com/collections/all-patterns",

    imagePage:
      "https://knittingforolive.com/collections/all-patterns"
  },

  {
    name: "Knitting for Olive — Cotton Merino Patterns",
    craft: "knit",
    project: "Multiple",
    sourceBrand: "Knitting for Olive",
    brands: ["Knitting for Olive"],

    usedYarns: [
      "Knitting for Olive|Cotton Merino"
    ],

    patternCollection: true,

    url:
      "https://knittingforolive.com/collections/all-patterns",

    imagePage:
      "https://knittingforolive.com/collections/all-patterns"
  },

  {
    name: "Knitting for Olive — No Waste Wool Patterns",
    craft: "knit",
    project: "Multiple",
    sourceBrand: "Knitting for Olive",
    brands: ["Knitting for Olive"],

    usedYarns: [
      "Knitting for Olive|No Waste Wool"
    ],

    patternCollection: true,

    url:
      "https://knittingforolive.com/collections/all-patterns",

    imagePage:
      "https://knittingforolive.com/collections/all-patterns"
  },

  {
    name: "Knitting for Olive — Compatible Cashmere Patterns",
    craft: "knit",
    project: "Multiple",
    sourceBrand: "Knitting for Olive",
    brands: ["Knitting for Olive"],

    usedYarns: [
      "Knitting for Olive|Compatible Cashmere"
    ],

    patternCollection: true,

    url:
      "https://knittingforolive.com/collections/all-patterns",

    imagePage:
      "https://knittingforolive.com/collections/all-patterns"
  }
];


// ============================================================
// PATTERN FILTER MAP
//
// The official KFO pattern library exposes these yarn filters.
// Garn Swatch can use these exact values when matching yarn → pattern.
// ============================================================

window.KNITTING_FOR_OLIVE_PATTERN_FILTERS = {

  merino: {
    label: "Merino",
    yarns: [
      "Knitting for Olive|Merino"
    ]
  },

  merinoMohair: {
    label: "Merino + Soft Silk Mohair",
    yarns: [
      "Knitting for Olive|Merino",
      "Knitting for Olive|Soft Silk Mohair"
    ],
    heldTogether: true
  },

  heavyMerino: {
    label: "Heavy Merino",
    yarns: [
      "Knitting for Olive|Heavy Merino"
    ]
  },

  heavyMerinoMohair: {
    label: "Heavy Merino + Soft Silk Mohair",
    yarns: [
      "Knitting for Olive|Heavy Merino",
      "Knitting for Olive|Soft Silk Mohair"
    ],
    heldTogether: true
  },

  pureSilk: {
    label: "Pure Silk",
    yarns: [
      "Knitting for Olive|Pure Silk"
    ]
  },

  cottonMerino: {
    label: "Cotton Merino",
    yarns: [
      "Knitting for Olive|Cotton Merino"
    ]
  },

  noWasteWool: {
    label: "No Waste Wool",
    yarns: [
      "Knitting for Olive|No Waste Wool"
    ]
  },

  compatibleCashmere: {
    label: "Compatible Cashmere",
    yarns: [
      "Knitting for Olive|Compatible Cashmere"
    ]
  }
};


// ============================================================
// SKEIN / BALL ESTIMATES
//
// General Garn Swatch estimates.
// These are NOT claimed to be requirements for a specific KFO pattern.
// ============================================================

window.KNITTING_FOR_OLIVE_SKEIN_ESTIMATES = {

  "Merino": {
    hat: "1–2 balls",
    cowl: "1–2 balls",
    scarf: "2–4 balls",
    mittens: "1–2 balls",
    babySweater: "2–4 balls",
    adultSweater: "5–9+ balls"
  },

  "Heavy Merino": {
    hat: "1–2 balls",
    cowl: "2 balls",
    scarf: "3–5 balls",
    mittens: "2 balls",
    babySweater: "3–5 balls",
    adultSweater: "8–12+ balls"
  },

  "Soft Silk Mohair": {
    hat: "1–2 balls",
    cowl: "1–2 balls",
    scarf: "2–4 balls",
    shawl: "2–5 balls",
    adultSweater: "4–8+ balls"
  },

  "Pure Silk": {
    hat: "1–2 balls",
    cowl: "1–2 balls",
    scarf: "2–4 balls",
    shawl: "2–5 balls",
    babySweater: "2–4 balls",
    adultTop: "4–8+ balls"
  },

  "Cotton Merino": {
    hat: "1–2 balls",
    cowl: "1–2 balls",
    scarf: "2–4 balls",
    babySweater: "2–4 balls",
    adultTop: "4–8+ balls",
    adultSweater: "5–9+ balls"
  },

  "Compatible Cashmere": {
    companionYarn: "Hold with Merino or Heavy Merino",
    hat: "1–2 balls",
    cowl: "1–2 balls",
    scarf: "2–4 balls",
    adultSweater: "4–8+ balls"
  },

  "No Waste Wool": {
    hat: "1–2 balls",
    cowl: "2 balls",
    scarf: "3–5 balls",
    mittens: "2 balls",
    babySweater: "3–5 balls",
    adultSweater: "8–12+ balls"
  }
};


// ============================================================
// IMAGE SOURCES
//
// These official collection/product pages contain KFO's photography.
// Pattern cards should use the individual pattern image when imported.
// ============================================================

window.KNITTING_FOR_OLIVE_IMAGE_SOURCES = {

  yarns: {

    Merino:
      "https://knittingforolive.com/collections/merino",

    HeavyMerino:
      "https://knittingforolive.com/collections/heavy-merino",

    SoftSilkMohair:
      "https://knittingforolive.com/collections/knitting-for-olive-soft-silk-mohair",

    PureSilk:
      "https://knittingforolive.com/collections/pure-silk",

    CottonMerino:
      "https://knittingforolive.com/collections/cotton-merino",

    CompatibleCashmere:
      "https://knittingforolive.com/collections/compatible-cashmere",

    NoWasteWool:
      "https://knittingforolive.com/collections/no-waste-wool"
  },

  patterns: {
    all:
      "https://knittingforolive.com/collections/all-patterns",

    adults:
      "https://knittingforolive.com/collections/adults-patterns",

    kidsAndBabies:
      "https://knittingforolive.com/collections/kids-and-babies-patterns"
  }
};


// ============================================================
// BRAND-SPECIFIC MATCHING RULES
// ============================================================

window.KNITTING_FOR_OLIVE_MATCHING_RULES = {

  exactYarnFirst: true,

  supportHeldTogether: true,

  heldTogetherPairs: [
    [
      "Knitting for Olive|Merino",
      "Knitting for Olive|Soft Silk Mohair"
    ],
    [
      "Knitting for Olive|Heavy Merino",
      "Knitting for Olive|Soft Silk Mohair"
    ],
    [
      "Knitting for Olive|Merino",
      "Knitting for Olive|Compatible Cashmere"
    ],
    [
      "Knitting for Olive|Heavy Merino",
      "Knitting for Olive|Compatible Cashmere"
    ]
  ],

  patternMatchOrder: [
    "exact-yarn",
    "exact-held-together-combination",
    "gauge-compatible",
    "weight-compatible"
  ]
};


// ============================================================
// SOURCE MANIFEST
// ============================================================

window.KNITTING_FOR_OLIVE_CATALOG_SOURCES = {

  officialSite:
    "https://knittingforolive.com/",

  yarnOverview:
    "https://knittingforolive.com/pages/yarn-overview",

  yarn:
    "https://knittingforolive.com/collections/yarn",

  patterns:
    "https://knittingforolive.com/collections/all-patterns",

  colorMatch:
    "https://knittingforolive.com/pages/match-heavy-merino-with-soft-silk-mohair"
};
