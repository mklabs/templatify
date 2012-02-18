var fs = require('fs'),
  vm = require('vm'),
  path = require('path'),
  assert = require('assert'),
  browserify = require('browserify'),
  vows = require('vows'),
  templatify = require('../'),
  helpers = require('./helpers');

vows.describe("Partials").addBatch({
  "when used within templates": {
    topic: function() {
      var src = browserify({ cache: helpers.CACHE })
        .use(templatify(path.join(__dirname, 'fixtures'), { files: ['*.html', 'partials/*.html'] }))
        .bundle();

      var c = {};
      vm.runInNewContext(src, c);
      this.callback(null, c, src);
    },

    "should register appropriately and return the correct output": function (err, c, src) {
      assert.ifError(err);

      assert.ok(c.require.modules.handlebars, 'should handlebars runtime module be registered');
      assert.ok(c.require('handlebars'), 'should handlebars runtime module be registered');

      var tmpl = c.require('test/fixtures/foobar');
      assert.equal(typeof tmpl, 'function');
      assert.equal(tmpl({}), fs.readFileSync('test/fixtures/expected/foobar-empty.html', 'utf8'));
      assert.equal(tmpl({ title: 'templatify', body: '☺' }), fs.readFileSync('test/fixtures/expected/foobar.html', 'utf8'));

      var partials = c.require('test/fixtures/withpartial');
      assert.equal(typeof tmpl, 'function');
      assert.equal(partials({}), fs.readFileSync('test/fixtures/expected/partial-empty.html', 'utf8'));
      assert.equal(partials({ adjective: 'templatify' }), fs.readFileSync('test/fixtures/expected/partial.html', 'utf8'));
    }
  }
}).export(module);
