
var hogan = require('hogan');

$helpers

var t = module.exports = function(context) {
  var t = new hogan.Template();
  t.r = $body;
  return t.render(context);
};

$debugProps
