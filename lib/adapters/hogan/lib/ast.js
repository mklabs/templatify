var ast = exports;

ast.findPartialDeps = function findPartialDeps(nodes, res, prefix) {
  res = res || {
    vars: [],
    meta: [],
    helpers: [],
    partials: []
  };

  prefix = prefix || '';

  nodes.forEach(function(n) {
    var name = prefix + n.n,
      tag = n.tag,
      nodes = n.nodes;

    if(!n.tag || !name) return;
    // recursive thingy here
    if(nodes) res = findPartialDeps(nodes, res, name + '.');

    if(tag === '_v' || tag === '#') res.vars.push(name);
    else if(tag === '>') res.partials.push(name.replace(prefix, ''));
  });

  return res;
};
