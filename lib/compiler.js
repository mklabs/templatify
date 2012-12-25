
var fs      = require('fs');
var path    = require('path');
var fstream = require('fstream');
var Stream  = require('stream').Stream;

module.exports = compiler;
compiler.engines = require('./engines');
compiler.writers = require('./writers');

// Compiler entry point. Give it an `options` hash, it'll return a new
// `compiler` instance.
//
// Examples
//
//    var compiler = require('templatify');
//    var builder = compiler([options]);
//
// Options:
//
// - files: Files array of templates to compile
// - prefix: Pathname prefix to remove from precompiled template key.
// - output: String or Stream to write to (default: process.stdout)
// - mode: Compilation mode, one of `commonjs`, `amd` or `jst`.
// - hold: Variables holding the precompiled templates in `jst` mode (default:
//         JST)
//
// Returns a new `compiler` instance.
function compiler(options) {
  var c = Object.create(compiler);
  c.engines = {};

  // options
  options = c.options = options || {};
  options.files = options.files || [];
  options.prefix = options.prefix || '';
  options.hold = options.hold || 'JST';

  c.mode(options.mode || 'jst');
  c.output(options.output || process.stdout);

  // mode
  if(options.mode) c.mode(options.mode);
  else if(options.amd) c.mode('amd');
  else if(options.commonjs) c.mode('commonjs');
  else c.mode('jst');

  // requires
  c.requires(options.require || []);

  return c;
}

// **engine(ext, callback)** Register the given template engine `callback` as
// for `ext`.
//
// Examples
//
//    compiler
//      .engine('.jst', compiler.engines.underscore)
//      .engine('.hbs', compiler.engines.handlebars)
//      .engine('.mustache', compiler.engines.hogan);
//
// Returns the compiler instance.
compiler.engine = function engine(ext, fn) {
  if (typeof fn !== 'function') throw new Error('callback function required');
  if (ext[0] != '.') ext = '.' + ext;
  this.engines[ext] = fn;
  return this;
};

// **file(file[, ...])** Adds the file(s) pathname to the list of template
// files to compile. Can accept a single String, an Array of Strings, or any
// numbered of String / Array arguments.
//
// Examples
//
//    compiler
//      .file('templates/entry.hbs')
//      .file('templates/timeline.mustache', 'templates/people.jst')
//      .file([
//        'templates/underscore/index.jst',
//        'templates/handlebars/index.hbs',
//        'templates/hogan/index.mustache'
//      ]);
//
//
compiler.file = function file() {
  var files = Array.prototype.slice.call(arguments);
  // normalize String / Array arguments
  files.forEach(function(file) {
    this.options.files = this.options.files.concat(file);
  }, this);
  return this;
};

// **requires(name, dep)** Adds one or more file to "require" at the top of
// the precompiled file. This can be useful for `commonjs` or `amd` mode, to
// require the template engine runtime (such as `Handlebars.template` or
// `Hogan.template`)
//
// - name - String standing for the variable name to use
// - dep  - String that is required and assigned to `name`.
//
// Returns the compiler instance.
compiler.requires = function requires(name, dep) {
  this._requires = this._requires || [];

  if(Array.isArray(name)) {
    return name.forEach(function(required) {
      var parts = required.split(/[:=]/g);
      this.requires(parts[0], parts[1]);
    }, this);
  }

  this._requires.push({
    name: name,
    dep: dep
  });
  return this;
};

// **mode(mode)** Set the compilation mode to the specified `mode`. Allowed
// values are:
//
// - jst (default)
// outputs a single JavaScript file exposing an Hash object to
// the global scope with the variable `options.hold` (default: JST)
//
// - commonjs
// outputs a single JavaScript file file with the precompiled templates
// attached to `module.exports`
//
// - amd
// Register each precompiled template through `define()`
//
// Returns the compiler instance.
compiler.mode = function mode(val) {
  var allowed = Object.keys(compiler.writers);
  if(!~allowed.indexOf(val)) {
    throw new Error('Invalid mode ' + val + '. Must be one of: ' + allowed.join(' '));
  }

  this.writer = compiler.writers[val];
  return this;
};

// **output(out)** Sets the writable output of the template precompilation.
// Takes either a String pathname or a Writable Stream.
//
// Example:
//
//    compiler.output('js/templates.js');
//    // equivalent to
//    compiler.output(fs.createWriteStream('js/templates'));
//
//    // default is
//    compiler.output(process.stdout);
//
// Returns the compiler instance.
compiler.output = function output(out) {
  var writable = out instanceof Stream && out.writable;
  if(typeof out !== 'string' && !writable) {
    throw new Error('Output must be either a String or a writable output.');
  }

  this._output = out;
  return this;
};

// **run([options], done)** Iterate through `options.files` and attempt the
// pre-compilation of the given file, depending on the configured engine for
// that file extension.
//
// `options` is not required, and defaults to `this.options`. `done` is the
// callback to invoke on completion or on error.
compiler.run = function run(options, done) {
  if(!done) done = options, options = null;

  options = options || this.options;

  var files = options.files;
  if(!files || !files.length) {
    return done(new Error('No files provided. You must provide a list of templates to compile.'));
  }

  // clone files array
  files = files.slice(0);

  // output?
  var out = this._output;
  if(typeof out === 'string') out = fstream.Writer({ path: out });
  if(!(out instanceof Stream && out.writable)) {
    return done(new Error('Output must be a Writable Stream'));
  }

  var writer = this.writer;
  writer.head(out, {
    hold: options.hold,
    requires: this._requires
  });

  out.on('close', done);

  // computes the common dirname
  var me = this;
  (function next(file) {
    if(!file) {
      writer.tail(out, options);
      if(out && out.end && out !== process.stdout) out.end();
      else done();
      return;
    }
    var ext = path.extname(file);
    var name = file.replace(options.prefix, '').replace(ext, '');
    if(name[0] === '/') name = name.slice(1);

    var engine = me.engines[ext];
    if(!engine) return done(new Error('Unknown engine for ' + ext + ' extension. File: ' + file));

    fs.readFile(file, 'utf8', function(err, data) {
      if(err) return done(err);
      var body = engine(data);
      writer.file(out, {
        name: name,
        hold: options.hold,
        body: body
      });
      return next(files.shift());
    });
  })(files.shift());

};
