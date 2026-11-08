(() => {
  const $ = id => document.getElementById(id);
  const escape = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let state={drafts:{},inputs:{},completed:[],selected:'hello'};
  try { const saved=JSON.parse(localStorage.getItem('c-foundry-v1'));if(saved&&typeof saved==='object')state={...state,...saved}; } catch(_){}
  if(!state.drafts||typeof state.drafts!=='object')state.drafts={};
  if(!state.inputs||typeof state.inputs!=='object')state.inputs={};
  if(!Array.isArray(state.completed))state.completed=[];
  state.completed=state.completed.filter(id=>LESSONS.some(l=>l.id===id&&!l.isExample));
  const PRACTICE=COURSE.chapters.flatMap(c=>c.labs).map(id=>LESSONS.find(l=>l.id===id&&!l.isExample));
  let selected=Math.max(0,LESSONS.findIndex(l=>l.id===state.selected));
  let worker,timer,busy=false,mode='run',runLesson,toastTimer,view='lab',currentRoute='',inlineActive=false;
  const assessments={hello:'Explain what main and printf each do.',loops:'Explain why the loop includes n and what happens for n = 0.',pointers:'Explain why temp must keep its own copy of the first value.',heap:'Output checks cannot verify ownership. Confirm that every successful allocation is freed exactly once, including error paths.',search:'Output checks cannot establish that you used binary search. Explain the sorted-input requirement and how every iteration shrinks the interval.',sort:'Output checks cannot establish insertion sort or its complexity. Explain the sorted-prefix invariant and why shifting can take quadratic time.',rows:'Explain the width limit and the zero terminator in the name field.',query:'Explain why find_row returns an index, how duplicates are detected, and what happens when the table is full.'};
  function save(){try{localStorage.setItem('c-foundry-v1',JSON.stringify(state));$('save-state').textContent='Saved on this device';}catch(_){$('save-state').textContent='Storage unavailable. Export your code to keep a copy.';}}
  function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4000);}
  function nav(){
    $('drawer-progress').textContent=`${state.completed.length} of ${PRACTICE.length} available exercises checked`;
    $('drawer-nav').innerHTML='<p class="menu-label">Available practice</p>'+PRACTICE.map((l)=>`<a class="lesson-link ${l.id===LESSONS[selected].id&&view==='lab'?'active':''}" href="#/lesson/${l.id}" ${l.id===LESSONS[selected].id&&view==='lab'?'aria-current="page"':''}>${state.completed.includes(l.id)?'✓ ':''}${escape(l.title)}</a>`).join('')+'<p class="menu-label">Complete syllabus</p>'+COURSE.parts.map((part,i)=>`<details><summary>Part ${i+1}: ${escape(part)}</summary>${COURSE.chapters.filter(c=>c.part===i).map(c=>`<a href="#/chapter/${c.id}">${c.number}. ${escape(c.title)}</a>`).join('')}</details>`).join('');
  }
  function lines(){$('line-numbers').textContent=Array.from({length:$('editor').value.split('\n').length},(_,i)=>i+1).join('\n');$('line-numbers').scrollTop=$('editor').scrollTop;}
  function showView(next){view=next;['lab','curriculum','capstone','preview','complexity','setup'].forEach(v=>$(v+'-view').hidden=v!==next);document.querySelectorAll('[data-view]').forEach(b=>{const readingTopic=next==='preview'&&!!$('inline-editor-host');const active=(b.dataset.view==='lab'&&(next==='lab'||readingTopic))||(b.dataset.view==='curriculum'&&(next==='curriculum'||(!readingTopic&&['preview','complexity','setup'].includes(next))));b.classList.toggle('active',active);b.setAttribute('aria-current',active?'page':'false');});nav();}
  function select(index){
    selected=index;const l=LESSONS[index];state.selected=l.id;
    const chapter=COURSE.chapters.find(c=>c.id===l.chapterId||c.labs.includes(l.id));
    $('lesson-number').textContent=`${l.isExample?'Worked example':'Practice'} · Chapter ${chapter.number}`;$('duration').textContent=l.time;
    $('lesson-title').textContent=l.title;$('lesson-concept').textContent=l.concept;
    $('lesson-body').innerHTML=l.body;$('lesson-detail').innerHTML=l.detail;$('lesson-task').innerHTML=l.task;$('lesson-hint').textContent=l.hint;
    $('sample-input').textContent=l.input||'(no input)';$('expected-output').textContent=l.tests[0].expected;
    $('lesson-status').textContent=state.completed.includes(l.id)?'✓ Output checked':'';
    $('editor').value=state.drafts[l.id]??l.code;$('stdin').value=state.inputs[l.id]??l.input;
    $('input-dot').textContent=$('stdin').value?'•':'';$('lesson-counter').innerHTML=`<a href="#/chapter/${chapter.id}">Chapter ${chapter.number}: ${escape(chapter.title)}</a>`;
    updateExerciseNavigation();
    $('assessment-note').textContent='These checks compare output. '+(l.assessment||assessments[l.id]);
    $('reference-code').textContent=l.solution;
    $('output').textContent='Run your program to see its output.';$('output').className='';$('test-results').textContent='Use Check output to run the practice cases.';$('test-count').textContent='';
    window.lessonVisuals.show(l.id);document.querySelector('.worked-example').hidden=!!l.isExample;document.querySelector('#lab-view .prediction').hidden=!!l.isExample;document.querySelector('.hint').open=false;document.querySelector('.reference-solution').open=false;consoleTab('output');lines();save();showView('lab');
  }
  function renderMap(){
    $('course-cards').innerHTML=COURSE.parts.map((part,i)=>`<section class="course-part"><h2>Part ${i+1}. ${escape(part)}</h2><ol start="${COURSE.chapters.find(c=>c.part===i).number}">${COURSE.chapters.filter(c=>c.part===i).map(c=>`<li><a href="#/chapter/${c.id}"><strong>${escape(c.title)}</strong><span>${c.topics.length} ${c.status==='ready'?'lessons ready':'planned topics'} · ${courseExecution.label(c)}${c.labs.length?' · practice available':c.id==='big-o'?' · explorer available':' · preview'}</span></a></li>`).join('')}</ol></section>`).join('');
  }
  function preview(chapter,topic){
    if(chapter.status==='ready'){
      $('preview-content').innerHTML=partOne.render(chapter,topic);
      if(topic)mountInlineExample(chapter,topic);
      showView('preview');return;
    }
    const prev=COURSE.chapters[chapter.number-2];const next=COURSE.chapters[chapter.number];
    const topicIndex=topic?chapter.topics.indexOf(topic):-1;
    const title=topic?topic.title:chapter.title;
    const back=topic?`<a href="#/chapter/${chapter.id}">← ${escape(chapter.title)}</a>`:'<a href="#/course">← Complete course</a>';
    const labs=chapter.labs.map(id=>LESSONS.find(l=>l.id===id));
    $('preview-content').innerHTML=`${back}<p class="eyebrow">Part ${chapter.part+1} · Chapter ${chapter.number}${topic?'.'+topic.id:''} · Planned content</p><h1 tabindex="-1">${escape(title)}</h1><p class="preview-status">Preview page. The full ${topic?'lesson':'chapter'}, worked examples, and assessments are being developed.</p>${topic?`<h2>Planned lesson</h2><p>This lesson will cover <strong>${escape(topic.title)}</strong> as part of ${escape(chapter.title.toLowerCase())}.</p>`:'<h2>Topics in this chapter</h2><ol>'+chapter.topics.map(t=>`<li><a href="#/chapter/${chapter.id}/${t.id}">${escape(t.title)}</a><span class="status-label">Planned</span></li>`).join('')+'</ol>'}<h2>Practice goal</h2><p>${escape(chapter.project)}</p><p class="supporting">This is the planned chapter outcome, not a completed exercise.</p>${courseExecution.panel(chapter)}<h2>Before you start</h2><p>${prev?`Work through <a href="#/chapter/${prev.id}">Chapter ${prev.number}: ${escape(prev.title)}</a> and the preceding topics. Chapter links may lead to previews while the course is being built.`:'No prior C experience is assumed. Later lessons build on this introduction.'}</p>${labs.length?`<section class="available-practice"><h2>Try available practice</h2><p>These prototype exercises cover part of this chapter. They do not replace the full planned lessons.</p>${labs.map(l=>`<p><a href="#/lesson/${l.id}">${escape(l.title)} →</a></p>`).join('')}</section>`:''}${chapter.id==='big-o'?'<p><a class="primary-link" href="#/big-o">Explore counted search comparisons →</a></p>':''}<nav class="page-navigation" aria-label="Course sequence">${topic?(topicIndex>0?`<a href="#/chapter/${chapter.id}/${chapter.topics[topicIndex-1].id}">← Previous topic</a>`:'')+(topicIndex<chapter.topics.length-1?`<a href="#/chapter/${chapter.id}/${chapter.topics[topicIndex+1].id}">Next topic →</a>`:next?`<a href="#/chapter/${next.id}">Next chapter →</a>`:'<a href="#/course">Return to course map →</a>'):(prev?`<a href="#/chapter/${prev.id}">← Previous chapter</a>`:'')+(next?`<a href="#/chapter/${next.id}">Next chapter →</a>`:'<a href="#/course">Return to course map →</a>')}</nav>`;
    showView('preview');
  }
  function restoreEditor(){
    const panel=document.querySelector('.coding-panel');
    $('practice-editor-host').append(panel);
    panel.classList.remove('inline-editor');
    panel.querySelector('.editor-wrap').style.height='';
    inlineActive=false;
  }
  function mountInlineExample(chapter,topic){
    const id=`example-${chapter.id}-${topic.id}`;
    select(LESSONS.findIndex(l=>l.id===id));
    const panel=document.querySelector('.coding-panel');
    panel.classList.add('inline-editor');
    const lines=LESSONS[selected].code.split('\n').length;
    panel.querySelector('.editor-wrap').style.height=`${Math.min(16,Math.max(8,lines))*28.05+36}px`;
    $('inline-editor-host').append(panel);
    inlineActive=true;
    $('output').textContent='Run the program to see its actual output here.';
  }
  function renderRoute(){
    const raw=location.hash.slice(1)||'/lesson/'+state.selected;
    if(busy){history.replaceState(null,'','#'+currentRoute);toast('Stop the program before leaving this lesson.');return;}
    restoreEditor();
    const parts=raw.split('/').filter(Boolean);
    if(parts[0]==='lesson'&&LESSONS.some(l=>l.id===parts[1])){
      const l=LESSONS.find(l=>l.id===parts[1]);
      if(l.isExample){go(`/chapter/${l.chapterId}/${l.topicId}`,true);return;}
      select(LESSONS.indexOf(l));
    }
    else if(parts[0]==='course'){renderMap();showView('curriculum');}
    else if(parts[0]==='capstone')showView('capstone');
    else if(parts[0]==='setup')showView('setup');
    else if(parts[0]==='big-o'){window.lessonVisuals.updateComplexity();showView('complexity');}
    else if(parts[0]==='chapter'){
      const chapter=COURSE.chapters.find(c=>c.id===parts[1]),topic=chapter?.topics.find(t=>t.id===parts[2]);
      if(!chapter||(parts[2]&&!topic)){notFound();}else preview(chapter,topic);
    }else{notFound();}
    currentRoute=raw;document.title=(document.querySelector('main > section:not([hidden]) h1')?.textContent||'Course')+' · C Foundry';
    closeCourseMenu();const heading=document.querySelector('main > section:not([hidden]) h1');heading?.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});
  }
  function notFound(){$('preview-content').innerHTML='<h1 tabindex="-1">Page not found</h1><p><a href="#/course">Return to the course map</a></p>';showView('preview');}
  function go(path,replace=false){if(busy){toast('Stop the program before leaving this lesson.');return;}history[replace?'replaceState':'pushState'](null,'','#'+path);renderRoute();}
  function consoleTab(tab){document.querySelectorAll('[data-console]').forEach(b=>b.classList.toggle('active',b.dataset.console===tab));['output','input','tests'].forEach(p=>$(p+'-pane').hidden=p!==tab);}
  function setBusy(value){busy=value;$('run-button').disabled=value;$('check-button').disabled=value;$('stop-button').hidden=!value;$('editor').readOnly=value;$('reset-button').disabled=value;$('solution-button').disabled=value;updateExerciseNavigation();}
  function finish(){clearTimeout(timer);setBusy(false);$('engine-status').textContent='Browser compiler';}
  function stop(reason='Stopped. Your code and progress are saved.'){worker?.terminate();worker=null;finish();$('output').textContent=reason;consoleTab('output');}
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
        if(inlineActive){
          $('output').textContent=(data.diagnostics?'Compiler diagnostics:\n'+data.diagnostics+'\n\n':'')+(results[0].actual||'(no output)');
          $('engine-status').textContent='Finished';
        }
        if(mode==='check') {
          const passed=results.filter(r=>r.pass).length;
          $('test-count').textContent=`${passed}/${results.length}`;
          $('test-results').innerHTML=results.map(r=>`<div class="test-row ${r.pass?'pass':'fail'}"><span>${r.pass?'✓':'×'}</span><span>${escape(r.name)}</span><span style="margin-left:auto">${r.pass?'PASSED':'TRY AGAIN'}</span>${r.pass?'':`<pre>Expected: ${escape(r.expected)}\nReceived: ${escape(r.actual||'(empty output)')}</pre>`}</div>`).join('');
          consoleTab('tests');
          if(passed===results.length) {
            if(!runLesson.isExample&&!state.completed.includes(runLesson.id))state.completed.push(runLesson.id);
            save();nav();$('lesson-status').textContent=runLesson.isExample?'Example output checked':'✓ Output checked';toast('Output checks passed. Review your approach with the note below the editor.');
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
    if(busy || (view !== 'lab'&&!inlineActive))return;
    if(inlineActive)check=false;
    mode=check?'check':'run';runLesson=LESSONS[selected];setBusy(true);
    $('output').className='';$('output').textContent='Preparing the browser compiler…\nThe first run downloads about 19 MB. Later runs reuse the compiler.';
    $('test-results').textContent=check?'Compiling and running the checks…':'Run Check output to test this version of your code.'; $('test-count').textContent=''; consoleTab('output');
    timer=setTimeout(()=>stop('Compiler preparation timed out. Check your connection and try again.'),120000);
    try { getWorker().postMessage({code:$('editor').value,input:$('stdin').value,tests:check?runLesson.tests:undefined}); }
    catch(error){stop('Unable to start the compiler: '+error.message);}
  }

  $('editor').addEventListener('input',()=>{state.drafts[LESSONS[selected].id]=$('editor').value;lines();save();});
  $('editor').addEventListener('scroll',()=>{$('line-numbers').scrollTop=$('editor').scrollTop;});
  $('editor').addEventListener('keydown',event=>{if(event.key==='Tab'){event.preventDefault();if(busy)return;const el=event.target;el.setRangeText('    ',el.selectionStart,el.selectionEnd,'end');el.dispatchEvent(new Event('input'));}});
  $('stdin').oninput=()=>{state.inputs[LESSONS[selected].id]=$('stdin').value;$('input-dot').textContent=$('stdin').value?'•':'';save();};
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'&&(view==='lab'||inlineActive)){e.preventDefault();run(e.shiftKey);}});
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>go(b.dataset.view==='lab'?'/lesson/'+state.selected:'/course'));
  document.querySelectorAll('[data-console]').forEach(b=>b.onclick=()=>consoleTab(b.dataset.console));
  $('run-button').onclick=()=>run();$('check-button').onclick=()=>run(true);$('stop-button').onclick=()=>stop();
  function practiceSequence(){return COURSE.chapters.flatMap(c=>c.labs).filter(id=>PRACTICE.some(l=>l.id===id));}
  function updateExerciseNavigation(){const l=LESSONS[selected],sequence=practiceSequence(),i=sequence.indexOf(l.id);$('previous-button').disabled=busy||(!l.isExample&&i<=0);$('next-button').disabled=busy||(!l.isExample&&i===sequence.length-1);$('previous-button').textContent=l.isExample?'← Topic explanation':'← Previous exercise';$('next-button').textContent=l.isExample?'Chapter overview →':'Next exercise →';}
  $('previous-button').onclick=()=>{const l=LESSONS[selected],seq=practiceSequence();go(l.isExample?'/chapter/'+l.chapterId+'/'+l.topicId:'/lesson/'+seq[Math.max(0,seq.indexOf(l.id)-1)]);};
  $('next-button').onclick=()=>{const l=LESSONS[selected],seq=practiceSequence();go(l.isExample?'/chapter/'+l.chapterId:'/lesson/'+seq[Math.min(seq.length-1,seq.indexOf(l.id)+1)]);};
  $('reset-button').onclick=()=>{if(confirm('Restore starter code? Your current edits will be replaced.')){delete state.drafts[LESSONS[selected].id];delete state.inputs[LESSONS[selected].id];const previousView=view;select(selected);if(inlineActive)showView(previousView);toast('Starter code restored.');}};
  $('solution-button').onclick=()=>{if(confirm('Replace your code with the reference solution?')){$('editor').value=LESSONS[selected].solution;$('editor').dispatchEvent(new Event('input'));toast('Reference loaded. Compare it with your own approach.');}};
  $('download-button').onclick=()=>{const url=URL.createObjectURL(new Blob([$('editor').value],{type:'text/x-c'}));const a=document.createElement('a');a.href=url;a.download='main.c';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  $('clear-button').onclick=()=>{$('output').textContent='Console cleared.';$('output').className='';};
  $('start-db').onclick=()=>go('/chapter/database-foundations');
  document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#/"]');if(a&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.altKey&&e.button===0){e.preventDefault();go(a.getAttribute('href').slice(1));}});
  $('about-button')?.addEventListener('click',()=>$('about-dialog').showModal());$('close-about').onclick=()=>$('about-dialog').close();
  function closeCourseMenu(){if($('course-drawer').open)$('course-drawer').close();$('course-menu-button').setAttribute('aria-expanded','false');}
  $('course-menu-button').onclick=()=>{$('course-drawer').showModal();$('course-menu-button').setAttribute('aria-expanded','true');};
  $('close-course-menu').onclick=closeCourseMenu;
  $('course-drawer').addEventListener('close',()=>{$('course-menu-button').setAttribute('aria-expanded','false');$('course-menu-button').focus();});
  $('course-drawer').addEventListener('click',e=>{if(e.target===$('course-drawer')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeCourseMenu();}});
  $('drawer-course-map').onclick=()=>go('/course');
  window.addEventListener('hashchange',renderRoute);
  if(!location.hash)go('/lesson/'+LESSONS[selected].id,true);else renderRoute();
})();
