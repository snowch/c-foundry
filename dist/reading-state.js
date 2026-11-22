// Per-tab adapter: durable learner stores remain owned by the course/workspace.
(()=>{
 const key='c-foundry:reading-snapshot';let composing=false,lock,timer;
 function save(){
  if(composing||document.readyState!=='complete'||window.cFoundryRunner?.busy)throw Error('Finish typing and wait for the current run to finish.');
  if(document.querySelector('#linux-terminal iframe'))throw Error('Export your Browser Linux work, then choose Stop Linux before reloading. Its guest files cannot be saved by the course.');
  window.cFoundryApp?.saveForRestart();window.commandWorkspace?.saveForRestart();window.browserLinux?.saveForRestart?.();
  const value={checks:[...document.querySelectorAll('main input[type=radio]:checked')].map(el=>[el.name,el.value]),feedback:['topic-feedback','prediction-feedback'].map(id=>[id,document.getElementById(id)?.textContent||'']),hash:location.hash,scroll:[scrollX,scrollY],app:window.cFoundryApp?.snapshot(),workspace:window.commandWorkspace?.snapshot(),details:[...document.querySelectorAll('main details')].map((el,i)=>[i,el.open]),controls:[...document.querySelectorAll('main input:not([type=file]):not([type=checkbox]),main select,main textarea')].filter(el=>el.id).map(el=>[el.id,el.value,el.checked])};
  const encoded=JSON.stringify(value);sessionStorage.setItem(key,encoded);if(sessionStorage.getItem(key)!==encoded)throw Error('This window could not save its place. Allow browser storage or export your work first.');
 }
 function restore(){let saved;try{saved=JSON.parse(sessionStorage.getItem(key));}catch{return;}if(saved?.hash!==location.hash)return;
  window.cFoundryApp?.restore(saved.app);window.commandWorkspace?.restore(saved.workspace);const nodes=[...document.querySelectorAll('main details')];for(const[i,open]of saved.details||[])if(nodes[i])nodes[i].open=open;
  for(const[id,value,checked]of saved.controls||[]){const el=document.getElementById(id);if(el&&el.type!=='checkbox'){el.value=value;if(el.type==='radio')el.checked=checked;}}
  for(const el of document.querySelectorAll('main input[type=radio]'))el.checked=(saved.checks||[]).some(([name,value])=>el.name===name&&el.value===value);for(const[id,text]of saved.feedback||[]){const el=document.getElementById(id);if(el)el.textContent=text;}
  requestAnimationFrame(()=>scrollTo(...saved.scroll));sessionStorage.removeItem(key);
 }
 function unlock(){clearTimeout(timer);lock=null;for(const el of document.querySelectorAll('main,.topbar,.course-navigation'))el.inert=false;}
 document.addEventListener('compositionstart',()=>composing=true);document.addEventListener('compositionend',()=>composing=false);
 navigator.serviceWorker?.addEventListener('message',({data,ports})=>{
  if(data?.type==='PREPARE_RESTART')try{if(lock)throw Error('This tab is already restarting.');save();lock=data.token;for(const el of document.querySelectorAll('main,.topbar,.course-navigation'))el.inert=true;timer=setTimeout(unlock,12000);ports[0].postMessage({ready:true});}catch(error){ports[0].postMessage({ready:false,error:error.message});}
  if(data?.type==='ABORT_RESTART'&&data.token===lock){unlock();sessionStorage.removeItem(key);}
  if(data?.type==='COMMIT_RESTART'&&data.token===lock)location.reload();
 });
 window.cFoundryReadingState={save,restore};addEventListener('load',restore,{once:true});
})();
