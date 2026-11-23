import {Terminal} from './vendor/xterm.mjs';
import {FitAddon} from './vendor/addon-fit.mjs';
import {V86} from './runtime/libv86.mjs';
const $=id=>document.getElementById(id),term=new Terminal({convertEol:true,fontSize:15,scrollback:4000,theme:{background:'#101d1b',foreground:'#e0ece7'}}),fit=new FitAddon();
term.loadAddon(fit);term.open($('terminal'));new ResizeObserver(()=>fit.fit()).observe($('terminal'));fit.fit();
let transcript='';globalThis.foundryLinux={getTranscript:()=>transcript};
let vm,ready=false,exportLine='',counter=0;const encoder=new TextEncoder();
const notify=(type,detail={})=>{if(parent!==self)parent.postMessage({channel:'foundry-linux',type,...detail},location.origin)};
function status(message){$('status').textContent=message;notify('status',{message})}
const quote=s=>"'"+s.replaceAll("'","'\\''")+"'";
async function download(name){const data=await vm.read_file(name),url=URL.createObjectURL(new Blob([data]));const a=document.createElement('a');a.href=url;a.download=name.replace(/^export-\d+-/,'');a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
async function boot(){
 try{
  status('Loading Linux files…');const r=await fetch('./runtime/parts.json');if(!r.ok)throw Error('Linux manifest is missing');const manifest=await r.json(),image=new Uint8Array(manifest.bytes);let loaded=0;
  for(let i=0;i<manifest.parts.length;i+=3)await Promise.all(manifest.parts.slice(i,i+3).map(async(name,j)=>{const r=await fetch('./runtime/'+name);if(!r.ok)throw Error('Linux file could not load: '+name);const b=new Uint8Array(await r.arrayBuffer());image.set(b,(i+j)*16777216);loaded+=b.length;status('Loading Linux files · '+Math.round(loaded*100/image.length)+'%')}));
  if(loaded!==image.length)throw Error('Linux image is incomplete');status('Starting Linux…');
  vm=new V86({wasm_path:'./runtime/v86.wasm',bios:{url:'./runtime/seabios.bin'},vga_bios:{url:'./runtime/vgabios.bin'},bzimage:{url:'./runtime/vmlinuz-virt'},initrd:{buffer:image.buffer},cmdline:'console=ttyS0,115200 rdinit=/init rootfstype=ramfs nokaslr panic=1 quiet',memory_size:manifest.memory_mib*1048576,filesystem:{},autostart:true,disable_keyboard:true,disable_mouse:true});
  let recent='';vm.add_listener('serial0-output-byte',byte=>{
   term.write(Uint8Array.of(byte));transcript=(transcript+String.fromCharCode(byte)).slice(-200000);const c=String.fromCharCode(byte);recent=(recent+c).slice(-500);
   if(!ready&&recent.includes('LAB_READY')&&recent.includes('foundry:~# ')){ready=true;status('Linux is ready.');notify('ready');term.focus()}
   if(recent.includes('LAB_EXCHANGE_FAILED'))status('Linux could not prepare its file share. Reload this terminal to retry.');
   if(byte===10){const match=exportLine.trim().match(/^__FOUNDRY_EXPORT__:(export-\d+-[A-Za-z0-9_.-]+)$/);exportLine='';if(match)download(match[1]).catch(e=>status('Export failed: '+e.message));}else if(byte!==13)exportLine=(exportLine+c).slice(-500);
  });
  term.onData(data=>vm.serial0_send(data));
 }catch(error){status('Could not start Linux. '+error.message+' Your browser drafts are kept.');$('retry').hidden=false;notify('error',{message:error.message})}
}
$('retry').onclick=()=>location.reload();
$('upload').onchange=async event=>{if(!ready){status('Wait until Linux is ready before uploading.');return}try{for(const file of event.target.files){if(file.size>32*1024*1024)throw Error('Choose a file no larger than 32 MB.');if(!/^[A-Za-z0-9_. ()-]+$/.test(file.name))throw Error('Use a filename containing letters, numbers, spaces, dots, hyphens or underscores.');const name='upload-'+(++counter);await vm.create_file(name,new Uint8Array(await file.arrayBuffer()));vm.serial0_send('cp '+quote('/exchange/'+name)+' '+quote('/root/'+file.name)+'\n');}status('File uploaded to /root.');}catch(error){status(error.message)}finally{event.target.value=''}};
addEventListener('message',async event=>{if(event.origin!==location.origin||event.source!==parent||event.data?.channel!=='foundry-linux')return;const d=event.data;try{if(!ready)throw Error('Wait until Linux is ready.');if(d.type==='apply'){if(typeof d.path!=='string'||!/^\/root\/work\/[A-Za-z0-9_./-]+$/.test(d.path)||d.path.split('/').includes('..')||typeof d.source!=='string'||d.source.length>1048576||typeof d.command!=='string'||d.command.length>8000)throw Error('Invalid editor transfer');const name='editor-'+(++counter);await vm.create_file(name,encoder.encode(d.source));vm.serial0_send('cp '+quote('/exchange/'+name)+' '+quote(d.path)+' && '+d.command+'\n');status('Editor source sent to Linux. Inspect the terminal output.');notify('submitted',{id:d.id,path:d.path})}else if(d.type==='command'&&typeof d.command==='string'&&d.command.length<=8000)vm.serial0_send(d.command+'\n');}catch(error){notify('error',{id:d.id,message:error.message});status(error.message)}});
boot();
