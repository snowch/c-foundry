#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <string.h>
#include <errno.h>
#include <limits.h>

bool calculate(char operation,int a,int b,int *out){
    (void)operation;(void)a;(void)b;(void)out;
    // TODO: reject an invalid result before evaluating the arithmetic.
    return false;
}

bool read_integer(int *out){
    char line[64],*end;
    if(!fgets(line,sizeof line,stdin)||(!strchr(line,'\n')&&!feof(stdin)))return false;
    line[strcspn(line,"\r\n")]=0;errno=0;long value=strtol(line,&end,10);
    if(errno==ERANGE||end==line||*end||value<INT_MIN||value>INT_MAX)return false;
    *out=(int)value;return true;
}
int main(void){
    char operation[16];int a,b,result=0;
    if(!fgets(operation,sizeof operation,stdin)){puts("invalid");return 0;}
    operation[strcspn(operation,"\r\n")]=0;
    if(strlen(operation)!=1||!strchr("+-*/%",operation[0])||!read_integer(&a)||!read_integer(&b)){
        puts("invalid");return 0;
    }
    if(calculate(operation[0],a,b,&result))printf("result=%d\n",result);
    else puts("rejected");
    return 0;
}
