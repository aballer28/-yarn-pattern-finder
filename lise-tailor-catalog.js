(function () {
  "use strict";

  // Verified against Lise Tailor's current yarn/pattern pages on 2026-09-03.
  window.LISE_TAILOR_YARN_CATALOG = [
    {
      brand: "Lise Tailor", name: "Fingering Merino", weight: "Fingering",
      grams: 50, meters: 175, yards: 191, knitGauge: [26, 30],
      needleSize: "2.5–3.5 mm single; up to 5 mm held double",
      fiber: "100% merino wool",
      sourceUrl: "https://lisetailor.com/en/products/merinos-ivoire",
      sourceCheckedAt: "2026-09-03", manualVerified: true, status: "Current"
    },
    {
      brand: "Lise Tailor", name: "Silk Mohair", weight: "Lace",
      grams: 25, meters: 210, yards: 230,
      knitGauge: null, heldDoubleGauge: [18, 24],
      needleSize: "2 mm alone; up to 4.5 mm held double or with merino",
      fiber: "72% kid mohair / 28% mulberry silk",
      sourceUrl: "https://lisetailor.com/en/products/mohair-soie-encre",
      sourceCheckedAt: "2026-09-03", manualVerified: true, status: "Current"
    },
    {
      brand: "Lise Tailor", name: "Silk Merino", weight: "Fingering",
      grams: 50, meters: 200, yards: 219, knitGauge: [26, 28],
      needleSize: "2.5–3.5 mm",
      fiber: "70% merino wool / 30% mulberry silk",
      sourceUrl: "https://lisetailor.com/en/products/merinos-soie-nude",
      sourceCheckedAt: "2026-09-03", manualVerified: true, status: "Current"
    },
    {
      brand: "Lise Tailor", name: "Cumulus", weight: "DK",
      manufacturerWeight: "DK–Worsted", grams: 50, meters: 100, yards: 109,
      knitGauge: [15, 15], rowGauge: [24, 24], needleSize: "4.5–5.5 mm",
      fiber: "78% kid mohair / 13% superwash merino / 9% polyamide",
      sourceUrl: "https://lisetailor.com/en/products/cumulus-prune",
      sourceCheckedAt: "2026-09-03", manualVerified: true, status: "Current"
    },
    {
      brand: "Lise Tailor", name: "Aube", weight: "Aran",
      grams: 50, meters: 82, yards: 90, knitGauge: [16, 16],
      needleSize: "5–5.5 mm",
      fiber: "100% merino wool",
      sourceUrl: "https://lisetailor.com/en/products/aube-ivoire",
      sourceCheckedAt: "2026-09-03", manualVerified: true, status: "Current",
      sourceNote: "Official English page labels the gauge line 'single crochet' while also giving knitting-oriented needle sizing; retain the published stitch count but do not infer crochet craft from that translation."
    },
    {
      brand: "Lise Tailor", name: "Filena", weight: "Fingering",
      grams: 50, meters: 180, yards: 197, knitGauge: [28, 28],
      rowGauge: [33, 33], needleSize: "2.5–3.5 mm",
      fiber: "100% GOTS organic cotton",
      sourceUrl: "https://lisetailor.com/en/products/filena-ivoire",
      sourceCheckedAt: "2026-09-03", manualVerified: true, status: "Current"
    }
  ];

  window.LISE_TAILOR_PATTERN_CATALOG = [
    {
      sourceId: "lise:love-at-first-sight-socks",
      name: "Love at First Sight Socks", designer: "Lise Tailor",
      sourceBrand: "Lise Tailor", brands: ["Lise Tailor"], craft: "knit", project: "Socks",
      usedYarns: ["Lise Tailor|Silk Merino"],
      gauge: { stitches: 34, rows: 38, measurement: 4, original: "34 sts x 38 rows = 10 cm in motif" },
      tool: "3 mm needles", skillLevel: "Intermediate", free: false,
      url: "https://lisetailor.com/en/products/chaussettes-love-at-first-sight-pdf",
      sourceCheckedAt: "2026-09-03", manualVerified: true
    },
    {
      sourceId: "lise:rosee-fingering",
      name: "Rosée Fingering Sweater/Cardigan", designer: "Lise Tailor",
      sourceBrand: "Lise Tailor", brands: ["Lise Tailor"], craft: "knit", project: "Sweater",
      usedYarns: ["Lise Tailor|Silk Merino"],
      gauge: { stitches: 28, rows: 36, measurement: 4, original: "28 sts x 36 rows = 10 cm in stockinette" },
      tool: "3 mm needles", skillLevel: "Beginner", free: false,
      url: "https://lisetailor.com/en/products/patron-tricot-rosee",
      sourceCheckedAt: "2026-09-03", manualVerified: true
    },
    {
      sourceId: "lise:opale",
      name: "Opale Slipover", designer: "Lise Tailor",
      sourceBrand: "Lise Tailor", brands: ["Lise Tailor"], craft: "knit", project: "Sweater",
      usedYarns: ["Lise Tailor|Silk Merino", "Lise Tailor|Filena"],
      gauge: { stitches: 28, rows: 36, measurement: 4, original: "28 sts x 36 rows = 10 cm in stockinette" },
      tool: "3 mm needles", skillLevel: "Advanced beginner", free: false,
      url: "https://lisetailor.com/products/slipover-opale-pdf",
      sourceCheckedAt: "2026-09-03", manualVerified: true
    },
    {
      sourceId: "lise:suzanne",
      name: "Suzanne Top", designer: "Lise Tailor",
      sourceBrand: "Lise Tailor", brands: ["Lise Tailor"], craft: "knit", project: "Sweater",
      usedYarns: ["Lise Tailor|Silk Merino"],
      gauge: { stitches: 29, rows: 39, measurement: 4, original: "29 sts x 39 rows = 10 cm in moss stitch" },
      tool: "3 mm needles", skillLevel: "Advanced", free: false,
      url: "https://lisetailor.com/products/top-suzanne-pdf",
      sourceCheckedAt: "2026-09-03", manualVerified: true
    }
  ];
}());
