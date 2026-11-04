// EDEN ROUTER/MOBILE reproducible offline documentation integrity check.
// No repository writes, device operations, network access or third-party dependencies.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const paths=[];
function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(['.git','node_modules'].includes(entry.name))continue;
    const full=path.join(dir,entry.name);
    if(entry.isDirectory())walk(full);
    else if(/\.(?:md|txt)$/.test(entry.name))paths.push(full);
  }
}
walk(root);
const failures=[];let links=0;
for(const file of paths){
  const text=fs.readFileSync(file,'utf8'),rel=path.relative(root,file).split(path.sep).join('/');
  if(text.includes('\0'))failures.push(rel+': NUL byte in markdown/text file');
  if(/nicht verifiziert\/noch anzulegen/i.test(text))failures.push(rel+': stale repository status');
  for(const match of text.matchAll(/\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g)){
    const url=match[1];
    if(/^(?:https?:|mailto:|#|data:|\/\/)/i.test(url))continue;
    const target=url.split(/[?#]/)[0];if(!target)continue;
    links++;
    const resolved=path.resolve(path.dirname(file),target);
    if(!resolved.startsWith(root+path.sep)&&resolved!==root)failures.push(rel+': path escape '+url);
    else if(!fs.existsSync(resolved))failures.push(rel+': broken link '+url);
  }
}
if(failures.length){
  console.error(failures.join('\n'));
  console.error('EDEN documentation integrity FAIL ('+failures.length+' issues)');
  process.exitCode=1;
}else{
  console.log('EDEN documentation integrity PASS: '+paths.length+' source docs, '+links+' local links, no NUL/stale status.');
}
