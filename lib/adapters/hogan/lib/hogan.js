
var fs = require('fs'),
  path = require('path'),
  hogan = require('hogan'),
  ast = require('./ast'),
  adapter = module.exports;

// ## Hogan adapter
//
// The only required method for adapter to expose is `adapter.file` handler.
//
// If the generated bundle relies on runtime environment (eg.
// `require('hogan')` from within a browserify package), the adapter should
// expose them through `adapter.runtime`.

// Give it a name
adapter.name = 'hogan';
adapter.runtime = fs.readFileSync(path.join(__dirname, '../runtime/template.js'), 'utf8');

// the template used to generate package content
var template = fs.readFileSync(path.join(__dirname, '../template/tmpl.js'), 'utf8');

// The file handler.
//
// Called with the base directory, the debug flag and a callback to invoke with
// the package key to register and the actual content, or an instance of Error
// if something went wrong.
//
// This should return a function used as a `forEach` handler that gets called for
// each item in files array.
adapter.file = function file(dir, debug, callback) {

  // Initialization stuff might go there.

  return function(file) {
    // file is an object with `filepath` and `content` setup accordingly.
    var filepath = file.filepath,
      content = file.content;

    // replace any partial by their actual content, `_` are replaced by `/` and
    // paths are relative to the partial dirname if partials are deeply nested

    // the name to register with, usually the relative filepath minus extension
    var name = filepath.replace(path.extname(filepath), '');

    // template introspection, looking up for top level partial, helpers and vars.
    var tree = hogan.parse(hogan.scan(content)),
      deps = ast.findPartialDeps(tree),
      partials = hoganPartials(deps.partials, path.dirname(filepath)),
      vars = deps.vars;

    // prepare partials for rendering in resulting package
    content = replacePartials(content, dir);

    // if debug flag is true then attach vars and partials used within the
    // template as function property
    var debugProps = debug && [
      // "t.helpers = " + JSON.stringify(helps) + ";",
      "t.partials = " + JSON.stringify(Object.keys(partials)) + ";",
      "t.vars = " + JSON.stringify(vars) + ";"
    ].join('\n');

    // the package content, usually this is a result of a template file (`tmpl.js`)
    // with special placeholder replaced by values this file handler should compute like:
    //
    // * body: the precompiled function
    // * partials: the list of require statement for partials used within the
    // template.
    // * helpers: same for helpers, a list of requires statement of helpers
    // used within the template. Helpers are register with the special
    // `helpers:helpername` syntax.
    // * debugProps: if introspection is turned on and the template engine has built-in ast ability,
    // these debug properties should be attached to the resulting precompiled function.
    // the precompiled function passed in as `hogan.template(body)` in browserify package.
    var content = template
      .replace('$helpers', '')
      .replace('$body', '' + hogan.compile(content).r)
      .replace('$debugProps', debugProps);

    // register the bundle with according name and package content (a
    // browserify wrapped package)
    callback(null, name, content);
  };
};


//
// ### Helpers
//

//
// replacePartials - takes a template content and an original directory to replace
// any `{{> path_to_template }}` by their respective content, nested templates
// should be replaced as well.
function replacePartials(body, dir) {
  body = body || '';
  dir = dir || process.cwd();

  body = body.replace(/\{\{>\s?([^\}]+)\}\}/g, function(match, partial) {
    var filepath = path.join(dir, partial.trim().replace(/_/g, '/') + '.html'),
      content = fs.readFileSync(filepath, 'utf8'),
      partials = ast.findPartialDeps(hogan.parse(hogan.scan(content))).partials;

    if(partials.length) content = replacePartials(content, path.dirname(filepath));
    return content.trim();
  });

  return body.trim();
}

//
// lookupPartials - takes an array of partial name (eg. app_template_partial),
// replaces `_` by `/`, read the content of partial templates (or throws if does not exist),
// build the ast tree via hogan.parse / hogan.scan and returns an of partial name.
//
function lookupPartials(body, dir, partials, res) {
  var tree = hogan.parse(hogan.scan(body));

  partials = partials || ast.findPartialDeps(tree).partials;
  res = res || [];

  partials.forEach(function(p) {
    var filepath = path.resolve(dir, p.replace(/_/g, '/') + '.html'),
      content = fs.readFileSync(filepath, 'utf8'),
      partials = ast.findPartialDeps(hogan.parse(hogan.scan(content))).partials;
    // recurse if nested partial
    if(partials.length) lookupPartials(content, path.dirname(filepath), partials, res);
    res.push(p);
  });

  return res;
}

// first attempt not working, finally going to custom inline partials
function hoganPartials(partials, dir, res) {
  partials = Array.isArray(partials) ? partials : [partials];
  dir = dir || process.cwd();
  res = res || {};

  partials.forEach(function(p) {
    var filepath = path.resolve(dir, p.replace(/_/g, '/') + '.html'),
      content = fs.readFileSync(filepath, 'utf8'),
      partials = ast.findPartialDeps(hogan.parse(hogan.scan(content))).partials;

    // recurse if nested partial
    if(partials.length) hoganPartials(partials, path.dirname(filepath), res);

    res[p] = hogan.compile(content).r;
  });

  return res;
}
