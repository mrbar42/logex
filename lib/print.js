'use strict';

module.exports = function print(opt) {
    var _this = this;
    var options = merge({}, this.options, opt);
    var state = {
        options: options
    };
    var args = Array.prototype.slice.call(arguments);

    state.level = _this.level;
    if (opt) {
        _this.LEVELS[opt.level] && (state.level = opt.level);
    }
    args.shift();

    if (_this.ORDER.indexOf(_this.level) < _this.ORDER.indexOf(opt.level)) {
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
                arg = replaceVars.call(_this, state, arg, args);
            }

            var slots = (arg.match(/%[sdjifoOc]/g) || []).length;
            var spf = [arg];
            if (slots) {
                spf = spf.concat(args.splice(0, slots));
            }
            state.msg += _this.format.apply(undefined, spf) + ' ';
        }
        else if (arg instanceof Error) {
            state.msg += arg.stack + ' ';
        }
        else {
            state.msg += _this.inspect(arg, {colors: options.colors}) + ' ';
        }
    }
    log = replaceVars.call(_this, state, log, args);

    log = log.replace(/^\s+/, '');

    return options.colors ? log.replace(/\\x1b\[[^m]m/g, "") : log
};

function replaceVars(state, format, args) {
    var _this = this;
    state.currentColors = [];
    return format
        .replace(/\{(\/)?([A-Z0-9_]+)(?: ([^}\\]+))?}/g,
        function (match, closing, name, params) {
            var VAR = name in _this && _this[name] || name in _this.variables && _this.variables[name]
                      || undefined;

            if (VAR === undefined) {
                // unknown VAR
                return match
            }

            if (typeof VAR == 'function') {
                var extraArgs;
                if (params) {
                    var count = (params.match(/%/g) || []).length;
                    if (count) {
                        extraArgs = args.splice(0, count);
                        params = params.replace(/%/g, '');
                    }
                }

                var retVal;

                try {
                    state.name = name;
                    retVal = VAR.apply(_this, [state, params, !!closing].concat(extraArgs));
                } catch (e) {
                    return '{' + name + ' ' + (e && (e.name + ' ' + e.message)) + '}';
                }

                if (retVal && /\{(\/)?([A-Z0-9_]+)(?: ([^}\\]+))?}/.test(retVal)) {
                    if (retVal.indexOf('{' + name) > -1) {
                        _this.console.warn('Logex: Variable handler may not return its own variable. guess why... [%s]', name);
                    }
                    else {
                        retVal = replaceVars.call(_this, state, retVal);
                    }
                }

                return typeof retVal == 'string' && retVal || _this.inspect(retVal);
            }
            else {
                return typeof VAR == 'string' && VAR || _this.inspect(VAR);
            }
        });
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
