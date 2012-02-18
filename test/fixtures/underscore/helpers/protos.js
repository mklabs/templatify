
var adapter = require('underscore-adapter');

var protos = module.exports = function protos(context) {
  var args = Array.prototype.slice.call(arguments);
  return 'En taro tassadar,' + args.join(' ');
};

adapter.helper('protos', protos);

