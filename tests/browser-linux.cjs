const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const dom=new JSDOM(fs.readFileSync('dist/index.html','utf8'),{url:'https://example.test/#/course',runScripts:'outside-only'}),w=dom.window;let allowStop=false;
w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};w.confirm=()=>allowStop;w.Worker=class{postMessage(){}terminate(){}};
w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
for(const f of ['lessons','course','completion','part1','part2','part3','part4','part5','part6','part7','part8','part9','references','concepts','readings','visuals','execution','browser-linux','app'])w.eval(fs.readFileSync('dist/'+f+'.js','utf8'));
const $=id=>w.document.getElementById(id),go=route=>{w.history.pushState(null,'','#'+route);w.dispatchEvent(new w.HashChangeEvent('hashchange'));};
assert.equal(w.document.querySelector('iframe'),null);assert.equal($('linux-view').hidden,true);
const contents=$('course-cards').textContent;assert.ok(!/Browser lab|Browser Linux|Linux terminal|Native tools/.test(contents));const part=w.document.querySelectorAll('#course-cards .course-part')[7];assert.equal(part.querySelectorAll('li').length,4);assert.match(part.textContent,/chapter project/);
let checked=0;
for(const chapter of w.COURSE.chapters.filter(c=>c.part===7))for(const topic of chapter.topics){
 checked++;go('/chapter/'+chapter.id+'/'+topic.id);const a=w.document.querySelector('.native-example [data-linux-command]');assert.ok(a);const command='make example EXAMPLE='+chapter.id+'-'+topic.id+' RUN_ONLY=1';assert.equal(a.dataset.linuxCommand,command);a.click();assert.equal($('linux-view').hidden,false);assert.equal($('linux-command').textContent,command);assert.equal(w.document.querySelector('iframe'),null);
}
assert.equal(checked,14);
$('linux-start').click();const frame=w.document.querySelector('#linux-terminal iframe');assert.ok(frame);const url=new URL(frame.src);assert.equal(url.origin,'https://example.test');assert.equal(url.pathname,'/linux/index.html');assert.match(frame.getAttribute('sandbox'),/allow-downloads/);assert.ok(!frame.getAttribute('sandbox').includes('allow-top-navigation'));
go('/course');assert.equal(w.document.querySelector('#linux-terminal iframe'),frame);go('/linux');assert.equal($('linux-command').textContent,'make example EXAMPLE=concurrent-storage-4 RUN_ONLY=1');assert.equal(w.document.querySelector('#linux-terminal iframe'),frame);
$('linux-stop').click();assert.equal(w.document.querySelector('#linux-terminal iframe'),frame);allowStop=true;$('linux-stop').click();assert.equal(w.document.querySelector('#linux-terminal iframe'),null);
go('/linux/threads/'+encodeURIComponent('rm -rf /'));assert.match($('preview-content').textContent,/Page not found/);assert.equal(w.document.querySelector('iframe'),null);
go('/tools/threadsanitizer');assert.match($('preview-content').textContent,/Optional reading/);assert.match($('preview-content').textContent,/data race/);assert.match($('preview-content').textContent,/no lab to complete/);assert.equal(w.document.querySelector('#preview-content [data-lesson-complete]'),null);assert.equal(w.document.querySelector('#preview-content .coding-panel'),null);assert.equal(w.lessonCompletion.total().available,227);assert.equal(w.document.querySelector('iframe'),null);
for(const chapter of w.COURSE.chapters){for(const command of w.browserLinux.commands(chapter))assert.equal(w.browserLinux.show(chapter.id,command),true);}
assert.equal(w.browserLinux.show('not-a-chapter','make counter'),false);assert.equal(w.browserLinux.show('threads','make example EXAMPLE=coordination-1'),false);
assert.equal($('linux-bundle').getAttribute('download'),'c-foundry-browser.tar.gz');assert.match($('linux-save').textContent,/export_file/);assert.match($('linux-restore').textContent,/c-foundry-work.tar.gz/);
(async()=>{try{
 const sources=JSON.parse(fs.readFileSync('dist/assets/browser-linux-sources.json','utf8'));let fetches=0;
 w.fetch=async url=>{fetches++;assert.equal(url,'assets/browser-linux-sources.json');return {ok:true,json:async()=>sources};};
 go('/linux/threads/'+encodeURIComponent('make example EXAMPLE=threads-1'));
 $('linux-source-tools').open=true;$('linux-source-tools').dispatchEvent(new w.Event('toggle'));await new Promise(resolve=>setTimeout(resolve,20));
 const path='native/examples/threads-1/main.c',original=sources.files[path];assert.equal($('linux-source-file').value,path);assert.equal($('linux-source-code').value,original);assert.equal(fetches,1);
 $('linux-source-code').value=original+'\n// browser draft';$('linux-source-code').dispatchEvent(new w.Event('input'));assert.equal(w.localStorage.getItem('c-foundry-linux-source:'+path),original+'\n// browser draft');
 go('/linux/coordination/'+encodeURIComponent('make example EXAMPLE=coordination-1'));go('/linux/threads/'+encodeURIComponent('make example EXAMPLE=threads-1'));assert.match($('linux-return').getAttribute('href'),/chapter\/threads\/1$/);assert.equal($('linux-source-code').value,original+'\n// browser draft');
 let filename;w.URL.createObjectURL=()=> 'blob:source';w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){filename=this.download;};$('linux-source-download').click();assert.equal(filename,'native__examples__threads-1__main.c');assert.ok($('linux-source-apply').textContent.includes('cp ~/native__examples__threads-1__main.c ~/work/c-foundry/'+path));
 $('linux-source-reset').click();assert.equal($('linux-source-code').value,original);assert.equal(w.localStorage.getItem('c-foundry-linux-source:'+path),null);
 const save=w.Storage.prototype.setItem;w.Storage.prototype.setItem=function(key,value){if(key.startsWith('c-foundry-linux-source:'))throw Error('Storage full');return save.call(this,key,value);};
 $('linux-source-code').value=original+'\n// session-only draft';$('linux-source-code').dispatchEvent(new w.Event('input'));assert.match($('linux-source-status').textContent,/session only/);
 go('/linux/coordination');go('/linux/threads/'+encodeURIComponent('make example EXAMPLE=threads-1'));assert.match($('linux-source-code').value,/session-only draft/);
 const leave=new w.Event('beforeunload',{cancelable:true});w.dispatchEvent(leave);assert.equal(leave.defaultPrevented,true);assert.equal(fetches,1);assert.equal(w.document.querySelector('iframe'),null);
 console.log('PASS all 14 Browser Linux links, on-demand loading, retained guest, explicit stop, command allowlist, optional TSan reading, tablet-friendly source editing, export, reset, draft preservation and storage failure');
 }finally{dom.window.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
