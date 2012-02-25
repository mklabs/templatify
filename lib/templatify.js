
var fs = require('fs'),
  path = require('path'),
  glob = require('glob'),
  hbs = require('handlebars');

// templates to include for later use
var adapters = path.join(__dirname, 'adapters');

// browerify middleware - templatify any html files into handlebars template.
var templatify = module.exports = require('./middleware');

// setup each template adapter as lazy-loaded getter
templatify.adapters = {};
fs.readdirSync(adapters).filter(filterDir).forEach(function(dir) {
  templatify.adapters.__defineGetter__(dir, function() {
    return require(path.join(adapters, dir));
  })
});

function filterDir(dir) {
  return fs.statSync(path.join(adapters, dir)).isDirectory();
}
