(function () {
  "use strict";

  // Koigu-specific image/detail updates.
  // This file must MERGE into the shared image catalog instead of replacing it.
  const koiguUpdates = [
    {
      "brand": "Koigu",
      "name": "KPPPM",
      "weight": "Fingering",
      "yards": 170,
      "grams": 50,
      "knitGauge": [28, 28],
      "needleSize": "US 3 (3.0 mm)",
      "crochetGauge": null,
      "fiber": "100% merino wool",
      "image": "https://images.squarespace-cdn.com/content/v1/591601eec534a5b1eeec38d2/1733790214441-OW9A6HGKTA4X53MWZ1XX/kpppm+michigan.jpg",
      "imageSourceUrl": "https://www.koigu.com/kpppm/",
      "sourceUrl": "https://www.koigu.com/kpppm/"
    },
    {
      "brand": "Koigu",
      "name": "KPM",
      "weight": "Fingering",
      "yards": 170,
      "grams": 50,
      "knitGauge": [28, 28],
      "needleSize": "US 3 (3.0 mm)",
      "crochetGauge": null,
      "fiber": "100% merino wool",
      "sourceUrl": "https://www.koigu.com/kpm",
      "image": "https://images.squarespace-cdn.com/content/v1/591601eec534a5b1eeec38d2/966bf724-c3af-4f52-90cf-690dcc43af7a/solids%2Blayout.jpg",
      "imageSourceUrl": "https://www.koigu.com/kpm"
    },
    {
      "brand": "Koigu",
      "name": "Kersti",
      "weight": "DK",
      "yards": 114,
      "grams": 50,
      "knitGauge": [20, 20],
      "needleSize": "US 6 (4.0 mm)",
      "crochetGauge": null,
      "fiber": "100% merino wool",
      "sourceUrl": "https://www.koigu.com/kersti",
      "image": "https://images.squarespace-cdn.com/content/v1/591601eec534a5b1eeec38d2/c3d55516-2d35-4c79-ac5b-1cff7ad2e532/111%2BKersti.jpg",
      "imageSourceUrl": "https://www.koigu.com/kersti"
    },
    {
      "brand": "Koigu",
      "name": "Jasmine",
      "weight": "DK",
      "yards": 242,
      "grams": 100,
      "knitGauge": [22, 22],
      "needleSize": "US 6–7 (3.5–4.0 mm)",
      "crochetGauge": null,
      "fiber": "100% merino wool",
      "sourceUrl": "https://www.koigu.com/jasmine",
      "image": "https://images.squarespace-cdn.com/content/v1/591601eec534a5b1eeec38d2/1627331135508-J6C20HOR8L1W9YTSLGBW/J843_1.jpg",
      "imageSourceUrl": "https://www.koigu.com/jasmine"
    },
    {
      "brand": "Koigu",
      "name": "Lace",
      "weight": "Lace",
      "yards": 292,
      "grams": 50,
      "knitGauge": [32, 46],
      "needleSize": "US 0–1 (2.0–2.25 mm)",
      "crochetGauge": null,
      "fiber": "100% merino wool",
      "sourceUrl": "https://www.koigu.com/lace",
      "image": "https://images.squarespace-cdn.com/content/v1/591601eec534a5b1eeec38d2/1499184731402-A4GTFK4KNEKN1HB7DHAH/IMG_2808.JPG",
      "imageSourceUrl": "https://www.koigu.com/lace"
    },
    {
      "brand": "Koigu",
      "name": "Othello",
      "weight": "Bulky",
      "yards": 95,
      "grams": 100,
      "knitGauge": null,
      "needleSize": "8 mm",
      "crochetGauge": null,
      "fiber": "100% merino wool",
      "sourceUrl": "https://www.koigu.com/othello",
      "image": "https://images.squarespace-cdn.com/content/v1/591601eec534a5b1eeec38d2/c423135d-d5c2-40b3-b227-43b4e9aed207/othello.png",
      "imageSourceUrl": "https://www.koigu.com/othello"
    },
    {
      "brand": "Koigu",
      "name": "Chelsea",
      "weight": "Aran",
      "yards": 125,
      "grams": 100,
      "knitGauge": null,
      "crochetGauge": null,
      "fiber": "100% merino wool",
      "sourceUrl": "https://www.koigu.com/chelsea",
      "image": "https://images.squarespace-cdn.com/content/v1/591601eec534a5b1eeec38d2/1651000230203-MBBS5ENCUP57LPG2G3W0/C118L.JPG",
      "imageSourceUrl": "https://www.koigu.com/chelsea"
    },
    {
      "brand": "Koigu",
      "name": "Winnie",
      "weight": "Sport",
      "yards": 300,
      "grams": 100,
      "knitGauge": [23, 26],
      "needleSize": "US 3–5 (3.25–3.75 mm)",
      "crochetGauge": null,
      "fiber": "100% extrafine merino wool (17 micron)",
      "sourceUrl": "https://www.koigu.com/winnie",
      "image": "https://images.squarespace-cdn.com/content/v1/591601eec534a5b1eeec38d2/1761670280015-JBGOXI8DDAHFKURTGRV9/WINNIE%2BW5515.jpeg",
      "imageSourceUrl": "https://www.koigu.com/winnie"
    },
    {
      "brand": "Koigu",
      "name": "Sofie",
      "weight": "Lace",
      "yards": 238,
      "grams": 25,
      "knitGauge": [18, 25],
      "needleSize": "US 3–8 (3.25–5 mm)",
      "crochetGauge": null,
      "fiber": "70% kid mohair / 30% silk",
      "sourceUrl": "https://www.koigu.com/sofie",
      "image": "https://images.squarespace-cdn.com/content/v1/591601eec534a5b1eeec38d2/8edcfe21-d4e5-48dc-a702-e3ad96e78e78/sofie%2Brainbow.jpg",
      "imageSourceUrl": "https://www.koigu.com/sofie"
    },
    {
      "brand": "Koigu",
      "name": "Andra",
      "weight": "DK",
      "yards": 328,
      "grams": 100,
      "knitGauge": null,
      "needleSize": "US 7–9 (4.5–5.5 mm)",
      "crochetGauge": null,
      "fiber": "90% extrafine merino / 10% nylon",
      "sourceUrl": "https://www.koigu.com/andra",
      "image": "https://images.squarespace-cdn.com/content/v1/591601eec534a5b1eeec38d2/1744146174274-4TTITKV5IO5OQ9YJ542J/andra%2Bbrushed%2Bmohair.jpg",
      "imageSourceUrl": "https://www.koigu.com/andra"
    },
    {
      "brand": "Koigu",
      "name": "Emmi",
      "weight": "DK",
      "yards": 130,
      "grams": 50,
      "knitGauge": [22, 22],
      "needleSize": "US 6–7 (3.5–4.5 mm)",
      "crochetGauge": null,
      "fiber": "75% merino / 25% cashmere",
      "sourceUrl": "https://www.koigu.com/emmi",
      "image": "https://images.squarespace-cdn.com/content/v1/591601eec534a5b1eeec38d2/1603392592181-R58S0FXEGVCOCI45FJ43/IMG_7583.jpg",
      "imageSourceUrl": "https://www.koigu.com/emmi"
    },
    {
      "brand": "Koigu",
      "name": "Masham Bouclé",
      "weight": "Bulky",
      "yards": 100,
      "grams": 150,
      "knitGauge": null,
      "crochetGauge": null,
      "fiber": "Masham wool",
      "sourceUrl": "https://www.koigu.com/blog/2020/5/15/meet-masham-boucl",
      "image": "https://images.squarespace-cdn.com/content/v1/591601eec534a5b1eeec38d2/1589553270776-10WBHWNVDOV8Y0I91F13/708square.jpg",
      "imageSourceUrl": "https://www.koigu.com/blog/2020/5/15/meet-masham-boucl"
    }
  ];

  function key(item) {
    return `${String(item && item.brand || "").trim().toLowerCase()}|${String(item && item.name || "").trim().toLowerCase()}`;
  }

  const catalog = Array.isArray(window.YARN_IMAGE_CATALOG)
    ? window.YARN_IMAGE_CATALOG
    : [];

  const indexByKey = new Map(
    catalog.map((item, index) => [key(item), index])
  );

  koiguUpdates.forEach((update) => {
    const itemKey = key(update);
    const existingIndex = indexByKey.get(itemKey);

    if (existingIndex === undefined) {
      indexByKey.set(itemKey, catalog.length);
      catalog.push(update);
      return;
    }

    catalog[existingIndex] = {
      ...catalog[existingIndex],
      ...update
    };
  });

  window.YARN_IMAGE_CATALOG = catalog;
}());
