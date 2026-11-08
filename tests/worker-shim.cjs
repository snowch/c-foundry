const {parentPort}=require('node:worker_threads');
const fs=require('node:fs'); const path=require('node:path'); const vm=require('node:vm');
const dir=path.resolve(__dirname,'../dist/compiler');
global.self=global;
global.importScripts=name=>vm.runInThisContext(fs.readFileSync(path.join(dir,name),'utf8'),{filename:name});
global.fetch=async name=>new Response(fs.readFileSync(path.join(dir,name)));
global.postMessage=data=>parentPort.postMessage(data);
vm.runInThisContext(fs.readFileSync(path.join(dir,'worker.js'),'utf8'),{filename:'worker.js'});
parentPort.on('message',data=>self.onmessage({data}));
