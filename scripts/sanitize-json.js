const fs = require('fs');
const path = require('path');

function sanitizeContent(text){
  // remove /* ... */ comments
  let s = text.replace(/\/\*[\s\S]*?\*\//g, '');
  // remove // comments
  s = s.replace(/(^|\n)\s*\/\/.*(?=\n|$)/g, '\n');
  // remove trailing commas before } or ]
  s = s.replace(/,\s*(?=[}\]])/g, '');
  return s;
}

function tryFix(file){
  const raw = fs.readFileSync(file, 'utf8');
  try{
    JSON.parse(raw);
    return {fixed:false, ok:true};
  }catch(e){
    const cleaned = sanitizeContent(raw);
    try{
      const obj = JSON.parse(cleaned);
      fs.writeFileSync(file, JSON.stringify(obj, null, 2), 'utf8');
      return {fixed:true, ok:true};
    }catch(err){
      return {fixed:false, ok:false, error: err.message};
    }
  }
}

function main(args){
  const targets = args.length ? args : ['node_modules/@google/generative-ai/dist/tsdoc-metadata.json'];
  for(const t of targets){
    const p = path.resolve(t);
    if(!fs.existsSync(p)){
      console.error('Not found:', p);
      continue;
    }
    const r = tryFix(p);
    if(r.ok && r.fixed) console.log('Fixed JSON:', p);
    else if(r.ok) console.log('Valid JSON (no change):', p);
    else console.error('Could not fix:', p, 'error:', r.error);
  }
}

if(require.main === module) main(process.argv.slice(2));
