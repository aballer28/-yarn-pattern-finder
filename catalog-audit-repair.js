(function () {
  "use strict";

  const norm = (value) => String(value || "")
    .normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "")
    .replace(/[®™©]/g, "").replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();

  const BRAND_ALIASES = new Map([
    ["queensland", "Queensland Collection"], ["queensland collection", "Queensland Collection"],
    ["kfi collection", "Knitting Fever Collection"], ["knitting fever collection", "Knitting Fever Collection"],
    ["kfi novelty", "Knitting Fever Novelty"], ["knitting fever novelty", "Knitting Fever Novelty"],
    ["istex", "Lopi"], ["lopi yarn", "Lopi"],
    ["peaches creme", "Peaches & Creme"], ["peaches and creme", "Peaches & Creme"],
    ["lily sugar n cream", "Lily Sugar'n Cream"], ["lily sugar and cream", "Lily Sugar'n Cream"],
    ["aunt lydias", "Aunt Lydia's"], ["aunt lydia s", "Aunt Lydia's"],
    ["bc garn by kremke", "BC Garn"], ["bc garn", "BC Garn"],
    ["quince and co", "Quince & Co."], ["quince co", "Quince & Co."],
    ["lise tailor", "Lise Tailor"], ["uk alpaca", "UK Alpaca"]
  ]);

  const WEIGHTS = [
    ["Jumbo", /\bjumbo\b/], ["Super Bulky", /\bsuper\s*bulky\b|\bsuper\s*chunky\b/],
    ["Bulky", /\bbulky\b|\bchunky\b/], ["Aran", /\baran\b/],
    ["Worsted", /\bworsted\b|\bmedium\b/], ["DK", /\bdk\b|\bdouble knitting\b|\blight\s*3\b/],
    ["Sport", /\bsport\b|\b5\s*ply\b/], ["Fingering", /\bfingering\b|\b4\s*ply\b|\bsock\b|\bsuper fine\b/],
    ["Lace", /\blace\b|\b2\s*ply\b|\bcobweb\b/]
  ];

  function canonicalBrand(value) {
    return BRAND_ALIASES.get(norm(value)) || String(value || "").trim();
  }
  function canonicalWeight(value) {
    const source = String(value || "").trim();
    const key = norm(source);
    for (const [label, re] of WEIGHTS) if (re.test(key)) return label;
    return source;
  }
  function canonicalYarnName(value) {
    // Preserve the manufacturer-facing name for display. Generic suffix handling
    // belongs in the identity key, not in the visible catalog record.
    return String(value || "").replace(/\s+/g, " ").trim();
  }
  function yarnIdentityParts(brand, name) {
    let b = canonicalBrand(brand);
    let n = canonicalYarnName(name);
    if (norm(b) === "lise tailor" && ["merino", "merinos", "merino fingering", "fingering merino"].includes(norm(n))) n = "Fingering Merino";
    if (norm(b) === "lise tailor" && ["merino silk", "silk merino", "merinos soie", "merino and silk"].includes(norm(n))) n = "Silk Merino";
    if (norm(b) === "lise tailor" && ["mohair silk", "silk mohair", "mohair soie", "mohair and silk"].includes(norm(n))) n = "Silk Mohair";
    if (norm(b) === "koigu" && ["corriedale gotland", "corriedale and gotland"].includes(norm(n))) n = "Corriedale/Gotland";
    if (norm(b) === "uk alpaca" && /superfine alpaca 4 ply|superfine 4 ply/.test(norm(n))) n = "Superfine Alpaca 4-Ply";
    // Quince currently presents Cormo in its own yarn line; keep the old Stone Wool reference as an alias.
    if (norm(n) === "cormo" && norm(b) === "stone wool") b = "Quince & Co.";
    return { brand: b, name: n };
  }
  function yarnIdentity(value) {
    if (typeof value === "string") {
      const [brand, ...name] = value.split("|");
      if (!name.length) return norm(value);
      const p = yarnIdentityParts(brand, name.join("|"));
      const nameKey = norm(p.name).replace(/\s+yarn$/, "");
    return `${norm(p.brand)}|${nameKey}`;
    }
    const p = yarnIdentityParts(value && value.brand, value && value.name);
    const nameKey = norm(p.name).replace(/\s+yarn$/, "");
    return `${norm(p.brand)}|${nameKey}`;
  }
  function putupIdentity(yarn) {
    const base = yarnIdentity(yarn);
    const grams = Number(yarn && yarn.grams) || 0;
    const yards = Number(yarn && yarn.yards) || 0;
    // Preserve genuinely different retail put-ups; unknown values remain mergeable.
    return grams || yards ? `${base}|${grams}|${yards}` : base;
  }
  function isObject(v) { return v && typeof v === "object" && !Array.isArray(v); }
  function looksYarn(v) {
    return isObject(v) && v.brand && v.name && !v.usedYarns && !v.designer &&
      Boolean(v.weight || v.cycWeight || v.yards || v.meters || v.grams || v.fiber || v.knitGauge || v.crochetGauge || v.status || v.catalogOnly || v.sourceUrl);
  }
  function looksPattern(v) {
    return isObject(v) && v.name && Boolean(v.usedYarns || v.craft || v.project || v.designer || v.patternUrl || v.pdfUrl || v.ravelryUrl || v.sourceBrand);
  }
  function normalizeYarn(y) {
    const p = yarnIdentityParts(y.brand, y.name);
    const originalWeight = y.manufacturerWeight || y.weightOriginal || y.weight || "";
    const discontinued = Boolean(y.discontinued || /^discontinued$/i.test(String(y.status || "")) || /^legacy$/i.test(String(y.status || "")));
    return {
      ...y, brand: p.brand, name: p.name,
      manufacturerWeight: originalWeight || undefined,
      weight: canonicalWeight(y.weight || y.cycWeightName || originalWeight),
      discontinued,
      status: discontinued ? "Discontinued" : (y.status || "Current")
    };
  }
  function normalizeYarnRef(ref) {
    const raw = String(ref || "");
    const [brand, ...name] = raw.split("|");
    if (!name.length) return raw;
    const p = yarnIdentityParts(brand, name.join("|"));
    return `${p.brand}|${p.name}`;
  }
  function normalizePattern(p) {
    const craftText = norm(p.craft);
    const craft = craftText.includes("crochet") ? "crochet" : craftText.includes("knit") ? "knit" : p.craft;
    return {
      ...p,
      sourceBrand: canonicalBrand(p.sourceBrand || p.brand || "") || p.sourceBrand,
      brands: [...new Set((p.brands || [p.sourceBrand || p.brand]).filter(Boolean).map(canonicalBrand))],
      craft,
      usedYarns: [...new Set((p.usedYarns || []).map(normalizeYarnRef))]
    };
  }

  // Normalize existing catalogs in place so every downstream consumer sees the same identities.
  for (const [key, value] of Object.entries(window)) {
    if (!Array.isArray(value)) continue;
    if (/YARN/i.test(key)) {
      for (let i = 0; i < value.length; i++) if (looksYarn(value[i])) value[i] = normalizeYarn(value[i]);
    }
    if (/PATTERN|DESIGN/i.test(key)) {
      for (let i = 0; i < value.length; i++) if (looksPattern(value[i])) value[i] = normalizePattern(value[i]);
    }
  }

  const additions = [];
  const addSeed = (brand, name, extra = {}) => additions.push(normalizeYarn({
    brand, name, catalogOnly: true, auditSeed: true, ...extra
  }));

  // Convert family-name-only catalogs into searchable records without inventing specifications.
  for (const name of window.LION_BRAND_YARN_FAMILIES || []) addSeed("Lion Brand", name, { status: "Unverified current status", sourceUrl: "https://www.lionbrand.com/collections/all-yarns" });
  for (const name of window.LION_BRAND_LEGACY_YARN_FAMILIES || []) addSeed("Lion Brand", name, { discontinued: true, status: "Discontinued", sourceUrl: "https://www.lionbrand.com/collections/discontinued-yarn" });
  for (const [brand, names] of Object.entries(window.YARNSPIRATIONS_YARN_FAMILIES || {})) {
    for (const name of names || []) addSeed(brand, name, { status: "Unverified current status", sourceUrl: "https://www.yarnspirations.com/collections/yarn" });
  }

  const CURRENT_SEEDS = {
    // Current Koigu yarn pages checked 2026-09-03. Roving Fibre is spinning fibre,
    // not a knitting/crochet yarn, so it is intentionally excluded. Aura is not
    // promoted in the current yarn navigation and is therefore not force-marked Current.
    "Koigu": ["KPPPM","KPM","Lace","Jasmine","Kersti","Chelsea","Othello","Sofie","Masham","Corriedale/Gotland","Cheers","Winnie","Andra","Blossom"],
    "Quince & Co.": ["Chickadee","Kestrel","Osprey","Owl","Finch","Puffin","Puffin Speckled","Phoebe","Tern","Owlet","Dove","Piper","Starling","Sparrow","Wren","Willet","Lark","Whimbrel","Plover","Hawk","Not Quite Lark","Cormo"],
    "Kelbourne Woolens": ["Camper","Cozy","Cricket","Erin","Germantown","Germantown DK","Harmony","Keystone","Lucky Tweed","Mojave","Perennial","Scout","Skipper"],
    "Knitting for Olive": ["Merino","Heavy Merino","Soft Silk Mohair","Pure Silk","Cotton Merino","Compatible Cashmere","No Waste Wool"],
    "Lise Tailor": ["Silk Mohair","Fingering Merino","Cumulus","Silk Merino","Aube","Filena"],
    "UK Alpaca": ["Superfine Alpaca 4-Ply","Suri Alpaca 4-Ply","Baby Alpaca & Silk 4-Ply","Superfine Alpaca DK","Baby Alpaca & Silk DK","Superfine Alpaca Chunky"],
    "Purl Soho": ["Morning","June Worsted","Quartz","Sketchbook Cotton"],
    "Berroco": ["Stratto","Nuvola","Merino 401 Chunky","Brina","Biella","Remix Wool DK","Remix Wool","Modern Comfort","Cashmello","Aerial Dégradé","Aurelia","Gianna","Vellina","Mirelle","Emberstone","Vintage Handpaint","Vintage Sock Handpaint","Vera","Paperie","Iris"],
    "DROPS": ["Saga"]
  };
  const SOURCE_ROOT = {
    "Koigu": "https://www.koigu.com/", "Quince & Co.": "https://quinceandco.com/collections/yarn",
    "Kelbourne Woolens": "https://kelbournewoolens.com/collections/yarn", "Knitting for Olive": "https://knittingforolive.com/collections/yarn",
    "Lise Tailor": "https://lisetailor.com/en/pages/nos-laines", "UK Alpaca": "https://www.ukalpaca.com/shop/",
    "Purl Soho": "https://www.purlsoho.com/collections/yarn", "Berroco": "https://berroco.com/yarn/",
    "DROPS": "https://www.garnstudio.com/yarns.php?cid=19"
  };
  for (const [brand, names] of Object.entries(CURRENT_SEEDS)) {
    for (const name of names) addSeed(brand, name, {
      sourceUrl: SOURCE_ROOT[brand],
      sourceCheckedAt: "2026-09-03",
      status: "Current"
    });
  }

  // Verified current technical records that were missing from the old catalogs.
  const verifiedSeeds = [
    ["Koigu","Blossom",{weight:"DK",grams:100,yards:255,meters:233,fiber:"70% Falkland Merino / 15% Baby Alpaca / 15% Tussah Silk",sourceUrl:"https://www.koigu.com/blossom"}],
    ["Purl Soho","Morning",{weight:"DK",manufacturerWeight:"Light Worsted/DK",grams:100,yards:191,meters:175,knitGauge:[20,22],needleSize:"US 5–6 (3.75–4 mm)",hookSize:"E–F (3.5–4 mm)",fiber:"75% organically grown cotton / 25% yak",sourceUrl:"https://www.purlsoho.com/products/morning"}],
    ["Purl Soho","June Worsted",{weight:"Worsted",manufacturerWeight:"Worsted/Aran",grams:100,yards:164,meters:150,knitGauge:[17,20],needleSize:"US 6–8 (4–5 mm)",hookSize:"G–H (4–5 mm)",fiber:"70% organically grown cotton / 30% linen",sourceUrl:"https://www.purlsoho.com/products/june-worsted"}],
    ["Purl Soho","Quartz",{weight:"Fingering",grams:100,yards:420,knitGauge:[28,32],needleSize:"US 2–3 (3–3.25 mm)",hookSize:"C–D (3–3.25 mm)",fiber:"65% merino wool / 35% suri alpaca",sourceUrl:"https://www.purlsoho.com/products/quartz"}],
    ["Purl Soho","Sketchbook Cotton",{weight:"DK",manufacturerWeight:"Light Worsted/DK",grams:50,yards:150,meters:137,knitGauge:[20,24],needleSize:"US 3–6 (3.25–4 mm)",hookSize:"D–G (3.25–4 mm)",fiber:"100% cotton",sourceUrl:"https://www.purlsoho.com/products/sketchbook-cotton"}],
    ["Lise Tailor","Fingering Merino",{weight:"Fingering",grams:50,yards:191,meters:175,knitGauge:[26,30],needleSize:"2.5–3.5 mm single; up to 5 mm held double",fiber:"100% merino wool",sourceUrl:"https://lisetailor.com/en/products/merinos-ivoire"}],
    ["Lise Tailor","Silk Mohair",{weight:"Lace",grams:25,yards:230,meters:210,knitGauge:null,heldDoubleGauge:[18,24],needleSize:"2 mm alone; up to 4.5 mm held double",fiber:"72% kid mohair / 28% mulberry silk",sourceUrl:"https://lisetailor.com/en/products/mohair-soie-encre"}],
    ["Lise Tailor","Silk Merino",{weight:"Fingering",grams:50,yards:219,meters:200,knitGauge:[26,28],needleSize:"2.5–3.5 mm",fiber:"70% merino / 30% mulberry silk",sourceUrl:"https://lisetailor.com/en/products/merinos-soie-nude"}],
    ["Lise Tailor","Cumulus",{weight:"DK",manufacturerWeight:"DK–Worsted",grams:50,yards:109,meters:100,knitGauge:[15,15],needleSize:"4.5–5.5 mm",fiber:"78% kid mohair / 13% superwash merino / 9% polyamide",sourceUrl:"https://lisetailor.com/en/products/cumulus-prune"}],
    ["Lise Tailor","Aube",{weight:"Aran",grams:50,yards:90,meters:82,knitGauge:[16,16],needleSize:"5–5.5 mm",fiber:"100% merino wool",sourceUrl:"https://lisetailor.com/en/products/aube-ivoire"}],
    ["Lise Tailor","Filena",{weight:"Fingering",grams:50,yards:197,meters:180,knitGauge:[28,28],needleSize:"2.5–3.5 mm",fiber:"100% organic cotton",sourceUrl:"https://lisetailor.com/en/products/filena-ivoire"}],
    ["UK Alpaca","Suri Alpaca 4-Ply",{weight:"Fingering",grams:50,yards:245,meters:225,knitGauge:[24,28],needleSize:"3.25–3.5 mm",fiber:"75% suri alpaca / 20% huacaya alpaca / 5% silk",sourceUrl:"https://www.ukalpaca.com/shop/4-ply-knitting-yarns/suri-alpaca-4-ply/suri-alpaca-4-ply/"}],
    ["UK Alpaca","Baby Alpaca & Silk 4-Ply",{weight:"Fingering",grams:50,yards:245,meters:225,knitGauge:[23,30],rowGauge:[32,40],needleSize:"2.75–3.5 mm",fiber:"80% British baby alpaca / 20% Tussah silk",sourceUrl:"https://www.ukalpaca.com/shop/4-ply-knitting-yarns/baby-alpaca-silk-4-ply/baby-alpaca-silk-4-ply/"}],
    ["UK Alpaca","Superfine Alpaca DK",{weight:"DK",grams:50,yards:122,meters:112,fiber:"75% superfine alpaca / 25% wool",sourceUrl:"https://www.ukalpaca.com/shop/double-knitting-dk-yarns/superfine-alpaca-dk/superfine-alpaca-dk/"}],
    ["UK Alpaca","Baby Alpaca & Silk DK",{weight:"DK",grams:50,yards:122,meters:112,fiber:"80% British baby alpaca / 20% Tussah silk",sourceUrl:"https://www.ukalpaca.com/shop/double-knitting-dk-yarns/baby-alpaca-silk-dk/baby-alpaca-silk-dk/"}],
    ["UK Alpaca","Superfine Alpaca Chunky",{weight:"Bulky",grams:50,yards:55,meters:50,knitGauge:[15,15],needleSize:"6 mm",fiber:"75% superfine alpaca / 25% wool",sourceUrl:"https://www.ukalpaca.com/shop/chunky-knitting-yarns/superfine-alpaca-chunky/superfine-alpaca-chunky/"}],
    ["Wollbiene","Cupcake",{weight:"DK",grams:150,yards:590,meters:540,knitGauge:[22,22],rowGauge:[30,30],needleSize:"3.5–4 mm",fiber:"100% polyacrylic",sourceUrl:"https://www.wollbiene-shop.de/en/products/wollbiene-cupcake"}],
    ["Wollbiene","Cupcake Glitter",{weight:"DK",grams:150,yards:590,meters:540,knitGauge:[22,22],rowGauge:[30,30],needleSize:"3.5–4 mm",fiber:"97% polyacrylic / 3% glitter",sourceUrl:"https://www.wollbiene-shop.de/en/products/wollbiene-cupcake-glitter"}]
  ];
  for (const [brand, name, extra] of verifiedSeeds) addSeed(brand, name, {
    ...extra, sourceCheckedAt: "2026-09-03", manualVerified: true, catalogOnly: false, status: "Current"
  });

  // Yarnspirations currently has additional customer-facing brand boutiques. Add brand seeds only where a stable current product is known;
  // the full updater uses the official source pages to populate the actual product lines.
  addSeed("Aunt Lydia's", "Classic 10 Crochet Thread", { sourceUrl: "https://www.yarnspirations.com/collections/aunt-lydias", sourceCheckedAt: "2026-09-03", status: "Current" });
  // Anchor is a current Yarnspirations boutique. The updater discovers the
  // exact thread/yarn lines rather than inventing a fake generic yarn record.
  window.GARN_SWATCH_BRAND_SEEDS = [...(window.GARN_SWATCH_BRAND_SEEDS || []), "Anchor", "Aunt Lydia's"];

  const merged = new Map();
  const discoveredYarns = [];
  for (const [key, list] of Object.entries(window)) {
    if (!Array.isArray(list) || !/YARN/i.test(key)) continue;
    for (const item of list) if (looksYarn(item)) discoveredYarns.push(item);
  }
  const allYarns = [...discoveredYarns, ...additions].filter(looksYarn).map(normalizeYarn);


  function yarnRecordQuality(yarn) {
    if (!yarn) return -1;
    let score = 0;
    if (yarn.manualVerified || yarn.verified === true) score += 100;
    if (!yarn.catalogOnly) score += 20;
    if (yarn.autoImported) score += 5;
    const source = String(yarn.productUrl || yarn.sourceUrl || yarn.url || "");
    if (source && !/\/(?:collections?|yarns?|products?)\/?(?:[?#].*)?$/i.test(source)) score += 20;
    ["weight","yards","meters","grams","fiber","knitGauge","crochetGauge","needleSize","hookSize","image"].forEach(function (key) {
      const value = yarn[key];
      if (value !== undefined && value !== null && value !== "") score += 2;
    });
    return score;
  }

  for (const yarn of allYarns) {
    const key = putupIdentity(yarn);
    const old = merged.get(key);
    if (!old) { merged.set(key, yarn); continue; }
    // Verified/manual fields win over catalog-only seed fields. Never let an empty seed erase real data.
    const preferred = yarnRecordQuality(yarn) > yarnRecordQuality(old) ? yarn : old;
    const other = preferred === old ? yarn : old;
    merged.set(key, {
      ...other, ...preferred,
      image: preferred.image || other.image,
      sourceUrl: preferred.sourceUrl || other.sourceUrl,
      knitGauge: preferred.knitGauge || other.knitGauge,
      crochetGauge: preferred.crochetGauge || other.crochetGauge,
      discontinued: Boolean(preferred.discontinued || other.discontinued),
      status: (preferred.discontinued || other.discontinued) ? "Discontinued" : (preferred.status || other.status || "Current")
    });
  }

  // Specific status correction found by the audit: keep Skellig DK searchable, but no longer current.
  for (const yarn of merged.values()) {
    if (norm(yarn.brand).startsWith("atlantic coast") && norm(yarn.name) === "skellig dk") {
      yarn.discontinued = true; yarn.status = "Discontinued";
    }
  }

  // The integration can miss unexpected pattern arrays. Collect only those not already represented in the major master arrays.
  const knownPatternObjects = new Set([
    ...(window.PATTERN_CATALOG || []), ...(window.EXTERNAL_PATTERN_CATALOG || []), ...(window.KELBOURNE_FAMILY_PATTERN_CATALOG || []),
    ...(window.BERROCO_FAMILY_PATTERN_CATALOG || []), ...(window.AUTO_PATTERN_CATALOG || [])
  ]);
  const repairPatterns = [];
  for (const [key, list] of Object.entries(window)) {
    if (!Array.isArray(list) || !/PATTERN|DESIGN/i.test(key)) continue;
    if (["KFI_PATTERN_INDEX","NOVELTY_PATTERN_CATALOG"].includes(key)) continue;
    for (const p of list) if (looksPattern(p) && !knownPatternObjects.has(p)) repairPatterns.push(normalizePattern(p));
  }

  window.GARN_SWATCH_AUDIT_YARNS = [...merged.values()];
  window.GARN_SWATCH_AUDIT_PATTERNS = repairPatterns;
  // YARN_CATALOG is the broadest source consumed by app.js; replace it with the normalized master to guarantee seeds/legacy records are visible.
  window.YARN_CATALOG = window.GARN_SWATCH_AUDIT_YARNS;

  const yarnKeys = new Set(window.GARN_SWATCH_AUDIT_YARNS.map(yarnIdentity));
  const allPatternObjects = [
    ...(window.PATTERN_CATALOG || []), ...(window.EXTERNAL_PATTERN_CATALOG || []), ...(window.KELBOURNE_FAMILY_PATTERN_CATALOG || []),
    ...(window.BERROCO_FAMILY_PATTERN_CATALOG || []), ...(window.AUTO_PATTERN_CATALOG || []), ...repairPatterns
  ].filter(looksPattern).map(normalizePattern);
  const orphanPatternYarns = [];
  const zeroExact = new Map([...yarnKeys].map((k) => [k, 0]));
  const collectionRisks = [];
  const genericUrl = /\/(collections?|patterns?|designs?|products?)\/?(?:[?#].*)?$/i;
  for (const p of allPatternObjects) {
    for (const ref of p.usedYarns || []) {
      const k = yarnIdentity(ref);
      if (yarnKeys.has(k)) zeroExact.set(k, (zeroExact.get(k) || 0) + 1);
      else orphanPatternYarns.push({ pattern: p.name, yarn: ref });
    }
    const u = String(p.patternUrl || p.url || p.sourceUrl || "");
    if (u && genericUrl.test(u)) collectionRisks.push({ pattern: p.name, url: u });
  }

  const duplicateBase = new Map();
  for (const y of window.GARN_SWATCH_AUDIT_YARNS) {
    const k = yarnIdentity(y);
    const list = duplicateBase.get(k) || [];
    list.push({ grams: y.grams || null, yards: y.yards || null, name: y.name, brand: y.brand });
    duplicateBase.set(k, list);
  }

  window.GARN_SWATCH_AUDIT = {
    version: "2026-09-03-full-audit-repair",
    canonicalBrand, canonicalWeight, canonicalYarnName, yarnIdentity, putupIdentity,
    diagnostics: {
      yarnCount: window.GARN_SWATCH_AUDIT_YARNS.length,
      repairPatternCount: repairPatterns.length,
      orphanPatternYarns,
      collectionPagePatternRisks: collectionRisks,
      zeroExactPatternYarns: [...zeroExact.entries()].filter(([, count]) => count === 0).map(([key]) => key),
      multiplePutups: [...duplicateBase.entries()].filter(([, values]) => values.length > 1).map(([key, values]) => ({ key, values }))
    }
  };
}());
