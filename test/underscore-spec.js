var fs = require('fs'),
  vm = require('vm'),
  path = require('path'),
  assert = require('assert'),
  browserify = require('browserify'),
  vows = require('vows'),
  templatify = require('../'),
  helpers = require('./helpers');

vows.describe("Underscore adapter").addBatch({
  "when underscore adapter is used": {
    topic: function() {
      var src = browserify({ cache: helpers.CACHE })
        .use(templatify(path.join(__dirname, 'fixtures/underscore'), {
          files: ['*.html'],
          helpers: ['**/*.js'],
          adapter: templatify.adapters.underscore
        }))
        .bundle();

      var c = {};
      vm.runInNewContext(src, c);
      this.callback(null, c, src);
    },

    "should return the correct output": function (err, c, src) {
      var tmpl = c.require('test/fixtures/underscore/template'),
        expected = path.join(__dirname, 'fixtures/underscore/expected/partial-test.html');

      assert.equal(tmpl({ title: 'Some title', body: 'body content' }), fs.readFileSync(expected, 'utf8'));
    }
  }
}).export(module);
