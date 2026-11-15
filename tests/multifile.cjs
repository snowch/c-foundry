const fs=require('node:fs'),assert=require('node:assert/strict'),{Worker}=require('node:worker_threads'),{JSDOM}=require('jsdom');
function page(saved){
 const dom=new JSDOM(fs.readFileSync('dist/index.html','utf8'),{url:'https://example.test/#/chapter/larger-programs/1',runScripts:'outside-only'}),w=dom.window;let worker;
 w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};w.confirm=()=>true;
 w.Worker=class{constructor(){worker=this;}postMessage(data){this.request=data;}terminate(){}emit(data){this.onmessage({data});}};
 w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 if(saved)w.localStorage.setItem('c-foundry-v1',saved);
 for(const f of ['lessons','course','completion','part1','part2','part3','part4','part5','part6','part7','part8','part9','references','concepts','readings','visuals','execution','app'])w.eval(fs.readFileSync('dist/'+f+'.js','utf8'));
 return {dom,w,$:id=>w.document.getElementById(id),worker:()=>worker};
}
let p=page(),{$,w}=p;
const file=name=>w.document.querySelector(`[data-source-file="${name}"]`),change=text=>{$('editor').value=text;$('editor').dispatchEvent(new w.Event('input'));};
assert.equal(w.document.querySelectorAll('[data-source-file]').length,3);assert.equal($('source-files').hidden,false);
const originalMain=$('editor').value,originalHeader=w.PART_TWO['larger-programs'].topics['1'].files['operations.h'];
// A header-only edit is still a course draft for the landing-page Continue action.
file('operations.h').click();change(originalHeader+'\n// header-only draft');
w.history.pushState(null,'','#/course');w.dispatchEvent(new w.HashChangeEvent('hashchange'));
assert.equal($('course-start-link').getAttribute('href'),'#/chapter/larger-programs/1');
$('course-start-link').click();$('reset-button').click();

change(originalMain+'\n// main draft');file('operations.h').click();change(originalHeader+'\n// header draft');file('operations.c').click();change($('editor').value+'\n// implementation draft');file('main.c').click();assert.equal($('editor').value,originalMain+'\n// main draft');
file('operations.h').click();assert.equal(file('operations.h').getAttribute('aria-pressed'),'true');assert.equal($('editor-file-name').textContent,'operations.h');assert.match($('download-button').title,/operations.h/);
let filename;w.URL.createObjectURL=()=> 'blob:export';w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){filename=this.download;};$('download-button').click();assert.equal(filename,'operations.h');
$('run-button').click();assert.equal(p.worker().request.code,originalMain+'\n// main draft');assert.equal(p.worker().request.files['operations.h'],originalHeader+'\n// header draft');assert.match(p.worker().request.files['operations.c'],/implementation draft/);assert.ok(file('main.c').disabled);$('stop-button').click();assert.equal(file('main.c').disabled,false);
const saved=w.localStorage.getItem('c-foundry-v1');p.dom.window.close();p=page(saved);({$,w}=p);file('operations.h').click();assert.equal($('editor').value,originalHeader+'\n// header draft');
$('reset-button').click();assert.equal($('editor').value,originalMain);file('operations.h').click();assert.equal($('editor').value,originalHeader);
w.history.pushState(null,'','#/chapter/first-program/1');w.dispatchEvent(new w.HashChangeEvent('hashchange'));assert.equal($('source-files').hidden,true);assert.equal($('editor-file-name').textContent,'main.c');p.dom.window.close();
// Use the same compiler worker as inline lessons: prove edits to headers and separate
// implementations both affect the executable, and a link failure can be repaired.
const worker=new Worker(require('node:path').resolve('tests/worker-shim.cjs'));
function run(data){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{worker.terminate();reject(Error('Multi-file compiler timed out'));},60000);const done=result=>{if(['done','error'].includes(result.type)){clearTimeout(timer);worker.off('message',done);resolve(result);}};worker.on('message',done);worker.postMessage(data);});}
(async()=>{try{
 const files={'main.c':'#include <stdio.h>\n#include "value.h"\nint main(void){printf("%d\\n",value());return 0;}','value.h':'#define BASE 40\nint value(void);','value.c':'#include "value.h"\nint value(void){return BASE+2;}'};
 let r=await run({files});assert.equal(r.type,'done',JSON.stringify(r));assert.equal(r.results[0].actual,'42');
 files['value.h']='#define BASE 10\nint value(void);';r=await run({files});assert.equal(r.results[0].actual,'12');
 files['value.c']='#include "value.h"\nint value(void){return BASE+5;}';r=await run({files});assert.equal(r.results[0].actual,'15');
 r=await run({files:{'main.c':files['main.c'],'value.h':files['value.h']}});assert.equal(r.type,'error');assert.match(r.diagnostics,/undefined symbol/);
 r=await run({files});assert.equal(r.type,'done');assert.equal(r.results[0].actual,'15');
 r=await run({files:{'../main.c':'int main(void){return 0;}'}});assert.equal(r.type,'error');
 console.log('PASS multi-file inline editing, saved drafts/reload, reset, selected-file export, header/source edits, link diagnostics and recovery');
 }finally{await worker.terminate();}})().catch(e=>{console.error(e);process.exitCode=1;});
