(function () {
  "use strict";

  const yarns = window.YARN_CATALOG || [];
  const patterns = window.PATTERN_CATALOG || [];
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
  const state = { craft: "knit", project: "Hat" };

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
    const onHand = skeinsOnHand() * yarn.yards;
    const multiplier = craftMultiplier();

    $("projectCards").innerHTML = Object.entries(ranges).map(([project, range]) => {
      const minYards = Math.round(range[0] * multiplier);
      const maxYards = Math.round(range[1] * multiplier);
      const minSkeins = Math.ceil(minYards / yarn.yards);
      const maxSkeins = Math.ceil(maxYards / yarn.yards);
      const possible = onHand >= minYards;
      const shortage = Math.max(1, minSkeins - skeinsOnHand());
      const status = possible
        ? `<span class="good">${onHand >= maxYards ? "Enough for most versions" : "Possible for some sizes/styles"}</span>`
        : `<span class="maybe">About ${shortage} more skein${shortage === 1 ? "" : "s"} needed</span>`;

      return `<button class="project ${state.project === project ? "selected" : ""}" type="button" data-project="${escapeHtml(project)}" aria-pressed="${state.project === project}">
        <div class="icon" aria-hidden="true">${projectIcons[project] || "•"}</div>
        <h3>${escapeHtml(project)}</h3>
        <div class="big">${minSkeins}–${maxSkeins} skeins</div>
        <div class="sub">About ${formatNumber(minYards)}–${formatNumber(maxYards)} yards<br>${status}</div>
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
    return `https://www.ravelry.com/patterns/search#craft=${craft}&weight=${weights[yarn.weight] || "worsted"}&pc=${projects[state.project] || "other"}&sort=best`;
  }

  function renderPatterns() {
    const yarn = currentYarn();
    const yarnKey = `${yarn.brand}|${yarn.name}`;
    const onHand = skeinsOnHand() * yarn.yards;

    const matches = patterns
      .filter((pattern) => pattern.craft === state.craft && pattern.project === state.project)
      .map((pattern) => ({ ...pattern, ...patternScore(pattern, yarn) }))
      .filter((pattern) => pattern.exact || pattern.weight === yarn.weight || pattern.weight === "Any")
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
      .slice(0, 8);

    const cards = matches.map((pattern) => {
      const enough = onHand >= pattern.minYards;
      const additionalSkeins = Math.max(0, Math.ceil((pattern.minYards - onHand) / yarn.yards));
      const availability = enough
        ? "Your amount may work for at least one listed size."
        : `You may need ${additionalSkeins} more skein${additionalSkeins === 1 ? "" : "s"}.`;
      const label = pattern.exact ? "Pattern uses this yarn" : pattern.weight === "Any" ? "Flexible-weight option" : "Compatible by weight";

      return `<article class="pattern" data-yarn-key="${escapeHtml(yarnKey)}">
        ${patternMedia(pattern)}
        <div class="pattern-body">
          <div class="match ${pattern.exact ? "" : "compatible"}">${label}</div>
          <h3>${escapeHtml(pattern.name)}</h3>
          <p>${escapeHtml(pattern.designer)} · ${escapeHtml(pattern.project)} · ${escapeHtml(pattern.weight)}${pattern.gauge ? ` · ${pattern.gauge} sts / 4 in` : ""}<br>
          ${formatNumber(pattern.minYards)}–${formatNumber(pattern.maxYards)} yd · ${pattern.free ? "Free pattern" : "Pattern listing"}<br>${escapeHtml(availability)}</p>
          <a href="${escapeHtml(pattern.url)}" target="_blank" rel="noopener">View on ${escapeHtml(pattern.sourceBrand || "pattern site")} →</a>
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

  function renderBuyEstimate() {
    const yarn = currentYarn();
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

  function renderAll() {
    renderMeta();
    renderProjects();
    renderPatterns();
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
    renderAll();

    $("brandSelect").addEventListener("change", () => {
      populateYarns();
      renderAll();
    });
    $("yarnSelect").addEventListener("change", renderAll);
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
  }

  window.YarnFirst = { brands, baseRanges, patternScore };
  init();
}());
