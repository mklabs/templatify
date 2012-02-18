var fs = require('fs'),
  vm = require('vm'),
  path = require('path'),
  assert = require('assert'),
  browserify = require('browserify'),
  vows = require('vows'),
  templatify = require('../'),
  helpers = require('./helpers');

vows.describe("Helpers").addBatch({
  "when used within templates": {
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

    "should register appropriately and return the correct output": function (err, c, src) {
      var tmpl = c.require('test/fixtures/helper');
      assert.equal(typeof tmpl, 'function');
      assert.equal(tmpl({ plugin: 'templatify' }), fs.readFileSync('test/fixtures/expected/yeller.html', 'utf8'));
    },

    "should helper within partial works as well": function(err, c, src) {
      assert.ifError(err);
      var tmpl = c.require('test/fixtures/helper-partial');
      assert.equal(typeof tmpl, 'function');
      assert.equal(tmpl({ plugin: 'templatify' }), fs.readFileSync('test/fixtures/expected/partial-yeller.html', 'utf8'));
    },

    "should helpers be available for usage within code as `require('helper:basename')`": function(err, c, src) {
      assert.ifError(err);
      var yeller = c.require('helper:yeller');
      assert.ok(yeller, 'should not throw, if is then ☹');
    },

    "with an helper nested within the file structure be registered as `helper:basename`": function(err, c, src) {
      assert.ifError(err);
      var tmpl = c.require('helper:icon');
    },

    "return both the correct output": function(err, c, src) {
      assert.ifError(err);
      var yeller = c.require('helper:yeller');
      assert.equal(yeller('maoow'), 'MAOOW');

      var icon = c.require('helper:icon');
      assert.equal(icon('home'), '<i class="icon icon-home"></i>');
      assert.equal(icon(), '<i class="icon icon-star"></i>');
    }
  }
}).export(module);
