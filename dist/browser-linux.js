/* Self-hosted Linux terminal with a guest-only file-transfer bridge. */
(() => {
 const localBase=new URL('.',document.currentScript?.src||location.href);
  const $=id=>document.getElementById(id),escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const HOST=new URL('linux/index.html',localBase).href;
  const SETUP='cd /root/work/c-foundry && gcc --version | head -1';
  const SAVE='cd ~/work && tar czf ~/c-foundry-work.tar.gz c-foundry && export_file ~/c-foundry-work.tar.gz';
  const RESTORE='mkdir -p ~/work && tar xzf ~/c-foundry-work.tar.gz -C ~/work && cd ~/work/c-foundry';
  let lastSelection={chapterId:'',command:''};
  let ready=false,pending=null,expanded=false,previousOverflow='',focusInert=[];
  let frame=null,sourceIndex,sourceLoading,currentSource="",sourceContext={chapter:null,command:"make counter"};
  const sourceDrafts=new Map(),unsavedSources=new Set();
  function commands(chapter){
    const result=new Set([chapter.command,...(chapter.id==='first-program'?['man 3 printf']:[])]),data=authoredLessons.content[chapter.id];
    for(const topic of chapter.topics){const t=data.topics[topic.id];const command=t.command||`make example EXAMPLE=${chapter.id}-${topic.id}`;result.add(command);result.add(command+' RUN_ONLY=1');if(t.lab)result.add(t.lab.command);}
    if(data.nativePractice)result.add(`make project PROJECT=${data.nativePractice.id}`);
    if(data.practicePlan)result.add(data.practicePlan.command||`make example EXAMPLE=${data.practicePlan.example}`);
    return result;
  }
  function show(chapterId='',command='',returnPractice=false){
    if(!chapterId&&!command){chapterId=lastSelection.chapterId;command=lastSelection.command;returnPractice=lastSelection.returnPractice;}
    const chapter=chapterId?COURSE.chapters.find(c=>c.id===chapterId):null;
    if(chapterId&&!chapter||command&&(!chapter||!commands(chapter).has(command)))return false;
    lastSelection={chapterId,command,returnPractice};
    const help=command==='man 3 printf';$('linux-view').classList.toggle('linux-help-mode',help);
    document.querySelector('#linux-view>h1').textContent=help?'Practise finding help with man':'Browser Linux';
    let guide=$('linux-help-guide');if(!guide){guide=document.createElement('section');guide.id='linux-help-guide';guide.innerHTML='<h2>Find a rule, then use it in your code</h2><p>Open the printf manual below. In the terminal’s Find in manual field, enter <strong>RETURN VALUE</strong> and choose <strong>Find</strong>. Read what success and failure return.</p><button id="linux-help-open">Open printf · man 3 printf</button><p>Use <strong>Next page</strong>, <strong>Previous page</strong> or swipe inside the manual. <strong>Close manual · q</strong> returns to the shell without stopping Linux.</p><p>After closing the manual, enter <code>man -k printf</code> in <strong>Command</strong> and choose <strong>Run</strong>. Find the entry in section 3, the section for C library functions.</p><a class="primary-link" href="#/chapter/first-program/6">Back to the prediction and C program →</a>';
      document.querySelector('#linux-view .linux-steps').before(guide);$('linux-help-open').onclick=()=>copy('linux-command');}
    guide.hidden=!help;
    sourceContext={chapter,command:command||chapter?.command||'make counter'};
    if(sourceIndex&&$('linux-source-tools').open)chooseSource();
    $('linux-context').textContent=chapter?`Chapter ${chapter.number}: ${chapter.title}`:'A complete Linux toolchain, running in your browser';
    $('linux-command').textContent=command||chapter?.command||'make counter';
    const topic=command==='man 3 printf'?chapter?.topics.find(t=>t.id==='6'):chapter?.topics.find(topic=>{const t=authoredLessons.content[chapter.id].topics[topic.id];return (t.command||`make example EXAMPLE=${chapter.id}-${topic.id}`)===command.replace(/ RUN_ONLY=1$/,'')||t.lab?.command===command;});
    const project=returnPractice&&chapter?authoredLessons.practices(chapter).find(p=>p.project):null;
    $('linux-return').href=project?project.href:chapter?'#/chapter/'+chapter.id+(topic?'/'+topic.id:''):'#/course';
    $('linux-return').textContent=project?'← Return to practice: '+project.title:chapter?'← Return to '+(topic?.title||chapter.title):'← Complete course';
    return true;
  }
  function start(){
    if(frame){frame.focus();return;}
    const width=$('linux-terminal').clientWidth||Math.max(240,innerWidth-64),cols=Math.max(18,Math.min(100,Math.floor((width-96)/10)));
    const url=new URL(HOST);
    frame=document.createElement('iframe');frame.title='C Foundry self-hosted Linux terminal';frame.src=url.href;frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-downloads allow-forms');frame.setAttribute('allow','fullscreen; clipboard-read; clipboard-write');frame.allowFullscreen=true;
    const focusBar=document.createElement('div');focusBar.className='linux-focus-bar';focusBar.innerHTML='<strong>Browser Linux</strong><button type="button" id="linux-exit-expanded">Exit full screen</button>';
    $('linux-terminal').replaceChildren(focusBar,frame);$('linux-exit-expanded').onclick=()=>setExpanded(false);$('linux-start').hidden=true;$('linux-stop').hidden=false;$('linux-fullscreen').hidden=false;
    $('linux-session-status').textContent='Starting the self-hosted Linux guest. The course files are prepared automatically. Wait for Linux is ready.';
  }
  function stop(){if(!frame)return;if(!confirm('Stop Browser Linux? Export a work backup first. Unsaved terminal files will be lost.'))return;setExpanded(false);$('linux-terminal').replaceChildren();frame=null;ready=false;pending=null;$('linux-start').hidden=false;$('linux-stop').hidden=true;$('linux-fullscreen').hidden=true;$('linux-session-status').textContent='Terminal stopped. Start a new session and import your work backup to continue.';}
  function sendPending(){if(!ready||!frame||!pending)return;frame.contentWindow.postMessage({channel:'foundry-linux',...pending},location.origin);pending=null;}
  function queue(packet){if(pending){$('linux-feedback').textContent='Linux is starting for the requested command. Wait for it to be ready.';return;}pending=packet;start();sendPending();}
  function copy(id){
    if(id==='linux-source-apply')queue({type:'apply',path:'/root/work/c-foundry/'+currentSource,source:$('linux-source-code').value,command:'cd /root/work/c-foundry && '+sourceContext.command,id:Date.now()});
    else {if(id==='linux-restore'&&!confirm('Restore the uploaded work archive? Export current guest work first if you want to keep it.'))return;queue({type:'command',command:(id==='linux-command'?'cd /root/work/c-foundry && ':'')+$(id).textContent});}
  }
  addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==frame?.contentWindow||event.data?.channel!=='foundry-linux')return;const d=event.data;if(d.type==='exit-expanded'){setExpanded(false);return;}if(d.type==='focus-exit'&&expanded){$('linux-exit-expanded').focus();return;}if(d.type==='ready'){ready=true;sendPending();}if(d.type==='pager'){if($('linux-help-open'))$('linux-help-open').disabled=d.active;}if(d.type==='status')$('linux-session-status').textContent=d.message;if(d.type==='submitted')$('linux-feedback').textContent='Sent '+d.path+' to Linux. Inspect the terminal output.';if(d.type==='error'){pending=null;$('linux-feedback').textContent=d.message;}});
  function defaultSource(){
    const {chapter,command}=sourceContext;
    let match=command.match(/make project PROJECT=([a-z-]+)/);if(match)return `native/projects/${match[1]}/${match[1]==='record-store'?'store.c':'record.c'}`;
    match=command.match(/make debug-(?:lab|gdb|check) LAB=([a-z-]+)/);if(match)return `native/debugging/${match[1]}/main.c`;
    match=command.match(/make example EXAMPLE=([a-z0-9-]+)/);const id=match?.[1]||(chapter?chapter.id+'-'+chapter.topics[0].id:null);
    if(id)return sourceIndex.files[`native/examples/${id}/main.c`]!==undefined?`native/examples/${id}/main.c`:`native/examples/${id}.c`;
    return 'native/demos/counter.c';
  }
  function showSource(path){
    if(!sourceIndex||!Object.hasOwn(sourceIndex.files,path)||!/^native\/[A-Za-z0-9_./-]+\.[ch]$/.test(path)||path.split('/').includes('..'))return;
    currentSource=path;$('linux-source-file').value=path;
    let draft=sourceDrafts.get(path);if(draft===undefined)try{draft=localStorage.getItem('c-foundry-linux-source:'+path)??undefined;}catch(_){}
    $('linux-source-code').value=draft??sourceIndex.files[path];
    const name=path.replaceAll('/','__');
    $('linux-source-export').textContent=`export_file ~/work/c-foundry/${path}`;document.querySelector('[data-linux-copy="linux-source-export"]').disabled=false;
    $('linux-source-apply').textContent=`cp ~/${name} ~/work/c-foundry/${path} && cd ~/work/c-foundry && ${sourceContext.command}`;
    $('linux-source-code').disabled=false;$('linux-source-file').disabled=false;document.querySelector('[data-linux-copy="linux-source-apply"]').disabled=false;
    $('linux-source-download').disabled=false;$('linux-source-reset').disabled=false;$('linux-source-import').disabled=false;
    $('linux-source-status').textContent=unsavedSources.has(path)?'Draft is kept in this session only. Download the file to keep it.':'Draft edits are saved in this browser. Choose Run edited source in Linux to use this editor text.';
  }
  function chooseSource(){const path=defaultSource();showSource(Object.hasOwn(sourceIndex.files,path)?path:Object.keys(sourceIndex.files)[0]);}
  async function loadSources(){
    if(sourceIndex){chooseSource();return;}
    if(sourceLoading)return;
    $('linux-source-status').textContent='Loading the course source files…';
    sourceLoading=(async()=>{try{const response=await fetch(document.querySelector('meta[name="gpu-release"]')?new URL('assets/browser-linux-sources.json',localBase):'assets/browser-linux-sources.json');if(!response.ok)throw Error('Source request failed');const value=await response.json();if(value.format!==1||!value.files||typeof value.files!=='object')throw Error('Invalid source index');sourceIndex=value;$('linux-source-file').innerHTML=Object.keys(value.files).filter(path=>/^native\/[A-Za-z0-9_./-]+\.[ch]$/.test(path)&&!path.split('/').includes('..')).map(path=>`<option value="${escape(path)}">${escape(path)}</option>`).join('');chooseSource();}catch(error){$('linux-source-status').textContent='Could not load the source editor. Close and reopen this section to retry, or edit the imported bundle using nano.';}finally{sourceLoading=null;}})();
    await sourceLoading;
  }
  $('linux-source-tools').ontoggle=()=>{if($('linux-source-tools').open)loadSources();};
  $('linux-source-file').onchange=event=>showSource(event.target.value);
  $('linux-source-code').oninput=()=>{if(!currentSource)return;const text=$('linux-source-code').value;sourceDrafts.set(currentSource,text);try{localStorage.setItem('c-foundry-linux-source:'+currentSource,text);unsavedSources.delete(currentSource);$('linux-source-status').textContent='Draft saved here. Choose Run edited source in Linux to use this editor text.';}catch(_){unsavedSources.add(currentSource);$('linux-source-status').textContent='Storage unavailable. This draft stays in this session only; download it to keep it.';}};
  $('linux-source-code').onkeydown=event=>{if(event.key==='Tab'){event.preventDefault();event.target.setRangeText('    ',event.target.selectionStart,event.target.selectionEnd,'end');event.target.dispatchEvent(new Event('input'));}};
  $('linux-source-download').onclick=()=>{if(!currentSource)return;const url=URL.createObjectURL(new Blob([$('linux-source-code').value],{type:'text/x-c'})),a=document.createElement('a');a.href=url;a.download=currentSource.replaceAll('/','__');a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  $('linux-source-import').onclick=()=>{if(currentSource)$('linux-source-import-file').click();};
  $('linux-source-import-file').onchange=async event=>{
    const file=event.target.files[0],target=currentSource;if(!file||!target)return;
    try{if(file.size>1048576)throw Error('Choose a C source file up to 1 MB.');const text=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Could not read that file.'));reader.readAsText(file);});if(currentSource!==target)throw Error('Source selection changed. Select the intended path and import again.');$('linux-source-code').value=text;$('linux-source-code').dispatchEvent(new Event('input'));$('linux-source-status').textContent='Imported into the editor draft for '+target+'. Choose Run edited source in Linux when ready; the running Linux file has not been changed yet.';}catch(error){$('linux-source-status').textContent=error.message;}finally{event.target.value='';}
  };
  $('linux-source-reset').onclick=()=>{if(!currentSource||!confirm('Restore this original source file? Its draft edits will be replaced.'))return;sourceDrafts.delete(currentSource);unsavedSources.delete(currentSource);try{localStorage.removeItem('c-foundry-linux-source:'+currentSource);}catch(_){}showSource(currentSource);};
  $('linux-setup').textContent=SETUP;$('linux-save').textContent=SAVE;$('linux-restore').textContent=RESTORE;
  $('linux-start').onclick=start;$('linux-stop').onclick=stop;
  function setExpanded(active){
    if(active&&!frame)return;
    if(active===expanded)return;expanded=active;
    const panel=$('linux-terminal');panel.classList.toggle('is-expanded',active);$('linux-fullscreen').setAttribute('aria-expanded',String(active));
    if(active){focusInert=[];for(let node=panel;node.parentElement&&node!==document.body;node=node.parentElement){for(const sibling of node.parentElement.children)if(sibling!==node){focusInert.push([sibling,sibling.inert]);sibling.inert=true;}}previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Browser Linux full screen');$('linux-exit-expanded').focus();}
    else{for(const [node,inert] of focusInert)node.inert=inert;focusInert=[];document.body.style.overflow=previousOverflow;panel.removeAttribute('role');panel.removeAttribute('aria-modal');panel.removeAttribute('aria-label');$('linux-fullscreen').focus();}
    frame?.contentWindow.postMessage({channel:'foundry-linux',type:'expanded',active},location.origin);
  }
  $('linux-fullscreen').onclick=()=>setExpanded(!expanded);
  addEventListener('keydown',event=>{if(expanded&&event.key==='Escape'){event.preventDefault();setExpanded(false);}else if(expanded&&event.key==='Tab'&&event.shiftKey&&event.target.id==='linux-exit-expanded'){event.preventDefault();frame.contentWindow.postMessage({channel:'foundry-linux',type:'focus-last'},location.origin);}});
  addEventListener('c-foundry:route',()=>{if(!location.hash.startsWith('#/linux'))setExpanded(false);});

  document.querySelectorAll('[data-linux-copy]').forEach(button=>button.onclick=()=>copy(button.dataset.linuxCopy));
  window.addEventListener('beforeunload',event=>{if(frame||unsavedSources.size){event.preventDefault();event.returnValue='';}});
  function tsanPage(){return `<a href="#/chapter/concurrent-storage/4">← Concurrency testing</a><p class="eyebrow">Optional reading · no lab to complete</p><h1 tabindex="-1">What ThreadSanitizer can tell you</h1><p>ThreadSanitizer (TSan) observes executed memory accesses and synchronization to detect many data races. It is a useful debugging tool, not a proof that a concurrent program is correct.</p><h2>A data race is different from a lost update</h2><p>Unsynchronized conflicting ordinary C accesses, with at least one write, can form a data race and cause undefined behavior. Do not expect a particular wrong counter value as evidence. TSan can report accesses and call stacks when it observes a race.</p><p>The course’s protected-read/protected-write lost-update example is race-free at the individual-access level. It can still lose an application update. TSan need not report this logical bug: protecting the complete operation and testing its invariant are separate responsibilities.</p><h2>Where it fits</h2><p>Run correctness fixtures, check ownership and lifetimes, and review synchronization first. A clean TSan run covers only the paths and schedules that executed. It does not establish deadlock freedom, transaction isolation, durability, or correctness on every machine.</p><h2>Optional use outside this browser lab</h2><p>The self-hosted Browser Linux image used by this course does not currently have a working TSan runtime. Nothing in the course requires installing one or running this tool. On a separately configured supported compiler/runtime, a typical GCC command for your own program is:</p><pre><code>gcc -std=c17 -g -O1 -fsanitize=thread -pthread your_program.c -o checked\n./checked</code></pre><p>Resolve the underlying conflicting accesses with a suitable mutex or atomic protocol, then rerun both the detector and your independent tests. The course’s optional <code>make tsan</code> developer target checks the foundation demonstrations; it is not a requirement for any lesson.</p><p><a href="https://gcc.gnu.org/onlinedocs/gcc/Instrumentation-Options.html" target="_blank" rel="noopener noreferrer">GCC instrumentation documentation (new tab)</a> · <a href="https://clang.llvm.org/docs/ThreadSanitizer.html" target="_blank" rel="noopener noreferrer">Clang ThreadSanitizer documentation (new tab)</a></p><p><a href="#/chapter/concurrent-storage/4">Return to shutdown and concurrency testing →</a></p>`;}
  window.browserLinux={saveForRestart(){if(unsavedSources.size)throw Error('Download your unsaved Browser Linux source edits before reloading.');},show,commands,tsanPage,host:HOST};
})();
