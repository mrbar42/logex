'use strict';

exports.supportsColor = function () {
    // https://github.com/chalk/supports-color
    var hasFlag = exports.hasFlag;
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
};

exports.hasFlag = function (flag, argv) {
    // https://github.com/sindresorhus/has-flag
    argv = argv || process.argv;
    if (!argv) return false;
    var terminatorPos = argv.indexOf('--');
    var prefix = /^--/.test(flag) ? '' : '--';
    var pos = argv.indexOf(prefix + flag);

    return pos !== -1 && (terminatorPos !== -1 ? pos < terminatorPos : true);
};

exports.addBindProps = function (target, obj) {
    var props = {};

    for (var prop in obj) {
        if (!obj.hasOwnProperty(prop)) continue;
        props[prop] = {
            value: typeof obj[prop] == 'function' && obj[prop].bind(target) || obj[prop],
            enumerable: false
        }
    }

    Object.defineProperties(target, props);
};

exports.isDebugging = function () {
    if (process.env.NODE_ENV && process.env.NODE_ENV != 'production') {
        return true
    }
    if (process.features && process.features.debug) {
        return true
    }

    return typeof v8debug !== 'undefined';
};

exports.inspectEnv = function () {
    var limits = {};
    if (process.browser || !exports.supportsColor()) {
        limits.noColors = true;
    }
    return limits
};

exports.bytesToSize = function (input, precision) {
    var unit = ['', 'K', 'M', 'G', 'T', 'P'];
    var index = Math.floor(Math.log(input) / Math.log(1024));
    if (unit >= unit.length) return input + ' B';
    return (input / Math.pow(1024, index)).toFixed(precision) + ' ' + unit[index] + 'B'
};

exports.merge = function () {
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
};

exports.COLORS = {
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
};