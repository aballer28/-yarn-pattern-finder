import fs from 'node:fs/promises';
import vm from 'node:vm';
const sandbox={window:{}}; vm.createContext(sandbox);
sandbox.window.YARN_CATALOG=[
 {brand:'Stone Wool',name:'Cormo',weight:'Worsted',yards:200,grams:100},
 {brand:'Lise Tailor',name:'Merino',weight:'Fingering',yards:191,grams:50},
 {brand:'Atlantic Coast Yarns',name:'Skellig DK',weight:'DK',yards:220,grams:100}
];
sandbox.window.EXTRA_YARN_ARCHIVE=[{brand:'Test Brand',name:'Old Yarn',weight:'DK',status:'Discontinued',yards:100,grams:50}];
sandbox.window.LION_BRAND_YARN_FAMILIES=['Current Example'];
sandbox.window.LION_BRAND_LEGACY_YARN_FAMILIES=['Legacy Example'];
sandbox.window.YARNSPIRATIONS_YARN_FAMILIES={Bernat:['Blanket']};
sandbox.window.PATTERN_CATALOG=[{name:'Test Hat',craft:'knit',usedYarns:['Stone Wool|Cormo'],url:'https://example.com/pattern/test-hat'}];
sandbox.window.UNEXPECTED_DESIGN_CATALOG=[{name:'Hidden Design',craft:'knit',usedYarns:['Test Brand|Old Yarn'],sourceBrand:'Test Brand',url:'https://example.com/pattern/hidden'}];
vm.runInContext(await fs.readFile('/mnt/data/garn-complete-work/lise-tailor-catalog.js','utf8'),sandbox);
vm.runInContext(await fs.readFile('/mnt/data/garn-complete-work/uk-alpaca-catalog.js','utf8'),sandbox);
vm.runInContext(await fs.readFile('/mnt/data/garn-complete-work/catalog-audit-repair.js','utf8'),sandbox);
const w=sandbox.window;
const checks={
 cormo:w.YARN_CATALOG.some(y=>y.brand==='Quince & Co.'&&y.name==='Cormo'),
 lise:w.YARN_CATALOG.some(y=>y.brand==='Lise Tailor'&&y.name==='Fingering Merino'),
 skellig:w.YARN_CATALOG.some(y=>y.name==='Skellig DK'&&y.discontinued),
 legacy:w.YARN_CATALOG.some(y=>y.brand==='Lion Brand'&&y.name==='Legacy Example'&&y.discontinued),
 unexpectedYarn:w.YARN_CATALOG.some(y=>y.brand==='Test Brand'&&y.name==='Old Yarn'),
 unexpectedPattern:w.GARN_SWATCH_AUDIT_PATTERNS.some(p=>p.name==='Hidden Design'),
 normalizedRef:w.PATTERN_CATALOG[0].usedYarns[0]==='Quince & Co.|Cormo',
 liseCatalogCorrect:w.LISE_TAILOR_YARN_CATALOG.some(y=>y.name==='Filena'&&y.meters===180)&&w.LISE_TAILOR_PATTERN_CATALOG.some(p=>p.name==='Suzanne Top'),
 ukCatalogCorrect:w.UK_ALPACA_YARN_CATALOG.some(y=>y.name==='Superfine Alpaca Chunky'&&y.meters===50)&&w.UK_ALPACA_YARN_CATALOG.some(y=>y.name==='Baby Alpaca & Silk 4-Ply'&&y.meters===225)&&w.UK_ALPACA_YARN_CATALOG.some(y=>y.name==='Baby Alpaca & Silk DK'&&y.meters===112)&&!w.UK_ALPACA_YARN_CATALOG.some(y=>y.name==='Posh Socks'),
 koiguBlossom:w.YARN_CATALOG.some(y=>y.brand==='Koigu'&&y.name==='Blossom'&&y.status==='Current'&&y.meters===233),
 koiguAuraNotForcedCurrent:!w.YARN_CATALOG.some(y=>y.brand==='Koigu'&&y.name==='Aura'&&y.auditSeed&&y.status==='Current')
};
console.log(checks);
if(Object.values(checks).some(v=>!v)) process.exit(1);
