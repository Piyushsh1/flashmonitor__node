[![Build Status](https://travis-ci.org/kaelzhang/node-symbol-for.svg?branch=master)](https://travis-ci.org/kaelzhang/node-symbol-for)
<!-- optional appveyor tst
[![Windows Build Status](https://ci.appveyor.com/api/projects/status/github/kaelzhang/node-symbol-for?branch=master&svg=true)](https://ci.appveyor.com/project/kaelzhang/node-symbol-for)
-->
<!-- optional npm version
[![NPM version](https://badge.fury.io/js/symbol-for.svg)](http://badge.fury.io/js/symbol-for)
-->
<!-- optional npm downloads
[![npm module downloads per month](http://img.shields.io/npm/dm/symbol-for.svg)](https://www.npmjs.org/package/symbol-for)
-->
<!-- optional dependency status
[![Dependency Status](https://david-dm.org/kaelzhang/node-symbol-for.svg)](https://david-dm.org/kaelzhang/node-symbol-for)
-->

# symbol-for

A silly ponyfill for `Symbol`, `Symbol.for` and `Symbol.keyFor`.

## Install

```sh
$ npm install symbol-for
```

## Usage

```js
import symbol from 'symbol-for'

symbol('a')
symbol.for('a')
symbol.keyFor(symbol.for('a'))  // 'a'
```

## License

MIT
