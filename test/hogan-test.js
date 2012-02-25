var fs = require('fs'),
  vm = require('vm'),
  path = require('path'),
  assert = require('assert'),
  browserify = require('browserify'),
  vows = require('vows'),
  templatify = require('../'),
  helpers = require('./helpers');

vows.describe("Hogan adapter").addBatch({
  "when hogan adapter is used": {
    topic: function() {
      var src = browserify({ cache: helpers.CACHE })
        .use(templatify(path.join(__dirname, 'fixtures/hogan'), {
          files: ['*.html'],
          helpers: ['**/*.js'],
          adapter: templatify.adapters.hogan
        }))
        .bundle();

      var c = {};
      vm.runInNewContext(src, c);
      this.callback(null, c, src);
    },

    "should return the correct output": function (err, c, src) {
      var tmpl = c.require('test/fixtures/hogan/template'),
        expected = path.join(__dirname, 'fixtures/hogan/expected/template.html');

      var got = tmpl({
        name: "Chris",
        value: 10000,
        taxed_value: 10000 - (10000 * 0.4),
        in_ca: true,
        items: [{
          name: 'foobar',
          parts: [{
            name: 'foo',
            val: 'bar'
          }]
        }]
      });

      assert.equal(got, fs.readFileSync(expected, 'utf8'));
    },


    "should have vars and helpers attached as function property": function (err, c, src) {
      var tmpl = c.require('test/fixtures/hogan/template');

      var got = tmpl({
        name: "Chris",
        value: 10000,
        taxed_value: 10000 - (10000 * 0.4),
        in_ca: true,
        items: [{
          name: 'foobar',
          parts: [{
            name: 'foo',
            val: 'bar'
          }]
        }]
      });
      assert.ok(tmpl.vars, 'should have vars attached');
      assert.ok(tmpl.partials, 'should have partials attached');

      var expected = [
        'name',
        'value',
        'in_ca.taxed_value',
        'in_ca',
        'items.name',
        'items.value',
        'items.parts.name',
        'items.parts.value',
        'items.parts',
        'items',
        'hash.key',
      ];

      assert.deepEqual(tmpl.vars, expected, 'should vars be accurate');
      assert.deepEqual(tmpl.partials, ['whatev', 'another', 'app_template_partial', 'app_template_item'], 'should partials array be accurate');
    }
  }
}).export(module);
