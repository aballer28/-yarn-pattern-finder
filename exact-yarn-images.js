// Garn Swatch — exact image loader for ALL yarn and pattern catalogs.
// Special handling for DROPS and West Yorkshire Spinners.
// Existing verified direct images are preserved.
// Missing images use the Vercel /api/yarn-image resolver against the item's OWN page.

(function () {
  "use strict";

  function validImage(value) {
    const v = String(value || "");
    return /^https?:\/\//i.test(v) &&
      !/api\.microlink\.io/i.test(v);
  }

  function validPage(value) {
    return /^https?:\/\//i.test(String(value || ""));
  }

  function normalize(s) {
    return String(s || "")
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function dropsSlug(name) {
    return String(name || "")
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  const WYS_PAGES = {
    "bluefaced leicester aran naturals":
      "https://wyspinners.com/products/fleece-bluefaced-leicester-aran-yarn",
    "bluefaced leicester roving naturals":
      "https://wyspinners.com/products/fleece-bluefaced-leicester-aran-roving-yarn",
    "bluefaced leicester dk naturals":
      "https://wyspinners.com/products/fleece-bluefaced-leicester-dk-yarn",
    "bluefaced leicester dk":
      "https://wyspinners.com/products/fleece-bluefaced-leicester-dk-yarn",
    "jacob aran":
      "https://wyspinners.com/products/fleece-jacob-aran-yarn",
    "croft aran":
      "https://wyspinners.com/products/the-croft-aran-yarn",
    "the croft aran":
      "https://wyspinners.com/products/the-croft-aran-yarn",
    "elements dk":
      "https://wyspinners.com/products/elements-dk-yarn",
    "colour lab aran":
      "https://wyspinners.com/products/colourlab-aran-yarn",
    "colourlab aran":
      "https://wyspinners.com/products/colourlab-aran-yarn",
    "exquisite lace":
      "https://wyspinners.com/products/exquisite-lace-yarn"
  };

  function exactSpecialCase(item) {
    if (!item || typeof item !== "object") return false;

    const brand = normalize(item.brand);
    const name = String(item.name || item.displayName || item.title || "");
    const n = normalize(name);

    // DROPS has a stable, yarn-specific official shademap image path.
    if (brand === "drops" && name) {
      const slug = dropsSlug(name);
      item.sourceUrl =
        "https://www.garnstudio.com/yarn.php?show=drops-" +
        slug +
        "&cid=17";
      item.imagePage = item.sourceUrl;
      item.image =
        "https://images.garnstudio.com/img/shademap/" +
        slug +
        "/drops-" +
        slug +
        "1.jpg";
      return true;
    }

    // WYS records in the catalog were pointing at old Berroco pages.
    // Force them to the actual WYS product page so the API extracts
    // the picture from the correct individual yarn.
    if (brand === "west yorkshire spinners") {
      const page = WYS_PAGES[n];
      if (page) {
        item.sourceUrl = page;
        item.imagePage = page;
        item.image =
          "/api/yarn-image?url=" +
          encodeURIComponent(page) +
          "&name=" +
          encodeURIComponent(name) +
          "&kind=yarn";
        return true;
      }
    }

    return false;
  }

  function pageFor(item) {
    return (
      item.productUrl ||
      item.imagePage ||
      item.sourceUrl ||
      item.imageSourceUrl ||
      item.url ||
      item.patternUrl ||
      item.ravelryUrl ||
      ""
    );
  }

  function yarnKey(item) {
    return normalize(item && item.brand) + "|" + normalize(item && (item.name || item.displayName));
  }

  const CURATED_YARN_MEDIA = new Map();
  (window.YARN_IMAGE_CATALOG || []).forEach(function (item) {
    if (!item || typeof item !== "object") return;
    const key = yarnKey(item);
    if (!key) return;
    CURATED_YARN_MEDIA.set(key, {
      image: validImage(item.image) ? item.image : "",
      page: item.imageSourceUrl || item.sourceUrl || item.imagePage || item.url || ""
    });
  });

  function resolverImage(page, name, kind, options) {
    options = options || {};
    const params = new URLSearchParams();
    params.set("url", page);
    params.set("name", name);
    params.set("kind", kind);
    if (validPage(options.altUrl) && options.altUrl !== page) {
      params.set("altUrl", options.altUrl);
    }
    if (validImage(options.fallback)) {
      params.set("fallback", options.fallback);
    }
    return "/api/yarn-image?" + params.toString();
  }

  function setExactImage(item, kind) {
    if (!item || typeof item !== "object") return;

    // Fix known problem brands first.
    if (exactSpecialCase(item)) return;

    const page = pageFor(item);
    const name = item.name || item.displayName || item.title || "";

    // Yarn records often exist in more than one catalog. The curated
    // YARN_IMAGE_CATALOG copy can contain a verified image even when the
    // technical-data copy does not. For those curated matches, use the
    // server resolver with the curated image as a last-resort fallback.
    // For every other yarn that already has a direct image, keep it direct
    // so the site does not send hundreds of unnecessary serverless requests.
    if (kind === "yarn" && name) {
      const curated = CURATED_YARN_MEDIA.get(yarnKey(item));

      if (curated) {
        const fallback = curated.image || (validImage(item.image) ? item.image : "");
        const altUrl = curated.page;

        if (validPage(page)) {
          item.image = resolverImage(page, name, kind, { altUrl, fallback });
          return;
        }
        if (validPage(altUrl)) {
          item.image = resolverImage(altUrl, name, kind, { fallback });
          return;
        }
        if (validImage(fallback)) {
          item.image = fallback;
          return;
        }
      }

      if (validImage(item.image)) return;
    }

    // Keep existing direct pattern images. They are numerous and already
    // stable; only missing pattern images need the resolver.
    if (validImage(item.image)) return;

    if (/api\.microlink\.io/i.test(String(item.image || ""))) {
      delete item.image;
    }

    if (!validPage(page) || !name) return;
    item.image = resolverImage(page, name, kind);
  }




  // ============================================================
  // FULL CATALOG SWEEP
  // Fixes missing yarn info, weight/gauge mismatches, exact
  // Bernat Baby Blanket family pattern links, and duplicates.
  // Runs after catalog-integration.js and before app.js.
  // ============================================================

  const SWEEP_WEIGHT_DEFAULTS = {
    "Lace": {
      cycWeight: 0,
      knitGauge: [33, 40],
      crochetGauge: [32, 42],
      needleSize: "US 000–1 (1.5–2.25 mm)",
      hookSize: "Steel 6–8 or B-1 (1.4–2.25 mm)"
    },
    "Fingering": {
      cycWeight: 1,
      knitGauge: [27, 32],
      crochetGauge: [21, 32],
      needleSize: "US 1–3 (2.25–3.25 mm)",
      hookSize: "B-1–E-4 (2.25–3.5 mm)"
    },
    "Sport": {
      cycWeight: 2,
      knitGauge: [23, 26],
      crochetGauge: [16, 20],
      needleSize: "US 3–5 (3.25–3.75 mm)",
      hookSize: "E-4–7 (3.5–4.5 mm)"
    },
    "DK": {
      cycWeight: 3,
      knitGauge: [21, 24],
      crochetGauge: [12, 17],
      needleSize: "US 5–7 (3.75–4.5 mm)",
      hookSize: "7–I-9 (4.5–5.5 mm)"
    },
    "Worsted": {
      cycWeight: 4,
      knitGauge: [16, 20],
      crochetGauge: [11, 14],
      needleSize: "US 7–9 (4.5–5.5 mm)",
      hookSize: "I-9–K-10½ (5.5–6.5 mm)"
    },
    "Aran": {
      cycWeight: 4,
      knitGauge: [16, 18],
      crochetGauge: [11, 14],
      needleSize: "US 7–9 (4.5–5.5 mm)",
      hookSize: "I-9–K-10½ (5.5–6.5 mm)"
    },
    "Bulky": {
      cycWeight: 5,
      knitGauge: [12, 15],
      crochetGauge: [8, 11],
      needleSize: "US 9–11 (5.5–8 mm)",
      hookSize: "K-10½–M-13 (6.5–9 mm)"
    },
    "Super Bulky": {
      cycWeight: 6,
      knitGauge: [7, 11],
      crochetGauge: [5, 9],
      needleSize: "US 11–17 (8–12.75 mm)",
      hookSize: "M-13–Q (9–15 mm)"
    },
    "Jumbo": {
      cycWeight: 7,
      knitGauge: [1, 6],
      crochetGauge: [1, 4],
      needleSize: "US 17+ (12.75 mm+)",
      hookSize: "Q+ (15 mm+)"
    }
  };

  const CYC_TO_WEIGHT = {
    0: "Lace",
    1: "Fingering",
    2: "Sport",
    3: "DK",
    4: "Worsted",
    5: "Bulky",
    6: "Super Bulky",
    7: "Jumbo"
  };

  function sweepText(value) {
    return String(value || "").trim();
  }

  function sweepName(value) {
    return normalize(value)
      .replace(/\b(discontinued|clearance)\s+shades?\b/g, "")
      .replace(/\byarn\b$/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function sweepBrand(value) {
    const key = normalize(value);
    const aliases = {
      "queensland": "Queensland Collection",
      "queensland collection": "Queensland Collection",
      "kfi collection": "Knitting Fever Collection",
      "knitting fever collection": "Knitting Fever Collection",
      "kfi novelty": "Knitting Fever Novelty",
      "knitting fever novelty": "Knitting Fever Novelty",
      "west yorksire spinners": "West Yorkshire Spinners"
    };
    return aliases[key] || sweepText(value);
  }

  function sweepGauge(value) {
    if (Array.isArray(value) && value.length) {
      const nums = value.map(Number).filter(Number.isFinite);
      if (!nums.length) return null;
      if (nums.length === 1) return [nums[0], nums[0]];
      return [Math.min(nums[0], nums[1]), Math.max(nums[0], nums[1])];
    }

    const nums = String(value || "").match(/\d+(?:\.\d+)?/g);
    if (!nums || !nums.length) return null;

    const first = Number(nums[0]);
    const second = nums[1] ? Number(nums[1]) : first;
    if (!Number.isFinite(first) || !Number.isFinite(second)) return null;

    return [Math.min(first, second), Math.max(first, second)];
  }

  function canonicalSweepWeight(item) {
    const raw = normalize(item && item.weight);
    const cyc = Number(item && item.cycWeight);

    if (/\bjumbo\b|\bweight 7\b/.test(raw)) return "Jumbo";
    if (/\bsuper bulky\b|\bsuper chunky\b|\bweight 6\b/.test(raw)) return "Super Bulky";
    if (/\bbulky\b|\bchunky\b|\bweight 5\b/.test(raw)) return "Bulky";
    if (/\baran\b/.test(raw)) return "Aran";
    if (/\bworsted\b|\bmedium\b|\bweight 4\b/.test(raw)) return "Worsted";
    if (/\bdk\b|\bdouble knit\b|\blight\b|\bweight 3\b/.test(raw)) return "DK";
    if (/\bsport\b|\bfine\b|\bweight 2\b/.test(raw)) return "Sport";
    if (/\bfingering\b|\bsock\b|\b4 ply\b|\bsuper fine\b|\bweight 1\b/.test(raw)) return "Fingering";
    if (/\blace\b|\bweight 0\b/.test(raw)) return "Lace";
    if (/\bnovelty\b/.test(raw)) return "Novelty";

    return CYC_TO_WEIGHT[cyc] || sweepText(item && item.weight) || "";
  }

  function repairYarnRecord(item) {
    if (!item || typeof item !== "object") return item;
    if (!sweepText(item.brand) || !sweepText(item.name)) return item;

    item.brand = sweepBrand(item.brand);

    const weight = canonicalSweepWeight(item);
    if (weight) item.weight = weight;

    if (!item.fiber && item.fiberFamily) {
      item.fiber = sweepText(item.fiberFamily);
    }

    if (!item.cycWeight && item.cycWeight !== 0) {
      const d = SWEEP_WEIGHT_DEFAULTS[item.weight];
      if (d && Number.isFinite(d.cycWeight)) item.cycWeight = d.cycWeight;
    }

    const knitGauge = sweepGauge(item.knitGauge);
    const crochetGauge = sweepGauge(item.crochetGauge);

    if (knitGauge) item.knitGauge = knitGauge;
    if (crochetGauge) item.crochetGauge = crochetGauge;

    const defaults = SWEEP_WEIGHT_DEFAULTS[item.weight];

    if (defaults) {
      if (!item.knitGauge) {
        item.knitGauge = defaults.knitGauge.slice();
        item.knitGaugeEstimated = true;
      }
      if (!item.crochetGauge) {
        item.crochetGauge = defaults.crochetGauge.slice();
        item.crochetGaugeEstimated = true;
      }
      if (!item.needleSize) {
        item.needleSize = defaults.needleSize;
        item.needleSizeEstimated = true;
      }
      if (!item.hookSize) {
        item.hookSize = defaults.hookSize;
        item.hookSizeEstimated = true;
      }
    }

    addMetricLength(item);
    return item;
  }

  const BERNAT_BABY_BLANKET_SPECS = {
    "baby blanket": {
      sourceUrl: "https://www.yarnspirations.com/products/bernat-baby-blanket-yarn-300g-10-5oz",
      weight: "Super Bulky",
      cycWeight: 6,
      yards: 220,
      meters: 201,
      grams: 300,
      fiber: "100% Polyester",
      knitGauge: [8, 8],
      crochetGauge: [7, 7],
      needleSize: "US 11 (8 mm)",
      hookSize: "US L/11 (8 mm)"
    },
    "baby blanket sparkle": {
      sourceUrl: "https://www.yarnspirations.com/products/bernat-baby-blanket-sparkle-yarn",
      weight: "Super Bulky",
      cycWeight: 6,
      yards: 220,
      meters: 201,
      grams: 300,
      fiber: "100% Polyester",
      knitGauge: [8, 8],
      crochetGauge: [7, 7],
      needleSize: "US 11 (8 mm)",
      hookSize: "US L/11 (8 mm)"
    },
    "baby blanket stripes": {
      sourceUrl: "https://www.yarnspirations.com/products/bernat-baby-blanket-stripes-yarn",
      weight: "Super Bulky",
      cycWeight: 6,
      yards: 220,
      meters: 201,
      grams: 300,
      fiber: "100% Polyester",
      knitGauge: [8, 8],
      crochetGauge: [7, 7],
      needleSize: "US 11 (8 mm)",
      hookSize: "US L/11 (8 mm)"
    },
    "baby blanket dappled": {
      sourceUrl: "https://www.yarnspirations.com/products/bernat-baby-blanket-dappled-yarn",
      weight: "Super Bulky",
      cycWeight: 6,
      yards: 220,
      meters: 201,
      grams: 300,
      fiber: "100% Polyester",
      knitGauge: [8, 8],
      crochetGauge: [7, 7],
      needleSize: "US 11 (8 mm)",
      hookSize: "US L/11 (8 mm)"
    },
    "baby blanket o go": {
      sourceUrl: "https://www.yarnspirations.com/collections/yarn?filter.p.vendor=Bernat",
      weight: "Super Bulky",
      cycWeight: 6,
      fiber: "Polyester",
      knitGauge: [8, 8],
      crochetGauge: [7, 7],
      needleSize: "US 11 (8 mm)",
      hookSize: "US L/11 (8 mm)"
    }
  };

  function repairBernatBabyBlanket(item) {
    if (!item || normalize(item.brand) !== "bernat") return;
    const spec = BERNAT_BABY_BLANKET_SPECS[normalize(item.name)];
    if (!spec) return;

    Object.keys(spec).forEach(function (key) {
      if (key === "sourceUrl") {
        item.sourceUrl = spec.sourceUrl;
        item.imagePage = spec.sourceUrl;
        return;
      }
      item[key] = spec[key];
    });
  }

  function recordCompleteness(item) {
    const fields = [
      "weight", "cycWeight", "yards", "meters", "grams", "fiber",
      "knitGauge", "crochetGauge", "needleSize", "hookSize",
      "sourceUrl", "imagePage", "image"
    ];
    return fields.reduce(function (score, key) {
      const value = item && item[key];
      return score + (value !== undefined && value !== null && value !== "" ? 1 : 0);
    }, 0);
  }

  function mergeYarnRecords(a, b) {
    const preferred = recordCompleteness(b) > recordCompleteness(a) ? b : a;
    const other = preferred === a ? b : a;

    const merged = Object.assign({}, other, preferred);

    [
      "weight", "cycWeight", "yards", "meters", "grams", "fiber",
      "knitGauge", "crochetGauge", "needleSize", "hookSize",
      "sourceUrl", "imagePage", "image", "status"
    ].forEach(function (key) {
      if (merged[key] === undefined || merged[key] === null || merged[key] === "") {
        merged[key] = other[key];
      }
    });

    return repairYarnRecord(merged);
  }

  function dedupeYarnArray(array) {
    if (!Array.isArray(array)) return array;

    const map = new Map();

    array.forEach(function (raw) {
      if (!raw || typeof raw !== "object") return;

      const item = repairYarnRecord(raw);
      repairBernatBabyBlanket(item);

      if (!sweepText(item.brand) || !sweepText(item.name)) return;

      const key = normalize(item.brand) + "|" + sweepName(item.name);
      const existing = map.get(key);

      map.set(key, existing ? mergeYarnRecords(existing, item) : item);
    });

    return Array.from(map.values());
  }

  function patternTitleKey(value) {
    return normalize(value)
      .replace(/^free\s+/, "")
      .replace(/\b(knitting|knit|crochet|crocheted)\b/g, "")
      .replace(/\bpattern\b/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function patternIdentitySweep(item) {
    if (item.sourceId) return "id:" + item.sourceId;
    if (item.kfiDesignId) return "kfi:" + item.kfiDesignId;

    const url = sweepText(item.url || item.patternUrl || item.sourceUrl || item.ravelryUrl)
      .replace(/[?#].*$/, "")
      .replace(/\/+$/, "");

    if (url) return "url:" + normalize(url);

    const brand = item.sourceBrand ||
      item.brand ||
      (Array.isArray(item.brands) ? item.brands[0] : "");

    return [
      "title",
      patternTitleKey(item.name),
      normalize(item.craft),
      normalize(brand)
    ].join("|");
  }

  function buildYarnAliasIndex() {
    const exact = new Map();
    const byLoose = new Map();

    const all = [];
    Object.keys(window).forEach(function (key) {
      const value = window[key];
      if (!Array.isArray(value) || !/YARN/i.test(key)) return;
      value.forEach(function (item) {
        if (item && typeof item === "object" && item.brand && item.name) all.push(item);
      });
    });

    all.forEach(function (item) {
      const brand = sweepBrand(item.brand);
      const name = sweepText(item.name);
      const exactKey = normalize(brand) + "|" + normalize(name);
      const looseKey = normalize(brand) + "|" + sweepName(name);
      const canonical = brand + "|" + name;

      exact.set(exactKey, canonical);
      if (!byLoose.has(looseKey)) byLoose.set(looseKey, canonical);
    });

    return { exact: exact, loose: byLoose };
  }

  function repairUsedYarnKey(key, aliases) {
    const parts = String(key || "").split("|");
    if (parts.length < 2) return key;

    const brand = sweepBrand(parts.shift());
    const name = parts.join("|").trim();

    const exactKey = normalize(brand) + "|" + normalize(name);
    const looseKey = normalize(brand) + "|" + sweepName(name);

    return aliases.exact.get(exactKey) ||
      aliases.loose.get(looseKey) ||
      (brand + "|" + name.replace(/\s+Yarn$/i, ""));
  }

  function inferUsedYarnsFromText(pattern, yarns) {
    const haystack = normalize([
      pattern.name,
      pattern.url,
      pattern.patternUrl,
      pattern.sourceUrl,
      pattern.description,
      pattern.notes,
      pattern.materials,
      pattern.yarn,
      pattern.yarnName
    ].filter(Boolean).join(" "));

    if (!haystack) return [];

    const knownBrands = new Set(
      (pattern.brands || [])
        .concat(pattern.sourceBrand || [])
        .concat(pattern.brand || [])
        .filter(Boolean)
        .map(normalize)
    );

    return yarns
      .filter(function (yarn) {
        if (!yarn || !yarn.brand || !yarn.name) return false;

        const brandMatch =
          !knownBrands.size ||
          knownBrands.has(normalize(yarn.brand)) ||
          haystack.includes(normalize(yarn.brand));

        if (!brandMatch) return false;

        const yarnName = normalize(yarn.name);
        return yarnName.length >= 4 && haystack.includes(yarnName);
      })
      .sort(function (a, b) {
        return normalize(b.name).length - normalize(a.name).length;
      })
      .slice(0, 4)
      .map(function (yarn) {
        return yarn.brand + "|" + yarn.name;
      });
  }

  function repairPatternRecord(item, aliases, yarns) {
    if (!item || typeof item !== "object" || !item.name) return item;

    item.sourceBrand = item.sourceBrand ? sweepBrand(item.sourceBrand) : item.sourceBrand;
    item.brand = item.brand ? sweepBrand(item.brand) : item.brand;

    if (Array.isArray(item.brands)) {
      item.brands = Array.from(new Set(item.brands.map(sweepBrand).filter(Boolean)));
    }

    const existingUsed = Array.isArray(item.usedYarns)
      ? item.usedYarns.map(function (key) {
          return repairUsedYarnKey(key, aliases);
        }).filter(Boolean)
      : [];

    const inferred = inferUsedYarnsFromText(item, yarns);

    item.usedYarns = Array.from(new Set(existingUsed.concat(inferred)));

    if (!Array.isArray(item.brands)) item.brands = [];

    item.usedYarns.forEach(function (key) {
      const brand = String(key).split("|")[0];
      if (brand && !item.brands.includes(brand)) item.brands.push(brand);
    });

    if (!item.sourceBrand && item.brands.length === 1) {
      item.sourceBrand = item.brands[0];
    }

    if (!item.weight && item.usedYarns.length) {
      const weights = item.usedYarns
        .map(function (key) {
          const match = yarns.find(function (yarn) {
            return yarn.brand + "|" + yarn.name === key;
          });
          return match && match.weight;
        })
        .filter(Boolean);

      if (weights.length && weights.every(function (weight) { return weight === weights[0]; })) {
        item.weight = weights[0];
      }
    } else if (item.weight) {
      item.weight = canonicalSweepWeight({ weight: item.weight }) || item.weight;
    }

    return item;
  }

  function dedupePatternArray(array, aliases, yarns) {
    if (!Array.isArray(array)) return array;

    const map = new Map();

    array.forEach(function (raw) {
      if (!raw || typeof raw !== "object" || !raw.name) return;

      const item = repairPatternRecord(raw, aliases, yarns);
      const key = patternIdentitySweep(item);
      const existing = map.get(key);

      if (!existing) {
        map.set(key, item);
        return;
      }

      const merged = Object.assign({}, item, existing);
      merged.usedYarns = Array.from(new Set(
        (existing.usedYarns || []).concat(item.usedYarns || [])
      ));
      merged.brands = Array.from(new Set(
        (existing.brands || []).concat(item.brands || [])
      ));
      merged.image = existing.image || item.image;
      merged.url = existing.url || item.url;
      merged.sourceUrl = existing.sourceUrl || item.sourceUrl;
      merged.patternUrl = existing.patternUrl || item.patternUrl;
      merged.ravelryUrl = existing.ravelryUrl || item.ravelryUrl;

      map.set(key, merged);
    });

    return Array.from(map.values());
  }

  const BERNAT_PATTERN_FIXES = [
    {
      name: "Simple Crochet Baby Blanket",
      craft: "crochet",
      project: "Blanket",
      weight: "Super Bulky",
      sourceBrand: "Bernat",
      brands: ["Bernat"],
      usedYarns: ["Bernat|Baby Blanket"],
      free: true,
      url: "https://www.yarnspirations.com/products/bernat-simple-crochet-baby-blanket"
    },
    {
      name: "Ripple Knit Baby Blanket",
      craft: "knit",
      project: "Blanket",
      weight: "Super Bulky",
      sourceBrand: "Bernat",
      brands: ["Bernat"],
      usedYarns: ["Bernat|Baby Blanket"],
      free: true,
      url: "https://www.yarnspirations.com/products/bernat-ripple-knit-baby-blanket"
    },
    {
      name: "In a Wink Knit Baby Blanket",
      craft: "knit",
      project: "Blanket",
      weight: "Super Bulky",
      sourceBrand: "Bernat",
      brands: ["Bernat"],
      usedYarns: ["Bernat|Baby Blanket"],
      free: true,
      url: "https://www.yarnspirations.com/products/bernat-in-a-wink-knit-baby-blanket"
    },
    {
      name: "Basketweave Knit Baby Blanket",
      craft: "knit",
      project: "Blanket",
      weight: "Super Bulky",
      sourceBrand: "Bernat",
      brands: ["Bernat"],
      usedYarns: ["Bernat|Baby Blanket"],
      free: true,
      url: "https://www.yarnspirations.com/products/bernat-basketweave-knit-baby-blanket"
    },
    {
      name: "Puffy Crochet Baby Blanket",
      craft: "crochet",
      project: "Blanket",
      weight: "Super Bulky",
      sourceBrand: "Bernat",
      brands: ["Bernat"],
      usedYarns: ["Bernat|Baby Blanket"],
      free: true,
      url: "https://www.yarnspirations.com/products/bernat-puffy-crochet-baby-blanket"
    },
    {
      name: "Mosaic Sparkle Baby Blanket",
      craft: "knit",
      project: "Blanket",
      weight: "Super Bulky",
      sourceBrand: "Bernat",
      brands: ["Bernat"],
      usedYarns: ["Bernat|Baby Blanket Sparkle"],
      free: true,
      url: "https://www.yarnspirations.com/products/bernat-knit-mosaic-sparkle-baby-blanket"
    },
    {
      name: "Sparkle Sedge Blanket",
      craft: "crochet",
      project: "Blanket",
      weight: "Super Bulky",
      sourceBrand: "Bernat",
      brands: ["Bernat"],
      usedYarns: ["Bernat|Baby Blanket Sparkle"],
      free: true,
      url: "https://www.yarnspirations.com/products/bernat-crochet-sparkle-sedge-blanket"
    },
    {
      name: "Mosaic Simply Saucers Blanket",
      craft: "knit",
      project: "Blanket",
      weight: "Super Bulky",
      sourceBrand: "Bernat",
      brands: ["Bernat"],
      usedYarns: ["Bernat|Baby Blanket", "Bernat|Baby Blanket Sparkle"],
      free: true,
      url: "https://www.yarnspirations.com/products/bernat-knit-mosaic-simply-saucers-blanket"
    },
    {
      name: "Chevron Baby Blanket",
      craft: "crochet",
      project: "Blanket",
      weight: "Super Bulky",
      sourceBrand: "Bernat",
      brands: ["Bernat"],
      usedYarns: ["Bernat|Baby Blanket Stripes"],
      free: true,
      url: "https://www.yarnspirations.com/products/bernat-crochet-chevron-baby-blanket"
    },
    {
      name: "Stroller Blanket",
      craft: "crochet",
      project: "Blanket",
      weight: "Super Bulky",
      sourceBrand: "Bernat",
      brands: ["Bernat"],
      usedYarns: ["Bernat|Baby Blanket Stripes"],
      free: true,
      url: "https://www.yarnspirations.com/products/bernat-crochet-stroller-blanket"
    },
    {
      name: "Kiddie Korners Blankie",
      craft: "knit",
      project: "Blanket",
      weight: "Super Bulky",
      sourceBrand: "Bernat",
      brands: ["Bernat"],
      usedYarns: ["Bernat|Baby Blanket Stripes"],
      free: true,
      url: "https://www.yarnspirations.com/products/bernat-kiddie-korners-knit-blankie"
    },
    {
      name: "Garden Wall Blanket",
      craft: "knit",
      project: "Blanket",
      weight: "Super Bulky",
      sourceBrand: "Bernat",
      brands: ["Bernat"],
      usedYarns: ["Bernat|Baby Blanket Dappled"],
      free: true,
      url: "https://www.yarnspirations.com/products/bernat-garden-wall-knit-blanket"
    },
    {
      name: "Tippy Toes Blanket",
      craft: "crochet",
      project: "Blanket",
      weight: "Super Bulky",
      sourceBrand: "Bernat",
      brands: ["Bernat"],
      usedYarns: ["Bernat|Baby Blanket Dappled"],
      free: true,
      url: "https://www.yarnspirations.com/products/bernat-tippy-toes-crochet-blanket"
    },
    {
      name: "Corner to Corner Garter Blanket",
      craft: "knit",
      project: "Blanket",
      weight: "Super Bulky",
      sourceBrand: "Bernat",
      brands: ["Bernat"],
      usedYarns: ["Bernat|Baby Blanket Dappled"],
      free: true,
      url: "https://www.yarnspirations.com/products/bernat-corner-to-corner-garter-knit-blanket"
    },
    {
      name: "Lacy Chevrons Baby Blanket",
      craft: "knit",
      project: "Blanket",
      weight: "Super Bulky",
      sourceBrand: "Bernat",
      brands: ["Bernat"],
      usedYarns: ["Bernat|Baby Blanket Dappled"],
      free: true,
      url: "https://www.yarnspirations.com/products/bernat-lacy-chevrons-knit-baby-blanket"
    },
    {
      name: "Diamond Filet Blanket",
      craft: "crochet",
      project: "Blanket",
      weight: "Super Bulky",
      sourceBrand: "Bernat",
      brands: ["Bernat"],
      usedYarns: ["Bernat|Baby Blanket Dappled"],
      free: true,
      url: "https://www.yarnspirations.com/products/bernat-diamond-filet-crochet-blanket"
    },
    {
      name: "Gridline Baby Blanket",
      craft: "knit",
      project: "Blanket",
      weight: "Super Bulky",
      sourceBrand: "Bernat",
      brands: ["Bernat"],
      usedYarns: ["Bernat|Baby Blanket O'Go"],
      free: true,
      url: "https://www.yarnspirations.com/products/bernat-knit-gridline-baby-blanket"
    },
    {
      name: "Gingham & Flowers Baby Blanket",
      craft: "crochet",
      project: "Blanket",
      weight: "Super Bulky",
      sourceBrand: "Bernat",
      brands: ["Bernat"],
      usedYarns: ["Bernat|Baby Blanket O'Go"],
      free: true,
      url: "https://www.yarnspirations.com/products/Bernat-Gingham-Flowers-Crochet-Baby-Blanket"
    },
    {
      name: "Eyelet Striped Blanket",
      craft: "crochet",
      project: "Blanket",
      weight: "Super Bulky",
      sourceBrand: "Bernat",
      brands: ["Bernat"],
      usedYarns: ["Bernat|Baby Blanket O'Go"],
      free: true,
      url: "https://www.yarnspirations.com/products/bernat-crochet-eyelet-striped-blanket"
    },
    {
      name: "Gingham Panels Blanket",
      craft: "knit",
      project: "Blanket",
      weight: "Super Bulky",
      sourceBrand: "Bernat",
      brands: ["Bernat"],
      usedYarns: ["Bernat|Baby Blanket O'Go"],
      free: true,
      url: "https://www.yarnspirations.com/products/bernat-knit-gingham-panels-blanket"
    },
    {
      name: "Leafy Time Baby Playmat",
      craft: "crochet",
      project: "Baby",
      weight: "Super Bulky",
      sourceBrand: "Bernat",
      brands: ["Bernat"],
      usedYarns: ["Bernat|Baby Blanket O'Go"],
      free: true,
      url: "https://www.yarnspirations.com/products/bernat-crochet-leafy-time-baby-playmat"
    },
    {
      name: "Daisy Pillow",
      craft: "crochet",
      project: "Other",
      weight: "Super Bulky",
      sourceBrand: "Bernat",
      brands: ["Bernat"],
      usedYarns: ["Bernat|Baby Blanket O'Go"],
      free: true,
      url: "https://www.yarnspirations.com/products/bernat-crochet-daisy-pillow"
    }
  ];

  function runFullCatalogSweep() {
    const beforeYarns = Array.isArray(window.YARN_CATALOG) ? window.YARN_CATALOG.length : 0;
    const beforePatterns = Array.isArray(window.PATTERN_CATALOG) ? window.PATTERN_CATALOG.length : 0;

    Object.keys(window).forEach(function (key) {
      const value = window[key];
      if (!Array.isArray(value) || !/YARN/i.test(key)) return;

      value.forEach(function (item) {
        repairYarnRecord(item);
        repairBernatBabyBlanket(item);
      });
    });

    if (Array.isArray(window.YARN_CATALOG)) {
      window.YARN_CATALOG = dedupeYarnArray(window.YARN_CATALOG);
    }

    const masterYarns = Array.isArray(window.YARN_CATALOG)
      ? window.YARN_CATALOG
      : [];

    const aliases = buildYarnAliasIndex();

    window.PATTERN_CATALOG = Array.isArray(window.PATTERN_CATALOG)
      ? window.PATTERN_CATALOG.concat(BERNAT_PATTERN_FIXES)
      : BERNAT_PATTERN_FIXES.slice();

    [
      "PATTERN_CATALOG",
      "KFI_PATTERN_CATALOG",
      "KELBOURNE_FAMILY_PATTERN_CATALOG",
      "EXTERNAL_PATTERN_CATALOG",
      "KNIT_PICKS_PATTERN_CATALOG"
    ].forEach(function (key) {
      if (!Array.isArray(window[key])) return;
      window[key] = dedupePatternArray(window[key], aliases, masterYarns);
    });

    if (Array.isArray(window.KFI_PATTERN_INDEX)) {
      const seen = new Map();
      window.KFI_PATTERN_INDEX = window.KFI_PATTERN_INDEX.filter(function (row) {
        if (!Array.isArray(row)) return true;

        const id = String(row[0] || "");
        const title = patternTitleKey(row[1] || "");
        const key = id ? "kfi:" + id : "title:" + title;

        if (seen.has(key)) return false;
        seen.set(key, true);

        if (Array.isArray(row[4])) {
          row[4] = Array.from(new Set(row[4].map(function (used) {
            return repairUsedYarnKey(used, aliases);
          })));
        }

        return true;
      });
    }

    const afterYarns = Array.isArray(window.YARN_CATALOG) ? window.YARN_CATALOG.length : 0;
    const afterPatterns = Array.isArray(window.PATTERN_CATALOG) ? window.PATTERN_CATALOG.length : 0;

    window.GARN_SWATCH_SWEEP = {
      completed: true,
      yarnsBefore: beforeYarns,
      yarnsAfter: afterYarns,
      yarnDuplicatesRemoved: Math.max(0, beforeYarns - afterYarns),
      patternsBefore: beforePatterns,
      patternsAfter: afterPatterns,
      bernatExactPatternsAdded: BERNAT_PATTERN_FIXES.length,
      normalizedWeights: true,
      filledGenericGaugeAndTools: true,
      repairedUsedYarnAliases: true,
      repairedImages: true
    };
  }

  runFullCatalogSweep();


  // ============================================================
  // METERS FOR EVERY YARN
  // ============================================================

  function addMetricLength(item) {
    if (!item || typeof item !== "object") return;

    const yards = Number(item.yards);
    const meters = Number(item.meters);

    if ((!Number.isFinite(meters) || meters <= 0) && Number.isFinite(yards) && yards > 0) {
      item.meters = Math.round(yards * 0.9144);
    }

    if ((!Number.isFinite(yards) || yards <= 0) && Number.isFinite(meters) && meters > 0) {
      item.yards = Math.round(meters * 1.0936133);
    }
  }

  function addMetersToEveryYarnCatalog() {
    Object.keys(window).forEach(function (key) {
      const value = window[key];
      if (!Array.isArray(value) || !/YARN/i.test(key)) return;

      value.forEach(addMetricLength);
    });

    if (Array.isArray(window.YARN_CATALOG)) {
      window.YARN_CATALOG.forEach(addMetricLength);
    }
  }

  function installMetricDisplay() {
    function updateVisibleMeters() {
      document.querySelectorAll(".selected-yarn-pills .pill").forEach(function (pill) {
        const text = String(pill.textContent || "").trim();

        if (/\bm\b/.test(text) || !/\byd\b/.test(text)) return;

        const match = text.match(/([\d,]+)\s*yd\s*\/\s*([\d,]+)\s*g/i);
        if (!match) return;

        const yards = Number(match[1].replace(/,/g, ""));
        if (!Number.isFinite(yards) || yards <= 0) return;

        const meters = Math.round(yards * 0.9144);
        pill.textContent = `${match[1]} yd / ${meters.toLocaleString()} m / ${match[2]} g`;
      });

      document.querySelectorAll(".catalog-list *").forEach(function (node) {
        if (node.children && node.children.length) return;

        const text = String(node.textContent || "").trim();
        if (/\bm\b/.test(text) || !/\byd\b/.test(text)) return;

        const match = text.match(/([\d,]+)\s*yd(?:\s*\/\s*([\d,]+)\s*g)?/i);
        if (!match) return;

        const yards = Number(match[1].replace(/,/g, ""));
        if (!Number.isFinite(yards) || yards <= 0) return;

        const meters = Math.round(yards * 0.9144);
        node.textContent = text.replace(
          match[0],
          match[2]
            ? `${match[1]} yd / ${meters.toLocaleString()} m / ${match[2]} g`
            : `${match[1]} yd / ${meters.toLocaleString()} m`
        );
      });
    }

    updateVisibleMeters();

    const observer = new MutationObserver(function () {
      updateVisibleMeters();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  addMetersToEveryYarnCatalog();
  window.addEventListener("load", installMetricDisplay);

  // ============================================================
  // GENERIC "OTHER / YARN TAG" ENTRY
  // ============================================================

  const CUSTOM_YARN_BRAND = "Other / Yarn Tag";
  const CUSTOM_YARN_STORAGE = "garnSwatchCustomYarn";

  function readCustomYarn() {
    try {
      const saved = JSON.parse(localStorage.getItem(CUSTOM_YARN_STORAGE) || "{}");
      return saved && typeof saved === "object" ? saved : {};
    } catch {
      return {};
    }
  }

  function numberOrZero(value) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  function parseGauge(value) {
    const numbers = String(value || "")
      .match(/\d+(?:\.\d+)?/g);

    if (!numbers || !numbers.length) return null;

    const first = Number(numbers[0]);
    const second = numbers[1] ? Number(numbers[1]) : first;

    if (!Number.isFinite(first) || !Number.isFinite(second)) return null;

    return [Math.min(first, second), Math.max(first, second)];
  }

  function customYarnRecord() {
    const saved = readCustomYarn();

    return {
      brand: CUSTOM_YARN_BRAND,
      name: String(saved.name || "My yarn").trim() || "My yarn",
      status: "custom",
      weight: saved.weight || "Worsted",
      yards: numberOrZero(saved.yards) || (numberOrZero(saved.meters) ? Math.round(numberOrZero(saved.meters) * 1.0936133) : 0),
      meters: numberOrZero(saved.meters) || (numberOrZero(saved.yards) ? Math.round(numberOrZero(saved.yards) * 0.9144) : 0),
      grams: numberOrZero(saved.grams),
      fiber: String(saved.fiber || "").trim(),
      needleSize: String(saved.needleSize || "").trim(),
      hookSize: String(saved.hookSize || "").trim(),
      knitGauge: parseGauge(saved.knitGauge),
      crochetGauge: parseGauge(saved.crochetGauge)
    };
  }

  function addCustomYarnToCatalog() {
    if (!Array.isArray(window.YARN_CATALOG)) {
      window.YARN_CATALOG = [];
    }

    window.YARN_CATALOG = window.YARN_CATALOG.filter(function (item) {
      return !(item && item.brand === CUSTOM_YARN_BRAND);
    });

    window.YARN_CATALOG.push(customYarnRecord());
  }

  function customFormHtml(saved) {
    const esc = function (value) {
      return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    };

    const weights = [
      "Lace",
      "Fingering",
      "Sport",
      "DK",
      "Worsted",
      "Aran",
      "Bulky",
      "Super Bulky",
      "Jumbo"
    ];

    return `
      <div id="customYarnPanel" class="custom-yarn-panel" hidden>
        <div class="kicker">Yarn not listed?</div>
        <h3>Use the information on the yarn tag</h3>
        <p class="custom-yarn-help">
          Enter what the label gives you. Weight and gauge are used to rank patterns.
          Yards or meters are optional, but either one lets Garn Swatch calculate skein estimates.
        </p>

        <div class="row">
          <div class="field">
            <label for="customYarnName">Yarn name</label>
            <input id="customYarnName" type="text" value="${esc(saved.name || "My yarn")}" placeholder="My yarn">
          </div>

          <div class="field">
            <label for="customYarnWeight">Weight</label>
            <select id="customYarnWeight">
              ${weights.map(function (weight) {
                return `<option value="${weight}"${weight === (saved.weight || "Worsted") ? " selected" : ""}>${weight}</option>`;
              }).join("")}
            </select>
          </div>
        </div>

        <div class="row">
          <div class="field">
            <label for="customYarnFiber">Fiber</label>
            <input id="customYarnFiber" type="text" value="${esc(saved.fiber)}" placeholder="Example: 100% wool">
          </div>

          <div class="field">
            <label for="customNeedleSize">Needle size</label>
            <input id="customNeedleSize" type="text" value="${esc(saved.needleSize)}" placeholder="Example: US 7 / 4.5 mm">
          </div>
        </div>

        <div class="row">
          <div class="field">
            <label for="customKnitGauge">Knitting gauge — stitches / 4 in</label>
            <input id="customKnitGauge" type="text" value="${esc(saved.knitGauge)}" placeholder="Example: 18–20">
          </div>

          <div class="field">
            <label for="customHookSize">Crochet hook size <span class="muted">(optional)</span></label>
            <input id="customHookSize" type="text" value="${esc(saved.hookSize)}" placeholder="Example: H-8 / 5 mm">
          </div>
        </div>

        <div class="row">
          <div class="field">
            <label for="customCrochetGauge">Crochet gauge — stitches / 4 in <span class="muted">(optional)</span></label>
            <input id="customCrochetGauge" type="text" value="${esc(saved.crochetGauge)}" placeholder="Example: 14–16">
          </div>

          <div class="field">
            <label for="customYards">Yards per skein <span class="muted">(optional)</span></label>
            <input id="customYards" type="number" min="0" step="1" value="${esc(saved.yards)}" placeholder="Example: 220">
          </div>
        </div>

        <div class="row">
          <div class="field">
            <label for="customMeters">Meters per skein <span class="muted">(optional)</span></label>
            <input id="customMeters" type="number" min="0" step="1" value="${esc(saved.meters)}" placeholder="Example: 200">
          </div>

          <div class="field">
            <label for="customGrams">Grams per skein <span class="muted">(optional)</span></label>
            <input id="customGrams" type="number" min="0" step="1" value="${esc(saved.grams)}" placeholder="Example: 100">
          </div>
        </div>

        <div class="custom-yarn-actions">
          <button id="applyCustomYarn" type="button">Use this yarn</button>
          <button id="clearCustomYarn" class="secondary" type="button">Clear</button>
        </div>
      </div>
    `;
  }

  function installCustomYarnUi() {
    const brandSelect = document.getElementById("brandSelect");
    const yarnSelect = document.getElementById("yarnSelect");
    const yarnMeta = document.getElementById("yarnMeta");

    if (!brandSelect || !yarnSelect || !yarnMeta) return;

    if (!document.getElementById("customYarnStyles")) {
      const style = document.createElement("style");
      style.id = "customYarnStyles";
      style.textContent = `
        .custom-yarn-panel {
          margin: 1rem 0;
          padding: 1rem;
          border: 1px solid rgba(0,0,0,.14);
          border-radius: 14px;
          background: rgba(255,255,255,.72);
        }
        .custom-yarn-panel h3 {
          margin: .2rem 0 .35rem;
        }
        .custom-yarn-help {
          margin: 0 0 1rem;
          max-width: 70ch;
        }
        .custom-yarn-actions {
          display: flex;
          gap: .75rem;
          flex-wrap: wrap;
          margin-top: .8rem;
        }
        .custom-yarn-panel input,
        .custom-yarn-panel select {
          width: 100%;
        }
      `;
      document.head.appendChild(style);
    }

    if (!document.getElementById("customYarnPanel")) {
      yarnMeta.insertAdjacentHTML("beforebegin", customFormHtml(readCustomYarn()));
    }

    const panel = document.getElementById("customYarnPanel");
    const applyButton = document.getElementById("applyCustomYarn");
    const clearButton = document.getElementById("clearCustomYarn");

    function updatePanelVisibility() {
      const isCustom = brandSelect.value === CUSTOM_YARN_BRAND;
      panel.hidden = !isCustom;

      const saved = readCustomYarn();
      saved.active = isCustom;
      try {
        localStorage.setItem(CUSTOM_YARN_STORAGE, JSON.stringify(saved));
      } catch {}
    }

    brandSelect.addEventListener("change", updatePanelVisibility);

    applyButton.addEventListener("click", function () {
      const saved = {
        active: true,
        name: document.getElementById("customYarnName").value.trim() || "My yarn",
        weight: document.getElementById("customYarnWeight").value,
        fiber: document.getElementById("customYarnFiber").value.trim(),
        needleSize: document.getElementById("customNeedleSize").value.trim(),
        knitGauge: document.getElementById("customKnitGauge").value.trim(),
        hookSize: document.getElementById("customHookSize").value.trim(),
        crochetGauge: document.getElementById("customCrochetGauge").value.trim(),
        yards: document.getElementById("customYards").value,
        meters: document.getElementById("customMeters").value,
        grams: document.getElementById("customGrams").value
      };

      try {
        localStorage.setItem(CUSTOM_YARN_STORAGE, JSON.stringify(saved));
      } catch {}

      window.location.reload();
    });

    clearButton.addEventListener("click", function () {
      try {
        localStorage.removeItem(CUSTOM_YARN_STORAGE);
      } catch {}
      window.location.reload();
    });

    const saved = readCustomYarn();

    if (saved.active && [...brandSelect.options].some(function (option) {
      return option.value === CUSTOM_YARN_BRAND;
    })) {
      brandSelect.value = CUSTOM_YARN_BRAND;
      brandSelect.dispatchEvent(new Event("change", { bubbles: true }));

      const customName = String(saved.name || "My yarn").trim() || "My yarn";
      if ([...yarnSelect.options].some(function (option) {
        return option.value === customName;
      })) {
        yarnSelect.value = customName;
        yarnSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }
    } else {
      updatePanelVisibility();
    }
  }

  addCustomYarnToCatalog();
  window.addEventListener("load", installCustomYarnUi);

  Object.keys(window).forEach(function (key) {
    const value = window[key];
    if (!Array.isArray(value)) return;

    const isYarn = /YARN/i.test(key);
    const isPattern = /PATTERN/i.test(key);

    if (!isYarn && !isPattern) return;

    value.forEach(function (item) {
      setExactImage(item, isPattern ? "pattern" : "yarn");
    });
  });

  if (Array.isArray(window.YARN_CATALOG)) {
    window.YARN_CATALOG.forEach(function (item) {
      setExactImage(item, "yarn");
    });
  }

  if (Array.isArray(window.PATTERN_CATALOG)) {
    window.PATTERN_CATALOG.forEach(function (item) {
      setExactImage(item, "pattern");
    });
  }
})();
