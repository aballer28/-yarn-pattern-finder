// Garn Swatch — global yarn record quality merge.
// Runs after catalog-integration.js and before exact-yarn-images.js/app.js.
// Purpose: when the same yarn exists in multiple catalogs, preserve the
// richest label/spec record instead of letting a thin family/retailer record win.

(function () {
  "use strict";

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function normalize(value) {
    return text(value)
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[®™©]/g, "")
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function keyFor(item) {
    return normalize(item && item.brand) + "|" + normalize(item && item.name);
  }

  function isObject(value) {
    return value && typeof value === "object" && !Array.isArray(value);
  }

  function hasValue(value) {
    if (value === undefined || value === null || value === "") return false;
    if (typeof value === "number") return Number.isFinite(value) && value > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (isObject(value)) return Object.keys(value).length > 0;
    return Boolean(text(value));
  }

  function looksLikeYarn(item) {
    if (!isObject(item) || !text(item.brand) || !text(item.name)) return false;
    if (item.usedYarns || item.designer || item.patternUrl || item.pdfUrl) return false;
    return true;
  }

  function genericPage(url) {
    const raw = text(url);
    if (!/^https?:\/\//i.test(raw)) return true;
    try {
      const parsed = new URL(raw);
      const path = parsed.pathname.replace(/\/+$/, "").toLowerCase();
      if (!path || path === "/") return true;
      if (/\/(?:collections?|search|shop)(?:\/|$)/i.test(path)) return true;
      if (/(?:shop-all-yarn|shop-all-needlework|all-yarns|all-patterns|yarn-needlework)$/i.test(path)) return true;
      if (/\/(?:patterns?|designs?|yarns?)$/i.test(path)) return true;
      return false;
    } catch {
      return true;
    }
  }

  const YARNSPIRATIONS_BRANDS = new Set([
    "bernat", "caron", "lily sugar n cream", "patons", "phentex",
    "red heart", "peaches and creme", "peaches creme"
  ]);

  function retailerPenalty(item) {
    const brand = normalize(item && item.brand);
    const page = text(item && (item.productUrl || item.sourceUrl || item.imagePage || item.url));
    if (YARNSPIRATIONS_BRANDS.has(brand) && /michaels\.com|joann\.com/i.test(page)) return 8;
    return 0;
  }

  function recordScore(item) {
    if (!looksLikeYarn(item)) return -1000;
    let score = 0;
    if (hasValue(item.weight)) score += 8;
    if (hasValue(item.cycWeight) || item.cycWeight === 0) score += 3;
    if (hasValue(item.yards)) score += 9;
    if (hasValue(item.meters)) score += 7;
    if (hasValue(item.grams)) score += 6;
    if (hasValue(item.ounces)) score += 2;
    if (hasValue(item.knitGauge)) score += 8;
    if (hasValue(item.knitRowGauge)) score += 3;
    if (hasValue(item.crochetGauge)) score += 8;
    if (hasValue(item.crochetRowGauge)) score += 3;
    if (hasValue(item.needleSize)) score += 6;
    if (hasValue(item.hookSize)) score += 6;
    if (hasValue(item.fiber) || hasValue(item.fiberFamily)) score += 5;
    if (hasValue(item.care)) score += 2;
    if (hasValue(item.description)) score += 2;
    if (hasValue(item.image)) score += 3;

    const exactPage = item.productUrl || item.sourceUrl || item.imagePage || item.url;
    if (hasValue(exactPage)) score += genericPage(exactPage) ? 1 : 7;

    if (item.imageVerified === true) score += 5;
    if (item.catalogOnly === true || item.catalogFamilyEntry === true || item.placeholderRecord === true) score -= 15;
    score -= retailerPenalty(item);
    return score;
  }

  function chooseField(records, field) {
    for (const item of records) {
      if (hasValue(item[field]) || (field === "cycWeight" && item[field] === 0)) return item[field];
    }
    return undefined;
  }

  function chooseUrl(records, fields) {
    const candidates = [];
    records.forEach((item, recordIndex) => {
      fields.forEach((field, fieldIndex) => {
        const value = text(item[field]);
        if (!/^https?:\/\//i.test(value)) return;
        candidates.push({
          value,
          generic: genericPage(value),
          recordIndex,
          fieldIndex,
          score: recordScore(item) - retailerPenalty(item)
        });
      });
    });
    candidates.sort((a, b) =>
      Number(a.generic) - Number(b.generic) ||
      b.score - a.score ||
      a.recordIndex - b.recordIndex ||
      a.fieldIndex - b.fieldIndex
    );
    return candidates[0] ? candidates[0].value : undefined;
  }

  const IMPORTANT_FIELDS = [
    "displayName", "status", "discontinued", "weight", "cycWeight",
    "yards", "meters", "grams", "ounces",
    "knitGauge", "knitRowGauge", "crochetGauge", "crochetRowGauge",
    "needleSize", "hookSize", "fiber", "fiberFamily", "care",
    "washable", "feltable", "yarnGroup", "description", "kfiId"
  ];

  function mergeGroup(group) {
    const ranked = group.slice().sort((a, b) => recordScore(b) - recordScore(a));
    const best = ranked[0] || group[0];
    const merged = { ...best };

    // Fill missing metadata without letting a low-quality placeholder overwrite
    // a real manufacturer/label value.
    IMPORTANT_FIELDS.forEach((field) => {
      const value = chooseField(ranked, field);
      if (value !== undefined) merged[field] = Array.isArray(value) ? value.slice() : value;
    });

    const sourceUrl = chooseUrl(ranked, ["productUrl", "sourceUrl", "imagePage", "imageSourceUrl", "url"]);
    const imagePage = chooseUrl(ranked, ["imagePage", "productUrl", "sourceUrl", "imageSourceUrl", "url"]);
    const productUrl = chooseUrl(ranked, ["productUrl", "sourceUrl", "imagePage", "url"]);
    if (sourceUrl) merged.sourceUrl = sourceUrl;
    if (imagePage) merged.imagePage = imagePage;
    if (productUrl && !genericPage(productUrl)) merged.productUrl = productUrl;

    // Prefer a verified/direct image from the richest record. The later global
    // image guard will still reject generic or misidentified pictures.
    const imageRecord = ranked.find((item) => item.imageVerified === true && hasValue(item.image)) ||
      ranked.find((item) => hasValue(item.image) && !genericPage(item.imagePage || item.sourceUrl || item.productUrl)) ||
      ranked.find((item) => hasValue(item.image));
    if (imageRecord) {
      merged.image = imageRecord.image;
      if (imageRecord.imageVerified === true) merged.imageVerified = true;
    }

    // A merged record is only a placeholder if every copy was a placeholder.
    merged.placeholderRecord = ranked.every((item) => item.placeholderRecord === true);
    merged.catalogFamilyEntry = ranked.every((item) => item.catalogFamilyEntry === true);
    if (!merged.placeholderRecord) delete merged.placeholderRecord;
    if (!merged.catalogFamilyEntry) delete merged.catalogFamilyEntry;

    merged._catalogMergeSources = group.length;
    merged._catalogQualityScore = recordScore(best);
    return merged;
  }

  const groups = new Map();

  function add(item) {
    if (!looksLikeYarn(item)) return;
    const key = keyFor(item);
    if (!key || key === "|") return;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ ...item });
  }

  // Pull every loaded yarn catalog, including preserved pre-overwrite catalogs.
  Object.keys(window).forEach((name) => {
    if (!/YARN/i.test(name)) return;
    const value = window[name];
    if (!Array.isArray(value)) return;
    value.forEach(add);
  });

  (Array.isArray(window.YARN_CATALOG) ? window.YARN_CATALOG : []).forEach(add);

  window.YARN_CATALOG = [...groups.values()]
    .map(mergeGroup)
    .filter((item) => text(item.brand) && text(item.name))
    .sort((a, b) => text(a.brand).localeCompare(text(b.brand)) || text(a.name).localeCompare(text(b.name)));

  window.GARN_SWATCH_QUALITY_MERGE = {
    merged: true,
    yarnCount: window.YARN_CATALOG.length,
    duplicateGroups: [...groups.values()].filter((group) => group.length > 1).length,
    sourceRecords: [...groups.values()].reduce((sum, group) => sum + group.length, 0)
  };
})();
