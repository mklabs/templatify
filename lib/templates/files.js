
var Handlebars = require('handlebars');

var t = module.exports = Handlebars.template($body);

$deps

// each template register himself as an helper as well
// `/` in paths are replaced by `_`

Handlebars.registerPartial('$helper', t);

