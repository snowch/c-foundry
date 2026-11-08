#include <stdio.h>

int area(int width, int height) {
    // TODO: return the rectangle area.
    return 0;
}

int perimeter(int width, int height) {
    // TODO: return the rectangle perimeter.
    return 0;
}

int main(void) {
    int width, height;
    if (scanf("%d %d", &width, &height) != 2 ||
        width < 1 || width > 100 || height < 1 || height > 100) {
        puts("invalid");
        return 0;
    }
    printf("%d %d\n", area(width, height), perimeter(width, height));
    return 0;
}
