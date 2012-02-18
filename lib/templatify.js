
var fs = require('fs'),
  path = require('path'),
  glob = require('glob'),
  hbs = require('handlebars'),
  _ = require('underscore');


var tmpl = fs.readFileSync(path.join(__dirname, 'templates/files.js'), 'utf8'),
  body = fs.readFileSync(path.join(__dirname, 'templates/body.js'), 'utf8'),
  runtime = fs.readFileSync(path.join(__dirname, 'handlebars.runtime.js'), 'utf8');


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
  o.helpers = o.helpers || '**.js';
  o.ext = o.ext || '.html';
  o.compile = o.compile || hbs.precompile;
  o.parse = o.parse || hbs.parse;
  o.cwd = o.cwd || process.cwd();
  o.tmpl = o.tmpl || tmpl;

  o.files = Array.isArray(o.files) ? o.files : [o.files];
  o.helpers = Array.isArray(o.helpers) ? o.helpers : [o.helpers];

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

  // and helpers
  var helpers = o.helpers.map(function(f){
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

    b.include(null, 'handlebars', runtime);

    // register each template files, looking up external deps for introspection and partials
    // via handlebar's ast. Code and implementation based on require-handlebars-plugin by Alex Sexton
    // for ast traversal.
    files.forEach(function(f) {
      var nodes = o.parse(f.content),
        partials = findPartialDeps(nodes).map(function(partial) {
          return "require('" + partial.replace(/_/g, '/') + "');"
        });

      var deps = getExternalDeps(nodes),
        helps = deps.helpers,
        vars = deps.vars,
        helpers = helps.map(function(h) {
          return "require('helper:" + h + "');";
        });


      var partial = f.filepath.replace(/\//g, '_').replace(path.extname(f.filepath), ''),
        t = o.tmpl
        .replace('$body', o.compile(f.content))
        .replace('$partials', partials)
        .replace('$partial', partial)
        .replace('$helpers', helpers);

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

function findPartialDeps( nodes ) {
  var res   = [];
  if ( nodes && nodes.statements ) {
    res = recursiveNodeSearch( nodes.statements, [] );
  }
  return _(res).unique();
}

function getExternalDeps( nodes ) { 
  var res   = [];
  var helpersres = [];

  if ( nodes && nodes.statements ) {
    res = recursiveVarSearch( nodes.statements, [], undefined, helpersres );
  }

  var defaultHelpers = ["helperMissing", "blockHelperMissing", "each", "if", "unless", "with"];

  return {
    vars : _(res).chain().unique().map(function(e){
      if ( e === "" ) {
        return '.';
      }
      if ( e.length && e[e.length-1] === '.' ) {
        return e.substr(0,e.length-1) + '[]';
      }
      return e;
    }).value(),
    helpers : _(helpersres).chain().unique().map(function(e){
      if ( _(defaultHelpers).contains(e) ) {
        return undefined;
      }
      return e;
    }).compact().value()
  };
}

function composeParts ( parts ) {
  if ( !parts ) {
    return [];
  }
  var res = [parts[0]],
      cur = parts[0],
      i;

  for (i = 1; i < parts.length; ++i) {
    if ( parts.hasOwnProperty(i) ) {
      cur += "." + parts[i];
      res.push( cur );
    }
  }
  return res;
}

function recursiveVarSearch( statements, res, prefix, helpersres ) {
  prefix = prefix ? prefix+"." : "";

  var  newprefix = "", flag = false;

  // loop through each statement
  _(statements).forEach(function ( statement ) {
    var parts, part, sideways;

    // if it's a mustache block
    if ( statement && statement.type && statement.type === 'mustache' ) {

      // If it has params, the first part is a helper or something
      if ( !statement.params || ! statement.params.length ) {
        parts = composeParts( statement.id.parts );
        for( part in parts ) {
          if ( parts[ part ] ) {
            newprefix = parts[ part ] || newprefix;
            res.push( prefix + parts[ part ] );
          }
        }
        res.push(prefix + statement.id.string);
      }

      // grab the params
      if ( statement.params ) {
        _(statement.params).forEach(function(param){
          parts = composeParts( param.parts );

          for(var part in parts ) {
            if ( parts[ part ] ) {
              newprefix = parts[part] || newprefix;
              helpersres.push(statement.id.string);
              res.push( prefix + parts[ part ] );
            }
          }
        });
      }
    }

    // If it's a meta block
    if ( statement && statement.mustache  ) {
      recursiveVarSearch( [statement.mustache], res, prefix + newprefix, helpersres );
    }

    // if it's a whole new program
    if ( statement && statement.program && statement.program.statements ) {
      sideways = recursiveVarSearch([statement.mustache],[], "", helpersres)[0] || "";
      recursiveVarSearch( statement.program.statements, res, prefix + newprefix + (sideways ? (prefix+newprefix) ? "."+sideways : sideways : ""), helpersres);
    }
  });
  return res;
}



