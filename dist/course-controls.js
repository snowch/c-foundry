// One local compiler worker for inline lessons and the command workspace.
(()=>{
 const base=new URL('.',document.currentScript.src),choices=[5,15,30,60],key='c-foundry:runner-idle',introKey='c-foundry:runner-intro:1';
 let minutes=30,ack=false;try{const value=Number(localStorage.getItem(key));if(choices.includes(value))minutes=value;ack=localStorage.getItem(introKey)==='1';}catch{}
 let worker,pending,expiry,lastUsed=0,boots=0,phase='Stopped',origin;
 const button=document.querySelector('#code-runner-open'),summary=document.querySelector('#runner-summary');
 const dialog=document.createElement('dialog');dialog.id='code-runner-dialog';dialog.setAttribute('aria-labelledby','runner-title');
 dialog.innerHTML=`<div class="status-heading"><h2 id="runner-title">Code runner</h2><button type="button" data-close>Close</button></div><p data-state role="status">Stopped</p><p>The inline C compiler and C workspace use this device’s CPU and memory. Keeping the compiler ready makes later runs faster. Stopping it keeps your code, results and saved workspace files.</p><label for="runner-idle">Stop after this long without a run</label><select id="runner-idle">${choices.map(n=>`<option value="${n}">${n} minutes</option>`).join('')}</select><p class="supporting">Browser Linux has separate controls. Its guest files must be exported before stopping or reloading it.</p><details><summary>Resource measurements</summary><p>Browsers do not expose a reliable per-runner CPU percentage or total memory measurement. A ready compiler keeps memory allocated; CPU use rises while compiling and running.</p></details><div class="status-actions"><button class="primary" type="button" data-start>Start runner</button><button type="button" data-stop hidden>Free memory</button></div>`;document.body.append(dialog);
 const intro=document.createElement('dialog');intro.id='runner-intro';intro.setAttribute('aria-labelledby','runner-intro-title');intro.innerHTML='<h2 id="runner-intro-title">Code runs on your device</h2><p>The C compiler and your program use this device’s CPU and memory. The runner stays ready between lessons and the C workspace to avoid loading the compiler again.</p><p data-time></p><p>Use <strong>Code runner</strong> in the header to change the time or free memory sooner. Your code, results and saved workspace files are kept.</p><button class="primary" type="button" data-back>Continue run</button><button type="button" data-settings>Runner settings</button>';document.body.append(intro);
 const recovery=mountRuntimeRecovery({save:()=>window.cFoundryReadingState.save(),beforeOpen(){const focus=intro.open?origin:dialog.open?button:document.activeElement;if(intro.open)intro.close('cancel');if(dialog.open)dialog.close();return focus;},runLabel:'Run code'});
 function state(value){phase=value;summary.textContent=value;dialog.querySelector('[data-state]').textContent=value;dialog.querySelector('[data-start]').hidden=!!worker;dialog.querySelector('[data-stop]').hidden=!worker;}
 function touch(){lastUsed=Date.now();clearTimeout(expiry);if(worker&&!pending)expiry=setTimeout(checkIdle,minutes*60000);}
 function checkIdle(){if(worker&&!pending&&Date.now()-lastUsed>=minutes*60000)stop('Stopped after inactivity');else if(worker&&!pending)expiry=setTimeout(checkIdle,Math.max(10,minutes*60000-(Date.now()-lastUsed)));}
 function stop(message='Stopped'){
  const job=pending;pending=null;clearTimeout(expiry);clearTimeout(job?.timer);worker?.terminate();worker=null;state(message);job?.emit({type:'cancelled',message});
 }
 function failure(data){const job=pending;pending=null;clearTimeout(job?.timer);worker?.terminate();worker=null;state('Could not start');job?.emit(data);recovery.open();}
 function create(){if(worker)return;worker=new Worker(new URL('compiler/worker.js',base));boots++;
  worker.onerror=event=>{event.preventDefault();failure({type:'error',runtimeLoad:true,message:event.message||'The compiler worker could not start.'});};
  worker.onmessage=({data})=>{const job=pending;if(!job)return;
   if(data.type==='output'){job.emit(data);return;}
   if(data.type==='stage'){state({loading:'Starting',compiling:'Compiling',running:'Running'}[data.stage]||'Working');if(data.stage==='running'){clearTimeout(job.timer);job.timer=setTimeout(()=>stop('Program stopped after five seconds.'),5000);}job.emit(data);return;}
   if(data.runtimeLoad){failure(data);return;}
   pending=null;clearTimeout(job.timer);state('Ready');touch();job.emit(data);
  };
 }
 function begin(client,data,emit){if(pending){emit({type:'error',message:'Another compile or command is running. Wait for it to finish, or stop it in Code runner.'});return;}clearTimeout(expiry);create();state('Starting');pending={client,emit,timer:setTimeout(()=>stop('Build stopped after two minutes. Check your connection and retry.'),120000)};worker.postMessage(data);}
 function acknowledge(){ack=true;try{localStorage.setItem(introKey,'1');}catch{}}
 function execute(client,data,emit){if(!worker&&!ack){origin=document.activeElement;intro.querySelector('[data-time]').textContent=`It stops after ${minutes} minutes without a run.`;intro.returnValue='';intro.showModal();intro.addEventListener('close',()=>{if(intro.returnValue==='cancel'){emit({type:'cancelled',message:'Run cancelled.'});return;}acknowledge();begin(client,data,emit);},{once:true});return;}begin(client,data,emit);}
 function createWorker(){let disposed=false;const client={onmessage:null,onerror:null,postMessage(data){if(!disposed)execute(client,data,reply=>{if(!disposed)client.onmessage?.({data:reply});});},terminate(){if(pending?.client===client)stop('Run stopped. Your code and previous results are kept.');disposed=true;}};return client;}
 button.onclick=()=>{origin=button;dialog.showModal();};dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.addEventListener('close',()=>origin?.isConnected&&origin.focus({preventScroll:true}));
 dialog.querySelector('[data-start]').onclick=()=>{acknowledge();begin(null,{type:'prepare'},()=>{});};dialog.querySelector('[data-stop]').onclick=()=>stop();
 dialog.querySelector('#runner-idle').value=String(minutes);dialog.querySelector('#runner-idle').onchange=event=>{minutes=Number(event.target.value);try{localStorage.setItem(key,String(minutes));}catch{}if(worker&&!pending)checkIdle();};
 intro.addEventListener('cancel',event=>{event.preventDefault();intro.close('cancel');origin?.focus();});intro.querySelector('[data-back]').onclick=()=>intro.close('run');intro.querySelector('[data-settings]').onclick=()=>{intro.close('run');dialog.showModal();};
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')checkIdle();});addEventListener('pagehide',()=>stop());
 const theme=document.querySelector('#theme');function label(){theme.textContent=document.documentElement.dataset.theme==='dark'?'Light theme':'Dark theme';}label();theme.onclick=()=>{document.documentElement.dataset.theme=document.documentElement.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem('c-foundry-theme',document.documentElement.dataset.theme);}catch{}label();};
 window.cFoundryRunner={createWorker,stop,recovery,get busy(){return !!pending||intro.open;},get boots(){return boots;},get state(){return phase;}};
})();
