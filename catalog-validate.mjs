import fs from "node:fs/promises";
import vm from "node:vm";

const INDEX = "index.html";
const html = await fs.readFile(INDEX, "utf8");
const scripts = [...html.matchAll(/<script\s+src=["']([^"']+)["']/gi)]
  .map((m) => m[1]).filter((x) => !/^https?:/i.test(x));

const missingScripts = [];
for (const file of scripts) {
  try { await fs.access(file); } catch { missingScripts.push(file); }
}

const sandbox = { window: { addEventListener() {} }, console, URL, URLSearchParams, setTimeout, clearTimeout };
vm.createContext(sandbox);
const loadErrors = [];
for (const file of scripts) {
  try {
    const code = await fs.readFile(file, "utf8");
    vm.runInContext(code, sandbox, { filename: file, timeout: 60000 });
  } catch (error) {
    loadErrors.push({ file, error: String(error.message || error) });
  }
}

const win = sandbox.window;
const norm = (v) => String(v || "").normalize("NFKD").toLowerCase()
  .replace(/[\u0300-\u036f]/g, "").replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const allYarns = [];
const allPatterns = [];
for (const [key, list] of Object.entries(win)) {
  if (!Array.isArray(list)) continue;
  if (/YARN/i.test(key)) for (const x of list) if (isObj(x) && x.brand && x.name && !x.usedYarns) allYarns.push(x);
  if (/PATTERN|DESIGN/i.test(key)) for (const x of list) if (isObj(x) && x.name && (x.usedYarns || x.craft || x.designer || x.sourceBrand)) allPatterns.push(x);
}
const yarns = Array.isArray(win.GARN_SWATCH_AUDIT_YARNS) ? win.GARN_SWATCH_AUDIT_YARNS : allYarns;
const patterns = [...allPatterns, ...(win.GARN_SWATCH_AUDIT_PATTERNS || [])];

const id = (y) => win.GARN_SWATCH_AUDIT?.yarnIdentity
  ? win.GARN_SWATCH_AUDIT.yarnIdentity(y)
  : `${norm(y.brand)}|${norm(y.name)}`;
const yarnIds = new Set(yarns.map(id));
const genericRe = /\/(?:collections?|patterns?|designs?|products?)\/?(?:[?#].*)?$/i;
const directRavelryRe = /^https:\/\/(?:www\.)?ravelry\.com\/patterns\/library\/[^/?#]+/i;

const duplicateMap = new Map();
const baseIdentityMap = new Map();
const putupId = (y) => win.GARN_SWATCH_AUDIT?.putupIdentity
  ? win.GARN_SWATCH_AUDIT.putupIdentity(y)
  : `${id(y)}|${Number(y.grams)||0}|${Number(y.yards)||0}`;
for (const y of yarns) {
  const exactKey = putupId(y);
  const exact = duplicateMap.get(exactKey) || [];
  exact.push(y);
  duplicateMap.set(exactKey, exact);

  const baseKey = id(y);
  const base = baseIdentityMap.get(baseKey) || [];
  base.push(y);
  baseIdentityMap.set(baseKey, base);
}
const orphanRefs=[];
const zeroExact=new Map([...yarnIds].map(k=>[k,0]));
const genericPatternUrls=[];
const genericRavelry=[];
const invalidCraft=[];
const invalidRenderedValues=[];
const heldTogetherProblems=[];

for (const p of patterns) {
  const craft=String(p.craft||"").toLowerCase();
  if (craft && !["knit","crochet"].includes(craft)) invalidCraft.push({pattern:p.name,craft:p.craft});
  for (const ref of p.usedYarns||[]) {
    const k=win.GARN_SWATCH_AUDIT?.yarnIdentity ? win.GARN_SWATCH_AUDIT.yarnIdentity(ref) : norm(ref);
    if (yarnIds.has(k)) zeroExact.set(k,(zeroExact.get(k)||0)+1);
    else orphanRefs.push({pattern:p.name,yarn:ref});
  }
  const u=String(p.patternUrl||p.url||p.sourceUrl||"");
  if (u && genericRe.test(u)) genericPatternUrls.push({pattern:p.name,url:u});
  const rav=String(p.ravelryUrl||"");
  if (rav && /ravelry\.com/i.test(rav) && !directRavelryRe.test(rav)) genericRavelry.push({pattern:p.name,url:rav});
  if (p.heldTogether && (p.usedYarns||[]).length < 1) heldTogetherProblems.push({pattern:p.name,problem:"heldTogether without yarn reference"});
  if (Number(p.strandCount)>1 && !p.heldTogether) heldTogetherProblems.push({pattern:p.name,problem:"strandCount > 1 but heldTogether false/missing"});
}
for (const item of [...yarns,...patterns]) {
  for (const [key,value] of Object.entries(item)) {
    if (typeof value === "string" && /^(?:undefined|null|nan|infinity)$/i.test(value.trim())) {
      invalidRenderedValues.push({item:item.name,key,value});
    }
  }
}

const regression=[];
function check(name, condition, details="") { regression.push({name,pass:Boolean(condition),details}); }
const yf=win.YarnFirst;
if (yf) {
  check("estimated yarn gauge is not strong evidence",
    yf.gaugeCompatibilityPoints({gauge:20,craft:"knit"},{weight:"DK",knitGauge:[20,20],knitGaugeEstimated:true})===0);
  const cormo={brand:"Quince & Co.",name:"Cormo",weight:"Worsted",knitGauge:null};
  const cormoPattern={name:"Alias Test",craft:"knit",inferredProject:"Hat",usedYarns:["Stone Wool|Cormo"]};
  check("Quince/Stone Wool Cormo alias stays exact",yf.rankedPatternMatch(cormoPattern,cormo).score===100);
  check("skein calculator rounds up",yf.skeinCount(401,{yards:200},0)===3);
  check("skein calculator includes buffer",yf.skeinCount(400,{yards:200},0.10)===3);
  check("unknown pattern date remains unknown",yf.patternRecencyValue({sourceId:"99999999",name:"No Date"})===null);
  const y1={brand:"Lise Tailor",name:"Fingering Merino",weight:"Fingering",yards:191,knitGauge:[26,30]};
  const y2={brand:"Lise Tailor",name:"Silk Mohair",weight:"Lace",yards:230,knitGauge:null};
  const held={name:"Held Test",craft:"knit",inferredProject:"Sweater",usedYarns:["Lise Tailor|Fingering Merino","Lise Tailor|Silk Mohair"],heldTogether:true,strandCount:2};
  check("confirmed two-yarn pattern can be exact",yf.rankedPatternMatch(held,[y1,y2]).score===100);
  const unconfirmed={...held,heldTogether:false,strandCount:1};
  check("unconfirmed two-yarn relationship is not exact",yf.rankedPatternMatch(unconfirmed,[y1,y2]).score<100);
  check("held-together selection does not fake weight points",yf.weightCompatibilityPoints(held,[y1,y2]).points===0);
}
const requiredCurrentYarns = {
  "Lise Tailor": ["Fingering Merino","Silk Mohair","Silk Merino","Cumulus","Aube","Filena"],
  "UK Alpaca": ["Superfine Alpaca 4-Ply","Suri Alpaca 4-Ply","Superfine Alpaca DK","Superfine Alpaca Chunky"],
  "Purl Soho": ["Morning","June Worsted","Quartz","Sketchbook Cotton"],
  "Kelbourne Woolens": ["Camper","Cozy","Cricket","Erin","Germantown","Germantown DK","Harmony","Keystone","Lucky Tweed","Mojave","Perennial","Scout","Skipper"],
  "Quince & Co.": ["Chickadee","Kestrel","Osprey","Owl","Finch","Puffin","Puffin Speckled","Phoebe","Tern","Owlet","Dove","Piper","Starling","Sparrow","Wren","Willet","Lark","Whimbrel","Plover","Hawk","Not Quite Lark","Cormo"],
  "Berroco": ["Stratto","Nuvola","Merino 401 Chunky","Brina","Biella","Remix Wool DK","Remix Wool","Modern Comfort","Cashmello","Aerial Dégradé","Aurelia","Gianna","Vellina","Mirelle","Emberstone","Vintage Handpaint","Vintage Sock Handpaint","Vera","Paperie","Iris"],
  "Koigu": ["KPPPM","KPM","Lace","Jasmine","Kersti","Chelsea","Othello","Aura","Sofie","Masham","Corriedale/Gotland","Cheers","Winnie","Andra"]
};
for (const [brand,names] of Object.entries(requiredCurrentYarns)) {
  const actual = new Set(yarns.filter(y=>norm(y.brand)===norm(brand) && !y.discontinued).map(y=>norm(y.name)));
  const missing = names.filter(name=>!actual.has(norm(name)));
  check(`current ${brand} audit list is represented`,missing.length===0,missing.join(", "));
}
if (Array.isArray(win.KFI_PATTERN_INDEX)) {
  check("Knitting Fever full index is not a tiny subset",win.KFI_PATTERN_INDEX.length>=14000,`count=${win.KFI_PATTERN_INDEX.length}`);
}

const current = yarns.filter(y=>!y.discontinued && !/^discontinued$/i.test(String(y.status||"")));
const discontinued = yarns.filter(y=>y.discontinued || /^discontinued$/i.test(String(y.status||"")));
const unverifiedStatus = yarns.filter(y=>/unverified/i.test(String(y.status||"")));
const missingPublishedKnitGauge = yarns.filter(y=>!y.knitGauge || y.knitGaugeEstimated).map(y=>`${y.brand}|${y.name}`);
const missingPublishedCrochetGauge = yarns.filter(y=>!y.crochetGauge || y.crochetGaugeEstimated).map(y=>`${y.brand}|${y.name}`);
const resolverImages = yarns.filter(y=>/^\/api\/yarn-image\?/i.test(String(y.image||""))).length;
const directYarnImages = yarns.filter(y=>/^https?:\/\//i.test(String(y.image||""))).length;
const directPatternImages = patterns.filter(p=>/^https?:\/\//i.test(String(p.image||""))).length;
const resolverPatternImages = patterns.filter(p=>/^\/api\/yarn-image\?/i.test(String(p.image||""))).length;

const report={
  generatedAt:new Date().toISOString(),
  status:"AUDIT_DIAGNOSTICS_GENERATED",
  scripts:{count:scripts.length,missing:missingScripts,loadErrors},
  yarns:{
    count:yarns.length,current:current.length,discontinued:discontinued.length,
    unverifiedStatus:unverifiedStatus.map(y=>`${y.brand}|${y.name}`),
    missingWeight:yarns.filter(y=>!y.weight).map(y=>`${y.brand}|${y.name}`),
    missingYardage:yarns.filter(y=>!(Number(y.yards)>0||Number(y.meters)>0)).map(y=>`${y.brand}|${y.name}`),
    missingGrams:yarns.filter(y=>!(Number(y.grams)>0)).map(y=>`${y.brand}|${y.name}`),
    missingPublishedKnitGauge,missingPublishedCrochetGauge,
    missingImage:yarns.filter(y=>!y.image).map(y=>`${y.brand}|${y.name}`),
    imageSources:{direct:directYarnImages,resolver:resolverImages,placeholderEligible:yarns.length-directYarnImages-resolverImages},
    duplicateIdentities:[...duplicateMap.entries()].filter(([,a])=>a.length>1).map(([key,values])=>({
      key,count:values.length,putups:values.map(v=>({grams:v.grams||null,yards:v.yards||null,name:v.name}))
    })),
    multiplePutups:[...baseIdentityMap.entries()]
      .map(([key,values])=>({key,values,putupKeys:[...new Set(values.map(putupId))]}))
      .filter((entry)=>entry.putupKeys.length>1)
      .map(({key,values})=>({
        key,count:values.length,putups:values.map(v=>({grams:v.grams||null,yards:v.yards||null,name:v.name}))
      }))
  },
  patterns:{
    count:patterns.length,
    knit:patterns.filter(p=>String(p.craft).toLowerCase()==="knit").length,
    crochet:patterns.filter(p=>String(p.craft).toLowerCase()==="crochet").length,
    missingCraft:patterns.filter(p=>!p.craft).map(p=>p.name),
    invalidCraft,orphanYarnReferences:orphanRefs,
    collectionPageUrlRisks:genericPatternUrls,
    nonDirectRavelryLinks:genericRavelry,
    missingExactUrl:patterns.filter(p=>{
      const urls=[p.patternUrl,p.url,p.pdfUrl,p.ravelryUrl,p.sourceUrl].filter(Boolean);
      return !urls.some(u=>!genericRe.test(String(u)));
    }).map(p=>p.name),
    missingImage:patterns.filter(p=>!p.image).map(p=>p.name),
    imageSources:{direct:directPatternImages,resolver:resolverPatternImages,placeholderEligible:patterns.length-directPatternImages-resolverPatternImages},
    missingRecordedGauge:patterns.filter(p=>!p.gauge&&!p.gaugeText&&!p.gaugeOriginal).map(p=>p.name),
    heldTogetherProblems
  },
  zeroExactPatternYarns:[...zeroExact.entries()].filter(([,n])=>n===0).map(([k])=>k),
  invalidRenderedValues,
  runtimeAuditDiagnostics:win.GARN_SWATCH_AUDIT?.diagnostics||null,
  regression
};
await fs.writeFile("catalog-audit-report.json",JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({
  yarns:report.yarns.count,patterns:report.patterns.count,
  orphanRefs:orphanRefs.length,duplicateIdentities:report.yarns.duplicateIdentities.length,
  zeroExact:report.zeroExactPatternYarns.length,collectionRisks:genericPatternUrls.length,
  invalidCraft:invalidCraft.length,heldTogetherProblems:heldTogetherProblems.length,
  loadErrors:loadErrors.length,regressionFailures:regression.filter(x=>!x.pass).length
},null,2));

if (missingScripts.length || loadErrors.length || invalidRenderedValues.length || regression.some(x=>!x.pass)) process.exitCode=2;
