import {readdir,readFile,stat} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const root=path.resolve('dist');
async function walk(dir){return (await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?walk(path.join(dir,e.name)):path.join(dir,e.name)))).flat();}
const files=await walk(root);let errors=[];
for(const file of files.filter(p=>p.endsWith('.js'))){
 const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
 if(result.status!==0)errors.push(result.stderr);
}
const library=JSON.parse(await readFile(path.join(root,'books/index.json'),'utf8'));
if(library.books.length!==1||library.books[0].id!=='otto-shy-moon')errors.push('The edition must have exactly the first book.');
const html=await readFile(path.join(root,'index.html'),'utf8');
if(/data-lang="(?:fr|ja|es)"/.test(html))errors.push('Unexpected language in menu.');
if(/stripe|pricing-dialog|src\/analytics.js/i.test(html))errors.push('Unexpected payment or analytics entry.');
for(const lang of ['en','zh'])for(let page=1;page<=10;page++){
 const prefix=lang==='en'?'voice':`lang/${lang}/voice`;
 try{await stat(path.join(root,`books/otto-shy-moon/${prefix}/page-${page}.mp3`));}catch{errors.push(`Missing ${lang} narration page ${page}`);}
}
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log(`Checked ${files.length} files: syntax, single-book scope, bilingual narration, and removed payment entries.`);
