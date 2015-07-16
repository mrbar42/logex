'use strict';

exports = module.exports = {
    'PT': process.title && process.title.replace(/(?:^|.*\/|\/)([^\\\/]+)$/, "$1") || '',
    'PID': process.pid || '',
    'ENV': process.env.NODE_ENV !== 'production' ? 'production' : 'development'
};

exports.LVL = level;
exports.LVL_ONE = level;
exports.LVL_LOWER = level;
function level(state, params, closing) {
    var _this = this;
    var options = state.options;
    var temp = typeof options.levelColors == 'boolean' ? options.levelColors : options.colors;
    var data = state.name == 'LVL' ?
        state.level.toUpperCase() :
        state.name == 'LVL_ONE' ?
            state.level.slice(0, 1).toUpperCase() :
            state.level;

    if (temp) {
        return '\x1b[' + _this.levelsColors[state.level] + 'm'
               + data
               + '\x1b[' + (state.currentColors[state.currentColors.length - 1] || '39') + 'm';
    }

    return data;
}

exports.MEM = function () {
    if (!process.memoryUsage) return '';

    return process.memoryUsage()
};

exports.BUMP = function bump(state, params) {
    var options = state.options;
    var temp = {id: 'default'};
    if (params) {
        params = params.split(' ') || [];
        temp.id = params[0] && !/^(START|TOTAL|RESET|CLEAR|END)(_TOTAL)?$/.test(params[0]) && params[0] || 'default';
        temp.flag = params[1] || params[0];
    }

    var now = +new Date;

    var timer = options.timers[temp.id] = options.timers[temp.id] || {start: now};
    temp.diff = parseInt(now - timer.last) || 0;
    temp.diff = '+' + (temp.diff > 1e4 ? (temp.diff / 1000).toFixed(2) + 's' : temp.diff + 'ms');
    temp.total = parseInt(now - timer.start) || 0;
    temp.total = (temp.total > 1e4 ? (temp.total / 1000).toFixed(2) + 's' : temp.total + 'ms');

    timer.last = now;
    switch (temp.flag) {
        case 'START':
            timer.start = now;
            return '0ms';
        case 'TOTAL':
            return temp.total;
        case 'RESET':
            timer.start = now;
            return temp.diff;
        case 'CLEAR':
            delete options.timers[temp.id];
            return temp.diff;
        case 'END':
            delete options.timers[temp.id];
            return temp.diff;
        case 'RESET_TOTAL':
            timer.start = now;
            return temp.total;
        case 'CLEAR_TOTAL':
            delete options.timers[temp.id];
            return temp.total;
        case 'END_TOTAL':
            delete options.timers[temp.id];
            return temp.total;
        default:
            return temp.diff;
    }
};

exports.ID = function (state, params) {
    return this.id == 'default' ? '' : this.id + params;
};

exports.MSG = function (state) {
    return state.msg;
};

exports.CONTEXT = function (state, params) {
    var options = state.options;
    var skip = 7 + (parseInt(params) || 0) + (options.skip || 0);
    try {
        throw new Error();
    }
    catch (e) {
        var stack = (e && e.stack || '').match(/((?:[^\r\n]+|\r(?!\n)(?:\n|$))+)/g);
        var temp = (stack && (stack[skip] || stack[stack.length]) || '')
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
};

exports.STAMP = function () {
    return +new Date;
};

exports.UTC = function () {
    return new Date().toGMTString()
};

exports.HOUR = function (state) {
    return this.dateFormat(null, 'HH:MM:ss.l', state.options.utc) || '';
};

exports.TIME = function (state) {
    return this.dateFormat(null, "HH:MM:ss 'GMT'o '('Z')'", state.options.utc) || '';
};

exports.DATE = function (state, params) {
    return this.dateFormat(null, params || 'dd/mmm/yyyy:HH:MM:ss o', state.options.utc) || '';
};

exports.C = function (state, params, closing) {
    var options = state.options;
    if (options.colors) {
        if (closing) {
            state.currentColors.shift();
            var temp = state.currentColors[state.currentColors.length - 1] || '39';
            return '\x1b[' + temp + 'm';
        }
        else {
            if (params == 'LVL') {
                temp = this.levelsColors[state.level];
            }
            else {
                temp = this.colors[params];
            }

            state.currentColors.unshift(temp);
            return '\x1b[' + (temp || '39') + 'm';
        }
    }
    return '';
};

