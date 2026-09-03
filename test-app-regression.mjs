import fs from 'node:fs/promises'; import vm from 'node:vm';
const sandbox={window:{},console,URL,URLSearchParams,setTimeout,clearTimeout}; vm.createContext(sandbox);
Object.assign(sandbox.window,{
 YARN_CATALOG:[
  {brand:'Quince & Co.',name:'Cormo',weight:'Worsted',yards:200,grams:100,knitGauge:[18,20],fiber:'100% wool'},
  {brand:'Test',name:'Boucle',weight:'Worsted',yards:200,grams:100,knitGauge:[18,20],fiber:'100% wool',construction:'boucle'},
  {brand:'Test',name:'Plain',weight:'Worsted',yards:200,grams:100,knitGauge:[18,20],fiber:'100% wool'}
 ],
 EXTERNAL_PATTERN_CATALOG:[
  {name:'Hat',sourceBrand:'Test Designer',designer:'Test Designer',craft:'knit',usedYarns:['Quince & Co.|Cormo'],url:'https://example.com/pattern/hat-one'},
  {name:'Hat',sourceBrand:'Test Designer',designer:'Test Designer',craft:'knit',usedYarns:['Quince & Co.|Cormo'],url:'https://example.com/pattern/hat-two'}
 ], PATTERN_CATALOG:[]
});
vm.runInContext(await fs.readFile(new URL('./catalog-audit-repair.js', import.meta.url),'utf8'),sandbox);
vm.runInContext(await fs.readFile(new URL('./app.js', import.meta.url),'utf8'),sandbox);
const yf=sandbox.window.YarnFirst;
const tests={
 genericPatternsStaySeparate:yf.allPatternCatalog.filter(p=>p.name==='Hat').length===2,
 estimatedGaugeNoPoints:yf.gaugeCompatibilityPoints({gauge:20,craft:'knit'},{weight:'DK',knitGauge:[20,20],knitGaugeEstimated:true})===0,
 cormoAliasExact:yf.rankedPatternMatch({name:'Alias',craft:'knit',inferredProject:'Hat',usedYarns:['Stone Wool|Cormo']},{brand:'Quince & Co.',name:'Cormo',weight:'Worsted'}).score===100,
 skeinsRoundUp:yf.skeinCount(401,{yards:200},0)===3,
 skeinsBuffer:yf.skeinCount(400,{yards:200},.10)===3,
 heldTogetherExact:yf.rankedPatternMatch(
   {name:'Held',craft:'knit',usedYarns:['Quince & Co.|Cormo','Test|Mohair'],heldTogether:true,strandCount:2},
   [{brand:'Quince & Co.',name:'Cormo',weight:'Worsted'},{brand:'Test',name:'Mohair',weight:'Lace'}]
 ).score===100,
 heldTogetherUnconfirmedNotExact:yf.rankedPatternMatch(
   {name:'Colorwork',craft:'knit',usedYarns:['Quince & Co.|Cormo','Test|Mohair']},
   [{brand:'Quince & Co.',name:'Cormo',weight:'Worsted'},{brand:'Test',name:'Mohair',weight:'Lace'}]
 ).score<100,
 heldTogetherNoFakeWeightPoints:yf.weightCompatibilityPoints(
   {name:'Sub',craft:'knit',weight:'Worsted'},
   [{brand:'A',name:'One',weight:'Fingering'},{brand:'B',name:'Two',weight:'Lace'}]
 )===0,
 constructionMismatchPenalized:yf.rankedPatternMatch(
   {name:'Boucle Sub',craft:'knit',weight:'Worsted',gauge:19,usedYarns:['Test|Boucle']},
   {brand:'Test',name:'Plain',weight:'Worsted',knitGauge:[18,20],fiber:'100% wool'}
 ).fiberPenalty===15,
 collectionNotPrimary:yf.patternPrimaryUrl({url:'https://example.com/collections/all-patterns'})==='',
 exactPatternPrimary:yf.patternPrimaryUrl({url:'https://example.com/products/my-pattern'})==='https://example.com/products/my-pattern',
 distributorDesignerHidden:yf.customerDesigner({designer:'Knitting Fever'})==='',
 yarnspirationsDesignerHidden:yf.customerDesigner({designer:'Yarnspirations'})===''
};
console.log(tests); if(Object.values(tests).some(v=>!v)) process.exit(1);
