require('handlebars.js');
var Hogan = require('./hogan');
var templates = module.exports;

templates['modules'] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "";
  buffer += "\n  <li>";
  depth0 = typeof depth0 === functionType ? depth0() : depth0;
  buffer += escapeExpression(depth0) + "</li>\n  ";
  return buffer;}

  buffer += "\n<h2>Modules</h2>\n<ul class=\"modules\">\n  ";
  stack1 = depth0.modules;
  stack1 = helpers.each.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</ul>\n";
  return buffer;})

templates['timeline'] = (function() {
  var t = new Hogan.Template({
    code: function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"timeline\">");_.b("\n" + i);_.b("  <button>");_.b(_.v(_.f("message",c,p,0)));_.b("</button>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n");return _.fl();;}
  });

  return function(context, partials, indent) {
    return t.render(context, partials, indent);
  };

})()
