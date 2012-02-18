
var adapter = exports;

adapter.helpers = {};
adapter.partials = {};

adapter.settings = {
  partials: /<:p\s([^:]+?)\s?:>/g,
  partial: /<:p\s([^:]+?)\s?:>/,
  helpers: /<:([\w]+)\s?([\s\S]+?):>/g,
  helper: /<:([\w]+)\s?([\s\S]+?):>/
};

adapter.partial = function partial(name, str) {
  adapter.partials[name] = str;
};

adapter.helper = function helper(name, fn) {
  if(typeof fn !== 'function') throw new Error('Helper handler must be a function ' + fn);
  adapter.helpers[name] = fn;
};


// leave off the parse method will always turn introspection off
// adapter.parse = function compile() {};

adapter.template = function template(tmpl) { return function(data) {
  var output = tmpl(data);
  output = output.replace(adapter.settings.helpers, function(w, name, context) {
    var helper = adapter.helpers[name];
    if(!adapter.helpers[name]) return w;
    var args = context.split(' ').map(function(arg) {
      return (data[arg] || '')
    });
    return helper.apply(adapter, args);
  });

  return output;
}};

