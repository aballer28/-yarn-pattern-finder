// ============================================================
// GARN SWATCH — LION BRAND MASTER CATALOG
// WHOLE FILE
// Filename: lion-brand-catalog.js
//
// Current yarns + discontinued yarns + knitting + crochet
// + yarn/pattern matching + images
//
// Official source: Lion Brand Yarn
// ============================================================

window.LION_BRAND_BRANDS = [
  "Lion Brand"
];


// ============================================================
// MASTER BRAND RECORD
// ============================================================

window.LION_BRAND_MASTER = {

  brand: "Lion Brand",

  country: "United States",

  crafts: [
    "knit",
    "crochet",
    "loom",
    "weaving"
  ],

  exactYarnMatching: true,

  discontinuedYarnSupport: true,

  patternMatching: true,

  imageSupport: true
};


// ============================================================
// OFFICIAL FULL CATALOG SOURCES
//
// IMPORTANT:
//
// Lion Brand has a very large changing catalog.
// These are the authoritative catalog collections.
//
// We do NOT pretend a manually typed subset is the complete
// Lion Brand catalog.
// ============================================================

window.LION_BRAND_CATALOG_SOURCES = {

  currentYarns:
    "https://www.lionbrand.com/collections/all-yarns",

  allCollections:
    "https://www.lionbrand.com/collections",

  discontinuedYarns:
    "https://www.lionbrand.com/collections/discontinued-yarn",

  allPatterns:
    "https://www.lionbrand.com/collections/all-free-knit-crochet-patterns",

  knittingPatterns:
    "https://www.lionbrand.com/collections/knitting-patterns-kits",

  crochetPatterns:
    "https://www.lionbrand.com/collections/crochet-patterns-kits",

  allKits:
    "https://www.lionbrand.com/collections/all-knit-crochet-kits"
};


// ============================================================
// CURRENT YARN FAMILIES
//
// These are searchable Lion Brand families.
//
// Individual yarn records imported later retain:
// weight
// yardage
// grams
// fiber
// knit gauge
// crochet gauge
// needle
// hook
// colors
// images
// patterns
// ============================================================

window.LION_BRAND_YARN_FAMILIES = [

  "24/7 Cotton",
  "24/7 Cotton DK",
  "Basic Stitch",
  "Basic Stitch Anti-Pilling",
  "Basic Stitch Premium",
  "Basic Stitch Reflective",
  "Basic Stitch Thick & Quick",

  "Coboo",
  "Cozy Air",
  "Cover Story",
  "Cover Story Dreamland",
  "Cover Story Lazy Days Thick & Quick",

  "DIY Glow",
  "DIYarn",

  "Feels Like Alpaca",
  "Feels Like Bliss",
  "Feels Like Butta",
  "Feels Like Butta Thick & Quick",
  "Feels Like Heaven",

  "Heartland",
  "Hometown",

  "Hue + Me",

  "Ice Cream",
  "Ice Cream Big Scoop",
  "Ice Cream Cotton Blend",
  "Ice Cream Roving",

  "Landscapes",
  "Lazy Days",

  "Mandala",
  "Mandala Baby",
  "Mandala Bonus Bundle",
  "Mandala Gradient",
  "Mandala Ombre",
  "Mandala Sequins",
  "Mandala Sparkle",
  "Mandala String",

  "Pound of Love",

  "Re-Spun",
  "Re-Spun Thick & Quick",

  "Scarfie",

  "Soft & Simple",

  "Truboo",

  "Vanna's Choice",

  "Vel-Luxe",

  "Wool-Ease",
  "Wool-Ease DK",
  "Wool-Ease Fair Isle",
  "Wool-Ease Roving",
  "Wool-Ease Thick & Quick",

  "Local Grown",
  "Local Grown Cotton",

  "Touch of Alpaca",

  "Color Theory",

  "Ferris Wheel",

  "Jeans",
  "Jeans Colors",

  "Homespun",

  "Jiffy",

  "Fun Fur",

  "Amazing",

  "Fishermen's Wool"
];


// ============================================================
// LEGACY / DISCONTINUED SUPPORT
//
// DO NOT DELETE.
//
// Garn Swatch specifically needs these because someone may have
// an old Lion Brand skein and want to know what they can make.
//
// Lion Brand keeps official specification pages for discontinued
// yarns.
// ============================================================

window.LION_BRAND_LEGACY_YARN_FAMILIES = [

  "Lion Cotton",
  "Lion Organic Cotton",

  "Cotton-Ease",

  "Lion Wool",

  "Homespun New Look",

  "LB Collection Organic Wool",

  "LB Collection Hand-Dyed Superwash Merino",

  "LB Collection Botanic",

  "LB Collection Cashmere",

  "LB Collection Superwash Merino",

  "LB Collection Silk",

  "LB Collection Baby Alpaca",

  "LB Collection Angora Merino",

  "LB Collection Cotton Bamboo",

  "LB Collection Wool Stainless Steel",

  "For The Home Cording",

  "Rewind",

  "Comfy Cotton Blend",

  "Touch of Cashmere",

  "Touch of Linen",

  "Touch of Mohair",

  "ZZ Twist",

  "Color Made Easy",

  "New Basic 175",

  "Fast-Track",

  "Jeans Cotton",

  "Jeans Yarn",

  "Shawl in a Ball",

  "Shawl in a Cake",

  "Cupcake",

  "Flikka",

  "Summer Nights",

  "Summer Nights Bonus Bundle",

  "Date Nights",

  "Beautiful You",

  "Low Tide",

  "ZZ Twist",

  "Vanna's Glamour",

  "Vanna's Colors",

  "Vanna's Palettes",

  "Vanna's Tapestry",

  "Modern Baby",

  "Babysoft",

  "Baby Wool",

  "Jamie",

  "Jamie Pompadour",

  "Microspun",

  "Moonlight Mohair",

  "Nature's Choice Organic Cotton",

  "Kitchen Cotton",

  "Suede",

  "Chenille Thick & Quick",

  "Imagine",

  "Incredible",

  "Fancy Fur",

  "Fettuccini",

  "Glitterspun",

  "Jiffy Thick & Quick",

  "Lion Boucle",

  "Lion Cashmere Blend",

  "Lion Organic Wool",

  "Magic Stripes",

  "Microspun",

  "Romance",

  "Sasha",

  "Silky Twist",

  "Terryspun",

  "Trellis",

  "Velvetspun",

  "Watercolors",

  "Wool Stainless Steel"
];


// ============================================================
// VERIFIED LEGACY YARN RECORDS
//
// Exact specifications preserved from Lion Brand's archive.
// ============================================================

window.LION_BRAND_VERIFIED_LEGACY_YARNS = [

  {
    brand: "Lion Brand",

    name: "Homespun New Look",

    status: "discontinued",

    weight: "Bulky / Chunky",

    cycWeight: 5,

    grams: 170,

    ounces: 6,

    yards: 185,

    knitGauge: {
      stitches: 14,
      rows: 20,
      measurement: "4 in / 10 cm"
    },

    needleSize:
      "US 10 / 6 mm",

    crochetGauge: {
      stitches: 10,
      rows: 10,
      measurement: "4 in / 10 cm"
    },

    hookSize:
      "K-10.5 / 6.5 mm",

    sourceUrl:
      "https://www.lionbrand.com/products/homespun-new-look-yarn",

    imagePage:
      "https://www.lionbrand.com/products/homespun-new-look-yarn",

    patternRelationship:
      "Lion Brand archive provides patterns made with this yarn."
  },


  {
    brand: "Lion Brand",

    name: "LB Collection Organic Wool",

    status: "discontinued",

    weight: "Medium / Worsted",

    cycWeight: 4,

    grams: 100,

    ounces: 3.5,

    yards: 185,

    meters: 170,

    fiber:
      "100% Organic Wool",

    knitGauge: {
      stitches: 16,
      rows: 24,
      measurement: "4 in / 10 cm"
    },

    needleSize:
      "US 9 / 5.5 mm",

    crochetGauge: {
      stitches: 12,
      rows: 15,
      measurement: "4 in / 10 cm"
    },

    hookSize:
      "I-9 / 5.5 mm",

    care:
      "Hand wash; lay flat to dry",

    sourceUrl:
      "https://www.lionbrand.com/products/lb-collection-organic-wool-yarn",

    imagePage:
      "https://www.lionbrand.com/products/lb-collection-organic-wool-yarn",

    colorways: [
      "Redwood",
      "Toffee",
      "Avocado",
      "Dark Teal",
      "Natural"
    ]
  },


  {
    brand: "Lion Brand",

    name: "LB Collection Hand-Dyed Superwash Merino",

    status: "discontinued",

    weight: "Medium / Worsted",

    cycWeight: 4,

    yards: 240,

    meters: 219,

    fiber:
      "Superwash Merino Wool",

    knitGauge: {
      stitches: 20,
      rows: 26,
      measurement: "4 in / 10 cm"
    },

    needleSize:
      "US 7 / 4.5 mm",

    crochetGauge: {
      stitches: 14,
      rows: 20,
      measurement: "4 in / 10 cm"
    },

    hookSize:
      "I-9 / 5.5 mm",

    sourceUrl:
      "https://www.lionbrand.com/products/lb-collection-hand-dyed-superwash-merino-yarn",

    imagePage:
      "https://www.lionbrand.com/products/lb-collection-hand-dyed-superwash-merino-yarn"
  },


  {
    brand: "Lion Brand",

    name: "Lion Organic Cotton",

    status: "discontinued",

    weight: "Medium / Worsted",

    cycWeight: 4,

    grams: 50,

    ounces: 1.75,

    yards: 82,

    meters: 75,

    fiber:
      "100% Organic Cotton",

    knitGauge: {
      stitches: 18,
      rows: 25,
      measurement: "4 in / 10 cm"
    },

    needleSize:
      "US 6 / 4 mm",

    crochetGauge: {
      stitches: 13,
      rows: 16,
      measurement: "4 in / 10 cm"
    },

    hookSize:
      "I-9 / 5.5 mm",

    care:
      "Hand wash",

    sourceUrl:
      "https://www.lionbrand.com/products/lion-organic-cotton-yarn-discontinued",

    imagePage:
      "https://www.lionbrand.com/products/lion-organic-cotton-yarn-discontinued"
  },


  {
    brand: "Lion Brand",

    name: "For The Home Cording",

    status: "discontinued",

    weight: "Medium / Worsted",

    cycWeight: 4,

    grams: 100,

    ounces: 3.5,

    yards: 68,

    meters: 62,

    fiber:
      "50% Recycled Cotton, 50% Polyester",

    knitGauge: {
      stitches: 16,
      rows: 24,
      measurement: "4 in / 10 cm"
    },

    needleSize:
      "US 7 / 4.5 mm",

    crochetGauge: {
      stitches: 14,
      rows: 16,
      measurement: "4 in / 10 cm"
    },

    hookSize:
      "I-9 / 5.5 mm",

    projects: [
      "Bag",
      "Basket",
      "Cushion",
      "Rug",
      "Home Decor",
      "Macrame"
    ],

    sourceUrl:
      "https://www.lionbrand.com/products/for-the-home-cording-yarn",

    imagePage:
      "https://www.lionbrand.com/products/for-the-home-cording-yarn"
  }
];


// ============================================================
// PATTERN CATALOG
//
// Lion Brand maintains the pattern library itself.
// This lets Garn Swatch support the entire changing library instead
// of freezing only a few patterns into this file.
// ============================================================

window.LION_BRAND_PATTERN_CATALOG = {

  all: {
    craft: [
      "knit",
      "crochet"
    ],

    source:
      "https://www.lionbrand.com/collections/all-free-knit-crochet-patterns"
  },


  knitting: {
    craft: "knit",

    source:
      "https://www.lionbrand.com/collections/knitting-patterns-kits"
  },


  crochet: {
    craft: "crochet",

    source:
      "https://www.lionbrand.com/collections/crochet-patterns-kits"
  }
};


// ============================================================
// PROJECT FILTERS
// ============================================================

window.LION_BRAND_PROJECT_FILTERS = [

  "Accessories",

  "Afghans",
  "Blankets",

  "Baby",

  "Bags",

  "Booties",

  "Cardigans",

  "Children",

  "Cowls",

  "Decorations",

  "Dresses",

  "Gloves",
  "Mittens",

  "Hats",

  "Home Decor",

  "Leg Warmers",

  "Men",

  "Pets",

  "Pillows",

  "Ponchos",

  "Scarves",

  "Shawls",
  "Wraps",

  "Socks",

  "Sweaters",

  "Tees",
  "Tops",
  "Tunics",

  "Toys",

  "Vests",

  "Women"
];


// ============================================================
// WEIGHT FILTERS
// ============================================================

window.LION_BRAND_WEIGHT_FILTERS = [

  {
    cyc: 1,
    name: "Superfine / Fingering"
  },

  {
    cyc: 2,
    name: "Fine / Sport"
  },

  {
    cyc: 3,
    name: "Light / DK"
  },

  {
    cyc: 4,
    name: "Medium / Worsted"
  },

  {
    cyc: 5,
    name: "Bulky / Chunky"
  },

  {
    cyc: 6,
    name: "Super Bulky"
  },

  {
    cyc: 7,
    name: "Jumbo"
  }
];


// ============================================================
// YARN → PATTERN MATCHING
// ============================================================

window.LION_BRAND_MATCHING_RULES = {

  exactYarnFirst: true,

  includeDiscontinuedYarns: true,

  includeKnitting: true,

  includeCrochet: true,

  supportGaugeMatching: true,

  supportWeightMatching: true,

  supportYardageMatching: true,

  patternMatchOrder: [

    "exact-yarn",

    "same-yarn-family",

    "same-gauge",

    "same-weight",

    "yardage-compatible"
  ]
};


// ============================================================
// WHAT CAN I MAKE?
//
// Garn Swatch general skein ranges.
//
// Exact Lion Brand patterns override these estimates whenever
// a pattern gives a specific yarn quantity.
// ============================================================

window.LION_BRAND_SKEIN_ESTIMATES = {

  1: {
    label: "Superfine / Fingering",

    "1-2": [
      "Socks",
      "Hat",
      "Mittens",
      "Small Cowl"
    ],

    "2-4": [
      "Scarf",
      "Shawl",
      "Baby Sweater"
    ],

    "4+": [
      "Adult Top",
      "Adult Sweater",
      "Large Shawl"
    ]
  },


  2: {
    label: "Fine / Sport",

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
      "Adult Top",
      "Sweater",
      "Large Shawl"
    ]
  },


  3: {
    label: "Light / DK",

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
      "Adult Sweater",
      "Cardigan"
    ]
  },


  4: {
    label: "Medium / Worsted",

    "1-2": [
      "Hat",
      "Mittens",
      "Cowl"
    ],

    "2-4": [
      "Scarf",
      "Baby Sweater",
      "Small Bag"
    ],

    "4+": [
      "Vest",
      "Adult Sweater",
      "Cardigan",
      "Blanket"
    ]
  },


  5: {
    label: "Bulky / Chunky",

    "1-2": [
      "Hat",
      "Cowl",
      "Mittens"
    ],

    "2-4": [
      "Scarf",
      "Baby Sweater"
    ],

    "4+": [
      "Sweater",
      "Cardigan",
      "Blanket"
    ]
  },


  6: {
    label: "Super Bulky",

    "1-2": [
      "Hat",
      "Cowl"
    ],

    "2-4": [
      "Scarf",
      "Mittens"
    ],

    "4+": [
      "Sweater",
      "Blanket"
    ]
  },


  7: {
    label: "Jumbo",

    "1-2": [
      "Cowl",
      "Small Home Decor"
    ],

    "2-4": [
      "Scarf",
      "Pillow"
    ],

    "4+": [
      "Blanket",
      "Large Home Decor"
    ]
  }
};


// ============================================================
// IMAGE HANDLING
//
// Use each Lion Brand yarn/product page as its official image source.
// Do not use unrelated retailer photos when an official Lion Brand
// image exists.
// ============================================================

window.LION_BRAND_IMAGE_SOURCES = {

  currentYarns:
    "https://www.lionbrand.com/collections/all-yarns",

  discontinuedYarns:
    "https://www.lionbrand.com/collections/discontinued-yarn",

  patterns:
    "https://www.lionbrand.com/collections/all-free-knit-crochet-patterns",

  knitting:
    "https://www.lionbrand.com/collections/knitting-patterns-kits",

  crochet:
    "https://www.lionbrand.com/collections/crochet-patterns-kits"
};


// ============================================================
// IMPORT NORMALIZATION
//
// Keeps Lion Brand naming consistent with all our other Garn Swatch
// brand files.
// ============================================================

window.LION_BRAND_NORMALIZATION = {

  brand:
    "Lion Brand",

  aliases: {

    "Lion Brand Yarn":
      "Lion Brand",

    "Lion Brand Yarn Company":
      "Lion Brand",

    "Lion Brand®":
      "Lion Brand",

    "LB Collection":
      "Lion Brand"
  },

  statusMap: {

    active:
      "current",

    discontinued:
      "discontinued",

    legacy:
      "discontinued"
  }
};


// ============================================================
// IMPORTANT LEGACY BEHAVIOR
//
// A discontinued yarn must STILL:
//
// 1. appear in yarn search
// 2. display its original specifications
// 3. display its original picture when available
// 4. show patterns originally made for it
// 5. show modern compatible substitutions separately
//
// Never silently replace the old yarn with a new yarn.
// ============================================================

window.LION_BRAND_LEGACY_RULES = {

  searchable: true,

  showOriginalSpecs: true,

  showOriginalImages: true,

  showOriginalPatterns: true,

  allowModernSubstitutions: true,

  labelClearly:
    "Discontinued / Legacy",

  substitutionLabel:
    "Compatible current yarns"
};


// ============================================================
// END LION BRAND MASTER CATALOG
// ============================================================
