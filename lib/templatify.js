
var fs = require('fs'),
  path = require('path'),
  glob = require('glob'),
  hbs = require('handlebars');


var tmpl = fs.readFileSync(path.join(__dirname, 'files.js'), 'utf8'),
  runtime = fs.readFileSync(path.join(__dirname, 'handlebars.runtime.js'), 'utf8');
  pathbro = fs.readFileSync(path.join(__dirname, 'pathbro.js'), 'utf8');

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
      b.include(f.filepath, f.filepath, o.tmpl.replace('$body', o.compile(f.content)));
    });

    var ign = files.map(function(f) { return f.filepath; }).concat(files.map(function(f) {
      return f.filepath.replace(path.extname(f.filepath), '');
    }));

    b.ignore(ign);
  }
};

