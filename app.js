(function () {
  "use strict";

  function normalizedKey(value) {
    return String(value || "")
      .normalize("NFKD")
      .toLowerCase()
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
    return brandAliases.get(normalizedKey(brand)) || brand;
  }

  function canonicalPatternTitle(name) {
    const normalized = normalizedKey(name);
    const withoutPublicationNumber = normalized.replace(/^\d+\s+(?=\S)/, "");
    const standardizedCraft = withoutPublicationNumber.replace(/\bcrocheted\b/g, "crochet");
    return patternTitleAliases.get(standardizedCraft) || standardizedCraft;
  }

  function canonicalYarnKey(value) {
    const [brand, ...nameParts] = String(value || "").split("|");
    return nameParts.length ? `${canonicalBrand(brand)}|${nameParts.join("|")}` : value;
  }

  function dedupeYarns(items) {
    const merged = new Map();
    items.forEach((item) => {
      const incoming = { ...item, brand: canonicalBrand(item.brand) };
      const key = `${normalizedKey(incoming.brand)}|${normalizedKey(incoming.name)}`;
      const existing = merged.get(key);
      if (!existing) {
        merged.set(key, incoming);
        return;
      }
      merged.set(key, {
        ...incoming,
        ...existing,
        kfiId: existing.kfiId || incoming.kfiId,
        image: existing.image || incoming.image,
        knitGauge: existing.knitGauge || incoming.knitGauge,
        crochetGauge: existing.crochetGauge || incoming.crochetGauge,
        sourceUrl: existing.sourceUrl || incoming.sourceUrl
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
    return `pattern:${normalizedKey(pattern.name)}|${normalizedKey(pattern.designer)}|${normalizedKey(pattern.craft)}`;
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

  const yarns = dedupeYarns([...(window.YARN_CATALOG || []), ...(window.KFI_YARN_CATALOG || [])]);
  const patterns = dedupePatterns([...(window.PATTERN_CATALOG || []), ...(window.KFI_PATTERN_CATALOG || [])]);
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

  function buildMasterPatternCatalog() {
    const byIdentity = new Map();
    const sources = [
      ...kfiPatternIndex.map((pattern) => ({
        ...pattern,
        brands: [...new Set(pattern.usedYarns.map((yarnKey) => yarnKey.split("|")[0]))]
      })),
      ...noveltyPatternCatalog.map((pattern) => ({ ...pattern, brands: [pattern.brand], usedYarns: [] })),
      ...externalPatternCatalog
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
  const yarnByKey = new Map(yarns.map((yarn) => [`${yarn.brand}|${yarn.name}`, yarn]));

  function inferredPatternCraft(pattern) {
    if (pattern.craft === "knit" || pattern.craft === "crochet") return pattern.craft;
    if (kfiCrochetDesignIds.has(String(pattern.kfiDesignId || ""))) return "crochet";
    const title = normalizedKey(pattern.name);
    return /\b(crochet|crocheted|granny|amigurumi)\b/.test(title) ? "crochet" : "knit";
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
    return `${canonicalPatternTitle(pattern.name)}|${signature}|${inferredPatternCraft(pattern)}`;
  }

  function patternDetailScore(pattern) {
    return Number(Number.isFinite(pattern.gauge)) + Number(Boolean(pattern.project)) + Number(Boolean(pattern.designer));
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
      const overlapIndex = incomingYarns.size
        ? group.findIndex((existing) => (existing.usedYarns || []).some((yarnKey) => incomingYarns.has(yarnKey)))
        : -1;
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
  const state = { craft: "knit", project: "Hat", patternVisible: 24 };
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

  function currentYarn() {
    const brand = $("brandSelect").value;
    const name = $("yarnSelect").value;
    return yarns.find((yarn) => yarn.brand === brand && yarn.name === name) || yarns[0];
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
    return Math.ceil((yardsNeeded * (1 + buffer)) / yarn.yards);
  }

  function populateBrands() {
    $("brandSelect").innerHTML = brands()
      .map((brand) => `<option value="${escapeHtml(brand)}">${escapeHtml(brand)}</option>`)
      .join("");
  }

  function populateYarns(preferredName) {
    const brand = $("brandSelect").value;
    const brandYarns = yarns
      .filter((yarn) => yarn.brand === brand)
      .sort((a, b) => a.name.localeCompare(b.name));

    $("yarnSelect").innerHTML = brandYarns
      .map((yarn) => `<option value="${escapeHtml(yarn.name)}">${escapeHtml(yarn.name)}</option>`)
      .join("");

    if (preferredName && brandYarns.some((yarn) => yarn.name === preferredName)) {
      $("yarnSelect").value = preferredName;
    }
  }

  function renderMeta() {
    const yarn = currentYarn();
    const gauge = state.craft === "knit" ? yarn.knitGauge : yarn.crochetGauge;
    const gaugeText = gauge
      ? `${gauge[0]}${gauge[1] !== gauge[0] ? `–${gauge[1]}` : ""} sts / 4 in`
      : "Gauge not published";

    $("yarnMeta").innerHTML = [
      yarn.weight,
      `${yarn.yards} yd / ${yarn.grams} g`,
      yarn.fiber,
      gaugeText
    ].map((item) => `<span class="pill">${escapeHtml(item)}</span>`).join("");

    const skeins = skeinsOnHand();
    $("availableYards").textContent = `${skeins} skein${skeins === 1 ? "" : "s"} = about ${formatNumber(skeins * yarn.yards)} yards on hand.`;
  }

  function renderProjects() {
    const yarn = currentYarn();
    const ranges = baseRanges[yarn.weight] || baseRanges.Worsted;
    const isNovelty = yarn.weight === "Novelty";
    const onHand = skeinsOnHand() * yarn.yards;
    const multiplier = craftMultiplier();

    $("projectCards").innerHTML = Object.entries(ranges).map(([project, range]) => {
      const minYards = Math.round(range[0] * multiplier);
      const maxYards = Math.round(range[1] * multiplier);
      const minSkeins = Math.ceil(minYards / yarn.yards);
      const maxSkeins = Math.ceil(maxYards / yarn.yards);
      const possible = onHand >= minYards;
      const shortage = Math.max(1, minSkeins - skeinsOnHand());
      const status = isNovelty
        ? `<span class="maybe">Use a pattern written for this yarn</span>`
        : possible
        ? `<span class="good">${onHand >= maxYards ? "Enough for most versions" : "Possible for some sizes/styles"}</span>`
        : `<span class="maybe">About ${shortage} more skein${shortage === 1 ? "" : "s"} needed</span>`;

      return `<button class="project ${state.project === project ? "selected" : ""}" type="button" data-project="${escapeHtml(project)}" aria-pressed="${state.project === project}">
        <div class="icon" aria-hidden="true">${projectIcons[project] || "•"}</div>
        <h3>${escapeHtml(project)}</h3>
        <div class="big">${isNovelty ? "Pattern-specific" : `${minSkeins}–${maxSkeins} skeins`}</div>
        <div class="sub">${isNovelty ? "Novelty yarns do not share a standard yardage range." : `About ${formatNumber(minYards)}–${formatNumber(maxYards)} yards`}<br>${status}</div>
      </button>`;
    }).join("");

    document.querySelectorAll(".project").forEach((button) => {
      button.addEventListener("click", () => {
        state.project = button.dataset.project;
        state.patternVisible = 24;
        $("buyProject").value = state.project;
        renderProjects();
        renderRankedPatternLibrary();
        renderBuyEstimate();
      });
    });
  }

  function patternScore(pattern, yarn) {
    const yarnKey = `${yarn.brand}|${yarn.name}`;
    const exact = Array.isArray(pattern.usedYarns) && pattern.usedYarns.includes(yarnKey);
    let score = exact ? 100 : 0;
    if (pattern.weight === yarn.weight) score += 30;
    if (pattern.weight === "Any") score += 20;

    const gauge = state.craft === "knit" ? yarn.knitGauge : yarn.crochetGauge;
    if (gauge && pattern.gauge && pattern.gauge >= gauge[0] - 2 && pattern.gauge <= gauge[1] + 2) score += 10;
    if (skeinsOnHand() * yarn.yards >= pattern.minYards) score += 5;
    return { exact, score };
  }

  function patternMedia(pattern) {
    const initial = escapeHtml(pattern.name.charAt(0).toUpperCase());
    if (!pattern.image) return `<div class="pattern-placeholder" aria-hidden="true">${initial}</div>`;
    return `<img class="pattern-image" src="${escapeHtml(pattern.image)}" alt="${escapeHtml(pattern.name)} pattern" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false">
      <div class="pattern-placeholder" aria-hidden="true" hidden>${initial}</div>`;
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
      .filter((pattern) => pattern.exact || pattern.weight === yarn.weight || pattern.weight === "Any")
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
      .slice(0, 8);
  }

  function uniqueKfiPatternsForYarn(yarnKey) {
    const byTitle = new Map();
    kfiPatternIndex
      .filter((pattern) => pattern.usedYarns.includes(yarnKey))
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
      const label = pattern.weight === "Any" ? "Flexible-weight option" : "Compatible by weight";
      const patternLinks = [];
      if (pattern.url) {
        patternLinks.push(`<a href="${escapeHtml(pattern.url)}" target="_blank" rel="noopener">${pattern.ravelryUrl ? "Official pattern" : `View on ${escapeHtml(pattern.sourceBrand || "pattern site")}`} →</a>`);
      }
      if (pattern.ravelryUrl) {
        patternLinks.push(`<a href="${escapeHtml(pattern.ravelryUrl)}" target="_blank" rel="noopener">View on Ravelry →</a>`);
      }

      return `<article class="pattern" data-yarn-key="${escapeHtml(yarnKey)}">
        ${patternMedia(pattern)}
        <div class="pattern-body">
          <div class="match compatible">${label}</div>
          <h3>${escapeHtml(pattern.name)}</h3>
          <p>${escapeHtml(pattern.designer)} · ${escapeHtml(pattern.project)} · ${escapeHtml(pattern.weight)}${pattern.gauge ? ` · ${pattern.gauge} sts / 4 in` : ""}<br>
          ${formatNumber(pattern.minYards)}–${formatNumber(pattern.maxYards)} yd · ${pattern.free ? "Free pattern" : "Pattern listing"}<br>${escapeHtml(availability)}</p>
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
      const ravelryUrl = `https://www.ravelry.com/patterns/search#query=${encodeURIComponent(`${pattern.name} ${yarn.brand}`)}&sort=best`;
      return `<article class="pattern">
        ${patternMedia(pattern)}
        <div class="pattern-body">
          <div class="match">Pattern uses this yarn</div>
          <h3>${escapeHtml(pattern.name)}</h3>
          <p>Official Knitting Fever design · Exact yarn pairing. Yardage, sizing, and craft details are on the pattern page.</p>
          <div class="pattern-links">
            <a href="${escapeHtml(pattern.url)}" target="_blank" rel="noopener">View on Knitting Fever →</a>
            <a href="${escapeHtml(ravelryUrl)}" target="_blank" rel="noopener">Find on Ravelry →</a>
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
      const ravelryUrl = `https://www.ravelry.com/patterns/search#query=${encodeURIComponent(`${pattern.name} ${yarn.brand}`)}&sort=best`;
      return `<article class="pattern">
        ${patternMedia(pattern)}
        <div class="pattern-body">
          <div class="match compatible">From this brand's pattern library</div>
          <h3>${escapeHtml(pattern.name)}</h3>
          <p>Official Knitting Fever design. This pattern may use a different yarn from the same brand, so check the pattern page before substituting.</p>
          <div class="pattern-links">
            <a href="${escapeHtml(pattern.url)}" target="_blank" rel="noopener">View on Knitting Fever →</a>
            <a href="${escapeHtml(ravelryUrl)}" target="_blank" rel="noopener">Find on Ravelry →</a>
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
    const yarn = currentYarn();
    if (yarn.weight === "Novelty") {
      $("buyAnswer").textContent = "Use exact pattern";
      $("buyDetails").textContent = `${yarn.name} has no standard yarn-weight estimate. Open an official design above and follow its listed yardage.`;
      return;
    }
    const project = $("buyProject").value || state.project;
    const size = $("size").value || "M";
    const buffer = Number($("buffer").value || 0);
    const ranges = baseRanges[yarn.weight] || baseRanges.Worsted;
    const range = ranges[project] || [300, 600];
    const sizeFactor = project === "Sweater" || project === "Baby" ? (sizeFactors[size] || 1) : 1;
    const midpoint = ((range[0] + range[1]) / 2) * sizeFactor * craftMultiplier();
    const skeins = skeinCount(midpoint, yarn, buffer);

    $("buyAnswer").textContent = `${skeins} skein${skeins === 1 ? "" : "s"}`;
    $("buyDetails").textContent = `About ${formatNumber(midpoint * (1 + buffer))} yards including ${Math.round(buffer * 100)}% extra, using ${yarn.name} (${yarn.yards} yd each).`;
  }

  function renderCatalog() {
    $("catalogCount").textContent = `${brands().length} brands · ${yarns.length} yarns`;
    $("catalogList").innerHTML = brands().map((brand) => {
      const items = yarns
        .filter((yarn) => yarn.brand === brand)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((yarn) => `<li><a href="${escapeHtml(yarn.sourceUrl)}" target="_blank" rel="noopener">${escapeHtml(yarn.name)}</a> · ${escapeHtml(yarn.weight)}</li>`)
        .join("");
      return `<section class="catalog-group"><h3>${escapeHtml(brand)}</h3><ul>${items}</ul></section>`;
    }).join("");
  }

  function populatePatternBrands() {
    const patternBrands = [...new Set(rankedPatternCatalog.flatMap((pattern) => pattern.brands || []))]
      .sort((a, b) => a.localeCompare(b));
    $("patternBrandFilter").innerHTML = [
      `<option value="">All pattern brands</option>`,
      ...patternBrands.map((brand) => `<option value="${escapeHtml(brand)}">${escapeHtml(brand)}</option>`)
    ].join("");
  }

  function patternWeights(pattern) {
    const weights = new Set();
    if (pattern.weight && pattern.weight !== "Any") weights.add(pattern.weight);
    (pattern.usedYarns || []).forEach((yarnKey) => {
      const matchedYarn = yarnByKey.get(yarnKey);
      if (matchedYarn?.weight) weights.add(matchedYarn.weight);
    });
    return [...weights];
  }

  function weightFamilies(weight) {
    const groups = {
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
    return groups[weight] || [weight];
  }

  function patternWeightLabel(pattern) {
    if (pattern.weight === "Any") return "Any yarn weight";
    const weights = patternWeights(pattern);
    return weights.length ? weights.join(", ") : "Not published";
  }

  function recommendedToolLabel(yarn) {
    return toolRecommendations[yarn.weight]?.[state.craft] || "Check the yarn label and pattern";
  }

  function yarnGaugeRange(yarn) {
    const gauge = state.craft === "crochet" ? yarn?.crochetGauge : yarn?.knitGauge;
    return Array.isArray(gauge) && gauge.length >= 2 && gauge.every(Number.isFinite) ? gauge : null;
  }

  function patternGaugeRanges(pattern) {
    if (Number.isFinite(pattern.gauge)) return [[pattern.gauge, pattern.gauge]];
    return (pattern.usedYarns || [])
      .map((yarnKey) => yarnGaugeRange(yarnByKey.get(yarnKey)))
      .filter(Boolean);
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
    return `${minimum}${maximum !== minimum ? `–${maximum}` : ""} sts / 4 in`;
  }

  function gaugeRangesOverlap(first, second) {
    return Boolean(first && second && first[0] <= second[1] && second[0] <= first[1]);
  }

  function gaugeCompatibilityPoints(pattern, yarn) {
    const selectedRange = yarnGaugeRange(yarn);
    const ranges = patternGaugeRanges(pattern);
    if (!selectedRange || !ranges.length) return 0;
    const selectedMidpoint = (selectedRange[0] + selectedRange[1]) / 2;
    return Math.max(...ranges.map((range) => {
      const midpoint = (range[0] + range[1]) / 2;
      const centerCloseness = Math.max(0, 1 - Math.abs(midpoint - selectedMidpoint) / Math.max(1, selectedMidpoint));
      if (gaugeRangesOverlap(range, selectedRange)) return 50 + Math.round(centerCloseness * 15);
      const gap = range[0] > selectedRange[1] ? range[0] - selectedRange[1] : selectedRange[0] - range[1];
      const nearCloseness = Math.max(0, 1 - gap / Math.max(4, selectedMidpoint * 0.5));
      return Math.round(nearCloseness * 49);
    }));
  }

  function weightCompatibilityPoints(pattern, yarn) {
    if (pattern.weight === "Any") return 20;
    const weightOrder = new Map([
      ["Lace", 0], ["Fingering", 1], ["Sport", 2], ["DK", 3],
      ["Worsted", 4], ["Aran", 4], ["Bulky", 5], ["Super Bulky", 6], ["Jumbo", 7]
    ]);
    const yarnFamilies = weightFamilies(yarn.weight);
    const patternFamilies = patternWeights(pattern).flatMap(weightFamilies);
    if (patternFamilies.some((weight) => yarnFamilies.includes(weight))) return 30;
    const distances = patternFamilies.flatMap((patternWeight) => yarnFamilies.map((yarnWeight) => {
      const patternLevel = weightOrder.get(patternWeight);
      const yarnLevel = weightOrder.get(yarnWeight);
      return Number.isFinite(patternLevel) && Number.isFinite(yarnLevel) ? Math.abs(patternLevel - yarnLevel) : Infinity;
    }));
    return distances.length && Math.min(...distances) === 1 ? 15 : 0;
  }

  function rankBand(score) {
    return score >= 80 ? "high" : score >= 40 ? "medium" : "low";
  }

  function rankedPatternMatch(pattern, yarn) {
    const yarnKey = `${yarn.brand}|${yarn.name}`;
    const exact = (pattern.usedYarns || []).includes(yarnKey);
    const selectedYarnGauge = yarnGaugeRange(yarn);
    const gaugeMatch = patternGaugeRanges(pattern).some((range) => gaugeRangesOverlap(range, selectedYarnGauge));
    const yarnWeights = new Set(weightFamilies(yarn.weight));
    const weightMatch = pattern.weight === "Any" || patternWeights(pattern)
      .flatMap(weightFamilies)
      .some((weight) => yarnWeights.has(weight));
    const gaugePoints = gaugeCompatibilityPoints(pattern, yarn);
    const weightPoints = weightCompatibilityPoints(pattern, yarn);
    const score = exact ? 100 : Math.min(99, gaugePoints + weightPoints);
    const reason = exact
      ? `Written for ${yarn.name}.`
      : gaugeMatch && weightMatch
      ? "Strong gauge and yarn-weight match. Make a swatch before substituting."
      : gaugeMatch && !weightMatch
      ? "Gauge overlaps, but the listed yarn weight does not match."
      : weightMatch && !gaugeMatch
      ? "Yarn weight matches; the score reflects the gauge difference or missing gauge."
      : score > 0
      ? "A partial gauge or neighboring-weight match; swatch carefully before substituting."
      : "No confirmed gauge and yarn-weight match.";
    return { score, reason, gaugeMatch, weightMatch, gaugePoints, weightPoints, projectMatch: pattern.inferredProject === state.project };
  }

  function renderRankedPatternLibrary() {
    const yarn = currentYarn();
    const query = normalizedKey($("patternSearch").value);
    const brand = $("patternBrandFilter").value;
    const filtered = rankedPatternCatalog
      .filter((pattern) => pattern.craft === state.craft)
      .filter((pattern) => !brand || (pattern.brands || []).includes(brand))
      .filter((pattern) => !query || normalizedKey([
          pattern.name,
          pattern.inferredProject,
          ...(pattern.brands || []),
          ...(pattern.usedYarns || [])
        ].join(" ")).includes(query))
      .map((pattern) => ({ ...pattern, ...rankedPatternMatch(pattern, yarn) }))
      .sort((a, b) => b.score - a.score || Number(b.projectMatch) - Number(a.projectMatch) || a.name.localeCompare(b.name));
    const visible = filtered.slice(0, state.patternVisible);

    $("allPatternGrid").innerHTML = visible.map((pattern) => {
      const yarnLabels = (pattern.usedYarns || []).slice(0, 3).map((yarnKey) => yarnKey.replace("|", " — "));
      const extraYarns = Math.max(0, (pattern.usedYarns || []).length - yarnLabels.length);
      const details = yarnLabels.length
        ? `Listed yarn${pattern.usedYarns.length === 1 ? "" : "s"}: ${yarnLabels.join(", ")}${extraYarns ? `, plus ${extraYarns} more` : ""}`
        : (pattern.brands || []).length ? `Brand: ${(pattern.brands || []).join(", ")}` : "Yarn not listed";
      const ravelryUrl = `https://www.ravelry.com/patterns/search#query=${encodeURIComponent(`${pattern.name} ${(pattern.brands || []).join(" ")}`)}&sort=best`;
      const craftLabel = state.craft === "crochet" ? "Crochet" : "Knitting";
      const gaugeLabel = patternGaugeLabel(pattern);
      const yarnGaugeLabel = formatGaugeRange(yarnGaugeRange(yarn));
      const patternWeight = patternWeightLabel(pattern);
      const toolLabel = recommendedToolLabel(yarn);
      const toolName = state.craft === "crochet" ? "Suggested hook" : "Suggested needles";
      const primaryLabel = /knittingfever\.com/i.test(pattern.url || "") ? "View on Knitting Fever" : "View pattern";
      return `<article class="pattern">
        ${patternMedia(pattern)}
        <div class="pattern-body">
          <div class="rank rank-${rankBand(pattern.score)}">${pattern.score}% match</div>
          <h3>${escapeHtml(pattern.name)}</h3>
          <p>${craftLabel} · ${escapeHtml(pattern.inferredProject)}${pattern.projectMatch ? " · Selected project" : ""}<br>
          <strong>Pattern gauge:</strong> ${escapeHtml(gaugeLabel)}<br>
          <strong>Yarn gauge:</strong> ${escapeHtml(yarnGaugeLabel)}<br>
          <strong>Pattern weight:</strong> ${escapeHtml(patternWeight)}<br>
          <strong>Yarn weight:</strong> ${escapeHtml(yarn.weight)}<br>
          <strong>${toolName}:</strong> ${escapeHtml(toolLabel)}<br>
          ${escapeHtml(pattern.reason)}<br>${escapeHtml(details)}</p>
          <div class="pattern-links">
            <a href="${escapeHtml(pattern.url)}" target="_blank" rel="noopener">${primaryLabel} →</a>
            <a href="${escapeHtml(ravelryUrl)}" target="_blank" rel="noopener">Find on Ravelry →</a>
          </div>
        </div>
      </article>`;
    }).join("");

    const shown = Math.min(visible.length, filtered.length);
    const craftLabel = state.craft === "crochet" ? "crochet" : "knitting";
    const exactCount = filtered.filter((pattern) => pattern.score === 100).length;
    $("allPatternCount").textContent = `${filtered.length.toLocaleString()} ${craftLabel} patterns`;
    $("allPatternSummary").textContent = `Showing ${shown.toLocaleString()} of ${filtered.length.toLocaleString()} ${craftLabel} patterns ranked for ${yarn.name}. ${exactCount.toLocaleString()} exact ${exactCount === 1 ? "match" : "matches"}.`;
    const more = $("showMorePatterns");
    more.hidden = shown >= filtered.length;
    more.textContent = `Show ${Math.min(24, filtered.length - shown).toLocaleString()} more patterns`;
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
    $("buyProject").innerHTML = Object.keys(baseRanges.Worsted).map((project) => `<option>${escapeHtml(project)}</option>`).join("");
    $("buyProject").value = state.project;
    renderCatalog();
    populatePatternBrands();
    renderAll();

    $("brandSelect").addEventListener("change", () => {
      state.patternVisible = 24;
      populateYarns();
      renderAll();
    });
    $("yarnSelect").addEventListener("change", () => {
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
    $("patternSearch").addEventListener("input", () => {
      state.patternVisible = 24;
      renderRankedPatternLibrary();
    });
    $("patternBrandFilter").addEventListener("change", () => {
      state.patternVisible = 24;
      renderRankedPatternLibrary();
    });
    $("showMorePatterns").addEventListener("click", () => {
      state.patternVisible += 24;
      renderRankedPatternLibrary();
    });
  }

  window.YarnFirst = { brands, baseRanges, patternScore, uniqueKfiPatternsForYarn, uniqueNoveltyBrandPatterns, allPatternCatalog, rankedPatternCatalog, canonicalPatternTitle, inferredPatternCraft, rankedPatternMatch, gaugeCompatibilityPoints, weightCompatibilityPoints, patternGaugeLabel, patternWeightLabel, recommendedToolLabel };
  init();
}());
