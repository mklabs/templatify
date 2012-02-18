
// an adapter must expose the following interface:
//
//    adapter.compile(content);
//    addapter.parse(content);
//    adapter.template(fn);
//    adapter.partial('name', fn);
//
// and provide a template file for module content:
//
//    var adapter = require('adapter'); // ex. underscore
//
//    $helpers
//    $partials
//
//    var t = module.exports = adapter.template($body);
//
//    $debugProps
//
//    adapter.partial('$partial', t);
//


var adapter = exports,
  fs = require('fs'),
  path = require('path'),
  assert = require('assert'),
  underscore = require('underscore'),
  reg = underscore.templateSettings.interpolate + '';

var testpath = path.join(__dirname, 'test/template.html'),
  test = fs.readFileSync(testpath, 'utf8');

adapter.helpers = {};
adapter.partials = {};

adapter.settings = {
  partials: /<:p\s([^:]+?)\s?:>/g,
  partial: /<:p\s([^:]+?)\s?:>/,
  helpers: /<:([\w]+)\s?([\s\S]+?):>/g,
  helper: /<:([\w]+)\s?([\s\S]+?):>/
};

adapter.partial = function partial(name, str) {};

adapter.helper = function helper(name, fn) {
  if(typeof fn !== 'function') throw new Error('Helper handler must be a function ' + fn);
  adapter.helpers[name] = fn;
};

adapter.compile = function(content, file) {
  var regps = adapter.settings.partials,
    regp = adapter.settings.partial,
    reghs = adapter.settings.helpers;
    regh = adapter.settings.helper;

  // lookup partials
  content = (function lookup(c, file) {
    var m = c.match(regps);
    return c.replace(regps, function(w, name) {
      var filepath = path.resolve(path.dirname(file), (name || '').replace(/_/g, '/') + '.html');
      return lookup(fs.readFileSync(filepath, 'utf8'), filepath);
    });
  })(content, file);

  return underscore.template(content);
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


//
// Tests basic partial / helpers support
//

adapter.helper('yell', function(context) {
  return context.toUpperCase();
});

adapter.helper('protos', function() {
  var args = Array.prototype.slice.call(arguments);
  return 'En taro tassadar,' + args.join(' ');
});

var t = adapter.template(adapter.compile(test, testpath));

var expected = path.join(__dirname, 'test/expected/partial-test.html');
assert.equal(t({ title: 'Some title', body: 'body content' }), fs.readFileSync(expected, 'utf8'));

