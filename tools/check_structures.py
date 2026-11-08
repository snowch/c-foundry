#!/usr/bin/env python3
"""Check ordering, ownership, occupancy and height against independent small models."""
import argparse
import shlex
import subprocess
from pathlib import Path
root=Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser()
parser.add_argument('--compiler',default='gcc')
parser.add_argument('--sanitize',action='store_true')
args=parser.parse_args()
build=root/'.build/structure-tests'
build.mkdir(parents=True,exist_ok=True)
checks={
'bplus-trees-6':r'''
bool valid_tree(const BTree *t,const bool *present){
    if(t->n<1||t->n>LEAF_POOL)return false;
    bool found[12]={0};size_t live_pages=0;int previous=0;bool have_previous=false;
    for(size_t i=0;i<LEAF_POOL;++i)if(t->pages[i].used)++live_pages;
    if(live_pages!=t->n)return false;
    for(size_t page=0;page<t->n;++page){
        const Leaf *leaf=t->child[page];
        if(!leaf->used||leaf->n>LEAF_MAX||(t->n>1&&leaf->n<2))return false;
        if(leaf->next!=(page+1<t->n?t->child[page+1]:NULL))return false;
        for(size_t j=0;j<leaf->n;++j){int key=leaf->key[j];
            if(key<0||key>=12||found[key]||(have_previous&&key<=previous)||leaf->value[j]!=key*10)return false;
            found[key]=true;previous=key;have_previous=true;
        }
    }
    for(int key=0;key<12;++key){int value=-1;bool exists=tree_find(t,key,&value);
        if(found[key]!=present[key]||exists!=present[key]||(exists&&value!=key*10))return false;
    }
    return true;
}
int main(void){
    unsigned operations=0;
    for(uint32_t seed=1;seed<=16;++seed){
        BTree tree;tree_init(&tree);bool present[12]={0};uint32_t rng=seed;
        for(unsigned step=0;step<2000;++step){rng=rng*1664525u+1013904223u;int key=(int)((rng>>16)%12);bool insert=(rng&256)!=0;
            bool result=insert?tree_put(&tree,key,key*10):tree_erase(&tree,key);
            if(result!=(insert?!present[key]:present[key]))return 1;
            if(result)present[key]=insert;
            if(!valid_tree(&tree,present)){fprintf(stderr,"B+ invariant seed=%u step=%u\n",seed,step);return 1;}++operations;
        }
        for(int key=0;key<12;++key){if(tree_erase(&tree,key)!=present[key])return 1;present[key]=false;if(!valid_tree(&tree,present))return 1;}
        if(tree.n!=1||tree.child[0]->n!=0)return 1;
    }
    printf("PASS B+ model: %u mixed operations, boundaries, occupancy, links, values, pool ownership and empty root\n",operations);
    return 0;
}
''',
 'trees-heaps-4':r'''
int validate_avl(const Node *node,int lo,int hi,bool *seen){
    if(!node)return 0;
    if(node->key<=lo||node->key>=hi||node->key<0||node->key>=64||seen[node->key])return -1000;
    seen[node->key]=true;
    int left=validate_avl(node->left,lo,node->key,seen),right=validate_avl(node->right,node->key,hi,seen);
    if(left<0||right<0||left-right>1||right-left>1||node->height!=1+(left>right?left:right))return -1000;
    return node->height;
}
int main(void){
    for(uint32_t seed=1;seed<=32;++seed){Node nodes[64];int order[64];uint32_t rng=seed;Node *root=NULL;
        for(int i=0;i<64;++i){nodes[i]=(Node){i,NULL,NULL,1};order[i]=i;}
        for(size_t i=63;i>0;--i){rng=rng*1664525u+1013904223u;size_t j=rng%(i+1);int temp=order[i];order[i]=order[j];order[j]=temp;}
        for(size_t i=0;i<64;++i){root=avl_insert(root,&nodes[order[i]]);bool seen[64]={0};if(validate_avl(root,INT_MIN,INT_MAX,seen)<0)return 1;size_t count=0;for(size_t j=0;j<64;++j)if(seen[j])++count;if(count!=i+1)return 1;}
    }
    puts("PASS AVL model: 32 insertion permutations with ordering, unique reachability, height and balance checks");return 0;
}
'''
}
for example,main in checks.items():
    original=(root/'native/examples'/(example+'.c')).read_text()
    source=build/(example+'.c');source.write_text(original.split('int main(void)',1)[0]+main)
    binary=build/example
    flags=['-std=c17','-Wall','-Wextra','-Wpedantic','-Werror','-g','-O1']
    if args.sanitize:flags+=['-fsanitize=address,undefined','-fno-omit-frame-pointer']
    subprocess.run(shlex.split(args.compiler)+flags+[str(source),'-o',str(binary)],check=True)
    subprocess.run([str(binary)],check=True,timeout=20)
