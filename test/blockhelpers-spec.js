var fs = require('fs'),
  vm = require('vm'),
  path = require('path'),
  assert = require('assert'),
  browserify = require('browserify'),
  vows = require('vows'),
  templatify = require('../'),
  helpers = require('./helpers');

vows.describe("Block Helpers").addBatch({
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
      var tmpl = c.require('test/fixtures/block-helper');
      assert.equal(typeof tmpl, 'function');
      var people = [
        {firstName: "Yehuda", lastName: "Katz"},
        {firstName: "Carl", lastName: "Lerche"},
        {firstName: "Alan", lastName: "Johnson"}
      ];
      assert.equal(tmpl({ people: people }), fs.readFileSync('test/fixtures/expected/block-helper.html', 'utf8'));
    }
  }
}).export(module);
