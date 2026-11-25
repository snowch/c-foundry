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
go('/chapter/first-program/4');assert.equal($('.concept-diagram'),null);assert.ok($('#inline-editor-host .coding-panel'));
go('/chapter/pointers/1');assert.equal($('.concept-text').open,false);assert.equal($('#editor').value,'// retain draft while reading a diagram');assert.equal($('[data-lesson-complete]').checked,true);
go('/chapter/arrays-strings/3');const bufferFigure=$('.concept-diagram');assert.equal(bufferFigure.dataset.concept,'fgets-buffer');assert.equal($('#preview-content .worked-example').contains(bufferFigure),true);assert.ok($('.example-walkthrough').compareDocumentPosition(bufferFigure)&w.Node.DOCUMENT_POSITION_FOLLOWING);assert.equal(w.document.querySelectorAll('#preview-content .concept-diagram').length,1);
const buffer=w.conceptDiagrams.diagrams['fgets-buffer'].data,example=w.authoredLessons.content['arrays-strings'].topics['3'];assert.equal(buffer.capacity,Number(example.code.match(/line\[(\d+)\]/)[1]));assert.equal(buffer.input,example.input);const model=w.conceptDiagrams.fgetsModel(example.input);assert.deepEqual(Array.from(model.copied),Array.from(Buffer.from(example.input)));assert.equal(model.total,14);assert.equal(model.remaining.length,0);assert.equal(bufferFigure.querySelectorAll('.memory-byte').length,32);assert.equal(bufferFigure.querySelector('[data-byte="13"]').dataset.kind,'terminator');assert.equal(w.conceptDiagrams.render(w.COURSE.chapters[4],w.COURSE.chapters[4].topics[2],'explanation'),'');
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
  const reading=JSDOM.fragment(w.authoredLessons.render(chapter,topic)),placed=reading.querySelector('.concept-diagram');assert.equal(reading.querySelectorAll('.concept-diagram').length,1);
  if(diagram.placement==='after-example'){assert.equal(reading.querySelector('.worked-example').contains(placed),true);assert.ok(reading.querySelector('.example-walkthrough').compareDocumentPosition(placed)&w.Node.DOCUMENT_POSITION_FOLLOWING);}else assert.ok(placed.compareDocumentPosition(reading.querySelector('.worked-example'))&w.Node.DOCUMENT_POSITION_FOLLOWING);
 }
}
assert.equal(placements,135);assert.equal(parts.size,9);
for(const input of ['','Ada\n','ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789\n','A\nB\n','é'.repeat(18),'a\0b\n']){
 const bytes=Buffer.from(input),newline=bytes.indexOf(10),count=Math.min(31,newline<0?bytes.length:newline+1),m=w.conceptDiagrams.fgetsModel(input);assert.deepEqual(Array.from(m.copied),Array.from(bytes.subarray(0,count)));assert.deepEqual(Array.from(m.remaining),Array.from(bytes.subarray(count)));assert.equal(m.total,count?count+1:0);
}
const flags=w.conceptDiagrams.diagrams['flag-bits'].data.rows.map(row=>parseInt(row.bits.join(''),2));assert.equal(flags[0],36);assert.equal(flags[1],flags[0]&~(1<<2));assert.equal(flags[1]&(1<<5),1<<5);
const record=Buffer.from(w.conceptDiagrams.diagrams['record-fields'].data.bytes.map(byte=>parseInt(byte,16))),recordSource=w.authoredLessons.content['files-bytes'].topics['6'].code.match(/Record original = \{(\d+), (\d+)\}/);assert.equal(record.length,10);assert.equal(record.readUInt32LE(4),Number(recordSource[1]));assert.equal(record.readUInt16LE(8),Number(recordSource[2]));
const edges=JSON.parse(w.authoredLessons.content.graphs.topics['5'].code.match(/const int edges\[V\]\[V\] = (\{[\s\S]*?\});/)[1].replaceAll('{','[').replaceAll('}',']'));
for(const destination of w.conceptDiagrams.diagrams['dijkstra-relaxation'].data)for(const path of destination.paths){assert.equal(path.cost,path.weights.reduce((a,b)=>a+b,0));assert.equal(path.vertices.at(-1),destination.vertex);path.weights.forEach((weight,i)=>assert.equal(weight,edges[path.vertices[i]][path.vertices[i+1]]));}
const review=fs.readFileSync('docs/concept-diagram-review.md','utf8');for(const route of knownRoutes)assert.ok(review.includes('https://snowch.github.io/c-foundry/#/chapter/'+route+')'),'Missing review decision: '+route);
for(const lesson of w.LESSONS.filter(l=>!l.isExample))assert.ok(review.includes('`'+lesson.id+'` — '+lesson.title),'Missing practice review: '+lesson.id);
// The string pictures must show one C escape, not a double-backslash spelling.
for(const id of ['string','builder'])assert.equal(w.conceptDiagrams.diagrams[id].data.cells[3].value,String.fromCharCode(92)+'0');
// Check comparison counts against the same specified search problem independently.
function binaryCount(n){let lo=0,hi=n-1,count=0;while(lo<=hi){count++;const mid=lo+Math.floor((hi-lo)/2);if(mid===n-1)return count;lo=mid+1;}}
for(const row of w.conceptDiagrams.diagrams.growth.data.rows){const n=parseInt(row[0]);assert.equal(parseInt(row[1]),n);assert.equal(parseInt(row[2]),binaryCount(n));}
console.log('PASS original diagrams across all nine parts, 135 valid placements, accessible text, local assets, model counts, native reading parity and preserved editor/completion state');dom.window.close();
