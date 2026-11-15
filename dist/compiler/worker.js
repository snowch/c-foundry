importScripts('shared.js');
const modules = new Map();
let phase = 'loading', output = '', diagnostics = '', outputSize = 0;
async function readBuffer(name) {
  const response = await fetch(name + '.gz');
  if (!response.ok) throw new Error(`Could not load compiler asset (${response.status}). Please retry.`);
  return new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
}
async function compileStreaming(name) {
  if (!modules.has(name)) modules.set(name, readBuffer(name).then(b => WebAssembly.compile(b)));
  return modules.get(name);
}
function report(stage) { phase = stage; postMessage({type:'stage', stage}); }
self.onmessage = async ({data}) => {
  output = ''; diagnostics = ''; outputSize = 0;
  try {
    const files=data.files||{'main.c':data.code};
    const entries=Object.entries(files);
    if(!Object.hasOwn(files,'main.c')||entries.length>16||entries.some(([name,code])=>!(/^[A-Za-z0-9_-]+\.[ch]$/).test(name)||typeof code!=='string'||new TextEncoder().encode(code).length>262144))throw new Error('Choose up to 16 C source/header files, at most 256 KB each, including main.c.');
    report('loading');
    const api = new API({readBuffer, compileStreaming, hostWrite(text) {
      text = text.replace(/\x1b\[[0-9;]*m/g, '');
      outputSize += text.length;
      if (outputSize > 100000) throw new Error('Output limit reached (100 KB). Check your loop.');
      if (phase === 'running') output += text; else if (phase !== 'loading') diagnostics += text;
    }});
    api.hostLog = () => {};
    api.hostLogAsync = async (_label, promise) => promise;
    await Promise.all([api.ready, compileStreaming('clang'), compileStreaming('lld')]);
    report('compiling');
    for(const [name,code] of entries)api.memfs.addFile(name,new TextEncoder().encode(code));
    const objects=[];
    for(const [name] of entries){if(!name.endsWith('.c'))continue;const obj='example-'+objects.length+'.o';await api.compile({input:name,obj,preloaded:true});objects.push(obj);}
    await api.link(objects,'main.wasm');
    const program = await WebAssembly.compile(api.memfs.getFileContents('main.wasm'));
    const results = [];
    for (const test of data.tests || [{input:data.input || ''}]) {
      output = '';
      api.memfs.setStdinStr(test.input || '');
      report('running');
      await api.run(program,'main.wasm');
      results.push({actual:output.trim(),expected:test.expected,pass:test.expected === undefined ? null : output.trim() === test.expected.trim(),name:test.name});
    }
    postMessage({type:'done',results,diagnostics:diagnostics.trim()});
  } catch (error) {
    postMessage({type:'error',message:error.message,diagnostics:diagnostics.trim(),output:output.trim()});
  }
};
