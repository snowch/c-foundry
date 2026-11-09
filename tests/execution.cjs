const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),{spawnSync}=require('child_process'),{JSDOM}=require('jsdom');
(async()=>{
const s={};s.window=s;vm.createContext(s);vm.runInContext(fs.readFileSync('dist/course.js','utf8'),s);
const course=JSON.parse(JSON.stringify(s.COURSE));assert.deepEqual(course,JSON.parse(fs.readFileSync('native/course.json','utf8')));
assert.equal(course.chapters.length,44);assert.equal(course.parts.length,9);assert.equal(course.chapters.reduce((n,c)=>n+c.topics.length,0),226);
assert.equal(new Set(course.chapters.map(c=>c.id)).size,44);
for(const [i,c] of course.chapters.entries()){
 assert.equal(c.number,i+1);assert.ok(/^[a-z0-9-]+$/.test(c.id));assert.ok(['browser','both','codespaces'].includes(c.execution.mode));
 assert.equal(c.command,'make chapter CHAPTER='+c.id);assert.equal(c.workspace,'native/chapters/'+c.id);
 assert.ok(fs.readFileSync(c.workspace+'/README.md','utf8').includes(c.command));
 const result=spawnSync('python3',['tools/lab.py','--chapter',c.id],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.ok(result.stdout.includes(c.title));
 if(i>=30)assert.ok(['both','codespaces'].includes(c.execution.mode));
}
assert.equal(spawnSync('python3',['tools/lab.py','--chapter','not-real']).status,2);
const config=JSON.parse(fs.readFileSync('.devcontainer/devcontainer.json','utf8'));assert.equal(config.build.dockerfile,'Dockerfile');assert.equal(config.remoteUser,'vscode');assert.equal(config.hostRequirements.cpus,2);assert.ok(config.postCreateCommand.includes('make check-native'));
const dom=new JSDOM('<section id="mount"></section>',{url:'https://example.test',runScripts:'outside-only'}),w=dom.window;w.eval(fs.readFileSync('dist/execution.js','utf8'));
assert.equal(w.courseExecution.url,'https://codespaces.new/snowch/c-foundry?quickstart=1');
const chapter=course.chapters.find(c=>c.id==='coordination');w.document.getElementById('mount').innerHTML=w.courseExecution.panel(chapter);
const a=w.document.querySelector('[data-codespaces-command]');assert.equal(a.href,w.courseExecution.url);assert.equal(a.target,'_blank');assert.ok(a.rel.includes('noopener'));assert.match(w.document.body.textContent,/source files and command are ready/);
let copied;Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async text=>{copied=text;}},configurable:true});
w.document.querySelector('[data-copy-command]').click();await new Promise(r=>setTimeout(r,0));assert.equal(copied,chapter.command);assert.match(w.document.querySelector('.launch-feedback').textContent,/Command copied/);
Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async()=>{throw new Error('denied');}},configurable:true});w.document.querySelector('[data-copy-command]').click();await new Promise(r=>setTimeout(r,0));assert.match(w.document.querySelector('.launch-feedback').textContent,/Copy the command shown above/);
assert.ok(!w.courseExecution.panel(course.chapters[0]).includes('data-codespaces-command'));
assert.equal(w.courseExecution.label(course.chapters[43]),'Codespaces lab');
console.log('PASS full syllabus, native workspace commands, container configuration, execution labels, and clipboard success/fallback');dom.window.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
