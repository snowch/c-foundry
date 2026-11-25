import {Terminal} from './vendor/xterm.mjs';
import {FitAddon} from './vendor/addon-fit.mjs';
import {V86} from './runtime/libv86.mjs';
const $=id=>document.getElementById(id),term=new Terminal({convertEol:true,fontSize:16,scrollback:4000,theme:{background:'#101d1b',foreground:'#e0ece7'}}),fit=new FitAddon();
term.loadAddon(fit);term.open($('terminal'));
let transcript='';globalThis.foundryLinux={getTranscript:()=>transcript,getTerminalSize:()=>({cols:term.cols,rows:term.rows,pager})};
let vm,ready=false,pager=false,pagerReady=false,pagerClosing=false,findBusy=false,pagerSession=0,focusView=false,exportLine='',counter=0,resizeSerial=0,resizeTimer,pagerReadyTimer,dimensions='';const encoder=new TextEncoder();
const notify=(type,detail={})=>{if(parent!==self)parent.postMessage({channel:'foundry-linux',type,...detail},location.origin)};
function status(message){$('status').textContent=message;notify('status',{message})}
const quote=s=>"'"+s.replaceAll("'","'\\''")+"'";
async function download(name){const data=await vm.read_file(name),url=URL.createObjectURL(new Blob([data]));const a=document.createElement('a');a.href=url;a.download=name.replace(/^export-\d+-/,'');a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function pagerState(active){
 clearTimeout(pagerReadyTimer);pager=active;pagerReady=false;pagerClosing=false;findBusy=false;pagerSession++;document.body.classList.toggle('manual-active',active);$('pager-tools').hidden=!active;$('manual-search-form').hidden=!active;
 $('terminal-command').disabled=!ready||active;$('send-command').disabled=!ready||active;$('interrupt').disabled=!ready;
 $('command-help').textContent=active?'Close manual to enter another command. Your Linux files stay open.':'Enter commands here. Use the terminal itself for interactive programs.';
 updatePagerControls();notify('pager',{active});resize();
}
function updatePagerControls(){
 document.body.dataset.pagerLayout=pager&&!pagerReady?'pending':'ready';
 $('quit-pager').disabled=!pager||pagerClosing;for(const id of ['page-up','page-down'])$(id).disabled=!pagerReady||pagerClosing||findBusy;
 $('manual-search-form').querySelector('button').disabled=!pagerReady||pagerClosing||findBusy;
 $('manual-search-form').querySelector('button').textContent=findBusy?'Finding…':'Find';
 $('pager-help').textContent='Swipe inside the manual, or use the page buttons. Close manual returns to the command prompt.';
}
// BusyBox less positions its prompt on the last screen row after it is ready.
// Observe that cursor command without changing xterm's normal rendering.
term.parser.registerCsiHandler({final:'H'},params=>{if(pager&&!pagerReady&&params[0]>=Math.max(3,term.rows-2)){clearTimeout(pagerReadyTimer);const session=pagerSession;pagerReadyTimer=setTimeout(()=>{if(pager&&session===pagerSession){pagerReady=true;updatePagerControls();}},350);}return false;});
term.parser.registerOscHandler(777,data=>{if(data==='foundry-man;open'||data==='foundry-man;closed'){pagerState(data.endsWith(';open'));return true;}return false;});
function resize(){clearTimeout(resizeTimer);resizeTimer=setTimeout(async()=>{fit.fit();if(!ready||!vm)return;const size=Math.min(120,Math.max(6,term.rows))+' '+Math.min(240,Math.max(18,term.cols));if(size===dimensions)return;if(pager){clearTimeout(pagerReadyTimer);pagerReady=false;updatePagerControls();}try{await vm.create_file('tty-size-'+(++resizeSerial),encoder.encode(size));dimensions=size;}catch(_){dimensions='';}},100);}
new ResizeObserver(resize).observe($('terminal'));resize();
const sendKey=key=>{if(ready&&vm)vm.serial0_send(key);};
$('quit-pager').onclick=async()=>{if(!pager||pagerClosing)return;pagerClosing=true;findBusy=false;pagerSession++;updatePagerControls();try{await vm.create_file('man-quit-'+(++counter),encoder.encode('close'));}catch(_){pagerClosing=false;sendKey('q');updatePagerControls();}};
$('page-up').onclick=()=>{if(pager)sendKey('b');else term.scrollPages(-1);};
$('page-down').onclick=()=>{if(pager)sendKey(' ');else term.scrollPages(1);};
$('manual-search-form').onsubmit=async event=>{
 event.preventDefault();const query=$('pager-query').value.replace(/[\x00-\x1f\x7f]/g,'').trim();if(!pager||!pagerReady||findBusy||!query)return;
 const session=pagerSession;findBusy=true;updatePagerControls();sendKey('/');
 await new Promise(resolve=>setTimeout(resolve,100));
 for(const char of query){if(!pager||pagerSession!==session)return;sendKey(char);await new Promise(resolve=>setTimeout(resolve,25));}
 if(pager&&pagerSession===session){sendKey('\r');findBusy=false;updatePagerControls();}
};
$('command-form').onsubmit=event=>{event.preventDefault();const command=$('terminal-command').value.replace(/[\r\n\x00]/g,'').trim();if(!ready||pager||!command)return;sendKey(command+'\n');$('terminal-command').value='';};
$('interrupt').onclick=()=>sendKey('\x03');
addEventListener('keydown',event=>{if(event.key==='Escape'){notify('exit-expanded');}if(event.key==='Tab'&&focusView){const controls=[...document.querySelectorAll('button,input,summary,textarea')].filter(el=>!el.disabled&&el.getClientRects().length);if(event.shiftKey&&event.target===controls[0]||!event.shiftKey&&event.target===controls.at(-1)){event.preventDefault();notify('focus-exit');}}});
let touchY;
$('terminal').addEventListener('pointerdown',event=>{if(pager&&pagerReady&&event.pointerType==='touch'){touchY=event.clientY;$('terminal').setPointerCapture(event.pointerId);}});
$('terminal').addEventListener('pointermove',event=>{if(!pager||!pagerReady||touchY===undefined||event.pointerType!=='touch')return;const delta=touchY-event.clientY;if(Math.abs(delta)>=24){sendKey((delta>0?'j':'k').repeat(Math.min(5,Math.floor(Math.abs(delta)/24))));touchY=event.clientY;event.preventDefault();}});
for(const type of ['pointerup','pointercancel'])$('terminal').addEventListener(type,()=>touchY=undefined);
$('terminal').addEventListener('wheel',event=>{if(pager&&pagerReady){event.preventDefault();sendKey((event.deltaY>0?'j':'k').repeat(3));}},{passive:false});
async function boot(){
 try{
  status('Loading Linux files…');const r=await fetch('./runtime/parts.json');if(!r.ok)throw Error('Linux manifest is missing');const manifest=await r.json(),image=new Uint8Array(manifest.bytes);let loaded=0;
  for(let i=0;i<manifest.parts.length;i+=3)await Promise.all(manifest.parts.slice(i,i+3).map(async(name,j)=>{const r=await fetch('./runtime/'+name);if(!r.ok)throw Error('Linux file could not load: '+name);const b=new Uint8Array(await r.arrayBuffer());image.set(b,(i+j)*16777216);loaded+=b.length;status('Loading Linux files · '+Math.round(loaded*100/image.length)+'%')}));
  if(loaded!==image.length)throw Error('Linux image is incomplete');status('Starting Linux…');
  vm=new V86({wasm_path:'./runtime/v86.wasm',bios:{url:'./runtime/seabios.bin'},vga_bios:{url:'./runtime/vgabios.bin'},bzimage:{url:'./runtime/vmlinuz-virt'},initrd:{buffer:image.buffer},cmdline:'console=ttyS0,115200 rdinit=/init rootfstype=ramfs nokaslr panic=1 quiet',memory_size:manifest.memory_mib*1048576,filesystem:{},autostart:true,disable_keyboard:true,disable_mouse:true});
  let recent='';vm.add_listener('serial0-output-byte',byte=>{
   term.write(Uint8Array.of(byte));transcript=(transcript+String.fromCharCode(byte)).slice(-200000);const c=String.fromCharCode(byte);recent=(recent+c).slice(-500);
   if(!ready&&recent.includes('LAB_READY')&&recent.includes('foundry:~# ')){ready=true;status('Linux is ready.');notify('ready');pagerState(false);resize();term.focus()}
   if(recent.includes('LAB_EXCHANGE_FAILED'))status('Linux could not prepare its file share. Reload this terminal to retry.');
   if(byte===10){const match=exportLine.trim().match(/^__FOUNDRY_EXPORT__:(export-\d+-[A-Za-z0-9_.-]+)$/);exportLine='';if(match)download(match[1]).catch(e=>status('Export failed: '+e.message));}else if(byte!==13)exportLine=(exportLine+c).slice(-500);
  });
  term.onData(data=>vm.serial0_send(data));
 }catch(error){status('Could not start Linux. '+error.message+' Your browser drafts are kept.');$('retry').hidden=false;notify('error',{message:error.message})}
}
$('retry').onclick=()=>location.reload();
$('upload').onchange=async event=>{if(!ready){status('Wait until Linux is ready before uploading.');return}try{for(const file of event.target.files){if(file.size>32*1024*1024)throw Error('Choose a file no larger than 32 MB.');if(!/^[A-Za-z0-9_. ()-]+$/.test(file.name))throw Error('Use a filename containing letters, numbers, spaces, dots, hyphens or underscores.');const name='upload-'+(++counter);await vm.create_file(name,new Uint8Array(await file.arrayBuffer()));vm.serial0_send('cp '+quote('/exchange/'+name)+' '+quote('/root/'+file.name)+'\n');}status('File uploaded to /root.');}catch(error){status(error.message)}finally{event.target.value=''}};
addEventListener('message',async event=>{if(event.origin!==location.origin||event.source!==parent||event.data?.channel!=='foundry-linux')return;const d=event.data;if(d.type==='focus-last'){const controls=[...document.querySelectorAll('button,input,summary,textarea')].filter(el=>!el.disabled&&el.getClientRects().length);controls.at(-1)?.focus();return;}if(d.type==='expanded'){focusView=d.active;resize();return;}try{if(!ready)throw Error('Wait until Linux is ready.');if(pager&&['apply','command'].includes(d.type))throw Error('Close the manual before running another command.');if(d.type==='apply'){if(typeof d.path!=='string'||!/^\/root\/work\/[A-Za-z0-9_./-]+$/.test(d.path)||d.path.split('/').includes('..')||typeof d.source!=='string'||d.source.length>1048576||typeof d.command!=='string'||d.command.length>8000)throw Error('Invalid editor transfer');const name='editor-'+(++counter);await vm.create_file(name,encoder.encode(d.source));vm.serial0_send('cp '+quote('/exchange/'+name)+' '+quote(d.path)+' && '+d.command+'\n');status('Editor source sent to Linux. Inspect the terminal output.');notify('submitted',{id:d.id,path:d.path})}else if(d.type==='key'&&['q','b',' ','j','k','\x03'].includes(d.key))sendKey(d.key);else if(d.type==='command'&&typeof d.command==='string'&&d.command.length<=8000){if(pager)throw Error('Close the manual before running another command.');vm.serial0_send(d.command+'\n');}}catch(error){notify('error',{id:d.id,message:error.message});status(error.message)}});
boot();
