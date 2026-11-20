#!/usr/bin/env python3
"""Build a deterministic, source-only course bundle for a browser Linux session."""
import argparse
import gzip
import hashlib
import io
import json
import tarfile
from pathlib import Path

root=Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser()
parser.add_argument('--check',action='store_true')
args=parser.parse_args()
paths=[root/'LICENSE',root/'README.md',root/'Makefile']
for folder in ['native','tools']:
    allowed={'.c','.h','.md','.json','.gdb'} if folder=='native' else {'.py','.cjs','.sh'}
    paths.extend(p for p in (root/folder).rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.suffix in allowed)
paths.extend([root/'dist/lessons.js',root/'dist/assets/tinydb-sample.tdb'])
paths.append(root/'dist/programs/tinydb.c')
paths.extend(p for p in (root/'docs').glob('*') if p.is_file() and p.suffix in {'.md','.json'})
files=sorted(set(paths),key=lambda p:p.relative_to(root).as_posix())
manifest=[]
output=io.BytesIO()
with gzip.GzipFile(filename='',fileobj=output,mode='wb',mtime=0,compresslevel=9) as compressed:
    with tarfile.open(fileobj=compressed,mode='w',format=tarfile.PAX_FORMAT) as archive:
        for path in files:
            name=path.relative_to(root).as_posix()
            content=path.read_bytes()
            entry=tarfile.TarInfo('c-foundry/'+name)
            entry.size=len(content);entry.mode=0o644;entry.uid=entry.gid=0;entry.uname=entry.gname='';entry.mtime=0
            archive.addfile(entry,io.BytesIO(content))
            manifest.append({'path':name,'bytes':len(content),'sha256':hashlib.sha256(content).hexdigest()})
data=output.getvalue()
metadata={'format':1,'root':'c-foundry','bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'files':manifest}
archive_path=root/'dist/assets/c-foundry-browser.tar.gz'
manifest_path=root/'dist/assets/c-foundry-browser-manifest.json'
source_path=root/'dist/assets/browser-linux-sources.json'
source_text=json.dumps({'format':1,'files':{p.relative_to(root).as_posix():p.read_text() for p in files if p.relative_to(root).as_posix().startswith('native/') and p.suffix in {'.c','.h'}}},ensure_ascii=False,separators=(',',':'))+'\n'
text=json.dumps(metadata,indent=2)+'\n'
if args.check:
    assert archive_path.read_bytes()==data,'Rebuild the browser Linux bundle: python3 tools/build_browser_linux.py'
    assert manifest_path.read_text()==text,'Browser Linux bundle manifest is stale'
    assert source_path.read_text()==source_text,'Browser Linux editor source index is stale'
    print(f'PASS browser Linux bundle: {len(files)} files, {len(data)} bytes, reproducible and source-only')
else:
    archive_path.parent.mkdir(parents=True,exist_ok=True);archive_path.write_bytes(data);manifest_path.write_text(text);source_path.write_text(source_text)
    print(f'Built browser Linux bundle: {len(files)} files, {len(data)} bytes')
