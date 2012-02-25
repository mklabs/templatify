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

      assert.equal(tmpl({
        name: "Chris",
        value: 10000,
        taxed_value: 10000 - (10000 * 0.4),
        in_ca: true
      }), fs.readFileSync(expected, 'utf8'));
    }
  }
}).export(module);
