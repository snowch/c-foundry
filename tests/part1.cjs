const fs=require('fs'),assert=require('assert/strict'),{JSDOM}=require('jsdom');
const dom=new JSDOM(fs.readFileSync('dist/index.html','utf8'),{url:'https://example.test/#/chapter/first-program',runScripts:'outside-only'}),w=dom.window;let worker;
w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};w.confirm=()=>true;w.Worker=class{constructor(){worker=this;}postMessage(data){this.request=data;}terminate(){}emit(data){this.onmessage({data});}};
w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
for(const f of ['lessons','course','part1','visuals','execution','app'])w.eval(fs.readFileSync('dist/'+f+'.js','utf8'));
const $=id=>w.document.getElementById(id),go=route=>{w.history.pushState(null,'','#'+route);w.dispatchEvent(new w.HashChangeEvent('hashchange'));};
const chapters=w.COURSE.chapters.filter(c=>c.status==='ready');assert.equal(chapters.length,5);assert.ok(chapters.every(c=>c.part===0));assert.equal(w.LESSONS.filter(l=>l.isExample).length,25);assert.equal(w.LESSONS.filter(l=>!l.isExample).length,12);
const fixtures=JSON.parse(fs.readFileSync('native/examples/tests.json','utf8'));assert.equal(Object.keys(fixtures).length,25);
for(const c of chapters){
 go('/chapter/'+c.id);assert.match($('preview-content').textContent,/What you will learn/);assert.ok(!$('preview-content').textContent.includes('Preview page.'));
 for(const t of c.topics){
  const content=w.PART_ONE[c.id].topics[t.id];go('/chapter/'+c.id+'/'+t.id);assert.ok($('preview-content').querySelector('.topic-content'));assert.equal($('preview-content').querySelector('pre code').textContent,content.code);
  assert.ok(content.answer>=0&&content.answer<content.choices.length);
  w.document.querySelector('[data-topic-check]').click();assert.equal($('topic-feedback').textContent,'Choose an answer first.');
  w.document.querySelector(`input[name="topic-check"][value="${(content.answer+1)%content.choices.length}"]`).click();w.document.querySelector('[data-topic-check]').click();assert.match($('topic-feedback').textContent,/Not quite/);
  w.document.querySelector(`input[name="topic-check"][value="${content.answer}"]`).click();w.document.querySelector('[data-topic-check]').click();assert.match($('topic-feedback').textContent,/Correct/);assert.ok($('topic-feedback').textContent.includes(content.why));
  assert.equal(fs.readFileSync('native/examples/'+c.id+'-'+t.id+'.c','utf8'),content.code);assert.equal(fixtures[c.id+'-'+t.id][0].expected,content.expected);
  w.document.querySelector(`a[href="#/lesson/example-${c.id}-${t.id}"]`).click();assert.equal($('editor').value,content.code);assert.equal($('stdin').value,content.input);assert.equal(w.document.querySelector('#lab-view .worked-example').hidden,true);assert.match($('assessment-note').textContent,/does not add to practice progress/);
  $('check-button').click();assert.equal(worker.request.tests[0].expected,content.expected);worker.emit({type:'done',results:[{name:'Example',actual:content.expected,expected:content.expected,pass:true}],diagnostics:''});assert.equal(JSON.parse(w.localStorage.getItem('c-foundry-v1')).completed.length,0);
  $('previous-button').click();assert.equal(w.location.hash,`#/chapter/${c.id}/${t.id}`);
 }
}
go('/lesson/hello');$('next-button').click();assert.equal(w.location.hash,'#/lesson/numbers');$('next-button').click();assert.equal(w.location.hash,'#/lesson/guess');$('next-button').click();assert.equal(w.location.hash,'#/lesson/functions');
go('/course');assert.equal(w.document.querySelectorAll('.course-part li').length,44);assert.equal(w.document.querySelectorAll('.course-part')[0].textContent.includes('planned topics'),false);go('/chapter/pointers');assert.match($('preview-content').textContent,/Preview page/);
console.log('PASS all 25 authored topics, quiz feedback, native parity, runnable examples, ungraded progress, chapter order, and future preview labels');dom.window.close();
