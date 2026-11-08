importScripts('shared.js','../command-model.js');
const assets=new Map(),modules=new Map();
async function readBuffer(name){
  if(!assets.has(name))assets.set(name,(async()=>{const response=await fetch(name+'.gz');if(!response.ok)throw Error('Could not load the browser runtime. Retry when connected.');return new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();})());
  try{return await assets.get(name);}catch(error){assets.delete(name);throw error;}
}
async function compileStreaming(name){if(!modules.has(name))modules.set(name,readBuffer(name).then(WebAssembly.compile));try{return await modules.get(name);}catch(error){modules.delete(name);throw error;}}
let inFlight=false,builtin;
self.onmessage=async({data})=>{
  if(inFlight){postMessage({type:'error',message:'Wait for the current command to finish.'});return;}
  inFlight=true;let stage='loading',size=0;
  const report=value=>{stage=value;postMessage({type:'stage',stage:value});};
  try{
    commandModel.validateFiles(data.files);
    if(!['build','run'].includes(data.kind))throw Error('Unknown workspace request.');
    const files=new Map(data.files.map(file=>[file.name,file.data]));
    const api=new API({readBuffer,compileStreaming,loadSysroot:data.kind==='build',silentRunFooter:true,hostWrite(text){
      text=text.replace(/\x1b\[[0-9;]*m/g,'');size+=text.length;
      if(size>commandModel.limits.output)throw Error('Output limit reached (100 KB).');
      postMessage({type:'output',text,diagnostic:stage!=='running'});
    }});
    api.hostLog=()=>{};api.hostLogAsync=async(_,promise)=>promise;
    report('loading');await api.ready;api.memfs.silentErrors=true;
    for(const [name,bytes] of files)api.memfs.addFile(name,bytes);
    if(data.kind==='build'){
      if(!Array.isArray(data.sources)||!data.sources.length||data.sources.length>8||!commandModel.validName(data.output)||files.get(data.output)&&!commandModel.isWasm(files.get(data.output)))throw Error('Choose an output program name that does not replace a data or source file.');
      const objects=[];report('compiling');
      for(let i=0;i<data.sources.length;i++){
        const name=data.sources[i],source=files.get(name);
        if(!commandModel.validName(name)||!name.endsWith('.c')||!source||source.byteLength>commandModel.limits.sourceBytes)throw Error('Build requires existing C sources, at most 256 KB each.');
        const obj='.cf-'+i+'.o';await api.compile({input:name,obj,preloaded:true});objects.push(obj);
      }
      await api.link(objects,'.cf-output.wasm');
      files.set(data.output,new Uint8Array(api.memfs.getFileContents('.cf-output.wasm')));
      const result=Array.from(files,([name,data])=>({name,data}));commandModel.validateFiles(result);
      postMessage({type:'done',files:result,exitCode:0,built:data.output});return;
    }
    const names=new Set(files.keys());
    const normalize=name=>name.replace(/^\.\//,'').replace(/^\//,'');
    api.memfs.onPathOperation=(operation,first,second)=>{
      const name=normalize(first),next=second===null?null:normalize(second);
      if(operation==='path_unlink_file'||operation==='path_rename')names.delete(name);
      if(operation==='path_open')names.add(name);
      if(operation==='path_rename')names.add(next);
    };
    let bytes=files.get(data.program);
    if((!bytes||data.builtin===true)&&data.program==='tinydb'){
      if(!builtin)builtin=fetch('../programs/tinydb.wasm').then(response=>{if(!response.ok)throw Error('Could not load TinyDB.');return response.arrayBuffer();});
      try{bytes=new Uint8Array(await builtin);}catch(error){builtin=null;throw error;}
    }
    if(!bytes||!commandModel.isWasm(bytes))throw Error('Program not found. Build a C source with cc, or run the included tinydb command.');
    if(!Array.isArray(data.args)||data.args.length>32||data.args.some(arg=>typeof arg!=='string'||arg.length>4096||arg.includes('\0')))throw Error('Program arguments are invalid.');
    if(typeof data.input!=='string'||data.input.length>65536)throw Error('Standard input is limited to 64 KB.');
    api.memfs.setStdinStr(data.input);report('running');let exitCode=0;
    try{const active=await api.run(await WebAssembly.compile(bytes),data.program,...data.args);if(active)throw Error('This workspace supports command-line programs, not continuing animation callbacks.');}
    catch(error){if(Number.isInteger(error.code))exitCode=error.code;else throw error;}
    // Query file kinds through WASI after the process has exited. Its memory is
    // now scratch space; only flat regular files enter the persistent workspace.
    const memory=api.memfs.hostMem_;memory.check();let total=0;const result=[];
    for(const name of names){
      if(name==='.'||name==='')continue;
      if(name.length>4096)throw Error('A program file path exceeded workspace limits. Previous files were retained.');
      memory.writeStr(0,name);
      const error=api.memfs.exports.path_filestat_get(3,0,0,name.length,128);
      if(error===44)continue; // WASI ENOENT: a file was removed after being opened.
      if(error!==0)throw Error('Could not collect the program files. Previous files were retained.');
      if(memory.read8(144)!==4)continue;
      if(!commandModel.validName(name))throw Error('Program created an unsupported filename. Use flat workspace filenames; previous files were retained.');
      const contents=api.memfs.getFileContents(name);
      total+=contents.length;
      if(contents.length>commandModel.limits.fileBytes||total>commandModel.limits.totalBytes)throw Error('Program files exceeded workspace limits. Previous files were retained.');
      result.push({name,data:new Uint8Array(contents)});
    }
    commandModel.validateFiles(result);
    postMessage({type:'done',files:result,exitCode});
  }catch(error){postMessage({type:'error',message:error.message});}
  finally{inFlight=false;}
};
