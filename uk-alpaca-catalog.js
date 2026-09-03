(function () {
  "use strict";

  // Correct UK Alpaca data. This replaces the old duplicated/misnamed catalog.
  window.UK_ALPACA_YARN_CATALOG = [
    {
      brand: "UK Alpaca", name: "Superfine Alpaca 4-Ply", weight: "Fingering",
      grams: 50, meters: 225, yards: 245,
      fiber: "British superfine alpaca blend",
      sourceUrl: "https://www.ukalpaca.com/",
      sourceCheckedAt: "2026-09-03", manualVerified: true, status: "Current"
    },
    {
      brand: "UK Alpaca", name: "Baby Alpaca & Silk 4-Ply", weight: "Fingering",
      grams: 50, meters: 225, yards: 245, knitGauge: [23, 30], rowGauge: [32, 40],
      needleSize: "2.75–3.5 mm",
      fiber: "80% British baby alpaca / 20% Tussah silk",
      sourceUrl: "https://www.ukalpaca.com/shop/4-ply-knitting-yarns/baby-alpaca-silk-4-ply/baby-alpaca-silk-4-ply/",
      sourceCheckedAt: "2026-09-03", manualVerified: true, status: "Current"
    },
    {
      brand: "UK Alpaca", name: "Suri Alpaca 4-Ply", weight: "Fingering",
      grams: 50, meters: 225, yards: 245, knitGauge: [24, 28], rowGauge: [33, 33],
      needleSize: "3.25–3.5 mm",
      fiber: "75% suri alpaca / 20% huacaya alpaca / 5% silk",
      sourceUrl: "https://www.ukalpaca.com/shop/4-ply-knitting-yarns/suri-alpaca-4-ply/suri-alpaca-4-ply/",
      sourceCheckedAt: "2026-09-03", manualVerified: true, status: "Current"
    },
    {
      brand: "UK Alpaca", name: "Baby Alpaca & Silk DK", weight: "DK",
      grams: 50, meters: 112, yards: 122,
      fiber: "80% British baby alpaca / 20% Tussah silk",
      sourceUrl: "https://www.ukalpaca.com/shop/double-knitting-dk-yarns/baby-alpaca-silk-dk/baby-alpaca-silk-dk/",
      sourceCheckedAt: "2026-09-03", manualVerified: true, status: "Current"
    },
    {
      brand: "UK Alpaca", name: "Superfine Alpaca DK", weight: "DK",
      grams: 50, meters: 112, yards: 122,
      fiber: "75% superfine alpaca / 25% wool",
      sourceUrl: "https://www.ukalpaca.com/shop/double-knitting-dk-yarns/superfine-alpaca-dk/superfine-alpaca-dk/",
      sourceCheckedAt: "2026-09-03", manualVerified: true, status: "Current"
    },
    {
      brand: "UK Alpaca", name: "Superfine Alpaca Chunky", weight: "Bulky",
      grams: 50, meters: 50, yards: 55, knitGauge: [15, 15], rowGauge: [18, 18],
      needleSize: "6 mm", fiber: "75% superfine alpaca / 25% wool",
      sourceUrl: "https://www.ukalpaca.com/shop/chunky-knitting-yarns/superfine-alpaca-chunky/superfine-alpaca-chunky/",
      sourceCheckedAt: "2026-09-03", manualVerified: true, status: "Current"
    }
  ];

  window.UK_ALPACA_PATTERN_CATALOG = [
    {
      sourceId: "ukalpaca:serena-summer-top",
      name: "Serena Summer Top", designer: "Tracy Birch",
      sourceBrand: "UK Alpaca", brands: ["UK Alpaca"], craft: "knit", project: "Sweater",
      usedYarns: ["UK Alpaca|Superfine Alpaca 4-Ply", "UK Alpaca|Suri Alpaca 4-Ply"],
      url: "https://www.ukalpaca.com/shop/knitting-patterns/4-ply-knitting-patterns/knitted-tops-4-ply-knitting-patterns/serena-summer-top-by-tracy-birch/",
      sourceCheckedAt: "2026-09-03", manualVerified: true
    },
    {
      sourceId: "ukalpaca:speckledy-waistcoat",
      name: "Speckledy Waistcoat", designer: "Tracy Birch",
      sourceBrand: "UK Alpaca", brands: ["UK Alpaca"], craft: "knit", project: "Sweater",
      usedYarns: ["UK Alpaca|Superfine Alpaca 4-Ply"],
      url: "https://www.ukalpaca.com/shop/knitting-patterns/4-ply-knitting-patterns/knitted-tops-4-ply-knitting-patterns/speckledy-waistcoat-by-tracy-birch/",
      sourceCheckedAt: "2026-09-03", manualVerified: true
    }
  ];
}());
