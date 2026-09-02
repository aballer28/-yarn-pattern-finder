// ============================================================
// GARN SWATCH — YARNSPIRATIONS MASTER CATALOG
// WHOLE FILE
//
// Filename: yarnspirations-catalog.js
//
// Brands:
//   Bernat
//   Caron
//   Lily Sugar'n Cream
//   Patons
//   Phentex
//   Red Heart
//   Peaches & Creme
//
// PURPOSE
// ------------------------------------------------------------
// One authoritative Yarnspirations source file.
//
// IMPORTANT:
// - Brands remain separate in the Garn Swatch brand dropdown.
// - Yarnspirations is the SOURCE, not the customer-facing brand.
// - Red Heart's old separate catalog must NOT create duplicates.
// - Michaels/JOANN entries for these brands are retailer
//   references only.
// - Current + discontinued/legacy yarns are supported.
// - Knit + crochet patterns are supported.
// - Exact yarn → pattern matches rank first.
// - Pictures come from official Yarnspirations product/pattern
//   pages whenever available.
// ============================================================


// ============================================================
// MASTER
// ============================================================

window.YARNSPIRATIONS_MASTER = {

  sourceName: "Yarnspirations",

  sourceUrl:
    "https://www.yarnspirations.com/",

  brands: [
    "Bernat",
    "Caron",
    "Lily Sugar'n Cream",
    "Patons",
    "Phentex",
    "Red Heart",
    "Peaches & Creme"
  ],

  crafts: [
    "knit",
    "crochet"
  ],

  exactYarnMatching: true,
  gaugeMatching: true,
  weightMatching: true,
  yardageMatching: true,
  legacySupport: true,
  imageSupport: true,

  retailerIsNotBrand: true
};


// ============================================================
// BRAND DEFINITIONS
// ============================================================

window.YARNSPIRATIONS_BRANDS = [

  {
    brand: "Bernat",
    source: "Yarnspirations",
    current: true
  },

  {
    brand: "Caron",
    source: "Yarnspirations",
    current: true
  },

  {
    brand: "Lily Sugar'n Cream",
    source: "Yarnspirations",
    current: true
  },

  {
    brand: "Patons",
    source: "Yarnspirations",
    current: true
  },

  {
    brand: "Phentex",
    source: "Yarnspirations",
    current: true
  },

  {
    brand: "Red Heart",
    source: "Yarnspirations",
    current: true
  },

  {
    brand: "Peaches & Creme",
    source: "Yarnspirations",
    current: true
  }
];


// ============================================================
// CURRENT / SEARCHABLE YARN FAMILIES
// ============================================================

window.YARNSPIRATIONS_YARN_FAMILIES = {


  // ==========================================================
  // BERNAT
  // ==========================================================

  "Bernat": [

    "Blanket",
    "Blanket Brights",
    "Blanket Extra",
    "Blanket Extra Thick",
    "Blanket Big",
    "Blanket Perfect Phasing",
    "Blanket O'Go",
    "Blanket Speckle",
    "Blanket Tweeds",

    "Baby Blanket",
    "Baby Blanket Sparkle",
    "Baby Blanket Stripes",
    "Baby Blanket Dappled",
    "Baby Blanket O'Go",

    "Softee Baby",
    "Softee Baby Cotton",
    "Softee Baby Chunky",

    "Softee Chunky",

    "Softee Cotton",

    "Maker",
    "Maker Home Dec",

    "Velvet",
    "Baby Velvet",

    "Pipsqueak",
    "Pipsqueak Stripes",

    "Forever Fleece",
    "Forever Fleece Finer",

    "Fluffee",

    "Plush",

    "Lattice",

    "Harmony",

    "Future",
    "Future Hope",

    "Wavelength",

    "Macrame",

    "Handicrafter Cotton",

    "Premium",

    "Super Value"
  ],


  // ==========================================================
  // CARON
  // ==========================================================

  "Caron": [

    "Simply Soft",
    "Simply Soft Speckle",
    "Simply Soft Tweeds",
    "Simply Soft Paints",

    "Simply Me",

    "One Pound",

    "Jumbo",

    "Colorama Halo",
    "Colorama Halo O'Go",

    "Colorama Bamboo Blend",

    "Cinnamon Swirl Cakes",

    "Chunky Cakes",

    "Cotton Cakes",

    "Cotton Ripple Cakes",

    "Cotton Angel Cakes",

    "Cotton Cupcakes",

    "Cloud Cakes",

    "Blossom Cakes",

    "Latte Cakes",

    "Macchiato Cakes",

    "Anniversary Cakes",

    "Big Cakes",

    "Baby Cakes",

    "Cakes",

    "Skinny Cakes",

    "Tea Cakes",

    "Crystal Cakes",

    "Ripple Cakes",

    "Simply Soft O'Go"
  ],


  // ==========================================================
  // LILY SUGAR'N CREAM
  // ==========================================================

  "Lily Sugar'n Cream": [

    "Original",
    "Solids",
    "Ombres",
    "Stripes",

    "Super Size",
    "Super Size Ombres",

    "Cone",

    "Scrub Off",

    "The Original",

    "Big Ball"
  ],


  // ==========================================================
  // PATONS
  // ==========================================================

  "Patons": [

    "Classic Wool Worsted",
    "Classic Wool Roving",

    "Kroy Socks",

    "Grace",

    "Canadiana",

    "Astra",

    "Linen",

    "Inspired",

    "Shetland Chunky",

    "Décor",

    "North America",

    "Silk Bamboo",

    "Alpaca Blend",

    "Highland Bulky",

    "Highland Bulky Tweeds"
  ],


  // ==========================================================
  // PHENTEX
  // ==========================================================

  "Phentex": [

    "Slipper & Craft",

    "Worsted",

    "Sport",

    "Chunky",

    "Merit",

    "Craft & Slipper"
  ],


  // ==========================================================
  // RED HEART
  // ==========================================================

  "Red Heart": [

    "Super Saver",
    "Super Saver Jumbo",
    "Super Saver Ombre",
    "Super Saver Stripes",
    "Super Saver Bitty Stripes",
    "Super Saver Jazzy",
    "Super Saver Pooling",
    "Super Saver Brushed",
    "Super Saver Metallic",
    "Super Saver O'Go",

    "All In One Granny Square",
    "All In One Flower Power",
    "All In One Quilt Motif",
    "All In One Sweet Hearts",

    "Soft",
    "Soft Essentials",

    "Comfort",

    "With Love",
    "With Love Metallic",
    "With Love Stripes",

    "Roll With It Melange",
    "Roll With It Sparkle",
    "Roll With It Tweed",

    "Cotton Breeze",

    "Scrubby",
    "Scrubby Cotton",
    "Scrubby Sparkle",
    "Scrubby Smoothie",

    "Hygge",
    "Hygge Fur",

    "Heat Wave",

    "Unforgettable",

    "Dreamy",
    "Dreamy Stripes",

    "Amore",

    "Gemstone",

    "Croquette",

    "Fashion Soft",

    "It's A Wrap",
    "It's A Wrap Rainbow",
    "It's A Wrap Sprinkles",
    "It's A Wrap Hues",

    "Loop-It",

    "Grande",

    "Reflective",

    "Sweet Home",

    "Baby Hugs",
    "Baby Hugs Light",
    "Baby Hugs Medium",

    "Soft Baby Steps",
    "Soft Baby Steps Prints",

    "Heart & Sole",

    "Classic",

    "Sport"
  ],


  // ==========================================================
  // PEACHES & CREME
  // ==========================================================

  "Peaches & Creme": [

    "Original",
    "Solids",
    "Ombres",
    "Stripes",

    "Cone",

    "Big Ball"
  ]
};


// ============================================================
// IMPORTANT VERIFIED / CORE YARN RECORDS
//
// These are structured records Garn Swatch can use directly.
//
// The live Yarnspirations catalog remains authoritative for
// products/colors that change over time.
// ============================================================

window.YARNSPIRATIONS_CORE_YARNS = [


  // ==========================================================
  // RED HEART
  // ==========================================================

  {
    brand: "Red Heart",
    name: "Super Saver",
    status: "current",

    weight: "Medium / Worsted",
    cycWeight: 4,

    fiber: "100% Acrylic",

    washable: true,

    sourceUrl:
      "https://www.yarnspirations.com/products/red-heart-super-saver-yarn",

    imagePage:
      "https://www.yarnspirations.com/products/red-heart-super-saver-yarn"
  },


  {
    brand: "Red Heart",
    name: "Super Saver Bitty Stripes",
    status: "current",

    weight: "Medium / Worsted",
    cycWeight: 4,

    grams: 283,
    ounces: 10,

    fiberFamily: "Acrylic",

    sourceUrl:
      "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Red+Heart",

    imagePage:
      "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Red+Heart"
  },


  {
    brand: "Red Heart",
    name: "Super Saver Jazzy",
    status: "current",

    weight: "Medium / Worsted",
    cycWeight: 4,

    grams: 250,
    ounces: 8.8,

    fiberFamily: "Acrylic",

    sourceUrl:
      "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Red+Heart",

    imagePage:
      "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Red+Heart"
  },


  {
    brand: "Red Heart",
    name: "All In One Granny Square",
    status: "current",

    grams: 250,
    ounces: 8.8,

    engineeredColorChange: true,

    preferredCraft: "crochet",

    projectType:
      "Granny Square",

    sourceUrl:
      "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Red+Heart",

    imagePage:
      "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Red+Heart"
  },


  // ==========================================================
  // BERNAT
  // ==========================================================

  {
    brand: "Bernat",
    name: "Blanket",
    status: "current",

    weight: "Super Bulky",
    cycWeight: 6,

    fiberFamily: "Polyester",

    washable: true,

    projectTypes: [
      "Blanket",
      "Baby Blanket",
      "Pillow",
      "Home Decor",
      "Plush"
    ],

    sourceUrl:
      "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Bernat",

    imagePage:
      "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Bernat"
  },


  {
    brand: "Bernat",
    name: "Baby Blanket",
    status: "current",

    weight: "Super Bulky",
    cycWeight: 6,

    fiberFamily: "Polyester",

    washable: true,

    projectTypes: [
      "Baby Blanket",
      "Baby Accessories",
      "Plush"
    ],

    sourceUrl:
      "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Bernat",

    imagePage:
      "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Bernat"
  },


  {
    brand: "Bernat",
    name: "Future Hope",
    status: "current",

    grams: 170,
    ounces: 6,

    sourceUrl:
      "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Bernat",

    imagePage:
      "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Bernat"
  },


  // ==========================================================
  // CARON
  // ==========================================================

  {
    brand: "Caron",
    name: "Simply Soft",
    status: "current",

    weight: "Medium / Worsted",
    cycWeight: 4,

    fiberFamily: "Acrylic",

    washable: true,

    projectTypes: [
      "Sweater",
      "Cardigan",
      "Hat",
      "Scarf",
      "Blanket",
      "Baby"
    ],

    sourceUrl:
      "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Caron",

    imagePage:
      "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Caron"
  },


  {
    brand: "Caron",
    name: "One Pound",
    status: "current",

    weight: "Medium / Worsted",
    cycWeight: 4,

    fiberFamily: "Acrylic",

    largeSkein: true,

    projectTypes: [
      "Blanket",
      "Sweater",
      "Cardigan",
      "Home Decor"
    ],

    sourceUrl:
      "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Caron",

    imagePage:
      "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Caron"
  },


  {
    brand: "Caron",
    name: "Simply Me",
    status: "current",

    grams: 160,
    ounces: 5.64,

    sourceUrl:
      "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Caron",

    imagePage:
      "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Caron"
  },


  // ==========================================================
  // LILY SUGAR'N CREAM
  // ==========================================================

  {
    brand: "Lily Sugar'n Cream",
    name: "Original",
    status: "current",

    weight: "Medium / Worsted",
    cycWeight: 4,

    fiber: "100% Cotton",

    projectTypes: [
      "Dishcloth",
      "Washcloth",
      "Potholder",
      "Market Bag",
      "Home Decor",
      "Summer Accessories"
    ],

    sourceUrl:
      "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Lily+Sugar%27n+Cream",

    imagePage:
      "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Lily+Sugar%27n+Cream"
  },


  // ==========================================================
  // PATONS
  // ==========================================================

  {
    brand: "Patons",
    name: "Classic Wool Worsted",
    status: "current",

    weight: "Medium / Worsted",
    cycWeight: 4,

    fiberFamily: "Wool",

    feltable: true,

    projectTypes: [
      "Sweater",
      "Hat",
      "Mittens",
      "Scarf",
      "Felting"
    ],

    sourceUrl:
      "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Patons",

    imagePage:
      "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Patons"
  },


  {
    brand: "Patons",
    name: "Kroy Socks",
    status: "current",

    weight: "Super Fine / Fingering / Sock",
    cycWeight: 1,

    projectTypes: [
      "Socks",
      "Mittens",
      "Light Accessories"
    ],

    sourceUrl:
      "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Patons",

    imagePage:
      "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Patons"
  },


  // ==========================================================
  // PEACHES & CREME
  // ==========================================================

  {
    brand: "Peaches & Creme",
    name: "Original",
    status: "current",

    weight: "Medium / Worsted",
    cycWeight: 4,

    fiberFamily: "Cotton",

    projectTypes: [
      "Dishcloth",
      "Washcloth",
      "Kitchen",
      "Bag",
      "Home Decor"
    ],

    sourceUrl:
      "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Peaches+%26+Creme",

    imagePage:
      "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Peaches+%26+Creme"
  },


  // ==========================================================
  // PHENTEX
  // ==========================================================

  {
    brand: "Phentex",
    name: "Slipper & Craft",
    status: "current",

    projectTypes: [
      "Slippers",
      "Craft",
      "Home Decor"
    ],

    sourceUrl:
      "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Phentex",

    imagePage:
      "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Phentex"
  }
];


// ============================================================
// LEGACY / DISCONTINUED SUPPORT
//
// Yarnspirations notes that yarns missing from its current
// offering may be discontinued or retailer-exclusive.
//
// Garn Swatch should NOT erase those yarns from stash search.
// ============================================================

window.YARNSPIRATIONS_LEGACY_RULES = {

  searchable: true,

  preserveBrand: true,

  preserveOriginalName: true,

  preserveOriginalWeight: true,

  preserveOriginalGauge: true,

  preserveOriginalYardage: true,

  preserveOriginalFiber: true,

  preserveOriginalImage: true,

  preserveOriginalPatterns: true,

  allowCurrentSubstitutions: true,

  statusLabel:
    "Discontinued / Legacy",

  substitutionLabel:
    "Compatible current yarns"
};


// ============================================================
// LEGACY FAMILY INDEX
// ============================================================

window.YARNSPIRATIONS_LEGACY_FAMILIES = {


  "Red Heart": [

    "Baby Clouds",
    "Baby Econo",
    "Baby Sheen",
    "Baby TLC",

    "Bright & Lofty",

    "Buttercup",

    "Casual Cot'n",

    "Celebration",

    "Celestial",

    "Cordial",

    "Dazzling",

    "Eco-Cotton",
    "Eco-Cotton Blend",
    "Eco-Ways",
    "Eco-Ways Bamboo Wool",

    "Fiesta",

    "Foxy",

    "Heart & Sole with Aloe",

    "Holiday",

    "Jeweltones",

    "Light & Lofty",

    "LusterSheen",

    "Miami",

    "Moon & Stars",

    "Pompadour",

    "Sashay",

    "Shimmer",

    "Symphony",

    "TLC Amore",
    "TLC Baby",
    "TLC Cotton Plus",
    "TLC Essentials",

    "Team Spirit",

    "Treasure",

    "Velvety"
  ],


  "Bernat": [

    "Boa",

    "Camouflage",

    "Cashmere",

    "Cottontots",

    "Denimstyle",

    "Disco",

    "Envy",

    "Felting Natural Wool",

    "Glow in the Dark",

    "Jacquards",

    "LuLu",

    "Matrix",

    "Mosaic",

    "Natural Blends",

    "Satin",

    "Solo",

    "Soy",

    "Twist",

    "Waverly"
  ],


  "Caron": [

    "Country",

    "Dazzleaire",

    "Glimmer",

    "Jewel Box",

    "Natura",

    "Perfect Match",

    "Spa",

    "Simply Soft Eco",

    "Simply Soft Light",

    "United",

    "Wintuk"
  ],


  "Patons": [

    "Allure",

    "Angora Bamboo",

    "Bamboo Silk",

    "Bohemian",

    "Brilliant",

    "Classic Merino",

    "Divine",

    "Lace",

    "Melody",

    "Mosaic",

    "Nuance",

    "Pirouette",

    "Rumor",

    "SWS",

    "Stretch Socks",

    "Tweed Style",

    "Wool Blend Aran"
  ],


  "Lily Sugar'n Cream": [

    "Scents",

    "Twists",

    "Stripes",

    "Denim",

    "Naturally",

    "Country Colors"
  ],


  "Peaches & Creme": [],

  "Phentex": []
};


// ============================================================
// LIVE PATTERN CATALOGS
//
// Yarnspirations maintains the pattern library.
//
// DO NOT hard-code only 20 patterns and call that the catalog.
// Use the brand-specific live pattern source.
// ============================================================

window.YARNSPIRATIONS_PATTERN_CATALOGS = {


  "Bernat": {

    crafts: [
      "knit",
      "crochet"
    ],

    freePatterns: true,

    sourceUrl:
      "https://www.yarnspirations.com/collections/patterns?filter.p.vendor=Bernat"
  },


  "Caron": {

    crafts: [
      "knit",
      "crochet"
    ],

    freePatterns: true,

    sourceUrl:
      "https://www.yarnspirations.com/collections/patterns?filter.p.vendor=Caron"
  },


  "Lily Sugar'n Cream": {

    crafts: [
      "knit",
      "crochet"
    ],

    freePatterns: true,

    sourceUrl:
      "https://www.yarnspirations.com/collections/patterns?filter.p.vendor=Lily+Sugar%27n+Cream"
  },


  "Patons": {

    crafts: [
      "knit",
      "crochet"
    ],

    freePatterns: true,

    sourceUrl:
      "https://www.yarnspirations.com/collections/patterns?filter.p.vendor=Patons"
  },


  "Phentex": {

    crafts: [
      "knit",
      "crochet"
    ],

    freePatterns: true,

    sourceUrl:
      "https://www.yarnspirations.com/collections/patterns?filter.p.vendor=Phentex"
  },


  "Red Heart": {

    crafts: [
      "knit",
      "crochet"
    ],

    freePatterns: true,

    sourceUrl:
      "https://www.yarnspirations.com/collections/patterns?filter.p.vendor=Red+Heart"
  },


  "Peaches & Creme": {

    crafts: [
      "knit",
      "crochet"
    ],

    freePatterns: true,

    sourceUrl:
      "https://www.yarnspirations.com/collections/patterns?filter.p.vendor=Peaches+%26+Creme"
  }
};


// ============================================================
// GLOBAL PATTERN SOURCE
// ============================================================

window.YARNSPIRATIONS_ALL_PATTERNS = {

  sourceUrl:
    "https://www.yarnspirations.com/collections/patterns",

  crafts: [
    "knit",
    "crochet"
  ],

  freePatterns: true,

  patternCount:
    "11000+"
};


// ============================================================
// PATTERN IMPORT FIELDS
//
// When pattern records are imported, retain ALL of this.
// ============================================================

window.YARNSPIRATIONS_PATTERN_IMPORT_FIELDS = [

  "brand",

  "name",

  "craft",

  "project",

  "skillLevel",

  "image",

  "sizes",

  "usedYarns",

  "yarnAmounts",

  "ballsBySize",

  "yardageBySize",

  "gauge",

  "needleSize",

  "hookSize",

  "free",

  "pdfUrl",

  "sourceUrl"
];


// ============================================================
// YARN → PATTERN MATCHING
// ============================================================

window.YARNSPIRATIONS_MATCHING_RULES = {

  exactYarnFirst: true,

  exactPatternYarnFirst: true,

  sameBrandSecond: true,

  includeKnitting: true,

  includeCrochet: true,

  includeLegacyYarns: true,

  allowCrossBrandMatches: true,

  allowSubstitutions: true,

  matchOrder: [

    "exact-yarn",

    "exact-yarn-family",

    "same-brand-same-gauge",

    "same-gauge",

    "same-weight",

    "yardage-compatible",

    "fiber-compatible"
  ]
};


// ============================================================
// COMPATIBILITY SCORING
//
// Used for Garn Swatch's percentage match.
// ============================================================

window.YARNSPIRATIONS_COMPATIBILITY = {

  exactYarn: 100,

  sameFamily: 95,

  sameGaugeAndWeight: 90,

  sameGauge: 85,

  sameWeightAndSimilarFiber: 80,

  sameWeight: 70,

  yardageOnly: 50,

  incompatible: 0
};


// ============================================================
// SPECIAL ENGINEERED YARNS
// ============================================================

window.YARNSPIRATIONS_ENGINEERED_YARNS = {


  "Red Heart|All In One Granny Square": {

    preferredCraft: "crochet",

    motif:
      "granny-square",

    prioritizeExactPatterns: true
  },


  "Red Heart|All In One Flower Power": {

    preferredCraft: "crochet",

    motif:
      "flower",

    prioritizeExactPatterns: true
  },


  "Red Heart|All In One Quilt Motif": {

    preferredCraft: "crochet",

    motif:
      "quilt",

    prioritizeExactPatterns: true
  },


  "Red Heart|All In One Sweet Hearts": {

    preferredCraft: "crochet",

    motif:
      "heart",

    prioritizeExactPatterns: true
  }
};


// ============================================================
// WHAT CAN I MAKE?
//
// GENERAL Garn Swatch skein estimates.
//
// Exact pattern requirements ALWAYS override these.
// ============================================================

window.YARNSPIRATIONS_SKEIN_ESTIMATES = {


  1: {

    label:
      "Super Fine / Fingering",

    "1-2": [
      "Socks",
      "Hat",
      "Mittens",
      "Small Cowl"
    ],

    "2-4": [
      "Scarf",
      "Baby Sweater",
      "Shawl"
    ],

    "4+": [
      "Top",
      "Sweater",
      "Large Shawl"
    ]
  },


  2: {

    label:
      "Fine / Sport",

    "1-2": [
      "Hat",
      "Mittens",
      "Cowl"
    ],

    "2-4": [
      "Scarf",
      "Baby Sweater",
      "Small Shawl"
    ],

    "4+": [
      "Top",
      "Sweater"
    ]
  },


  3: {

    label:
      "Light / DK",

    "1-2": [
      "Hat",
      "Mittens",
      "Cowl"
    ],

    "2-4": [
      "Scarf",
      "Baby Sweater",
      "Small Shawl"
    ],

    "4+": [
      "Vest",
      "Sweater",
      "Cardigan"
    ]
  },


  4: {

    label:
      "Medium / Worsted",

    "1-2": [
      "Hat",
      "Mittens",
      "Cowl"
    ],

    "2-4": [
      "Scarf",
      "Baby Sweater",
      "Bag",
      "Pillow"
    ],

    "4-7": [
      "Vest",
      "Child Sweater",
      "Small Adult Sweater"
    ],

    "7+": [
      "Adult Sweater",
      "Cardigan",
      "Blanket",
      "Afghan"
    ]
  },


  5: {

    label:
      "Bulky",

    "1-2": [
      "Hat",
      "Cowl",
      "Mittens"
    ],

    "2-4": [
      "Scarf",
      "Baby Sweater",
      "Pillow"
    ],

    "4+": [
      "Sweater",
      "Blanket"
    ]
  },


  6: {

    label:
      "Super Bulky",

    "1": [
      "Hat",
      "Small Cowl"
    ],

    "2-3": [
      "Scarf",
      "Pillow",
      "Baby Blanket"
    ],

    "4-7": [
      "Lap Blanket",
      "Large Pillow"
    ],

    "8+": [
      "Throw",
      "Blanket"
    ]
  },


  7: {

    label:
      "Jumbo",

    "1-2": [
      "Cowl",
      "Small Home Decor"
    ],

    "2-4": [
      "Pillow"
    ],

    "4+": [
      "Blanket",
      "Large Home Decor"
    ]
  }
};


// ============================================================
// COTTON PROJECT OVERRIDES
// ============================================================

window.YARNSPIRATIONS_COTTON_PROJECTS = {

  preferredProjects: [

    "Dishcloth",

    "Washcloth",

    "Potholder",

    "Market Bag",

    "Tote",

    "Kitchen",

    "Baby",

    "Summer Top",

    "Home Decor"
  ],

  brands: [

    "Lily Sugar'n Cream",

    "Peaches & Creme"
  ]
};


// ============================================================
// PROJECT FILTERS
// ============================================================

window.YARNSPIRATIONS_PROJECT_FILTERS = [

  "Afghan",

  "Blanket",

  "Baby Blanket",

  "Sweater",

  "Cardigan",

  "Vest",

  "Top",

  "Tee",

  "Poncho",

  "Dress",

  "Hat",

  "Beanie",

  "Headband",

  "Scarf",

  "Cowl",

  "Shawl",

  "Wrap",

  "Mittens",

  "Gloves",

  "Socks",

  "Slippers",

  "Bag",

  "Tote",

  "Backpack",

  "Pillow",

  "Home Decor",

  "Kitchen",

  "Dishcloth",

  "Washcloth",

  "Baby",

  "Children",

  "Women",

  "Men",

  "Pets",

  "Toys",

  "Amigurumi"
];


// ============================================================
// DEDUPLICATION
//
// VERY IMPORTANT.
//
// We already entered some of these yarns in:
// - red-heart-catalog.js
// - michaels-joann-catalog.js
//
// Yarnspirations now owns the manufacturer data.
// ============================================================

window.YARNSPIRATIONS_DEDUPE_RULES = {

  authoritativeCatalog:
    "yarnspirations-catalog.js",

  supersedes: [

    "red-heart-catalog.js"
  ],

  retailerReferenceCatalogs: [

    "michaels-joann-catalog.js"
  ],

  brands: [

    "Bernat",

    "Caron",

    "Lily Sugar'n Cream",

    "Patons",

    "Phentex",

    "Red Heart",

    "Peaches & Creme"
  ],

  key:
    "brand|name",

  duplicateYarns:
    false,

  mergeRetailerAvailability:
    true,

  mergeImagesOnlyWhenMissing:
    true,

  preserveManufacturerSpecs:
    true
};


// ============================================================
// NORMALIZATION
// ============================================================

window.YARNSPIRATIONS_NORMALIZATION = {

  aliases: {

    "Red Heart Yarn":
      "Red Heart",

    "Red Heart Yarns":
      "Red Heart",

    "Red Heart®":
      "Red Heart",


    "Bernat Yarn":
      "Bernat",

    "Bernat®":
      "Bernat",


    "Caron Yarn":
      "Caron",

    "Caron®":
      "Caron",


    "Patons Yarn":
      "Patons",

    "Patons®":
      "Patons",


    "Lily Sugar & Cream":
      "Lily Sugar'n Cream",

    "Lily Sugar 'n Cream":
      "Lily Sugar'n Cream",

    "Lily Sugar ’n Cream":
      "Lily Sugar'n Cream",

    "Sugar'n Cream":
      "Lily Sugar'n Cream",

    "Sugar & Cream":
      "Lily Sugar'n Cream",


    "Peaches & Crème":
      "Peaches & Creme",

    "Peaches and Creme":
      "Peaches & Creme",


    "Phentex Yarn":
      "Phentex"
  }
};


// ============================================================
// RETAILER ALTERNATIVE RELATIONSHIPS
//
// These are NOT exact-yarn matches.
//
// They are useful when somebody enters an old Big Twist yarn
// and wants a currently available comparable yarn.
//
// Keep them labeled as alternatives, never as the same yarn.
// ============================================================

window.YARNSPIRATIONS_RETAILER_ALTERNATIVES = [

  {
    oldYarn:
      "Big Twist|Plush",

    alternatives: [
      "Bernat|Blanket"
    ]
  },

  {
    oldYarn:
      "Big Twist|Value",

    alternatives: [
      "Red Heart|Super Saver"
    ]
  },

  {
    oldYarn:
      "Big Twist|Favorite Cotton",

    alternatives: [
      "Lily Sugar'n Cream|Original",
      "Peaches & Creme|Original"
    ]
  }
];


// ============================================================
// IMAGE SOURCES
// ============================================================

window.YARNSPIRATIONS_IMAGE_SOURCES = {


  "Bernat":
    "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Bernat",


  "Caron":
    "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Caron",


  "Lily Sugar'n Cream":
    "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Lily+Sugar%27n+Cream",


  "Patons":
    "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Patons",


  "Phentex":
    "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Phentex",


  "Red Heart":
    "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Red+Heart",


  "Peaches & Creme":
    "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Peaches+%26+Creme"
};


// ============================================================
// SOURCE MANIFEST
// ============================================================

window.YARNSPIRATIONS_SOURCES = {

  home:
    "https://www.yarnspirations.com/",

  brands:
    "https://www.yarnspirations.com/pages/our-brands",

  yarns:
    "https://www.yarnspirations.com/collections/yarn",

  patterns:
    "https://www.yarnspirations.com/collections/patterns",


  bernatYarns:
    "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Bernat",

  bernatPatterns:
    "https://www.yarnspirations.com/collections/patterns?filter.p.vendor=Bernat",


  caronYarns:
    "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Caron",

  caronPatterns:
    "https://www.yarnspirations.com/collections/patterns?filter.p.vendor=Caron",


  patonsYarns:
    "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Patons",

  patonsPatterns:
    "https://www.yarnspirations.com/collections/patterns?filter.p.vendor=Patons",


  redHeartYarns:
    "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Red+Heart",

  redHeartPatterns:
    "https://www.yarnspirations.com/collections/patterns?filter.p.vendor=Red+Heart",


  lilyYarns:
    "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Lily+Sugar%27n+Cream",

  lilyPatterns:
    "https://www.yarnspirations.com/collections/patterns?filter.p.vendor=Lily+Sugar%27n+Cream",


  phentexYarns:
    "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Phentex",

  phentexPatterns:
    "https://www.yarnspirations.com/collections/patterns?filter.p.vendor=Phentex",


  peachesCremeYarns:
    "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Peaches+%26+Creme",

  peachesCremePatterns:
    "https://www.yarnspirations.com/collections/patterns?filter.p.vendor=Peaches+%26+Creme"
};


// ============================================================
// FINAL CATALOG BEHAVIOR
// ============================================================

window.YARNSPIRATIONS_CATALOG_CONFIG = {

  showSourceNameToCustomer:
    false,

  showBrandName:
    true,

  showYarnImage:
    true,

  showPatternImage:
    true,

  showGauge:
    true,

  showWeight:
    true,

  showNeedle:
    true,

  showHook:
    true,

  showFiber:
    true,

  showSkeins:
    true,

  showYards:
    true,

  showMeters:
    true,

  showLegacyYarns:
    true,

  showExactPatternsFirst:
    true,

  allowCrossBrandPatternMatches:
    true,

  supportKnit:
    true,

  supportCrochet:
    true
};


// ============================================================
// END YARNSPIRATIONS MASTER CATALOG
// ============================================================
