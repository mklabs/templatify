var writer = module.exports;

// called prior to templates precompilation
writer.head = function head(out, options) {
  options.requires.forEach(function(required) {
    if(required.name && !required.dep) {
      // assume require with global scope modif (such as Handlebars runtime)
      return out.write('require(\'' + required.name + '\');\n');
    }

    if(required.name) out.write('var ' + required.name + ' = ');
    out.write('require(\'' + required.dep + '\');\n');
  });
  out.write('var templates = module.exports;');
  out.write('\n');
};

// called after each template precompilation
writer.tail = function tail(out, options) {
};

// called on each file to precompile
writer.file = function file(out, options) {
  out.write('\n');
  out.write('templates[\'' + options.name + '\'] = ' + options.body);
  out.write('\n');
};
