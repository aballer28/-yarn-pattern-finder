import fs from 'node:fs/promises'; import vm from 'node:vm';
const sandbox={window:{YARN_IMAGE_CATALOG:[{brand:'Berroco',name:'Vintage',image:'keep-me'}]}}; vm.createContext(sandbox);
vm.runInContext(await fs.readFile('/mnt/data/garn-complete-work/koigu-yarn-update.js','utf8'),sandbox);
const w=sandbox.window;
console.log({berrocoKept:w.YARN_IMAGE_CATALOG.some(x=>x.brand==='Berroco'&&x.image==='keep-me'),koigu:w.YARN_IMAGE_CATALOG.filter(x=>x.brand==='Koigu').length,total:w.YARN_IMAGE_CATALOG.length});
if(!w.YARN_IMAGE_CATALOG.some(x=>x.brand==='Berroco'&&x.image==='keep-me')) process.exit(1);
