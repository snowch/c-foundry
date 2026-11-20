const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const dom=new JSDOM(fs.readFileSync('dist/index.html','utf8'),{url:'https://example.test/#/chapter/pointers/1',runScripts:'outside-only'}),w=dom.window;
w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};w.confirm=()=>true;
w.fetch=()=>{throw Error('Concept diagrams must not fetch external assets');};w.Worker=class{postMessage(){}terminate(){}};
w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
for(const file of ['lessons','course','completion','part1','part2','part3','part4','part5','part6','part7','part8','part9','references','concepts','readings','visuals','execution','browser-linux','app'])w.eval(fs.readFileSync('dist/'+file+'.js','utf8'));
const $=selector=>w.document.querySelector(selector),go=path=>{w.history.pushState(null,'','#'+path);w.dispatchEvent(new w.HashChangeEvent('hashchange'));};
const artifact=$('.concept-art');assert.equal(artifact.getAttribute('role'),'img');assert.ok(w.document.getElementById(artifact.getAttribute('aria-labelledby')));assert.ok(w.document.getElementById(artifact.getAttribute('aria-describedby')));
assert.ok($('.concept-diagram').compareDocumentPosition($('.topic-content .worked-example'))&w.Node.DOCUMENT_POSITION_FOLLOWING);
$('#editor').value='// retain draft while reading a diagram';$('#editor').dispatchEvent(new w.Event('input'));$('.concept-text>summary').click();assert.equal($('.concept-text').open,true);assert.equal($('#editor').value,'// retain draft while reading a diagram');assert.equal(w.location.hash,'#/chapter/pointers/1');assert.equal($('[data-lesson-complete]').checked,false);$('[data-lesson-complete]').click();assert.equal(w.lessonCompletion.isDone('pointers/1'),true);
go('/chapter/pointers/4');assert.equal($('.concept-diagram'),null);assert.ok($('#inline-editor-host .coding-panel'));
go('/chapter/pointers/1');assert.equal($('.concept-text').open,false);assert.equal($('#editor').value,'// retain draft while reading a diagram');assert.equal($('[data-lesson-complete]').checked,true);
let placements=0;const parts=new Set(),knownRoutes=new Set(w.COURSE.chapters.flatMap(c=>c.topics.map(t=>c.id+'/'+t.id))),usedRoutes=new Set();
for(const [id,diagram] of Object.entries(w.conceptDiagrams.diagrams)){
 assert.ok(diagram.description.length>100);assert.ok(diagram.caption.length>30);
 for(const route of diagram.routes){
  placements++;assert.ok(knownRoutes.has(route),'Unknown diagram route: '+route);assert.ok(!usedRoutes.has(route),'Duplicate diagram: '+route);usedRoutes.add(route);
  const [chapterId,topicId]=route.split('/'),chapter=w.COURSE.chapters.find(c=>c.id===chapterId),topic=chapter.topics.find(t=>t.id===topicId);parts.add(chapter.part);
  const html=w.conceptDiagrams.render(chapter,topic),fragment=JSDOM.fragment(html),figure=fragment.querySelector('figure');assert.equal(figure.dataset.concept,id);assert.equal(fragment.querySelectorAll('figure').length,1);
  assert.equal(fragment.querySelector('img,svg image,script,iframe,video,canvas'),null);assert.ok(!html.includes('http://')&&!html.includes('https://'));assert.equal(figure.querySelectorAll('[id]').length,new Set([...figure.querySelectorAll('[id]')].map(n=>n.id)).size);
  assert.equal(figure.querySelector('.concept-text p').textContent,diagram.description);
  assert.ok(fs.readFileSync(chapter.workspace+'/README.md','utf8').includes(diagram.description),'Missing native reading description: '+route);
 }
}
assert.equal(placements,102);assert.equal(parts.size,9);
// The string pictures must show one C escape, not a double-backslash spelling.
for(const id of ['string','builder'])assert.equal(w.conceptDiagrams.diagrams[id].data.cells[3].value,String.fromCharCode(92)+'0');
// Check comparison counts against the same specified search problem independently.
function binaryCount(n){let lo=0,hi=n-1,count=0;while(lo<=hi){count++;const mid=lo+Math.floor((hi-lo)/2);if(mid===n-1)return count;lo=mid+1;}}
for(const row of w.conceptDiagrams.diagrams.growth.data.rows){const n=parseInt(row[0]);assert.equal(parseInt(row[1]),n);assert.equal(parseInt(row[2]),binaryCount(n));}
console.log('PASS original diagrams across all nine parts, 102 valid placements, accessible text, local assets, model counts, native reading parity and preserved editor/completion state');dom.window.close();
