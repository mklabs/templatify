
var fs = require('fs'),
  path = require('path'),
  glob = require('glob'),
  hbs = require('handlebars');

// templates to include for later use
var body = fs.readFileSync(path.join(__dirname, 'templates/body.js'), 'utf8'),
  templates = path.join(__dirname, 'templates');

// browerify middleware - templatify any html files into handlebars template.
var templatify = module.exports = require('./middleware');

// setup each template adapter as lazy-loaded getter
templatify.adapters = {};
fs.readdirSync(templates).filter(filterDir).forEach(function(dir) {
  templatify.adapters.__defineGetter__(dir, function() {
    return require(path.join(templates, dir));
  })
});

function filterDir(dir) {
  return fs.statSync(path.join(__dirname, 'templates', dir)).isDirectory();
}
