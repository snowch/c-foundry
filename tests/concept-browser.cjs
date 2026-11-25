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
    assert.ok(await figure.locator('.concept-node-value,.concept-tree-node,.buffer-value,.buffer-detail,td').evaluateAll(nodes=>nodes.every(n=>parseFloat(getComputedStyle(n).fontSize)>=16)),route+' unreadable figure text');
    assert.equal(await page.locator('[data-lesson-complete]').isChecked(),false);
   }
  }
  // Check the two tree shapes have visible edges, rather than turning into an ambiguous list.
  for(const width of [390,1024])for(const theme of ['light','dark'])for(const route of ['arrays-strings/3','trees-heaps/4','bplus-trees/6','parsing/3']){
   await page.setViewportSize({width,height:1000});await page.goto(url+'#/chapter/'+route);await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);const figure=page.locator('#preview-content .concept-diagram');await figure.waitFor();
   if(route==='trees-heaps/4'){assert.equal(await figure.locator('.concept-tree-node').count(),6);assert.equal(await figure.locator('.concept-tree-connectors').count(),3);}
   if(route==='arrays-strings/3'){
    assert.deepEqual(await figure.locator('.buffer-range').allTextContents(),['[0–11]','[12]','[13]','[14–31]']);assert.equal(await figure.locator('.buffer-text .buffer-value').textContent(),'Ada Lovelace');
    const boxes=await figure.locator('.buffer-group').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y};}));
    if(width===1024){assert.ok(boxes.every(b=>b.y===boxes[0].y));assert.ok(boxes.every((b,i)=>!i||b.x>boxes[i-1].x));}else assert.ok(boxes.every((b,i)=>!i||b.y>boxes[i-1].y));
    assert.ok(await figure.locator('.buffer-value').evaluateAll(nodes=>nodes.every(n=>n.scrollWidth<=n.clientWidth)),'Memory values must fit without clipping');
   }
   fs.mkdirSync('test-results',{recursive:true});await figure.screenshot({path:`test-results/concept-${route.replace('/','-')}-${width}-${theme}.png`});
  }
  await page.goto(url+'#/chapter/arrays-strings/3');const editor=page.locator('#editor'),starter=await editor.inputValue();await editor.fill(starter+'\n// saved while inspecting memory');await page.locator('.concept-text>summary').click();assert.equal(await editor.inputValue(),starter+'\n// saved while inspecting memory');
  await page.reload();assert.equal(await editor.inputValue(),starter+'\n// saved while inspecting memory');await page.locator('#run-button').click();await page.waitForFunction(()=>document.querySelector('#engine-status').textContent==='Run finished',null,{timeout:120000});assert.equal((await page.locator('#output').textContent()).trim(),'Read: Ada Lovelace');assert.equal(await page.locator('[data-lesson-complete]').isChecked(),false);
  assert.deepEqual(errors,[]);await context.close();console.log(`PASS all ${routes.length} distinct figures: three widths, two themes, expanded text, preserved draft/completion, tree links and real fgets compilation`);
 }finally{await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
