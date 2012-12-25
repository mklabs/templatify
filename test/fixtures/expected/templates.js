
(function(exports) {
  var JST = exports.JST = JST || {};
  // Template: test/fixtures/templates/entry
JST["test/fixtures/templates/entry"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression, self=this, helperMissing=helpers.helperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  foundHelper = helpers.firstName;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.firstName; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + " ";
  foundHelper = helpers.lastName;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.lastName; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1);
  return buffer;}

  buffer += "<div class=\"entry\">\n  <h1>";
  foundHelper = helpers.title;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.title; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</h1>\n  <div class=\"body\">\n    ";
  foundHelper = helpers.body;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.body; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </div>\n\n  ";
  stack1 = depth0.people;
  foundHelper = helpers.list;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)}) : helperMissing.call(depth0, "list", stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</div>\n\n";
  return buffer;});

  // Template: test/fixtures/templates/timeline
JST["test/fixtures/templates/timeline"] = (function() {
  var t = new Hogan.Template({
    code: function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"timeline\">");_.b("\n" + i);_.b("\n" + i);_.b("  <!-- load more button -->");_.b("\n" + i);_.b("  <button>");_.b(_.v(_.f("message",c,p,0)));_.b("</button>");_.b("\n" + i);_.b("\n" + i);_.b("  <!-- tweet object -->");_.b("\n" + i);if(_.s(_.f("tweets",c,p,1),c,p,0,121,140,"{{ }}")){_.rs(c,p,function(c,p,_){_.b(_.rp("tweet",c,p,"    "));});c.pop();}_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n");return _.fl();;}
  });

  return function(context, partials, indent) {
    return t.render(context, partials, indent);
  };

})();

  // Template: test/fixtures/templates/people
JST["test/fixtures/templates/people"] = function(obj){
var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};
with(obj||{}){
__p+='';
 _.each(people, function(name) { 
__p+=' <li>'+
((__t=( name ))==null?'':__t)+
'</li> ';
 }); 
__p+='\n';
}
return __p;
};

  // Template: test/fixtures/templates/underscore/index
JST["test/fixtures/templates/underscore/index"] = function(obj){
var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};
with(obj||{}){
__p+='';
}
return __p;
};

  // Template: test/fixtures/templates/handlebars/index
JST["test/fixtures/templates/handlebars/index"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "";


  return buffer;});

  // Template: test/fixtures/templates/hogan/index
JST["test/fixtures/templates/hogan/index"] = (function() {
  var t = new Hogan.Template({
    code: function(c,p,i){var _=this;_.b(i=i||"");return _.fl();;}
  });

  return function(context, partials, indent) {
    return t.render(context, partials, indent);
  };

})();

})(this);
