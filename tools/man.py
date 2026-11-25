#!/usr/bin/env python3
"""Read the course's bundled manual pages, including without internet access."""
import json, os, pathlib, shutil, subprocess, sys
root=pathlib.Path(__file__).resolve().parent.parent
folder=root/'native/manuals'
index=json.loads((folder/'index.json').read_text())
args=sys.argv[1:]
if not args or args==['--help']:
 print('Bundled C manual reader\n  man 3 printf       Read the C library manual\n  man fgets          Find a bundled page\n  man -k allocate    Search names and descriptions\n\nUse /RETURN VALUE to search in the pager, n for the next match, and q to quit.\nThis is a selected Linux/glibc reference, not a claim of support for every extension.')
 sys.exit(0)
if args[0]=='-k':
 query=' '.join(args[1:]).lower();matches=[(k,v) for k,v in index.items() if query in (k+' '+v['summary']).lower()]
 for key,page in matches:print(key+' - '+page['summary'])
 sys.exit(0 if matches else 1)
if len(args)==2 and args[0].isdigit():key=args[1]+'.'+args[0]
elif len(args)==1:key=next((k for k in index if k==args[0] or k.rsplit('.',1)[0]==args[0]),'')
else:sys.exit('Use man [section] name, or man -k keyword.')
if key not in index:sys.exit('This page is not bundled. Run man -k keyword to search the included C manuals.')
text=(folder/index[key]['file']).read_text()
if sys.stdout.isatty() and shutil.which('less'):
 subprocess.run(['less'],input=text,text=True,env={**os.environ,'LESSHISTFILE':'-'})
else:print(text,end='')
