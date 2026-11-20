const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),{spawnSync}=require('child_process'),{JSDOM}=require('jsdom');
(async()=>{
const s={};s.window=s;vm.createContext(s);vm.runInContext(fs.readFileSync('dist/course.js','utf8'),s);
const course=JSON.parse(JSON.stringify(s.COURSE));assert.deepEqual(course,JSON.parse(fs.readFileSync('native/course.json','utf8')));
assert.equal(course.chapters.length,44);assert.equal(course.parts.length,9);assert.equal(course.chapters.reduce((n,c)=>n+c.topics.length,0),227);
for(const [i,c] of course.chapters.entries()){
 assert.equal(c.number,i+1);assert.ok(['browser','both','linux'].includes(c.execution.mode));assert.equal(c.command,'make chapter CHAPTER='+c.id);
 const result=spawnSync('python3',['tools/lab.py','--chapter',c.id],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.ok(result.stdout.includes(c.title));
 if(c.part===7)assert.equal(c.execution.mode,'linux');
}
assert.equal(spawnSync('python3',['tools/lab.py','--chapter','not-real']).status,2);
assert.ok(fs.existsSync('.github/native/Dockerfile'));assert.match(fs.readFileSync('.github/workflows/pages.yml','utf8'),/\.github\/native\/Dockerfile/);
const dom=new JSDOM('<section id="mount"></section>',{url:'https://example.test',runScripts:'outside-only'}),w=dom.window;w.eval(fs.readFileSync('dist/execution.js','utf8'));
const chapter=course.chapters.find(c=>c.id==='coordination');w.document.getElementById('mount').innerHTML=w.courseExecution.panel(chapter);
const a=w.document.querySelector('[data-linux-command]');assert.equal(a.getAttribute('href'),'#/linux/coordination/'+encodeURIComponent(chapter.command));assert.equal(a.getAttribute('target'),null);assert.match(w.document.body.textContent,/No account or local installation/);
let copied;Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async text=>{copied=text;}},configurable:true});w.document.querySelector('[data-copy-command]').click();await new Promise(r=>setTimeout(r,0));assert.equal(copied,chapter.command);assert.match(w.document.querySelector('.launch-feedback').textContent,/Command copied/);
Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async()=>{throw Error('denied');}},configurable:true});w.document.querySelector('[data-copy-command]').click();await new Promise(r=>setTimeout(r,0));assert.match(w.document.querySelector('.launch-feedback').textContent,/Copy the command shown/);
assert.equal(w.courseExecution.label(chapter),'Browser Linux');assert.equal(w.courseExecution.label(course.chapters[43]),'Browser lab + Linux terminal');assert.ok(!w.courseExecution.panel(course.chapters[0]).includes('data-linux-command'));
console.log('PASS browser-only execution labels, all Part 8 chapters, CI toolchain path, internal Linux launch commands and clipboard success/fallback');dom.window.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
