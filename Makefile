
# watch -q make test

PATH := ./node_modules/.bin:$(PATH)

REPORTER    ?= spec
TEST_DIR    ?= test
TEST_FILES  ?= $(shell find $(TEST_DIR) -name '*.js' -maxdepth 1)

$(TEST_DIR)/test: $(TEST_FILES)
	@mocha --reporter $(REPORTER) $?
	@touch $@

test: $(TEST_DIR)/test

clean:
	rm $(TEST_DIR)/test

.PHONY: test clean
