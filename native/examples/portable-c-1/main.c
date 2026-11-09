#include <stdio.h>

int main(void) {
    FILE *file = tmpfile();
    if (!file) return 1;
    int ok = fputs("portable\n", file) >= 0 && fflush(file) == 0 && fseek(file, 0, SEEK_SET) == 0;
    char line[32];
    if (ok) ok = fgets(line, sizeof line, file) != NULL;
    if (fclose(file) != 0) ok = 0;
    if (!ok) return 1;
    printf("%s", line);
    return 0;
}
