
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

adapter.name = 'underscore';
adapter.helpers = {};

adapter.runtime = {
  underscore: fs.readFileSync(path.join(__dirname, './vendor/underscore.js'), 'utf8'),
  'underscore-adapter': fs.readFileSync(path.join(__dirname, './runtime.js'), 'utf8')
};

adapter.tmpl = fs.readFileSync(path.join(__dirname, 'tmpl.js'), 'utf8');

adapter.settings = {
  partials: /<:p\s([^:]+?)\s?:>/g,
  partial: /<:p\s([^:]+?)\s?:>/,
  helpers: /<:([\w]+)\s?([\s\S]+?):>/g,
  helper: /<:([\w]+)\s?([\s\S]+?):>/
};


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
    if(!file) return c;
    return c.replace(regps, function(w, name) {
      var filepath = path.resolve(path.dirname(file), (name || '').replace(/_/g, '/') + '.html');
      return lookup(fs.readFileSync(filepath, 'utf8'), filepath);
    });
  })(content, file);

  return content;
};


// leave off the parse method will always turn introspection off
// adapter.parse = function compile() {};

adapter.template = function template(tmpl) { return function(data) {
  var output = typeof tmpl === 'string' ? underscore.template(tmpl)(data) : tmpl(data);

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


// file handler - called on each template match with debug flag and include handler.
adapter.file = function(dir, debug, include) { return function(f) {
  var content = adapter.compile(f.content, f.filepath);

  var helpers = content.match(adapter.settings.helpers).map(function(m) {
    var name = m.match(adapter.settings.helper)[1];
    return 'require("helper:' + name + '");';
  }).join('\n');

  var name = f.filepath.replace(path.extname(f.filepath), ''),
    t = adapter.tmpl
      .replace('$helpers', helpers)
      .replace('$tmpl', JSON.stringify(content))
      .replace('$body', function() {
        return adapter.template(adapter.compile(f.content, f.filepath));
      });

  include(null, name, t);
}};


//
// Tests basic partial / helpers support
//

/* * /
var testpath = path.resolve('test/fixtures/underscore/template.html');
var test = fs.readFileSync(testpath, 'utf8');

adapter.helper('yeller', function(context) {
  return context.toUpperCase();
});

adapter.helper('protos', function() {
  var args = Array.prototype.slice.call(arguments);
  return 'En taro tassadar,' + args.join(' ');
});

var t = adapter.template(adapter.compile(test, testpath));
var expected = path.join('test/fixtures/underscore/expected/partial-test.html');
console.log(t({ title: 'Some title', body: 'body content' }));
assert.equal(t({ title: 'Some title', body: 'body content' }), fs.readFileSync(expected, 'utf8'));
/* */
