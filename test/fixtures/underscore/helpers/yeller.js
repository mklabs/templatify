
var adapter = require('underscore-adapter');

var yeller = module.exports = function yeller(context) {
  return context.toUpperCase();
};

adapter.helper('yeller', yeller);

