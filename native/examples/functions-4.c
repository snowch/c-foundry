#include <stdio.h>

int area(int width, int height) {
    return width * height;
}

int perimeter(int width, int height) {
    return 2 * (width + height);
}

int main(void) {
    int width = 3, height = 4;
    printf("area=%d perimeter=%d\n",
           area(width, height), perimeter(width, height));
    return 0;
}
