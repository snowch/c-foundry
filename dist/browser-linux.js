/* Course-owned shell around the externally hosted JSLinux terminal. No emulator
   code or Linux image is redistributed by this site. */
(() => {
 const localBase=new URL('.',document.currentScript?.src||location.href);
  const $=id=>document.getElementById(id),escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const HOST='https://bellard.org/jslinux/vm.html';
  const SETUP='mkdir -p ~/work && tar xzf ~/c-foundry-browser.tar.gz -C ~/work && cd ~/work/c-foundry';
  const SAVE='cd ~/work && tar czf ~/c-foundry-work.tar.gz c-foundry && export_file ~/c-foundry-work.tar.gz';
  const RESTORE='mkdir -p ~/work && tar xzf ~/c-foundry-work.tar.gz -C ~/work && cd ~/work/c-foundry';
  let lastSelection={chapterId:'',command:''};
  let frame=null,sourceIndex,sourceLoading,currentSource="",sourceContext={chapter:null,command:"make counter"};
  const sourceDrafts=new Map(),unsavedSources=new Set();
  function commands(chapter){
    const result=new Set([chapter.command]),data=authoredLessons.content[chapter.id];
    for(const topic of chapter.topics){const t=data.topics[topic.id];const command=t.command||`make example EXAMPLE=${chapter.id}-${topic.id}`;result.add(command);result.add(command+' RUN_ONLY=1');if(t.lab)result.add(t.lab.command);}
    if(data.nativePractice)result.add(`make project PROJECT=${data.nativePractice.id}`);
    if(data.practicePlan)result.add(data.practicePlan.command||`make example EXAMPLE=${data.practicePlan.example}`);
    return result;
  }
  function show(chapterId='',command=''){
    if(!chapterId&&!command){chapterId=lastSelection.chapterId;command=lastSelection.command;}
    const chapter=chapterId?COURSE.chapters.find(c=>c.id===chapterId):null;
    if(chapterId&&!chapter||command&&(!chapter||!commands(chapter).has(command)))return false;
    lastSelection={chapterId,command};
    sourceContext={chapter,command:command||chapter?.command||'make counter'};
    if(sourceIndex&&$('linux-source-tools').open)chooseSource();
    $('linux-context').textContent=chapter?`Chapter ${chapter.number}: ${chapter.title}`:'A complete Linux toolchain, running in your browser';
    $('linux-command').textContent=command||chapter?.command||'make counter';
    const topic=chapter?.topics.find(topic=>{const t=authoredLessons.content[chapter.id].topics[topic.id];return (t.command||`make example EXAMPLE=${chapter.id}-${topic.id}`)===command.replace(/ RUN_ONLY=1$/,'')||t.lab?.command===command;});
    $('linux-return').href=chapter?'#/chapter/'+chapter.id+(topic?'/'+topic.id:''):'#/course';
    $('linux-return').textContent=chapter?'← Return to '+(topic?.title||chapter.title):'← Complete course';
    return true;
  }
  function start(){
    if(frame){frame.focus();return;}
    const width=$('linux-terminal').clientWidth||Math.max(240,innerWidth-64),cols=Math.max(18,Math.min(100,Math.floor((width-96)/10)));
    const url=new URL(HOST);for(const [key,value] of Object.entries({cpu:'x86_64',url:'alpine-x86_64.cfg',mem:512,net_url:'',cols,rows:26,font_size:16}))url.searchParams.set(key,value);
    frame=document.createElement('iframe');frame.title='Browser Linux terminal — JSLinux hosted by Fabrice Bellard';frame.src=url.href;frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-downloads');frame.setAttribute('allow','fullscreen; clipboard-read; clipboard-write');frame.allowFullscreen=true;
    $('linux-terminal').replaceChildren(frame);$('linux-start').hidden=true;$('linux-stop').hidden=false;$('linux-fullscreen').hidden=false;
    $('linux-session-status').textContent='Terminal session started. Wait for the localhost prompt, then import the bundle using the terminal’s upload control. This session stays open while you read other course pages.';
  }
  function stop(){if(!frame)return;if(!confirm('Stop Browser Linux? Export a work backup first. Unsaved terminal files will be lost.'))return;frame.remove();frame=null;$('linux-start').hidden=false;$('linux-stop').hidden=true;$('linux-fullscreen').hidden=true;$('linux-session-status').textContent='Terminal stopped. Start a new session and import your work backup to continue.';}
  async function copy(id){try{await navigator.clipboard.writeText($(id).textContent);$('linux-feedback').textContent='Copied. Click inside the Linux terminal and paste.';}catch(_){$('linux-feedback').textContent='Select and copy the command shown, then paste inside the Linux terminal.';}}
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
    $('linux-source-status').textContent=unsavedSources.has(path)?'Draft is kept in this session only. Download the file to keep it.':'Draft edits are saved in this browser. Download, import, and apply to run them in Linux.';
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
  $('linux-source-code').oninput=()=>{if(!currentSource)return;const text=$('linux-source-code').value;sourceDrafts.set(currentSource,text);try{localStorage.setItem('c-foundry-linux-source:'+currentSource,text);unsavedSources.delete(currentSource);$('linux-source-status').textContent='Draft saved here. Download, import, and apply to update the Linux file.';}catch(_){unsavedSources.add(currentSource);$('linux-source-status').textContent='Storage unavailable. This draft stays in this session only; download it to keep it.';}};
  $('linux-source-code').onkeydown=event=>{if(event.key==='Tab'){event.preventDefault();event.target.setRangeText('    ',event.target.selectionStart,event.target.selectionEnd,'end');event.target.dispatchEvent(new Event('input'));}};
  $('linux-source-download').onclick=()=>{if(!currentSource)return;const url=URL.createObjectURL(new Blob([$('linux-source-code').value],{type:'text/x-c'})),a=document.createElement('a');a.href=url;a.download=currentSource.replaceAll('/','__');a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  $('linux-source-import').onclick=()=>{if(currentSource)$('linux-source-import-file').click();};
  $('linux-source-import-file').onchange=async event=>{
    const file=event.target.files[0],target=currentSource;if(!file||!target)return;
    try{if(file.size>1048576)throw Error('Choose a C source file up to 1 MB.');const text=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Could not read that file.'));reader.readAsText(file);});if(currentSource!==target)throw Error('Source selection changed. Select the intended path and import again.');$('linux-source-code').value=text;$('linux-source-code').dispatchEvent(new Event('input'));$('linux-source-status').textContent='Imported into the editor draft for '+target+'. Download and apply when ready; the running Linux file has not been changed yet.';}catch(error){$('linux-source-status').textContent=error.message;}finally{event.target.value='';}
  };
  $('linux-source-reset').onclick=()=>{if(!currentSource||!confirm('Restore this original source file? Its draft edits will be replaced.'))return;sourceDrafts.delete(currentSource);unsavedSources.delete(currentSource);try{localStorage.removeItem('c-foundry-linux-source:'+currentSource);}catch(_){}showSource(currentSource);};
  $('linux-setup').textContent=SETUP;$('linux-save').textContent=SAVE;$('linux-restore').textContent=RESTORE;
  $('linux-start').onclick=start;$('linux-stop').onclick=stop;
  $('linux-fullscreen').onclick=async()=>{try{await frame?.requestFullscreen();}catch(_){$('linux-feedback').textContent='Full screen is unavailable. Use the terminal here or the hosted terminal link below.';}};
  document.querySelectorAll('[data-linux-copy]').forEach(button=>button.onclick=()=>copy(button.dataset.linuxCopy));
  window.addEventListener('beforeunload',event=>{if(frame||unsavedSources.size){event.preventDefault();event.returnValue='';}});
  function tsanPage(){return `<a href="#/chapter/concurrent-storage/4">← Concurrency testing</a><p class="eyebrow">Optional reading · no lab to complete</p><h1 tabindex="-1">What ThreadSanitizer can tell you</h1><p>ThreadSanitizer (TSan) observes executed memory accesses and synchronization to detect many data races. It is a useful debugging tool, not a proof that a concurrent program is correct.</p><h2>A data race is different from a lost update</h2><p>Unsynchronized conflicting ordinary C accesses, with at least one write, can form a data race and cause undefined behavior. Do not expect a particular wrong counter value as evidence. TSan can report accesses and call stacks when it observes a race.</p><p>The course’s protected-read/protected-write lost-update example is race-free at the individual-access level. It can still lose an application update. TSan need not report this logical bug: protecting the complete operation and testing its invariant are separate responsibilities.</p><h2>Where it fits</h2><p>Run correctness fixtures, check ownership and lifetimes, and review synchronization first. A clean TSan run covers only the paths and schedules that executed. It does not establish deadlock freedom, transaction isolation, durability, or correctness on every machine.</p><h2>Optional use outside this browser lab</h2><p>The hosted Browser Linux image used by this course does not currently have a working TSan runtime. Nothing in the course requires installing one or running this tool. On a separately configured supported compiler/runtime, a typical GCC command for your own program is:</p><pre><code>gcc -std=c17 -g -O1 -fsanitize=thread -pthread your_program.c -o checked\n./checked</code></pre><p>Resolve the underlying conflicting accesses with a suitable mutex or atomic protocol, then rerun both the detector and your independent tests. The course’s optional <code>make tsan</code> developer target checks the foundation demonstrations; it is not a requirement for any lesson.</p><p><a href="https://gcc.gnu.org/onlinedocs/gcc/Instrumentation-Options.html" target="_blank" rel="noopener noreferrer">GCC instrumentation documentation (new tab)</a> · <a href="https://clang.llvm.org/docs/ThreadSanitizer.html" target="_blank" rel="noopener noreferrer">Clang ThreadSanitizer documentation (new tab)</a></p><p><a href="#/chapter/concurrent-storage/4">Return to shutdown and concurrency testing →</a></p>`;}
  window.browserLinux={saveForRestart(){if(unsavedSources.size)throw Error('Download your unsaved Browser Linux source edits before reloading.');},show,commands,tsanPage,host:HOST};
})();
