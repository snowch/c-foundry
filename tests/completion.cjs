const {JSDOM}=require('jsdom'),fs=require('fs'),assert=require('assert/strict');
const prefix='c-foundry:lesson-done:v1:';
function setup({saved={},fail=false}={}){
 const dom=new JSDOM(fs.readFileSync('dist/index.html','utf8'),{url:'https://example.test/#/chapter/pointers/1',runScripts:'outside-only'}),w=dom.window;let worker;
 w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};w.confirm=()=>true;
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 w.Worker=class{constructor(){worker=this;}postMessage(request){this.request=request;}terminate(){}emit(data){this.onmessage({data});}};
 for(const [key,value] of Object.entries(saved))w.localStorage.setItem(key,value);
 if(fail){const original=w.Storage.prototype.setItem;w.Storage.prototype.setItem=function(key,value){if(key.startsWith(prefix))throw new w.DOMException('Full','QuotaExceededError');return original.call(this,key,value);};}
 for(const name of ['lessons','course','completion','part1','part2','part3','part4','part5','part6','part7','part8','part9','readings','visuals','execution','app'])w.eval(fs.readFileSync('dist/'+name+'.js','utf8'));
 const go=path=>{w.history.pushState(null,'','#'+path);w.dispatchEvent(new w.HashChangeEvent('hashchange'));};
 return {w,dom,go,worker:()=>worker,$:selector=>w.document.querySelector(selector),mark:()=>w.document.querySelector('[data-lesson-complete]')};
}
const t=setup({saved:{'c-foundry-v1':JSON.stringify({completed:['hello'],drafts:{hello:'// old draft'}})}}),{w,go,$,mark}=t;
assert.equal(mark().checked,false);go('/chapter/pointers/2');go('/chapter/pointers/1');assert.equal(mark().checked,false);
const panel=$('.coding-panel');$('#editor').value='// retained draft';$('#editor').dispatchEvent(new w.Event('input'));
$('input[name="topic-check"][value="1"]').click();$('[data-topic-check]').click();assert.match($('#topic-feedback').textContent,/Correct/);assert.equal(mark().checked,false);
$('#run-button').click();t.worker().emit({type:'done',results:[{actual:'value=42\nnull=1',pass:true}],diagnostics:''});assert.equal(mark().checked,false);
mark().focus();mark().click();assert.equal(mark().checked,true);assert.equal(w.document.activeElement,mark());
assert.equal(w.localStorage.getItem(prefix+'pointers/1'),'true');assert.equal($('.coding-panel'),panel);assert.equal($('#editor').value,'// retained draft');assert.match($('#topic-feedback').textContent,/Correct/);
assert.equal($('#drawer-nav a[href="#/chapter/pointers/1"]:not(.chapter-entry)').dataset.completed,'true');assert.match($('#drawer-nav .completion-tick').textContent,/Completed/);
assert.match($('#drawer-nav [data-chapter-progress="pointers"]').textContent,/1\/5 done/);assert.match($('#chapter-jump option[value="/chapter/pointers/1"]').textContent,/✓ Done/);
assert.deepEqual(JSON.parse(w.localStorage.getItem('c-foundry-v1')).completed,['hello']);
go('/chapter/larger-programs/1');assert.equal(mark().checked,false);mark().click();assert.equal(w.localStorage.getItem(prefix+'larger-programs/1'),'true');
go('/chapter/pointers');assert.equal($('#preview-content .topic-list a').dataset.completed,'true');assert.equal(mark(),null);
go('/course');assert.match($('#course-cards [data-chapter-progress="pointers"]').textContent,/1\/5 done/);assert.match($('#course-cards [data-part-progress="1"]').textContent,/2\/27 done/);
go('/chapter/pointers/1');assert.equal(mark().checked,true);mark().click();assert.equal(w.localStorage.getItem(prefix+'pointers/1'),'false');assert.equal($('#drawer-nav a[href="#/chapter/pointers/1"]:not(.chapter-entry)').dataset.completed,'false');
for(let n=1;n<=5;n++){go('/chapter/pointers/'+n);mark().click();}assert.match($('#drawer-nav [data-chapter-progress="pointers"]').textContent,/✓ 5\/5 done/);
// Reconcile just the changed key; retain independent marks and an editor's draft.
w.localStorage.setItem(prefix+'pointers/5','false');w.dispatchEvent(new w.StorageEvent('storage',{key:prefix+'pointers/5',storageArea:w.localStorage}));assert.equal(mark().checked,false);assert.equal(w.lessonCompletion.isDone('pointers/1'),true);assert.equal(w.lessonCompletion.isDone('larger-programs/1'),true);
w.localStorage.clear();w.dispatchEvent(new w.StorageEvent('storage',{key:null,storageArea:w.localStorage}));assert.equal(w.lessonCompletion.total().done,0);
for(const route of ['/chapter/big-o/99','/chapter/larger-programs','/lesson/hello','/chapter/not-real/1']){go(route);assert.equal(mark(),null);}
w.lessonCompletion.mark('not-real/1',true);assert.equal(w.localStorage.getItem(prefix+'not-real/1'),null);assert.equal(w.lessonCompletion.total().done,0);
t.dom.window.close();
const persisted=setup({saved:{[prefix+'pointers/1']:'true',[prefix+'larger-programs/1']:'true',[prefix+'not-real/1']:'true'}});assert.equal(persisted.mark().checked,true);assert.equal(persisted.w.lessonCompletion.total().done,2);persisted.dom.window.close();
const failed=setup({fail:true});failed.mark().click();assert.equal(failed.mark().checked,true);assert.match(failed.$('#completion-save-note').textContent,/session only/);assert.match(failed.$('[data-reading-progress]').textContent,/session only/);failed.go('/course');failed.go('/chapter/pointers/1');assert.equal(failed.mark().checked,true);assert.match(failed.$('#completion-save-note').textContent,/Couldn’t save/);failed.mark().click();assert.equal(failed.mark().checked,false);assert.match(failed.$('#completion-save-note').textContent,/session only/);failed.dom.window.close();
console.log('PASS explicit/reversible reading completion, native lessons, persistence, per-key tab reconciliation, TOC and chapter counts, unsaved feedback, preserved drafts/focus/quiz, and independent exercise checks');
