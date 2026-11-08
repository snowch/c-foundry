const fs=require('fs'),assert=require('assert/strict'),{JSDOM}=require('jsdom');
const dom=new JSDOM(fs.readFileSync('dist/index.html','utf8'),{url:'https://example.test/#/chapter/pointers/1',runScripts:'outside-only'}),w=dom.window;
w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};w.confirm=()=>true;w.Worker=class{postMessage(){}terminate(){}};
w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
for(const f of ['lessons','course','part1','part2','readings','visuals','execution','app'])w.eval(fs.readFileSync('dist/'+f+'.js','utf8'));
const $=id=>w.document.getElementById(id),go=route=>{w.history.pushState(null,'','#'+route);w.dispatchEvent(new w.HashChangeEvent('hashchange'));};
const fixtures=JSON.parse(fs.readFileSync('native/examples/tests.json','utf8'));
let browser=0,native=0;
for(const chapter of w.COURSE.chapters.filter(c=>c.part===1)){
 assert.equal(chapter.status,'ready');go('/chapter/'+chapter.id);assert.match($('preview-content').textContent,/What you will learn/);
 assert.ok(w.document.querySelector('.reading-shortcuts a').href.endsWith('/1'));
 for(const topic of chapter.topics){
  const t=w.PART_TWO[chapter.id].topics[topic.id],id=chapter.id+'-'+topic.id;
  go('/chapter/'+chapter.id+'/'+topic.id);assert.equal(w.document.title,topic.title+' · C Foundry');
  assert.equal($('chapter-jump').value,`/chapter/${chapter.id}/${topic.id}`);
  assert.ok(w.document.querySelector(`#drawer-nav a[aria-current="page"][href="#/chapter/${chapter.id}/${topic.id}"]`));
  assert.equal(w.document.querySelectorAll('#drawer-nav>details').length,9);
  assert.equal(w.document.querySelectorAll('#drawer-nav .chapter-entry').length,44);
  assert.ok(!$('drawer-nav').textContent.includes('Available practice'));
  assert.equal(w.document.querySelectorAll('#drawer-nav>details[open]').length,1);
  assert.ok(t.choices.length>=2);assert.ok(t.answer>=0&&t.answer<t.choices.length);
  w.document.querySelector(`input[name="topic-check"][value="${t.answer}"]`).click();w.document.querySelector('[data-topic-check]').click();assert.match($('topic-feedback').textContent,/Correct/);
  assert.equal(fixtures[id][0].expected,t.expected);
  if(t.runtime==='native'){
   native++;assert.equal(w.document.querySelector('#inline-editor-host'),null);assert.ok(w.document.querySelector('[data-native-example]'));
   const panel=w.document.querySelector('.native-example .execution-panel');assert.ok(panel);assert.match(panel.textContent,new RegExp('make example EXAMPLE='+id));assert.ok(!panel.textContent.includes('still a preview'));
   for(const [name,code] of Object.entries(t.files||{'main.c':t.code}))assert.equal(fs.readFileSync(`native/examples/${id}/${name}`,'utf8'),code);
  }else{browser++;assert.equal($('editor').value,t.code);assert.ok(w.document.querySelector('#inline-editor-host .coding-panel'));assert.equal(fs.readFileSync(`native/examples/${id}.c`,'utf8'),t.code);}
 }
}
assert.equal(browser,15);assert.equal(native,11);assert.equal(w.LESSONS.filter(l=>l.isExample).length,40);
go('/chapter/pointers/1');$('chapter-jump').value='/chapter/pointers/4';$('chapter-jump').dispatchEvent(new w.Event('change',{bubbles:true}));assert.equal(w.location.hash,'#/chapter/pointers/4');
$('course-menu-button').click();assert.ok($('course-drawer').open);w.document.querySelector('#drawer-nav a[href="#/chapter/pointers/2"]').click();assert.equal(w.location.hash,'#/chapter/pointers/2');assert.ok(!$('course-drawer').open);
go('/chapter/allocation');for(const id of ['heap','grow'])assert.ok(w.document.querySelector(`#preview-content a[href="#/lesson/${id}"]`));
go('/chapter/structured-data');for(const id of ['rows','records'])assert.ok(w.document.querySelector(`#preview-content a[href="#/lesson/${id}"]`));
for(const [chapter,project] of [['larger-programs','record-store'],['files-bytes','binary-record']]){go('/chapter/'+chapter);assert.ok($('preview-content').textContent.includes('make project PROJECT='+project));assert.match($('preview-content').textContent,/initial failure is expected/);for(const file of ['README.md','tests.c','.reference/'+(project==='record-store'?'store':'record')+'.c'])assert.ok(fs.existsSync('native/projects/'+project+'/'+file));}
console.log('PASS Part 2: 26 readings, 15 inline examples, 11 native examples, 2 project links, knowledge checks, direct topic navigation and all practice links');dom.window.close();
