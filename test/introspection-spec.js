var vm = require('vm'),
  path = require('path'),
  assert = require('assert'),
  browserify = require('browserify'),
  vows = require('vows'),
  templatify = require('../'),
  helpers = require('./helpers');

var silent = true;

vows.describe("Template introspection").addBatch({
  "in debug mode, each precompiled template": {
    topic: function() {
      var src = browserify()
        .use(templatify(path.join(__dirname, 'fixtures'), {
          files: ['*.html', 'partials/*.html'],
          helpers: ['**/*.js']
        }))
        .bundle();

      var c = {};
      vm.runInNewContext(src, c);
      this.callback(null, c, src);
    },

    "should have metadata attached": function (err, c, src) {
      var tmpl = c.require('test/fixtures/partials/yeller'),
        meta = tmpl.meta;
      assert.equal(meta.name, 'partial-helper');
      assert.equal(meta.description, 'A partial to test things out');
    },

    "should vars, helpers, partials, metadata used within templates available as debug properties": function(err, c, src) {
      ['foobar', 'helper-partial']
        .map(function(p) { return path.join('test/fixtures', p) })
        .forEach(inspect(c, {}, silent));

      var withpartial = inspect(c, {
        vars: ['adjective'],
        partials: ["test_fixtures_partials_partial"]
      }, silent);

      var helper = inspect(c, {
        helpers: ['yeller']
      }, silent);

      var helperPartial = inspect(c, {
        partials: ['test_fixtures_partials_yeller']
      }, silent);

      var foobar = inspect(c, {
        vars: ['title', 'body']
      }, silent);

      var yeller = inspect(c, {
        vars: ['plugin'],
        helpers: ['yeller'],
        meta: {
          name: 'partial-helper',
          description: 'A partial to test things out'
        }
      }, silent);

      withpartial('test/fixtures/withpartial');
      helper('test/fixtures/helper');
      helperPartial('test/fixtures/helper-partial');
      foobar('test/fixtures/foobar');
      yeller('test/fixtures/partials/yeller');
    }

  },

  "with debug set to false": {
    topic: function() {
      var src = browserify()
        .use(templatify(path.join(__dirname, 'fixtures'), {
          debug: false,
          files: ['*.html', 'partials/*.html'],
          helpers: ['**/*.js']
        }))
        .bundle();

      var c = {};
      vm.runInNewContext(src, c);
      this.callback(null, c, src);
    },

    "should template introspection be turned off": function (err, c, src) {
      var tmpl = c.require('test/fixtures/helper');
      assert.equal(typeof tmpl, 'function');
      assert.ok(!tmpl.vars);
      assert.ok(!tmpl.helpers);
      assert.ok(!tmpl.partials);
      assert.ok(!tmpl.meta);
    },
  }
}).export(module);



function inspect(c, asserts, silent) { return function(name) {
  var tmpl = c.require(name);

  if(!silent) console.log([
    '',
    name,
    new Array(name.length + 1).join('-'),
    'Variables referenced in this template: '                       + tmpl.vars.join(', '),
    'Vars/Partials/templates that this file directly depends on: '  + JSON.stringify(tmpl.deps),
    'Helpers that this template directly depends on: '              + JSON.stringify(tmpl.helpers),
    'Partials that this template directly depends on: '             + JSON.stringify(tmpl.partials),
    'The metadata object at the top of the file (if it exists): '   + JSON.stringify(tmpl.meta),
    ''
  ].map(function(s) { return '      ' + s; }).join('\n'));

  assert.ok(tmpl.vars);
  assert.ok(tmpl.deps);
  assert.ok(tmpl.helpers);
  assert.ok(tmpl.meta);

  asserts && asserts.vars       && assert.deepEqual(tmpl.vars, asserts.vars);
  asserts && asserts.helpers    && assert.deepEqual(tmpl.helpers, asserts.helpers);
  asserts && asserts.partials   && assert.deepEqual(tmpl.partials, asserts.partials);
  asserts && asserts.vars       && assert.deepEqual(tmpl.vars, asserts.vars);
  asserts && asserts.meta       && assert.deepEqual(tmpl.meta, asserts.meta);

}}
