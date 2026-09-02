// Vercel serverless function: exact yarn/pattern image resolver
// Fetches the item's OWN product/pattern page and returns the best matching image.
// It prefers Product/CreativeWork JSON-LD and name-matching <img> tags.
// Generic logos/banners are rejected.

const BAD_IMAGE_WORDS = [
  "logo", "favicon", "icon", "sprite", "banner", "hero", "header", "footer",
  "payment", "badge", "placeholder", "default", "social", "facebook",
  "instagram", "pinterest", "youtube", "newsletter", "avatar"
];

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

function scoreCandidate(candidate, tokens, pageUrl) {
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

  for (const token of tokens) {
    if (hay.includes(token)) score += 12;
  }

  if (candidate.type === "jsonld-product") score += 70;
  if (candidate.type === "jsonld-creative") score += 55;
  if (candidate.type === "img") score += 30;
  if (candidate.type === "og") score += 12;
  if (candidate.type === "twitter") score += 8;

  if (/product|yarn|skein|ball|pattern|design/i.test(hay)) score += 14;
  if (imageLike(url)) score += 8;

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
    out.push({
      url: value,
      type,
      context
    });
    return;
  }

  if (typeof value === "object") {
    const url =
      value.url ||
      value.contentUrl ||
      value["@id"];

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

  const typeValue = Array.isArray(node["@type"])
    ? node["@type"].join(" ")
    : String(node["@type"] || "");

  const type = normalize(typeValue);

  if (type.includes("product")) {
    pushImageValue(
      out,
      node.image,
      "jsonld-product",
      node.name || ""
    );

    if (node.primaryImageOfPage) {
      pushImageValue(
        out,
        node.primaryImageOfPage,
        "jsonld-product",
        node.name || ""
      );
    }
  } else if (
    type.includes("creativework") ||
    type.includes("article") ||
    type.includes("howto")
  ) {
    pushImageValue(
      out,
      node.image,
      "jsonld-creative",
      node.name || node.headline || ""
    );
  }

  if (node["@graph"]) {
    walkJsonLd(node["@graph"], out);
  }
}

function extractJsonLd(html) {
  const out = [];

  const re =
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  let m;

  while ((m = re.exec(html))) {
    const raw = m[1].trim();

    try {
      walkJsonLd(JSON.parse(raw), out);
    } catch {
      // Ignore invalid JSON-LD blocks.
    }
  }

  return out;
}

function attr(tag, name) {
  const m = tag.match(
    new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, "i")
  );

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
      context: cleanText(
        html.slice(
          Math.max(0, m.index - 180),
          m.index + tag.length + 180
        )
      )
    });

    const srcset =
      attr(tag, "srcset") ||
      attr(tag, "data-srcset");

    if (srcset) {
      const candidates = srcset
        .split(",")
        .map(x => x.trim().split(/\s+/)[0])
        .filter(Boolean);

      if (candidates.length) {
        out.push({
          url: candidates[candidates.length - 1],
          type: "img",
          alt: attr(tag, "alt"),
          title: attr(tag, "title"),
          context: cleanText(
            html.slice(
              Math.max(0, m.index - 180),
              m.index + tag.length + 180
            )
          )
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

    const property =
      attr(tag, "property") ||
      attr(tag, "name");

    const content = attr(tag, "content");

    if (!content) continue;

    if (/^og:image(?::url)?$/i.test(property)) {
      out.push({
        url: content,
        type: "og"
      });
    }

    if (/^twitter:image(?::src)?$/i.test(property)) {
      out.push({
        url: content,
        type: "twitter"
      });
    }
  }

  return out;
}

function chooseImage(html, pageUrl, name) {
  const tokens = nameTokens(name);

  const candidates = [
    ...extractJsonLd(html),
    ...extractImgs(html),
    ...extractMeta(html)
  ];

  const ranked = candidates
    .map(c => ({
      ...c,
      score: scoreCandidate(c, tokens, pageUrl)
    }))
    .filter(c => c.score >= 20)
    .sort((a, b) => b.score - a.score);

  return ranked.length
    ? absoluteUrl(ranked[0].url, pageUrl)
    : null;
}

export default async function handler(req, res) {
  const page = String(req.query.url || "");
  const name = String(req.query.name || "");

  if (!/^https?:\/\//i.test(page) || !name) {
    res.status(400).send("Missing url or name");
    return;
  }

  let pageUrl;

  try {
    pageUrl = new URL(page);
  } catch {
    res.status(400).send("Bad URL");
    return;
  }

  const host = pageUrl.hostname.toLowerCase();

  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  ) {
    res.status(403).send("Blocked host");
    return;
  }

  try {
    const pageResponse = await fetch(
      pageUrl.toString(),
      {
        redirect: "follow",
        headers: {
          "user-agent":
            "Mozilla/5.0 (compatible; GarnSwatchImageResolver/1.0)",
          "accept":
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
      }
    );

    if (!pageResponse.ok) {
      res.status(404).send("Source page unavailable");
      return;
    }

    const html = await pageResponse.text();

    const imageUrl = chooseImage(
      html,
      pageResponse.url || pageUrl.toString(),
      name
    );

    if (!imageUrl) {
      res.status(404).send("No exact image found");
      return;
    }

    const imageResponse = await fetch(
      imageUrl,
      {
        redirect: "follow",
        headers: {
          "user-agent":
            "Mozilla/5.0 (compatible; GarnSwatchImageResolver/1.0)",
          "referer":
            pageResponse.url || pageUrl.toString()
        }
      }
    );

    if (!imageResponse.ok) {
      res.status(404).send("Image unavailable");
      return;
    }

    const contentType =
      imageResponse.headers.get("content-type") || "";

    if (!contentType.startsWith("image/")) {
      res.status(404).send(
        "Resolved URL is not an image"
      );
      return;
    }

    const data = Buffer.from(
      await imageResponse.arrayBuffer()
    );

    res.setHeader(
      "Content-Type",
      contentType
    );

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=604800, stale-while-revalidate=2592000"
    );

    res.status(200).send(data);

  } catch (error) {
    res.status(404).send(
      "Image resolution failed"
    );
  }
}
