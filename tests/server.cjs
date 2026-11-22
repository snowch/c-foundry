const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const defaultRoot=process.env.SITE_ROOT?path.resolve(process.env.SITE_ROOT):path.resolve(__dirname,'../dist');
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.woff2':'font/woff2','.css':'text/css','.gz':'application/gzip','.cpp':'text/plain','.svg':'image/svg+xml'};
exports.start=async({root=defaultRoot}={})=>{
  root=path.resolve(root);
  const server=http.createServer((req,res)=>{
    const url=new URL(req.url,'http://localhost');
    if(!url.pathname.startsWith('/c-foundry/')){res.writeHead(404).end();return;}
    const relative=decodeURIComponent(url.pathname.slice('/c-foundry/'.length))||'index.html';
    const filename=path.resolve(root,relative);
    if(!filename.startsWith(root+path.sep)){res.writeHead(403).end();return;}
    fs.stat(filename,(error,stat)=>{
      if(error||!stat.isFile()){
        if(relative==='index.html'){res.writeHead(200,{'Content-Type':'text/html'}).end('<!doctype html><title>Test</title><link rel="icon" href="data:,">');return;}
        res.writeHead(404).end();return;
      }
      res.writeHead(200,{'Content-Type':mime[path.extname(filename)]||'application/octet-stream','Content-Length':stat.size});
      fs.createReadStream(filename).pipe(res);
    });
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  return {server,url:`http://127.0.0.1:${server.address().port}/c-foundry/`};
};
