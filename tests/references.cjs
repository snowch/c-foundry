const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const dom=new JSDOM(fs.readFileSync('dist/index.html','utf8'),{url:'https://example.test/#/chapter/first-program/6',runScripts:'outside-only'}),w=dom.window;
w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};w.confirm=()=>true;
w.fetch=()=>{throw Error('Reading help must not fetch external pages');};
w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
w.Worker=class{postMessage(){}terminate(){}};
for(const file of ['lessons','course','completion','part1','part2','part3','part4','part5','part6','part7','part8','part9','manual-pages','manuals','references','concepts','readings','visuals','execution','browser-linux','app'])w.eval(fs.readFileSync('dist/'+file+'.js','utf8'));
const $=selector=>w.document.querySelector(selector),go=path=>{w.history.pushState(null,'','#'+path);w.dispatchEvent(new w.HashChangeEvent('hashchange'));};
assert.equal($('#preview-content h1').textContent,'Finding and reading C documentation');assert.equal($('#chapter-jump').value,'/chapter/first-program/6');
assert.equal($('#editor').value,w.PART_ONE['first-program'].topics['6'].code);assert.match($('.help-practice').textContent,/RETURN VALUE/);assert.ok($('#help-open-manual'));assert.equal($('#help-manual').hidden,true);
$('#help-open-manual').click();assert.equal($('#help-manual').hidden,false);$('#help-manual-section').value='RETURN_VALUE';$('#help-manual-section').dispatchEvent(new w.Event('change',{bubbles:true}));assert.match($('#help-manual-content').textContent,/negative/);$('#help-close-manual').click();assert.equal($('#help-manual').hidden,true);assert.equal(w.document.activeElement.id,'help-open-manual');
$('#help-prediction').value='5';$('#help-failure').value='negative';$('#help-check-contract').click();assert.match($('#help-contract-feedback').textContent,/null byte/);$('#help-prediction').value='4';$('#help-check-contract').click();assert.match($('#help-contract-feedback').textContent,/Correct/);assert.equal($('[data-lesson-complete]').checked,false);

assert.equal($('.lesson-references').open,false);assert.equal($('[data-lesson-complete]').checked,false);
$('.lesson-references summary').click();assert.equal($('.lesson-references').open,true);assert.equal(w.document.querySelectorAll('.lesson-references>ul a[href="#/manual/printf.3"]').length,1);assert.equal($('.lesson-references a[href*="man3/printf"]'),null);assert.equal($('.supplementary-references').open,false);assert.equal($('.supplementary-references a[href*="man1/printf"]').target,'_blank');assert.match($('.supplementary-references').textContent,/complete the lesson without/);
$('input[name="topic-check"][value="0"]').click();$('[data-topic-check]').click();assert.match($('#topic-feedback').textContent,/Correct/);assert.equal($('[data-lesson-complete]').checked,false);
$('[data-lesson-complete]').click();assert.equal(w.localStorage.getItem('c-foundry:lesson-done:v1:first-program/6'),'true');assert.equal($('#drawer-nav a[href="#/chapter/first-program/6"]').dataset.completed,'true');
go('/chapter/first-program/5');assert.equal($('.page-navigation a:last-child').getAttribute('href'),'#/chapter/first-program/6');
go('/chapter/first-program/3');assert.equal($('.documentation-practice').open,false);$('.documentation-practice>summary').click();$('.documentation-answer>summary').click();assert.match($('.documentation-answer').textContent,/four/);assert.equal($('[data-lesson-complete]').checked,false);
$('#editor').value='// keep this draft';$('#editor').dispatchEvent(new w.Event('input'));$('.lesson-references>summary').click();assert.equal($('#editor').value,'// keep this draft');assert.equal(w.location.hash,'#/chapter/first-program/3');
let topics=0,tasks=0;
for(const chapter of w.COURSE.chapters){
 const plan=w.lessonReferences.chapters[chapter.id];assert.ok(plan,'Missing reference plan: '+chapter.id);assert.ok(chapter.topics.some(t=>t.id===plan.exerciseAt));
 for(const topic of chapter.topics){
  topics++;const data=w.authoredLessons.content[chapter.id].topics[topic.id],resources=w.lessonReferences.get(chapter,topic,data);
  assert.ok(resources.links.length>=1&&resources.links.length<=3);assert.equal(new Set(resources.links.map(l=>l.url)).size,resources.links.length);
  for(const link of resources.links){assert.equal(new URL(link.url).protocol,'https:');assert.ok(link.note.length>20);}
  if(resources.exercise){tasks++;assert.ok(resources.links.some(l=>l.id===resources.exercise.reference));assert.ok(resources.exercise.answer.length>50);}
  const view=w.lessonReferences.getView(chapter,topic,data),rendered=w.lessonReferences.render(chapter,topic,data);assert.match(rendered,/References and help/);assert.ok(!rendered.includes('<details open'));assert.ok(!rendered.includes('Full online reference'));
  assert.equal(new Set(view.links.map(link=>link.identity)).size,view.links.length,'One included link per actual source');
  const referenceDoc=new w.DOMParser().parseFromString(rendered,'text/html');
  const primary=[...referenceDoc.querySelectorAll('.lesson-references>ul>li>a')];assert.equal(primary.length,view.links.length);assert.ok(primary.every(link=>link.getAttribute('href').startsWith('#/')));
  for(const anchor of referenceDoc.querySelectorAll('.lesson-references a[href^="https:"]'))assert.ok(anchor.closest('.supplementary-references'));
  for(const link of view.links.filter(link=>link.manual)){assert.ok(fs.existsSync('native/manuals/'+link.manual+'.txt'));assert.match(link.title,/^Read /);}
  assert.ok(!view.external.some(link=>['printf','printf-man','fgets','malloc','realloc','free'].includes(link.id)));
  if(view.exercise){const lookup=referenceDoc.querySelector('.documentation-practice p a').getAttribute('href');assert.ok(primary.some(link=>link.getAttribute('href')===lookup),'The documentation exercise has an included reference');}

 }
 const native=fs.readFileSync(chapter.workspace+'/README.md','utf8');assert.match(native,/References and help/);
}
assert.equal(topics,227);assert.equal(tasks,44);
const arrayChapter=w.COURSE.chapters.find(c=>c.id==='arrays-strings'),arrayTopic=arrayChapter.topics.find(t=>t.id==='4');assert.ok(w.lessonReferences.get(arrayChapter,arrayTopic,w.PART_ONE['arrays-strings'].topics['4']).links.some(l=>l.id==='strtol'));
go('/linux/first-program/man%203%20printf');assert.equal($('#linux-command').textContent,'man 3 printf');assert.equal($('#linux-return').getAttribute('href'),'#/chapter/first-program/6');
go('/manual/printf.3');assert.match($('#preview-content').textContent,/RETURN\s+VALUE/);assert.match($('#preview-content').textContent,/negative/);assert.match($('.manual-reader footer').textContent,/Linux man-pages 6.16/);assert.ok($('.manual-reader footer a[download]'));assert.ok($('.manual-reader footer a[href="manuals/NOTICE.md"]'));go('/reference/printf');assert.equal($('.manual-reader h1').textContent,'printf(3)');assert.equal($('.supplementary-references'),null);
go('/manual/fgets.3');assert.match($('#preview-content').textContent,/null pointer|NULL/i);
go('/reference/wasm');assert.match($('#preview-content').textContent,/Course notes/);assert.match($('#preview-content').textContent,/internet required/);
go('/chapter/first-program/3');const response=$('.documentation-response');response.value='RETURN VALUE: four characters';response.dispatchEvent(new w.Event('input',{bubbles:true}));go('/manual/printf.3');go('/chapter/first-program/3');assert.equal($('.documentation-response').value,'RETURN VALUE: four characters');
const image=fs.readFileSync('.github/native/Dockerfile','utf8');assert.match(image,/man-db manpages-dev less/);assert.match(image,/reinstall coreutils/);assert.match(fs.readFileSync('.github/workflows/pages.yml','utf8'),/make check-help/);
console.log('PASS help lesson, stable links/completion, offline lookup answers, 227 compact reference sections, 44 optional tasks, relevant APIs and native reading parity');dom.window.close();
