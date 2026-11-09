const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
function setup(hash=''){
 const dom=new JSDOM(fs.readFileSync('dist/index.html','utf8'),{url:'https://example.test/c-foundry/'+hash,runScripts:'outside-only'}),w=dom.window;let worker;
 w.confirm=()=>true;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 w.Worker=class{constructor(){worker=this;}postMessage(data){this.request=data;}terminate(){this.terminated=true;}emit(data){this.onmessage({data});}};
 for(const f of ['lessons','course','completion','part1','part2','part3','part4','part5','part6','part7','part8','part9','readings','visuals','execution','app'])w.eval(fs.readFileSync('dist/'+f+'.js','utf8'));
 return {dom,w,$:id=>w.document.getElementById(id),worker:()=>worker,click:q=>{const el=w.document.querySelector(q);assert.ok(el,'Missing '+q);el.click();}};
}
const {dom,w,$,click,worker}=setup();
const go=path=>{w.history.pushState(null,'','#'+path);w.dispatchEvent(new w.HashChangeEvent('hashchange'));};
assert.equal($('lesson-title').textContent,'Your first C program');
// The first explanation precedes the worked example and the coding task.
const order=[...w.document.querySelectorAll('#lab-view [id]')].map(e=>e.id);assert.ok(order.indexOf('lesson-body')<order.indexOf('worked-title'));assert.ok(order.indexOf('worked-title')<order.indexOf('prediction-title'));assert.ok(order.indexOf('prediction-title')<order.indexOf('exercise-title'));assert.ok(order.indexOf('exercise-title')<order.indexOf('editor'));
assert.ok($('step-details').hidden);assert.ok(!w.document.querySelector('.complexity-pill'));
$('editor').value='// draft\n// second line';$('editor').dispatchEvent(new w.Event('input'));assert.equal($('line-numbers').textContent,'1\n2');
go('/lesson/loops');go('/lesson/hello');assert.equal($('editor').value,'// draft\n// second line');
$('solution-button').click();$('check-button').click();assert.ok(worker().request.tests);assert.ok($('editor').readOnly);
// Navigating while a program runs keeps the lesson and route intact.
go('/course');assert.equal(w.location.hash,'#/lesson/hello');assert.ok(!$('lab-view').hidden);
worker().emit({type:'done',results:[{actual:'Hello, C!',expected:'Hello, C!',name:'Greeting',pass:true}],diagnostics:''});assert.match($('drawer-progress').textContent,/1 of 15/);
go('/lesson/pointers');assert.match($('worked-code').textContent,/int temp = \*a/);assert.ok(!$('step-details').hidden);assert.ok(!$('step-details').open);
$('step-details').open=true;$('step-next').click();assert.equal(w.document.querySelectorAll('#step-state .changed').length,1);assert.match(w.document.querySelector('#step-state .changed th').textContent,/\*a/);$('step-next').click();assert.equal($('step-next').textContent,'Try it yourself ↓');$('step-next').click();assert.ok(!$('step-details').open);assert.equal(w.document.activeElement.id,'editor');
$('prediction-check').click();assert.match($('prediction-feedback').textContent,/Choose/);click('input[name="prediction"][value="1"]');$('prediction-check').click();assert.match($('prediction-feedback').textContent,/Not quite/);click('input[name="prediction"][value="0"]');$('prediction-check').click();assert.match($('prediction-feedback').textContent,/Correct/);
go('/lesson/search');assert.match($('assessment-note').textContent,/cannot establish/);$('run-button').click();assert.equal(worker().request.input,'23');$('stop-button').click();assert.ok(worker().terminated);assert.ok(!$('editor').readOnly);
$('run-button').click();worker().emit({type:'error',message:'Compile failed',diagnostics:'expected semicolon'});assert.match($('output').textContent,/expected semicolon/);
$('course-menu-button').click();assert.ok($('course-drawer').open);click('#drawer-nav .chapter-entry[href="#/chapter/allocation/1"]');go('/chapter/allocation');click('#preview-content a[href="#/lesson/heap"]');assert.ok(!$('course-drawer').open);assert.equal($('lesson-title').textContent,'Allocate & release');
go('/course');assert.equal(w.document.querySelectorAll('.course-part').length,9);assert.equal(w.document.querySelectorAll('.course-part li').length,44);
let count=0;
for(const chapter of w.COURSE.chapters){go('/chapter/'+chapter.id);assert.ok(!$('preview-view').hidden);assert.match($('preview-content').textContent,chapter.status==='ready'?/What you will learn/:/Preview page/);assert.equal(w.document.querySelectorAll('#preview-content > ol.topic-list > li').length,chapter.topics.length);for(const topic of chapter.topics){go('/chapter/'+chapter.id+'/'+topic.id);assert.equal(w.document.querySelector('#preview-content h1').textContent,topic.title);assert.match($('preview-content').textContent,chapter.status==='ready'?/Watch for this/:/Planned lesson/);assert.ok($('lab-view').hidden);count++;}}
assert.equal(count,226);go('/chapter/big-o');click('a[href="#/big-o"]');assert.ok(!$('complexity-view').hidden);assert.match($('search-comparison').textContent,/Linear comparisons/);$('complexity-size').value=3;$('complexity-size').dispatchEvent(new w.Event('input'));assert.match($('search-comparison').textContent,/16 \(doubled\)/);assert.match($('doubling-note').textContent,/binary adds 1/);
go('/chapter/not-found');assert.match($('preview-content').textContent,/Page not found/);
for(const l of w.LESSONS){go('/lesson/'+l.id);assert.ok(l.solution.split('\n').length>5);assert.ok($('reference-code').textContent.includes('\n'));assert.ok($('worked-code').textContent);}
console.log('PASS lesson sequence, selective examples, predictions, single changed value, and accessible step-to-exercise transition');
console.log('PASS drafts, output checks, cancellation, errors, and course drawer');
console.log('PASS all 44 chapter and 226 topic routes, preview labels, unknown route, and Big O comparison');dom.window.close();
const deep=setup('#/chapter/recovery/4');assert.equal(deep.w.document.querySelector('#preview-content h1').textContent,'Write-ahead logging');assert.ok(deep.$('lab-view').hidden);deep.dom.window.close();console.log('PASS direct topic deep link');
