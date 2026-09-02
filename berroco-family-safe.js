(function () {
  "use strict";

  const familyBrands = [
    "Berroco",
    "Lopi",
    "Amano",
    "Lang",
    "WoolAddicts",
    "West Yorkshire Spinners"
  ];

  // Current Berroco yarn index from Berroco's official yarn catalog.
  // Records with fully verified specs are filled below. Unverified specs are
  // intentionally omitted instead of using fake values.
  const berrocoNames = [
    "Stratto","Nuvola","Merino 401 Chunky","Brina","Biella","Remix Wool DK",
    "Remix Wool","Modern Comfort","Cashmello","Aerial Dégradé","Aurelia","Gianna",
    "Vellina","Mirelle","Emberstone","Vintage Handpaint","Vintage Sock Handpaint",
    "Vera","Paperie","Iris","Modern Linen","Lanas Light Mini Color Pack",
    "Millstone Tweed","Merino 401","Hearthside","Gimlet","Bestie","Tillie","Bozzolo",
    "Carousel","Mistico","Talara","Vintage Baby Handpaint","Lumi","Vintage Sock",
    "Ultra Alpaca Chunky Natural","Wizard","Dash","Lanas Light","Pima Soft","Spree",
    "Aerial Color","Lanas Quick","Lucca","Remix Chunky","Vintage Baby","Summer Sesame",
    "Lanas","Aerial","Ultra Wool Chunky","Sesame","Ultra Wool Fine",
    "Ultra Alpaca Natural","Mercado","Ultra Wool DK","Ultra Wool","Modern Cotton DK",
    "Remix Light","Pima 100","Ultra Alpaca Chunky","Modern Cotton","Remix",
    "Vintage DK","Vintage Chunky","Vintage","Sox","Comfort DK","Comfort Chunky",
    "Comfort DK Print","Ultra Alpaca Light","Ultra Alpaca"
  ];

  const slug = (name) => name.toLowerCase()
    .normalize("NFKD").replace(/[^\x00-\x7F]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const verified = {
    "Vintage": {
      yards: 218, grams: 100, weight: "Worsted",
      knitGauge: [18,20], crochetGauge: [15,16],
      needleSize: "US 7–8 / 4.5–5 mm", hookSize: "US H–I / 5–5.5 mm",
      fiber: "52% Acrylic, 40% Wool, 8% Nylon",
      sourceUrl: "https://berroco.com/yarns/vintage/"
    },
    "Lanas": {
      yards: 219, grams: 100, weight: "Worsted",
      knitGauge: [18,20], crochetGauge: [15,15],
      needleSize: "US 7–8 / 4.5–5 mm", hookSize: "US H / 5 mm",
      fiber: "100% Wool",
      sourceUrl: "https://berroco.com/yarns/berroco-lanas/"
    },
    "Mercado": {
      yards: 164, grams: 100, weight: "Chunky",
      knitGauge: [15,16], crochetGauge: [12,12],
      needleSize: "US 9–10 / 5.5–6 mm", hookSize: "US J / 6 mm",
      fiber: "100% Peruvian Highland Wool",
      sourceUrl: "https://berroco.com/yarns/berroco-mercado/"
    },
    "Carousel": {
      yards: 418, grams: 100, weight: "Sport",
      knitGauge: [24,27], crochetGauge: [24,26],
      needleSize: "US 4–6 / 3.5–4 mm", hookSize: "US D–E / 3.25–3.5 mm",
      fiber: "52% Wool, 48% Acrylic",
      sourceUrl: "https://berroco.com/yarns/berroco-carousel/"
    },
    "Dash": {
      yards: 230, grams: 100, weight: "Super Bulky",
      knitGauge: [11.5,12], crochetGauge: [11,11],
      needleSize: "US 13–15 / 9–10 mm", hookSize: "US M / 9 mm",
      fiber: "92% Extrafine Merino Wool, 8% Nylon",
      sourceUrl: "https://berroco.com/yarns/berroco-dash/"
    },
    "Pima 100": {
      yards: 219, grams: 100, weight: "Worsted",
      knitGauge: [20,20], crochetGauge: [18,18],
      needleSize: "US 7 / 4.5 mm", hookSize: "US G / 4 mm",
      fiber: "100% Pima Cotton",
      sourceUrl: "https://berroco.com/yarns/berroco-pima-100/"
    },
    "Ultra Wool Fine": {
      yards: 400, grams: 100, weight: "Sock/Baby",
      knitGauge: [26,30], crochetGauge: [25,25],
      needleSize: "US 2–3 / 2.75–3.25 mm", hookSize: "US C–D / 3 mm",
      fiber: "100% Superwash Wool",
      sourceUrl: "https://berroco.com/yarns/berroco-ultra-wool-fine/"
    },
    "Ultra Wool DK": {
      yards: 292, grams: 100, weight: "DK",
      knitGauge: [23,23], crochetGauge: [18,18],
      needleSize: "US 6 / 4 mm", hookSize: "US 7 / 4.5 mm",
      fiber: "100% Superwash Wool",
      sourceUrl: "https://berroco.com/yarns/berroco-ultra-wool-dk/"
    },
    "Ultra Wool": {
      yards: 219, grams: 100, weight: "Worsted",
      knitGauge: [18,20], crochetGauge: [14,14],
      needleSize: "US 7–8 / 4.5–5 mm", hookSize: "US H / 5 mm",
      fiber: "100% Superwash Wool",
      sourceUrl: "https://berroco.com/yarns/berroco-ultra-wool/"
    }
  };

  const yarns = berrocoNames.map((name) => ({
    brand: "Berroco",
    name,
    ...(verified[name] || {}),
    sourceUrl: (verified[name] && verified[name].sourceUrl) ||
      `https://berroco.com/yarns/berroco-${slug(name)}/`
  }));

  // Partner-brand records confirmed on Berroco's own site.
  // These are kept as separate brands so the dropdown remains clean.
  yarns.push(
    { brand:"Lopi", name:"Lettlopi", sourceUrl:"https://berroco.com/lopi-lettlopi/" },
    { brand:"Lopi", name:"Alafosslopi", sourceUrl:"https://berroco.com/lopi-alafosslopi/" },
    { brand:"Lopi", name:"Plotulopi", sourceUrl:"https://berroco.com/lopi-plotulopi/" },
    { brand:"Lopi", name:"Einband", sourceUrl:"https://berroco.com/lopi-einband/" },

    { brand:"Amano", name:"Sami", sourceUrl:"https://berroco.com/amano-sami/" },
    { brand:"Amano", name:"Sami XL", sourceUrl:"https://berroco.com/amano-sami-xl/" },
    { brand:"Amano", name:"Samay", sourceUrl:"https://berroco.com/amano-samay/" },
    { brand:"Amano", name:"Riti", sourceUrl:"https://berroco.com/amano-riti/" },

    { brand:"Lang", name:"Merino+", sourceUrl:"https://berroco.com/lang-merino/" },
    { brand:"Lang", name:"Enya", sourceUrl:"https://berroco.com/lang-enya/" },
    { brand:"Lang", name:"Aura", sourceUrl:"https://berroco.com/lang-aura/" },

    { brand:"WoolAddicts", name:"Glory", sourceUrl:"https://berroco.com/wooladdicts-glory/" },
    { brand:"WoolAddicts", name:"Bliss", sourceUrl:"https://berroco.com/wooladdicts-bliss/" },
    { brand:"WoolAddicts", name:"Memory", sourceUrl:"https://berroco.com/wooladdicts-memory/" },
    { brand:"WoolAddicts", name:"Artsy", sourceUrl:"https://berroco.com/wooladdicts-artsy/" },
    { brand:"WoolAddicts", name:"Happiness", sourceUrl:"https://berroco.com/wooladdicts-happiness/" },

    { brand:"West Yorkshire Spinners", name:"Bluefaced Leicester Aran Naturals", sourceUrl:"https://berroco.com/west-yorkshire-spinners-yarns-bluefaced-leicester-aran-naturals/" },
    { brand:"West Yorkshire Spinners", name:"Bluefaced Leicester Roving Naturals", sourceUrl:"https://berroco.com/west-yorkshire-spinners-yarns-bluefaced-leicester-roving-naturals/" },
    { brand:"West Yorkshire Spinners", name:"Bluefaced Leicester DK Naturals", sourceUrl:"https://berroco.com/west-yorkshire-spinners-yarns-bluefaced-leicester-dk-naturals/" },
    { brand:"West Yorkshire Spinners", name:"Bluefaced Leicester DK", sourceUrl:"https://berroco.com/west-yorkshire-spinners-yarns-bluefaced-leicester-dk/" },
    { brand:"West Yorkshire Spinners", name:"Jacob Aran", sourceUrl:"https://berroco.com/west-yorkshire-spinners-yarns-jacob-aran/" },
    { brand:"West Yorkshire Spinners", name:"Croft Aran", sourceUrl:"https://berroco.com/west-yorkshire-spinners-yarns-croft-aran/" },
    { brand:"West Yorkshire Spinners", name:"Elements DK", sourceUrl:"https://berroco.com/west-yorkshire-spinners-yarns-elements-dk/" },
    { brand:"West Yorkshire Spinners", name:"Colour Lab Aran", sourceUrl:"https://berroco.com/west-yorkshire-spinners-yarns-colour-lab-aran/" },
    { brand:"West Yorkshire Spinners", name:"Exquisite Lace", sourceUrl:"https://berroco.com/west-yorkshire-spinners-yarns-exquisite-lace/" }
  );

  // Pattern records are intentionally separate from the yarn list.
  // We only add exact yarn associations when verified.
  const patterns = [
    {
      name: "Tancook",
      craft: "knit",
      sourceBrand: "Berroco",
      brands: ["Berroco","Lang"],
      usedYarns: ["Lang|Yak"],
      url: "https://berroco.com/"
    }
  ];

  // Source manifests make it explicit what belongs to this family and provide
  // a safe place for the next verified expansion without touching app.js.
  const sources = {
    familyAbout: "https://berroco.com/about-us/",
    yarnCatalog: "https://berroco.com/yarn/",
    patternCatalog: "https://berroco.com/pattern-listing",
    brands: familyBrands
  };

  window.BERROCO_FAMILY_BRANDS = familyBrands;
  window.BERROCO_FAMILY_YARN_CATALOG = yarns;
  window.BERROCO_FAMILY_PATTERN_CATALOG = patterns;
  window.BERROCO_FAMILY_SOURCES = sources;
})();
