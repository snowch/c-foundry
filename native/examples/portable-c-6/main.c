#include <stdio.h>
#include <string.h>

int main(void) {
    char path[32];
    int n = snprintf(path, sizeof path, "%s/%s", "data", "people.tdb");
    if (n < 0 || (size_t)n >= sizeof path) return 1;
    char short_path[4];
    int rejected = strlen(path) >= sizeof short_path;
    if (!rejected) {
        int short_n = snprintf(short_path, sizeof short_path, "%s", path);
        rejected = short_n < 0 || (size_t)short_n >= sizeof short_path;
    }
    printf("path=%s truncated_rejected=%d names_differ=%d\n", path, rejected, strcmp("Data.tdb", "data.tdb") != 0);
    return 0;
}
