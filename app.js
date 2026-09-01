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

  function canonicalBrand(brand) {
    return brandAliases.get(normalizedKey(brand)) || brand;
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

  function buildMasterPatternCatalog() {
    const byIdentity = new Map();
    const sources = [
      ...kfiPatternIndex.map((pattern) => ({
        ...pattern,
        brands: [...new Set(pattern.usedYarns.map((yarnKey) => yarnKey.split("|")[0]))]
      })),
      ...noveltyPatternCatalog.map((pattern) => ({ ...pattern, brands: [pattern.brand], usedYarns: [] }))
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

    const byPatternAndYarns = new Map();
    [...byIdentity.values()].forEach((pattern) => {
      const yarnSignature = pattern.usedYarns.length
        ? pattern.usedYarns.map(normalizedKey).sort().join(";")
        : (pattern.brands || []).map(normalizedKey).sort().join(";");
      const key = `${normalizedKey(pattern.name)}|${yarnSignature}`;
      const existing = byPatternAndYarns.get(key);
      if (!existing || Number(pattern.kfiDesignId) > Number(existing.kfiDesignId)) {
        byPatternAndYarns.set(key, pattern);
      }
    });
    return [...byPatternAndYarns.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  const allPatternCatalog = buildMasterPatternCatalog();
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
  const state = { craft: "knit", project: "Hat", kfiExpanded: false, noveltyExpanded: false, patternVisible: 24 };

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
        $("buyProject").value = state.project;
        renderProjects();
        renderPatterns();
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
    const matches = matchingPatterns(yarn);

    const cards = matches.map((pattern) => {
      const enough = onHand >= pattern.minYards;
      const additionalSkeins = Math.max(0, Math.ceil((pattern.minYards - onHand) / yarn.yards));
      const availability = enough
        ? "Your amount may work for at least one listed size."
        : `You may need ${additionalSkeins} more skein${additionalSkeins === 1 ? "" : "s"}.`;
      const label = pattern.exact ? "Pattern uses this yarn" : pattern.weight === "Any" ? "Flexible-weight option" : "Compatible by weight";
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
          <div class="match ${pattern.exact ? "" : "compatible"}">${label}</div>
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
    const exactCount = matches.filter((pattern) => pattern.exact).length;
    $("patternSummary").textContent = exactCount
      ? `${exactCount} exact ${exactCount === 1 ? "yarn pairing" : "yarn pairings"} shown first, followed by compatible choices.`
      : `Showing compatible ${yarn.weight} choices for ${yarn.name}; no curated exact pairing for this project yet.`;
  }

  function renderKfiExactPatterns() {
    const yarn = currentYarn();
    const yarnKey = `${yarn.brand}|${yarn.name}`;
    const detailedExact = matchingPatterns(yarn).filter((pattern) => pattern.exact);
    const detailedIds = new Set(detailedExact.map(patternIdentity));
    const detailedNames = new Set(detailedExact.map((pattern) => normalizedKey(pattern.name)));
    const indexedExact = uniqueKfiPatternsForYarn(yarnKey);
    const additional = indexedExact.filter((pattern) =>
      !detailedIds.has(patternIdentity(pattern)) && !detailedNames.has(normalizedKey(pattern.name))
    );
    const section = $("kfiPatternSection");

    if (!additional.length) {
      section.hidden = true;
      $("kfiExactPatterns").innerHTML = "";
      $("toggleKfiPatterns").hidden = true;
      return;
    }

    const visible = state.kfiExpanded ? additional : additional.slice(0, 12);
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
    $("kfiPatternSummary").textContent = `${indexedExact.length.toLocaleString()} unique official pattern ${indexedExact.length === 1 ? "title" : "titles"} use ${yarn.name}. ${detailedExact.length ? `${detailedExact.length} fully detailed ${detailedExact.length === 1 ? "match is" : "matches are"} shown above.` : ""}`.trim();
    const toggle = $("toggleKfiPatterns");
    toggle.hidden = additional.length <= 12;
    toggle.textContent = state.kfiExpanded ? "Show fewer patterns" : `Show all ${additional.length.toLocaleString()} more patterns`;
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
    const exactBrandCount = brandPatterns.length - additional.length;
    $("noveltyPatternSummary").textContent = `${brandPatterns.length.toLocaleString()} unique official pattern ${brandPatterns.length === 1 ? "title" : "titles"} in ${yarn.brand}. ${exactBrandCount ? `${exactBrandCount} yarn-specific ${exactBrandCount === 1 ? "match is" : "matches are"} shown above.` : ""}`.trim();
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
    const patternBrands = [...new Set(allPatternCatalog.flatMap((pattern) => pattern.brands || []))]
      .sort((a, b) => a.localeCompare(b));
    $("patternBrandFilter").innerHTML = [
      `<option value="">All Knitting Fever brands</option>`,
      ...patternBrands.map((brand) => `<option value="${escapeHtml(brand)}">${escapeHtml(brand)}</option>`)
    ].join("");
    $("allPatternCount").textContent = `${allPatternCatalog.length.toLocaleString()} Knitting Fever patterns`;
  }

  function renderAllPatternLibrary() {
    const query = normalizedKey($("patternSearch").value);
    const brand = $("patternBrandFilter").value;
    const filtered = allPatternCatalog.filter((pattern) => {
      const brandMatch = !brand || (pattern.brands || []).includes(brand);
      const searchable = normalizedKey([
        pattern.name,
        ...(pattern.brands || []),
        ...(pattern.usedYarns || [])
      ].join(" "));
      return brandMatch && (!query || searchable.includes(query));
    });
    const visible = filtered.slice(0, state.patternVisible);

    $("allPatternGrid").innerHTML = visible.map((pattern) => {
      const yarnLabels = (pattern.usedYarns || []).slice(0, 3).map((yarnKey) => yarnKey.replace("|", " — "));
      const extraYarns = Math.max(0, (pattern.usedYarns || []).length - yarnLabels.length);
      const details = yarnLabels.length
        ? `Matched yarn${pattern.usedYarns.length === 1 ? "" : "s"}: ${yarnLabels.join(", ")}${extraYarns ? `, plus ${extraYarns} more` : ""}`
        : `Brand: ${(pattern.brands || []).join(", ")}`;
      const ravelryUrl = `https://www.ravelry.com/patterns/search#query=${encodeURIComponent(`${pattern.name} ${(pattern.brands || []).join(" ")}`)}&sort=best`;
      return `<article class="pattern">
        ${patternMedia(pattern)}
        <div class="pattern-body">
          <div class="match compatible">Knitting Fever pattern</div>
          <h3>${escapeHtml(pattern.name)}</h3>
          <p>${escapeHtml(details)}. Confirm yarn, sizing, and yardage on the official pattern page.</p>
          <div class="pattern-links">
            <a href="${escapeHtml(pattern.url)}" target="_blank" rel="noopener">View on Knitting Fever →</a>
            <a href="${escapeHtml(ravelryUrl)}" target="_blank" rel="noopener">Find on Ravelry →</a>
          </div>
        </div>
      </article>`;
    }).join("");

    const shown = Math.min(visible.length, filtered.length);
    $("allPatternSummary").textContent = `Showing ${shown.toLocaleString()} of ${filtered.length.toLocaleString()} matching ${filtered.length === 1 ? "pattern" : "patterns"}.`;
    const more = $("showMorePatterns");
    more.hidden = shown >= filtered.length;
    more.textContent = `Show ${Math.min(24, filtered.length - shown).toLocaleString()} more patterns`;
  }

  function renderAll() {
    renderMeta();
    renderProjects();
    renderPatterns();
    renderKfiExactPatterns();
    renderNoveltyBrandPatterns();
    renderBuyEstimate();
  }

  function setCraft(craft) {
    state.craft = craft;
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
    renderAllPatternLibrary();
    renderAll();

    $("brandSelect").addEventListener("change", () => {
      state.kfiExpanded = false;
      state.noveltyExpanded = false;
      populateYarns();
      renderAll();
    });
    $("yarnSelect").addEventListener("change", () => {
      state.kfiExpanded = false;
      state.noveltyExpanded = false;
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
    $("toggleKfiPatterns").addEventListener("click", () => {
      state.kfiExpanded = !state.kfiExpanded;
      renderKfiExactPatterns();
    });
    $("toggleNoveltyPatterns").addEventListener("click", () => {
      state.noveltyExpanded = !state.noveltyExpanded;
      renderNoveltyBrandPatterns();
    });
    $("patternSearch").addEventListener("input", () => {
      state.patternVisible = 24;
      renderAllPatternLibrary();
    });
    $("patternBrandFilter").addEventListener("change", () => {
      state.patternVisible = 24;
      renderAllPatternLibrary();
    });
    $("showMorePatterns").addEventListener("click", () => {
      state.patternVisible += 24;
      renderAllPatternLibrary();
    });
  }

  window.YarnFirst = { brands, baseRanges, patternScore, uniqueKfiPatternsForYarn, uniqueNoveltyBrandPatterns, allPatternCatalog };
  init();
}());
