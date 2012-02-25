
var fs = require('fs'),
  path = require('path'),
  hbs = require('handlebars'),
  adapter = module.exports;

// name of adapter, namely used to include a runtime environment
adapter.name = 'handlebars';

// the ast module parser
var ast = adapter.ast = require('./ast');

// map and expose needed functions from handlebars
adapter.compile = hbs.precompile;
adapter.parse = hbs.parse;

// setup templates for later use
adapter.runtime = fs.readFileSync(path.join(__dirname, './vendor/handlebars.runtime.js'), 'utf8');
adapter.tmpl = fs.readFileSync(path.join(__dirname, 'tmpl.js'), 'utf8');

// the file handler, called on each file occurence. Should return
// a function as it will be used as a `forEach` handler.
//
// Called with include function helper that must be called for each
// handled file with the `name` to register with and the template
// precompiled function.
//
// debug flag is passed in to know whether or not introspection should go
// through.
//
adapter.file = function(dir, debug, callback) { return function file(f) {

  var nodes = adapter.parse(f.content),
    deps = ast.getExternalDeps(nodes),
    meta = ast.getMetaData(nodes),
    parts = ast.findPartialDeps(nodes),
    helps = deps.helpers,
    vars = deps.vars,
    partials = parts.map(function(partial) {
      return "require('" + partial.replace(/_/g, '/') + "');"
    }),
    helpers = helps.map(function(h) {
      return "require('helper:" + h + "');";
    });

  deps.partials = parts;
  var debugProps = debug && [
    "t.meta = " + meta + ";",
    "t.helpers = " + JSON.stringify(helps) + ";",
    "t.partials = " + JSON.stringify(parts) + ";",
    "t.deps = " + JSON.stringify(deps) + ";",
    "t.vars = " + JSON.stringify(vars) + ";"
  ].join('\n');

  var name = f.filepath.replace(path.extname(f.filepath), ''),
    partial = name.replace(/\//g, '_'),
    t = adapter.tmpl
      .replace('$body', adapter.compile(f.content))
      .replace('$partials', partials)
      .replace('$partial', partial)
      .replace('$helpers', helpers)
      .replace('$debugProps', debugProps);

  callback(null, name, t);
}};

