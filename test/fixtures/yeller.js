
var Handlebars = require('handlebars');

// exports so that we can require the helper function in our own code
var yeller = module.exports = function yeller(context, options) {
  // Assume it's a string for simplicity.
  context = context || '';
  return context.toUpperCase();
};

// and register as an handlebar helper.
Handlebars.registerHelper('yeller', yeller);

