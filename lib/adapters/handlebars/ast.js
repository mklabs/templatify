var _ = require('underscore');

// parse templates
// borrowed to requirejs-handlebars-plugin by @SlexAxton
//
// > https://github.com/SlexAxton/require-handlebars-plugin/blob/master/hbs.js

//
// Uses handlebars' AST to find partials.
//

var recursiveNodeSearch = exports.recursiveNodeSearch = function recursiveNodeSearch( statements, res ) {
  _(statements).forEach(function ( statement ) {
    if ( statement && statement.type && statement.type === 'partial' ) {
        res.push(statement.id.string);
    }
    if ( statement && statement.program && statement.program.statements ) {
      recursiveNodeSearch( statement.program.statements, res );
    }
  });
  return res;
};

var findPartialDeps = exports.findPartialDeps = function findPartialDeps( nodes ) {
  var res   = [];
  if ( nodes && nodes.statements ) {
    res = recursiveNodeSearch( nodes.statements, [] );
  }
  return _(res).unique();
};

var getExternalDeps = exports.getExternalDeps = function getExternalDeps( nodes ) { 
  var res   = [];
  var helpersres = [];

  if ( nodes && nodes.statements ) {
    res = recursiveVarSearch( nodes.statements, [], undefined, helpersres );
  }

  var defaultHelpers = ["helperMissing", "blockHelperMissing", "each", "if", "unless", "with"];

  return {
    vars : _(res).chain().unique().map(function(e){
      if ( e === "" ) {
        return '.';
      }
      if ( e.length && e[e.length-1] === '.' ) {
        return e.substr(0,e.length-1) + '[]';
      }
      return e;
    }).value(),
    helpers : _(helpersres).chain().unique().map(function(e){
      if ( _(defaultHelpers).contains(e) ) {
        return undefined;
      }
      return e;
    }).compact().value()
  };
};

var composeParts = exports.composeParts = function composeParts ( parts ) {
  if ( !parts ) {
    return [];
  }
  var res = [parts[0]],
      cur = parts[0],
      i;

  for (i = 1; i < parts.length; ++i) {
    if ( parts.hasOwnProperty(i) ) {
      cur += "." + parts[i];
      res.push( cur );
    }
  }
  return res;
};

var recursiveVarSearch = exports.recursiveVarSearch = function recursiveVarSearch( statements, res, prefix, helpersres ) {
  prefix = prefix ? prefix+"." : "";

  var  newprefix = "", flag = false;

  // loop through each statement
  _(statements).forEach(function ( statement ) {
    var parts, part, sideways;

    // if it's a mustache block
    if ( statement && statement.type && statement.type === 'mustache' ) {

      // If it has params, the first part is a helper or something
      if ( !statement.params || ! statement.params.length ) {
        parts = composeParts( statement.id.parts );
        for( part in parts ) {
          if ( parts[ part ] ) {
            newprefix = parts[ part ] || newprefix;
            res.push( prefix + parts[ part ] );
          }
        }
        res.push(prefix + statement.id.string);
      }

      // grab the params
      if ( statement.params ) {
        _(statement.params).forEach(function(param){
          parts = composeParts( param.parts );

          for(var part in parts ) {
            if ( parts[ part ] ) {
              newprefix = parts[part] || newprefix;
              helpersres.push(statement.id.string);
              res.push( prefix + parts[ part ] );
            }
          }
        });
      }
    }

    // If it's a meta block
    if ( statement && statement.mustache  ) {
      recursiveVarSearch( [statement.mustache], res, prefix + newprefix, helpersres );
    }

    // if it's a whole new program
    if ( statement && statement.program && statement.program.statements ) {
      sideways = recursiveVarSearch([statement.mustache],[], "", helpersres)[0] || "";
      recursiveVarSearch( statement.program.statements, res, prefix + newprefix + (sideways ? (prefix+newprefix) ? "."+sideways : sideways : ""), helpersres);
    }
  });
  return res;
};


var getMetaData = exports.getMetaData = function getMetaData( nodes ) {
  var statement, res, test;
  if ( nodes && nodes.statements ) {
    statement = nodes.statements[0];
    if ( statement.type === "comment" ) {
      try {
        res = ( statement.comment ).replace(new RegExp('^[\\s]+|[\\s]+$', 'g'), '');
        test = JSON.parse(res);
        return res;
      }
      catch (e) {
        return "{}";
      }
    }
  }
  return "{}";
};


