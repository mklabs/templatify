
var fs      = require('fs');
var path    = require('path');
var fstream = require('fstream');
var Stream  = require('stream').Stream;

module.exports = compiler;
compiler.engines = require('./engines');

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
// - hold: Variables holding the precompiled templates (default: JST)
// - output: String or Stream to write to (default: process.stdout)
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

  // stream
  c._output = options.output || process.stdout;
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
compiler.engine = function(ext, fn) {
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

// **jst(str, options)** helper to return the final result of the pre-compiled template.
compiler.jst = function(str, options) {
  return [
    '// Template: ' + options.name,
    options.hold + '["' + options.name  + '"] = ' + str + ';',
    '',
    ''
  ].join('\n');
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
    throw new Error('Output must be either a Strring or a writable output.');
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
  if(typeof out === 'string') out = fstream.Writer(out);
  if(!(out instanceof Stream && out.writable)) {
    return done(new Error('Output must be a Writable Stream'));
  }

  out.write('\n');
  out.write('(function(exports) {');
  out.write('\n');
  out.write('  var ' + options.hold + ' = exports.' + options.hold + ' = ' + options.hold + ' || {};');
  out.write('\n');

  out.on('close', done);

  // computes the common dirname
  var me = this;
  (function next(file) {
    if(!file) {
      out.write('');
      out.write('})(this);');
      out.write('\n');
      if(options.out) out.end();
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
      var src = engine(data);
      out.write('  ' + me.jst(src, {
        hold: options.hold,
        name: name
      }));
      return next(files.shift());
    });
  })(files.shift());

};
