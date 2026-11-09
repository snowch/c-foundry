#include <stdio.h>
#include <string.h>

int main(void) {
    FILE *file = tmpfile();
    if (!file) return 1;
    int ok = fputs("Ada\nGrace\n", file) >= 0 && fflush(file) == 0 && fseek(file, 0, SEEK_SET) == 0;
    char first[16], second[16], again[16]; fpos_t position;
    if (ok) ok = fgets(first, sizeof first, file) != NULL && fgetpos(file, &position) == 0 && fgets(second, sizeof second, file) != NULL;
    if (ok) ok = fsetpos(file, &position) == 0 && fgets(again, sizeof again, file) != NULL;
    int ch; if (ok) while ((ch = fgetc(file)) != EOF) { }
    if (ok) ok = !ferror(file);
    if (fclose(file) != 0) ok = 0;
    if (!ok) return 1;
    printf("revisited=%d clean_eof=1\n", strcmp(second, again) == 0);
    return 0;
}
