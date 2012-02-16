
// Lookup any bind / trigger and build a "graph" of events communication
// within the app

// or some foobar...

// Rough notes:
//
// Relies on fancy regex to guess the events triggered / bound to app namespace.
// This results in a basic and simple hash of files with each file populated with
// triggers / binds props.
//
//
// Todo and investigate using AST (via uglify) instead of regexp to do that, ideally I'd like to be
// able to guess from which component the trigger / bind call happend, and from which method.

var fs = require('fs'),
  path = require('path'),
  util = require('util'),
  glob = require('glob'),
  nopt = require('nopt'),
  mkdirp = require('mkdirp'),
  _ = underscore = require('underscore');


var o = nopt(),
  globs = o.argv.remain;

if(!globs.length) throw new Error('Some files must be provided, glob pattern. eg: **.js');

var files = _.chain(globs)
  .map(function(pattern) {
    // unix like path whatever the platform is
    pattern = pattern.replace(/\\/g, '/');
    return glob.sync(pattern);
  }).reduce(function(a, b) {
    return a.concat(b);
  })
  .uniq()
  .value();


// for each files, grab the content and lookup for specific fancy regexp
var hash = {};
files.forEach(function(key) {
  hash[key] = fs.readFileSync(path.resolve(key), 'utf8');
});

// output some logging only on files with some interrest
var events = {};
Object.keys(hash).forEach(function(file) {
  var content = hash[file],
    regT = /app\.trigger\(\s?['"]([^'"]+)['"]/,
    regTG = /app\.trigger\([^\)]+\)/g,
    regB = /app\.bind\(\s?['"]([^'"]+)['"]/,
    regBG = /app\.bind\([^\)]+\)/g,
    triggers = content.match(regTG) || [],
    binds = content.match(regBG) || [];

  var evt = events[file] = {};
  triggers.forEach(function(t) {
    var ev = t.match(regT);
    evt.trigger = (evt.triggers || []).concat(ev[1]);
  });

  binds.forEach(function(t) {
    var ev = t.match(regB);
    evt.binds = (evt.binds ||[]).concat(ev[1]);
  });
});

if(!o.output) return console.log(util.inspect(events, false, 2, true));
var output = path.resolve(o.output === true ? 'graph.json' : o.output);

mkdirp.sync(path.dirname(output));
fs.writeFileSync(output, JSON.stringify(events, null, 2));

