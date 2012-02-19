
# templatify

Middleware for browserify to load non-js files as precompiled handlebars (or underscore) templates.

[![Build Status](https://secure.travis-ci.org/mklabs/templatify.png)](http://travis-ci.org/mklabs/templatify)

Most of the code base and featureset ot this plugin is based and inspired on
[require-handlebars-plugin](https://github.com/SlexAxton/require-handlebars-plugin).

## Usage

```javascript
var templatify = require('templatify');

var bundle = browserify()
  .use(templatify('./', {
    files: ['**/*.html'],
    helpers: ['**/*.js']
  }))
  .bundle();

console.log(bundle);

// write output to `templates.js`
require('fs').writeFileSync('./templates.js', bundle);

// Use underscore adapater instead of handlebars default one
var bundle = browserify()
  .use(templatify('./', { adapter: templatify.adapters.underscore }))
  .bundle();

console.log(bundle);
```

Write a template ( path: `app/template/one.html` ):

```html
<div class="entry">
  <h1>{{title}}</h1>
  <div class="body">
    {{ body }}

    {{! To include a partial: }}
    {{! Use underscores instead of slashes in your path, }}
    {{! and leave off the extension. }}

    {{> app_template_partial }}

  </div>
</div>
```

Here's the partial (optional) ( path : `app/template/partial.html` )

```html
<div>
  {{! This can obviously have it's own partials, etc, etc }}
  I am a partial
</div>
```

Then require your templates like so:

```javascript
var tmpl = require('app/template/one');
document.body.innerHTML = tmpl({ title: 'templatify', body: '☺' });
```

And then the output into `body` would be as follows:

```html
<div class="entry">
  <h1>templatify</h1>
  <div class="body">
    ☺
    <div>
      I am a partial
    </div>
  </div>
</div>
```



## Partials

To include a partial, use underscore instead of slashes in the path
without file extension.

    {{> app_template_partial }}

will include the `app/template/partials.html` file which might have it's own partials, etc, etc

## Helpers

Just put your helpers in `dirname/**/*.js` and they'll automagically get pulled in as long as you write them as modules.

```javascript
// dirname/yeller.js
var Handlebars = require('handlebars');

// exports so that we can require the helper function in our own code
var yeller = module.exports = function yeller(context, options) {
  // Assume it's a string for simplicity.
  context = context || '';
  return context.toUpperCase();
};

// and register as an handlebar helper.
Handlebars.registerHelper('yeller', yeller);
```

Then in your templates, you can just do:

```mustache
{{yell maoow}}
```

The system will:

* make sure these modules are pulled in automatically from the `dirname`
  directory
* register each module as an handlebars helper.
* register each module as a browserify module available through
  `helper:basename`

```javascript
var yeller = require('helper:yeller'),
  assert = require('assert');

assert.equal(yeller('maoow'), 'MAOOW');
```

It's just a module that happens to register itself.

## Meta Data

Any template that begins with a comment, with _only_ a valid json object
in it will be read in as meta data for the template.

This is advised to list the name of the template and give a description,
though these aren't strictly necessary.

## Introspection

In dev mode a few properties are added to your function (an object in
javascript) as a helper with debugging and as a testing plug-point.

Those variables look like the following:

```javascript
var tmpl = require('app/template/one');
console.log([
  'Variables referenced in this template: '                       + tmpl.vars.join(', '),
  'Vars/Partials/templates that this file directly depends on: '  + JSON.stringify(tmpl.deps),
  'Helpers that this template directly depends on: '              + JSON.stringify(tmpl.helpers),
  'Partials that this template directly depends on: '             + JSON.stringify(tmpl.partials),
  'The metadata object at the top of the file (if it exists): '   + JSON.stringify(tmpl.meta)
].join('\n'));

// Output..

// Variables referenced in this template: title, body
// Vars/Partials/templates that this file directly depends on: {"vars":["title","body"],"helpers":[],"partials":["app_template_partial"]}
// Helpers that this template directly depends on: []
// Partials that this template directly depends on: ["app_template_partial"]
// The metadata object at the top of the file (if it exists): {}
```

Note: All of these go away after a build if the debug options is set to
false (defaults to `true`) 

## Options

```javascript
var browserify = require('browserify'),
  templatify = require('templatify');

templatify(dirname, options);
```

`dirname` is the base working directory. Defaults to `$cwd`.

### files

Glob pattern as string or array of strings for template files within
`dirname`.  Each match is then registered as an handlebar template and
available through `require('path/to/template')`.

Defaults to `**/*.html`.

### helpers

Glob pattern as string or array of strings for handlebars helpers within
`dirname`.

Defaults to `**/*.js`

### ext

File extension to register, should match the `files` option.

Defaults to `.html`

### compile

Function to call when templates are precompiled.

Defaults to `Handlebars.compile`.

### parse

Function to call when templates are parsed, should return a list of node
for ast traversal.

Defaults to `Handlebars.parse`.

### tmpl

Base template to use for templates registered as commonjs module.

Defaults to:

    var Handlebars = require('handlebars');

    $helpers
    $partials

    var t = module.exports = Handlebars.template($body);

    $debugProps

    Handlebars.registerPartial('$partial', t);


### debug

Indicate wheter or not introspection should be turned off. `true` will
attach `vars`, `helpers`, `partials` and `meta` as function property.

Defaults to `true`.

### glob

Configuration object to use for when using `glob.sync`. Refer to [glob
documentation](https://github.com/isaacs/node-glob#readme) for further details.

Defaults to `{}`.

## Motivation

How templates are used within a webapp is an important question. That's
usually done by fetching templates from the DOM with inline `<script
type="text/template" id="template-foo">...</script>`, or from remote
files with XHR. Both are the most common used ways to fetch template
from client-side JavaScript.

Using AMD and requirejs, this is slightly better with the `txt!` plugin
which allow templates to be located in their own file while inlined for
production.

Another elegant approach used by Jammit is to use a `JST` variable (or
any other namespace) to inline tamplates in a hash object relying on a
build process to process the files. This is also the technique used in
backbone-boilerplate.

Using browerify,
[node-fileify](https://github.com/substack/node-fileify) which is a
really neat tool can be used to achieve that, however it simply returns
html strings into an hash object with keys as filename.

Ideally, I'd like these template files to be compiled into handlebars
precompiled template and try to be as close as possible to all the
really cool features that 
[require-handlebars-plugin](https://github.com/SlexAxton/require-handlebars-plugin)
offers (like18n helpers, partials, custom helpers, metadata, introspection...).

## Other Templating Languages

If you'd like to implement this for your templating language of choice,
you'll need:

* A pre-compile type functionality.
* If it has some concept of partials, that you can register them
  externally
* For any of the meta-data, you'll need some fancy regex or an AST to
  walk through.

Other templates might be implemented by droping a folder into
`lib/templates` which name is the template adapter to use. This folder
must be a valid npm package, either by droping here an `index.js` or a
complete package with its own `package.json`.


## Install

    npm install templatify

Append a `-g` flag if you intend to use the cli tool described below.

## CLI Usage


    Usage: 

       templatify files* [options]


    Options:
       -o, --output    Output file, output to stdout if ommited
       -h, --helpers   Glob patterns for helper inclusion, usually js files (**/*.js)
       -c, --compress  Uglify bundle output (false)
       -a, --adapter   Template adapter to use, handlebars or underscore (handlebars)
       --help          You're starting at it

## Tests - [![Build Status](https://secure.travis-ci.org/mklabs/templatify.png)](http://travis-ci.org/mklabs/templatify)

    npm tests

## Credits

And special thanks to

* **@SlexAxton**: Most of the inspiration for this package and the code
  base for ast traversal is based off the fantastic AMD plugin
  [require-handlebars-plugin](https://github.com/SlexAxton/require-handlebars-plugin).

* **@substack**: Reading through
  [node-fileify](https://github.com/substack/node-fileify) sources was
  super handy. And of course, for creating browserify :p

