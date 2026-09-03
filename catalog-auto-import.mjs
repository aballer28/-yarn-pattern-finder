import fs from "node:fs/promises";
import vm from "node:vm";

const mode = String(process.argv[2] || "patterns").toLowerCase();
if (!["patterns", "yarns", "both"].includes(mode)) {
  throw new Error("Usage: node scripts/catalog-auto-import.mjs patterns|yarns|both");
}

const FILES = {
  yarns: [
    "catalog.js", "kfi-catalog.js", "knit-picks-yarns.js",
    "yarn-image-catalog.js", "kelbourne-family-yarns.js",
    "berroco-family-safe.js", "auto-yarns.js"
  ],
  patterns: [
    "kfi-pattern-index.js", "novelty-pattern-catalog.js",
    "external-pattern-catalog.js", "knit-picks-catalog.js",
    "kelbourne-family-patterns.js", "berroco-family-safe.js",
    "auto-patterns.js"
  ]
};

const YARN_ARRAYS = [
  "YARN_CATALOG", "KFI_YARN_CATALOG", "KNIT_PICKS_YARN_CATALOG",
  "YARN_IMAGE_CATALOG", "KELBOURNE_FAMILY_YARN_CATALOG",
  "BERROCO_FAMILY_YARN_CATALOG", "AUTO_YARN_CATALOG"
];

const PATTERN_ARRAYS = [
  "PATTERN_CATALOG", "EXTERNAL_PATTERN_CATALOG", "KNIT_PICKS_PATTERN_CATALOG",
  "KELBOURNE_FAMILY_PATTERN_CATALOG", "BERROCO_FAMILY_PATTERN_CATALOG",
  "AUTO_PATTERN_CATALOG"
];

const BRAND_BY_DOMAIN = {
  "kelbournewoolens.com": "Kelbourne Woolens",
  "www.kelbournewoolens.com": "Kelbourne Woolens",
  "berroco.com": "Berroco",
  "www.berroco.com": "Berroco",
  "www.knitpicks.com": "Knit Picks",
  "knitpicks.com": "Knit Picks",
  "www.lionbrand.com": "Lion Brand",
  "lionbrand.com": "Lion Brand",
  "www.koigu.com": "Koigu",
  "koigu.com": "Koigu",
  "www.plymouthyarn.com": "Plymouth Yarn",
  "plymouthyarn.com": "Plymouth Yarn",
  "www.cascadeyarns.com": "Cascade Yarns",
  "cascadeyarns.com": "Cascade Yarns",
  "www.yarnspirations.com": "Yarnspirations",
  "yarnspirations.com": "Yarnspirations",
  "knittingfever.com": "Knitting Fever",
  "www.knittingfever.com": "Knitting Fever",
  "malabrigoyarn.com": "Malabrigo",
  "www.malabrigoyarn.com": "Malabrigo",
  "istex.is": "Ístex",
  "www.istex.is": "Ístex",
  "www.garnstudio.com": "DROPS",
  "garnstudio.com": "DROPS"
};

const REQUEST_HEADERS = {
  "user-agent": "Garn-Swatch-Catalog-Updater/1.0 (+catalog maintenance)",
  "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function norm(value) {
  return String(value || "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function canonicalUrl(raw) {
  try {
    const url = new URL(String(raw));
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid|ref$|source$)/i.test(key)) url.searchParams.delete(key);
    }
    return url.toString();
  } catch {
    return "";
  }
}

function domainOf(raw) {
  try { return new URL(raw).hostname.toLowerCase(); }
  catch { return ""; }
}

function htmlDecode(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripHtml(value) {
  return htmlDecode(String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim());
}

async function fetchText(url, { timeout = 18000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: REQUEST_HEADERS
    });
    return {
      ok: res.ok,
      status: res.status,
      url: res.url,
      text: await res.text()
    };
  } catch (error) {
    return { ok: false, status: 0, url, text: "", error: String(error?.name || error) };
  } finally {
    clearTimeout(timer);
  }
}

async function loadWindow(files) {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  for (const file of files) {
    try {
      const code = await fs.readFile(file, "utf8");
      vm.runInContext(code, sandbox, { filename: file, timeout: 30000 });
    } catch (error) {
      console.warn(`Skipped ${file}: ${error.message}`);
    }
  }
  return sandbox.window;
}

function flattenYarns(win) {
  const out = [];
  for (const key of YARN_ARRAYS) {
    const list = win[key];
    if (Array.isArray(list)) out.push(...list.filter((x) => x && typeof x === "object" && !Array.isArray(x)));
  }
  return out;
}

function flattenPatterns(win) {
  const out = [];
  for (const key of PATTERN_ARRAYS) {
    const list = win[key];
    if (Array.isArray(list)) out.push(...list.filter((x) => x && typeof x === "object" && !Array.isArray(x)));
  }

  if (Array.isArray(win.KFI_PATTERN_INDEX)) {
    for (const row of win.KFI_PATTERN_INDEX) {
      if (!Array.isArray(row)) continue;
      const [id, name, image, url, usedYarns] = row;
      out.push({ sourceId: `kfi:${id}`, name, image, url, usedYarns: usedYarns || [] });
    }
  }

  if (Array.isArray(win.NOVELTY_PATTERN_CATALOG)) {
    for (const row of win.NOVELTY_PATTERN_CATALOG) {
      if (!Array.isArray(row)) continue;
      const [id, name, image, url, brand] = row;
      out.push({ sourceId: `novelty:${id}`, name, image, url, sourceBrand: brand });
    }
  }
  return out;
}

function seedUrls(items, kind) {
  const urls = [];
  for (const item of items) {
    const candidates = kind === "yarns"
      ? [item.sourceUrl, item.url]
      : [item.url, item.ravelryUrl, item.sourceUrl];
    for (const raw of candidates) {
      const url = canonicalUrl(raw);
      if (!url) continue;
      const host = domainOf(url);
      if (!host || /ravelry(cache)?\.com$/i.test(host)) continue;
      if (/images|cdn|cloudfront/i.test(host)) continue;
      urls.push(url);
    }
  }
  return [...new Set(urls)];
}

function sitemapCandidates(origin) {
  return [
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
    `${origin}/sitemap-index.xml`
  ];
}

function parseSitemap(xml) {
  const urls = [];
  const locs = [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map((m) => htmlDecode(m[1].trim()));
  const lastmods = [...xml.matchAll(/<url>[\s\S]*?<loc>\s*([^<]+)\s*<\/loc>[\s\S]*?(?:<lastmod>\s*([^<]+)\s*<\/lastmod>)?[\s\S]*?<\/url>/gi)]
    .map((m) => ({ url: htmlDecode(m[1].trim()), lastmod: (m[2] || "").trim() }));
  if (lastmods.length) return { pages: lastmods, childSitemaps: [] };
  for (const loc of locs) {
    if (/\.xml(?:\.gz)?(?:\?|$)/i.test(loc)) urls.push(loc);
  }
  return { pages: [], childSitemaps: urls };
}

async function discoverSitemapPages(origin) {
  const queue = [...sitemapCandidates(origin)];
  const seenMaps = new Set();
  const pages = new Map();

  // robots.txt can advertise additional sitemaps.
  const robots = await fetchText(`${origin}/robots.txt`, { timeout: 10000 });
  if (robots.ok) {
    for (const m of robots.text.matchAll(/^\s*Sitemap:\s*(\S+)/gim)) queue.push(m[1]);
  }

  while (queue.length && seenMaps.size < 40) {
    const mapUrl = queue.shift();
    if (seenMaps.has(mapUrl)) continue;
    seenMaps.add(mapUrl);

    const res = await fetchText(mapUrl, { timeout: 15000 });
    if (!res.ok || !/<(?:urlset|sitemapindex)\b/i.test(res.text)) continue;

    const parsed = parseSitemap(res.text);
    for (const child of parsed.childSitemaps) {
      if (!seenMaps.has(child)) queue.push(child);
    }
    for (const page of parsed.pages) {
      const url = canonicalUrl(page.url);
      if (url) pages.set(url, page.lastmod || "");
    }
  }
  return [...pages].map(([url, lastmod]) => ({ url, lastmod }));
}

function pathHints(existingUrls, kind) {
  const counts = new Map();
  for (const raw of existingUrls) {
    try {
      const parts = new URL(raw).pathname.split("/").filter(Boolean);
      for (let i = 0; i < Math.min(parts.length, 2); i++) {
        const part = parts[i].toLowerCase();
        if (part.length >= 3) counts.set(part, (counts.get(part) || 0) + 1);
      }
    } catch {}
  }
  const common = [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([token]) => token);

  if (kind === "patterns") common.push("pattern", "patterns", "design", "designs");
  else common.push("yarn", "yarns");
  return [...new Set(common)];
}

function candidatePage(page, hints, sinceIso, knownUrls) {
  if (knownUrls.has(page.url)) return false;
  if (/\.(?:jpg|jpeg|png|gif|webp|svg|pdf|zip)(?:\?|$)/i.test(page.url)) return false;

  const path = (() => {
    try { return new URL(page.url).pathname.toLowerCase(); } catch { return ""; }
  })();
  if (!hints.some((hint) => path.includes(`/${hint}`) || path.includes(`${hint}-`) || path.includes(`-${hint}`))) {
    return false;
  }

  if (sinceIso && page.lastmod) {
    const since = Date.parse(sinceIso);
    const modified = Date.parse(page.lastmod);
    if (Number.isFinite(since) && Number.isFinite(modified) && modified < since - 86400000) {
      return false;
    }
  }
  return true;
}

function extractJsonLd(html) {
  const objects = [];
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(m[1].trim());
      const stack = Array.isArray(parsed) ? [...parsed] : [parsed];
      while (stack.length) {
        const value = stack.shift();
        if (!value || typeof value !== "object") continue;
        objects.push(value);
        if (Array.isArray(value["@graph"])) stack.push(...value["@graph"]);
        if (Array.isArray(value.itemListElement)) {
          for (const item of value.itemListElement) {
            if (item?.item) stack.push(item.item);
            else stack.push(item);
          }
        }
      }
    } catch {}
  }
  return objects;
}

function meta(html, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, "i")
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return htmlDecode(m[1]);
  }
  return "";
}

function pageTitle(html) {
  return meta(html, "og:title")
    || htmlDecode((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "")
      .replace(/\s+/g, " ").trim();
}

function firstImage(value) {
  if (Array.isArray(value)) return firstImage(value[0]);
  if (value && typeof value === "object") return value.url || value.contentUrl || "";
  return String(value || "");
}

function brandName(value, fallbackDomain) {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object") return String(value.name || "").trim();
  return BRAND_BY_DOMAIN[fallbackDomain] || "";
}

function numberFrom(re, text) {
  const m = text.match(re);
  return m ? Number(String(m[1]).replace(",", ".")) : null;
}

function inferWeight(text) {
  const weights = [
    ["Jumbo", /\bjumbo\b/i],
    ["Super Bulky", /\bsuper\s*bulky\b|\b6\s*super bulky\b/i],
    ["Bulky", /\bbulky\b|\bchunky\b/i],
    ["Aran", /\baran\b/i],
    ["Worsted", /\bworsted\b/i],
    ["DK", /\bDK\b|\bdouble knitting\b/i],
    ["Sport", /\bsport(?:weight)?\b/i],
    ["Fingering", /\bfingering\b|\bsock weight\b/i],
    ["Lace", /\blace(?:weight)?\b/i]
  ];
  for (const [label, re] of weights) if (re.test(text)) return label;
  return "";
}

function inferYarnDetails(text) {
  const yards = numberFrom(/(\d+(?:[.,]\d+)?)\s*(?:yards?|yds?\b)/i, text);
  const meters = numberFrom(/(\d+(?:[.,]\d+)?)\s*(?:meters?|metres?|\bm\b)/i, text);
  const grams = numberFrom(/(\d+(?:[.,]\d+)?)\s*(?:grams?|\bg\b)/i, text);
  const ounces = numberFrom(/(\d+(?:[.,]\d+)?)\s*(?:ounces?|\boz\b)/i, text);
  const stitches = text.match(/(\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(\d+(?:\.\d+)?)\s*(?:sts?|stitches?)/i)
    || text.match(/(\d+(?:\.\d+)?)\s*(?:sts?|stitches?)\s*(?:\/|per)\s*4\s*(?:in|inch)/i);

  return {
    yards: yards || (meters ? Math.round(meters * 1.09361) : null),
    meters: meters || (yards ? Math.round(yards * 0.9144) : null),
    grams: grams || (ounces ? Math.round(ounces * 28.3495) : null),
    weight: inferWeight(text),
    knitGauge: stitches
      ? [Number(stitches[1]), Number(stitches[2] || stitches[1])]
      : null
  };
}

function looksLikeYarn(url, title, text) {
  const hay = `${url} ${title} ${text.slice(0, 5000)}`.toLowerCase();
  if (/\b(pattern|kit|book|needle|hook)\b/.test(title.toLowerCase()) && !/\byarn\b/.test(title.toLowerCase())) return false;
  const score =
    (/\byarn\b/.test(hay) ? 2 : 0) +
    (/\b(?:yards?|meters?|metres?)\b/.test(hay) ? 1 : 0) +
    (/\b(?:grams?|ounces?|skein|hank)\b/.test(hay) ? 1 : 0) +
    (/\b(?:fingering|sport|dk|worsted|aran|bulky|lace)\b/.test(hay) ? 1 : 0);
  return score >= 3;
}

function looksLikePattern(url, title, text) {
  const hay = `${url} ${title} ${text.slice(0, 5000)}`.toLowerCase();
  const score =
    (/\bpattern\b/.test(hay) ? 2 : 0) +
    (/\/design\//.test(url.toLowerCase()) ? 1 : 0) +
    (/\b(knit|knitting|crochet)\b/.test(hay) ? 1 : 0) +
    (/\b(gauge|needle|hook|sizes?)\b/.test(hay) ? 1 : 0);
  return score >= 3;
}

function cleanName(name) {
  return String(name || "")
    .replace(/\s*[|–—-]\s*(?:Kelbourne Woolens|Berroco|Knit Picks|Lion Brand|Koigu|Cascade Yarns|Plymouth Yarn).*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractYarn(url, html) {
  const host = domainOf(url);
  const ld = extractJsonLd(html);
  const product = ld.find((x) => {
    const type = x["@type"];
    return type === "Product" || (Array.isArray(type) && type.includes("Product"));
  }) || {};

  const title = cleanName(product.name || pageTitle(html));
  const description = stripHtml(product.description || meta(html, "description") || html);
  if (!title || !looksLikeYarn(url, title, description)) return null;

  const details = inferYarnDetails(description);
  const brand = brandName(product.brand, host) || BRAND_BY_DOMAIN[host] || host;
  const image = firstImage(product.image) || meta(html, "og:image");

  return {
    brand,
    name: title.replace(/\s+yarn$/i, "").trim(),
    weight: details.weight || "",
    yards: details.yards,
    meters: details.meters,
    grams: details.grams,
    knitGauge: details.knitGauge,
    crochetGauge: null,
    fiber: "",
    image,
    sourceUrl: canonicalUrl(url),
    discontinued: /\b(discontinued|no longer (?:made|available|produced))\b/i.test(description),
    autoImported: true
  };
}

function inferCraft(text) {
  const hasCrochet = /\bcrochet\b/i.test(text);
  const hasKnit = /\bknit(?:ting)?\b/i.test(text);
  if (hasCrochet && !hasKnit) return "crochet";
  return "knit";
}

function inferProject(text) {
  const types = [
    ["Hat", /\b(hat|beanie|cap)\b/i],
    ["Sweater", /\b(sweater|pullover|cardigan|vest)\b/i],
    ["Scarf", /\b(scarf|cowl|shawl|wrap)\b/i],
    ["Mittens", /\b(mitten|glove|fingerless)\b/i],
    ["Socks", /\bsocks?\b/i],
    ["Blanket", /\b(blanket|afghan|throw)\b/i]
  ];
  for (const [label, re] of types) if (re.test(text)) return label;
  return "Other";
}

function extractPattern(url, html) {
  const host = domainOf(url);
  const ld = extractJsonLd(html);
  const product = ld.find((x) => {
    const type = x["@type"];
    return type === "Product" || type === "CreativeWork"
      || (Array.isArray(type) && (type.includes("Product") || type.includes("CreativeWork")));
  }) || {};

  const title = cleanName(product.name || pageTitle(html));
  const description = stripHtml(product.description || meta(html, "description") || html);
  if (!title || !looksLikePattern(url, title, description)) return null;

  const brand = brandName(product.brand, host) || BRAND_BY_DOMAIN[host] || host;
  const image = firstImage(product.image) || meta(html, "og:image");
  const directRavelry = canonicalUrl(
    (html.match(/https:\/\/(?:www\.)?ravelry\.com\/patterns\/library\/[^"' <]+/i) || [])[0] || ""
  );

  return {
    sourceId: `auto:${norm(host)}:${norm(title)}`,
    name: title.replace(/\s+pattern$/i, "").trim(),
    designer: brand,
    craft: inferCraft(description),
    project: inferProject(`${title} ${description}`),
    weight: inferWeight(description),
    image,
    url: canonicalUrl(url),
    ravelryUrl: directRavelry,
    sourceBrand: brand,
    brands: [brand],
    usedYarns: [],
    autoImported: true
  };
}

function yarnKey(y) {
  return `${norm(y.brand)}|${norm(y.name)}`;
}
function patternKey(p) {
  const rav = String(p.ravelryUrl || p.url || "").match(/ravelry\.com\/patterns\/library\/([^/?#]+)/i);
  if (rav) return `ravelry:${norm(rav[1])}`;
  return `${norm(p.name)}|${norm(p.designer || p.sourceBrand)}|${norm(p.craft)}`;
}

async function readState() {
  try { return JSON.parse(await fs.readFile("catalog-auto-state.json", "utf8")); }
  catch {
    return { lastPatternRun: null, lastYarnRun: null, knownPatternUrls: [], knownYarnUrls: [], missingYarnChecks: {} };
  }
}

async function readAutoChanges() {
  return {
    yarns: { added: [], updated: [], discontinued: [], checkedAt: null },
    patterns: { added: [], updated: [], checkedAt: null }
  };
}

async function crawl(kind, existing, state) {
  const existingUrls = seedUrls(existing, kind);
  const knownUrls = new Set([
    ...existingUrls,
    ...((kind === "patterns" ? state.knownPatternUrls : state.knownYarnUrls) || [])
  ]);

  const byDomain = new Map();
  for (const url of existingUrls) {
    const host = domainOf(url);
    if (!host) continue;
    if (!byDomain.has(host)) byDomain.set(host, []);
    byDomain.get(host).push(url);
  }

  const since = kind === "patterns" ? state.lastPatternRun : state.lastYarnRun;
  const allCandidates = [];

  for (const [host, domainUrls] of byDomain) {
    const origin = `https://${host}`;
    const pages = await discoverSitemapPages(origin);
    if (!pages.length) continue;

    const hints = pathHints(domainUrls, kind);
    const selected = pages
      .filter((page) => candidatePage(page, hints, since, knownUrls))
      .slice(0, kind === "patterns" ? 400 : 600);

    for (const page of selected) allCandidates.push(page.url);
  }

  const unique = [...new Set(allCandidates)];
  const found = [];

  // Keep requests polite and bounded; new/modified sitemap pages are checked in small batches.
  for (let i = 0; i < unique.length; i++) {
    const url = unique[i];
    const res = await fetchText(url);
    if (!res.ok) continue;

    const item = kind === "patterns"
      ? extractPattern(res.url || url, res.text)
      : extractYarn(res.url || url, res.text);

    if (item) found.push(item);
    if (i % 12 === 11) await sleep(350);
  }

  return { found, discoveredUrls: unique };
}

async function auditDiscontinued(existingYarns, autoYarns, state, changes) {
  const autoByKey = new Map(autoYarns.map((y) => [yarnKey(y), y]));
  const missing = state.missingYarnChecks || {};

  // Only inspect direct manufacturer/source URLs, and never delete.
  const candidates = existingYarns
    .filter((y) => y?.sourceUrl && !/ravelry\.com/i.test(y.sourceUrl))
    .slice(0, 1200);

  for (let i = 0; i < candidates.length; i++) {
    const yarn = candidates[i];
    const url = canonicalUrl(yarn.sourceUrl);
    if (!url) continue;

    const res = await fetchText(url, { timeout: 14000 });
    let explicit = false;

    if (res.status === 404 || res.status === 410) {
      missing[url] = (missing[url] || 0) + 1;
      // Require two monthly misses before marking discontinued.
      explicit = missing[url] >= 2;
    } else if (res.ok) {
      missing[url] = 0;
      const plain = stripHtml(res.text).slice(0, 20000);
      explicit = /\b(discontinued|no longer (?:made|available|produced))\b/i.test(plain);
    }

    if (explicit && !yarn.discontinued) {
      const key = yarnKey(yarn);
      const overlay = {
        ...(autoByKey.get(key) || {}),
        brand: yarn.brand,
        name: yarn.name,
        sourceUrl: url,
        discontinued: true,
        status: "Discontinued",
        autoImported: true
      };
      autoByKey.set(key, overlay);
      changes.yarns.discontinued.push(`${yarn.brand} — ${yarn.name}`);
    }

    if (i % 15 === 14) await sleep(300);
  }

  state.missingYarnChecks = missing;
  return [...autoByKey.values()];
}

function mergeNew(existing, autoExisting, discovered, keyFn, changeBucket) {
  const curatedKeys = new Set(existing.map(keyFn));
  const autoMap = new Map(autoExisting.map((item) => [keyFn(item), item]));

  for (const item of discovered) {
    const key = keyFn(item);
    if (!key) continue;

    if (!curatedKeys.has(key) && !autoMap.has(key)) {
      autoMap.set(key, item);
      changeBucket.added.push(item.name);
    } else if (autoMap.has(key)) {
      const before = JSON.stringify(autoMap.get(key));
      const merged = { ...autoMap.get(key), ...item };
      autoMap.set(key, merged);
      if (JSON.stringify(merged) !== before) changeBucket.updated.push(item.name);
    }
  }
  return [...autoMap.values()];
}

function toWindowFile(variable, value, comment) {
  return `(function () {
  "use strict";
  ${comment}
  window.${variable} = ${JSON.stringify(value, null, 2)};
})();
`;
}

const state = await readState();
const changes = await readAutoChanges();
const now = new Date().toISOString();

if (mode === "patterns" || mode === "both") {
  const win = await loadWindow(FILES.patterns);
  const existing = flattenPatterns(win);
  const autoExisting = Array.isArray(win.AUTO_PATTERN_CATALOG) ? win.AUTO_PATTERN_CATALOG : [];

  const { found, discoveredUrls } = await crawl("patterns", existing, state);
  const autoPatterns = mergeNew(existing.filter((p) => !p.autoImported), autoExisting, found, patternKey, changes.patterns);

  await fs.writeFile(
    "auto-patterns.js",
    toWindowFile("AUTO_PATTERN_CATALOG", autoPatterns, "// Daily auto-imported pattern overlay.")
  );

  state.knownPatternUrls = [...new Set([...(state.knownPatternUrls || []), ...discoveredUrls])].slice(-20000);
  state.lastPatternRun = now;
  changes.patterns.checkedAt = now;
}

if (mode === "yarns" || mode === "both") {
  const win = await loadWindow(FILES.yarns);
  const existing = flattenYarns(win);
  const curated = existing.filter((y) => !y.autoImported);
  const autoExisting = Array.isArray(win.AUTO_YARN_CATALOG) ? win.AUTO_YARN_CATALOG : [];

  const { found, discoveredUrls } = await crawl("yarns", existing, state);
  let autoYarns = mergeNew(curated, autoExisting, found, yarnKey, changes.yarns);

  // Preserve every old yarn. Only add a Discontinued overlay after a confirmed status
  // or two consecutive monthly 404/410 checks.
  autoYarns = await auditDiscontinued(curated, autoYarns, state, changes);

  await fs.writeFile(
    "auto-yarns.js",
    toWindowFile("AUTO_YARN_CATALOG", autoYarns, "// Monthly auto-imported yarn overlay. Discontinued yarns are retained.")
  );

  state.knownYarnUrls = [...new Set([...(state.knownYarnUrls || []), ...discoveredUrls])].slice(-20000);
  state.lastYarnRun = now;
  changes.yarns.checkedAt = now;
}

await fs.writeFile("catalog-auto-state.json", JSON.stringify(state, null, 2) + "\n");

const changeJs = `(function () {
  "use strict";
  window.GARN_SWATCH_AUTO_CHANGES = ${JSON.stringify(changes, null, 2)};
})();
`;
await fs.writeFile("catalog-auto-changes.js", changeJs);

console.log(JSON.stringify({
  mode,
  patternChanges: changes.patterns,
  yarnChanges: changes.yarns
}, null, 2));
