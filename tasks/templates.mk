
TEMPLATE_DIR ?= app/templates

ifeq ($(shell [ -d $(TEMPLATE_DIR) ] && echo 1), 1)

TEMPLATES ?= $(shell find $(TEMPLATE_DIR) -name '*.*')
TEMPLATE_OUTPUT ?= app/templates/jst.js

# Whenever one of the templates files changes, regenerate the pre-compiled
# templates for all of them.
$(TEMPLATE_DIR): $(TEMPLATES)
	@echo ... Pre compiling templates ... >&2
	@echo -e "\ntemplatify --prefix $(TEMPLATE_DIR) $^ > $(TEMPLATE_OUTPUT)\n" >&2
	@touch $@
	@templatify --prefix $(TEMPLATE_DIR) $^ > $(TEMPLATE_OUTPUT)

templates: $(TEMPLATE_DIR)

.PHONY: templates

endif
