var writer = module.exports;

// called prior to templates precompilation
writer.head = function head(out, options) {
  out.write('\n');
  out.write('(function(exports) {');
  out.write('\n');
  out.write('  var ' + options.hold + ' = exports.' + options.hold + ' = ' + options.hold + ' || {};');
  out.write('\n');
};

// called after each template precompilation
writer.tail = function tail(out, options) {
  out.write('');
  out.write('})(this);');
  out.write('\n');
};

// called on each file to precompile
writer.file = function file(out, options) {
  var body = options.body || '';
  out.write('  ' + jst(body, options));
};

// **jst(str, options)** helper to return the final result of the pre-compiled
// template.
function jst(str, options) {
  return [
    '// Template: ' + options.name,
    options.hold + '["' + options.name  + '"] = ' + str + ';',
    '',
    ''
  ].join('\n');
}

