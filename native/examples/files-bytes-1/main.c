#include <stdio.h>

int main(void) {
    FILE *file = tmpfile();
    if (!file) return 1;
    if (fputs("Ada\n", file) == EOF || fflush(file) != 0 ||
        fseek(file, 0, SEEK_SET) != 0) { fclose(file); return 1; }
    char line[16];
    if (!fgets(line, sizeof line, file)) { fclose(file); return 1; }
    printf("%s", line);
    if (fclose(file) != 0) return 1;
    return 0;
}
