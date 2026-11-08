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
    await api.compile({input:'main.c',obj:'main.o',contents:data.code});
    await api.link('main.o','main.wasm');
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
