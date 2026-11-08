/* A command runner over real WASI processes. Files commit after each completed run. */
(function(){
  const $=id=>document.getElementById('ws-'+id),M=window.commandModel,encoder=new TextEncoder(),decoder=new TextDecoder();
  let files=[],revision=0,db,ready,busy=false,worker,timer,session='',selected='',dirty=false,history=[],historyIndex=0,conflict=false,unsaved=false,activeResolve;
  const starter='#include <stdio.h>\n\nint main(int argc, char **argv) {\n    printf("Hello, %s!\\n", argc > 1 ? argv[1] : "C");\n    return 0;\n}\n';
  function log(text){$('output').textContent=($('output').textContent+text).slice(-M.limits.output);$('output').scrollTop=$('output').scrollHeight;}
  function storage(text){$('storage').textContent=text;}
  function openDB(){return new Promise((resolve,reject)=>{const request=indexedDB.open('c-foundry-workspace',1);request.onupgradeneeded=()=>request.result.createObjectStore('state');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);request.onblocked=()=>reject(Error('Workspace storage is blocked by another tab.'));});}
  function read(){return new Promise((resolve,reject)=>{const request=db.transaction('state').objectStore('state').get('workspace');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
  function commit(){
    if(conflict){storage('Unsaved changes: another tab saved newer files. Download your files, then reload saved files.');return Promise.resolve();}
    if(!db){unsaved=true;storage('Session only — download files to keep them.');return Promise.resolve();}
    return new Promise(resolve=>{
      const tx=db.transaction('state','readwrite'),store=tx.objectStore('state'),request=store.get('workspace');let next;
      request.onsuccess=()=>{if((request.result?.revision||0)!==revision){conflict=true;tx.abort();return;}next=revision+1;store.put({revision:next,files},'workspace');};
      tx.oncomplete=()=>{revision=next;unsaved=false;storage('Files saved in this browser.');resolve();};
      tx.onabort=tx.onerror=()=>{unsaved=true;storage(conflict?'Unsaved changes: another tab saved newer files. Download your files, then reload saved files.':'Save failed — download files to keep these changes.');resolve();};
    }).catch(()=>{unsaved=true;storage('Save failed — download files to keep these changes.');});
  }
  function unique(name,items=files){const dot=name.lastIndexOf('.'),base=dot>0?name.slice(0,dot):name,ext=dot>0?name.slice(dot):'';let candidate=name,i=2;while(items.some(f=>f.name===candidate))candidate=base.slice(0,65)+'-'+(i++)+ext;return candidate;}
  function setBusy(value){busy=value;document.querySelectorAll('[data-ws-mutate]').forEach(el=>el.disabled=value);$('stop').hidden=!value;$('run').disabled=value;$('command').disabled=value;}
  function render(){
    $('files').replaceChildren();
    for(const file of files){const li=document.createElement('li'),button=document.createElement('button');button.type='button';button.textContent=file.name+' · '+file.data.length.toLocaleString()+' B';button.setAttribute('aria-pressed',String(file.name===selected));button.onclick=()=>select(file.name);button.disabled=busy;li.append(button);$('files').append(li);}
    $('empty').hidden=files.length>0;
    $('prompt').textContent=session?'tinydb:'+session+'>':'$';$('leave').hidden=!session;
    $('command').placeholder=session?'SELECT * FROM people;':'cc hello.c -o hello';
    if(selected&&!files.some(f=>f.name===selected)){selected='';$('file-editor').hidden=true;}
  }
  function select(name){
    if(dirty&&!confirm('Discard unsaved file edits?'))return;
    selected=name;dirty=false;const f=files.find(f=>f.name===name);$('file-editor').hidden=false;$('filename').textContent=name;
    const text=/\.(c|h|txt|csv|sql|json|md)$/i.test(name);$('text').hidden=!text;$('save').hidden=!text;$('binary').hidden=text;
    $('text').value=text?decoder.decode(f.data):'';$('binary').textContent=M.isWasm(f.data)?'WebAssembly program. Run it with ./'+M.quote(name)+' and any arguments.':'Binary data. Download to export this exact file.';render();
  }
  function download(){const file=files.find(f=>f.name===selected);if(!file)return;const url=URL.createObjectURL(new Blob([file.data]));const a=document.createElement('a');a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  async function replace(next){M.validateFiles(next);files=next;await commit();render();}
  function stop(message='Stopped. Files from the unfinished command were discarded.') {worker?.terminate();worker=null;clearTimeout(timer);setBusy(false);render();activeResolve?.(false);activeResolve=null;$('status').textContent=message;log('\n'+message+'\n');}
  async function execute(request){
    if(selected){selected='';$('file-editor').hidden=true;}setBusy(true);$('status').textContent='Preparing runtime…';
    if(!worker){try{worker=new Worker('compiler/workspace-worker.js');worker.onerror=()=>stop('Runtime failed. Previous files were retained.');}catch(error){stop('Could not start the runtime: '+error.message);return false;}}
    return new Promise(resolve=>{
      activeResolve=resolve;
      function deadline(ms){clearTimeout(timer);timer=setTimeout(()=>{stop('Time limit reached. Previous files were retained.');resolve(false);},ms);}
      deadline(120000);
      worker.onmessage=async({data})=>{
        if(data.type==='output'){log(data.text);return;}
        if(data.type==='stage'){$('status').textContent={loading:'Loading runtime…',compiling:'Compiling C…',running:'Running…'}[data.stage];deadline(data.stage==='running'?5000:120000);return;}
        clearTimeout(timer);
        if(data.type==='done'){
          $('stop').hidden=true;
          try{await replace(data.files);$('status').textContent=data.built?'Built '+data.built+'. Run ./'+data.built:'Exited with status '+data.exitCode;log(data.built?'Built '+data.built+'\n':'[exit '+data.exitCode+']\n');}
          catch(error){log(error.message+'\n');}
          setBusy(false);render();resolve(data.exitCode===0);
        }else if(data.type==='error'){log('Error: '+data.message+'\n');$('status').textContent='Command failed. Previous files were retained.';setBusy(false);render();resolve(false);}
      };
      try{worker.postMessage({...request,files});}catch(error){stop('Could not start the command: '+error.message);}
    });
  }
  async function run(event){
    event?.preventDefault();await ready;if(busy)return;
    const text=$('command').value.trim();if(!text)return;
    if(dirty){$('status').textContent='Save or close your file edits before running.';return;}
    $('command').value='';history.push(text);history=history.slice(-100);historyIndex=history.length;log((session?'tinydb> ':'$ ')+text+'\n');
    try{
      if(session){if(text===':exit'){session='';render();return;}await execute({kind:'run',program:'tinydb',builtin:true,args:[session,'--execute',text],input:''});if(/^\.(quit|exit)$/i.test(text)){session='';render();}return;}
      const words=M.tokenize(text),command=words[0];if(!command)return;
      if(command==='help'){log('cc hello.c -o hello   Build C17 sources (multiple .c and local .h supported)\n./hello Ada          Run Wasm with arguments and optional standard input\ntinydb people.db     Open the included C database\nfiles                List workspace files\nclear                Clear this transcript\nImport/export files with the Files panel. No pipes, shell expansion, or native Linux executables.\n');return;}
      if(command==='clear'){$('output').textContent='';return;}
      if(command==='files'){log(files.map(f=>f.name+' ('+f.data.length+' bytes)').join('\n')+'\n');return;}
      const build=M.compileCommand(words);if(build){await execute({kind:'build',...build});return;}
      if(command==='tinydb'&&words.length===2&&words[1]!=='--help'){
        if(!M.validName(words[1]))throw Error('Use a flat database filename such as people.db.');
        const ok=await execute({kind:'run',program:'tinydb',builtin:true,args:[words[1],'--execute','.tables'],input:''});
        if(ok){session=words[1];log('TinyDB ready. Try INSERT INTO people VALUES (1, \'Ada\', 90);\nThen SELECT * FROM people;   .help for commands, :exit to leave.\nEach statement is autocommitted to the shared file.\n');render();}return;
      }
      const program=command.replace(/^\.\//,'');if(!M.validName(program))throw Error('Choose a program in Files, or run help.');
      await execute({kind:'run',program,builtin:command==='tinydb',args:words.slice(1),input:$('stdin').value});
    }catch(error){log('Error: '+error.message+'\n');$('status').textContent=error.message;}
    finally{if(!busy)$('command').focus();}
  }
  async function init(){
    if(ready)return ready;
    $('form').onsubmit=run;$('stop').onclick=()=>stop();$('leave').onclick=()=>{session='';render();};$('download').onclick=download;
    $('text').oninput=()=>{dirty=true;$('status').textContent='File edits not yet saved.';};
    $('close-file').onclick=()=>{if(dirty&&!confirm('Discard unsaved file edits?'))return;dirty=false;selected='';$('file-editor').hidden=true;render();};
    $('save').onclick=async()=>{try{const next=files.map(f=>f.name===selected?{name:selected,data:encoder.encode($('text').value)}:f);await replace(next);dirty=false;$('status').textContent='File updated.';}catch(e){$('status').textContent=e.message;}};
    $('delete').onclick=async()=>{if(confirm('Delete '+selected+' from this workspace?')){await replace(files.filter(f=>f.name!==selected));dirty=false;}};
    $('new').onclick=async()=>{const name=prompt('New C source or header filename:',unique('main.c'));if(name===null)return;try{if(!M.validName(name)||!/[.](c|h|txt|sql)$/i.test(name)||files.some(f=>f.name===name))throw Error('Use a new .c, .h, .txt, or .sql filename.');await replace([...files,{name,data:encoder.encode(name.endsWith('.c')?starter:'')}]);select(name);}catch(e){$('status').textContent=e.message;}};
    $('import-button').onclick=()=>$('import').click();
    $('import').onchange=async event=>{setBusy(true);$('stop').hidden=true;render();try{const next=[...files];for(const file of event.target.files){if(!M.validName(file.name))throw Error('Unsupported filename: '+file.name);if(file.size>M.limits.fileBytes)throw Error('Each imported file must be 2 MB or smaller.');const name=unique(file.name,next);next.push({name,data:new Uint8Array(await file.arrayBuffer())});}await replace(next);$('status').textContent='Files imported. Existing names were kept.';}catch(e){$('status').textContent=e.message;}event.target.value='';setBusy(false);render();};
    $('source').onclick=async()=>{setBusy(true);$('stop').hidden=true;render();try{const response=await fetch('programs/tinydb.c');if(!response.ok)throw Error('Could not load TinyDB source.');const name=unique('tinydb.c');await replace([...files,{name,data:new Uint8Array(await response.arrayBuffer())}]);select(name);$('command').value='cc '+M.quote(name)+' -o mydb';}catch(e){$('status').textContent=e.message;}finally{setBusy(false);render();}};
    $('reload').onclick=async()=>{if(busy||!db)return;if(!confirm('Reload the last saved workspace? Download any unsaved files first.'))return;try{const saved=await read();M.validateFiles(saved?.files||[]);files=saved?.files||[];revision=saved?.revision||0;conflict=false;unsaved=false;dirty=false;selected='';$('file-editor').hidden=true;render();storage('Saved files reloaded.');}catch(e){storage(e.message);}};
    $('command').onkeydown=event=>{if(event.key==='ArrowUp'||event.key==='ArrowDown'){event.preventDefault();historyIndex=Math.max(0,Math.min(history.length,historyIndex+(event.key==='ArrowUp'?-1:1)));$('command').value=history[historyIndex]||'';}};
    window.addEventListener('beforeunload',event=>{if(dirty||busy||conflict||unsaved){event.preventDefault();event.returnValue='';}});
    setBusy(true);ready=(async()=>{try{db=await openDB();const saved=await read();if(saved){M.validateFiles(saved.files);files=saved.files;revision=saved.revision;storage('Files saved in this browser.');}else{files=[{name:'hello.c',data:encoder.encode(starter)}];await commit();}}catch(e){db=null;unsaved=true;files=[{name:'hello.c',data:encoder.encode(starter)}];storage('Session only — storage unavailable. Download files to keep them.');}setBusy(false);render();})();return ready;
  }
  window.commandWorkspace={init,async acceptSource(source,input){await init();if(dirty)throw Error('Save or close workspace file edits first.');if(busy)throw Error('Wait for the current workspace command to finish.');const data=encoder.encode(source),same=files.find(f=>f.name.endsWith('.c')&&f.data.length===data.length&&f.data.every((byte,i)=>byte===data[i]));const name=same?.name||unique('main.c');if(!same)await replace([...files,{name,data}]);session='';if(typeof input==='string')$('stdin').value=input;$('command').value='cc '+M.quote(name)+' -o program';render();}};
})();
