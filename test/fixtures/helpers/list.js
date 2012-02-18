
var Handlebars = require('handlebars');

var list = module.exports = function(items, options) {
  items = items || [];
  var out = ["<ul>"];

  out = out.concat(items.map(function(item) {
    return '    <li>' + options.fn(item) + '</li>';
  }));

  out.push('  </ul>');

  return out.join('\n');
};

Handlebars.registerHelper('list', list);
