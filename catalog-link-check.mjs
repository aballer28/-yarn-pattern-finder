import fs from "node:fs/promises";
import vm from "node:vm";

const html = await fs.readFile("index.html","utf8");
const scripts=[...html.matchAll(/<script\s+src=["']([^"']+)["']/gi)].map(m=>m[1]).filter(x=>!/^https?:/i.test(x));
const sandbox={window:{addEventListener(){}},console,URL,URLSearchParams,setTimeout,clearTimeout};
vm.createContext(sandbox);
for(const f of scripts){
  try{ vm.runInContext(await fs.readFile(f,"utf8"),sandbox,{filename:f,timeout:60000}); }catch{}
}
const w=sandbox.window;
const items=[];
const seen=new Set();
function add(kind,name,url){
  url=String(url||"");
  if(!/^https?:\/\//i.test(url)||seen.has(url)) return;
  seen.add(url); items.push({kind,name,url});
}
for(const [k,list] of Object.entries(w)){
  if(!Array.isArray(list)) continue;
  if(/YARN/i.test(k)) for(const y of list||[]) if(y&&y.brand&&y.name){
    add("yarn",`${y.brand}|${y.name}`,y.productUrl||y.sourceUrl||y.url);
    if(/^https?:\/\//i.test(String(y.image||""))) add("yarn-image",`${y.brand}|${y.name}`,y.image);
  }
  if(/PATTERN|DESIGN/i.test(k)) for(const p of list||[]) if(p&&p.name){
    add("pattern",p.name,p.patternUrl||p.url||p.pdfUrl||p.ravelryUrl||p.sourceUrl);
    if(/^https?:\/\//i.test(String(p.image||""))) add("pattern-image",p.name,p.image);
  }
}

const timeoutMs=8000;
async function check(item){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    let res=await fetch(item.url,{method:"HEAD",redirect:"follow",signal:controller.signal,headers:{"user-agent":"Garn-Swatch-Link-Audit/1.0"}});
    if([403,405,406].includes(res.status)){
      res=await fetch(item.url,{method:"GET",redirect:"follow",signal:controller.signal,headers:{"user-agent":"Garn-Swatch-Link-Audit/1.0","range":"bytes=0-2048"}});
    }
    return {...item,status:res.status,ok:res.ok,finalUrl:res.url,redirected:res.redirected,contentType:res.headers.get("content-type")||""};
  }catch(error){
    return {...item,status:0,ok:false,networkError:String(error?.name||error)};
  }finally{clearTimeout(timer);}
}
async function pool(values,n){
  let i=0; const out=new Array(values.length);
  await Promise.all(Array.from({length:Math.min(n,values.length||1)},async()=>{
    while(true){const j=i++; if(j>=values.length)return; out[j]=await check(values[j]);}
  }));
  return out;
}
const results=await pool(items,16);
const confirmedBroken=results.filter(r=>[404,410].includes(r.status));
const wrongImageContent=results.filter(r=>/-image$/.test(r.kind)&&r.ok&&!/^image\//i.test(r.contentType));
const report={
  generatedAt:new Date().toISOString(),checked:results.length,
  confirmedBroken,wrongImageContent,
  redirects:results.filter(r=>r.redirected).map(({kind,name,url,finalUrl,status})=>({kind,name,url,finalUrl,status})),
  networkOrBlocked:results.filter(r=>r.status===0||[401,403,429].includes(r.status)).map(({kind,name,url,status,networkError})=>({kind,name,url,status,networkError})),
  statusCounts:Object.fromEntries([...new Set(results.map(r=>r.status))].sort((a,b)=>a-b).map(s=>[s,results.filter(r=>r.status===s).length]))
};
await fs.writeFile("catalog-link-report.json",JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({checked:report.checked,broken:confirmedBroken.length,wrongImageContent:wrongImageContent.length,blocked:report.networkOrBlocked.length,statusCounts:report.statusCounts},null,2));
// Fail only for confirmed 404/410 exact resources, not sites that block bots.
if(confirmedBroken.length||wrongImageContent.length) process.exitCode=2;
