
var fs = require('fs'),
  path = require('path'),
  glob = require('glob'),
  hbs = require('handlebars'),
  _ = require('underscore');


var tmpl = fs.readFileSync(path.join(__dirname, 'templates/files.js'), 'utf8'),
  runtime = fs.readFileSync(path.join(__dirname, 'handlebars.runtime.js'), 'utf8');
  pathbro = fs.readFileSync(path.join(__dirname, 'vendor/pathbro.js'), 'utf8');

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
  o.target = o.target || 'views';
  o.files = o.files || '**/*.html';
  o.ext = o.ext || '.html';
  o.compile = o.compile || hbs.precompile;
  o.parse = o.parse || hbs.parse;
  o.cwd = o.cwd || process.cwd();
  o.tmpl = o.tmpl || tmpl;

  o.files = Array.isArray(o.files) ? o.files : [o.files];

  // lookup files
  var files = o.files.map(function(f){
      // unix like plz, even on win32
      f = path.join(dir, f).replace(/\\/g, '/');
      return glob.sync(f, o).map(function(f) {
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

    // getting a nasty error and inconsistent one, might happen, might be cool
    // Try to always include path before adding in these include, sometimes one template
    // gets dedined before the path one. BOMM broken.
    b.include(null, 'handlebars', runtime);

    files.forEach(function(f) {
      var deps = findPartialDeps(o.parse(f.content)).map(function(partial) {
        return "require('" + partial.replace(/_/g, '/') + "');"
      });

      var helper = f.filepath.replace(/\//g, '_').replace(path.extname(f.filepath), ''),
        t = o.tmpl
        .replace('$body', o.compile(f.content))
        .replace('$helper', helper)
        .replace('$deps', deps);

      b.include(null, f.filepath.replace(path.extname(f.filepath), ''), t);
    });

    var ign = files.map(function(f) { return f.filepath; }).concat(files.map(function(f) {
      return f.filepath.replace(path.extname(f.filepath), '');
    }));

    b.ignore(ign);
  }
};


// parse templates
// borrowed to requirejs-handlebars-plugin by @SlexAxton
//
// > https://github.com/SlexAxton/require-handlebars-plugin/blob/master/hbs.js

//
// Uses handlebars' AST to find partials.
//

function recursiveNodeSearch( statements, res ) {
  _(statements).forEach(function ( statement ) {
    if ( statement && statement.type && statement.type === 'partial' ) {
        res.push(statement.id.string);
    }
    if ( statement && statement.program && statement.program.statements ) {
      recursiveNodeSearch( statement.program.statements, res );
    }
  });
  return res;
}

// TODO :: use the parser to do this!
function findPartialDeps( nodes ) {
  var res   = [];
  if ( nodes && nodes.statements ) {
    res = recursiveNodeSearch( nodes.statements, [] );
  }
  return _(res).unique();
}

