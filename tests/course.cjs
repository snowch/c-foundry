const fs=require('fs'),assert=require('assert/strict'),{JSDOM}=require('jsdom');
const dom=new JSDOM(fs.readFileSync('dist/index.html','utf8'),{url:'https://example.test/#/course',runScripts:'outside-only'}),w=dom.window;
w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};w.confirm=()=>true;w.Worker=class{postMessage(){}terminate(){}};
w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
w.localStorage.setItem('c-foundry:lesson-done:v1:pointers/1','true');
for(const file of ['lessons','course','completion','part1','part2','part3','part4','part5','part6','part7','part8','part9','readings','visuals','execution','app'])w.eval(fs.readFileSync('dist/'+file+'.js','utf8'));
const $=s=>w.document.querySelector(s),go=route=>{w.history.pushState(null,'','#'+route);w.dispatchEvent(new w.HashChangeEvent('hashchange'));};
assert.equal(w.COURSE.chapters.filter(c=>c.status==='ready').length,44);assert.equal(w.lessonCompletion.total().available,226);assert.equal(w.lessonCompletion.total().done,1);
const manifest=JSON.parse(fs.readFileSync('native/examples/tests.json','utf8'));assert.equal(Object.keys(manifest).length,226);assert.equal(w.LESSONS.filter(l=>l.isExample).length,139);
let newTopics=0,browser=0,native=0,marked=0;
for(const chapter of w.COURSE.chapters.filter(c=>c.part>=2)){
 go('/chapter/'+chapter.id);assert.ok(!$('#preview-content').textContent.includes('Preview page'));assert.ok($('#preview-content').textContent.includes(chapter.project));assert.ok($('#preview-content').textContent.includes('Build it yourself'));
 const content=w.authoredLessons.content[chapter.id];assert.ok(content.practicePlan.tasks.length>=3);
 for(const topic of chapter.topics){
  const t=content.topics[topic.id],id=chapter.id+'-'+topic.id;newTopics++;
  go('/chapter/'+chapter.id+'/'+topic.id);assert.equal($('#preview-content h1').textContent,topic.title);assert.ok($('[data-lesson-complete]'));assert.equal($('#chapter-jump').value,`/chapter/${chapter.id}/${topic.id}`);
  assert.equal(manifest[id][0].expected,t.expected);assert.ok(t.explanation.length>150);assert.ok(t.walkthrough.length>50);assert.ok(t.pitfall.length>30);assert.ok(t.tryit.length>40);assert.ok(!t.code.includes('TODO'));
  $('input[name="topic-check"][value="'+t.answer+'"]').click();$('[data-topic-check]').click();assert.match($('#topic-feedback').textContent,/Correct/);
  assert.equal($('[data-lesson-complete]').checked,false);
  if(t.runtime==='native'){
   native++;assert.equal($('#inline-editor-host'),null);const panel=$('.native-example .execution-panel');assert.ok(panel.textContent.includes(t.command||`make example EXAMPLE=${id}`));
   assert.ok(fs.existsSync('native/examples/'+id+'/README.md'));for(const source of manifest[id][0].sources)assert.ok(fs.existsSync('native/examples/'+source));
   assert.deepEqual(Array.from(manifest[id][0].flags||[]),Array.from(t.flags||[]));
  }else{browser++;assert.equal($('#editor').value,t.code);assert.ok($('#inline-editor-host .coding-panel'));assert.equal(fs.readFileSync('native/examples/'+id+'.c','utf8'),t.code);}
  if(topic.id===chapter.topics[0].id||topic.id===chapter.topics.at(-1).id){$('[data-lesson-complete]').click();marked++;assert.equal($('#drawer-nav .drawer-topics a[href="#/chapter/'+chapter.id+'/'+topic.id+'"]').dataset.completed,'true');}
 }
}
assert.equal(newTopics,174);assert.equal(browser,99);assert.equal(native,75);assert.equal(w.lessonCompletion.total().done,marked+1);
go('/chapter/persistence/5');const artifact=$('a[download]');assert.equal(artifact.getAttribute('href'),'assets/tinydb-sample.tdb');const sample=fs.readFileSync('dist/'+artifact.getAttribute('href'));assert.equal(sample.length,88);assert.equal(sample.subarray(0,4).toString(),'TDB1');assert.equal(sample[6],2);assert.equal(sample.readUInt32LE(8),1);assert.equal(sample.readUInt32LE(48),2);
go('/chapter/reliability/3');assert.ok($('.page-navigation').textContent.includes('Course map'));assert.ok($('#preview-content').textContent.includes('Build it yourself'));
go('/course');assert.equal(w.document.querySelectorAll('.course-part li').length,44);assert.ok(!$('#course-cards').textContent.includes('planned topics'));assert.match($('#course-cards [data-chapter-progress="reliability"]').textContent,/2\/3 done/);
console.log('PASS remaining 174 authored routes, questions, 99 inline/75 native examples, source/command parity, all chapter workshops, expanded completion tracking and downloadable database fixture');dom.window.close();
