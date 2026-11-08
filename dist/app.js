(() => {
  const $ = id => document.getElementById(id);
  let state = {drafts:{},inputs:{},completed:[],selected:'hello'};
  try { const saved = JSON.parse(localStorage.getItem('c-foundry-v1')); if(saved && typeof saved === 'object') state = {...state,...saved}; } catch (_) {}
  if (!state.drafts || typeof state.drafts !== 'object') state.drafts={};
  if (!state.inputs || typeof state.inputs !== 'object') state.inputs={};
  if (!Array.isArray(state.completed)) state.completed=[];
  state.completed=state.completed.filter(id=>LESSONS.some(l=>l.id===id));
  let selected = Math.max(0,LESSONS.findIndex(l=>l.id===state.selected));
  let worker, timer, busy = false, mode = 'run', runLesson, toastTimer, view = 'lab';
  const escape = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function save() { try { localStorage.setItem('c-foundry-v1',JSON.stringify(state)); $('save-state').textContent='◌ Saved on this device'; } catch (_) { $('save-state').textContent='Storage unavailable · export your code'; } }
  function toast(message) { $('toast').textContent=message; $('toast').hidden=false; clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('toast').hidden=true,4000); }
  function nav() {
    $('progress-text').textContent=`${state.completed.length} / ${LESSONS.length}`;
    $('progress-fill').style.width=`${state.completed.length / LESSONS.length * 100}%`;
    $('lesson-nav').innerHTML=SECTIONS.map((section,index)=>`<div class="section-label"><b>${section.icon}</b> ${section.title.toUpperCase()}</div>`+LESSONS.map((l,i)=>l.section===index?`<button class="lesson-link ${selected===i?'active':''}" data-lesson="${i}" ${selected===i?'aria-current="step"':''}><span class="lesson-bullet ${state.completed.includes(l.id)?'complete':''}">${state.completed.includes(l.id)?'✓':selected===i?'•':''}</span>${escape(l.title)}${selected===i?'<span class="arrow">›</span>':''}</button>`:'').join('')).join('');
    $('drawer-nav').innerHTML=$('lesson-nav').innerHTML;
    $('drawer-progress').textContent=`${state.completed.length} of ${LESSONS.length} lessons complete`;
    document.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>{ if(busy){toast('Stop the running program before switching lessons.');return;} select(Number(b.dataset.lesson));closeCourseMenu(); });
  }
  function lines() { $('line-numbers').textContent=Array.from({length:$('editor').value.split('\n').length},(_,i)=>i+1).join('\n'); $('line-numbers').scrollTop=$('editor').scrollTop; }
  function select(index) {
    if (busy) { toast('Stop the running program before switching lessons.'); return; }
    selected=index; state.selected=LESSONS[index].id; const l=LESSONS[index];
    $('section-name').textContent=SECTIONS[l.section].title.toUpperCase();
    $('lesson-number').textContent=`LESSON ${String(index+1).padStart(2,'0')} · ${l.tag.toUpperCase()}`;
    $('duration').textContent=l.time; $('lesson-title').textContent=l.title; $('lesson-concept').textContent=l.concept;
    $('lesson-body').innerHTML=l.body; $('lesson-detail').innerHTML=l.detail; $('lesson-task').innerHTML=l.task; $('lesson-hint').textContent=l.hint;
    $('expected-output').textContent=l.tests[0].expected; $('lesson-status').textContent=state.completed.includes(l.id)?'✓ COMPLETE':'';
    $('editor').value=state.drafts[l.id] ?? l.code; $('stdin').value=state.inputs[l.id] ?? l.input;
    $('input-dot').textContent=$('stdin').value?'•':''; $('lesson-counter').textContent=`${String(index+1).padStart(2,'0')} / ${String(LESSONS.length).padStart(2,'0')} LESSONS`;
    $('previous-button').disabled=index===0; $('next-button').disabled=index===LESSONS.length-1;
    $('output').textContent='Your next idea starts here.\nRun your code to see its output.'; $('output').className=''; $('test-results').textContent='Run Check solution to test your code.'; $('test-count').textContent='';
    window.lessonVisuals.show(l.id);
    document.querySelector('.hint').open=false; consoleTab('output'); lines();nav();save();showView('lab');
  }
  function showView(next) {
    view=next; ['lab','curriculum','capstone'].forEach(v=>$(v+'-view').hidden=v!==next);
    document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===next);b.setAttribute('aria-current',b.dataset.view===next?'page':'false');});
    if(next==='curriculum') { renderMap(); window.lessonVisuals.updateComplexity(); }
  }
  function renderMap() {
    $('course-cards').innerHTML=SECTIONS.map((s,idx)=>`<article class="course-card"><div class="description"><span class="eyebrow accent">${s.icon} / ${s.subtitle.toUpperCase()}</span><h2>${s.title}</h2><p>${s.description}</p><small>Full syllabus: ${s.topics}</small></div><div class="links">${idx===1?'<button class="big-o-link" data-explore-complexity><span>Big O: time &amp; space</span><small>EXPLORE ↗</small></button>':''}${LESSONS.map((l,i)=>l.section===idx?`<button data-open="${i}"><span>${state.completed.includes(l.id)?'✓ ':''}${l.title}</span><small>${l.time} →</small></button>`:'').join('')}</div></article>`).join('');
    document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>select(Number(b.dataset.open)));
  }
  function consoleTab(tab) { document.querySelectorAll('[data-console]').forEach(b=>b.classList.toggle('active',b.dataset.console===tab)); ['output','input','tests'].forEach(p=>$(p+'-pane').hidden=p!==tab); }
  function setBusy(value) { busy=value; $('run-button').disabled=value; $('check-button').disabled=value; $('stop-button').hidden=!value; $('editor').readOnly=value; $('reset-button').disabled=value; $('solution-button').disabled=value; $('previous-button').disabled=value||selected===0; $('next-button').disabled=value||selected===LESSONS.length-1; }
  function finish() { clearTimeout(timer); setBusy(false); $('engine-status').innerHTML='<span class="green-dot"></span> Browser compiler'; }
  function stop(reason='Stopped. Your code and progress are saved.') { worker?.terminate();worker=null;finish();$('output').textContent=reason;consoleTab('output'); }
  function getWorker() {
    if(worker)return worker;
    worker = new Worker('compiler/worker.js');
    worker.onmessage=({data})=>{
      if(data.type==='stage') {
        const names={loading:'Preparing compiler…',compiling:'Compiling C → Wasm…',running:'Running your program…'};
        $('engine-status').textContent=names[data.stage]||data.stage;
        if(data.stage==='running'){clearTimeout(timer);timer=setTimeout(()=>stop('Execution stopped after 5 seconds. Check for an infinite loop.'),5000);}
      } else if(data.type==='done') {
        finish();
        const results=data.results;
        $('output').textContent=(data.diagnostics ? 'Compiler diagnostics:\n'+data.diagnostics+'\n\n':'')+results[0].actual+(results[0].actual?'\n\n':'')+'Process finished successfully.';
        if(mode==='check') {
          const passed=results.filter(r=>r.pass).length;
          $('test-count').textContent=`${passed}/${results.length}`;
          $('test-results').innerHTML=results.map(r=>`<div class="test-row ${r.pass?'pass':'fail'}"><span>${r.pass?'✓':'×'}</span><span>${escape(r.name)}</span><span style="margin-left:auto">${r.pass?'PASSED':'TRY AGAIN'}</span>${r.pass?'':`<pre>Expected: ${escape(r.expected)}\nReceived: ${escape(r.actual||'(empty output)')}</pre>`}</div>`).join('');
          consoleTab('tests');
          if(passed===results.length) {
            if(!state.completed.includes(runLesson.id))state.completed.push(runLesson.id);
            save();nav();$('lesson-status').textContent='✓ COMPLETE';toast('All checks passed. A little more C, a little more confidence.');
          }
        }
      } else if(data.type==='error') {
        finish();$('output').className='error';$('output').textContent=[data.diagnostics,data.output,data.message].filter(Boolean).join('\n\n');consoleTab('output');
        if(mode==='check'){$('test-count').textContent='error';$('test-results').textContent='Checks could not finish. Fix the compiler or runtime error shown in Console.';}
        worker.terminate();worker=null;
      }
    };
    worker.onerror=e=>{stop('Compiler failed to start: '+e.message+'\nReload the page and retry.');$('output').className='error';};
    return worker;
  }
  function run(check=false) {
    if(busy)return;
    mode=check?'check':'run';runLesson=LESSONS[selected];setBusy(true);
    $('output').className='';$('output').textContent='Preparing the browser compiler…\nThe first run downloads about 19 MB. Later runs reuse the compiler.';
    $('test-results').textContent=check?'Compiling and running the checks…':'Run Check solution to test this version of your code.'; $('test-count').textContent=''; consoleTab('output');
    timer=setTimeout(()=>stop('Compiler preparation timed out. Check your connection and try again.'),120000);
    try { getWorker().postMessage({code:$('editor').value,input:$('stdin').value,tests:check?runLesson.tests:undefined}); }
    catch(error){stop('Unable to start the compiler: '+error.message);}
  }
  $('editor').addEventListener('input',()=>{state.drafts[LESSONS[selected].id]=$('editor').value;lines();save();});
  $('editor').addEventListener('scroll',()=>{$('line-numbers').scrollTop=$('editor').scrollTop;});
  $('editor').addEventListener('keydown',event=>{if(event.key==='Tab'){event.preventDefault();if(busy)return;const el=event.target;el.setRangeText('    ',el.selectionStart,el.selectionEnd,'end');el.dispatchEvent(new Event('input'));}});
  $('stdin').oninput=()=>{state.inputs[LESSONS[selected].id]=$('stdin').value;$('input-dot').textContent=$('stdin').value?'•':'';save();};
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'&&view==='lab'){e.preventDefault();run(e.shiftKey);}});
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>showView(b.dataset.view));
  document.querySelectorAll('[data-console]').forEach(b=>b.onclick=()=>consoleTab(b.dataset.console));
  $('run-button').onclick=()=>run();$('check-button').onclick=()=>run(true);$('stop-button').onclick=()=>stop();
  $('previous-button').onclick=()=>select(Math.max(0,selected-1));$('next-button').onclick=()=>select(Math.min(LESSONS.length-1,selected+1));
  $('reset-button').onclick=()=>{if(confirm('Restore the starter code for this lesson? Your current edits will be replaced.')){delete state.drafts[LESSONS[selected].id];delete state.inputs[LESSONS[selected].id];select(selected);toast('Starter code restored.');}};
  $('solution-button').onclick=()=>{if(confirm('Load the worked example? This replaces your current code.')){$('editor').value=LESSONS[selected].solution;$('editor').dispatchEvent(new Event('input'));toast('Worked example loaded. Run it, then change it to explore.');}};
  $('download-button').onclick=()=>{const url=URL.createObjectURL(new Blob([$('editor').value],{type:'text/x-c'}));const a=document.createElement('a');a.href=url;a.download='main.c';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  $('clear-button').onclick=()=>{$('output').textContent='Console cleared.';$('output').className='';};
  $('start-db').onclick=()=>select(7);
  document.addEventListener('click',e=>{if(e.target.closest('[data-explore-complexity]')){showView('curriculum');$('complexity-lab').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}});
  $('about-button').onclick=()=>$('about-dialog').showModal();$('close-about').onclick=()=>$('about-dialog').close();
  function closeCourseMenu(){ if($('course-drawer').open)$('course-drawer').close(); $('course-menu-button').setAttribute('aria-expanded','false'); }
  $('course-menu-button').onclick=()=>{$('course-drawer').showModal();$('course-menu-button').setAttribute('aria-expanded','true');};
  $('close-course-menu').onclick=closeCourseMenu;
  $('course-drawer').addEventListener('close',()=>{$('course-menu-button').setAttribute('aria-expanded','false');$('course-menu-button').focus();});
  $('course-drawer').addEventListener('click',e=>{if(e.target===$('course-drawer')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeCourseMenu();}});
  $('drawer-course-map').onclick=()=>{closeCourseMenu();showView('curriculum');};
  select(selected);
})();
