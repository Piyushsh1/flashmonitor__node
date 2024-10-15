/*
 * JS
 */
; (() => {
  // Array prototype extends
  Array.groupObjectBy = (__array, __groupBy) => __array.reduce((__ac, a) => {
    // Const assignment.
    const _acFind = __ac.find(x => x[__groupBy] === a[__groupBy])

    // If key is found.
    if (_acFind) {
      // Push data.
      _acFind.LIST.push(a)
    } else {
      // Push new object to accumulator.
      __ac.push({ ...a, 'LIST': [a] })
    }

    // Return grouped version.
    return __ac
  }, [])
  Array.indexestr = (__arr, __val) => {
    // Local variable.
    let _i

    // Const assignment.
    const _indexes = []

    // Variable assignment.
    _i = -1

    /*
     * Consider doing only if __arr is arrays
     * nothing else.
     */
    if (__arr.constructor !== Array) return __arr

    // While indexes count
    while (-1 !== (_i = __arr.indexOf(__val, _i + 1))) {
      // Push index
      _indexes.push(_i)
    }

    // Return indexes
    return _indexes
  }

  // Object prototype extends
  Object.dot = __object => ({
    'get': (__path, __defaultValue) => __path.split('.').reduce((o, p) => (o ? o[p] : __defaultValue), __object),
    'set': (__path, __value) => __path.split('.').reduce((o, p, i) => (o[p] = (__path.split('.').length += i) ? __value : o[p] || {}), __object)
  })
  Object.depthOf = __object => {
    // Local variable.
    let _jamaica, _level

    // Variable assignment.
    _level = 1

    // Loop over object properties.
    for (_jamaica in __object) {
      // HasOwnProperty check.
      if (!__object.hasOwnProperty(_jamaica)) continue

      /*
       * Only continue if given object value
       * is typeof object.
       */
      if ('object' === typeof __object[_jamaica]) {
        // Const assignment.
        const depthBy = 1
        const _depth = Object.depthOf(__object[_jamaica]) + depthBy

        // Variable assignment.
        _level = Math.max(_depth, _level)
      }
    }

    // Return depth.
    return _level
  }
  Object.filterOut = (__obj, __predicate) => {
    // Local variable.
    let _key

    // Const assignment.
    const result = {}

    // Loop over object keys.
    for (_key in __obj) {
      // Conditional checking for objects.
      if (__obj.hasOwnProperty(_key) && __predicate(__obj[_key])) {
        // Push object value to new set.
        result[_key] = __obj[_key]
      }
    }

    // Return result
    return result
  }
  Object.WeightedRandomAlgorithm = __weights => {
    // Local variable.
    let i, j, table

    // Variable assignment.
    table = []

    /*
     * Loop over spec.
     * and generate table.
     */
    for (i in __weights) {
      /*
       * Push to table.
       * based on weight.
       */
      for (j = 0; j < __weights[i] * 10; j++) table.push(i)
    }

    // Return function.
    return () => table[Math.floor(Math.random() * table.length)]
  }
  Object.depthOf = __object => {
    // Local variable.
    let _jamaica, _level

    // Variable assignment.
    _level = 1

    // Loop over object properties.
    for (_jamaica in __object) {
      // HasOwnProperty check.
      if (!__object.hasOwnProperty(_jamaica)) continue

      /*
       * Only continue if given object value
       * is typeof object.
       */
      if ('object' === typeof __object[_jamaica]) {
        // Const assignment.
        const depthBy = 1
        const _depth = Object.depthOf(__object[_jamaica]) + depthBy

        // Variable assignment.
        _level = Math.max(_depth, _level)
      }
    }

    // Return depth.
    return _level
  }

  // String prototype extends
  String.toCapitalize = __string => {
    /*
     * If given string is not empty than use it
     * else prefer this.
     */
    if (__string && 'string' === typeof __string) return __string.toLowerCase().charAt(0).toUpperCase() + __string.toLowerCase().slice(1)

    // Return capitalize.
    return void 0
  }
  String.toCamelCase = __string => __string.replace(/(?:^\w|[A-Z]|\b\w|\s+)/gu, (__match, __index) => {
    // Return string on null match
    if (0 === Number(__match)) return ''

    // Return camelcase.
    return 0 === __index ? __match.toLowerCase() : __match.toUpperCase()
  })
  String.random = length => {
    // Local variable.
    let _result, i

    // Variable assignment.
    _result = ''

    // Const assignment.
    const _characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const _charactersLength = _characters.length

    // Loop over length and generate string.
    for (i = 0; i < length; i++) {
      // Concat random char at given random index.
      _result += _characters.charAt(Math.floor(Math.random() * _charactersLength))
    }

    // Return result.
    return _result
  }
  String.hexPad = (n, width, z) => {
    // Variable assignment.
    z = z || '0'
    n = `${n}`

    // Return padding.
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n
  }
  String.ipv6ToIpv4 = __string => (/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/u).exec(__string) ? (/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/u).exec(__string)[1] : __string
  String.extractIpFromString = __string => (/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/gu).exec(__string) ? (/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/gu).exec(__string)[1] : __string

  // Number object extend.
  Number.toFixedNumber = (__string, __digits, __base) => Math.round(__string * ((__base || 10) ** __digits || 2)) / ((__base || 10) ** __digits || 2)

  // Update big int.
  BigInt.prototype.toJSON = function() {
    return this.toString()
  }
})()
