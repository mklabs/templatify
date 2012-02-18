
var fs = require('fs'),
  path = require('path'),
  glob = require('glob'),
  hbs = require('handlebars');

// templates to include for later use
var body = fs.readFileSync(path.join(__dirname, 'templates/body.js'), 'utf8');

// browerify middleware - templatify any html files into
// handlebars template.

//
// Partials:
//
//    {{> app_template_partial}}
//
// To include a partial, use underscores instead of slashes in the path, and
// leave off the extension: `{{> app_template_partial }}` will include
// `app/template/partial.html`.
//
// Helpers:
//
//    {{yell "maoow"}}
//
// Helpers may be placed in `dirname` and they'll automagically get pulled in
// as long as they're written as modules, and match the `**/*.js` glob
// pattern.
//

var middleware = module.exports = function(dir, o) {
  if(!dir) throw new Error('A directory target is required');
  o = o || {};

  // patterns for files and helpers
  o.files = o.files || '**/*.html';
  o.helpers = o.helpers || '**.js';

  // extension to register
  o.ext = o.ext || '.html';

  // debug to false will turn off introspection (or if adapter.ast not provided)
  o.debug = typeof o.debug !== 'undefined' ? o.debug : true;

  // glob options
  o.glob = o.glob || {};

  // normalize files / helpers options
  o.files = Array.isArray(o.files) ? o.files : [o.files];
  o.helpers = Array.isArray(o.helpers) ? o.helpers : [o.helpers];

  // the adapter to use, default is handlebars'
  var adapter = o.adapter || require('./templates/handlebars');

  // the ast module parser, defaults to adapter one.
  // If not set, will simply turn off and bypass introspection. 
  var ast = o.ast || adapter.ast;

  // lookup files
  var files = o.files.map(function(f){
    // unix like plz, even on win32
    f = path.join(dir, f).replace(/\\/g, '/');
      return glob.sync(f, o.glob).map(function(f) {
        return {
          filepath: f,
          content: fs.readFileSync(f, 'utf8')
        };
      });
    }).reduce(function(a, b) {
      return a.concat(b);
    }, []);

  // and helpers
  var helpers = o.helpers.map(function(f){
    // unix like plz, even on win32
    f = path.join(dir, f).replace(/\\/g, '/');
      return glob.sync(f, o.glob).map(function(f) {
        return {
          filepath: f,
          content: fs.readFileSync(f, 'utf8')
        };
      });
    }).reduce(function(a, b) {
      return a.concat(b);
    }, []);

  return function(b) {
    b.register(o.ext, function(body, file) { return body; });

    if(adapter.runtime) {
      if(typeof adapter.runtime === 'string') b.include(null, adapter.name, adapter.runtime);
      else Object.keys(adapter.runtime).forEach(function(key) {
        b.include(null, key, adapter.runtime[key]);
      });
    }

    // register each template files, looking up external deps for introspection and partials
    // via handlebar's ast. Code and implementation based on require-handlebars-plugin by Alex Sexton
    // for ast traversal.
    files.forEach(adapter.file(dir, o.debug, function(err, target, content) {
      if(err) throw err;
      b.append(include(target, content));
    }));

    // register each found helpers
    helpers.forEach(function(h) {
      var name = path.basename(h.filepath).replace(path.extname(h.filepath), '');
      b.append(include('helper:' + name, h.content));
    });

    var ign = files.map(function(f) {
      return f.filepath.replace(path.extname(f.filepath), '');
    }).concat(helpers.map(function(h) {
      return 'helpers:' + path.basename(h.filepath).replace(path.extname(h.filepath), '');
    }));

    b.ignore(ign);
  }
};

// include - include helper, rather than browserify include to ensure path module
// is always set first. `include` will return the file body wrap as `require.define`
// as browerify would do with `b.include`
function include(target, content) {
  return body
    .replace(/\$__filename/g, '"' + target + '"')
    .replace(/\$body/, content);
}

