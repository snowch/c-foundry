#!/usr/bin/env python3
"""Compare the checked-in arithmetic reference with arbitrary-precision boundary results."""
import argparse
import json
import random
import shlex
import subprocess
from pathlib import Path

root=Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser()
parser.add_argument('--compiler',default='gcc')
parser.add_argument('--sanitize',action='store_true')
args=parser.parse_args()
lessons=json.loads((root/'dist/lessons.js').read_text().split('window.SECTIONS = ',1)[0].removeprefix('window.LESSONS = ').strip().removesuffix(';'))
reference=next(l for l in lessons if l['id']=='arithmetic')['solution']
build=root/'.build/numeric-checks'/Path(shlex.split(args.compiler)[0]).name
build.mkdir(parents=True,exist_ok=True)
flags=['-std=c17','-Wall','-Wextra','-Wpedantic','-Werror','-O1','-g']
if args.sanitize:flags+=['-fsanitize=address,undefined','-fno-omit-frame-pointer']
def compile_run(name,source,input=''):
    path=build/(name+'.c');binary=build/name;path.write_text(source)
    subprocess.run(shlex.split(args.compiler)+flags+[str(path),'-o',str(binary),'-lm'],check=True)
    return subprocess.run([str(binary)],input=input,text=True,capture_output=True,check=True,timeout=15).stdout

low,high=-(2**31),2**31-1
values=[low,low+1,-65536,-46341,-46340,-2,-1,0,1,2,46340,46341,65536,high-1,high]
cases=[(op,a,b) for op in '+-*/%' for a in values for b in values]
rng=random.Random(17)
for _ in range(250):
    a,b=rng.randint(low,high),rng.randint(low,high)
    cases.extend((op,a,b) for op in '+-*/%')
cases.extend(('n',value,0) for value in values)
cases.append(('?',1,2))
def expected(op,a,b):
    if op=='?':return False,997
    if op in '/%' and b==0:return False,997
    if op=='+':value=a+b
    elif op=='-':value=a-b
    elif op=='*':value=a*b
    elif op=='n':value=-a
    else:
        quotient=abs(a)//abs(b)
        if (a<0)!=(b<0):quotient=-quotient
        # C remainder is invalid too when the quotient cannot fit.
        if not low<=quotient<=high:return False,997
        value=quotient if op=='/' else a-quotient*b
    return (True,value) if low<=value<=high else (False,997)
driver=r'''
_Static_assert(INT_MAX==2147483647&&INT_MIN==(-2147483647-1),"32-bit fixture target required");
int main(void){char operation;int a,b;while(scanf(" %c%d%d",&operation,&a,&b)==3){
    int out=997;bool ok=operation=='n'?checked_negate(a,&out):calculate(operation,a,b,&out);
    printf("%d %d\n",ok,out);
}return ferror(stdin)?1:0;}
'''
output=compile_run('arithmetic',reference.split('int main(void)',1)[0]+driver,''.join(f'{op} {a} {b}\n' for op,a,b in cases))
lines=output.splitlines();assert len(lines)==len(cases)
for case,line in zip(cases,lines):
    accepted,value=map(int,line.split());want=expected(*case)
    assert (bool(accepted),value)==want,(case,line,want)
print(f'PASS {len(cases)} arbitrary-precision numeric oracle cases: sign quadrants, endpoints, random pairs, division/remainder, negation, and rejection preservation')

part=json.loads((root/'dist/part7.js').read_text().split(' = ',1)[1].strip().removesuffix(';'))['c-guarantees']['topics']
finite_driver=r'''
int main(void){
    const char *bad[]={"nan","inf","-inf","1e9999","1e-9999","","1.25x"};
    for(size_t i=0;i<sizeof bad/sizeof bad[0];++i){double out=7.0;if(parse_finite(bad[i],&out)||out!=7.0)return 1;}
    double out=0.0;if(!parse_finite("-1.25",&out)||out!=-1.25)return 1;
    puts("PASS finite parser: categories, range errors, malformed input, and output preservation");return 0;
}
'''
print(compile_run('finite-input',part['9']['code'].split('int main(void)',1)[0]+finite_driver).strip())
tolerance_driver=r'''
int main(void){
    if(!nearly_equal(0.0,0.075,0.1,0.0)||!nearly_equal(0.075,0.15,0.1,0.0)||nearly_equal(0.0,0.15,0.1,0.0))return 1;
    if(nearly_equal(NAN,0.0,0.1,0.0)||nearly_equal(INFINITY,INFINITY,0.1,0.0)||nearly_equal(0.0,0.0,-1.0,0.0)||nearly_equal(2.0,2.0,0.1,0.0))return 1;
    puts("PASS tolerance policy: nontransitivity, nonfinite rejection, and explicit domain");return 0;
}
'''
print(compile_run('tolerance',part['8']['code'].split('int main(void)',1)[0]+tolerance_driver).strip())
