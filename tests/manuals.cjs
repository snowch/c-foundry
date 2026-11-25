const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync,spawnSync}=require('node:child_process'),{JSDOM}=require('jsdom');
const context={window:{}};vm.runInNewContext(fs.readFileSync('dist/manual-pages.js','utf8'),context);const pages=context.window.C_MANUAL_PAGES,manifest=JSON.parse(fs.readFileSync('dist/manuals/manifest.json'));
assert.equal(Object.keys(pages).length,96);assert.equal(manifest.length,96);
for(const record of manifest){
 const page=pages[record.id],source=fs.readFileSync('dist/manuals/source/'+record.id);
 assert.equal(crypto.createHash('sha256').update(source).digest('hex'),record.sha256);assert.match(source.toString(),/Copyright|SPDX-License-Identifier/);
 const document=new JSDOM(page.html).window.document;assert.ok(document.querySelector('#NAME'));assert.ok(document.querySelector('#DESCRIPTION'));
 assert.equal(document.querySelectorAll('script,iframe,img,style,link').length,0);
 for(const link of document.querySelectorAll('a')){if(/^https?:/.test(link.getAttribute('href'))){assert.match(link.textContent,/internet required/);assert.equal(link.target,'_blank');continue;}assert.ok(link.getAttribute('href').startsWith('#/manual/'));const key=link.getAttribute('href').split('/')[2];assert.ok(pages[key],key);}
 assert.ok(fs.readFileSync('native/manuals/'+record.id+'.txt','utf8').length>200);
}
for(const [args,pattern] of [[['3','printf'],/RETURN VALUE[\s\S]+negative/],[['3','fgets'],/RETURN VALUE[\s\S]+NULL/],[['-k','allocate'],/malloc\.3/],[['--help'],/man 3 printf/]])assert.match(execFileSync('python3',['tools/man.py',...args],{encoding:'utf8'}),pattern);
assert.notEqual(spawnSync('python3',['tools/man.py','3','no_such_function']).status,0);
console.log('PASS 96 offline manual entries, source hashes/licences, local manual cross-references and labelled online citations, CLI section/keyword lookup and absent-page feedback');
