
var fs = require('fs'),
  path = require('path'),
  glob = require('glob'),
  hbs = require('handlebars'),
  ast = require('./ast');


var tmpl = fs.readFileSync(path.join(__dirname, 'templates/files.js'), 'utf8'),
  body = fs.readFileSync(path.join(__dirname, 'templates/body.js'), 'utf8'),
  runtime = fs.readFileSync(path.join(__dirname, '../vendor/handlebars.runtime.js'), 'utf8');


// browerify middleware - templatify any html files into
// handlebars template.

//
// Partials:
//
//    {{> app_template_partial}}
//
// To include a partial, use underscores instead of slashes in the path, and
// leave off the extension: `{{> App_Template_CoolPartial }}` will include
// `app/template/coolpartial.hbs`.
//
// Helpers:
//
//    {{$ "some i18n key"}}
//
// Helpers may be placed in `app/views/helpers/*` and they'll automagically
// get pulled in as long as they're written as modules.
//

var middleware = module.exports = function(dir, o) {
  if(!dir) throw new Error('A directory target is required');
  o = o || {};
  o.files = o.files || '**/*.html';
  o.helpers = o.helpers || '**.js';
  o.ext = o.ext || '.html';
  o.compile = o.compile || hbs.precompile;
  o.parse = o.parse || hbs.parse;
  o.tmpl = o.tmpl || tmpl;
  o.debug = typeof o.debug !== 'undefined' ? o.debug : true;
  o.glob = o.glob || {};

  o.files = Array.isArray(o.files) ? o.files : [o.files];
  o.helpers = Array.isArray(o.helpers) ? o.helpers : [o.helpers];

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

    b.include(null, 'handlebars', runtime);

    // register each template files, looking up external deps for introspection and partials
    // via handlebar's ast. Code and implementation based on require-handlebars-plugin by Alex Sexton
    // for ast traversal.
    files.forEach(function(f) {
      var nodes = o.parse(f.content),
        deps = ast.getExternalDeps(nodes),
        meta = ast.getMetaData(nodes),
        pdeps = ast.findPartialDeps(nodes),
        helps = deps.helpers,
        vars = deps.vars,
        partials = pdeps.map(function(partial) {
          return "require('" + partial.replace(/_/g, '/') + "');"
        }),
        helpers = helps.map(function(h) {
          return "require('helper:" + h + "');";
        });

      deps.partials = pdeps;
      var debugProps = o.debug && [
        "t.meta = " + meta + ";",
        "t.helpers = " + JSON.stringify(helps) + ";",
        "t.partials = " + JSON.stringify(pdeps) + ";",
        "t.deps = " + JSON.stringify(deps) + ";",
        "t.vars = " + JSON.stringify(vars) + ";"
      ].join('\n');

      var partial = f.filepath.replace(/\//g, '_').replace(path.extname(f.filepath), ''),
        t = o.tmpl
        .replace('$body', o.compile(f.content))
        .replace('$partials', partials)
        .replace('$partial', partial)
        .replace('$helpers', helpers)
        .replace('$debugProps', debugProps);

      var content = include(f.filepath.replace(path.extname(f.filepath), ''), t);
      b.append(content);
    });

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

