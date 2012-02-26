
var fs = require('fs'),
  vm = require('vm'),
  path = require('path'),
  assert = require('assert'),
  browserify = require('browserify'),
  vows = require('vows'),
  templatify = require('../'),
  helpers = require('./helpers');

// Some bro tests!

//
// Testing actual require of templates from client-side browerified package.
//


vows.describe("Browerify package").addBatch({
  "when used within a browserified bundle": {
    topic: function() {
      var b = browserify({ cache: helpers.CACHE })
        .use(templatify(path.join(__dirname, 'fixtures/hogan'), {
          files: ['*.html'],
          adapter: templatify.adapters.hogan
        }));

      try {
        b.addEntry(path.join(__dirname, 'fixtures/browserify/app.js'));
      } catch(e) {
        this.callback(e);
      }

      var c = {},
        src = b.bundle();
      vm.runInNewContext(src, c);
      this.callback(null, c, b.bundle());
    },

    "should return the correct output": function (err, c, src) {
      assert.ifError(err);
      var tmpl = c.require('test/fixtures/hogan/template');
      assert.ok(true, 'no error thrown');
      assert.ok(typeof tmpl === 'function');
    }
  }
}).export(module);
