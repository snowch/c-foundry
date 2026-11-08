/* C Foundry's small file-backed CLI. C17 + the current wasm-clang WASI subset.
 * One statement per line, one table, autocommit; no concurrent writers or WAL.
 * Compatible TDB1 bytes: 8-byte header, then forty-byte little-endian rows.
 */
#include <errno.h>
#include <limits.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

_Static_assert(CHAR_BIT == 8, "TinyDB requires eight-bit bytes");
enum { CAPACITY = 128, NAME_BYTES = 32, ROW_BYTES = 40, LINE_BYTES = 1024 };
typedef struct { uint32_t id; char name[NAME_BYTES]; uint32_t score; } Row;
typedef struct { Row rows[CAPACITY]; size_t count; } Table;
typedef enum { END, WORD, NUMBER, STRING, LP, RP, COMMA, STAR, EQUAL, SEMI, BAD } Token;
typedef struct { const char *cursor; char text[NAME_BYTES]; uint32_t number; } Lexer;
typedef enum { INSERT, SELECT, UPDATE_SCORE, UPDATE_NAME, DELETE, COUNT } Kind;
typedef struct { Kind kind; Row row; bool filtered; uint32_t id; } Statement;

static bool valid_name(const char *name) {
    size_t length = strlen(name);
    if (!length || length >= NAME_BYTES) return false;
    const unsigned char *bytes = (const unsigned char *)name;
    for (size_t i = 0; i < length;) {
        unsigned char ch = bytes[i];
        if (ch < 32 || ch == 127) return false;
        if (ch < 128) { ++i; continue; }
        size_t width = ch >= 0xc2 && ch <= 0xdf ? 2 : ch >= 0xe0 && ch <= 0xef ? 3 : ch >= 0xf0 && ch <= 0xf4 ? 4 : 0;
        if (!width || width > length - i) return false;
        for (size_t j = 1; j < width; ++j) if ((bytes[i+j] & 0xc0) != 0x80) return false;
        if ((ch == 0xe0 && bytes[i+1] < 0xa0) || (ch == 0xed && bytes[i+1] >= 0xa0) ||
            (ch == 0xf0 && bytes[i+1] < 0x90) || (ch == 0xf4 && bytes[i+1] >= 0x90)) return false;
        i += width;
    }
    return true;
}
static int find(const Table *table, uint32_t id) {
    for (size_t i = 0; i < table->count; ++i) if (table->rows[i].id == id) return (int)i;
    return -1;
}
static void put32(unsigned char *bytes, uint32_t value) {
    for (unsigned i = 0; i < 4; ++i) bytes[i] = (unsigned char)(value >> (8 * i));
}
static uint32_t get32(const unsigned char *bytes) {
    uint32_t result = 0;
    for (unsigned i = 0; i < 4; ++i) result |= (uint32_t)bytes[i] << (8 * i);
    return result;
}
static bool load(const char *path, Table *out, bool *missing) {
    FILE *file = fopen(path, "rb");
    if (!file) { *missing = errno == ENOENT; return *missing; }
    *missing = false;
    Table next = {.count = 0};
    unsigned char header[8];
    const unsigned char magic[] = {0x54, 0x44, 0x42, 0x31};
    bool ok = fread(header, 1, sizeof header, file) == sizeof header;
    if (ok) ok = memcmp(header, magic, sizeof magic) == 0 && header[4] == 1 &&
                 header[5] == ROW_BYTES && header[6] <= CAPACITY && header[7] == 0;
    if (ok) for (unsigned i = 0; i < header[6]; ++i) {
        unsigned char bytes[ROW_BYTES]; Row row = {0};
        if (fread(bytes, 1, sizeof bytes, file) != sizeof bytes ||
            !memchr(bytes + 4, 0, NAME_BYTES) || bytes[4] == 0) { ok = false; break; }
        row.id = get32(bytes); memcpy(row.name, bytes + 4, NAME_BYTES); row.score = get32(bytes + 36);
        if (!row.id || !valid_name(row.name) || find(&next, row.id) >= 0) { ok = false; break; }
        next.rows[next.count++] = row;
    }
    if (ok) ok = fgetc(file) == EOF && !ferror(file);
    if (fclose(file) != 0) ok = false;
    if (ok) *out = next;
    return ok;
}
static bool save(const char *path, const Table *table) {
    size_t length = strlen(path);
    if (length > 240) return false;
    char temporary[256];
    int written = snprintf(temporary, sizeof temporary, "%s.tmp", path);
    if (written < 0 || (size_t)written >= sizeof temporary) return false;
    /* Refuse to replace an unrelated existing temp file. */
    FILE *existing = fopen(temporary, "rb");
    if (existing) { fclose(existing); return false; }
    if (errno != ENOENT) return false;
    FILE *file = fopen(temporary, "wb"); if (!file) return false;
    unsigned char header[8] = {0x54, 0x44, 0x42, 0x31, 1, ROW_BYTES, 0, 0};
    header[6] = (unsigned char)table->count;
    bool ok = fwrite(header, 1, sizeof header, file) == sizeof header;
    for (size_t i = 0; ok && i < table->count; ++i) {
        unsigned char bytes[ROW_BYTES] = {0};
        put32(bytes, table->rows[i].id);
        memcpy(bytes + 4, table->rows[i].name, strlen(table->rows[i].name));
        put32(bytes + 36, table->rows[i].score);
        ok = fwrite(bytes, 1, sizeof bytes, file) == sizeof bytes;
    }
    if (fflush(file) != 0) ok = false;
    if (fclose(file) != 0) ok = false;
    if (ok) ok = rename(temporary, path) == 0;
    if (!ok) (void)remove(temporary);
    return ok;
}
static bool word_char(char ch) {
    return (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || ch == '_';
}
static Token next(Lexer *lexer) {
    while (*lexer->cursor == ' ' || *lexer->cursor == '\t' || *lexer->cursor == '\r' || *lexer->cursor == '\n') ++lexer->cursor;
    unsigned char ch = (unsigned char)*lexer->cursor;
    if (!ch) return END;
    if (ch >= '0' && ch <= '9') {
        uint32_t value = 0;
        do { unsigned digit = (unsigned)(*lexer->cursor - '0');
            if (value > (UINT32_MAX - digit) / 10) return BAD;
            value = value * 10 + digit; ++lexer->cursor;
        } while (*lexer->cursor >= '0' && *lexer->cursor <= '9');
        lexer->number = value; return NUMBER;
    }
    if (word_char((char)ch)) {
        size_t count = 0;
        while (word_char(*lexer->cursor) || (*lexer->cursor >= '0' && *lexer->cursor <= '9')) {
            if (count + 1 == sizeof lexer->text) return BAD;
            char letter = *lexer->cursor++;
            lexer->text[count++] = letter >= 'a' && letter <= 'z' ? (char)(letter - 'a' + 'A') : letter;
        }
        lexer->text[count] = 0; return WORD;
    }
    ++lexer->cursor;
    if (ch == '\'') {
        size_t count = 0;
        for (;;) {
            if (!*lexer->cursor) return BAD;
            if (*lexer->cursor == '\'' && lexer->cursor[1] != '\'') {
                ++lexer->cursor; lexer->text[count] = 0; return STRING;
            }
            if (count + 1 == sizeof lexer->text) return BAD;
            lexer->text[count++] = *lexer->cursor;
            if (*lexer->cursor == '\'') ++lexer->cursor;
            ++lexer->cursor;
        }
    }
    switch (ch) { case '(': return LP; case ')': return RP; case ',': return COMMA;
        case '*': return STAR; case '=': return EQUAL; case ';': return SEMI; default: return BAD; }
}
static bool keyword(Lexer *lexer, const char *word) {
    return next(lexer) == WORD && strcmp(lexer->text, word) == 0;
}
static bool predicate(Lexer *lexer, Statement *statement) {
    if (!keyword(lexer, "ID") || next(lexer) != EQUAL || next(lexer) != NUMBER) return false;
    statement->filtered = true; statement->id = lexer->number; return true;
}
static bool parse(const char *text, Statement *out) {
    Lexer lexer = {text, {0}, 0}; Statement statement = {0};
    if (next(&lexer) != WORD) return false;
    if (strcmp(lexer.text, "INSERT") == 0) {
        statement.kind = INSERT;
        if (!keyword(&lexer, "INTO") || !keyword(&lexer, "PEOPLE") || !keyword(&lexer, "VALUES") ||
            next(&lexer) != LP || next(&lexer) != NUMBER) return false;
        statement.row.id = lexer.number;
        if (next(&lexer) != COMMA || next(&lexer) != STRING) return false;
        strcpy(statement.row.name, lexer.text);
        if (next(&lexer) != COMMA || next(&lexer) != NUMBER) return false;
        statement.row.score = lexer.number;
        if (next(&lexer) != RP) return false;
    } else if (strcmp(lexer.text, "SELECT") == 0) {
        Token token = next(&lexer); statement.kind = SELECT;
        if (token == WORD && strcmp(lexer.text, "COUNT") == 0) {
            statement.kind = COUNT;
            if (next(&lexer) != LP || next(&lexer) != STAR || next(&lexer) != RP) return false;
        } else if (token != STAR) return false;
        if (!keyword(&lexer, "FROM") || !keyword(&lexer, "PEOPLE")) return false;
        token = next(&lexer);
        if (token == WORD && strcmp(lexer.text, "WHERE") == 0) {
            if (!predicate(&lexer, &statement)) return false;
        } else if (token == SEMI && next(&lexer) == END) { *out = statement; return true; }
        else return false;
    } else if (strcmp(lexer.text, "UPDATE") == 0) {
        if (!keyword(&lexer, "PEOPLE") || !keyword(&lexer, "SET") || next(&lexer) != WORD) return false;
        bool name = strcmp(lexer.text, "NAME") == 0, score = strcmp(lexer.text, "SCORE") == 0;
        if ((!name && !score) || next(&lexer) != EQUAL) return false;
        if (name) { if (next(&lexer) != STRING) return false; statement.kind = UPDATE_NAME; strcpy(statement.row.name, lexer.text); }
        else { if (next(&lexer) != NUMBER) return false; statement.kind = UPDATE_SCORE; statement.row.score = lexer.number; }
        if (!keyword(&lexer, "WHERE") || !predicate(&lexer, &statement)) return false;
    } else if (strcmp(lexer.text, "DELETE") == 0) {
        statement.kind = DELETE;
        if (!keyword(&lexer, "FROM") || !keyword(&lexer, "PEOPLE") || !keyword(&lexer, "WHERE") || !predicate(&lexer, &statement)) return false;
    } else return false;
    if (next(&lexer) != SEMI || next(&lexer) != END) return false;
    *out = statement; return true;
}
static void help(void) {
    puts("TinyDB: one table, 128 rows, autocommit. Keywords are case-insensitive.");
    puts("INSERT INTO people VALUES (1, 'Ada', 90);");
    puts("SELECT * FROM people [WHERE id = 1];");
    puts("SELECT COUNT(*) FROM people;");
    puts("UPDATE people SET score = 95 WHERE id = 1;");
    puts("UPDATE people SET name = 'Ada Lovelace' WHERE id = 1;");
    puts("DELETE FROM people WHERE id = 1;");
    puts(".tables  .schema  .help  .quit");
}
static int execute(Table *table, const char *path, const char *text, bool *quit) {
    while (*text == ' ' || *text == '\t') ++text;
    if (!*text) return 0;
    if (strcmp(text, ".quit") == 0 || strcmp(text, ".exit") == 0) { *quit = true; return 0; }
    if (strcmp(text, ".help") == 0) { help(); return 0; }
    if (strcmp(text, ".tables") == 0) { puts("people"); return 0; }
    if (strcmp(text, ".schema") == 0) { puts("people(id uint32 positive unique, name UTF-8 bytes[1..31], score uint32)"); return 0; }
    Statement statement;
    if (!parse(text, &statement)) { fputs("Syntax error. Use .help for the supported statements.\n", stderr); return 2; }
    if (statement.kind == SELECT || statement.kind == COUNT) {
        size_t count = 0;
        for (size_t i = 0; i < table->count; ++i) if (!statement.filtered || table->rows[i].id == statement.id) {
            ++count;
            if (statement.kind == SELECT) printf("%u | %s | %u\n", (unsigned)table->rows[i].id, table->rows[i].name, (unsigned)table->rows[i].score);
        }
        if (statement.kind == COUNT) printf("%zu\n", count);
        else printf("%zu row%s\n", count, count == 1 ? "" : "s");
        return 0;
    }
    Table candidate = *table;
    if (statement.kind == INSERT) {
        if (!statement.row.id || !valid_name(statement.row.name)) { fputs("Invalid row: use a positive ID and a nonempty name of at most 31 bytes.\n", stderr); return 2; }
        if (find(table, statement.row.id) >= 0) { fputs("Duplicate ID.\n", stderr); return 2; }
        if (table->count == CAPACITY) { fputs("Table is full (128 rows).\n", stderr); return 2; }
        candidate.rows[candidate.count++] = statement.row;
    } else {
        int at = find(table, statement.id);
        if (at < 0) { fputs("ID not found.\n", stderr); return 2; }
        if (statement.kind == UPDATE_SCORE) candidate.rows[at].score = statement.row.score;
        else if (statement.kind == UPDATE_NAME) {
            if (!valid_name(statement.row.name)) { fputs("Use 1–31 UTF-8 bytes without control characters.\n", stderr); return 2; }
            strcpy(candidate.rows[at].name, statement.row.name);
        } else {
            for (size_t i = (size_t)at + 1; i < candidate.count; ++i) candidate.rows[i - 1] = candidate.rows[i];
            --candidate.count;
        }
    }
    if (!save(path, &candidate)) { fputs("Could not save; the previous database was retained. Check for an existing .tmp file.\n", stderr); return 3; }
    *table = candidate; puts("OK"); return 0;
}
int main(int argc, char **argv) {
    if (argc == 2 && strcmp(argv[1], "--help") == 0) { help(); return 0; }
    if (argc < 2 || argc > 4 || (argc == 4 && strcmp(argv[2], "--execute") != 0) || argc == 3) {
        fputs("Usage: tinydb DATABASE [--execute \"SQL or .command\"]\n", stderr); return 2;
    }
    const char *path = argv[1];
    if (!*path || strlen(path) > 240) { fputs("Invalid database path.\n", stderr); return 2; }
    Table table = {.count = 0}; bool missing = false;
    if (!load(path, &table, &missing)) { fputs("Invalid, unsupported, or unreadable TDB1 database. File was not changed.\n", stderr); return 3; }
    if (missing && !save(path, &table)) { fputs("Could not create database.\n", stderr); return 3; }
    bool quit = false;
    if (argc == 4) return execute(&table, path, argv[3], &quit);
    puts("TinyDB — .help for commands; .quit to leave.");
    char line[LINE_BYTES];
    while (!quit) {
        fputs("tinydb> ", stdout); fflush(stdout);
        if (!fgets(line, sizeof line, stdin)) break;
        if (!strchr(line, '\n') && !feof(stdin)) {
            int ch; while ((ch = getchar()) != '\n' && ch != EOF) {}
            fputs("Statement is too long.\n", stderr); continue;
        }
        line[strcspn(line, "\r\n")] = 0;
        (void)execute(&table, path, line, &quit);
    }
    return ferror(stdin) ? 3 : 0;
}
