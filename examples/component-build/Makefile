
TEMPLATES ?= $(shell find templates -name '*.*' \! -name '*.js')

# adds the bin folder in front of our PATH
PATH := ../../bin:$(PATH)

template.js: $(TEMPLATES)
	@echo ... Compiling $@ ...
	templatify --prefix templates --require handlebars.js --require Hogan:./hogan --commonjs $(TEMPLATES) > $@

build: template.js components
	@component build --dev

components: component.json
	@component install --dev

clean:
	# rm -fr build components template.js
	rm -fr build template.js


.PHONY: clean
