import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const read = (name) => fs.readFileSync(path.join(ROOT, name), 'utf8');
const exists = (name) => fs.existsSync(path.join(ROOT, name));

const DATA_FILES = [
  'catalog.js',
  'kfi-catalog.js',
  'knit-picks-yarns.js',
  'yarn-image-catalog.js',
  'koigu-yarn-update.js',
  'kelbourne-family-yarns.js',
  'kelbourne-family-patterns.js',
  'berroco-family-catalog.js',
  'berroco-pattern-bridge.js',
  'berroco-family-safe.js',
  'quince-family-catalog.js',
  'luca-s-catalog.js',
  'lise-tailor-catalog.js',
  'uk-alpaca-catalog.js',
  'vobelle-catalog.js',
  'atlantic-coast-catalog.js',
  'wollbiene-catalog.js',
  'knitting-for-olive-catalog.js',
  'bettaknit-catalog.js',
  'wool-couture-catalog.js',
  'purl-soho-catalog.js',
  'lion-brand-catalog.js',
  'drops-catalog.js',
  'mainstays-catalog.js',
  'michaels-joann-catalog.js',
  'yarnspirations-catalog.js',
  'auto-yarns.js',
  'auto-patterns.js',
  'catalog-auto-changes.js',
  'catalog-integration.js'
];

const requiredFiles = DATA_FILES.filter((f) => !['auto-yarns.js','auto-patterns.js','catalog-auto-changes.js'].includes(f));
const missingRequired = requiredFiles.filter((f) => !exists(f));
if (missingRequired.length) {
  throw new Error(`Refusing rebuild: required source files are missing: ${missingRequired.join(', ')}`);
}

const sandbox = {
  console,
  URL,
  URLSearchParams,
  setTimeout: () => 0,
  clearTimeout: () => {},
  structuredClone: globalThis.structuredClone,
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

const loadErrors = [];
let baseCatalogPatterns = [];
for (const file of DATA_FILES) {
  if (!exists(file)) continue;
  try {
    vm.runInContext(read(file), sandbox, { filename: file, timeout: 10000 });
    if (file === 'catalog.js' && Array.isArray(sandbox.PATTERN_CATALOG)) {
      baseCatalogPatterns = sandbox.PATTERN_CATALOG.map((p) => ({ ...p }));
    }
  } catch (error) {
    loadErrors.push({ file, error: String(error?.message || error) });
  }
}
if (loadErrors.length) {
  throw new Error(`Refusing rebuild: catalog source load errors: ${JSON.stringify(loadErrors)}`);
}

function text(value) { return String(value == null ? '' : value).trim(); }
function normalize(value) {
  return text(value)
    .normalize('NFKD').toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[®™©]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
function plainObject(value) { return value && typeof value === 'object' && !Array.isArray(value); }
function hasValue(value) {
  if (value === undefined || value === null || value === '') return false;
  if (typeof value === 'number') return Number.isFinite(value) && value > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (plainObject(value)) return Object.keys(value).length > 0;
  return Boolean(text(value));
}
function looksLikeYarn(item) {
  if (!plainObject(item) || !text(item.brand) || !text(item.name)) return false;
  if (item.usedYarns || item.designer || item.patternUrl || item.pdfUrl) return false;
  return true;
}
function keyFor(item) { return `${normalize(item?.brand)}|${normalize(item?.name)}`; }
function genericPage(url) {
  const raw = text(url);
  if (!/^https?:\/\//i.test(raw)) return true;
  try {
    const u = new URL(raw);
    const p = u.pathname.replace(/\/+$/, '').toLowerCase();
    if (!p || p === '/') return true;
    if (/\/(?:collections?|search|shop|browse)(?:\/|$)/i.test(p)) return true;
    if (/(?:shop-all-yarn|shop-all-needlework|all-yarns|all-patterns|yarn-needlework)$/i.test(p)) return true;
    if (/\/(?:patterns?|designs?|yarns?)$/i.test(p)) return true;
    return false;
  } catch { return true; }
}

const RETAILER_HOSTS = /(?:michaels\.com|joann\.com|walmart\.com)/i;
const MANUFACTURER_BRANDS = new Set([
  'bernat','caron','lily sugar n cream','patons','phentex','red heart',
  'peaches and creme','peaches creme','lion brand'
]);
function recordScore(item) {
  let score = 0;
  if (hasValue(item.weight)) score += 12;
  if (item.cycWeight === 0 || hasValue(item.cycWeight)) score += 4;
  if (hasValue(item.yards)) score += 12;
  if (hasValue(item.meters)) score += 8;
  if (hasValue(item.grams)) score += 8;
  if (hasValue(item.ounces)) score += 3;
  if (hasValue(item.knitGauge)) score += 9;
  if (hasValue(item.knitRowGauge) || hasValue(item.rowGauge)) score += 3;
  if (hasValue(item.crochetGauge)) score += 9;
  if (hasValue(item.crochetRowGauge)) score += 3;
  if (hasValue(item.needleSize)) score += 7;
  if (hasValue(item.hookSize)) score += 7;
  if (hasValue(item.fiber) || hasValue(item.fiberFamily)) score += 6;
  if (hasValue(item.care)) score += 2;
  if (hasValue(item.description)) score += 2;
  if (hasValue(item.image)) score += 3;
  if (item.manualVerified === true || item.imageVerified === true) score += 8;
  const url = text(item.productUrl || item.sourceUrl || item.imagePage || item.url);
  if (url) score += genericPage(url) ? 1 : 8;
  if (MANUFACTURER_BRANDS.has(normalize(item.brand)) && RETAILER_HOSTS.test(url)) score -= 10;
  if (item.catalogOnly === true || item.placeholderRecord === true || item.catalogFamilyEntry === true) score -= 20;
  return score;
}
function chooseValue(ranked, field) {
  for (const item of ranked) {
    if (field === 'cycWeight' && item[field] === 0) return 0;
    if (hasValue(item[field])) return Array.isArray(item[field]) ? [...item[field]] : item[field];
  }
  return undefined;
}
function chooseUrl(ranked, fields) {
  const c = [];
  ranked.forEach((item, ri) => fields.forEach((field, fi) => {
    const value = text(item[field]);
    if (!/^https?:\/\//i.test(value)) return;
    c.push({ value, generic: genericPage(value), score: recordScore(item), ri, fi });
  }));
  c.sort((a,b) => Number(a.generic)-Number(b.generic) || b.score-a.score || a.ri-b.ri || a.fi-b.fi);
  return c[0]?.value;
}

const IMPORTANT_FIELDS = [
  'displayName','status','discontinued','weight','cycWeight','yards','meters','grams','ounces',
  'knitGauge','knitRowGauge','rowGauge','crochetGauge','crochetRowGauge','needleSize','hookSize',
  'fiber','fiberFamily','care','washable','feltable','yarnGroup','description','kfiId','sourceCheckedAt','manualVerified'
];

const groups = new Map();
function addCandidate(item) {
  if (!looksLikeYarn(item)) return;
  const k = keyFor(item);
  if (!k || k === '|') return;
  if (!groups.has(k)) groups.set(k, []);
  groups.get(k).push({ ...item });
}
for (const [name, value] of Object.entries(sandbox)) {
  if (!/YARN/i.test(name) || !Array.isArray(value)) continue;
  value.forEach(addCandidate);
}
if (Array.isArray(sandbox.YARN_CATALOG)) sandbox.YARN_CATALOG.forEach(addCandidate);

// Only facts we have explicitly verified. No fake status, gauge, tool, or yardage defaults.
const VERIFIED_FACTS = new Map([
  ['caron|anniversary cakes', {
    weight:'Super Bulky', cycWeight:6,
    grams:1000, ounces:35.3, yards:1061, meters:970,
    fiber:'100% Acrylic',
    knitGauge:[11,11], knitRowGauge:[14,14],
    crochetGauge:[8,8], crochetRowGauge:[9,9],
    needleSize:'US 11 / 8 mm', hookSize:'US L-11 / 8 mm',
    sourceUrl:'https://www.yarnspirations.com/products/caron-anniversary-cakes-yarn-1000g-35-3oz-discontinued-shades-1',
    productUrl:'https://www.yarnspirations.com/products/caron-anniversary-cakes-yarn-1000g-35-3oz-discontinued-shades-1',
    imagePage:'https://www.yarnspirations.com/products/caron-anniversary-cakes-yarn-1000g-35-3oz-discontinued-shades-1',
    image:'https://www.yarnspirations.com/cdn/shop/files/29104747001-2-HRS.jpg?v=1689819750&width=600',
    imageVerified:true, manualVerified:true
  }]
]);
for (const [k, facts] of VERIFIED_FACTS) {
  const group = groups.get(k) || [];
  if (!group.length) throw new Error(`Refusing rebuild: verified yarn is absent from source catalogs: ${k}`);
  group.push({ ...group[0], ...facts });
  groups.set(k, group);
}

const WEIGHT_ALIASES = [
  ['Jumbo', /\bjumbo\b/i], ['Super Bulky', /\bsuper\s*bulky\b|\bsuper\s*chunky\b/i],
  ['Bulky', /\bbulky\b|\bchunky\b/i], ['Aran', /\baran\b|\bheavy\s*worsted\b/i],
  ['Worsted', /\bworsted\b|\bmedium\b/i], ['DK', /\bdk\b|\bdouble\s*knit/i],
  ['Sport', /\bsport\b|\bfine\b/i], ['Fingering', /\bfingering\b|\bsock\b|\b4\s*ply\b|\bsuperfine\b/i],
  ['Lace', /\blace\b|\b2\s*ply\b/i]
];
const CYC_TO_WEIGHT = {0:'Lace',1:'Fingering',2:'Sport',3:'DK',4:'Worsted',5:'Bulky',6:'Super Bulky',7:'Jumbo'};
function numericGauge(value) {
  if (Array.isArray(value)) {
    const n=value.map(Number).filter(Number.isFinite); return n.length ? n.reduce((a,b)=>a+b,0)/n.length : null;
  }
  if (plainObject(value)) {
    const n=Number(value.stitches ?? value.sts ?? value.gauge); return Number.isFinite(n)?n:null;
  }
  const m=text(value).match(/(\d+(?:\.\d+)?)/); return m?Number(m[1]):null;
}
function parseMm(value) {
  const m=[...text(value).matchAll(/(\d+(?:\.\d+)?)\s*mm\b/ig)].map(x=>Number(x[1])).filter(Number.isFinite);
  return m.length ? m.reduce((a,b)=>a+b,0)/m.length : null;
}
function inferWeight(item) {
  const raw=text(item.weight || item.manufacturerWeight);
  for (const [name,re] of WEIGHT_ALIASES) if (re.test(raw)) return name;
  const cyc=Number(item.cycWeight); if (Number.isInteger(cyc) && CYC_TO_WEIGHT[cyc]) return CYC_TO_WEIGHT[cyc];
  const g=numericGauge(item.knitGauge) ?? numericGauge(item.crochetGauge);
  if (Number.isFinite(g)) {
    if (g>=33) return 'Lace'; if (g>=27) return 'Fingering'; if (g>=23) return 'Sport'; if (g>=21) return 'DK';
    if (g>=16) return 'Worsted'; if (g>=12) return 'Bulky'; if (g>=7) return 'Super Bulky'; return 'Jumbo';
  }
  const mm=parseMm(item.needleSize || item.hookSize);
  if (Number.isFinite(mm)) {
    if (mm<=2.25) return 'Lace'; if (mm<=3.25) return 'Fingering'; if (mm<=3.75) return 'Sport'; if (mm<=4.5) return 'DK';
    if (mm<=5.5) return 'Worsted'; if (mm<=8) return 'Bulky'; if (mm<=12.75) return 'Super Bulky'; return 'Jumbo';
  }
  return '';
}

function mergeGroup(group) {
  const ranked=[...group].sort((a,b)=>recordScore(b)-recordScore(a));
  const best=ranked[0] || group[0];
  const merged={...best};
  for (const field of IMPORTANT_FIELDS) {
    const v=chooseValue(ranked, field); if (v!==undefined) merged[field]=v;
  }
  const sourceUrl=chooseUrl(ranked,['productUrl','sourceUrl','imagePage','imageSourceUrl','url']);
  const imagePage=chooseUrl(ranked,['imagePage','productUrl','sourceUrl','imageSourceUrl','url']);
  const productUrl=chooseUrl(ranked,['productUrl','sourceUrl','imagePage','url']);
  if (sourceUrl) merged.sourceUrl=sourceUrl;
  if (imagePage) merged.imagePage=imagePage;
  if (productUrl && !genericPage(productUrl)) merged.productUrl=productUrl;
  const imageRecord=ranked.find(i=>i.imageVerified===true && hasValue(i.image)) ||
    ranked.find(i=>hasValue(i.image) && !genericPage(i.imagePage||i.productUrl||i.sourceUrl)) || ranked.find(i=>hasValue(i.image));
  if (imageRecord) { merged.image=imageRecord.image; if (imageRecord.imageVerified===true) merged.imageVerified=true; }

  // Conversions are mathematical, not invented label specs.
  if (!hasValue(merged.grams) && hasValue(merged.ounces)) merged.grams=Math.round(Number(merged.ounces)*28.3495);
  if (!hasValue(merged.ounces) && hasValue(merged.grams)) merged.ounces=Math.round((Number(merged.grams)/28.3495)*10)/10;
  if (!hasValue(merged.yards) && hasValue(merged.meters)) merged.yards=Math.round(Number(merged.meters)*1.09361);
  if (!hasValue(merged.meters) && hasValue(merged.yards)) merged.meters=Math.round(Number(merged.yards)/1.09361);

  // Weight may be inferred only from actual gauge/tool evidence, and is explicitly marked.
  if (!hasValue(merged.weight)) {
    const inferred=inferWeight(merged);
    if (inferred) { merged.weight=inferred; merged.weightEstimated=true; }
  }

  merged._sourceRecordCount=group.length;
  merged.needsVerification = !hasValue(merged.weight) || !hasValue(merged.yards) || !hasValue(merged.grams) ||
    (!hasValue(merged.knitGauge) && !hasValue(merged.crochetGauge)) ||
    (!hasValue(merged.needleSize) && !hasValue(merged.hookSize));
  delete merged.catalogOnly;
  delete merged.placeholderRecord;
  delete merged.catalogFamilyEntry;
  return merged;
}

const master=[...groups.values()].map(mergeGroup)
  .sort((a,b)=>text(a.brand).localeCompare(text(b.brand)) || text(a.name).localeCompare(text(b.name)));
const masterKeys=master.map(keyFor);
const duplicateKeys=masterKeys.filter((k,i,a)=>a.indexOf(k)!==i);
const brandCount=new Set(master.map(y=>normalize(y.brand))).size;
const baselineCatalog=Array.isArray(sandbox.YARN_CATALOG) ? sandbox.YARN_CATALOG.filter(looksLikeYarn) : [];
const baselineKeys=new Set(baselineCatalog.map(keyFor));
const baselineBrands=new Set(baselineCatalog.map(y=>normalize(y.brand)));

const REQUIRED_SPOTS = [
  'caron|anniversary cakes','berroco|vintage','koigu|kpppm','kelbourne woolens|germantown',
  'jody long|ciao','lion brand|24 7 cotton','lopi|lettlopi','quince and co|osprey',
  'drops|alpaca','plymouth yarn|encore worsted','cascade yarns|cascade 220','knit picks|palette',
  'mainstays|medium acrylic'
];
const present=new Set(masterKeys);
const missingSpots=REQUIRED_SPOTS.filter(k=>!present.has(k));
const anniversary=master.find(y=>keyFor(y)==='caron|anniversary cakes');
const vintage=master.find(y=>keyFor(y)==='berroco|vintage');

const report={
  mode: WRITE?'write':'check',
  generatedAt:new Date().toISOString(),
  loadedFiles:DATA_FILES.filter(exists),
  loadErrors,
  baseCatalogPatternCount:baseCatalogPatterns.length,
  baselineIntegratedYarnCount:baselineKeys.size,
  baselineIntegratedBrandCount:baselineBrands.size,
  candidateGroupCount:groups.size,
  masterYarnCount:master.length,
  masterBrandCount:brandCount,
  needsVerificationCount:master.filter(y=>y.needsVerification).length,
  duplicateKeyCount:duplicateKeys.length,
  missingSpotChecks:missingSpots,
  exactChecks:{
    anniversaryCakes:Boolean(anniversary && anniversary.weight==='Super Bulky' && Number(anniversary.yards)===1061 && Number(anniversary.grams)===1000 && Number(anniversary.knitGauge?.[0])===11),
    berrocoVintage:Boolean(vintage && normalize(vintage.weight).includes('worsted') && Number(vintage.yards)===218 && Number(vintage.grams)===100),
    noUndefinedWeightString:!master.some(y=>String(y.weight).toLowerCase()==='undefined')
  }
};

// Fail CLOSED before writing anything.
if (master.length < baselineKeys.size) throw new Error(`Refusing rebuild: master shrank below current integrated yarn count (${master.length} < ${baselineKeys.size}).`);
if (brandCount < baselineBrands.size) throw new Error(`Refusing rebuild: master shrank below current integrated brand count (${brandCount} < ${baselineBrands.size}).`);
if (master.length < 1000 || brandCount < 50) throw new Error(`Refusing rebuild: full-site floor not met (${master.length} yarns / ${brandCount} brands).`);
if (duplicateKeys.length) throw new Error(`Refusing rebuild: duplicate Brand + Yarn keys remain (${duplicateKeys.slice(0,10).join(', ')}).`);
if (missingSpots.length) throw new Error(`Refusing rebuild: major-brand spot checks missing: ${missingSpots.join(', ')}`);
if (!report.exactChecks.anniversaryCakes) throw new Error('Refusing rebuild: Caron Anniversary Cakes verified specs failed.');
if (!report.exactChecks.berrocoVintage) throw new Error('Refusing rebuild: Berroco Vintage verified specs failed.');
if (!report.exactChecks.noUndefinedWeightString) throw new Error('Refusing rebuild: undefined weight string leaked into master.');
if (baseCatalogPatterns.length < 1) throw new Error('Refusing rebuild: catalog.js pattern array was not captured.');

if (!WRITE) {
  console.log(JSON.stringify(report,null,2));
  console.log('CHECK PASSED — no files changed. Re-run with --write to generate migration files.');
  process.exit(0);
}

const yarnHeader=`// Garn Swatch — CLEAN MASTER YARN CATALOG\n// One live record per Brand + Yarn.\n// Published fields are preserved from source records; mathematical conversions are allowed;\n// inferred weight is marked weightEstimated; missing technical data remains missing.\n// Generated: ${new Date().toISOString()}\n\n`;
fs.writeFileSync(path.join(ROOT,'master-yarns.js'), yarnHeader+`window.MASTER_YARN_CATALOG = ${JSON.stringify(master,null,2)};\n`);
fs.writeFileSync(path.join(ROOT,'master-yarns-needs-verification.json'), JSON.stringify({
  generatedAt:new Date().toISOString(),
  count:master.filter(y=>y.needsVerification).length,
  records:master.filter(y=>y.needsVerification).map(y=>({brand:y.brand,name:y.name,sourceUrl:y.sourceUrl||'',weight:y.weight||'',yards:y.yards??null,grams:y.grams??null}))
},null,2)+'\n');
fs.writeFileSync(path.join(ROOT,'pattern-catalog.js'), `// Garn Swatch — patterns formerly stored in catalog.js\nwindow.PATTERN_CATALOG = ${JSON.stringify(baseCatalogPatterns,null,2)};\n`);

if (!exists('app.js')) throw new Error('app.js missing after preflight.');
let app=read('app.js');
const yarnStart=app.indexOf('const yarns = dedupeYarns([');
const patternStart=app.indexOf('const patterns =',yarnStart);
if (yarnStart===-1 || patternStart===-1) throw new Error('Could not locate app.js yarn source block; no app changes written.');
const cleanSource=`const yarnSourceCatalog = Array.isArray(window.MASTER_YARN_CATALOG)\n    ? [\n        ...window.MASTER_YARN_CATALOG,\n        ...(window.YARN_CATALOG || []).filter((yarn) => yarn && (yarn.brand === "Other / Yarn Tag" || yarn.status === "custom"))\n      ]\n    : [\n        ...(window.YARN_CATALOG || []),\n        ...(window.KFI_YARN_CATALOG || []),\n        ...(window.KNIT_PICKS_YARN_CATALOG || []).filter((yarn) => yarn.yards > 0 && yarn.grams > 0),\n        ...(window.YARN_IMAGE_CATALOG || []),\n        ...(window.KELBOURNE_FAMILY_YARN_CATALOG || []),\n        ...(window.BERROCO_FAMILY_YARN_CATALOG || []),\n        ...(window.AUTO_YARN_CATALOG || [])\n      ];\n  const yarns = dedupeYarns([...yarnSourceCatalog]);\n  `;
app=app.slice(0,yarnStart)+cleanSource+app.slice(patternStart);

if (!exists('index.html')) throw new Error('index.html missing after preflight.');
let html=read('index.html');
html=html.replace(/\s*<script src="catalog\.js"><\/script>/, `\n  <script src="pattern-catalog.js"></script>\n  <script src="master-yarns.js"></script>`);
html=html.replace(/\s*<script src="catalog-quality-merge\.js"><\/script>/g,'');
if (!html.includes('master-yarns.js') || html.includes('<script src="catalog.js"></script>')) throw new Error('index.html migration edit did not apply cleanly.');

fs.writeFileSync(path.join(ROOT,'app.js'),app);
fs.writeFileSync(path.join(ROOT,'index.html'),html);
fs.writeFileSync(path.join(ROOT,'clean-yarn-migration-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
console.log('WRITE PASSED — migration files generated.');
