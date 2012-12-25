
var templates = require('../template');

var app = module.exports;
app.version = '0.0.1';

function $(sel, ctx) {
  ctx = ctx || document;
  return Array.prototype.slice.call(ctx.querySelectorAll(sel));
}

app.init = function init(data) {
  var hbs = $('.hbs');
  hbs[0].innerHTML = templates.modules(data);

  var hogan = $('.hogan');
  hogan[0].innerHTML = templates.timeline({
    message: 'Rendered from mustache template'
  });
};
