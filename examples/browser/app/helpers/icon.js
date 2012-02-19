
var Handlebars = require('handlebars');

// exports so that we can require the helper function in our own code
var icon = module.exports = function icon(context, options) {
  // Assume it's a string for simplicity.
  context = context || 'star';
  return new Handlebars.SafeString(('<i class="icon icon-:icon"></i>').replace(/:icon/, context));
};

// and register as an handlebar helper.
Handlebars.registerHelper('icon', icon);

