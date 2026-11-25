const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
function setup({saved={},fail=''}={}){
 const dom=new JSDOM(fs.readFileSync('dist/index.html','utf8'),{url:'https://example.test/#/chapter/first-program/6',runScripts:'outside-only'}),w=dom.window;let worker,starts=0;
 w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};w.confirm=()=>true;w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 w.Worker=class{constructor(){worker=this;starts++;}postMessage(request){this.request=request;}terminate(){}emit(data){this.onmessage({data});}};
 for(const [key,value]of Object.entries(saved))w.localStorage.setItem(key,value);
 if(fail){const put=w.Storage.prototype.setItem;w.Storage.prototype.setItem=function(key,value){if(key.startsWith(fail))throw Error('full');return put.call(this,key,value);};}
 for(const f of ['lessons','course','completion','part1','part2','part3','part4','part5','part6','part7','part8','part9','references','concepts','readings','visuals','execution','browser-linux','app'])w.eval(fs.readFileSync('dist/'+f+'.js','utf8'));
 const $=s=>w.document.querySelector(s),go=route=>{w.history.pushState(null,'','#'+route);w.dispatchEvent(new w.HashChangeEvent('hashchange'));};
 return {dom,w,$,go,worker:()=>worker,starts:()=>starts};
}
const t=setup(),{w,$,go}=t;
$('#editor').value='// retained reading draft';$('#editor').dispatchEvent(new w.Event('input'));assert.equal(w.lessonCompletion.isDone('first-program/6'),false);
const completion=$('#preview-content>.lesson-completion'),practice=$('#preview-content>.chapter-practice');assert.ok(completion.compareDocumentPosition(practice)&w.Node.DOCUMENT_POSITION_FOLLOWING);
$('[data-complete-and-practice]').click();assert.equal(w.location.hash,'#/lesson/hello');assert.equal(w.lessonCompletion.isDone('first-program/6'),true);assert.equal($('#practice-reading-complete').checked,true);assert.equal($('#practice-complete').checked,false);assert.equal(t.starts(),0);
$('#editor').value='// retained practice draft';$('#editor').dispatchEvent(new w.Event('input'));$('#practice-complete').click();assert.equal(w.practiceCompletion.isDone('hello'),true);assert.match($('#drawer-nav a[href="#/lesson/hello"]').textContent,/Practice complete/);
$('#next-button').click();assert.equal(w.location.hash,'#/chapter/values/1');go('/lesson/hello');assert.equal($('#editor').value,'// retained practice draft');assert.equal($('#practice-complete').checked,true);$('#practice-return').click();assert.equal(w.location.hash,'#/chapter/first-program/6');assert.equal($('#editor').value,'// retained reading draft');assert.match($('[data-complete-and-practice]').textContent,/Continue/);
for(const chapter of w.COURSE.chapters)for(let index=0;index<chapter.labs.length;index++){
 const id=chapter.labs[index];go('/lesson/'+id);assert.equal($('#previous-button').disabled,false);assert.equal($('#next-button').disabled,false);
 const previous=index?'/lesson/'+chapter.labs[index-1]:'/chapter/'+chapter.id+'/'+chapter.topics.at(-1).id;
 const next=index<chapter.labs.length-1?'/lesson/'+chapter.labs[index+1]:'/chapter/'+w.COURSE.chapters[chapter.number].id+'/'+w.COURSE.chapters[chapter.number].topics[0].id;
 $('#previous-button').click();assert.equal(w.location.hash,'#'+previous);go('/lesson/'+id);$('#next-button').click();assert.equal(w.location.hash,'#'+next);
}
go('/chapter/values/5');$('#preview-content a[href="#/lesson/numbers"]').click();assert.equal(w.lessonCompletion.isDone('values/5'),false);assert.equal($('#practice-reading-complete').checked,false);
$('#check-button').click();assert.equal($('#next-button').disabled,true);t.worker().emit({type:'done',diagnostics:'',results:[{name:'case',actual:'ok',expected:'ok',pass:true}]});assert.equal(w.practiceCompletion.isDone('numbers'),false);assert.equal(w.lessonCompletion.isDone('values/5'),false);
$('#practice-reading-complete').click();$('#practice-complete').click();assert.equal(w.lessonCompletion.isDone('values/5'),true);assert.equal(w.practiceCompletion.isDone('numbers'),true);
const saved=Object.fromEntries(Object.keys(w.localStorage).map(key=>[key,w.localStorage.getItem(key)]));const restored=setup({saved});restored.go('/lesson/numbers');assert.equal(restored.$('#practice-complete').checked,true);assert.equal(restored.$('#practice-reading-complete').checked,true);restored.dom.window.close();
w.localStorage.setItem('c-foundry:practice-done:v1:numbers','false');w.dispatchEvent(new w.StorageEvent('storage',{key:'c-foundry:practice-done:v1:numbers',storageArea:w.localStorage}));assert.equal($('#practice-complete').checked,false);assert.equal(w.lessonCompletion.isDone('values/5'),true);assert.equal(w.practiceCompletion.total().available,15);assert.equal(w.lessonCompletion.total().available,227);
t.dom.window.close();
const failed=setup({fail:'c-foundry:practice-done:'});failed.go('/lesson/hello');failed.$('#practice-complete').click();assert.match(failed.$('#practice-completion-note').textContent,/session only/);assert.throws(()=>failed.w.cFoundryApp.saveForRestart(),/completion/);failed.dom.window.close();
const readingFailed=setup({fail:'c-foundry:lesson-done:'});readingFailed.$('[data-complete-and-practice]').click();assert.equal(readingFailed.w.location.hash,'#/lesson/hello');assert.match(readingFailed.$('#practice-reading-note').textContent,/session only/);readingFailed.dom.window.close();
console.log('PASS reading→practice→next lesson across all 15 exercises, return/drafts, explicit independent marks, storage/reload/tab reconciliation, output-check separation and save-failure feedback');
