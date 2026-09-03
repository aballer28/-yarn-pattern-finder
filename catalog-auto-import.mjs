import fs from "node:fs/promises";
import vm from "node:vm";

const mode = String(process.argv[2] || "patterns").toLowerCase();
const fullRun = process.argv.includes("--full");
if (!["patterns", "yarns", "both"].includes(mode)) {
  throw new Error("Usage: node catalog-auto-import.mjs patterns|yarns|both");
}

const CATALOG_FILES = [
  "catalog.js",
  "kfi-catalog.js",
  "knit-picks-yarns.js",
  "yarn-image-catalog.js",
  "koigu-yarn-update.js",
  "kelbourne-family-yarns.js",
  "kelbourne-family-patterns.js",
  "berroco-family-catalog.js",
  "berroco-pattern-bridge.js",
  "berroco-family-safe.js",
  "quince-family-catalog.js",
  "luca-s-catalog.js",
  "lise-tailor-catalog.js",
  "uk-alpaca-catalog.js",
  "vobelle-catalog.js",
  "atlantic-coast-catalog.js",
  "wollbiene-catalog.js",
  "knitting-for-olive-catalog.js",
  "bettaknit-catalog.js",
  "wool-couture-catalog.js",
  "purl-soho-catalog.js",
  "lion-brand-catalog.js",
  "drops-catalog.js",
  "mainstays-catalog.js",
  "michaels-joann-catalog.js",
  "yarnspirations-catalog.js",
  "kfi-pattern-index.js",
  "novelty-pattern-catalog.js",
  "external-pattern-catalog.js",
  "knit-picks-catalog.js",
  "auto-yarns.js",
  "auto-patterns.js",
  "catalog-integration.js",
  "catalog-audit-repair.js"
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
  "garnstudio.com": "DROPS",
  "lisetailor.com": "Lise Tailor",
  "www.lisetailor.com": "Lise Tailor",
  "ukalpaca.com": "UK Alpaca",
  "www.ukalpaca.com": "UK Alpaca",
  "quinceandco.com": "Quince & Co.",
  "www.quinceandco.com": "Quince & Co.",
  "knittingforolive.com": "Knitting for Olive",
  "www.knittingforolive.com": "Knitting for Olive",
  "bettaknit.com": "Bettaknit",
  "www.bettaknit.com": "Bettaknit",
  "purlsoho.com": "Purl Soho",
  "www.purlsoho.com": "Purl Soho",
  "woolcouturecompany.com": "Wool Couture",
  "www.woolcouturecompany.com": "Wool Couture",
  "bcgarn.com": "BC Garn",
  "www.bcgarn.com": "BC Garn",
  "wollbiene-shop.de": "Wollbiene",
  "www.wollbiene-shop.de": "Wollbiene"
};

const REQUEST_HEADERS = {
  "user-agent": "Garn-Swatch-Catalog-Updater/1.0 (+catalog maintenance)",
  "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
};

// Some official brand sites intentionally hand product/design links to a parent
// company or sibling shop domain. These are verified first-party handoffs, not
// arbitrary cross-site crawling. Direct PDFs linked by an official seed page are
// also allowed because many manufacturers host pattern files on a CDN.
const OFFICIAL_HANDOFFS = new Map([
  ["bcgarn.com", new Set(["schmeichelgarne.de", "www.schmeichelgarne.de"])],
  ["www.bcgarn.com", new Set(["schmeichelgarne.de", "www.schmeichelgarne.de"])],
  ["koigu.com", new Set(["koigustudio.com", "www.koigustudio.com", "shop.koigustudio.com"])],
  ["www.koigu.com", new Set(["koigustudio.com", "www.koigustudio.com", "shop.koigustudio.com"])]
]);

function officialLinkedUrl(seedUrl, candidateUrl) {
  try {
    const seed = new URL(seedUrl);
    const candidate = new URL(candidateUrl);
    if (candidate.origin === seed.origin) return true;
    if (/\.pdf(?:$|[?#])/i.test(candidate.pathname + candidate.search)) return true;
    const allowed = OFFICIAL_HANDOFFS.get(seed.hostname.toLowerCase());
    return Boolean(allowed && allowed.has(candidate.hostname.toLowerCase()));
  } catch {
    return false;
  }
}

// Explicit official-source seeds prevent a brand with zero existing pattern records
// from becoming permanently invisible to the automatic importer.
const SOURCE_SEEDS = {
  patterns: [
    ["Knitting Fever", "https://knittingfever.com/pattern-finder"],
    ["Koigu", "https://www.koigu.com/"],
    ["Koigu", "https://www.koigu.com/books"],
    ["BC Garn", "https://www.bcgarn.com/"],
    ["Lise Tailor", "https://lisetailor.com/en/collections/patrons-de-tricot"],
    ["Lise Tailor", "https://lisetailor.com/en/collections/kit-tricot"],
    ["Luca-S", "https://www.luca-s.com/collections/knitting-patterns"],
    ["UK Alpaca", "https://www.ukalpaca.com/products/knitting-patterns/"],
    ["UK Alpaca", "https://www.ukalpaca.com/products/knitting-patterns/4-ply-knitting-patterns/"],
    ["Quince & Co.", "https://quinceandco.com/collections/patterns"],
    ["Kelbourne Woolens", "https://kelbournewoolens.com/collections/kelbourne-woolens-knitting-and-crochet-patterns"],
    ["Knitting for Olive", "https://knittingforolive.com/collections/patterns"],
    ["Knitting for Olive", "https://knittingforolive.com/collections/all-patterns"],
    ["Wool Couture", "https://www.woolcouturecompany.com/collections/knitting-patterns"],
    ["Bettaknit", "https://www.bettaknit.com/collections/patterns"],
    ["Purl Soho", "https://www.purlsoho.com/collections/patterns-books-patterns"],
    ["Purl Soho", "https://www.purlsoho.com/collections/patterns-books-knitting"],
    ["Purl Soho", "https://www.purlsoho.com/collections/patterns-books"],
    ["Lion Brand", "https://www.lionbrand.com/collections/all-knit-crochet-patterns"],
    ["Yarnspirations", "https://www.yarnspirations.com/collections/patterns"],
    ["Berroco", "https://berroco.com/patterns"],
    ["DROPS", "https://www.garnstudio.com/search.php?action=browse&lang=en"],
    ["Plymouth Yarn", "https://www.plymouthyarn.com/patterns"],
    ["Cascade Yarns", "https://www.cascadeyarns.com/patterns"],
    ["Malabrigo", "https://malabrigoyarn.com/patterns"],
    ["Knit Picks", "https://www.knitpicks.com/patterns/knitting-patterns/c/300201"]
  ],
  yarns: [
    ["Knitting Fever", "https://knittingfever.com/"],
    ["Koigu", "https://www.koigu.com/"],
    ["BC Garn", "https://www.bcgarn.com/"],
    ["Lise Tailor", "https://lisetailor.com/en/pages/nos-laines"],
    ["Luca-S", "https://www.luca-s.com/collections/yarn"],
    ["UK Alpaca", "https://www.ukalpaca.com/"],
    ["UK Alpaca", "https://www.ukalpaca.com/shop/"],
    ["Quince & Co.", "https://quinceandco.com/collections/yarn"],
    ["Kelbourne Woolens", "https://kelbournewoolens.com/collections/yarn"],
    ["Knitting for Olive", "https://knittingforolive.com/collections/yarn"],
    ["Wool Couture", "https://www.woolcouturecompany.com/collections/yarn"],
    ["Bettaknit", "https://www.bettaknit.com/collections/yarns"],
    ["Purl Soho", "https://www.purlsoho.com/collections/yarn"],
    ["Lion Brand", "https://www.lionbrand.com/collections/all-knitting-crochet-yarn"],
    ["Yarnspirations", "https://www.yarnspirations.com/collections/yarn"],
    ["Berroco", "https://berroco.com/yarn/"],
    ["DROPS", "https://www.garnstudio.com/yarns.php?cid=19"],
    ["Plymouth Yarn", "https://www.plymouthyarn.com/yarn"],
    ["Cascade Yarns", "https://www.cascadeyarns.com/yarns"],
    ["Malabrigo", "https://malabrigoyarn.com/yarns"],
    ["Knit Picks", "https://www.knitpicks.com/yarn"]
  ]
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function mapPool(values, limit, worker) {
  const results = new Array(values.length);
  let next = 0;
  async function run() {
    while (true) {
      const index = next++;
      if (index >= values.length) return;
      results[index] = await worker(values[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, values.length || 1) }, run));
  return results;
}

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

function catalogYarnRecord(item) {
  return item && typeof item === "object" && !Array.isArray(item)
    && item.brand && item.name
    && !(item.usedYarns || item.designer || item.patternUrl || item.pdfUrl)
    && Boolean(item.weight || item.cycWeight || item.yards || item.meters || item.grams || item.fiber || item.fiberFamily || item.knitGauge || item.crochetGauge || item.needleSize || item.hookSize || item.status || item.catalogOnly || item.sourceUrl);
}

function catalogPatternRecord(item) {
  return item && typeof item === "object" && !Array.isArray(item)
    && item.name
    && Boolean(item.usedYarns || item.craft || item.project || item.designer || item.patternUrl || item.pdfUrl || item.skillLevel || item.free === true || item.ravelryUrl);
}

function flattenYarns(win) {
  const out = [];
  for (const [key, list] of Object.entries(win)) {
    if (!/YARN/i.test(key) || !Array.isArray(list)) continue;
    for (const item of list) if (catalogYarnRecord(item)) out.push(item);
  }
  return out;
}

function flattenPatterns(win) {
  const out = [];
  for (const [key, list] of Object.entries(win)) {
    if (!/PATTERN/i.test(key) || !Array.isArray(list)) continue;
    for (const item of list) if (catalogPatternRecord(item)) out.push(item);
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

function extractYarn(url, html, brandHint = "") {
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
  const brand = brandName(product.brand, host) || brandHint || BRAND_BY_DOMAIN[host] || host;
  const image = firstImage(product.image) || meta(html, "og:image");

  const publishedKnitGauge = inferYarnPublishedGauge(description, "knit");
  const publishedCrochetGauge = inferYarnPublishedGauge(description, "crochet");
  return {
    brand,
    name: title.replace(/\s+yarn$/i, "").trim(),
    weight: details.weight || "",
    manufacturerWeight: details.weight || "",
    yards: details.yards,
    meters: details.meters,
    grams: details.grams,
    knitGauge: publishedKnitGauge,
    crochetGauge: publishedCrochetGauge,
    publishedGaugeUnclassified: !publishedKnitGauge && !publishedCrochetGauge ? details.knitGauge : null,
    needleSize: inferYarnTool(description, "knit"),
    hookSize: inferYarnTool(description, "crochet"),
    fiber: inferFiber(description),
    image,
    sourceUrl: canonicalUrl(url),
    discontinued: /\b(discontinued|no longer (?:made|available|produced))\b/i.test(description),
    autoImported: true
  };
}

function inferCraft(text, title = "") {
  const titleText = String(title || "");
  if (/\b(crochet|crocheted|amigurumi|granny)\b/i.test(titleText)) return "crochet";
  if (/\b(knit|knitting|knitted)\b/i.test(titleText)) return "knit";
  const hasCrochet = /\bcrochet(?:ed|ing)?\b/i.test(text);
  const hasKnit = /\bknit(?:ted|ting)?\b/i.test(text);
  if (hasCrochet && !hasKnit) return "crochet";
  if (hasKnit && !hasCrochet) return "knit";
  return "unknown";
}

function inferProject(text) {
  const types = [
    ["Hat", /\b(hat|beanie|cap|tam|beret)\b/i],
    ["Cowl", /\b(cowl|snood)\b/i],
    ["Shawl", /\b(shawl|wrap|stole)\b/i],
    ["Scarf", /\bscarf\b/i],
    ["Mittens", /\b(mitten|mitts?|glove|fingerless)\b/i],
    ["Socks", /\bsocks?\b/i],
    ["Stocking", /\bstocking\b/i],
    ["Blanket", /\b(blanket|afghan|throw)\b/i],
    ["Baby", /\b(baby|infant|layette|romper)\b/i],
    ["Sweater", /\b(sweater|pullover|cardigan|vest|tee|top|tunic|dress)\b/i]
  ];
  for (const [label, re] of types) if (re.test(text)) return label;
  return "Other";
}

function inferProjectType(text) {
  const types = [
    ["Cardigan", /\bcardigan\b/i], ["Pullover", /\b(pullover|sweater|jumper)\b/i],
    ["Vest", /\bvest\b/i], ["Top", /\b(tee|top|tank|camisole)\b/i], ["Dress", /\bdress\b/i],
    ["Hat", /\b(hat|beanie|cap|tam|beret)\b/i], ["Cowl", /\bcowl\b/i], ["Shawl", /\b(shawl|wrap|stole)\b/i],
    ["Scarf", /\bscarf\b/i], ["Mittens", /\b(mitten|mitts?|glove)\b/i], ["Socks", /\bsocks?\b/i],
    ["Blanket", /\b(blanket|afghan|throw)\b/i], ["Toy", /\b(toy|amigurumi|doll|animal)\b/i], ["Home", /\b(pillow|cushion|basket|dishcloth|towel)\b/i]
  ];
  for (const [label, re] of types) if (re.test(text)) return label;
  return "Other";
}

function inferPatternGauge(text) {
  const plain = String(text || "").replace(/\s+/g, " ");

  const patterns = [
    /(\d+(?:\.\d+)?)\s*(?:sts?|stitches?)\s*(?:and|x|×|,)?\s*(?:(\d+(?:\.\d+)?)\s*(?:rows?|rnds?|rounds?)\s*)?(?:=|per|in)\s*(\d+(?:\.\d+)?)\s*(cm|in(?:ches?)?)/i,
    /(\d+(?:\.\d+)?)\s*(?:sts?|stitches?)\s*(?:\/|per)\s*(4)\s*(in(?:ches?)?)/i,
    /(\d+(?:\.\d+)?)\s*(?:sts?|stitches?)\s*(?:\/|per)\s*(10)\s*(cm)/i
  ];

  for (const re of patterns) {
    const match = plain.match(re);
    if (!match) continue;

    const stitches = Number(match[1]);
    let rows = null;
    let measurement = null;
    let unit = "in";

    if (re === patterns[0]) {
      rows = Number(match[2]) || null;
      measurement = Number(match[3]);
      unit = /^cm$/i.test(match[4]) ? "cm" : "in";
    } else {
      measurement = Number(match[2]);
      unit = /^cm$/i.test(match[3]) ? "cm" : "in";
    }

    if (!Number.isFinite(stitches) || !Number.isFinite(measurement) || measurement <= 0) continue;

    const inches = unit === "cm" ? measurement / 2.54 : measurement;
    const normalizedStitches = stitches * (4 / inches);
    const normalizedRows = Number.isFinite(rows) && rows > 0 ? rows * (4 / inches) : null;

    return {
      stitches: Math.round(normalizedStitches * 10) / 10,
      rows: normalizedRows ? Math.round(normalizedRows * 10) / 10 : null,
      measurement: 4,
      original: match[0].trim()
    };
  }

  return null;
}

function inferPatternTool(text, craft) {
  const plain = String(text || "").replace(/\s+/g, " ");
  const label = craft === "crochet" ? "(?:crochet\\s*)?hook" : "(?:knitting\\s*)?needles?";
  const match = plain.match(new RegExp(`${label}[^.;|]{0,80}?((?:US\\s*)?\\d+(?:\\.\\d+)?(?:\\s*[-–]\\s*\\d+(?:\\.\\d+)?)?[^.;|]{0,30}?(?:mm)?)`, "i"));
  return match ? match[1].trim() : "";
}


function inferSkillLevel(text) {
  const match = String(text || "").match(/\b(?:skill\s*level|difficulty)\s*[:\-]?\s*(beginner|easy|intermediate|advanced|experienced|adventurous beginner)\b/i);
  return match ? match[1].replace(/\b\w/g, (c) => c.toUpperCase()) : "";
}

function inferSizesText(text) {
  const plain = String(text || "").replace(/\s+/g, " ");
  const match = plain.match(/\b(?:sizes?|size)\s*[:\-]\s*([^.;]{2,220})/i);
  return match ? match[1].trim() : "";
}

function inferFreeStatus(product, text) {
  const offers = Array.isArray(product?.offers) ? product.offers : (product?.offers ? [product.offers] : []);
  const prices = offers.map((o) => Number(o?.price ?? o?.lowPrice)).filter(Number.isFinite);
  if (prices.length && Math.min(...prices) === 0) return true;
  if (prices.length && Math.min(...prices) > 0) return false;
  if (/\bfree\s+(?:knit(?:ting)?|crochet|pattern|download|pdf)\b/i.test(String(text || ""))) return true;
  return null;
}

function inferFiber(text) {
  const plain = String(text || "").replace(/\s+/g, " ");
  const matches = [...plain.matchAll(/(\d{1,3}(?:\.\d+)?)\s*%\s*([A-Za-z][A-Za-z \-’'&]{1,40})/g)]
    .slice(0, 6)
    .map((m) => `${m[1]}% ${m[2].trim().replace(/\s+(?:and|with|care|weight|gauge|needle|hook).*$/i, "")}`);
  return matches.join(" / ");
}

function inferYarnPublishedGauge(text, craft) {
  const plain = String(text || "").replace(/\s+/g, " ");
  const word = craft === "crochet" ? "crochet" : "(?:knit|knitting)";
  const labeled = plain.match(new RegExp(`${word}[^.;]{0,45}?(\\d+(?:\\.\\d+)?)\\s*(?:-|–|to)?\\s*(\\d+(?:\\.\\d+)?)?\\s*(?:sts?|stitches?)[^.;]{0,25}?(?:4\\s*(?:in|inch)|10\\s*cm)`, "i"));
  if (!labeled) return null;
  const a = Number(labeled[1]); const b = Number(labeled[2] || labeled[1]);
  return Number.isFinite(a) && Number.isFinite(b) ? [Math.min(a,b), Math.max(a,b)] : null;
}

function inferYarnTool(text, craft) {
  const plain = String(text || "").replace(/\s+/g, " ");
  const label = craft === "crochet" ? "(?:crochet\\s*)?hook" : "(?:knitting\\s*)?needles?";
  const match = plain.match(new RegExp(`${label}[^.;]{0,65}?((?:US\\s*)?[A-Z]?[- ]?\\d+(?:\\.\\d+)?(?:\\s*[-–]\\s*[A-Z]?[- ]?\\d+(?:\\.\\d+)?)?[^.;]{0,25}?(?:mm)?)`, "i"));
  return match ? match[1].trim() : "";
}

function inferPublishedDate(product, html) {
  const candidates = [
    product && product.datePublished,
    product && product.releaseDate,
    meta(html, "article:published_time"),
    meta(html, "date")
  ].filter(Boolean);
  for (const value of candidates) {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return new Date(parsed).toISOString();
  }
  return null;
}


function inferUsedYarns(text, referenceYarns, sourceBrand = "") {
  const hay = norm(text);
  if (!hay || !Array.isArray(referenceYarns)) return [];
  const brandNorm = norm(sourceBrand);
  const candidates = referenceYarns
    .filter((y) => y && y.brand && y.name && (!brandNorm || norm(y.brand) === brandNorm || hay.includes(norm(y.brand))))
    .map((y) => ({ y, token: norm(y.name) }))
    .filter((x) => x.token.length >= 3 && hay.includes(x.token))
    .sort((a, b) => b.token.length - a.token.length);
  const chosen = [];
  for (const { y, token } of candidates) {
    if (chosen.some((x) => x.token.includes(token) || token.includes(x.token))) continue;
    chosen.push({ token, ref: `${y.brand}|${y.name}` });
    if (chosen.length >= 6) break;
  }
  return chosen.map((x) => x.ref);
}

function heldTogetherInfo(text) {
  const plain = String(text || "");
  const match = plain.match(/(?:hold|held|holding)\s+(two|2|three|3|four|4)\s+(?:strands?|yarns?)\s+together/i);
  const word = match && String(match[1]).toLowerCase();
  const count = word === "two" ? 2 : word === "three" ? 3 : word === "four" ? 4 : Number(word || 0);
  return { heldTogether: count > 1, strandCount: count > 1 ? count : null };
}

function extractPattern(url, html, brandHint = "", referenceYarns = []) {
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

  const brand = brandName(product.brand, host) || brandHint || BRAND_BY_DOMAIN[host] || host;
  const image = firstImage(product.image) || meta(html, "og:image");
  const directRavelry = canonicalUrl(
    (html.match(/https:\/\/(?:www\.)?ravelry\.com\/patterns\/library\/[^"' <]+/i) || [])[0] || ""
  );

  const craft = inferCraft(description, title);
  const gauge = inferPatternGauge(description);
  const tool = inferPatternTool(description, craft);
  const usedYarns = inferUsedYarns(`${title} ${description}`, referenceYarns, brand);
  const held = heldTogetherInfo(description);

  return {
    sourceId: `auto:${norm(host)}:${norm(title)}`,
    name: title.replace(/\s+pattern$/i, "").trim(),
    designer: brand,
    craft,
    project: inferProject(`${title} ${description}`),
    projectType: inferProjectType(`${title} ${description}`),
    weight: inferWeight(description),
    gauge,
    gaugeOriginal: gauge?.original || "",
    needleSize: craft === "knit" ? tool : "",
    hookSize: craft === "crochet" ? tool : "",
    image,
    url: canonicalUrl(url),
    ravelryUrl: directRavelry,
    sourceBrand: brand,
    brands: [...new Set([brand, ...usedYarns.map((ref) => String(ref).split("|")[0])].filter(Boolean))],
    usedYarns,
    heldTogether: held.heldTogether,
    strandCount: held.strandCount,
    skillLevel: inferSkillLevel(description),
    sizesText: inferSizesText(description),
    free: inferFreeStatus(product, description),
    publishedAt: inferPublishedDate(product, html),
    autoImported: true
  };
}


function extractPatternSections(url, html, brandHint = "", referenceYarns = []) {
  const out = [];
  const host = domainOf(url);
  const headingRe = /<h([1-4])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  const headings = [];
  let match;
  while ((match = headingRe.exec(html))) {
    const title = cleanName(stripHtml(match[2]));
    if (!title || title.length < 3 || title.length > 100) continue;
    headings.push({ title, start: match.index, end: headingRe.lastIndex });
  }
  const ignored = /^(?:patterns?|pattern overview|overview|yarn|materials?|needles?|hooks?|gauge|skill level|sizes?|measurements?|description|details|featured|more inspiration)$/i;
  for (let i = 0; i < headings.length; i++) {
    const h = headings[i];
    if (ignored.test(h.title)) continue;
    const end = headings[i + 1]?.start ?? Math.min(html.length, h.end + 10000);
    const section = stripHtml(html.slice(h.end, end));
    if (section.length < 25 || !/\b(?:yarn|gauge|needle|hook|knit|crochet|skill\s*level|sizes?)\b/i.test(section)) continue;
    // Require stronger pattern evidence than an ordinary marketing heading.
    if (!/\b(?:yarn|gauge)\b/i.test(section) || !/\b(?:knit|crochet|needle|hook|sts?|stitches?)\b/i.test(section)) continue;
    const brand = brandHint || BRAND_BY_DOMAIN[host] || host;
    const craft = inferCraft(section, h.title);
    const gauge = inferPatternGauge(section);
    const usedYarns = inferUsedYarns(`${h.title} ${section}`, referenceYarns, brand);
    const held = heldTogetherInfo(section);
    const record = {
      sourceId: `auto-section:${norm(host)}:${norm(h.title)}:${norm(url)}`,
      name: h.title.replace(/\s+pattern$/i, "").trim(),
      designer: brand,
      craft,
      project: inferProject(`${h.title} ${section}`),
      projectType: inferProjectType(`${h.title} ${section}`),
      weight: inferWeight(section),
      gauge,
      gaugeOriginal: gauge?.original || "",
      needleSize: craft === "knit" ? inferPatternTool(section, craft) : "",
      hookSize: craft === "crochet" ? inferPatternTool(section, craft) : "",
      image: "",
      url: canonicalUrl(url),
      sourceBrand: brand,
      brands: [...new Set([brand, ...usedYarns.map((ref) => ref.split("|")[0])].filter(Boolean))],
      usedYarns,
      heldTogether: held.heldTogether,
      strandCount: held.strandCount,
      skillLevel: inferSkillLevel(section),
      sizesText: inferSizesText(section),
      free: inferFreeStatus({}, section),
      autoImported: true,
      collectionSection: true
    };
    out.push(record);
  }
  // Only use section splitting when it found credible child designs. The normal
  // page extractor remains the fallback for standard one-design pages.
  return out;
}

function extractPatternsFromPage(url, html, brandHint = "", referenceYarns = []) {
  const sections = extractPatternSections(url, html, brandHint, referenceYarns);
  const single = extractPattern(url, html, brandHint, referenceYarns);
  if (sections.length >= 2) return sections;
  return single ? [single] : sections;
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



async function crawlDropsPatternIndex(referenceYarns = []) {
  if (!fullRun) return { found: [], urls: [] };
  const pages = Array.from({ length: 420 }, (_, i) => i + 1);
  const pageResults = await mapPool(pages, 10, async (page) => {
    const url = `https://www.garnstudio.com/search.php?action=browse&lang=en&page=${page}`;
    const res = await fetchText(url, { timeout: 18000 });
    return res.ok ? { url: res.url || url, html: res.text } : null;
  });
  const byId = new Map();
  for (const page of pageResults.filter(Boolean)) {
    const html = page.html;
    const re = /href=["']([^"']*pattern\.php\?[^"']*\bid=(\d+)[^"']*)["']/gi;
    let match;
    while ((match = re.exec(html))) {
      const id = match[2];
      if (byId.has(id)) continue;
      let absolute;
      try { absolute = new URL(htmlDecode(match[1]).replace(/&amp;/g, "&"), page.url).toString(); } catch { continue; }
      const chunk = html.slice(Math.max(0, match.index - 1800), Math.min(html.length, match.index + 2600));
      const plain = stripHtml(chunk).replace(/\s+/g, " ");
      const codeMatch = plain.match(/DROPS\s+(\d{2,4}-\d{1,3})/i);
      const code = codeMatch ? codeMatch[1] : id;
      const titleCandidates = [
        ...chunk.matchAll(/(?:alt|title)=["']([^"']{3,120})["']/gi)
      ].map((m) => htmlDecode(m[1]).trim()).filter((v) => !/^(?:image|photo|drops design)$/i.test(v));
      const descriptive = titleCandidates.find((v) => !/drops\s*\d/i.test(v) && !/logo|icon|arrow/i.test(v));
      const name = descriptive ? `${descriptive} / DROPS ${code}` : `DROPS ${code}`;
      const yarnMatch = plain.match(/DROPS\s+([A-Za-z][A-Za-z0-9 +&'’\-]{1,45}?)\s*\((\d+(?:\.\d+)?)\s*sts?\)/i);
      let usedYarns = [];
      let gauge = null;
      if (yarnMatch) {
        const yarnName = yarnMatch[1].trim();
        const existing = referenceYarns.find((y) => norm(y.brand) === "drops" && norm(y.name) === norm(yarnName));
        usedYarns = [`${existing?.brand || "DROPS"}|${existing?.name || yarnName}`];
        const stitches = Number(yarnMatch[2]);
        if (Number.isFinite(stitches)) gauge = { stitches, rows: null, measurement: 4, original: `${stitches} sts / 10 cm` };
      }
      const craft = /\bcrochet(?:ed)?\b/i.test(plain) && !/\bknit(?:ted|ting)?\b/i.test(plain) ? "crochet" : "knit";
      byId.set(id, {
        sourceId: `drops:${id}`,
        name,
        designer: "DROPS Design",
        craft,
        project: inferProject(plain),
        projectType: inferProjectType(plain),
        weight: "",
        gauge,
        gaugeOriginal: gauge?.original || "",
        image: "",
        url: canonicalUrl(absolute),
        sourceBrand: "DROPS",
        brands: ["DROPS"],
        usedYarns,
        autoImported: true
      });
    }
  }
  return { found: [...byId.values()], urls: [...byId.values()].map((p) => p.url) };
}

async function discoverLinksFromSeeds(kind, seedPairs, referenceYarns = []) {
  const urls = [];
  const directRecords = [];
  for (const [brand, rawSeed] of seedPairs) {
    const seed = canonicalUrl(rawSeed);
    if (!seed) continue;
    const res = await fetchText(seed, { timeout: 18000 });
    if (!res.ok) continue;
    const finalSeed = res.url || seed;
    const origin = (() => { try { return new URL(finalSeed).origin; } catch { return ""; } })();
    const anchorRe = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    let count = 0;
    while ((match = anchorRe.exec(res.text)) && count < 2500) {
      let href = htmlDecode(match[1]).trim();
      const label = stripHtml(match[2]).trim();
      if (!href || href.startsWith("#") || /^(?:mailto:|tel:|javascript:)/i.test(href)) continue;
      let absolute;
      try { absolute = new URL(href, finalSeed).toString(); } catch { continue; }
      if (origin && !officialLinkedUrl(finalSeed, absolute)) continue;
      if (/\.(?:jpg|jpeg|png|gif|webp|svg|zip)(?:\?|$)/i.test(absolute)) continue;
      if (/\b(?:account|login|cart|checkout|privacy|terms|contact|about|search)\b/i.test(absolute) && !/pattern|design|yarn/i.test(absolute)) continue;
      if (kind === "patterns" && /\.pdf(?:\?|$)/i.test(absolute)) {
        const name = cleanName(label || absolute.split("/").pop().replace(/[-_]+/g, " ").replace(/\.pdf.*$/i, ""));
        if (name.length >= 3) {
          const context = stripHtml(res.text.slice(Math.max(0, match.index - 700), match.index + match[0].length + 700));
          const usedYarns = inferUsedYarns(`${name} ${context}`, referenceYarns, brand);
          const held = heldTogetherInfo(context);
          directRecords.push({
            sourceId: `auto-pdf:${norm(domainOf(absolute))}:${norm(name)}:${norm(absolute)}`,
            name, designer: brand, sourceBrand: brand, brands: [...new Set([brand, ...usedYarns.map((r) => r.split("|")[0])])],
            craft: inferCraft(context, name), project: inferProject(`${name} ${context}`), projectType: inferProjectType(`${name} ${context}`), usedYarns,
            heldTogether: held.heldTogether, strandCount: held.strandCount,
            gauge: inferPatternGauge(context), gaugeOriginal: inferPatternGauge(context)?.original || "",
            pdfUrl: canonicalUrl(absolute), url: canonicalUrl(absolute), image: "", autoImported: true
          });
        }
        count++; continue;
      }
      if (/\.pdf(?:\?|$)/i.test(absolute)) continue;
      // On an official patterns/yarns listing, linked item pages are valuable even
      // when their slugs don't literally contain the word "pattern" or "yarn".
      if (label.length >= 2 || /pattern|design|yarn|product|shop/i.test(absolute)) {
        urls.push(canonicalUrl(absolute)); count++;
      }
    }
  }
  return { urls: [...new Set(urls.filter(Boolean))], directRecords };
}

async function crawl(kind, existing, state, referenceYarns = []) {
  const seedPairs = SOURCE_SEEDS[kind] || [];
  const seedLinks = await discoverLinksFromSeeds(kind, seedPairs, referenceYarns);
  const dropsIndex = kind === "patterns" ? await crawlDropsPatternIndex(referenceYarns) : { found: [], urls: [] };
  const existingUrls = [...new Set([...seedUrls(existing, kind), ...seedPairs.map(([, url]) => canonicalUrl(url)).filter(Boolean)])];
  const knownUrls = fullRun ? new Set() : new Set([
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

  // Learn brand names from the catalog already loaded for each source host.
  // This keeps automatically discovered items under the same customer-facing
  // brand even when the source page omits Product.brand metadata.
  const brandCountsByDomain = new Map();
  for (const item of existing) {
    const raw = kind === "patterns"
      ? (item.url || item.sourceUrl || item.patternUrl)
      : (item.sourceUrl || item.url || item.productUrl);
    const host = domainOf(raw);
    const brand = String(item.brand || item.sourceBrand || (Array.isArray(item.brands) ? item.brands[0] : "") || "").trim();
    if (!host || !brand) continue;
    if (!brandCountsByDomain.has(host)) brandCountsByDomain.set(host, new Map());
    const counts = brandCountsByDomain.get(host);
    counts.set(brand, (counts.get(brand) || 0) + 1);
  }

  for (const [brand, url] of seedPairs) {
    const host = domainOf(url);
    if (!host) continue;
    if (!brandCountsByDomain.has(host)) brandCountsByDomain.set(host, new Map());
    const counts = brandCountsByDomain.get(host);
    counts.set(brand, Math.max(1000, counts.get(brand) || 0));
  }

  function brandHintFor(host) {
    const counts = brandCountsByDomain.get(host);
    if (!counts || !counts.size) return "";
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }

  const since = fullRun ? null : (kind === "patterns" ? state.lastPatternRun : state.lastYarnRun);
  const allCandidates = [...seedLinks.urls];

  for (const [host, domainUrls] of byDomain) {
    if (fullRun && kind === "patterns" && /garnstudio\.com$/i.test(host)) continue;
    const origin = `https://${host}`;
    const pages = await discoverSitemapPages(origin);
    if (!pages.length) continue;

    const hints = pathHints(domainUrls, kind);
    const selected = pages
      .filter((page) => candidatePage(page, hints, since, knownUrls))
      .slice(0, fullRun
        ? (kind === "patterns" ? (/garnstudio\.com$/i.test(host) ? 15000 : 4000) : 2000)
        : (kind === "patterns" ? 500 : 700));

    for (const page of selected) allCandidates.push(page.url);
  }

  const unique = [...new Set(allCandidates)]
    .slice(0, fullRun ? (kind === "patterns" ? 30000 : 6000) : (kind === "patterns" ? 1200 : 800));

  // Keep requests bounded but parallel enough that a scheduled update cannot
  // spend hours waiting on one slow manufacturer at a time.
  const discovered = await mapPool(unique, 8, async (url) => {
    const res = await fetchText(url);
    if (!res.ok) return null;

    const finalUrl = res.url || url;
    const brandHint = brandHintFor(domainOf(finalUrl));
    return kind === "patterns"
      ? extractPatternsFromPage(finalUrl, res.text, brandHint, referenceYarns)
      : extractYarn(finalUrl, res.text, brandHint);
  });

  const flatDiscovered = kind === "patterns"
    ? discovered.flatMap((value) => Array.isArray(value) ? value : (value ? [value] : []))
    : discovered.filter(Boolean);
  return {
    found: [...dropsIndex.found, ...seedLinks.directRecords, ...flatDiscovered],
    discoveredUrls: [...new Set([...dropsIndex.urls, ...unique, ...seedLinks.urls])]
  };
}

async function auditDiscontinued(existingYarns, autoYarns, state, changes) {
  const autoByKey = new Map(autoYarns.map((y) => [yarnKey(y), y]));
  const missing = state.missingYarnChecks || {};

  // Only inspect direct manufacturer/source URLs, never delete, and check each
  // unique URL once even if more than one catalog record points to it.
  const byUrl = new Map();
  for (const yarn of existingYarns) {
    if (!yarn?.sourceUrl || /ravelry\.com/i.test(yarn.sourceUrl)) continue;
    const url = canonicalUrl(yarn.sourceUrl);
    if (!url || byUrl.has(url)) continue;
    byUrl.set(url, yarn);
    if (byUrl.size >= 1200) break;
  }

  const results = await mapPool([...byUrl.entries()], 12, async ([url, yarn]) => {
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

    return { url, yarn, explicit };
  });

  for (const result of results) {
    if (!result?.explicit || result.yarn.discontinued) continue;
    const yarn = result.yarn;
    const key = yarnKey(yarn);
    const overlay = {
      ...(autoByKey.get(key) || {}),
      brand: yarn.brand,
      name: yarn.name,
      sourceUrl: result.url,
      discontinued: true,
      status: "Discontinued",
      autoImported: true
    };
    autoByKey.set(key, overlay);
    changes.yarns.discontinued.push(`${yarn.brand} — ${yarn.name}`);
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
  const win = await loadWindow(CATALOG_FILES);
  const existing = flattenPatterns(win);
  const autoExisting = Array.isArray(win.AUTO_PATTERN_CATALOG) ? win.AUTO_PATTERN_CATALOG : [];

  const referenceYarns = flattenYarns(win);
  const { found, discoveredUrls } = await crawl("patterns", existing, state, referenceYarns);
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
  const win = await loadWindow(CATALOG_FILES);
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
  fullRun,
  patternChanges: changes.patterns,
  yarnChanges: changes.yarns
}, null, 2));
