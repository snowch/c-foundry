#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct Node {
  int key;
  struct Node *left, *right;
  int height;
} Node;
void inorder(const Node *n) {
  if (!n)
    return;
  inorder(n->left);
  printf("%d ", n->key);
  inorder(n->right);
}
const Node *find(const Node *n, int key) {
  while (n && n->key != key)
    n = key < n->key ? n->left : n->right;
  return n;
}
int height(const Node *n) { return n ? n->height : 0; }
int maximum(int a, int b) { return a > b ? a : b; }
void refresh(Node *n) {
  n->height = 1 + maximum(height(n->left), height(n->right));
}
Node *rotate_right(Node *root) {
  Node *next = root->left;
  root->left = next->right;
  next->right = root;
  refresh(root);
  refresh(next);
  return next;
}
Node *rotate_left(Node *root) {
  Node *next = root->right;
  root->right = next->left;
  next->left = root;
  refresh(root);
  refresh(next);
  return next;
}
Node *avl_insert(Node *root, Node *item) {
  if (!root)
    return item;
  if (item->key < root->key)
    root->left = avl_insert(root->left, item);
  else if (item->key > root->key)
    root->right = avl_insert(root->right, item);
  else
    return root;
  refresh(root);
  int balance = height(root->left) - height(root->right);
  if (balance > 1) {
    if (item->key > root->left->key)
      root->left = rotate_left(root->left);
    return rotate_right(root);
  }
  if (balance < -1) {
    if (item->key < root->right->key)
      root->right = rotate_right(root->right);
    return rotate_left(root);
  }
  return root;
}

int main(void) {
  Node last = {3, NULL, NULL, 1}, middle = {2, NULL, &last, 2},
       chain = {1, NULL, &middle, 3};
  Node left = {1, NULL, NULL, 1}, right = {3, NULL, NULL, 1},
       balanced = {2, &left, &right, 2};
  printf("chain_height=%d balanced_height=%d\n", height(&chain),
         height(&balanced));
  return 0;
}
