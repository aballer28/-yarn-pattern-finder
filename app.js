(function () {
  "use strict";

  function normalizedKey(value) {
    return String(value || "")
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[®™©]/g, "")
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  const brandAliases = new Map([
    ["queensland", "Queensland Collection"],
    ["queensland collection", "Queensland Collection"],
    ["kfi collection", "Knitting Fever Collection"],
    ["knitting fever collection", "Knitting Fever Collection"],
    ["kfi novelty", "Knitting Fever Novelty"],
    ["knitting fever novelty", "Knitting Fever Novelty"]
  ]);
  const patternTitleAliases = new Map([
    ["gina hat", "gina"],
    ["classic patchwork throw", "patchwork throw"],
    ["classic felted bird mobile", "felted bird mobile"],
    ["classic felted pouch", "felted pouch"],
    ["classic felted persian slippers", "felted persian slippers"],
    ["classic felted weekend tote", "weekend tote"],
    ["classic chantilly cushion", "chantilly cushion"],
    ["classic felted ottoman cover", "felted ottoman"]
  ]);
  const kfiCrochetDesignIds = new Set((window.KFI_CROCHET_DESIGN_IDS || []).map(String));

  function canonicalBrand(brand) {
    if (window.GARN_SWATCH_AUDIT && typeof window.GARN_SWATCH_AUDIT.canonicalBrand === "function") {
      return window.GARN_SWATCH_AUDIT.canonicalBrand(brand);
    }
    return brandAliases.get(normalizedKey(brand)) || brand;
  }

  function canonicalPatternTitle(name) {
    const normalized = normalizedKey(name);
    const withoutPublicationNumber = normalized.replace(/^\d+\s+(?=\S)/, "");
    const standardizedCraft = withoutPublicationNumber
      .replace(/\bcrocheted\b/g, "crochet")
      .replace(/\btshirt\b/g, "t shirt")
      .replace(/\btee shirt\b/g, "t shirt");
    const withoutGenericSuffix = standardizedCraft
      .replace(/\s+(?:knit(?:ting)?|crochet)\s+pattern$/g, "")
      .replace(/\s+pattern$/g, "")
      .trim();
    return patternTitleAliases.get(withoutGenericSuffix) || withoutGenericSuffix;
  }

  function patternHasRavelryLink(pattern) {
    return /ravelry\.com\/patterns\/library\//i.test(String(pattern.ravelryUrl || pattern.url || ""));
  }

  function genericPatternTitle(title) {
    return new Set([
      "sweater", "cardigan", "pullover", "hat", "scarf", "cowl", "shawl",
      "socks", "sock", "mittens", "mittens and slippers", "slippers",
      "vest", "dress", "top", "t shirt", "blanket"
    ]).has(title);
  }

  function canonicalYarnKey(value) {
    const raw = String(value || "");
    if (window.GARN_SWATCH_AUDIT && typeof window.GARN_SWATCH_AUDIT.yarnIdentity === "function") {
      const [brand, ...nameParts] = raw.split("|");
      if (nameParts.length) {
        const key = window.GARN_SWATCH_AUDIT.yarnIdentity(raw);
        const match = (window.GARN_SWATCH_AUDIT_YARNS || []).find((yarn) => window.GARN_SWATCH_AUDIT.yarnIdentity(yarn) === key);
        return match ? `${match.brand}|${match.name}` : `${canonicalBrand(brand)}|${nameParts.join("|")}`;
      }
    }
    const [brand, ...nameParts] = raw.split("|");
    return nameParts.length ? `${canonicalBrand(brand)}|${nameParts.join("|")}` : raw;
  }

  function localYarnIdentityParts(brand, name) {
    let brandKey = normalizedKey(canonicalBrand(brand));
    let nameKey = normalizedKey(name).replace(/\s+yarn$/, "");

    const brandIdentityAliases = new Map([
      ["queensland", "queensland collection"],
      ["kfi collection", "knitting fever collection"],
      ["kfi novelty", "knitting fever novelty"],
      ["euroyarns novelty", "knitting fever novelty"],
      ["istex", "lopi"],
      ["lopi yarn", "lopi"],
      ["peaches creme", "peaches and creme"],
      ["lily sugar n cream", "lily sugar n cream"],
      ["lily sugar and cream", "lily sugar n cream"],
      ["aunt lydias", "aunt lydia s"],
      ["bc garn by kremke", "bc garn"],
      ["quince and co", "quince and co"],
      ["quince co", "quince and co"]
    ]);
    brandKey = brandIdentityAliases.get(brandKey) || brandKey;

    if (brandKey === "lise tailor") {
      if (["merino", "merinos", "merino fingering", "fingering merino"].includes(nameKey)) nameKey = "fingering merino";
      if (["merino silk", "silk merino", "merinos soie", "merino and silk"].includes(nameKey)) nameKey = "silk merino";
      if (["mohair silk", "silk mohair", "mohair soie", "mohair and silk"].includes(nameKey)) nameKey = "silk mohair";
    }
    if (brandKey === "koigu" && ["corriedale gotland", "corriedale and gotland"].includes(nameKey)) {
      nameKey = "corriedale gotland";
    }
    if (brandKey === "uk alpaca" && ["superfine alpaca 4 ply", "superfine 4 ply"].includes(nameKey)) {
      nameKey = "superfine alpaca 4 ply";
    }
    if (nameKey === "cormo" && brandKey === "stone wool") brandKey = "quince and co";

    return { brandKey, nameKey };
  }

  function localYarnIdentity(value) {
    if (typeof value === "string") {
      const [brand, ...nameParts] = value.split("|");
      if (!nameParts.length) return normalizedKey(value);
      const parts = localYarnIdentityParts(brand, nameParts.join("|"));
      return `${parts.brandKey}|${parts.nameKey}`;
    }
    const parts = localYarnIdentityParts(value && value.brand, value && value.name);
    return `${parts.brandKey}|${parts.nameKey}`;
  }

  function sameYarnReference(reference, yarn) {
    if (!reference || !yarn) return false;
    if (window.GARN_SWATCH_AUDIT && typeof window.GARN_SWATCH_AUDIT.yarnIdentity === "function") {
      return window.GARN_SWATCH_AUDIT.yarnIdentity(reference) === window.GARN_SWATCH_AUDIT.yarnIdentity(yarn);
    }
    return localYarnIdentity(reference) === localYarnIdentity(yarn);
  }

  function yarnImageQuality(value) {
    const image = String(value || "");
    if (!image) return 0;
    if (/^\/api\/yarn-image\?/i.test(image) && /(?:^|&)fallback=/i.test(image)) return 4;
    if (/^https?:\/\//i.test(image)) return 3;
    if (/^\/api\/yarn-image\?/i.test(image)) return 2;
    return 1;
  }

  function bestYarnImage(existing, incoming) {
    const a = existing && existing.image;
    const b = incoming && incoming.image;
    return yarnImageQuality(b) > yarnImageQuality(a) ? b : (a || b);
  }

  function yarnPutups() {
    const seen = new Map();
    for (const item of arguments) {
      if (!item) continue;
      const candidates = Array.isArray(item.putups) && item.putups.length ? item.putups : [item];
      for (const candidate of candidates) {
        const grams = Number(candidate.grams) || null;
        const yards = Number(candidate.yards) || null;
        const meters = Number(candidate.meters) || null;
        if (!grams && !yards && !meters) continue;
        const key = `${grams || 0}|${yards || 0}|${meters || 0}`;
        if (!seen.has(key)) seen.set(key, { grams, yards, meters, ounces: candidate.ounces || null, sourceUrl: candidate.sourceUrl || item.sourceUrl || "" });
      }
    }
    return [...seen.values()];
  }

  function dedupeYarns(items) {
    const merged = new Map();
    items.forEach((item) => {
      const incoming = { ...item, brand: canonicalBrand(item.brand) };
      const key = `${normalizedKey(incoming.brand)}|${normalizedKey(incoming.name)}`;
      const existing = merged.get(key);
      if (!existing) {
        merged.set(key, { ...incoming, putups: yarnPutups(incoming) });
        return;
      }
      merged.set(key, {
        ...incoming,
        ...existing,
        kfiId: existing.kfiId || incoming.kfiId,
        image: bestYarnImage(existing, incoming),
        knitGauge: existing.knitGauge || incoming.knitGauge,
        crochetGauge: existing.crochetGauge || incoming.crochetGauge,
        sourceUrl: existing.sourceUrl || incoming.sourceUrl,
        putups: yarnPutups(existing, incoming),
        discontinued: Boolean(existing.discontinued || incoming.discontinued),
        status: (existing.discontinued || incoming.discontinued)
          ? "Discontinued"
          : (existing.status || incoming.status)
      });
    });
    return [...merged.values()];
  }

  function patternIdentity(pattern) {
    if (pattern.sourceId) return pattern.sourceId;
    if (pattern.kfiDesignId) return `kfi:${pattern.kfiDesignId}`;
    const kfiMatch = String(pattern.url || "").match(/knittingfever\.com\/design\/(\d+)/i);
    if (kfiMatch) return `kfi:${kfiMatch[1]}`;
    const ravelryMatch = String(pattern.ravelryUrl || pattern.url || "").match(/ravelry\.com\/patterns\/library\/([^/?#]+)/i);
    if (ravelryMatch) return `ravelry:${normalizedKey(ravelryMatch[1])}`;
    const titleKey = canonicalPatternTitle(pattern.name);
    const sourceToken = normalizedKey(pattern.patternUrl || pattern.url || pattern.sourceUrl || pattern.pdfUrl || "");
    return genericPatternTitle(titleKey) && sourceToken
      ? `pattern:${titleKey}|${normalizedKey(pattern.designer)}|${normalizedKey(pattern.craft)}|${sourceToken}`
      : `pattern:${titleKey}|${normalizedKey(pattern.designer)}|${normalizedKey(pattern.craft)}`;
  }

  function dedupePatterns(items) {
    const merged = new Map();
    items.forEach((incoming) => {
      const normalized = {
        ...incoming,
        usedYarns: (incoming.usedYarns || []).map(canonicalYarnKey)
      };
      const key = patternIdentity(normalized);
      const existing = merged.get(key);
      if (!existing) {
        merged.set(key, normalized);
        return;
      }
      merged.set(key, {
        ...normalized,
        ...existing,
        usedYarns: [...new Set([...(existing.usedYarns || []), ...normalized.usedYarns])],
        image: existing.image || normalized.image,
        ravelryUrl: existing.ravelryUrl || normalized.ravelryUrl,
        url: existing.url || normalized.url
      });
    });
    return [...merged.values()];
  }

  const yarns = dedupeYarns([
    ...(window.YARN_CATALOG || []),
    ...(window.KFI_YARN_CATALOG || []),
    ...(window.KNIT_PICKS_YARN_CATALOG || []).filter((yarn) => yarn.yards > 0 && yarn.grams > 0),
    ...(window.YARN_IMAGE_CATALOG || []),
    ...(window.KELBOURNE_FAMILY_YARN_CATALOG || []),
    ...(window.BERROCO_FAMILY_YARN_CATALOG || []),
    ...(window.AUTO_YARN_CATALOG || [])
  ]);
  const patterns = dedupePatterns([...(window.PATTERN_CATALOG || []), ...(window.KFI_PATTERN_CATALOG || []), ...(window.KELBOURNE_FAMILY_PATTERN_CATALOG || []), ...(window.BERROCO_FAMILY_PATTERN_CATALOG || [])]);
  const kfiPatternIndex = (window.KFI_PATTERN_INDEX || []).map(([id, name, image, url, usedYarns]) => ({
    kfiDesignId: String(id),
    name,
    image,
    url,
    usedYarns: (usedYarns || []).map(canonicalYarnKey)
  }));
  const noveltyPatternCatalog = (window.NOVELTY_PATTERN_CATALOG || []).map(([id, name, image, url, brand]) => ({
    kfiDesignId: String(id),
    name,
    image,
    url,
    brand: canonicalBrand(brand)
  }));
  const externalPatternCatalog = (window.EXTERNAL_PATTERN_CATALOG || []).map((pattern) => ({
    ...pattern,
    usedYarns: (pattern.usedYarns || []).map(canonicalYarnKey),
    brands: (pattern.brands || [pattern.sourceBrand]).filter(Boolean).map(canonicalBrand)
  }));
  const knitPicksPatternCatalog = (window.KNIT_PICKS_PATTERN_CATALOG || []).map((pattern) => ({
    ...pattern,
    usedYarns: (pattern.usedYarns || []).map(canonicalYarnKey),
    brands: ["Knit Picks"]
  }));

  function buildMasterPatternCatalog() {
    const byIdentity = new Map();
    const sources = [
      ...kfiPatternIndex.map((pattern) => ({
        ...pattern,
        brands: [...new Set(pattern.usedYarns.map((yarnKey) => yarnKey.split("|")[0]))]
      })),
      ...noveltyPatternCatalog.map((pattern) => ({ ...pattern, brands: [pattern.brand], usedYarns: [] })),
      ...externalPatternCatalog,
      ...knitPicksPatternCatalog,
      ...(window.KELBOURNE_FAMILY_PATTERN_CATALOG || []).map((pattern) => ({
        ...pattern,
        usedYarns: (pattern.usedYarns || []).map(canonicalYarnKey),
        brands: (pattern.brands || [pattern.sourceBrand]).filter(Boolean).map(canonicalBrand)
      })),
      ...(window.BERROCO_FAMILY_PATTERN_CATALOG || []).map((pattern) => ({
        ...pattern,
        usedYarns: (pattern.usedYarns || []).map(canonicalYarnKey),
        brands: (pattern.brands || [pattern.sourceBrand]).filter(Boolean).map(canonicalBrand)
      })),
      ...(window.AUTO_PATTERN_CATALOG || []).map((pattern) => ({
        ...pattern,
        usedYarns: (pattern.usedYarns || []).map(canonicalYarnKey),
        brands: (pattern.brands || [pattern.sourceBrand]).filter(Boolean).map(canonicalBrand)
      })),
      ...(window.GARN_SWATCH_AUDIT_PATTERNS || []).map((pattern) => ({
        ...pattern,
        usedYarns: (pattern.usedYarns || []).map(canonicalYarnKey),
        brands: (pattern.brands || [pattern.sourceBrand]).filter(Boolean).map(canonicalBrand)
      }))
    ];

    sources.forEach((incoming) => {
      const key = patternIdentity(incoming);
      const existing = byIdentity.get(key);
      if (!existing) {
        byIdentity.set(key, incoming);
        return;
      }
      byIdentity.set(key, {
        ...incoming,
        ...existing,
        brands: [...new Set([...(existing.brands || []), ...(incoming.brands || [])])],
        usedYarns: [...new Set([...(existing.usedYarns || []), ...(incoming.usedYarns || [])])],
        image: existing.image || incoming.image,
        url: existing.url || incoming.url
      });
    });

    return dedupePatternLibrary([...byIdentity.values()]).sort((a, b) => a.name.localeCompare(b.name));
  }

  const allPatternCatalog = buildMasterPatternCatalog();
  const yarnByKey = new Map();
  yarns.forEach((yarn) => {
    yarnByKey.set(`${yarn.brand}|${yarn.name}`, yarn);
    yarnByKey.set(localYarnIdentity(yarn), yarn);
  });

  function yarnByReference(reference) {
    return yarnByKey.get(reference) || yarnByKey.get(localYarnIdentity(reference));
  }

  function inferredPatternCraft(pattern) {
    if (pattern.craft === "knit" || pattern.craft === "crochet") return pattern.craft;
    if (kfiCrochetDesignIds.has(String(pattern.kfiDesignId || ""))) return "crochet";
    const title = normalizedKey(pattern.name);
    if (/\b(crochet|crocheted|granny|amigurumi)\b/.test(title)) return "crochet";
    if (/\b(knit|knitting|knitted)\b/.test(title)) return "knit";
    // Unknown craft stays unknown. Do not silently put an unverified pattern in
    // the knitting results merely because no crochet keyword was found.
    return "unknown";
  }

  function inferredPatternProject(pattern) {
    if (pattern.project) return pattern.project;
    const title = normalizedKey(pattern.name);
    const matches = [
      ["Hat", /\b(hat|beanie|cap|tam|beret)\b/],
      ["Scarf", /\bscarf\b/],
      ["Mittens", /\b(mitt|mitts|mitten|mittens|glove|gloves)\b/],
      ["Sweater", /\b(sweater|cardigan|pullover|tee|top|vest|tunic)\b/],
      ["Shawl", /\b(shawl|wrap|stole)\b/],
      ["Cowl", /\b(cowl|snood)\b/],
      ["Baby", /\b(baby|infant|toddler)\b/],
      ["Blanket", /\b(blanket|throw|afghan)\b/],
      ["Socks", /\b(sock|socks|slipper|slippers)\b/],
      ["Stocking", /\bstocking\b/]
    ];
    return matches.find(([, expression]) => expression.test(title))?.[0] || "Other";
  }

  function patternLibraryKey(pattern) {
    const associations = (pattern.usedYarns || []).length ? pattern.usedYarns : (pattern.brands || []);
    const signature = associations.map(normalizedKey).sort().join(";");
    const titleKey = canonicalPatternTitle(pattern.name);
    const sourceToken = normalizedKey(pattern.patternUrl || pattern.url || pattern.sourceUrl || pattern.pdfUrl || "");
    return genericPatternTitle(titleKey) && sourceToken
      ? `${titleKey}|${signature}|${inferredPatternCraft(pattern)}|${sourceToken}`
      : `${titleKey}|${signature}|${inferredPatternCraft(pattern)}`;
  }

  function patternDetailScore(pattern) {
    const structuredGauge = Number.isFinite(pattern.gauge) || (pattern.gauge && typeof pattern.gauge === "object" && Number.isFinite(Number(pattern.gauge.stitches ?? pattern.gauge.stitchCount)));
    const url = String(pattern.patternUrl || pattern.url || pattern.ravelryUrl || "");
    const exactUrl = Boolean(url) && !genericCollectionUrl(url);
    return Number(structuredGauge) * 4
      + Number(Boolean(pattern.project))
      + Number(Boolean(pattern.designer))
      + Math.min(3, (pattern.usedYarns || []).length) * 2
      + Number(exactUrl) * 2
      + Number(Boolean(pattern.skillLevel))
      + Number(Boolean(pattern.sizesText));
  }

  function mergePatternRecords(existing, incoming) {
    const preferred = patternDetailScore(incoming) > patternDetailScore(existing) ? incoming : existing;
    const other = preferred === incoming ? existing : incoming;
    const shortestName = [existing.name, incoming.name].sort((a, b) => a.length - b.length)[0];
    return {
      ...other,
      ...preferred,
      name: shortestName,
      usedYarns: [...new Set([...(existing.usedYarns || []), ...(incoming.usedYarns || [])])],
      brands: [...new Set([...(existing.brands || []), ...(incoming.brands || [])])],
      image: preferred.image || other.image,
      url: preferred.url || other.url,
      ravelryUrl: preferred.ravelryUrl || other.ravelryUrl
    };
  }

  function dedupePatternLibrary(items) {
    const merged = new Map();
    items.forEach((incoming) => {
      const key = patternLibraryKey(incoming);
      const existing = merged.get(key);
      if (!existing) {
        merged.set(key, incoming);
        return;
      }
      merged.set(key, mergePatternRecords(existing, incoming));
    });

    const byTitleAndCraft = new Map();
    [...merged.values()].forEach((incoming) => {
      const groupKey = `${canonicalPatternTitle(incoming.name)}|${inferredPatternCraft(incoming)}`;
      const group = byTitleAndCraft.get(groupKey) || [];
      const incomingYarns = new Set(incoming.usedYarns || []);
      const canonicalTitle = canonicalPatternTitle(incoming.name);
      const incomingDesigner = normalizedKey(incoming.designer);
      const overlapIndex = group.findIndex((existing) => {
        const existingYarns = new Set(existing.usedYarns || []);
        const yarnOverlap = [...incomingYarns].some((yarnKey) => existingYarns.has(yarnKey));
        // Generic titles such as “Hat” or “Scarf” are not identities. Two
        // different designs may use the same yarn, so yarn overlap alone must
        // never collapse them.
        if (yarnOverlap) return !genericPatternTitle(canonicalTitle);

        // Official-site and Ravelry copies often differ only by a trailing
        // “Pattern”, punctuation, or which source supplied the image/link.
        // Merge those only when the title is specific and the designer agrees.
        const existingDesigner = normalizedKey(existing.designer);
        const sameDesigner = incomingDesigner && existingDesigner && incomingDesigner === existingDesigner;
        const crossSource = patternHasRavelryLink(incoming) || patternHasRavelryLink(existing);
        return crossSource && sameDesigner && !genericPatternTitle(canonicalTitle);
      });
      if (overlapIndex === -1) {
        group.push(incoming);
      } else {
        group[overlapIndex] = mergePatternRecords(group[overlapIndex], incoming);
      }
      byTitleAndCraft.set(groupKey, group);
    });
    return [...byTitleAndCraft.values()].flat();
  }

  function buildRankedPatternCatalog() {
    const merged = new Map(allPatternCatalog.map((pattern) => [patternIdentity(pattern), pattern]));
    patterns.forEach((incoming) => {
      const normalized = {
        ...incoming,
        usedYarns: (incoming.usedYarns || []).map(canonicalYarnKey),
        brands: [...new Set((incoming.usedYarns || []).map(canonicalYarnKey).map((yarnKey) => yarnKey.split("|")[0]))]
      };
      const key = patternIdentity(normalized);
      const existing = merged.get(key);
      merged.set(key, existing ? {
        ...existing,
        ...normalized,
        usedYarns: [...new Set([...(existing.usedYarns || []), ...(normalized.usedYarns || [])])],
        brands: [...new Set([...(existing.brands || []), ...(normalized.brands || [])])],
        image: normalized.image || existing.image,
        url: normalized.url || existing.url
      } : normalized);
    });
    return dedupePatternLibrary([...merged.values()].map((pattern) => ({
      ...pattern,
      craft: inferredPatternCraft(pattern),
      inferredProject: inferredPatternProject(pattern)
    })));
  }

  const rankedPatternCatalog = buildRankedPatternCatalog();
  const $ = (id) => document.getElementById(id);

  const projectIcons = {
    Hat: "◒",
    Scarf: "〰",
    Mittens: "◇",
    Sweater: "▱",
    Shawl: "△",
    Cowl: "◯",
    Baby: "♢",
    Blanket: "▦",
    Socks: "⌁",
    Stocking: "◡"
  };

  const baseRanges = {
    Lace: { Hat: [250, 450], Scarf: [500, 1000], Mittens: [300, 500], Sweater: [1500, 2600], Shawl: [500, 1200], Cowl: [350, 650], Baby: [450, 850], Blanket: [2400, 4200], Socks: [350, 500], Stocking: [350, 550] },
    Fingering: { Hat: [180, 300], Scarf: [350, 650], Mittens: [200, 350], Sweater: [1100, 1800], Shawl: [400, 900], Cowl: [250, 450], Baby: [300, 650], Blanket: [1800, 3200], Socks: [300, 450], Stocking: [300, 500] },
    Sport: { Hat: [170, 280], Scarf: [325, 600], Mittens: [190, 320], Sweater: [1000, 1700], Shawl: [400, 850], Cowl: [235, 425], Baby: [280, 600], Blanket: [1650, 3000], Socks: [275, 425], Stocking: [280, 475] },
    DK: { Hat: [160, 260], Scarf: [300, 550], Mittens: [180, 300], Sweater: [950, 1600], Shawl: [400, 800], Cowl: [220, 400], Baby: [260, 550], Blanket: [1500, 2800], Socks: [250, 400], Stocking: [260, 450] },
    Worsted: { Hat: [140, 240], Scarf: [280, 500], Mittens: [160, 280], Sweater: [850, 1500], Shawl: [350, 750], Cowl: [200, 380], Baby: [240, 500], Blanket: [1400, 2600], Socks: [225, 375], Stocking: [220, 440] },
    Aran: { Hat: [120, 220], Scarf: [250, 450], Mittens: [150, 250], Sweater: [800, 1400], Shawl: [320, 700], Cowl: [180, 350], Baby: [220, 450], Blanket: [1300, 2400], Socks: [210, 350], Stocking: [200, 400] },
    Bulky: { Hat: [100, 180], Scarf: [220, 400], Mittens: [120, 220], Sweater: [700, 1200], Shawl: [300, 600], Cowl: [160, 300], Baby: [200, 400], Blanket: [1100, 2200], Socks: [190, 320], Stocking: [180, 350] },
    "Super Bulky": { Hat: [80, 150], Scarf: [180, 350], Mittens: [100, 180], Sweater: [600, 1000], Shawl: [250, 500], Cowl: [140, 260], Baby: [180, 350], Blanket: [900, 1800], Socks: [160, 280], Stocking: [150, 300] }
  };

  const sizeFactors = { XS: 0.78, S: 0.88, M: 1, L: 1.12, XL: 1.24, "2X": 1.38, "3X": 1.52, "4X": 1.68, "5X": 1.84 };
  const state = { craft: "knit", project: "Hat", patternVisible: 24, patternSort: "closest" };
  const PATTERN_SORT_STORAGE_KEY = "garnSwatchPatternSort";
  const savedPatternSort = (() => {
    try {
      return localStorage.getItem(PATTERN_SORT_STORAGE_KEY) || "";
    } catch {
      return "";
    }
  })();
  if (["az", "za", "closest", "newest", "oldest"].includes(savedPatternSort)) {
    state.patternSort = savedPatternSort;
  }
  const toolRecommendations = {
    Lace: { knit: "US 000–1 (1.5–2.25 mm)", crochet: "Steel 6–8 or B-1 (1.4–2.25 mm)" },
    "LACE / SUPER FINE": { knit: "US 000–3 (1.5–3.25 mm)", crochet: "Steel 6–8 to E-4 (1.4–3.5 mm)" },
    Fingering: { knit: "US 1–3 (2.25–3.25 mm)", crochet: "B-1–E-4 (2.25–3.5 mm)" },
    Sport: { knit: "US 3–5 (3.25–3.75 mm)", crochet: "E-4–7 (3.5–4.5 mm)" },
    DK: { knit: "US 5–7 (3.75–4.5 mm)", crochet: "7–I-9 (4.5–5.5 mm)" },
    Worsted: { knit: "US 7–9 (4.5–5.5 mm)", crochet: "I-9–K-10½ (5.5–6.5 mm)" },
    Aran: { knit: "US 7–9 (4.5–5.5 mm)", crochet: "I-9–K-10½ (5.5–6.5 mm)" },
    "MEDIUM / BULKY": { knit: "US 7–11 (4.5–8 mm)", crochet: "I-9–M-13 (5.5–9 mm)" },
    Bulky: { knit: "US 9–11 (5.5–8 mm)", crochet: "K-10½–M-13 (6.5–9 mm)" },
    "BULKY / SUPER BULKY": { knit: "US 9–17 (5.5–12.75 mm)", crochet: "K-10½–Q (6.5–15 mm)" },
    "Super Bulky": { knit: "US 11–17 (8–12.75 mm)", crochet: "M-13–Q (9–15 mm)" },
    Jumbo: { knit: "US 17+ (12.75 mm+)", crochet: "Q+ (15 mm+)" },
    Novelty: { knit: "Follow the pattern", crochet: "Follow the pattern" }
  };


  function ravelryPatternUrl(pattern) {
    const candidates = [
      pattern && pattern.ravelryUrl,
      pattern && pattern.url,
      pattern && pattern.patternUrl,
      pattern && pattern.sourceUrl
    ].filter(Boolean).map(String);
    return candidates.find((url) =>
      /^https:\/\/(?:www\.)?ravelry\.com\/patterns\/library\//i.test(url)
    ) || "";
  }

  function ravelryPatternLink(pattern) {
    const direct = ravelryPatternUrl(pattern);
    return direct
      ? `<a href="${escapeHtml(direct)}" target="_blank" rel="noopener">View on Ravelry →</a>`
      : "";
  }
  function genericCollectionUrl(url) {
    try {
      const parsed = new URL(String(url || ""), "https://example.invalid");
      const path = parsed.pathname.replace(/\/+$/, "").toLowerCase();
      if (!path || path === "/") return true;
      if (/\/(?:collections?|search|pattern-finder)(?:\/|$)/i.test(path)) return true;
      if (/\/(?:patterns?|designs?)$/i.test(path)) return true;
      const last = path.split("/").filter(Boolean).pop() || "";
      if ([
        "knitting-patterns", "crochet-patterns", "4-ply-knitting-patterns",
        "double-knit-knitting-patterns", "dk-knitting-patterns", "chunky-knitting-patterns"
      ].includes(last)) return true;
      return false;
    } catch {
      return true;
    }
  }

  function customerDesigner(pattern) {
    const raw = String(pattern && pattern.designer || "").trim();
    const hidden = new Set([
      "knitting fever", "knitting fever inc", "knitting fever collection",
      "kfi collection", "kfi novelty", "euroyarns", "euro yarns", "yarnspirations"
    ]);
    return hidden.has(normalizedKey(raw)) ? "" : raw;
  }

  function patternPrimaryUrl(pattern) {
    if (!pattern) return "";
    const candidates = [pattern.patternUrl, pattern.url, pattern.pdfUrl, pattern.ravelryUrl, pattern.sourceUrl]
      .filter(Boolean).map(String);
    // Never label a collection/homepage as the pattern itself. If the catalog
    // only knows a collection page, omit the primary button until the importer
    // discovers the exact design URL.
    return candidates.find((url) => !genericCollectionUrl(url)) || "";
  }

  function yarnPrimaryUrl(yarn) {
    if (!yarn) return "";
    const candidates = [yarn.productUrl, yarn.sourceUrl, yarn.imagePage, yarn.url, yarn.ravelryUrl].filter(Boolean).map(String);
    const exact = candidates.find((url) => !genericCollectionUrl(url));
    return exact || candidates[0] || "";
  }
  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function brands() {
    return [...new Set(yarns.map((yarn) => yarn.brand))].sort((a, b) => a.localeCompare(b));
  }

  function baseYarnFor(brandId, yarnId) {
    const brandSelect = $(brandId);
    const yarnSelect = $(yarnId);
    if (!brandSelect || !yarnSelect) return yarns[0];
    const brand = brandSelect.value;
    const name = yarnSelect.value;
    return yarns.find((yarn) => yarn.brand === brand && yarn.name === name) || yarns[0];
  }

  function selectedBaseYarn() {
    return baseYarnFor("brandSelect", "yarnSelect");
  }

  function selectedSecondBaseYarn() {
    return baseYarnFor("secondBrandSelect", "secondYarnSelect");
  }

  function yarnWithSelectedPutup(yarn, selectId) {
    if (!yarn) return yarn;
    const putups = yarnPutups(yarn);
    const select = $(selectId);
    const index = select && !select.disabled ? Number(select.value) : 0;
    const putup = putups[index] || putups[0];
    return putup ? { ...yarn, ...putup, putups } : yarn;
  }

  function currentYarn() {
    return yarnWithSelectedPutup(selectedBaseYarn(), "putupSelect");
  }

  function currentSecondYarn() {
    return yarnWithSelectedPutup(selectedSecondBaseYarn(), "secondPutupSelect");
  }

  function usingHeldTogether() {
    if (typeof document === "undefined") return false;
    const control = $("holdTogether");
    return Boolean(control && control.checked);
  }

  function selectedYarns() {
    const first = currentYarn();
    if (!usingHeldTogether()) return [first];
    const second = currentSecondYarn();
    return second ? [first, second] : [first];
  }

  function combinedSwatchGauge() {
    if (typeof document === "undefined" || !usingHeldTogether()) return null;
    const value = Number($("combinedGauge")?.value || 0);
    return Number.isFinite(value) && value > 0 ? [value, value] : null;
  }

  const STRAND_THICKNESS = new Map([
    ["Lace", 1], ["Fingering", 2], ["Sport", 3], ["DK", 4],
    ["Worsted", 5], ["Aran", 6], ["Bulky", 9], ["Super Bulky", 13], ["Jumbo", 18]
  ]);
  const COMBINED_GAUGE_GUIDES = {
    Lace: [33, 40], Fingering: [27, 32], Sport: [23, 26], DK: [21, 24],
    Worsted: [16, 20], Aran: [16, 18], Bulky: [12, 15], "Super Bulky": [7, 11], Jumbo: [1, 6]
  };
  const COMBINED_WEIGHT_LABELS = {
    Fingering: "Fingering / Sock", Bulky: "Bulky / Chunky"
  };

  function strandThickness(yarn) {
    const families = weightFamilies(yarn && yarn.weight).filter((weight) => STRAND_THICKNESS.has(weight));
    if (!families.length) return null;
    return families.reduce((sum, weight) => sum + STRAND_THICKNESS.get(weight), 0) / families.length;
  }

  function combinedYarnWeight(yarnSelection) {
    const chosen = selectionYarns(yarnSelection);
    if (!chosen.length) return "";
    if (chosen.length === 1) return weightFamilies(chosen[0].weight)[0] || chosen[0].weight || "";
    const scores = chosen.map(strandThickness).filter(Number.isFinite);
    if (scores.length !== chosen.length) return "";
    const total = scores.reduce((sum, score) => sum + score, 0);
    return [...STRAND_THICKNESS.entries()]
      .sort((a, b) => Math.abs(a[1] - total) - Math.abs(b[1] - total) || a[1] - b[1])[0]?.[0] || "";
  }

  function combinedWeightLabel(yarnSelection) {
    const weight = combinedYarnWeight(yarnSelection);
    return COMBINED_WEIGHT_LABELS[weight] || weight || "Not enough label data";
  }

  function estimatedCombinedGaugeRange(yarnSelection) {
    const weight = combinedYarnWeight(yarnSelection);
    const guide = COMBINED_GAUGE_GUIDES[weight];
    return guide ? guide.slice() : null;
  }

  function populatePutupControl(yarn, fieldId, selectId) {
    const field = $(fieldId);
    const select = $(selectId);
    if (!field || !select || !yarn) return;
    const putups = yarnPutups(yarn);
    field.hidden = putups.length <= 1;
    select.disabled = putups.length <= 1;
    select.innerHTML = putups.map((putup, index) => {
      const parts = [];
      if (putup.grams) parts.push(`${putup.grams} g`);
      if (putup.yards) parts.push(`${putup.yards} yd`);
      else if (putup.meters) parts.push(`${putup.meters} m`);
      return `<option value="${index}">${escapeHtml(parts.join(" / ") || `Put-up ${index + 1}`)}</option>`;
    }).join("");
    select.value = "0";
  }

  function populatePutups() {
    populatePutupControl(selectedBaseYarn(), "putupField", "putupSelect");
  }

  function populateSecondPutups() {
    populatePutupControl(selectedSecondBaseYarn(), "secondPutupField", "secondPutupSelect");
  }

  function skeinsOnHand() {
    const amount = Number.parseInt($("skeins").value, 10);
    return Number.isFinite(amount) && amount > 0 ? amount : 1;
  }

  function craftMultiplier() {
    return state.craft === "crochet" ? 1.22 : 1;
  }

  function formatNumber(number) {
    return Math.round(number).toLocaleString();
  }

  function skeinCount(yardsNeeded, yarn, buffer = 0) {
    if (!Number.isFinite(yarn?.yards) || yarn.yards <= 0) return null;
    return Math.ceil((yardsNeeded * (1 + buffer)) / yarn.yards);
  }

  function populateBrandSelect(selectId) {
    const select = $(selectId);
    if (!select) return;
    select.innerHTML = brands()
      .map((brand) => `<option value="${escapeHtml(brand)}">${escapeHtml(brand)}</option>`)
      .join("");
  }

  function populateBrands() {
    populateBrandSelect("brandSelect");
    populateBrandSelect("secondBrandSelect");
  }

  function populateYarnSelect(brandId, yarnId, preferredName) {
    const brandSelect = $(brandId);
    const yarnSelect = $(yarnId);
    if (!brandSelect || !yarnSelect) return;
    const brand = brandSelect.value;
    const brandYarns = yarns
      .filter((yarn) => yarn.brand === brand)
      .sort((a, b) => a.name.localeCompare(b.name));

    yarnSelect.innerHTML = brandYarns
      .map((yarn) => `<option value="${escapeHtml(yarn.name)}">${escapeHtml(yarn.name)}</option>`)
      .join("");

    if (preferredName && brandYarns.some((yarn) => yarn.name === preferredName)) {
      yarnSelect.value = preferredName;
    }
  }

  function populateYarns(preferredName) {
    populateYarnSelect("brandSelect", "yarnSelect", preferredName);
  }

  function populateSecondYarns(preferredName) {
    populateYarnSelect("secondBrandSelect", "secondYarnSelect", preferredName);
  }

  function gaugeTextForYarn(yarn) {
    const gauge = state.craft === "knit" ? yarn?.knitGauge : yarn?.crochetGauge;
    const estimated = state.craft === "knit" ? yarn?.knitGaugeEstimated : yarn?.crochetGaugeEstimated;
    if (!Array.isArray(gauge) || gauge.length < 2) return "Gauge not published";
    const rowGauge = state.craft === "knit"
      ? (yarn?.knitRowGauge || yarn?.rowGauge)
      : yarn?.crochetRowGauge;
    const rowText = Array.isArray(rowGauge) && rowGauge.length >= 2
      ? ` / ${rowGauge[0]}${rowGauge[1] !== rowGauge[0] ? `–${rowGauge[1]}` : ""} rows`
      : "";
    return `${gauge[0]}${gauge[1] !== gauge[0] ? `–${gauge[1]}` : ""} sts${rowText} / 4 in${estimated ? " (weight-category guide)" : ""}`;
  }

  function yarnCard(yarn, label, includeEstimateTarget = false) {
    return `<div class="selected-yarn-card">
      ${yarnMedia(yarn, "selected-yarn-image")}
      <div class="selected-yarn-copy">
        <div class="kicker">${escapeHtml(label)}</div>
        <h3>${escapeHtml(yarn.brand)} · ${escapeHtml(yarn.displayName || yarn.name)}</h3>
        ${yarn.description ? `<p class="yarn-description">${escapeHtml(yarn.description)}</p>` : ""}
        <div class="selected-yarn-pills">
          ${[
            yarn.discontinued ? "Discontinued" : null,
            yarn.weight,
            (Number.isFinite(yarn.yards) && yarn.yards > 0 && Number.isFinite(yarn.grams) && yarn.grams > 0)
              ? `${yarn.yardsEstimated ? "≈ " : ""}${yarn.yards} yd / ${yarn.grams} g${yarn.yardsEstimated ? " (label-based estimate)" : ""}`
              : (Number.isFinite(yarn.yards) && yarn.yards > 0)
              ? `${yarn.yardsEstimated ? "≈ " : ""}${yarn.yards} yd per skein${yarn.yardsEstimated ? " (label-based estimate)" : ""}`
              : "Skein length not published",
            yarn.fiber
          ].filter(Boolean).map((item) => `<span class="pill">${escapeHtml(item)}</span>`).join("")}
        </div>
        ${includeEstimateTarget ? '<div class="selected-yarn-estimates" id="selectedYarnEstimates"></div>' : ""}
      </div>
    </div>`;
  }

  function renderMeta() {
    const selected = selectedYarns();
    const yarn = selected[0];
    const second = selected[1] || null;
    const held = Boolean(second);
    const swatch = combinedSwatchGauge();

    $("secondYarnFields").hidden = !usingHeldTogether();

    $("yarnMeta").innerHTML = held
      ? `${yarnCard(yarn, "First yarn", true)}${yarnCard(second, "Second yarn", false)}`
      : yarnCard(yarn, "Selected yarn", true);

    const craftLabel = state.craft === "crochet" ? "Crochet" : "Knitting";
    const toolName = state.craft === "crochet" ? "Hook" : "Needles";
    if (held) {
      const combinedWeight = combinedWeightLabel(selected);
      const estimatedGauge = estimatedCombinedGaugeRange(selected);
      const swatchLabel = swatch
        ? `${swatch[0]} sts / 4 in (your swatch — used for ranking)`
        : estimatedGauge
        ? `${estimatedGauge[0]}–${estimatedGauge[1]} sts / 4 in estimated from the two label weights; swatch overrides this`
        : "Not enough label data — a swatch will give the best match";
      $("matchBasis").innerHTML = `<strong>${craftLabel} held-together match details</strong>
        <span><b>First yarn:</b> ${escapeHtml(yarn.weight || "Weight not published")} · ${escapeHtml(gaugeTextForYarn(yarn))}</span>
        <span><b>Second yarn:</b> ${escapeHtml(second.weight || "Weight not published")} · ${escapeHtml(gaugeTextForYarn(second))}</span>
        <span><b>Estimated combined weight:</b> ${escapeHtml(combinedWeight)}</span>
        <span><b>Combined gauge:</b> ${escapeHtml(swatchLabel)}</span>
        <span><b>${toolName}:</b> Pattern tool size + both yarn labels are used as supporting evidence; your finished swatch is strongest.</span>`;
    } else {
      $("matchBasis").innerHTML = `<strong>${craftLabel} match details</strong>
        <span><b>Yarn weight:</b> ${escapeHtml(yarn.weight || "Weight not published")}</span>
        <span><b>Yarn gauge:</b> ${escapeHtml(gaugeTextForYarn(yarn))}</span>
        <span><b>${toolName}:</b> ${escapeHtml(recommendedToolLabel(yarn))}</span>`;
    }

    const skeins = skeinsOnHand();
    if (held) {
      const firstLength = Number.isFinite(yarn.yards) && yarn.yards > 0 ? `${formatNumber(skeins * yarn.yards)} yd of ${yarn.name}` : `${skeins} skein(s) of ${yarn.name}`;
      const secondLength = Number.isFinite(second.yards) && second.yards > 0 ? `${formatNumber(skeins * second.yards)} yd of ${second.name}` : `${skeins} skein(s) of ${second.name}`;
      $("availableYards").textContent = `${firstLength} + ${secondLength}, worked one strand of each together.`;
    } else {
      $("availableYards").textContent = Number.isFinite(yarn.yards) && yarn.yards > 0
        ? `${skeins} skein${skeins === 1 ? "" : "s"} = about ${formatNumber(skeins * yarn.yards)} yards on hand.`
        : `${skeins} skein${skeins === 1 ? "" : "s"} selected. Skein yardage is still being verified.`;
    }
  }

  function renderProjects() {
    if ($("projectCards")) $("projectCards").hidden = true;
    const selected = selectedYarns();
    const yarn = selected[0];
    const second = selected[1] || null;
    const held = Boolean(second);
    const estimateWeight = held ? combinedYarnWeight(selected) : (weightFamilies(yarn.weight)[0] || yarn.weight || "");
    const ranges = baseRanges[estimateWeight] || null;
    const isNovelty = yarn.weight === "Novelty" || (second && second.weight === "Novelty");
    const multiplier = craftMultiplier();
    const estimateTarget = $("selectedYarnEstimates") || $("projectCards");

    if (isNovelty) {
      estimateTarget.innerHTML = `
        <div class="skein-estimates">
          <h3>Yarn Skein Estimates</h3>
          <p>Novelty yarns are pattern-specific. Use the exact pattern yardage rather than a generic project estimate.</p>
        </div>`;
      return;
    }

    if (!ranges) {
      estimateTarget.innerHTML = `
        <div class="skein-estimates">
          <h3>Yarn Skein Estimates</h3>
          <p>The loaded label does not yet contain enough weight, gauge, or needle/hook information to estimate this yarn responsibly. No substitute Worsted estimate is being used.</p>
        </div>`;
      return;
    }

    if (held) {
      const sameYarn = sameYarnReference(`${second.brand}|${second.name}`, yarn);
      if (!Number.isFinite(yarn.yards) || yarn.yards <= 0 || !Number.isFinite(second.yards) || second.yards <= 0) {
        const rows = Object.entries(ranges).map(([project, range]) => {
          const minYards = Math.round(range[0] * multiplier);
          const maxYards = Math.round(range[1] * multiplier);
          return `<div class="skein-estimate-row"><strong>${escapeHtml(project)}</strong><div class="skein-project-list"><span class="skein-project">${formatNumber(minYards)}–${formatNumber(maxYards)} yd of each strand</span></div></div>`;
        }).join("");
        estimateTarget.innerHTML = `
          <div class="skein-estimates">
            <h3>Yarn Skein Estimates</h3>
            <p class="helper">Estimated combined weight: ${escapeHtml(combinedWeightLabel(selected))}. One or both skein lengths are missing, so the guide shows yardage per strand instead of inventing a skein count.</p>
            ${rows}
          </div>`;
        return;
      }

      const rows = Object.entries(ranges).map(([project, range]) => {
        const minYards = Math.round(range[0] * multiplier);
        const maxYards = Math.round(range[1] * multiplier);
        let label;
        if (sameYarn) {
          const minSkeins = Math.ceil((minYards * 2) / yarn.yards);
          const maxSkeins = Math.ceil((maxYards * 2) / yarn.yards);
          label = `${minSkeins}${maxSkeins !== minSkeins ? `–${maxSkeins}` : ""} total skeins of ${yarn.name}`;
        } else {
          const firstMin = Math.ceil(minYards / yarn.yards);
          const firstMax = Math.ceil(maxYards / yarn.yards);
          const secondMin = Math.ceil(minYards / second.yards);
          const secondMax = Math.ceil(maxYards / second.yards);
          label = `${firstMin}${firstMax !== firstMin ? `–${firstMax}` : ""} ${yarn.name} + ${secondMin}${secondMax !== secondMin ? `–${secondMax}` : ""} ${second.name}`;
        }
        return `<div class="skein-estimate-row"><strong>${escapeHtml(project)}</strong><div class="skein-project-list"><span class="skein-project">${escapeHtml(label)}</span></div></div>`;
      }).join("");

      estimateTarget.innerHTML = `
        <div class="skein-estimates">
          <h3>Yarn Skein Estimates</h3>
          <p class="helper">Estimated combined weight: ${escapeHtml(combinedWeightLabel(selected))}. Held-together estimates assume one strand of each yarn is worked throughout.${yarn.yardsEstimated || second.yardsEstimated ? " One or both skein lengths are label-based estimates." : ""} The final pattern's size-specific yardage wins.</p>
          ${rows}
        </div>`;
      return;
    }

    if (!Number.isFinite(yarn.yards) || yarn.yards <= 0) {
      const rows = Object.entries(ranges).map(([project, range]) => {
        const minYards = Math.round(range[0] * multiplier);
        const maxYards = Math.round(range[1] * multiplier);
        return `<div class="skein-estimate-row"><strong>${escapeHtml(project)}</strong><div class="skein-project-list"><span class="skein-project">${formatNumber(minYards)}–${formatNumber(maxYards)} yd</span></div></div>`;
      }).join("");
      estimateTarget.innerHTML = `
        <div class="skein-estimates">
          <h3>Yarn Skein Estimates</h3>
          <p class="helper">The skein length is not published in the loaded label data. Gauge, weight, and needle/hook size still provide this project-yardage guide; exact skein counts require the skein length.</p>
          ${rows}
        </div>`;
      return;
    }

    const groups = new Map();

    Object.entries(ranges).forEach(([project, range]) => {
      const minYards = Math.round(range[0] * multiplier);
      const maxYards = Math.round(range[1] * multiplier);
      const minSkeins = Math.ceil(minYards / yarn.yards);
      const maxSkeins = Math.ceil(maxYards / yarn.yards);
      const label = minSkeins === maxSkeins
        ? `${minSkeins} skein${minSkeins === 1 ? "" : "s"}`
        : `${minSkeins}–${maxSkeins} skeins`;

      if (!groups.has(label)) groups.set(label, { minSkeins, maxSkeins, projects: [] });
      groups.get(label).projects.push(project);
    });

    const rows = [...groups.entries()]
      .sort((a, b) => a[1].minSkeins - b[1].minSkeins || a[1].maxSkeins - b[1].maxSkeins)
      .map(([label, group]) => `
        <div class="skein-estimate-row">
          <strong>${label}</strong>
          <div class="skein-project-list">
            ${group.projects.map((project) => `<span class="skein-project">${escapeHtml(project)}</span>`).join("")}
          </div>
        </div>
      `).join("");

    estimateTarget.innerHTML = `
      <div class="skein-estimates">
        <h3>Yarn Skein Estimates</h3>
        ${yarn.yardsEstimated ? '<p class="helper">Approximate: skein length was inferred from the yarn label&#39;s grams plus its weight/gauge/needle/hook information.</p>' : ""}
        ${rows}
      </div>`;
  }

  function patternScore(pattern, yarn) {
    const yarnKey = `${yarn.brand}|${yarn.name}`;
    const exact = Array.isArray(pattern.usedYarns) && pattern.usedYarns.some((reference) => sameYarnReference(reference, yarn));
    const ranked = rankedPatternMatch({
      ...pattern,
      inferredProject: pattern.inferredProject || pattern.project || inferredPatternProject(pattern)
    }, yarn);
    // Quantity is intentionally kept out of technical compatibility.
    return { exact, ...ranked };
  }

  function imageRetryUrl(item, kind) {
    const current = String(item && item.image || "");
    if (!current || /^\/api\/yarn-image\?/i.test(current)) return "";

    const page = String((item && (kind === "pattern"
      ? (item.patternUrl || item.url || item.ravelryUrl || item.productUrl || item.imagePage || item.sourceUrl || item.imageSourceUrl)
      : (item.productUrl || item.sourceUrl || item.imagePage || item.imageSourceUrl || item.url || item.ravelryUrl)
    )) || "");
    const name = String((item && (item.name || item.displayName || item.title)) || "");
    if (!/^https?:\/\//i.test(page) || !name) return "";

    const params = new URLSearchParams({ url: page, name, kind });
    if (/^https?:\/\//i.test(current)) params.set("fallback", current);
    return `/api/yarn-image?${params.toString()}`;
  }

  function mediaErrorHandler(retryUrl) {
    if (!retryUrl) return "this.hidden=true;this.nextElementSibling.hidden=false";
    return `if(!this.dataset.retried){this.dataset.retried='1';this.src='${escapeHtml(retryUrl)}';}else{this.hidden=true;this.nextElementSibling.hidden=false}`;
  }

  function patternMedia(pattern) {
    const initial = escapeHtml(pattern.name.charAt(0).toUpperCase());
    if (!pattern.image) return `<div class="pattern-placeholder" aria-hidden="true">${initial}</div>`;
    const retry = imageRetryUrl(pattern, "pattern");
    return `<img class="pattern-image" src="${escapeHtml(pattern.image)}" alt="${escapeHtml(pattern.name)} pattern" loading="lazy" onerror="${mediaErrorHandler(retry)}">
      <div class="pattern-placeholder" aria-hidden="true" hidden>${initial}</div>`;
  }

  function yarnMedia(yarn, className = "yarn-image") {
    const initial = escapeHtml(yarn.name.charAt(0).toUpperCase());
    if (!yarn.image) return `<div class="${className} yarn-placeholder" aria-hidden="true">${initial}</div>`;
    const retry = imageRetryUrl(yarn, "yarn");
    return `<img class="${className}" src="${escapeHtml(yarn.image)}" alt="${escapeHtml(`${yarn.brand} ${yarn.name} yarn`)}" loading="lazy" onerror="${mediaErrorHandler(retry)}">
      <div class="${className} yarn-placeholder" aria-hidden="true" hidden>${initial}</div>`;
  }

  function ravelrySearchUrl(yarn) {
    const weights = { Lace: "lace", Fingering: "fingering", Sport: "sport", DK: "dk", Worsted: "worsted", Aran: "aran", Bulky: "bulky", "Super Bulky": "super-bulky" };
    const projects = { Hat: "hat", Scarf: "scarf", Mittens: "mittens", Sweater: "sweater", Shawl: "shawl-wrap", Cowl: "cowl", Baby: "baby", Blanket: "blanket", Socks: "socks", Stocking: "christmas-stocking" };
    const craft = state.craft === "knit" ? "knitting" : "crochet";
    const weight = weights[yarn.weight] ? `&weight=${weights[yarn.weight]}` : "";
    return `https://www.ravelry.com/patterns/search#craft=${craft}${weight}&pc=${projects[state.project] || "other"}&sort=best`;
  }

  function matchingPatterns(yarn) {
    return patterns
      .filter((pattern) => pattern.craft === state.craft && pattern.project === state.project)
      .map((pattern) => ({ ...pattern, ...patternScore(pattern, yarn) }))
      .filter((pattern) => pattern.exact || pattern.score > 0)
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
      .slice(0, 8);
  }

  function uniqueKfiPatternsForYarn(yarnKey) {
    const byTitle = new Map();
    kfiPatternIndex
      .filter((pattern) => (pattern.usedYarns || []).some((reference) => sameYarnReference(reference, yarn)))
      .forEach((pattern) => {
        const key = normalizedKey(pattern.name);
        const existing = byTitle.get(key);
        if (!existing || Number(pattern.kfiDesignId) > Number(existing.kfiDesignId)) {
          byTitle.set(key, pattern);
        }
      });
    return [...byTitle.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  function uniqueNoveltyBrandPatterns(brand) {
    if (!["EuroYarns (Novelty)", "Knitting Fever Novelty"].includes(brand)) return [];
    const official = noveltyPatternCatalog.filter((pattern) => pattern.brand === brand);
    const yarnLinked = kfiPatternIndex.filter((pattern) =>
      pattern.usedYarns.some((yarnKey) => yarnKey.startsWith(`${brand}|`))
    );
    const byIdentity = new Map();
    [...official, ...yarnLinked].forEach((pattern) => byIdentity.set(patternIdentity(pattern), pattern));
    const byTitle = new Map();
    [...byIdentity.values()].forEach((pattern) => {
      const key = normalizedKey(pattern.name);
      const existing = byTitle.get(key);
      if (!existing || Number(pattern.kfiDesignId) > Number(existing.kfiDesignId)) {
        byTitle.set(key, pattern);
      }
    });
    return [...byTitle.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  function renderPatterns() {
    const yarn = currentYarn();
    const yarnKey = `${yarn.brand}|${yarn.name}`;
    const onHand = skeinsOnHand() * yarn.yards;
    const matches = matchingPatterns(yarn).filter((pattern) => !pattern.exact);

    const cards = matches.map((pattern) => {
      const enough = onHand >= pattern.minYards;
      const additionalSkeins = Math.max(0, Math.ceil((pattern.minYards - onHand) / yarn.yards));
      const availability = enough
        ? "Your amount may work for at least one listed size."
        : `You may need ${additionalSkeins} more skein${additionalSkeins === 1 ? "" : "s"}.`;
      const label = pattern.gaugeMatch && pattern.weightMatch
        ? "Strong compatibility"
        : pattern.gaugeMatch
        ? "Gauge-compatible option"
        : pattern.weightMatch
        ? "Weight-compatible option"
        : "Possible substitute";
      const patternLinks = [];
      if (pattern.url) {
        patternLinks.push(`<a href="${escapeHtml(pattern.url)}" target="_blank" rel="noopener">${pattern.ravelryUrl ? "Official pattern" : "View pattern"} →</a>`);
      }
      if (pattern.ravelryUrl) {
        patternLinks.push(`<a href="${escapeHtml(pattern.ravelryUrl)}" target="_blank" rel="noopener">View on Ravelry →</a>`);
      }

      return `<article class="pattern" data-yarn-key="${escapeHtml(yarnKey)}">
        ${patternMedia(pattern)}
        <div class="pattern-body">
          <div class="match compatible">${label}</div>
          <h3>${escapeHtml(pattern.name)}</h3>
          <p>${customerDesigner(pattern) ? `${escapeHtml(customerDesigner(pattern))} · ` : ""}${escapeHtml(pattern.project)} · ${escapeHtml(pattern.weight)}${pattern.gauge ? ` · ${pattern.gauge} sts / 4 in` : ""}<br>
          ${formatNumber(pattern.minYards)}–${formatNumber(pattern.maxYards)} yd · ${pattern.free ? "Free pattern" : "Pattern listing"}<br>${escapeHtml(pattern.reason)}<br>${escapeHtml(availability)}</p>
          <div class="pattern-links">${patternLinks.join("")}</div>
        </div>
      </article>`;
    });

    cards.push(`<article class="pattern search-card">
      <div class="pattern-placeholder" aria-hidden="true">+</div>
      <div class="pattern-body">
        <div class="match compatible">More compatible choices</div>
        <h3>More ${escapeHtml(yarn.weight)} ${escapeHtml(state.project.toLowerCase())} patterns</h3>
        <p>Search by craft, yarn weight, and project type. Confirm gauge and yardage on the final pattern.</p>
        <a href="${escapeHtml(ravelrySearchUrl(yarn))}" target="_blank" rel="noopener">Browse more patterns →</a>
      </div>
    </article>`);

    $("patterns").innerHTML = cards.join("");
    $("compatiblePatternTitle").textContent = `Browse compatible ${yarn.weight} ${state.project.toLowerCase()} ideas`;
    $("patternSummary").textContent = `Optional ${yarn.weight} ideas for ${yarn.name}. These do not necessarily use this exact yarn.`;
  }

  function renderKfiExactPatterns() {
    const yarn = currentYarn();
    const yarnKey = `${yarn.brand}|${yarn.name}`;
    const detailedExact = matchingPatterns(yarn).filter((pattern) => pattern.exact);
    const indexedExact = uniqueKfiPatternsForYarn(yarnKey);
    const byTitle = new Map();
    [...indexedExact, ...detailedExact].forEach((pattern) => byTitle.set(normalizedKey(pattern.name), pattern));
    const allExact = [...byTitle.values()].sort((a, b) => a.name.localeCompare(b.name));
    const section = $("kfiPatternSection");

    if (!allExact.length) {
      section.hidden = true;
      $("compatiblePatternSection").open = true;
      $("kfiExactPatterns").innerHTML = "";
      $("toggleKfiPatterns").hidden = true;
      return;
    }

    const visible = state.kfiExpanded ? allExact : allExact.slice(0, 3);
    $("kfiExactPatterns").innerHTML = visible.map((pattern) => {
      return `<article class="pattern">
        ${patternMedia(pattern)}
        <div class="pattern-body">
          <div class="match">Pattern uses this yarn</div>
          <h3>${escapeHtml(pattern.name)}</h3>
          <p>Official pattern · Exact yarn pairing. Yardage, sizing, and craft details are on the pattern page.</p>
          <div class="pattern-links">
            <a href="${escapeHtml(pattern.url)}" target="_blank" rel="noopener">View pattern →</a>
            ${ravelryPatternLink(pattern)}
          </div>
        </div>
      </article>`;
    }).join("");

    section.hidden = false;
    $("compatiblePatternSection").open = false;
    $("kfiPatternSummary").textContent = `${allExact.length.toLocaleString()} unique official ${allExact.length === 1 ? "pattern uses" : "patterns use"} ${yarn.name}.`;
    const toggle = $("toggleKfiPatterns");
    toggle.hidden = allExact.length <= 3;
    toggle.textContent = state.kfiExpanded ? "Show fewer patterns" : `Show all ${allExact.length.toLocaleString()} patterns`;
    toggle.setAttribute("aria-expanded", String(state.kfiExpanded));
  }

  function renderNoveltyBrandPatterns() {
    const yarn = currentYarn();
    const yarnKey = `${yarn.brand}|${yarn.name}`;
    const brandPatterns = uniqueNoveltyBrandPatterns(yarn.brand);
    const exactPatterns = [
      ...matchingPatterns(yarn).filter((pattern) => pattern.exact),
      ...uniqueKfiPatternsForYarn(yarnKey)
    ];
    const exactIds = new Set(exactPatterns.map(patternIdentity));
    const exactNames = new Set(exactPatterns.map((pattern) => normalizedKey(pattern.name)));
    const additional = brandPatterns.filter((pattern) =>
      !exactIds.has(patternIdentity(pattern)) && !exactNames.has(normalizedKey(pattern.name))
    );
    const section = $("noveltyPatternSection");

    if (!brandPatterns.length) {
      section.hidden = true;
      section.open = false;
      $("noveltyPatterns").innerHTML = "";
      $("toggleNoveltyPatterns").hidden = true;
      return;
    }

    const visible = state.noveltyExpanded ? additional : additional.slice(0, 12);
    $("noveltyPatterns").innerHTML = visible.map((pattern) => {
      return `<article class="pattern">
        ${patternMedia(pattern)}
        <div class="pattern-body">
          <div class="match compatible">From this brand's pattern library</div>
          <h3>${escapeHtml(pattern.name)}</h3>
          <p>Official pattern. This design may use a different yarn from the same brand, so check the pattern page before substituting.</p>
          <div class="pattern-links">
            <a href="${escapeHtml(pattern.url)}" target="_blank" rel="noopener">View pattern →</a>
            ${ravelryPatternLink(pattern)}
          </div>
        </div>
      </article>`;
    }).join("");

    section.hidden = false;
    $("noveltyPatternTitle").textContent = `Browse ${brandPatterns.length.toLocaleString()} ${yarn.brand} patterns`;
    const exactBrandCount = brandPatterns.length - additional.length;
    $("noveltyPatternSummary").textContent = exactBrandCount
      ? `${exactBrandCount} exact yarn ${exactBrandCount === 1 ? "match is" : "matches are"} already shown above. Open only when you want the whole brand.`
      : "Open only when you want the whole brand.";
    const toggle = $("toggleNoveltyPatterns");
    toggle.hidden = additional.length <= 12;
    toggle.textContent = state.noveltyExpanded ? "Show fewer brand patterns" : `Show all ${additional.length.toLocaleString()} additional brand patterns`;
    toggle.setAttribute("aria-expanded", String(state.noveltyExpanded));
  }

  function renderBuyEstimate() {
    const selected = selectedYarns();
    const yarn = selected[0];
    const second = selected[1] || null;
    const held = Boolean(second);

    if (yarn.weight === "Novelty" || (second && second.weight === "Novelty")) {
      $("buyAnswer").textContent = "Use exact pattern";
      $("buyDetails").textContent = "Novelty yarns and held-together novelty combinations are pattern-specific. Follow the exact pattern yardage.";
      return;
    }

    const project = $("buyProject").value || state.project;
    const size = $("size").value || "M";
    const buffer = Number($("buffer").value || 0);
    const estimateWeight = held ? combinedYarnWeight(selected) : (weightFamilies(yarn.weight)[0] || yarn.weight || "");
    const ranges = baseRanges[estimateWeight] || null;
    if (!ranges) {
      $("buyAnswer").textContent = "Need label details";
      $("buyDetails").textContent = "This yarn does not yet have enough verified weight, gauge, or needle/hook information for a responsible estimate. No Worsted fallback is being used.";
      return;
    }
    const range = ranges[project] || [300, 600];
    const sizeFactor = project === "Sweater" || project === "Baby" ? (sizeFactors[size] || 1) : 1;
    const midpoint = ((range[0] + range[1]) / 2) * sizeFactor * craftMultiplier();
    const bufferedYards = midpoint * (1 + buffer);

    if (held) {
      const sameYarn = sameYarnReference(`${second.brand}|${second.name}`, yarn);
      if (sameYarn) {
        const totalSkeins = skeinCount(midpoint * 2, yarn, buffer);
        if (totalSkeins === null) {
          $("buyAnswer").textContent = "Check skein yardage";
          $("buyDetails").textContent = `About ${formatNumber(bufferedYards)} yards per strand (${formatNumber(bufferedYards * 2)} total yards) are needed for two strands of ${yarn.name}.`;
          return;
        }
        $("buyAnswer").textContent = `${totalSkeins} total skein${totalSkeins === 1 ? "" : "s"}`;
        $("buyDetails").textContent = `About ${formatNumber(bufferedYards)} yards per strand, using two strands of ${yarn.name} together (${yarn.yards} yd per skein).`;
        return;
      }

      const firstSkeins = skeinCount(midpoint, yarn, buffer);
      const secondSkeins = skeinCount(midpoint, second, buffer);
      if (firstSkeins === null || secondSkeins === null) {
        $("buyAnswer").textContent = "Check skein yardage";
        $("buyDetails").textContent = `About ${formatNumber(bufferedYards)} yards of each yarn are needed when one strand of each is held together. One or both skein yardages are still being verified.`;
        return;
      }
      $("buyAnswer").textContent = `${firstSkeins} + ${secondSkeins} skeins`;
      $("buyDetails").textContent = `${firstSkeins} skein${firstSkeins === 1 ? "" : "s"} of ${yarn.name} + ${secondSkeins} skein${secondSkeins === 1 ? "" : "s"} of ${second.name}, about ${formatNumber(bufferedYards)} yards of each including ${Math.round(buffer * 100)}% extra.`;
      return;
    }

    const skeins = skeinCount(midpoint, yarn, buffer);
    if (skeins === null) {
      $("buyAnswer").textContent = "Check skein yardage";
      $("buyDetails").textContent = `About ${formatNumber(bufferedYards)} yards including ${Math.round(buffer * 100)}% extra. This yarn's skein yardage is still being verified.`;
      return;
    }

    $("buyAnswer").textContent = `${skeins} skein${skeins === 1 ? "" : "s"}`;
    $("buyDetails").textContent = `About ${formatNumber(bufferedYards)} yards including ${Math.round(buffer * 100)}% extra, using ${yarn.name} (${yarn.yards} yd each).`;
  }

  function renderCatalog() {
    $("catalogCount").textContent = `${brands().length} brands · ${yarns.length} yarns`;
    $("catalogList").innerHTML = brands().map((brand) => {
      const items = yarns
        .filter((yarn) => yarn.brand === brand)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((yarn) => {
          const source = yarnPrimaryUrl(yarn);
          const name = source
            ? `<a href="${escapeHtml(source)}" target="_blank" rel="noopener">${escapeHtml(yarn.name)}</a>`
            : `<strong>${escapeHtml(yarn.name)}</strong>`;
          return `<li class="yarn-catalog-card">
          ${yarnMedia(yarn, "yarn-catalog-image")}
          <div>${name}<span>${escapeHtml(yarn.weight || "Weight not published")}</span></div>
        </li>`;
        })
        .join("");
      return `<section class="catalog-group"><h3>${escapeHtml(brand)}</h3><ul class="yarn-catalog-grid">${items}</ul></section>`;
    }).join("");
  }


  function isAnyYarnWeight(value) {
    const key = normalizedKey(value);
    return ["any", "any yarn", "any yarn weight", "any weight"].includes(key);
  }

  function patternWeights(pattern) {
    const weights = new Set();
    if (pattern.weight && !isAnyYarnWeight(pattern.weight)) weights.add(pattern.weight);
    (pattern.usedYarns || []).forEach((yarnKey) => {
      const matchedYarn = yarnByReference(yarnKey);
      if (matchedYarn?.weight) weights.add(matchedYarn.weight);
    });
    return [...weights];
  }

  function weightFamilies(weight) {
    const raw = String(weight || "");
    const key = normalizedKey(raw);
    const direct = {
      Lace: ["Lace"],
      "LACE / SUPER FINE": ["Lace", "Fingering"],
      Fingering: ["Fingering"],
      Sport: ["Sport"],
      DK: ["DK"],
      Worsted: ["Worsted", "Aran"],
      Aran: ["Worsted", "Aran"],
      "MEDIUM / BULKY": ["Worsted", "Aran", "Bulky"],
      Bulky: ["Bulky"],
      "BULKY / SUPER BULKY": ["Bulky", "Super Bulky"],
      "Super Bulky": ["Super Bulky"],
      Jumbo: ["Jumbo"],
      Novelty: ["Novelty"]
    };
    if (direct[raw]) return direct[raw];

    // Catalogs use many equivalent manufacturer labels. Normalize them for
    // matching without changing what the customer sees on the yarn card.
    if (/\bmedium\b/.test(key) && /\bbulky\b/.test(key)) return ["Worsted", "Aran", "Bulky"];
    if (/\bbulky\b/.test(key) && /\bsuper bulky\b/.test(key)) return ["Bulky", "Super Bulky"];
    if (/\blace\b/.test(key) && /\bsuper fine\b/.test(key)) return ["Lace", "Fingering"];
    if (/\bjumbo\b|\bweight 7\b/.test(key)) return ["Jumbo"];
    if (/\bsuper bulky\b|\bsuper chunky\b|\bweight 6\b/.test(key)) return ["Super Bulky"];
    if (/\bbulky\b|\bchunky\b|\bweight 5\b/.test(key)) return ["Bulky"];
    if (/\baran\b/.test(key)) return ["Worsted", "Aran"];
    if (/\bworsted\b|\bmedium\b|\bweight 4\b/.test(key)) return ["Worsted", "Aran"];
    if (/\bdk\b|\bdouble knit(?:ting)?\b|\blight 3\b|\bweight 3\b/.test(key)) return ["DK"];
    if (/\bsport\b|\b5 ply\b|\bweight 2\b/.test(key)) return ["Sport"];
    if (/\bfingering\b|\b4 ply\b|\bsock\b|\bsuper fine\b|\bweight 1\b/.test(key)) return ["Fingering"];
    if (/\blace\b|\b2 ply\b|\bcobweb\b|\bweight 0\b/.test(key)) return ["Lace"];
    if (/\bnovelty\b/.test(key)) return ["Novelty"];
    return raw ? [raw] : [];
  }

  function patternWeightLabel(pattern) {
    if (isAnyYarnWeight(pattern.weight)) return "Any yarn weight";
    if (pattern.weight) return String(pattern.weight);
    const inferred = new Set();
    (pattern.usedYarns || []).forEach((yarnKey) => {
      const matchedYarn = yarnByReference(yarnKey);
      if (matchedYarn?.weight) inferred.add(matchedYarn.weight);
    });
    return inferred.size ? `${[...inferred].join(", ")} (inferred from listed yarn)` : "Not published";
  }

  function recommendedToolLabel(yarn) {
    const published = state.craft === "crochet" ? yarn?.hookSize : yarn?.needleSize;
    const estimated = state.craft === "crochet" ? yarn?.hookSizeEstimated : yarn?.needleSizeEstimated;
    if (published) return estimated ? `${published} (weight-category guide)` : published;
    const guide = toolRecommendations[yarn.weight]?.[state.craft];
    return guide ? `${guide} (weight-category guide)` : "Check the yarn label and pattern";
  }

  function yarnGaugeRange(yarn) {
    if (!yarn) return null;
    const estimated = state.craft === "crochet" ? yarn.crochetGaugeEstimated : yarn.knitGaugeEstimated;
    // Weight-category/CYC estimates are useful guidance, but they are not
    // manufacturer-published yarn gauge and must not strengthen match scores.
    if (estimated) return null;
    const gauge = state.craft === "crochet" ? yarn.crochetGauge : yarn.knitGauge;
    return Array.isArray(gauge) && gauge.length >= 2 && gauge.every(Number.isFinite) ? gauge : null;
  }

  function patternGaugeRanges(pattern) {
    // A yarn's ball-band gauge is not the pattern gauge. If the design's
    // actual gauge is unknown, keep it unknown rather than manufacturing one
    // from the yarn(s) named by the pattern.
    if (Number.isFinite(pattern.gauge)) return [[pattern.gauge, pattern.gauge]];
    if (pattern.gauge && typeof pattern.gauge === "object") {
      const stitchCount = Number(pattern.gauge.stitches ?? pattern.gauge.stitchCount);
      const measurement = Number(pattern.gauge.measurement ?? pattern.gauge.inches ?? 4);
      if (Number.isFinite(stitchCount) && stitchCount > 0 && Number.isFinite(measurement) && measurement > 0) {
        const normalized = stitchCount * (4 / measurement);
        return [[normalized, normalized]];
      }
    }
    return [];
  }

  function formatGaugeRange(range) {
    if (!range) return "Not published";
    return `${range[0]}${range[1] !== range[0] ? `–${range[1]}` : ""} sts / 4 in`;
  }

  function patternGaugeLabel(pattern) {
    const ranges = patternGaugeRanges(pattern);
    if (!ranges.length) return "Not published";
    const minimum = Math.min(...ranges.map((range) => range[0]));
    const maximum = Math.max(...ranges.map((range) => range[1]));
    let rowText = "";
    if (pattern.gauge && typeof pattern.gauge === "object") {
      const rows = Number(pattern.gauge.rows ?? pattern.gauge.rowCount);
      const measurement = Number(pattern.gauge.measurement ?? pattern.gauge.inches ?? 4);
      if (Number.isFinite(rows) && rows > 0 && Number.isFinite(measurement) && measurement > 0) {
        const normalizedRows = Math.round((rows * (4 / measurement)) * 10) / 10;
        rowText = ` / ${normalizedRows} rows`;
      }
    }
    return `${minimum}${maximum !== minimum ? `–${maximum}` : ""} sts${rowText} / 4 in`;
  }

  function gaugeRangesOverlap(first, second) {
    return Boolean(first && second && first[0] <= second[1] && second[0] <= first[1]);
  }

  function gaugeCompatibility(patternRange, yarnRange) {
    if (!patternRange || !yarnRange) return { points: 0, level: "unknown", overlap: 0, percentDiff: null };

    const patternMid = (patternRange[0] + patternRange[1]) / 2;
    const yarnMid = (yarnRange[0] + yarnRange[1]) / 2;
    const percentDiff = Math.abs(patternMid - yarnMid) / Math.max(1, yarnMid);

    const overlapStart = Math.max(patternRange[0], yarnRange[0]);
    const overlapEnd = Math.min(patternRange[1], yarnRange[1]);
    const overlapWidth = Math.max(0, overlapEnd - overlapStart);
    const smallestWidth = Math.max(1, Math.min(patternRange[1] - patternRange[0], yarnRange[1] - yarnRange[0]));
    const overlap = overlapWidth / smallestWidth;

    // A one-stitch boundary touch is not a strong gauge match.
    if (percentDiff <= 0.05 && (overlap >= 0.5 || patternRange[0] === patternRange[1] || yarnRange[0] === yarnRange[1])) {
      return { points: 65, level: "exact", overlap, percentDiff };
    }
    if (percentDiff <= 0.10) {
      return { points: 52, level: "close", overlap, percentDiff };
    }
    if (percentDiff <= 0.15) {
      return { points: 34, level: "caution", overlap, percentDiff };
    }
    if (percentDiff <= 0.22) {
      return { points: 14, level: "poor", overlap, percentDiff };
    }
    return { points: 0, level: "poor", overlap, percentDiff };
  }

  function selectionYarns(value) {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (value && Array.isArray(value.yarns)) return value.yarns.filter(Boolean);
    return value ? [value] : [];
  }

  function patternHeldTogether(pattern) {
    return Number(pattern?.strandCount || pattern?.strands || 0) > 1 || pattern?.heldTogether === true ||
      /(?:held|hold|holding)\s+(?:two|2|three|3|four|4)?\s*(?:strands?|yarns?)?\s*together/i.test(String(pattern?.gaugeText || pattern?.notes || pattern?.description || ""));
  }

  function selectionRelationship(pattern, yarnSelection) {
    const chosen = selectionYarns(yarnSelection);
    const refs = pattern?.usedYarns || [];
    if (!chosen.length) return { exact: false, allListed: false, heldConfirmed: false };

    const allListed = chosen.every((yarn) => refs.some((ref) => sameYarnReference(ref, yarn)));
    if (chosen.length === 1) return { exact: allListed, allListed, heldConfirmed: false };

    const sameYarnTwice = chosen.length === 2 && sameYarnReference(`${chosen[1].brand}|${chosen[1].name}`, chosen[0]);
    const heldConfirmed = patternHeldTogether(pattern);
    const strandCount = Number(pattern?.strandCount || pattern?.strands || 0);
    const enoughStrands = !sameYarnTwice || strandCount >= 2;
    return { exact: allListed && heldConfirmed && enoughStrands, allListed, heldConfirmed };
  }

  function selectedGaugeRange(yarnSelection) {
    const chosen = selectionYarns(yarnSelection);
    if (chosen.length > 1) return combinedSwatchGauge() || estimatedCombinedGaugeRange(chosen);
    return yarnGaugeRange(chosen[0]);
  }

  function toolMmRange(value) {
    const text = String(value || "");
    const mm = [...text.matchAll(/(\d+(?:\.\d+)?)\s*mm\b/gi)].map((m) => Number(m[1])).filter(Number.isFinite);
    if (mm.length) return [Math.min(...mm), Math.max(...mm)];
    const usNeedles = new Map([[0,2],[1,2.25],[2,2.75],[3,3.25],[4,3.5],[5,3.75],[6,4],[7,4.5],[8,5],[9,5.5],[10,6],[10.5,6.5],[11,8],[13,9],[15,10],[17,12],[19,15],[35,19],[50,25]]);
    const hookLetters = new Map([["B",2.25],["C",2.75],["D",3.25],["E",3.5],["F",3.75],["G",4],["H",5],["I",5.5],["J",6],["K",6.5],["L",8],["M",9],["N",10],["P",11.5],["Q",15]]);
    const us = text.match(/\bUS\s*(\d+(?:\.\d+)?)/i);
    if (us && usNeedles.has(Number(us[1]))) { const v = usNeedles.get(Number(us[1])); return [v, v]; }
    const hook = text.match(/\b([B-Q])(?:[-\s/]?\d+(?:\.\d+)?)?\b/i);
    if (hook && hookLetters.has(hook[1].toUpperCase())) { const v = hookLetters.get(hook[1].toUpperCase()); return [v, v]; }
    return null;
  }

  function patternToolRange(pattern) {
    const craft = pattern?.craft === "crochet" ? "crochet" : "knit";
    return toolMmRange(craft === "crochet"
      ? (pattern?.hookSize || pattern?.toolSize || pattern?.needleSize)
      : (pattern?.needleSize || pattern?.toolSize || pattern?.hookSize));
  }

  function selectionToolRange(yarnSelection, pattern) {
    const chosen = selectionYarns(yarnSelection);
    const craft = pattern?.craft === "crochet" ? "crochet" : "knit";
    if (!chosen.length) return { range: null, estimated: false };
    if (chosen.length > 1) {
      const weight = combinedYarnWeight(chosen);
      const guide = toolRecommendations[weight]?.[craft];
      return { range: toolMmRange(guide), estimated: true };
    }
    const yarn = chosen[0];
    const value = craft === "crochet" ? yarn?.hookSize : yarn?.needleSize;
    const estimated = craft === "crochet" ? Boolean(yarn?.hookSizeEstimated) : Boolean(yarn?.needleSizeEstimated);
    return { range: toolMmRange(value), estimated };
  }

  function toolCompatibilityPoints(pattern, yarnSelection) {
    const target = patternToolRange(pattern);
    const selected = selectionToolRange(yarnSelection, pattern);
    if (!target || !selected.range) return 0;
    const targetMid = (target[0] + target[1]) / 2;
    const selectedMid = (selected.range[0] + selected.range[1]) / 2;
    const overlap = target[0] <= selected.range[1] && selected.range[0] <= target[1];
    const diff = Math.abs(targetMid - selectedMid);
    let points = overlap ? 15 : diff <= 1 ? 10 : diff <= 2 ? 5 : 0;
    if (selected.estimated) points = Math.min(points, 6);
    return points;
  }

  function gaugeCompatibilityPoints(pattern, yarnSelection) {
    const selectedRange = selectedGaugeRange(yarnSelection);
    const ranges = patternGaugeRanges(pattern);
    if (!selectedRange || !ranges.length) return 0;
    return Math.max(...ranges.map((range) => gaugeCompatibility(range, selectedRange).points));
  }

  function weightCompatibilityPoints(pattern, yarnSelection) {
    const chosen = selectionYarns(yarnSelection);
    if (!chosen.length || isAnyYarnWeight(pattern.weight)) return 0;

    const weightOrder = new Map([
      ["Lace", 0], ["Fingering", 1], ["Sport", 2], ["DK", 3],
      ["Worsted", 4], ["Aran", 4.35], ["Bulky", 5], ["Super Bulky", 6], ["Jumbo", 7]
    ]);
    const selected = chosen.length > 1 ? combinedYarnWeight(chosen) : String(chosen[0].weight || "");
    if (!selected) return 0;

    const published = pattern.weight ? [pattern.weight] : [];
    const inferred = pattern.weight ? [] : (pattern.usedYarns || []).map((yarnKey) => yarnByReference(yarnKey)?.weight).filter(Boolean);
    const candidates = published.length ? published : [...new Set(inferred)];
    const held = chosen.length > 1;
    const fullSame = held ? (published.length ? 24 : 16) : (published.length ? 30 : 20);
    const fullFamily = held ? (published.length ? 18 : 12) : (published.length ? 24 : 16);
    const adjacent = held ? (published.length ? 8 : 5) : (published.length ? 12 : 8);
    if (candidates.includes(selected)) return fullSame;

    const yarnFamilies = weightFamilies(selected);
    const patternFamilies = candidates.flatMap(weightFamilies);
    if (patternFamilies.some((weight) => yarnFamilies.includes(weight))) return fullFamily;

    const distances = patternFamilies.flatMap((patternWeight) => yarnFamilies.map((yarnWeight) => {
      const patternLevel = weightOrder.get(patternWeight);
      const yarnLevel = weightOrder.get(yarnWeight);
      return Number.isFinite(patternLevel) && Number.isFinite(yarnLevel) ? Math.abs(patternLevel - yarnLevel) : Infinity;
    }));
    const distance = distances.length ? Math.min(...distances) : Infinity;
    if (distance <= 1) return adjacent;
    return 0;
  }

  function fiberConstructionTags(yarn) {
    const text = normalizedKey([
      yarn && yarn.fiber,
      yarn && yarn.construction,
      yarn && yarn.structure,
      yarn && yarn.name
    ].filter(Boolean).join(" "));
    const tags = new Set();
    if (/\b(mohair|suri)\b/.test(text)) tags.add("halo");
    if (/\bboucle\b/.test(text)) tags.add("boucle");
    if (/\b(chainette|chain)\b/.test(text)) tags.add("chainette");
    if (/\b(blown|air blown|airblown)\b/.test(text)) tags.add("blown");
    if (/\b(ribbon|tape)\b/.test(text)) tags.add("ribbon");
    if (/\b(linen|flax)\b/.test(text)) tags.add("linen");
    if (/\bcotton\b/.test(text)) tags.add("cotton");
    if (/\balpaca\b/.test(text)) tags.add("alpaca");
    if (/\bsuperwash\b/.test(text)) tags.add("superwash");
    if (/\b(wool|merino|lambswool|corriedale|shetland)\b/.test(text)) tags.add("wool");
    if (/\b(acrylic|polyamide|nylon|polyester)\b/.test(text)) tags.add("synthetic");
    return tags;
  }

  function fiberSubstitutionCaution(pattern, yarnSelection) {
    const chosen = selectionYarns(yarnSelection);
    const relationship = selectionRelationship(pattern, chosen);
    // If the source names the selected yarn(s), construction is already part of
    // the designer's intended fabric and must not reduce an exact relationship.
    if (!chosen.length || relationship.allListed) return { penalty: 0, caution: "" };

    const targetYarns = (pattern.usedYarns || [])
      .map((ref) => yarnByReference(ref))
      .filter(Boolean);
    if (!targetYarns.length) return { penalty: 0, caution: "" };

    const selectedTags = new Set(chosen.flatMap((yarn) => [...fiberConstructionTags(yarn)]));
    const targetTags = new Set(targetYarns.flatMap((yarn) => [...fiberConstructionTags(yarn)]));
    if (!selectedTags.size || !targetTags.size) return { penalty: 0, caution: "" };

    const structural = ["halo", "boucle", "chainette", "blown", "ribbon"];
    const missingStructure = structural.filter((tag) => targetTags.has(tag) && !selectedTags.has(tag));
    if (missingStructure.length) {
      return {
        penalty: 15,
        caution: `The original yarn has a different construction (${missingStructure.join(", ")}), so fabric behavior may differ even if gauge matches.`
      };
    }

    const targetPlant = targetTags.has("cotton") || targetTags.has("linen");
    const selectedPlant = selectedTags.has("cotton") || selectedTags.has("linen");
    const targetAnimal = targetTags.has("wool") || targetTags.has("alpaca") || targetTags.has("halo");
    const selectedAnimal = selectedTags.has("wool") || selectedTags.has("alpaca") || selectedTags.has("halo");
    if ((targetPlant && selectedAnimal && !selectedPlant) || (selectedPlant && targetAnimal && !targetPlant)) {
      return {
        penalty: 8,
        caution: "The fiber family differs from the yarn used by the pattern, so drape, elasticity, and finished fabric may change."
      };
    }

    if (targetTags.has("alpaca") !== selectedTags.has("alpaca")) {
      return {
        penalty: 4,
        caution: "Alpaca content differs from the pattern yarn; check drape and elasticity in your swatch."
      };
    }

    return { penalty: 0, caution: "" };
  }

  function rankBand(score) {
    return score >= 80 ? "high" : score >= 40 ? "medium" : "low";
  }

  function rankedPatternMatch(pattern, yarnSelection) {
    const chosen = selectionYarns(yarnSelection);
    const yarn = chosen[0] || {};
    const heldSelection = chosen.length > 1;
    const relationship = selectionRelationship(pattern, chosen);
    const manualCombinedGauge = heldSelection ? combinedSwatchGauge() : null;
    const selectedGauge = selectedGaugeRange(chosen);
    const gaugeResults = patternGaugeRanges(pattern).map((range) => gaugeCompatibility(range, selectedGauge));
    const bestGauge = gaugeResults.sort((a, b) => b.points - a.points)[0] || { points: 0, level: "unknown" };
    const gaugeMatch = ["exact", "close"].includes(bestGauge.level);

    const selectedWeight = heldSelection ? combinedYarnWeight(chosen) : yarn.weight;
    const yarnWeights = new Set(weightFamilies(selectedWeight));
    const weightMatch = !isAnyYarnWeight(pattern.weight) && patternWeights(pattern)
      .flatMap(weightFamilies)
      .some((weight) => yarnWeights.has(weight));

    // A calculated two-strand gauge is useful but not equivalent to a real
    // swatch. Cap its evidence until the user enters a measured combined gauge.
    const gaugePoints = heldSelection && !manualCombinedGauge
      ? Math.min(34, bestGauge.points)
      : bestGauge.points;
    const weightPoints = weightCompatibilityPoints(pattern, chosen);
    const toolPoints = toolCompatibilityPoints(pattern, chosen);
    const fiberCheck = fiberSubstitutionCaution(pattern, chosen);
    let score;
    if (relationship.exact) score = 100;
    else if (heldSelection && relationship.allListed) {
      score = Math.min(90, Math.max(70, gaugePoints + weightPoints + toolPoints));
    } else {
      score = Math.min(99, gaugePoints + weightPoints + toolPoints);
    }
    if (!relationship.allListed && fiberCheck.penalty) score = Math.max(0, score - fiberCheck.penalty);

    const selectedNames = chosen.map((item) => item.name).filter(Boolean);
    const combinedLabel = heldSelection ? combinedWeightLabel(chosen) : "";
    const baseReason = relationship.exact && heldSelection
      ? `Written for ${selectedNames.join(" + ")} held together.`
      : relationship.exact
      ? `Written for ${yarn.name}.`
      : heldSelection && relationship.allListed
      ? "The pattern lists both selected yarns, but the stored source does not confirm they are held together. Check the pattern instructions."
      : heldSelection && manualCombinedGauge && bestGauge.level === "exact"
      ? `Your combined swatch gauge is very close to the pattern gauge; the two labels estimate about ${combinedLabel}.`
      : heldSelection && manualCombinedGauge && bestGauge.level === "close"
      ? `Your combined swatch gauge is close to the pattern gauge; the two labels estimate about ${combinedLabel}.`
      : heldSelection && selectedGauge
      ? `The two yarn labels estimate about ${combinedLabel}. Gauge, pattern weight, and needle/hook size are used cautiously until you enter a combined swatch gauge.`
      : bestGauge.level === "exact" && isAnyYarnWeight(pattern.weight)
      ? "Very close published gauge. The pattern allows any yarn weight, so weight alone is not counted as match evidence."
      : bestGauge.level === "close" && isAnyYarnWeight(pattern.weight)
      ? "Close published gauge. The pattern allows any yarn weight, so weight alone is not counted as match evidence."
      : bestGauge.level === "exact" && weightMatch
      ? "Very close published gauge and yarn-weight match. Swatch before substituting."
      : bestGauge.level === "close" && weightMatch
      ? "Close published gauge and yarn-weight match. Swatch before substituting."
      : bestGauge.level === "caution"
      ? "Gauge is within a caution range; check fabric and swatch before substituting."
      : weightMatch && toolPoints > 0
      ? "Yarn weight and needle/hook size agree; gauge is not fully published/recorded."
      : weightMatch && bestGauge.level === "unknown"
      ? "Yarn weight matches, but the pattern or yarn gauge is not published/recorded."
      : toolPoints > 0
      ? "Needle/hook size provides partial compatibility evidence; confirm gauge before substituting."
      : weightMatch
      ? "Yarn weight matches, but the published gauge differs."
      : score > 0
      ? "A partial technical match; swatch carefully before substituting."
      : "No confirmed technical match.";
    const reason = fiberCheck.caution && !relationship.allListed ? `${baseReason} ${fiberCheck.caution}` : baseReason;

    return {
      score, reason, gaugeMatch, weightMatch, gaugePoints, weightPoints, toolPoints,
      fiberPenalty: fiberCheck.penalty, fiberCaution: fiberCheck.caution,
      gaugeLevel: bestGauge.level, projectMatch: pattern.inferredProject === state.project,
      exact: relationship.exact, allSelectedYarnsListed: relationship.allListed,
      heldTogetherSelection: heldSelection, combinedWeight: heldSelection ? combinedYarnWeight(chosen) : ""
    };
  }

  const patternCatalogOrder = new Map(
    rankedPatternCatalog.map((pattern, index) => [patternIdentity(pattern), index])
  );

  function patternRecencyValue(pattern) {
    const dateCandidates = [
      pattern.publishedAt,
      pattern.published,
      pattern.releaseDate,
      pattern.date,
      pattern.createdAt
    ].filter(Boolean);

    for (const value of dateCandidates) {
      const parsed = Date.parse(value);
      if (Number.isFinite(parsed)) return parsed;
    }

    const year = Number(pattern.year);
    if (Number.isFinite(year) && year > 1900) {
      return Date.UTC(year, 0, 1);
    }

    // Design IDs are identifiers, not publication dates.
    return null;
  }

  function sortRankedPatterns(list) {
    const mode = state.patternSort || "closest";
    return [...list].sort((a, b) => {
      if (mode === "za") {
        return b.name.localeCompare(a.name);
      }
      if (mode === "closest") {
        return Number(Boolean(b.exact)) - Number(Boolean(a.exact))
          || Number(b.score || 0) - Number(a.score || 0)
          || Number(b.gaugePoints || 0) - Number(a.gaugePoints || 0)
          || Number(b.weightPoints || 0) - Number(a.weightPoints || 0)
          || Number(b.toolPoints || 0) - Number(a.toolPoints || 0)
          || Number(b.projectMatch) - Number(a.projectMatch)
          || a.name.localeCompare(b.name);
      }
      if (mode === "newest" || mode === "oldest") {
        const aDate = patternRecencyValue(a);
        const bDate = patternRecencyValue(b);
        if (aDate !== null && bDate !== null) {
          return mode === "newest"
            ? bDate - aDate || a.name.localeCompare(b.name)
            : aDate - bDate || a.name.localeCompare(b.name);
        }
        if (aDate !== null) return -1;
        if (bDate !== null) return 1;
        const aIndex = patternCatalogOrder.get(patternIdentity(a)) ?? 0;
        const bIndex = patternCatalogOrder.get(patternIdentity(b)) ?? 0;
        return aIndex - bIndex || a.name.localeCompare(b.name);
      }
      return a.name.localeCompare(b.name);
    });
  }

  function renderRankedPatternLibrary() {
    const selection = selectedYarns();
    const yarn = selection[0];
    const second = selection[1] || null;
    const held = Boolean(second);
    const query = normalizedKey($("patternSearch").value);
    const filtered = rankedPatternCatalog
      .filter((pattern) => pattern.craft === state.craft)
      .filter((pattern) => !query || normalizedKey([
          pattern.name,
          pattern.designer,
          pattern.sourceBrand,
          pattern.inferredProject,
          pattern.project,
          pattern.craft,
          ...(pattern.brands || []),
          ...(pattern.usedYarns || [])
        ].join(" ")).includes(query))
      .map((pattern) => ({ ...pattern, ...rankedPatternMatch(pattern, selection) }));
    const sorted = sortRankedPatterns(filtered);
    const visible = sorted.slice(0, state.patternVisible);

    $("allPatternGrid").innerHTML = visible.map((pattern) => {
      const yarnLabels = (pattern.usedYarns || []).slice(0, 3).map((yarnKey) => yarnKey.replace("|", " — "));
      const extraYarns = Math.max(0, (pattern.usedYarns || []).length - yarnLabels.length);
      const details = yarnLabels.length
        ? `Listed yarn${pattern.usedYarns.length === 1 ? "" : "s"}: ${yarnLabels.join(", ")}${extraYarns ? `, plus ${extraYarns} more` : ""}`
        : (pattern.brands || []).length ? `Brand: ${(pattern.brands || []).join(", ")}` : "Yarn not listed";
      const craftLabel = state.craft === "crochet" ? "Crochet" : "Knitting";
      const gaugeLabel = patternGaugeLabel(pattern);
      const selectedGauge = held ? combinedSwatchGauge() : yarnGaugeRange(yarn);
      const yarnGaugeLabel = held
        ? (selectedGauge ? `${formatGaugeRange(selectedGauge)} (combined swatch)` : "Combined swatch gauge not entered")
        : formatGaugeRange(selectedGauge);
      const patternWeight = patternWeightLabel(pattern);
      const yarnWeightLabel = held
        ? `${yarn.name}: ${yarn.weight || "not published"}; ${second.name}: ${second.weight || "not published"}`
        : yarn.weight;
      const toolLabel = pattern.toolSize || pattern.needleSize || pattern.hookSize || (held
        ? "Use the pattern or combined swatch"
        : recommendedToolLabel(yarn));
      const toolName = (pattern.toolSize || pattern.needleSize || pattern.hookSize)
        ? (state.craft === "crochet" ? "Pattern hook" : "Pattern needles")
        : (state.craft === "crochet" ? "Suggested hook" : "Suggested needles");
      const primaryUrl = patternPrimaryUrl(pattern);
      const primaryLabel = /\.pdf(?:[?#]|$)/i.test(primaryUrl)
        ? "Open pattern PDF"
        : "View pattern";
      const primaryLink = primaryUrl
        ? `<a href="${escapeHtml(primaryUrl)}" target="_blank" rel="noopener">${primaryLabel} →</a>`
        : "";
      const sizesLabel = pattern.sizesText || pattern.sizes || pattern.sizeRange || "";
      const skillLabel = pattern.skillLevel || pattern.difficulty || "";
      const priceLabel = pattern.free === true ? "Free pattern" : pattern.free === false ? "Paid pattern" : "";
      return `<article class="pattern">
        ${patternMedia(pattern)}
        <div class="pattern-body">
          <div class="rank rank-${rankBand(pattern.score)}">${pattern.score}% match</div>
          <h3>${escapeHtml(pattern.name)}</h3>
          <p>${craftLabel} · ${escapeHtml(pattern.inferredProject)}${pattern.projectMatch ? " · Selected project" : ""}<br>
          <strong>Pattern gauge:</strong> ${escapeHtml(gaugeLabel)}<br>
          <strong>${held ? "Combined yarn gauge" : "Yarn gauge"}:</strong> ${escapeHtml(yarnGaugeLabel)}<br>
          <strong>Pattern weight:</strong> ${escapeHtml(patternWeight)}<br>
          <strong>${held ? "Selected yarns" : "Yarn weight"}:</strong> ${escapeHtml(yarnWeightLabel)}<br>
          <strong>${toolName}:</strong> ${escapeHtml(toolLabel)}<br>
          ${sizesLabel ? `<strong>Sizes:</strong> ${escapeHtml(Array.isArray(sizesLabel) ? sizesLabel.join(", ") : sizesLabel)}<br>` : ""}
          ${skillLabel ? `<strong>Skill level:</strong> ${escapeHtml(skillLabel)}<br>` : ""}
          ${priceLabel ? `<strong>Pattern:</strong> ${escapeHtml(priceLabel)}<br>` : ""}
          ${escapeHtml(pattern.reason)}<br>${escapeHtml(details)}</p>
          <div class="pattern-links">
            ${primaryLink}
            ${ravelryPatternLink(pattern)}
          </div>
        </div>
      </article>`;
    }).join("");

    const shown = Math.min(visible.length, sorted.length);
    const craftLabel = state.craft === "crochet" ? "crochet" : "knitting";
    const exactCount = sorted.filter((pattern) => pattern.score === 100).length;
    const selectionLabel = held ? `${yarn.name} + ${second.name}` : yarn.name;
    $("allPatternCount").textContent = `${sorted.length.toLocaleString()} ${craftLabel} patterns`;
    $("allPatternSummary").textContent = `Showing ${shown.toLocaleString()} of ${sorted.length.toLocaleString()} ${craftLabel} patterns ranked for ${selectionLabel}. ${exactCount.toLocaleString()} exact ${exactCount === 1 ? "match" : "matches"}.`;
    const more = $("showMorePatterns");
    more.hidden = shown >= sorted.length;
    more.textContent = `Show ${Math.min(24, sorted.length - shown).toLocaleString()} more patterns`;
  }

  function renderAll() {
    renderMeta();
    renderProjects();
    renderRankedPatternLibrary();
    renderBuyEstimate();
  }

  function setCraft(craft) {
    state.craft = craft;
    state.patternVisible = 24;
    ["knit", "crochet"].forEach((name) => {
      const active = name === craft;
      $(name).classList.toggle("active", active);
      $(name).setAttribute("aria-pressed", String(active));
    });
    renderAll();
  }

  function init() {
    if (!yarns.length) return;
    populateBrands();
    populateYarns();
    populatePutups();
    populateSecondYarns();
    populateSecondPutups();
    $("buyProject").innerHTML = Object.keys(baseRanges.Worsted).map((project) => `<option>${escapeHtml(project)}</option>`).join("");
    $("buyProject").value = state.project;
    renderCatalog();
    renderAll();

    $("brandSelect").addEventListener("change", () => {
      state.patternVisible = 24;
      populateYarns();
      populatePutups();
      renderAll();
    });
    $("yarnSelect").addEventListener("change", () => {
      state.patternVisible = 24;
      populatePutups();
      renderAll();
    });
    if ($("putupSelect")) $("putupSelect").addEventListener("change", () => {
      state.patternVisible = 24;
      renderAll();
    });
    if ($("holdTogether")) $("holdTogether").addEventListener("change", () => {
      state.patternVisible = 24;
      $("secondYarnFields").hidden = !usingHeldTogether();
      renderAll();
    });
    if ($("secondBrandSelect")) $("secondBrandSelect").addEventListener("change", () => {
      state.patternVisible = 24;
      populateSecondYarns();
      populateSecondPutups();
      renderAll();
    });
    if ($("secondYarnSelect")) $("secondYarnSelect").addEventListener("change", () => {
      state.patternVisible = 24;
      populateSecondPutups();
      renderAll();
    });
    if ($("secondPutupSelect")) $("secondPutupSelect").addEventListener("change", () => {
      state.patternVisible = 24;
      renderAll();
    });
    if ($("combinedGauge")) $("combinedGauge").addEventListener("input", () => {
      state.patternVisible = 24;
      renderAll();
    });
    $("skeins").addEventListener("input", renderAll);
    $("knit").addEventListener("click", () => setCraft("knit"));
    $("crochet").addEventListener("click", () => setCraft("crochet"));
    $("findProjects").addEventListener("click", () => {
      renderAll();
      $("projectResults").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    $("buyProject").addEventListener("change", renderBuyEstimate);
    $("size").addEventListener("change", renderBuyEstimate);
    $("buffer").addEventListener("change", renderBuyEstimate);
    let patternSearchTimer = null;
    $("patternSearch").addEventListener("input", () => {
      state.patternVisible = 24;
      if (patternSearchTimer) clearTimeout(patternSearchTimer);
      patternSearchTimer = setTimeout(renderRankedPatternLibrary, 120);
    });
    $("patternSort").addEventListener("change", () => {
      state.patternSort = $("patternSort").value;
      try {
        localStorage.setItem(PATTERN_SORT_STORAGE_KEY, state.patternSort);
      } catch {}
      state.patternVisible = 24;
      renderRankedPatternLibrary();
    });
    $("patternSort").value = state.patternSort;
    $("showMorePatterns").addEventListener("click", () => {
      state.patternVisible += 24;
      renderRankedPatternLibrary();
    });
  }

  window.YarnFirst = {
    brands, baseRanges, patternScore, uniqueKfiPatternsForYarn, uniqueNoveltyBrandPatterns,
    allPatternCatalog, rankedPatternCatalog, canonicalPatternTitle, inferredPatternCraft,
    rankedPatternMatch, gaugeCompatibilityPoints, weightCompatibilityPoints, patternGaugeLabel,
    patternWeightLabel, recommendedToolLabel, skeinCount, patternRecencyValue, sortRankedPatterns,
    canonicalYarnKey, sameYarnReference, selectionRelationship, patternHeldTogether, selectedGaugeRange,
    combinedYarnWeight, combinedWeightLabel, estimatedCombinedGaugeRange, toolMmRange, toolCompatibilityPoints,
    fiberConstructionTags, fiberSubstitutionCaution, genericCollectionUrl, patternPrimaryUrl, customerDesigner
  };
  if (typeof document !== "undefined") init();
}());


/* normalized final dedupe guard */
(function () {
  function norm(v) {
    return String(v || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function dedupe(list, type) {
    if (!Array.isArray(list)) return list;
    const seen = new Set();
    return list.filter((item) => {
      const brand = norm(item && (item.brand || item.brandName || item.maker));
      const name = norm(item && (item.name || item.title || item.yarn || item.pattern));
      const craft = type === "pattern" ? norm(item && item.craft) : "";
      const key = [brand, name, craft].join("|");
      if (!name || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  if (Array.isArray(window.YARNS)) window.YARNS = dedupe(window.YARNS, "yarn");
  if (Array.isArray(window.yarns)) window.yarns = dedupe(window.yarns, "yarn");
  if (Array.isArray(window.PATTERNS)) window.PATTERNS = dedupe(window.PATTERNS, "pattern");
  if (Array.isArray(window.patterns)) window.patterns = dedupe(window.patterns, "pattern");
})();

