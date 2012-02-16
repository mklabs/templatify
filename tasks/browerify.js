
var fs = require('fs'),
  path = require('path'),
  util = require('util'),
  browserify = require('browserify'),
  templatify = require('../scripts/templatify');

task.registerTask('notify', 'notify things', function() {
  task.helper('emit', 'running', 'some', 'things');
});

task.registerHelper('emit', function() {
  var args = Array.prototype.slice.call(arguments),
    evt = args.shift() || 'changed';

  var sockets = config('sockets'),
    errors = config('browserify_errors') || [];

  sockets && Object.keys(sockets).forEach(function(s) {
    var socket = sockets[s];
    if(errors.length) return socket.emit('error', errors);
    socket.emit.apply(socket, [evt].concat(args));
  });
});

task.registerBasicTask('browserify', 'Browserify your modules for web content', function(o, name) {
  var output = path.resolve(name),
    templates = config('templatify');

  config('browserify_errors', []);

  o = Array.isArray(o) ? o : [o];

  var files = file.expand(o);
  if(!files.length) return fail.warn('Cannot expand to ' + log.wordlist(o));
  log.writeln('Browserifying using scripts/build...');

  var b = browserify({
    cache: path.join(__dirname, 'cache.json')
  });

  task.helper('browserify.index', b);
  task.helper('browserify.backbone', b);
  task.helper('browserify.post', b);
  task.helper('templatify', b, templates.dir, templates.files);
  log.writeln('Adding entry ' + log.wordlist(o));
  try {
    o.forEach(b.addEntry);
  } catch(e) {
    task.helper('add_error', e, 'Browserify unhappy ☹: ', 'browserify_errors');
    return log.error(e);
  }
  log.writeln('Writing bundle to ' + output);
  file.write(output, b.bundle());
});

task.registerHelper('browserify.backbone', function(b) {
  b.register('backbone.js', function(body, file) {
    var reg = /\}\)\.call\(this\);/;
    return body.replace(reg, '}).call(window);');
  });
});

task.registerHelper('browserify.post', function(b) {

  b.register('post', function(body, file) {
    return [
      //'(function() {',
      '// process.env overrides for cfg.js',
      'if(typeof process === "undefined") process = {};',
      'process.env = process.env || {};',
      'process.argv = process.argv || [];',
      'process.env.NODE_ENV = "' + (process.env.NODE_ENV || 'prod') + '";',
      '',
      body,
      //'})();'
    ].join('\n\n');
  });
});

task.registerHelper('browserify.index', function(b) {

  b.register('index.js', function(body, file) {
    var dirname = path.dirname(file),
      memo = 'var autoload = module.exports;';

    fs.readdirSync(dirname).forEach(function(f) {
      var ext = path.extname(f),
        name = f.replace(ext, ''),
        capitalized = name[0].toUpperCase() + name.slice(1);

      if(!ext || f === path.basename(file)) return;
      if(!~b.extensions.indexOf(ext)) return;
      var content = fs.readFileSync(path.resolve(dirname, f), 'utf8');
      memo += 'autoload["' + camelcase((/module\.exports/).test(content) ? capitalized : name) + '"] = require("./' + f + '");';
    });

    return memo;
  });
});

task.registerHelper('templatify', function(b, dir, files) {
  b.use(templatify(dir, {
    files: files
  }));
});


// Came-case the given "str"
function camelcase(str) {
  return str.split(/[-\[\]]/).map(function(str, i){
    return i && str[0]
      ? str[0].toUpperCase() + str.slice(1)
      : str;
  }).join('');
}
