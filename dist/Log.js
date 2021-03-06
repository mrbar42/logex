(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            currentQueue[queueIndex].run();
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],4:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":3,"_process":2,"inherits":1}],5:[function(require,module,exports){
(function (process){
'use strict';

(function (root, factory) {
    'use strict';
    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.
    if (typeof define === 'function' && define.amd) {
        define(['util'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('util'), require('./dateFormat'));
    } else {
        console.error("This module needs to be build through browserify");
    }
}(this, function Logex(util, dateFormat) {
    //var process = process || {env:{}, platform: 'browser', argv: {}};

    // patch util color styles
    util.inspect.styles = {
        'special': '',
        'number': 'blue',
        'boolean': 'red',
        'undefined': 'grey',
        'null': 'bold',
        'string': 'green',
        'date': 'magenta',
        "name": 'white',
        'regexp': 'red'
    };

    // save usable reference to the actual console
    var original = {};
    if (typeof console != 'undefined' && console) {
        for (var p in console) {
            if (typeof console[p] == 'function') {
                original[p] = console[p].bind(console);
            }
            else {
                original[p] = console[p]
            }
        }
    }

    var LOG = {
        none: 'none',
        error: 'error',
        warn: 'warn',
        info: 'info',
        debug: 'debug',
        verbose: 'verbose'
    };
    var LEVELS = [
        'none',
        'error',
        'warn',
        'info',
        'debug',
        'verbose'
    ];

    var defaultLevel = LOG[process.env.LOG_LEVEL] || isDebugging() ? LOG.debug : LOG.info;

    var defaultOptions = {
        level: defaultLevel,
        levelColors: null,
        colors: true,
        inlineVars: false,
        format: '{LVL}:{CONTEXT}: {MSG}',
        utc: false,
        variables: Object.create(null),
        timers: Object.create(null),
        data: Object.create(null)
    };
    // system limitations
    var limitations = inspectEnv();

    var Logex = {
        instances: {},
        variables: {
            'PT': process.title && process.title.replace(/(?:^|.*\/|\/)([^\\\/]+)$/, "$1") || '',
            'PID': process.pid || '',
            'ENV': process.env.NODE_ENV !== 'production' ? 'production' : 'development',
            'MEM': process.memoryUsage && function () {
                return process.memoryUsage()
            } || ''
        },
        masks: {
            HOUR: "HH:MM:ss.l",
            TIME: "HH:MM:ss 'GMT'o '('Z')'",
            DATE: "dd/mmm/yyyy:HH:MM:ss o"
        },
        colors: {
            RESET: 0,
            BOLD: 1,
            UNDERLINE: 4,
            INVERSE: 7,
            NO_BOLD: 21,
            NO_UNDERLINE: 24,
            NO_INVERSE: 27,
            BLACK: 30,
            RED: 31,
            GREEN: 32,
            YELLOW: 33,
            BLUE: 34,
            MAGENTA: 35,
            CYAN: 36,
            LIGHT_GRAY: 37,
            DEFAULT: 39,
            GREY: 90,
            LIGHT_RED: 91,
            LIGHT_GREEN: 92,
            LIGHT_YELLOW: 93,
            LIGHT_BLUE: 94,
            LIGHT_MAGENTA: 95,
            LIGHT_CYAN: 96,
            WHITE: 97
        },
        levels: {
            none: 39,
            error: 31,
            warn: 33,
            info: 34,
            debug: 96,
            verbose: 37
        },
        formats: {
            'default': '{LVL}:{CONTEXT}: {MSG}',
            process: '{PT}/{PID} [{HOUR}] {LVL}:{CONTEXT}: {MSG}'
        },
        trace: original.trace && original.trace.bind(original) || function trace() {
            var args = Array.prototype.slice.call(arguments);
            var msg = '';
            while (args.length) {
                msg += args.shift() + ' '
            }
            try {
                throw new Error();
            } catch (err) {
                var stack = err.stack;
                stack = stack.replace(/.*\r?\n.*\r?\n.*/, 'Trace' + (msg ? ': ' + msg : ''));
                console.log(stack);
            }
        },
        inspect: inspect,
        format: util.format.bind(util),
        error: methodFactory('log', {level: LOG.error}),
        warn: methodFactory('log', {level: LOG.warn}),
        log: methodFactory('log', {level: LOG.info}),
        info: methodFactory('info', {level: LOG.info}),
        debug: methodFactory('info', {level: LOG.debug}),
        verbose: methodFactory('log', {level: LOG.verbose}),
        userWarn: methodFactory('log', {level: LOG.warn, skip: 1}),
        e: methodFactory('log', {level: LOG.error}),
        w: methodFactory('log', {level: LOG.warn}),
        l: methodFactory('log', {level: LOG.info}),
        i: methodFactory('info', {level: LOG.info}),
        d: methodFactory('info', {level: LOG.debug}),
        v: methodFactory('log', {level: LOG.verbose}),
        uw: methodFactory('log', {level: LOG.warn, skip: 1}),
        /**
         * @name Log#print
         * @param {string|object} [options]
         * @param {string} options.format
         * @param {number} options.skip
         * @param {boolean} options.noPrint
         * @param {boolean} options.depth
         * @param {boolean} options.inlineVars
         * @param {string} format
         * @returns {*}
         */
        print: function (options, format) {
            var args = Array.prototype.slice.call(arguments);
            if (typeof args[0] == 'string') {
                if (LOG[args[0]]) {
                    options = {level: args.shift()};
                }
                else {
                    options = {};
                }
            }
            else {
                options = args.shift();
            }

            options.inlineVars = true;
            options.format = '{MSG}';
            args.unshift(options);

            var msg = print.apply(this, args);
            if (!options.noPrint && msg) {
                original.log(msg);
            }
            return msg;
        },
        patch: function (target, methods) {
            if (methods && !Array.isArray(methods)) {
                return console.error('Logex: Invalid patch Methods. must be array.');
            }
            methods = methods || ['error', 'warn', 'log', 'info', 'debug'];
            methods.forEach(function (method) {
                if (typeof this[method] == 'function') {
                    target[method] = this[method].bind(this);
                }
                else if (this[method]) {
                    target[method] = this[method];
                }
                else {
                    original.log("Unknown method " + method);
                }
            }, this);
        }
    };

    function methodFactory(verb, options) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            args.unshift(options);
            var msg = print.apply(this, args);
            msg && original[verb](msg);
            return msg;
        };
    }

    var Log = function (id, options) {
        options = options || typeof id == 'object' && id || {};
        id = typeof id == 'string' && id || options.id || 'default';

        var instance = Logex.instances[id];
        if (!instance) {
            while (!id) {
                var temp = '__' + Math.random().toString(36).substr(2);
                if (!Logex.instances[temp]) {
                    id = temp;
                }
            }
            instance = Logex.instances[id] = function () {
                return Log.apply(null, arguments);
            };

            var level = options.level || defaultLevel;
            Object.defineProperties(instance, {
                'id': {value: id, writable: false},
                'level': {
                    get: function () {
                        return level
                    },
                    set: function (newLvl) {
                        if (LOG[newLvl]) {
                            level = LOG[newLvl]
                        }
                        else {
                            instance.uw("Unknown log level -> %s", newLvl);
                        }
                    }
                }
            });

            addBindProps(instance, Logex);
        }

        // parse options
        instance.options = merge(instance.options || defaultOptions, options);
        if (instance.options.level && instance.options.level != instance.level) {
            instance.level = instance.options.level;
        }
        delete instance.options.level;

        if (limitations.noColors) {
            instance.options.colors = false;
            instance.options.levelColors = false;
        }

        return instance
    };


    // initiate default logger
    var defaultInstance = Log();

    function print(opt) {
        var _this = this;
        var options = merge({}, this.options, opt);
        var state = {};
        var args = Array.prototype.slice.call(arguments);

        state.level = _this.level;
        if (opt) {
            LOG[opt.level] && (state.level = LOG[opt.level]);
        }
        args.shift();

        if (LEVELS.indexOf(_this.level) < LEVELS.indexOf(opt.level)) {
            return '';
        }

        var log = (options.colors ? '\x1b[0;39m' : '') + options.format;
        state.msg = '';
        var count = -1;
        while (args.length) {
            count++;
            var arg = args.shift();

            if (typeof arg == 'string') {
                if (options.inlineVars) {
                    arg = replaceVars.call(_this, options, state, arg, args);
                }

                var slots = (arg.match(/%[sdjifoOc]/g) || []).length;
                var spf = [arg];
                if (slots) {
                    spf = spf.concat(args.splice(0, slots));
                }
                state.msg += util.format.apply(util, spf) + ' ';
            }
            else {
                state.msg += inspect(arg, {colors: options.colors}) + ' ';
            }
        }
        log = replaceVars.call(_this, options, state, log, args);

        return options.colors ? log.replace(/\\x1b\[[^m]m/g, "") : log
    }

    function replaceVars(options, state, format, args) {
        var _this = this;
        var currentColors = [];
        return format
            .replace(/\{(\/)?([A-Z0-9_]+)(?: ([^}\\]+))?}/g,
            function (match, closing, name, params) {
                var temp;
                var data;
                switch (name) {
                    case 'ID':
                        return _this.id == 'default' ? '' : _this.id + params;
                    case 'LVL':
                    case 'LVL_ONE':
                    case 'LVL_LOWER':
                        temp = typeof options.levelColors == 'boolean' ? options.levelColors : options.colors;
                        data = name == 'LVL' ?
                            state.level.toUpperCase() :
                            name == 'LVL_ONE' ?
                                state.level.slice(0, 1).toUpperCase() :
                                state.level;

                        if (temp) {
                            return '\x1b[' + _this.levels[state.level] + 'm'
                                   + data
                                   + '\x1b[' + (currentColors[currentColors.length - 1] || '39') + 'm';
                        }

                        return data;
                    case 'MSG':
                        return state.msg;
                    case 'CONTEXT':
                        var skip = 6 + (parseInt(params) || 0) + (state.skip || 0);
                        try {
                            throw new Error();
                        }
                        catch (e) {
                            var stack = (e && e.stack || '').match(/((?:[^\r\n]+|\r(?!\n)(?:\n|$))+)/g);
                            temp = (stack && (stack[skip] || stack[stack.length]) || '')
                                .match(/((?:<[^>:]+>|[^ <\\\/(:]\.*?)+:\d+(?::\d+)?)\)?(?:\\n |$)/);
                            if (temp && temp[1]) {
                                state.context = temp[1];
                            }
                        }

                        state.context = state.context || '';

                        if (options.colors) {
                            return '\x1b[37m' + state.context + '\x1b[39m';
                        }
                        else {
                            return state.context;
                        }
                    case 'BUMP':
                        temp = {id: 'default'};
                        if (params) {
                            params = params.split(' ') || [];
                            temp.id = params[0] || 'default';
                            temp.flag = params[1];
                        }

                        var timer = options.timers[temp.id] = options.timers[temp.id] || {};
                        temp.diff = parseInt(+new Date - (timer.last||timer.start)) || 0;
                        temp.diff = '+' + (temp.diff > 1e4 ? (temp.diff / 1000).toFixed(2) + 's' : temp.diff + 'ms');

                        switch (temp.flag) {
                            case 'RESET':
                                timer.start = +new Date;
                                return '+' + (parseInt(+new Date - (timer.last||timer.start)) || 0) + 'ms';
                            case 'DELETE':
                                delete options.timers[temp.id];
                                return '+' + (parseInt(+new Date - (timer.last||timer.start)) || 0) + 'ms';
                            case 'END':
                                delete options.timers[temp.id];
                                return (parseInt(+new Date - timer.start) || 0) + 'ms';
                            default:
                                options.timers[temp.id].last = +new Date;
                                break;
                        }
                        return '';
                    case 'STAMP':
                        return +new Date;
                    case 'GMT':
                        return new Date().toGMTString();
                    case 'HOUR':
                    case 'TIME':
                        return _this.masks[name] && dateFormat(null, _this.masks[name], options.utc) || '';
                    case 'DATE':
                        return dateFormat(null, params || _this.masks[name], options.utc) || '';
                    case 'C':
                        if (options.colors) {
                            if (closing) {
                                currentColors.shift();
                                temp = currentColors[currentColors.length - 1] || '39';
                                return '\x1b[' + temp + 'm';
                            }
                            else {
                                if (params == 'LVL') {
                                    temp = _this.levels[state.level];
                                }
                                else {
                                    temp = _this.colors[params];
                                }

                                currentColors.unshift(temp);
                                return '\x1b[' + (temp || '39') + 'm';
                            }
                        }
                        return '';
                    default:
                        var VAR = name in _this && _this[name] || name in _this.variables && _this.variables[name]
                                  || undefined;
                        if (VAR === undefined) {
                            return match
                        }
                        else if (typeof VAR == 'function') {
                            var extraArgs;
                            if (params) {
                                temp = (params.match(/%/g) || []).length;
                                if (temp) {
                                    extraArgs = args.splice(0, temp);
                                }
                            }

                            var retVal;

                            try {
                                retVal = VAR.apply(_this, [state, params, !!closing].concat(extraArgs));
                            } catch (e) {
                                return '{' + name + ' ' + (e && (e.name + ' ' + e.message)) + '}';
                            }

                            if (retVal && /\{(\/)?([A-Z0-9_]+)(?: ([^}\\]+))?}/.test(retVal)) {
                                if (retVal.indexOf('{' + name) > -1) {
                                    original.warn('Logex: Variable handler may not return its own name. guess why... [%s]', name);
                                }
                                else {
                                    retVal = replaceVars.call(_this, options, state, retVal);
                                }
                            }

                            return typeof retVal == 'string' && retVal || inspect(retVal);
                        }
                        else {
                            return typeof VAR == 'string' && VAR || inspect(VAR);
                        }

                }
            });
    }

    function isDebugging() {
        if (process.env.NODE_ENV && process.env.NODE_ENV != 'production') {
            return true
        }
        if (process.features && process.features.debug) {
            return true
        }

        return typeof v8debug !== 'undefined';
    }

    function inspectEnv() {
        var limits = {};
        if (process.browser || !supportsColor()) {
            limits.noColors = true;
        }
        return limits
    }

    function inspect() {
        return util.inspect.apply(util, arguments)
            .replace(/^['"]|['"]$/g, '')
            .replace(/\\'/g, "'")
    }

    function supportsColor() {
        if ('FORCE_COLOR' in process.env) {
            return true;
        }

        if (hasFlag('no-color') ||
            hasFlag('no-colors') ||
            hasFlag('color=false')) {
            return false;
        }

        if (hasFlag('color') ||
            hasFlag('colors') ||
            hasFlag('color=true') ||
            hasFlag('color=always')) {
            return true;
        }

        if (process.platform === 'win32') {
            return true;
        }

        if ('COLORTERM' in process.env) {
            return true;
        }

        if (process.env.TERM === 'dumb') {
            return false;
        }
        return !process.env.TERM || /^screen|^xterm|^vt100|color|ansi|cygwin|linux/i.test(process.env.TERM);
    }

    function hasFlag(flag, argv) {
        argv = argv || process.argv;
        if (!argv) return false;
        var terminatorPos = argv.indexOf('--');
        var prefix = /^--/.test(flag) ? '' : '--';
        var pos = argv.indexOf(prefix + flag);

        return pos !== -1 && (terminatorPos !== -1 ? pos < terminatorPos : true);
    }

    function addBindProps(target, obj) {
        var props = {};

        for (var prop in obj) {
            if (!obj.hasOwnProperty(prop)) continue;
            props[prop] = {
                value: typeof obj[prop] == 'function' && obj[prop].bind(target) || obj[prop],
                enumerable: false
            }
        }

        Object.defineProperties(target, props);
    }

    function bytesToSize(input, precision) {
        var unit = ['', 'K', 'M', 'G', 'T', 'P'];
        var index = Math.floor(Math.log(input) / Math.log(1024));
        if (unit >= unit.length) return input + ' B';
        return (input / Math.pow(1024, index)).toFixed(precision) + ' ' + unit[index] + 'B'
    }
    function msToTime(input) {
        var unit = ['', 'K', 'M', 'G', 'T', 'P'];
        var index = Math.floor(Math.log(input) / Math.log(1024));
        if (unit >= unit.length) return input + ' B';
        return (input / Math.pow(1024, index)).toFixed(precision) + ' ' + unit[index] + 'B'
    }

    function merge() {
        var args = Array.prototype.slice.call(arguments);
        var base = args.shift();

        while (args.length) {
            var obj = args.shift();
            if (!obj) continue;
            Object.keys(obj).forEach(function (key) {
                if (obj[key] === undefined) return;
                base[key] = obj[key];
            })
        }

        return base
    }

    if (typeof window == 'object') {
        window.Log = defaultInstance;
    }
    return defaultInstance;
}));
}).call(this,require('_process'))
},{"./dateFormat":6,"_process":2,"util":4}],6:[function(require,module,exports){
/*
 * Date Format 1.2.3
 * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
 * MIT license
 *
 * Includes enhancements by Scott Trenda <scott.trenda.net>
 * and Kris Kowal <cixar.com/~kris.kowal/>
 *
 * Accepts a date, a mask, or a date and a mask.
 * Returns a formatted version of the given date.
 * The date defaults to the current date/time.
 * The mask defaults to dateFormat.masks.default.
 */

var dateFormat = function () {
    var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
        timezone = /\b([IPMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|.[A-Z]]{3}.|(?:GMT|UTC))\b/g,
        timezoneClip = /[^-+\dA-Z]/g,
        pad = function (val, len) {
            val = String(val);
            len = len || 2;
            while (val.length < len) val = "0" + val;
            return val;
        };

    // Regexes and supporting functions are cached through closure
    return function (date, mask, utc) {
        var dF = dateFormat;

        // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
        if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
            mask = date;
            date = undefined;
        }

        // Passing date through Date applies Date.parse, if necessary
        date = date ? new Date(date) : new Date;
        if (isNaN(date)) throw SyntaxError("invalid date");

        mask = String(dF.masks[mask] || mask || dF.masks["default"]);

        // Allow setting the utc argument via the mask
        if (mask.slice(0, 4) == "UTC:") {
            mask = mask.slice(4);
            utc = true;
        }

        var _ = utc ? "getUTC" : "get",
            d = date[_ + "Date"](),
            D = date[_ + "Day"](),
            m = date[_ + "Month"](),
            y = date[_ + "FullYear"](),
            H = date[_ + "Hours"](),
            M = date[_ + "Minutes"](),
            s = date[_ + "Seconds"](),
            L = date[_ + "Milliseconds"](),
            o = utc ? 0 : date.getTimezoneOffset(),
            flags = {
                d: d,
                dd: pad(d),
                ddd: dF.i18n.dayNames[D],
                dddd: dF.i18n.dayNames[D + 7],
                m: m + 1,
                mm: pad(m + 1),
                mmm: dF.i18n.monthNames[m],
                mmmm: dF.i18n.monthNames[m + 12],
                yy: String(y).slice(2),
                yyyy: y,
                h: H % 12 || 12,
                hh: pad(H % 12 || 12),
                H: H,
                HH: pad(H),
                M: M,
                MM: pad(M),
                s: s,
                ss: pad(s),
                l: pad(L, 3),
                L: pad(L > 99 ? Math.round(L / 10) : L),
                t: H < 12 ? "a" : "p",
                tt: H < 12 ? "am" : "pm",
                T: H < 12 ? "A" : "P",
                TT: H < 12 ? "AM" : "PM",
                Z: utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
                o: (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
                S: ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
            };

        return mask.replace(token, function ($0) {
            return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
        });
    };
}();

// Some common format strings
dateFormat.masks = {
    "default": "ddd mmm dd yyyy HH:MM:ss",
    shortDate: "m/d/yy",
    mediumDate: "mmm d, yyyy",
    longDate: "mmmm d, yyyy",
    fullDate: "dddd, mmmm d, yyyy",
    shortTime: "h:MM TT",
    mediumTime: "h:MM:ss TT",
    longTime: "h:MM:ss TT Z",
    isoDate: "yyyy-mm-dd",
    isoTime: "HH:MM:ss",
    isoDateTime: "yyyy-mm-dd'T'HH:MM:ss",
    isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
};

// Internationalization strings
dateFormat.i18n = {
    dayNames: [
        "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    ],
    monthNames: [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
    ]
};

module.exports = dateFormat;

},{}]},{},[5]);
