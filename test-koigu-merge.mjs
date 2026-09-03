import fs from 'node:fs/promises'; import vm from 'node:vm';
const sandbox={window:{YARN_IMAGE_CATALOG:[{brand:'Berroco',name:'Vintage',image:'keep-me'}]}}; vm.createContext(sandbox);
vm.runInContext(await fs.readFile(new URL('./koigu-yarn-update.js', import.meta.url),'utf8'),sandbox);
const w=sandbox.window;
console.log({berrocoKept:w.YARN_IMAGE_CATALOG.some(x=>x.brand==='Berroco'&&x.image==='keep-me'),koigu:w.YARN_IMAGE_CATALOG.filter(x=>x.brand==='Koigu').length,total:w.YARN_IMAGE_CATALOG.length});
if(!w.YARN_IMAGE_CATALOG.some(x=>x.brand==='Berroco'&&x.image==='keep-me')) process.exit(1);
