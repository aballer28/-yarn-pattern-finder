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
      item.url ||
      item.patternUrl ||
      item.ravelryUrl ||
      ""
    );
  }

  function setExactImage(item, kind) {
    if (!item || typeof item !== "object") return;

    // Fix known problem brands first, even if a bad image was already present.
    if (exactSpecialCase(item)) return;

    // Keep existing direct images.
    if (validImage(item.image)) return;

    // Remove old generic Microlink fallback.
    if (/api\.microlink\.io/i.test(String(item.image || ""))) {
      delete item.image;
    }

    const page = pageFor(item);
    const name = item.name || item.displayName || item.title || "";

    if (!validPage(page) || !name) return;

    item.image =
      "/api/yarn-image?url=" +
      encodeURIComponent(page) +
      "&name=" +
      encodeURIComponent(name) +
      "&kind=" +
      encodeURIComponent(kind);
  }



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
