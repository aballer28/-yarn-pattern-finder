// Vercel serverless function: exact yarn/pattern image resolver
// Fetches the item's OWN product/pattern page and returns the best matching image.
// It prefers Product/CreativeWork JSON-LD and name-matching <img> tags.
// Generic logos/banners are rejected.

const BAD_IMAGE_WORDS = [
  "logo", "favicon", "icon", "sprite", "banner", "hero", "header", "footer",
  "payment", "badge", "placeholder", "default", "social", "facebook",
  "instagram", "pinterest", "youtube", "newsletter", "avatar"
];


const BROWSER_HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
  "accept":
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "accept-language": "en-US,en;q=0.9",
  "cache-control": "no-cache"
};

function decodeHtml(s = "") {
  return String(s)
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanText(s = "") {
  return decodeHtml(s)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(s = "") {
  return cleanText(s)
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[®™©]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function nameTokens(name = "") {
  return normalize(name)
    .split(" ")
    .filter(t => t.length >= 3 && !["yarn", "pattern", "knit", "crochet"].includes(t));
}

function absoluteUrl(value, pageUrl) {
  if (!value) return null;
  value = decodeHtml(String(value).trim());
  if (value.startsWith("//")) return "https:" + value;
  try {
    return new URL(value, pageUrl).toString();
  } catch {
    return null;
  }
}

function badImage(url = "") {
  const u = normalize(url);
  return BAD_IMAGE_WORDS.some(word => u.includes(word));
}

function imageLike(url = "") {
  return /\.(avif|webp|png|jpe?g|gif)(?:$|[?#])/i.test(url) ||
    /images?|cdn|media|assets|uploads|products?|shademap/i.test(url);
}

function scoreCandidate(candidate, tokens, pageUrl, kind) {
  if (!candidate || !candidate.url) return -9999;

  const url = absoluteUrl(candidate.url, pageUrl);
  if (!url || !/^https?:/i.test(url)) return -9999;
  if (badImage(url)) return -500;

  const hay = normalize([
    candidate.alt,
    candidate.title,
    candidate.context,
    url
  ].filter(Boolean).join(" "));

  let score = 0;
  let matchedTokens = 0;

  for (const token of tokens) {
    if (hay.includes(token)) {
      score += 12;
      matchedTokens += 1;
    }
  }

  // A collection page can contain many valid product images. Require a
  // meaningful name match so a working but unrelated image cannot win simply
  // because it is the first Product/CreativeWork image on the page.
  if (tokens.length && matchedTokens === 0) score -= 60;
  if (tokens.length && matchedTokens >= Math.ceil(tokens.length / 2)) score += 20;

  if (kind === "pattern") {
    if (candidate.type === "jsonld-creative") score += 85;
    if (candidate.type === "jsonld-product") score += 45; // many pattern shops sell PDFs as products
    if (candidate.type === "img") score += 30;
    if (candidate.type === "og") score += 18;
    if (candidate.type === "twitter") score += 10;
    if (/pattern|design|knit|crochet|pdf/i.test(hay)) score += 18;
    if (/yarn|skein|ball/i.test(hay) && !/pattern|design/i.test(hay)) score -= 12;
  } else {
    if (candidate.type === "jsonld-product") score += 80;
    if (candidate.type === "jsonld-creative") score += 20;
    if (candidate.type === "img") score += 30;
    if (candidate.type === "og") score += 14;
    if (candidate.type === "twitter") score += 8;
    if (/product|yarn|skein|ball|fiber/i.test(hay)) score += 18;
    if (/pattern|design/i.test(hay) && !/yarn|skein|ball/i.test(hay)) score -= 12;
  }

  if (imageLike(url)) score += 8;

  // Prefer reasonably sized product media over tiny UI assets.
  const width = Number(candidate.width || 0);
  const height = Number(candidate.height || 0);
  if (width >= 300 || height >= 300) score += 8;
  if ((width && width < 100) || (height && height < 100)) score -= 25;

  return score;
}

function pushImageValue(out, value, type, context = "") {
  if (!value) return;
  if (Array.isArray(value)) {
    value.forEach(v => pushImageValue(out, v, type, context));
    return;
  }
  if (typeof value === "string") {
    out.push({ url: value, type, context });
    return;
  }
  if (typeof value === "object") {
    const url = value.url || value.contentUrl || value["@id"];
    if (url) {
      out.push({
        url,
        type,
        context,
        width: value.width,
        height: value.height
      });
    }
  }
}

function walkJsonLd(node, out) {
  if (!node) return;
  if (Array.isArray(node)) {
    node.forEach(v => walkJsonLd(v, out));
    return;
  }
  if (typeof node !== "object") return;

  const typeValue = Array.isArray(node["@type"]) ? node["@type"].join(" ") : String(node["@type"] || "");
  const type = normalize(typeValue);

  if (type.includes("product")) {
    pushImageValue(out, node.image, "jsonld-product", node.name || "");
    if (node.primaryImageOfPage) {
      pushImageValue(out, node.primaryImageOfPage, "jsonld-product", node.name || "");
    }
  } else if (
    type.includes("creativework") ||
    type.includes("article") ||
    type.includes("howto")
  ) {
    pushImageValue(out, node.image, "jsonld-creative", node.name || node.headline || "");
  }

  if (node["@graph"]) walkJsonLd(node["@graph"], out);
}

function extractJsonLd(html) {
  const out = [];
  const re = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    let raw = m[1].trim();
    try {
      walkJsonLd(JSON.parse(raw), out);
    } catch {
      // Some sites include control characters/trailing commas. Ignore bad blocks.
    }
  }
  return out;
}

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, "i"));
  return m ? decodeHtml(m[2]) : "";
}

function extractImgs(html) {
  const out = [];
  const re = /<img\b[^>]*>/gi;
  let m;
  while ((m = re.exec(html))) {
    const tag = m[0];
    const src =
      attr(tag, "src") ||
      attr(tag, "data-src") ||
      attr(tag, "data-original") ||
      attr(tag, "data-lazy-src");

    if (!src) continue;

    out.push({
      url: src,
      type: "img",
      alt: attr(tag, "alt"),
      title: attr(tag, "title"),
      width: attr(tag, "width"),
      height: attr(tag, "height"),
      context: cleanText(html.slice(Math.max(0, m.index - 180), m.index + tag.length + 180))
    });

    const srcset = attr(tag, "srcset") || attr(tag, "data-srcset");
    if (srcset) {
      const candidates = srcset.split(",").map(x => x.trim().split(/\s+/)[0]).filter(Boolean);
      if (candidates.length) {
        out.push({
          url: candidates[candidates.length - 1],
          type: "img",
          alt: attr(tag, "alt"),
          title: attr(tag, "title"),
          context: cleanText(html.slice(Math.max(0, m.index - 180), m.index + tag.length + 180))
        });
      }
    }
  }
  return out;
}

function extractMeta(html) {
  const out = [];
  const re = /<meta\b[^>]*>/gi;
  let m;
  while ((m = re.exec(html))) {
    const tag = m[0];
    const property = attr(tag, "property") || attr(tag, "name");
    const content = attr(tag, "content");
    if (!content) continue;
    if (/^og:image(?::url)?$/i.test(property)) out.push({ url: content, type: "og" });
    if (/^twitter:image(?::src)?$/i.test(property)) out.push({ url: content, type: "twitter" });
  }
  return out;
}

function chooseImage(html, pageUrl, name, kind) {
  const tokens = nameTokens(name);
  const candidates = [
    ...extractJsonLd(html),
    ...extractImgs(html),
    ...extractMeta(html)
  ];

  const ranked = candidates
    .map(c => ({ ...c, score: scoreCandidate(c, tokens, pageUrl, kind) }))
    .filter(c => c.score >= 20)
    .sort((a, b) => b.score - a.score);

  return ranked.length ? absoluteUrl(ranked[0].url, pageUrl) : null;
}


function genericCollectionPage(value) {
  try {
    const parsed = new URL(String(value || ""));
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

function extractLinks(html, pageUrl) {
  const out = [];
  const re = /<a\b[^>]*href\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    const url = absoluteUrl(m[2], pageUrl);
    if (!url) continue;
    out.push({
      url,
      text: cleanText(m[3]),
      context: cleanText(html.slice(Math.max(0, m.index - 140), Math.min(html.length, re.lastIndex + 140)))
    });
  }
  return out;
}

function detailLinkScore(link, pageUrl, brand, name, kind) {
  if (!link || !link.url) return -9999;
  let parsed;
  let source;
  try {
    parsed = new URL(link.url);
    source = new URL(pageUrl);
  } catch {
    return -9999;
  }
  if (parsed.hostname !== source.hostname) return -9999;

  const wanted = nameTokens([brand, name].filter(Boolean).join(" "));
  const hay = normalize([link.url, link.text, link.context].join(" "));
  let matched = 0;
  for (const token of wanted) {
    if (hay.includes(token)) matched += 1;
  }
  if (wanted.length && matched === 0) return -1000;

  let score = matched * 20;
  const path = parsed.pathname.toLowerCase();
  if (kind === "pattern") {
    if (/\/(?:products?|patterns?|designs?)\//.test(path)) score += 30;
    if (/pattern|design|pdf/.test(hay)) score += 12;
  } else {
    if (/\/(?:products?|product)\//.test(path)) score += 35;
    if (/yarn|skein|ball/.test(hay)) score += 12;
  }
  if (genericCollectionPage(link.url)) score -= 30;
  return score;
}

function siteSearchUrls(pageUrl, brand, name, kind) {
  let parsed;
  try {
    parsed = new URL(pageUrl);
  } catch {
    return [];
  }
  const host = parsed.hostname.toLowerCase();
  const query = [brand, name, kind === "yarn" ? "yarn" : "pattern"].filter(Boolean).join(" ");
  const q = encodeURIComponent(query);
  const urls = [];

  // Both sites currently render product tiles/links server-side on search pages.
  if (/yarnspirations\.com$/.test(host)) {
    urls.push(`${parsed.protocol}//${host}/search?q=${q}&type=product`);
    urls.push(`${parsed.protocol}//${host}/search?q=${q}`);
  } else if (/michaels\.com$/.test(host)) {
    urls.push(`${parsed.protocol}//${host}/search?q=${q}`);
  } else if (genericCollectionPage(pageUrl)) {
    // Most Shopify-style manufacturer sites support /search?q= as a harmless
    // fallback. A failure here simply falls through to the normal placeholder.
    urls.push(`${parsed.protocol}//${host}/search?q=${q}`);
  }

  return [...new Set(urls)];
}

function safeRemoteUrl(value) {
  if (!/^https?:\/\//i.test(String(value || ""))) return null;
  try {
    const url = new URL(String(value));
    const host = url.hostname.toLowerCase();
    if (
      host === "localhost" || host === "127.0.0.1" || host === "::1" ||
      /^10\./.test(host) || /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    ) return null;
    return url;
  } catch {
    return null;
  }
}

async function fetchResolvedImage(imageUrl, referer) {
  const safe = safeRemoteUrl(imageUrl);
  if (!safe) return null;
  try {
    const response = await fetch(safe.toString(), {
      redirect: "follow",
      headers: {
        ...BROWSER_HEADERS,
        "accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        ...(referer ? { referer } : {})
      }
    });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) return null;
    return {
      contentType,
      data: Buffer.from(await response.arrayBuffer())
    };
  } catch {
    return null;
  }
}

async function resolveFromPage(rawPage, name, kind) {
  const pageUrl = safeRemoteUrl(rawPage);
  if (!pageUrl) return null;
  try {
    const pageResponse = await fetch(pageUrl.toString(), {
      redirect: "follow",
      headers: BROWSER_HEADERS
    });
    if (!pageResponse.ok) return null;
    const html = await pageResponse.text();
    const finalPage = pageResponse.url || pageUrl.toString();
    const imageUrl = chooseImage(html, finalPage, name, kind);
    if (!imageUrl) return null;
    return await fetchResolvedImage(imageUrl, finalPage);
  } catch {
    return null;
  }
}


async function resolveViaDiscovery(rawPage, brand, name, kind) {
  const source = safeRemoteUrl(rawPage);
  if (!source) return null;

  for (const searchUrl of siteSearchUrls(source.toString(), brand, name, kind)) {
    const safeSearch = safeRemoteUrl(searchUrl);
    if (!safeSearch) continue;

    try {
      const response = await fetch(safeSearch.toString(), {
        redirect: "follow",
        headers: BROWSER_HEADERS
      });
      if (!response.ok) continue;

      const html = await response.text();
      const finalSearch = response.url || safeSearch.toString();
      const queryName = [brand, name].filter(Boolean).join(" ");

      // A server-rendered search result can already contain the exact product
      // tile image; use it if the name evidence is strong enough.
      const directImage = chooseImage(html, finalSearch, queryName || name, kind);
      if (directImage) {
        const resolved = await fetchResolvedImage(directImage, finalSearch);
        if (resolved) return resolved;
      }

      const links = extractLinks(html, finalSearch)
        .map(link => ({
          ...link,
          score: detailLinkScore(link, finalSearch, brand, name, kind)
        }))
        .filter(link => link.score >= 20)
        .sort((a, b) => b.score - a.score)
        .slice(0, 4);

      for (const link of links) {
        const resolved = await resolveFromPage(link.url, queryName || name, kind);
        if (resolved) return resolved;
      }
    } catch {
      // Keep trying the next discovery route.
    }
  }

  return null;
}

export default async function handler(req, res) {
  const page = String(req.query.url || "");
  const altUrl = String(req.query.altUrl || "");
  const fallback = String(req.query.fallback || "");
  const name = String(req.query.name || "");
  const brand = String(req.query.brand || "");
  const kind = String(req.query.kind || "yarn").toLowerCase() === "pattern" ? "pattern" : "yarn";

  if (!name || !safeRemoteUrl(page)) {
    res.status(400).send("Missing or invalid url/name");
    return;
  }

  const queryName = [brand, name].filter(Boolean).join(" ");

  // 1. Exact product/design pages get first priority. Broad collection/search
  //    pages go through discovery first so we do not accidentally grab a
  //    neighboring product image.
  let result = null;
  if (!genericCollectionPage(page)) {
    result = await resolveFromPage(page, queryName || name, kind);
  }

  // 2. When the stored page is broad, moved, JS-heavy, or blocks the resolver,
  //    search the same official site for the exact product/design.
  if (!result) {
    result = await resolveViaDiscovery(page, brand, name, kind);
  }

  // 3. If the official page moved, try the alternate verified source page.
  if (!result && safeRemoteUrl(altUrl) && altUrl !== page) {
    if (!genericCollectionPage(altUrl)) {
      result = await resolveFromPage(altUrl, queryName || name, kind);
    }
    if (!result) {
      result = await resolveViaDiscovery(altUrl, brand, name, kind);
    }
  }

  // 4. Last resort: proxy the curated direct image server-side. This avoids
  //    browser hotlink failures while still showing the exact verified yarn.
  if (!result && safeRemoteUrl(fallback)) {
    result = await fetchResolvedImage(fallback, altUrl || page);
  }

  if (!result) {
    console.warn("GarnSwatch image miss", {
      name,
      brand: brand || null,
      kind,
      page,
      altUrl: altUrl || null,
      hasFallback: Boolean(fallback)
    });
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=900");
    res.status(404).send("No exact image found");
    return;
  }

  res.setHeader("Content-Type", result.contentType);
  res.setHeader("Cache-Control", "public, s-maxage=604800, stale-while-revalidate=2592000");
  res.status(200).send(result.data);
}
