// Engines
var engines = module.exports;

// Require cache
var requires = {};

// Underscore support.
engines.underscore = function(str) {
  var engine = requires.underscore || (requires.underscore = require('underscore'));
  return engine.template(str).source;
};

// Hogan support.
engines.hogan = function(str) {
  var engine = requires.hogan || (requires.hogan = require('hogan.js'));
  return [
    '(function() {',
    '  var t = new Hogan.Template({',
    '    code: ' + engine.compile(str, { asString: true }),
    '  });',
    '',
    '  return function(context, partials, indent) {',
    '    return t.render(context, partials, indent);',
    '  };',
    '',
    '})()'
  ].join('\n');
};

// Handlebars support.
engines.handlebars = function(str) {
  var engine = requires.handlebars || (requires.handlebars = require('handlebars'));
  return 'Handlebars.template(' + engine.precompile(str) + ')';
};
