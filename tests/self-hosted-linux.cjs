// Run the real guest from the course UI with every off-project request denied.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path');
(async()=>{
 const kind=process.argv[2],root=path.resolve('.build/site'),types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.wasm':'application/wasm','.woff2':'font/woff2'};
 const server=http.createServer(async(req,res)=>{try{let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(name.endsWith('/'))name+='index.html';const file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep))throw Error();res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file))}catch{res.writeHead(404);res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';let browser;
 try{
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
  const context=await browser.newContext({acceptDownloads:true}),blocked=[],failed=[],errors=[];
  await context.route('**/*',route=>{if(!route.request().url().startsWith(base)){blocked.push(route.request().url());return route.abort()}return route.continue()});
  context.on('response',r=>{if(r.status()>=400)failed.push([r.status(),r.url()])});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+(kind==='c'?'#/linux':''));
  const marker=kind==='go'?'Hello, self-hosted source!':'C self-hosted source!';
  if(kind==='go'){
   await page.waitForFunction(()=>document.querySelector('#source-file').options.length>0);
   const original=await page.locator('#source').inputValue();await page.locator('#source').fill(original.replace('Hello, Go!',marker)+'\n// café 漢字 $(touch /tmp/SHOULD_NOT_EXIST)\n');
   await page.locator('#source').dispatchEvent('input');await page.locator('#run-source').click();
  }else{
   await page.locator('#linux-source-tools').evaluate(e=>e.open=true);
   await page.waitForFunction(()=>!document.querySelector('#linux-source-file').disabled);
   await page.locator('#linux-source-file').selectOption('native/demos/counter.c');
   await page.locator('#linux-source-code').fill('#include <stdio.h>\n/* café 漢字 $(touch /tmp/SHOULD_NOT_EXIST) */\nint main(void) { puts("'+marker+'"); return 0; }\n');
   await page.locator('#linux-source-code').dispatchEvent('input');await page.locator('[data-linux-copy="linux-source-apply"]').click();
  }
  const target=page.locator(kind==='go'?'#terminal iframe':'#linux-terminal iframe');await target.waitFor();const frame=await target.elementHandle().then(e=>e.contentFrame());
  const output=()=>frame.evaluate(()=>foundryLinux.getTranscript());
  await frame.waitForFunction(marker=>globalThis.foundryLinux?.getTranscript().includes(marker),marker,{timeout:300000});
  console.log('PASS '+kind+' actual edited source transferred and executed without manual paste');
  const command=kind==='go'?'cd /root/work/go-foundry && ./run channels && ./run db-insert && ./run db-read':'cd /root/work/c-foundry && make counter CC=clang NATIVE_BUILD=.build/clang-bridge && gdb -batch -ex "break main" -ex run -ex continue .build/native/counter';
  await page.evaluate(({selector,command})=>document.querySelector(selector).contentWindow.postMessage({channel:'foundry-linux',type:'command',command:command+'; result=$?; if test -e /tmp/SHOULD_NOT_EXIST; then result=99; fi; printf "\\n__REAL_GUEST_CHECK_EXIT:%s\\n" "$result"'},location.origin),{selector:kind==='go'?'#terminal iframe':'#linux-terminal iframe',command});
  await frame.waitForFunction(()=>foundryLinux.getTranscript().includes('__REAL_GUEST_CHECK_EXIT:0'),null,{timeout:420000});
  const text=await output();if(kind==='go'){assert(text.includes('sum 29'));assert(text.includes('7 | Ada | 42'))}else{assert(text.includes('clang'));assert(text.includes('Breakpoint 1'))}
  console.log('PASS '+kind+' real compiler/runtime checks; shell metacharacters in editor text did not execute');
  const downloaded=page.waitForEvent('download',{timeout:90000});
  await page.locator(kind==='go'?'#copy-save':'[data-linux-copy="linux-save"]').click();
  const archive=await downloaded;const backup=path.resolve('test-results/'+kind+'-work.tar.gz');await fs.mkdir(path.dirname(backup),{recursive:true});await archive.saveAs(backup);assert((await fs.stat(backup)).size>100);
  if(kind==='go'){
   await page.locator('#linux-stop').click();await page.locator('#confirm-stop').click();await page.locator('#linux-start').click();
  }else{
   page.once('dialog',d=>d.accept());await page.locator('#linux-stop').click();
   await page.locator('#app-status-open').click();await page.locator('#download-update').waitFor();await page.locator('#download-update').click();
   await page.waitForFunction(()=>document.querySelector('#version-status').textContent.includes('Downloaded and ready')||!document.querySelector('#restart-update').hidden,null,{timeout:180000});
   if(await page.locator('#restart-update').isVisible()){await page.locator('#restart-update').click();await page.waitForLoadState('domcontentloaded');}else await page.locator('#app-status-close').click();
   await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await page.goto(base+'#/chapter/coordination/1');await page.locator('.topic-content').waitFor();await page.goto(base+'#/linux');
   await page.locator('#linux-start').click();
  }
  const fresh=await page.locator(kind==='go'?'#terminal iframe':'#linux-terminal iframe').elementHandle().then(e=>e.contentFrame());
  await fresh.waitForFunction(()=>document.querySelector('#status').textContent==='Linux is ready.',null,{timeout:300000});
  const uploadName=kind==='go'?'go-foundry-work.tar.gz':'c-foundry-work.tar.gz';
  const bytes=await fs.readFile(backup);await fresh.locator('#upload').setInputFiles({name:uploadName,mimeType:'application/gzip',buffer:bytes});
  await fresh.waitForFunction(()=>document.querySelector('#status').textContent==='File uploaded to /root.');
  if(kind==='c')await page.locator('.linux-backup details > summary').click();
  page.once('dialog',d=>d.accept());await page.locator(kind==='go'?'#copy-restore':'[data-linux-copy="linux-restore"]').click();
  if(kind==='c')await page.locator('[data-linux-copy="linux-command"]').click();
  await fresh.waitForFunction(expected=>foundryLinux.getTranscript().includes(expected),kind==='go'?'7 | Ada | 42':marker,{timeout:180000});
  console.log('PASS '+kind+' genuine archive export, fresh guest upload and restored work'+(kind==='c'?' with the network disabled':''));
  assert.deepEqual(blocked,[],'No request may leave the project');assert.deepEqual(failed,[],'All required local assets must load');assert.deepEqual(errors,[]);
  await fs.writeFile('test-results/'+kind+'-self-hosted.json',JSON.stringify({date:new Date().toISOString(),kind,blocked,failed,errors,output:await fresh.evaluate(()=>foundryLinux.getTranscript())},null,2));
 }finally{await browser?.close();await new Promise(r=>server.close(r))}
})().catch(error=>{console.error(error);process.exitCode=1});
