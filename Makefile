CC = gcc
CFLAGS ?= -std=c17 -Wall -Wextra -Wpedantic -Werror -g -O1
NATIVE_BUILD ?= .build/native
NATIVE_DEMOS = hello standards counter queue tinydb

.PHONY: help check-native check-native-clang sanitize tsan standards-matrix chapter exercise example check-part1 check-part2 check-examples check-structures project check-projects serve test clean $(NATIVE_DEMOS)
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
	python3 tools/lab.py --example '$(EXAMPLE)' --compiler '$(CC)' $(if $(filter 1,$(SANITIZE)),--sanitize,) $(if $(filter 1,$(KEEP_FILES)),--keep-files,)

check-part1:
	python3 tools/check_part1.py '$(CC)'

project:
	python3 tools/project.py '$(PROJECT)' --compiler '$(CC)' $(if $(filter 1,$(REFERENCE)),--reference,) $(if $(filter 1,$(SANITIZE)),--sanitize,)

check-projects:
	$(MAKE) project PROJECT=record-store REFERENCE=1
	$(MAKE) project PROJECT=binary-record REFERENCE=1

check-part2:
	python3 tools/check_examples.py --part 2 --compiler '$(CC)'

check-examples:
	python3 tools/check_examples.py --compiler '$(CC)' $(if $(PART),--part '$(PART)',) $(if $(filter 1,$(SANITIZE)),--sanitize,)

check-structures:
	python3 tools/check_structures.py --compiler '$(CC)' $(if $(filter 1,$(SANITIZE)),--sanitize,)

serve:
	python3 -m http.server 8000 --directory dist

test:
	npm test
	$(MAKE) check-native
	$(MAKE) check-examples
	$(MAKE) check-structures

clean:
	rm -rf .build
