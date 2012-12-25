var fs       = require('fs');
var assert   = require('assert');
var compiler = require('../lib/compiler');

describe('Compiler', function() {

  it('creates new instance', function() {
    var c = compiler();
    assert.deepEqual(c.options, { files: [], prefix: '', hold: 'JST' });
    assert.deepEqual(c.engines, {});
  });

  it('can register engine per extension', function() {
    var c = compiler();
    var engine = function() {
      return s;
    };

    c.engine('html', engine);
    assert.deepEqual(c.engines, {
      '.html': engine
    });
  });

  describe('compiles down a directory full of template files into a single JavaScript file', function() {

    before(function(done) {
      var ctx = this;
      ctx.compiler = compiler()
        .engine('jst', compiler.engines.underscore)
        .engine('hbs', compiler.engines.handlebars)
        .engine('mustache', compiler.engines.hogan)
        .file('test/fixtures/templates/entry.hbs')
        .file('test/fixtures/templates/timeline.mustache', 'test/fixtures/templates/people.jst')
        .file([
          'test/fixtures/templates/underscore/index.jst',
          'test/fixtures/templates/handlebars/index.hbs',
          'test/fixtures/templates/hogan/index.mustache'
        ]);

      fs.readFile('test/fixtures/expected/templates.js', 'utf8', function(err, body) {
        if(err) return done(err);
        ctx.expected = body;
        done();
      });
    });

    it('outputs to stdout by default', function(done) {
      this.compiler.run(done);
    });

    it('writes to .output(filename)', function(done) {
      var expected = this.expected;
      this.compiler
        .output('test/fixtures/templates.js')
        .run(function(err) {
          if(err) return done(err);
          fs.readFile('test/fixtures/templates.js', 'utf8', function(err, body) {
            if(err) return done(err);
            assert.equal(body, expected);
            done();
          });
        });
    });

    it('writes to .output(stream)', function(done) {
      var expected = this.expected;
      this.compiler
        .output(fs.createWriteStream('test/fixtures/templates.js'))
        .run(function(err) {
          if(err) return done(err);
          fs.readFile('test/fixtures/templates.js', 'utf8', function(err, body) {
            if(err) return done(err);
            assert.equal(body, expected);
            done();
          });
        });
    });

  });

});
