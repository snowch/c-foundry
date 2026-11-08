const assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom'),{IDBFactory}=require('fake-indexeddb');
const html=fs.readFileSync('dist/index.html','utf8'),enc=s=>new TextEncoder().encode(s),wait=()=>new Promise(resolve=>setTimeout(resolve,10));
async function setup(indexedDB){const dom=new JSDOM(html,{url:'https://example.test/c-foundry/#/workspace',runScripts:'outside-only'}),w=dom.window;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.Uint8Array=Uint8Array;w.indexedDB=indexedDB;w.confirm=()=>true;w.prompt=()=>null;let worker;w.Worker=class{constructor(){worker=this;}postMessage(data){this.request=data;}terminate(){this.terminated=true;}};for(const name of ['command-model','workspace'])w.eval(fs.readFileSync('dist/'+name+'.js','utf8'));await w.commandWorkspace.init();return {dom,w,$:id=>w.document.getElementById('ws-'+id),worker:()=>worker};}
async function run(ui,text){ui.$('command').value=text;ui.$('form').dispatchEvent(new ui.w.Event('submit',{cancelable:true}));await wait();}
async function done(ui,files,code=0){await ui.worker().onmessage({data:{type:'done',files,exitCode:code}});await wait();}
(async()=>{
const indexedDB=new IDBFactory(),first=await setup(indexedDB);assert.match(first.$('storage').textContent,/Files saved/);assert.match(first.$('files').textContent,/hello.c/);
await first.w.commandWorkspace.acceptSource('int main(void){return 0;}');assert.match(first.$('command').value,/cc main.c/);await first.w.commandWorkspace.acceptSource('int main(void){return 1;}');assert.match(first.$('command').value,/main-2.c/);
await run(first,'cc main.c -o program');assert.equal(first.worker().request.kind,'build');assert([...first.$('files').querySelectorAll('button')].every(button=>button.disabled));const files=[...first.worker().request.files,{name:'program',data:new Uint8Array([0,97,115,109,1,0,0,0])},{name:'people.db',data:enc('shared')}];await done(first,files);assert.equal(first.$('run').disabled,false);
const second=await setup(indexedDB);assert.match(second.$('files').textContent,/people.db/);
await run(first,'./program "two words"');assert.deepEqual(Array.from(first.worker().request.args),['two words']);await done(first,files.map(f=>f.name==='people.db'?{name:f.name,data:enc('newer')}:f),7);assert.match(first.$('status').textContent,/status 7/);
await run(second,'./program');await done(second,files);assert.match(second.$('storage').textContent,/another tab saved newer files/);assert.match(first.$('storage').textContent,/Files saved/);
const third=await setup(indexedDB);await run(third,'./program');assert.equal(new TextDecoder().decode(third.worker().request.files.find(f=>f.name==='people.db').data),'newer');third.$('stop').click();assert(third.worker().terminated);assert.match(third.$('status').textContent,/Stopped/);
// Workspace changes do not touch existing draft/completion storage keys.
assert.equal(first.w.localStorage.length,0);
// Normal browser storage failures retain downloadable session files.
const noStorage=await setup(undefined);assert.match(noStorage.$('storage').textContent,/Session only/);assert.match(noStorage.$('files').textContent,/hello.c/);await noStorage.w.commandWorkspace.acceptSource('source');assert.match(noStorage.$('files').textContent,/main.c/);
const quotaFactory=new IDBFactory();let quotaDB;const quotaStorage={open(...args){const request=quotaFactory.open(...args);request.addEventListener('success',()=>{quotaDB=request.result;});return request;}};
const quota=await setup(quotaStorage);quotaDB.transaction=()=>{throw Error('quota exceeded');};await quota.w.commandWorkspace.acceptSource('retained');assert.match(quota.$('storage').textContent,/Save failed/);assert.match(quota.$('files').textContent,/main.c/);
// Editing is explicit; a pending edit blocks commands and editor handoff.
first.$('files').querySelector('button').click();first.$('text').value='unsaved';first.$('text').dispatchEvent(new first.w.Event('input'));await run(first,'files');assert.match(first.$('status').textContent,/Save or close/);await assert.rejects(first.w.commandWorkspace.acceptSource('other'),/Save or close/);first.$('close-file').click();
for(const ui of [first,second,third,noStorage,quota])ui.dom.window.close();console.log('PASS workspace IndexedDB reload, unique draft copies, arguments, nonzero commit, cross-tab conflict, Stop, storage failure, explicit edits and independent lesson state');
})().catch(e=>{console.error(e);process.exitCode=1});
