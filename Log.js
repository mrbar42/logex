'use strict';

if (typeof exports !== 'object') {
    console.error("This module needs to be build through browserify");
}

var util = require('util');
var dateFormat = require('./lib/dateFormat');
var variables = require('./lib/variables');
var print = require('./lib/print');
var utils = require('./lib/utils');

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
        //noinspection JSUnfilteredForInLoop
        if (typeof console[p] == 'function') {
            //noinspection JSUnfilteredForInLoop
            original[p] = console[p].bind(console);
        }
        else {
            //noinspection JSUnfilteredForInLoop
            original[p] = console[p]
        }
    }
}

// system limitations
var limitations = utils.inspectEnv();

var LEVELS = {
    none: 'none',
        error: 'error',
        warn: 'warn',
        info: 'info',
        debug: 'debug',
        verbose: 'verbose'
};

/**
 * Global data. shared across all instances.
 * @name Logex
 */
var Logex = {
    instances: {},
    /** @memberOf Log */
    variables: variables,
    colors: utils.COLORS,
    console: original,
    levelsColors: {
        none: utils.COLORS.DEFAULT,
        error: utils.COLORS.RED,
        warn: utils.COLORS.YELLOW,
        info: utils.COLORS.BLUE,
        debug: utils.COLORS.LIGHT_CYAN,
        verbose: utils.COLORS.LIGHT_GRAY
    },
    /** @memberOf Log */
    LEVELS: LEVELS,
    ORDER: [
        'none',
        'error',
        'warn',
        'info',
        'debug',
        'verbose'
    ],
    formats: {
        process: '{PT}/{PID} [{HOUR}] {LVL}:{CONTEXT}: {MSG}'
    },
    /** @memberOf Log */
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
    /** @memberOf Log */
    inspect: function () {
        return util.inspect.apply(util, arguments)
            .replace(/^['"]|['"]$/g, '')
            .replace(/\\'/g, "'")
    },
    /** @memberOf Log */
    format: util.format.bind(util),
    dateFormat: dateFormat,
    /** @memberOf Log */
    error: methodFactory('log', {level: LEVELS.error}),
    /** @memberOf Log */
    warn: methodFactory('log', {level: LEVELS.warn}),
    /** @memberOf Log */
    log: methodFactory('log', {level: LEVELS.info}),
    /** @memberOf Log */
    info: methodFactory('info', {level: LEVELS.info}),
    /** @memberOf Log */
    debug: methodFactory('info', {level: LEVELS.debug}),
    /** @memberOf Log */
    verbose: methodFactory('log', {level: LEVELS.verbose}),
    /** @memberOf Log */
    userWarn: methodFactory('log', {level: LEVELS.warn, skip: 1}),
    /** @memberOf Log */
    e: methodFactory('log', {level: LEVELS.error}),
    /** @memberOf Log */
    w: methodFactory('log', {level: LEVELS.warn}),
    /** @memberOf Log */
    l: methodFactory('log', {level: LEVELS.info}),
    /** @memberOf Log */
    i: methodFactory('info', {level: LEVELS.info}),
    /** @memberOf Log */
    d: methodFactory('info', {level: LEVELS.debug}),
    /** @memberOf Log */
    v: methodFactory('log', {level: LEVELS.verbose}),
    /** @memberOf Log */
    uw: methodFactory('log', {level: LEVELS.warn, skip: 1}),
    /**
     * @name Log#print
     * @param {string|object} [options]
     * @param {string} options.format - define custom format
     * @param {number} options.skip - invokers to skip up the stack
     * @param {boolean} options.noPrint - don't print, just return
     * @param {boolean} options.depth - how many level into an object should be printed
     * @param {string} format
     * @returns {*}
     */
    print: function (options, format) {
        var args = Array.prototype.slice.call(arguments);
        if (typeof args[0] == 'string') {
            if (Logex.LEVELS[args[0]]) {
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
    /** @memberOf Log */
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

/** @namespace process.env.LOG_LEVEL */
var defaultLevel = Logex.LEVELS[process.env.LOG_LEVEL]
                   || utils.isDebugging() ? Logex.LEVELS.debug : Logex.LEVELS.info;

/** @name Log#options */
var defaultOptions = {
    level: defaultLevel,
    levelColors: null,
    colors: true,
    inlineVars: false,
    format: '{LVL}:{CONTEXT}: {ID  }{MSG}',
    utc: false,
    timers: Object.create(null)
};

/**
 * Create a Logex instance or return existing one
 * @name Log
 * @param {string|object} [id='default']
 * @param {object} [options]
 * @returns {Log}
 */
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
            'data': {value: Object.create(null)},
            'level': {
                get: function () {
                    return level
                },
                set: function (newLvl) {
                    if (this.LEVELS[newLvl]) {
                        level = this.LEVELS[newLvl]
                    }
                    else {
                        instance.uw("Unknown log level -> %s", newLvl);
                    }
                }
            }
        });

        utils.addBindProps(instance, Logex);
    }

    // parse options
    instance.options = utils.merge(instance.options || defaultOptions, options);
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


// init default instance
var defaultInstance = Log();

if (typeof window == 'object') {
    window.Log = defaultInstance;
}

module.exports = defaultInstance;