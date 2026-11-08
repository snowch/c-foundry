CC = gcc
CFLAGS ?= -std=c17 -Wall -Wextra -Wpedantic -Werror -g -O1
NATIVE_BUILD ?= .build/native
NATIVE_DEMOS = hello standards counter queue tinydb

.PHONY: help check-native check-native-clang sanitize tsan standards-matrix chapter exercise example check-part1 serve test clean $(NATIVE_DEMOS)
help:
	@python3 tools/lab.py

$(NATIVE_BUILD):
	mkdir -p $@

$(NATIVE_BUILD)/%: native/demos/%.c | $(NATIVE_BUILD)
	$(CC) $(CFLAGS) $< -pthread -o $@

$(NATIVE_DEMOS): %: $(NATIVE_BUILD)/%
	$<

check-native: $(addprefix $(NATIVE_BUILD)/,$(NATIVE_DEMOS))
	python3 tools/check_native.py $(NATIVE_BUILD)

check-native-clang:
	$(MAKE) check-native CC=clang NATIVE_BUILD=.build/clang

sanitize:
	$(MAKE) check-native NATIVE_BUILD=.build/sanitize CFLAGS='-std=c17 -Wall -Wextra -Wpedantic -Werror -g -O1 -fno-omit-frame-pointer -fsanitize=address,undefined'

tsan:
	$(MAKE) check-native NATIVE_BUILD=.build/tsan CFLAGS='-std=c17 -Wall -Wextra -Wpedantic -Werror -g -O1 -fsanitize=thread'

standards-matrix:
	python3 tools/standards.py

chapter:
	python3 tools/lab.py --chapter '$(CHAPTER)'

exercise:
	python3 tools/lab.py --exercise '$(EXERCISE)' --compiler '$(CC)'

example:
	python3 tools/lab.py --example '$(EXAMPLE)' --compiler '$(CC)'

check-part1:
	python3 tools/check_part1.py '$(CC)'

serve:
	python3 -m http.server 8000 --directory dist

test:
	npm test
	$(MAKE) check-native

clean:
	rm -rf .build
