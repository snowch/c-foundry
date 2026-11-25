const {chromium}=require('playwright'),{start}=require('./server.cjs'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const {server,url}=await start({root:process.env.CONCEPT_SITE_ROOT||'.build/site'}),browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':chromium.executablePath()),headless:true});
 try{
  const context=await browser.newContext({serviceWorkers:'block'});await context.addInitScript(()=>localStorage.setItem('c-foundry:runner-intro:1','1'));
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(url+'#/chapter/arrays-strings/3');await page.locator('[data-concept="fgets-buffer"]').waitFor();
  // Every distinct figure is checked at phone, tablet and desktop widths in both themes.
  const routes=await page.evaluate(()=>Object.values(conceptDiagrams.diagrams).map(d=>d.routes[0]));
  for(const width of [320,768,1440])for(const theme of ['light','dark']){
   await page.setViewportSize({width,height:1000});
   for(const route of routes){
    await page.goto(url+'#/chapter/'+route);const figure=page.locator('#preview-content .concept-diagram');await figure.waitFor();await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
    assert.equal(await figure.count(),1,route);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${route}: ${width} ${theme} page overflow`);
    await figure.locator('.concept-text>summary').click();assert.equal(await figure.locator('.concept-text').getAttribute('open'),'');
    assert.ok(await figure.locator('.concept-text p').isVisible());
    assert.ok(await figure.locator('.concept-node-value,.concept-tree-node,.memory-value,td').evaluateAll(nodes=>nodes.every(n=>parseFloat(getComputedStyle(n).fontSize)>=16)),route+' unreadable figure text');
    assert.ok(await figure.locator('.concept-route-path').evaluateAll(nodes=>nodes.every(n=>n.scrollWidth<=n.clientWidth)),route+' clipped graph path');
    assert.equal(await page.locator('[data-lesson-complete]').isChecked(),false);
   }
  }
  // Check the two tree shapes have visible edges, rather than turning into an ambiguous list.
  for(const width of [390,1024])for(const theme of ['light','dark'])for(const route of ['arrays-strings/3','trees-heaps/4','bplus-trees/6','parsing/3']){
   await page.setViewportSize({width,height:1000});await page.goto(url+'#/chapter/'+route);await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);const figure=page.locator('#preview-content .concept-diagram');await figure.waitFor();
   if(route==='trees-heaps/4'){assert.equal(await figure.locator('.concept-tree-node').count(),6);assert.equal(await figure.locator('.concept-tree-connectors').count(),3);}
   if(route==='arrays-strings/3'){
    assert.equal(await figure.locator('.memory-byte').count(),32);const before=await figure.locator('.memory-byte').evaluateAll(nodes=>nodes.map(n=>({x:n.offsetLeft,y:n.offsetTop})));
    await figure.locator('[data-memory="before"]').click();assert.equal(await figure.locator('.memory-unknown').filter({has:page.locator('.memory-value')}).count(),32);await figure.locator('[data-memory="next"]').click();assert.equal(await figure.locator('[data-byte="0"]').getAttribute('data-kind'),'input');await figure.locator('[data-memory="after"]').click();
    assert.deepEqual(await figure.locator('.memory-byte').evaluateAll(nodes=>nodes.map(n=>({x:n.offsetLeft,y:n.offsetTop}))),before);assert.equal(await figure.locator('[data-byte="13"]').getAttribute('data-kind'),'terminator');
   }
   fs.mkdirSync('test-results',{recursive:true});await figure.screenshot({path:`test-results/concept-${route.replace('/','-')}-${width}-${theme}.png`});
  }
  await page.goto(url+'#/chapter/arrays-strings/3');const editor=page.locator('#editor'),starter=await editor.inputValue();await editor.fill(starter+'\n// saved while inspecting memory');await page.locator('.concept-text>summary').click();assert.equal(await editor.inputValue(),starter+'\n// saved while inspecting memory');
  await page.reload();assert.equal(await editor.inputValue(),starter+'\n// saved while inspecting memory');await page.locator('#run-button').click();await page.waitForFunction(()=>document.querySelector('#engine-status').textContent==='Run finished',null,{timeout:120000});assert.equal((await page.locator('#output').textContent()).trim(),'Read: Ada Lovelace');assert.equal(await page.locator('[data-lesson-complete]').isChecked(),false);
  assert.match(await page.locator('.memory-source').textContent(),/does not inspect your edited C program/);await editor.fill(starter);
  for(const [example,count,end,unread] of [['short',5,4,''],['long',32,31,'6789']]){
   await page.locator('#memory-example').selectOption(example);assert.equal(await page.locator('#memory-example').inputValue(),example);assert.equal(await editor.inputValue(),starter);await page.locator('#run-button').click();await page.waitForFunction(()=>document.querySelector('#engine-status').textContent==='Run finished',null,{timeout:120000});assert.match(await page.locator('.memory-source').textContent(),/last completed run/);assert.equal(await page.locator('.memory-count').textContent(),`${count} / 32 bytes written`);assert.equal(await page.locator(`[data-byte="${end}"]`).getAttribute('data-kind'),'terminator');if(unread)assert.match(await page.locator('.memory-unread').textContent(),/6789\\n/);
  }
  assert.deepEqual(errors,[]);await context.close();console.log(`PASS all ${routes.length} distinct figures: three widths, two themes, expanded text, preserved draft/completion, tree links and real fgets compilation`);
 }finally{await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
