import {cp,mkdir,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {buildOffline} from './offline.mjs';
await rm('.build/site',{recursive:true,force:true});await mkdir('.build/site',{recursive:true});await cp('dist','.build/site',{recursive:true});
execFileSync('python3',['tools/local-linux/build.py','c','.build/site/linux'],{stdio:'inherit'});
const commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),date=execFileSync('git',['show','-s','--format=%cs','HEAD'],{encoding:'utf8'}).trim();
const release=await buildOffline('.build/site',{commit,date});console.log(`Built C Foundry: ${release.files.length} verified files, ${(release.bytes/1e6).toFixed(1)} MB.`);
