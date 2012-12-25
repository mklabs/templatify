# templatify

Utility lib and script to precompile a list of templates per file extension.

## Installation

    $ npm install templatify

## Supported template engines

- [hogan][]
- [handlebars][]
- [underscore][]

[hogan]: https://github.com/twitter/hogan.js
[handlebars]: https://github.com/wycats/handlebars.js/
[underscore]: https://github.com/documentcloud/underscore

__NOTE__: you must still install the engines you wish to use, add them to your
package.json dependencies.

## Example

    $ templatify

> tbd

### Integration with GNU Make

> tbd

### Integration with Grunt

> tbd

## API
   - [Compiler](#compiler)
     - [compiles down a directory full of template files into a single JavaScript file](#compiler-compiles-down-a-directory-full-of-template-files-into-a-single-javascript-file)
<a name=""></a>

<a name="compiler"></a>
# Compiler
creates new instance.

```js
var c = compiler();
assert.deepEqual(c.options, { files: [], prefix: '', hold: 'JST' });
assert.deepEqual(c.engines, {});
```

can register engine per extension.

```js
var c = compiler();
var engine = function() {
  return s;
};

c.engine('html', engine);
assert.deepEqual(c.engines, {
  '.html': engine
});
```

<a name="compiler-compiles-down-a-directory-full-of-template-files-into-a-single-javascript-file"></a>
## compiles down a directory full of template files into a single JavaScript file
outputs to stdout by default.

```js
this.compiler.run(done);
```

writes to .output(filename).

```js
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
```

writes to .output(stream).

```js
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
```

