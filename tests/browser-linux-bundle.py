#!/usr/bin/env python3
"""Check that the downloadable browser course carries exactly its declared files."""
import hashlib
import io
import json
import tarfile
from pathlib import Path, PurePosixPath

root=Path(__file__).resolve().parent.parent
manifest=json.loads((root/'dist/assets/c-foundry-browser-manifest.json').read_text())
blob=(root/'dist/assets/c-foundry-browser.tar.gz').read_bytes()
assert hashlib.sha256(blob).hexdigest()==manifest['sha256']
with tarfile.open(fileobj=io.BytesIO(blob),mode='r:gz') as archive:
    items=archive.getmembers()
    assert len(items)==len(manifest['files'])
    names=[entry.name for entry in items]
    assert len(names)==len(set(names))
    records={entry['path']:entry for entry in manifest['files']}
    for item in items:
        assert item.isfile() and not item.issym() and not item.islnk()
        path=PurePosixPath(item.name)
        assert not path.is_absolute() and '..' not in path.parts and path.parts[0]=='c-foundry'
        assert '.git' not in path.parts and 'node_modules' not in path.parts and '.build' not in path.parts
        relative='/'.join(path.parts[1:])
        data=archive.extractfile(item).read()
        assert hashlib.sha256(data).hexdigest()==records[relative]['sha256']
        assert data==(root/relative).read_bytes()
    course=json.loads(archive.extractfile('c-foundry/native/course.json').read())
    part8=[c for c in course['chapters'] if c['part']==7]
    assert len(part8)==4 and sum(len(c['topics']) for c in part8)==14
    for chapter in part8:
        assert chapter['execution']['mode']=='linux'
        for topic in chapter['topics']:
            assert f"c-foundry/native/examples/{chapter['id']}-{topic['id']}/main.c" in names
    for lab in ('basics','tinydb'):
        for file in ('main.c','README.md','.reference/main.c'):
            assert 'c-foundry/native/debugging/'+lab+'/'+file in names
    for project in ('record-store','binary-record'):
        assert 'c-foundry/native/projects/'+project+'/tests.c' in names
source_index=json.loads((root/'dist/assets/browser-linux-sources.json').read_text())
assert source_index['format']==1
for path,code in source_index['files'].items():
    assert path.startswith('native/') and Path(path).suffix in {'.c','.h'}
    assert code==(root/path).read_text()
print('PASS exact browser bundle provenance, safe archive paths, all fourteen concurrency sources, GDB starters/references, projects and editable C source parity')
