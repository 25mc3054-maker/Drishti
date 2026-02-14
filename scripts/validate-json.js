const fs = require('fs');
const path = require('path');
function walk(dir, arr){
  for(const f of fs.readdirSync(dir)){
    const p = path.join(dir, f);
    // skip node_modules to avoid third-party JSON files that may contain comments
    if (p.includes('node_modules')) continue;
    if (fs.statSync(p).isDirectory()) walk(p, arr);
    else if (p.endsWith('.json')) arr.push(p);
  }
}
const files = [];
walk(process.cwd(), files);
let ok = true;
for(const f of files){
  try{
    JSON.parse(fs.readFileSync(f,'utf8'));
  }catch(e){
    ok = false;
    console.error('ERROR', f, e.message);
  }
}
if(ok) console.log('All JSON files valid');
