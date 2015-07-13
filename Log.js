'use strict';

(function (root, factory) {
    'use strict';
    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.
    if (typeof define === 'function' && define.amd) {
        define(['util', './lib/dateFormat'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('util'), require('./lib/dateFormat'));
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