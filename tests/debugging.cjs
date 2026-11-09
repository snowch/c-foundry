const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const dom=new JSDOM(fs.readFileSync('dist/index.html','utf8'),{url:'https://example.test/#/chapter/files-bytes/7',runScripts:'outside-only'}),w=dom.window;
w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};w.confirm=()=>true;w.Worker=class{postMessage(){}terminate(){}};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
for(const file of ['lessons','course','completion','part1','part2','part3','part4','part5','part6','part7','part8','part9','readings','visuals','execution','app'])w.eval(fs.readFileSync('dist/'+file+'.js','utf8'));
const $=q=>w.document.querySelector(q),go=path=>{w.history.pushState(null,'','#'+path);w.dispatchEvent(new w.HashChangeEvent('hashchange'));};
for(const [chapter,topic,lab,next] of [['files-bytes','7','basics','big-o'],['ship','8','tinydb','standards-evolution']]){
 go('/chapter/'+chapter+'/'+topic);
 const c=w.COURSE.chapters.find(c=>c.id===chapter);assert.equal(c.topics.at(-1).id,topic);assert.equal(c.topics.at(-1).optional,true);
 const panel=$('.debugging-lab');assert.ok(panel);assert.match(panel.textContent,/optional/i);assert.match(panel.textContent,/browser CLI does not provide GDB/);assert.equal(panel.querySelector('[data-copy-command]').dataset.copyCommand,'make debug-lab LAB='+lab);assert.equal(panel.querySelector('[data-codespaces-command]').target,'_blank');assert(panel.querySelector('a[href="#/chapter/'+next+'/1"]'));assert.equal($('#inline-editor-host'),null);
 assert.ok(panel.querySelectorAll('.debugging-steps li').length>=4);assert(panel.querySelector('details').textContent.includes('REFERENCE=1'));assert.equal($('input[data-lesson-complete]').checked,false);$('input[data-lesson-complete]').click();assert.equal($('#drawer-nav a[href="#/chapter/'+chapter+'/'+topic+'"]').dataset.completed,'true');
 $('input[name="topic-check"][value="'+w.authoredLessons.content[chapter].topics[topic].answer+'"]').click();$('[data-topic-check]').click();assert.match($('#topic-feedback').textContent,/Correct/);
 assert(fs.readFileSync('native/debugging/'+lab+'/README.md','utf8').includes('make debug-check LAB='+lab));assert(fs.existsSync('native/debugging/'+lab+'/.reference/main.c'));assert(fs.readFileSync('native/chapters/'+chapter+'/README.md','utf8').includes('make debug-gdb LAB='+lab));
}
go('/chapter/files-bytes/7');assert.match($('#preview-content .worked-example h2').textContent,/Reproduce the original failure/);assert.match($('.original-output').textContent,/total=20/);go('/chapter/ship/8');assert.match($('.page-navigation').textContent,/How C has evolved/);assert.equal(w.lessonCompletion.total().available,226);
assert(fs.existsSync('native/debugging/basics/main.c'));assert(fs.existsSync('native/debugging/tinydb/main.c'));
console.log('PASS optional GDB lesson placement, native commands/source guides, skip links, editable/reference separation, questions and TOC completion');dom.window.close();
