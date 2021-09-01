"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.perfy = void 0;
var PerfyItem = /** @class */ (function () {
    function PerfyItem(name, autoDestroy) {
        if (autoDestroy === void 0) { autoDestroy = true; }
        this.name = name;
        this.autoDestroy = autoDestroy;
        this.time = {
            start: null,
            end: null,
        };
        this.utc = {
            start: null,
            end: null,
        };
    }
    PerfyItem.prototype.reset = function () {
        this.time = {
            start: null,
            end: null,
        };
        this.utc = {
            start: null,
            end: null,
        };
        this.result = null;
    };
    PerfyItem.prototype.start = function () {
        this.reset();
        this.time.start = process.hrtime();
        this.utc.start = Date.now();
    };
    PerfyItem.prototype.end = function () {
        var _a;
        if (!this.time.start) {
            throw new Error('start() should be called first!');
        }
        this.time.end = process.hrtime(this.time.start);
        this.utc.end = Date.now();
        var name = (_a = this.name) !== null && _a !== void 0 ? _a : '';
        var seconds = this.time.end[0];
        var nanoseconds = this.time.end[1];
        // divide by a million to convert nanoseconds to milliseconds
        var milliseconds = this.time.end[1] / 1000000;
        var startTime = this.utc.start;
        var endTime = this.utc.end;
        var fullMilliseconds = Number((seconds * 1000 + milliseconds).toFixed(3));
        var time = Number((fullMilliseconds / 1000).toFixed(3));
        var fullSeconds = time;
        var fullNanoseconds = seconds * 1000 * 1000000 + nanoseconds;
        var n = this.name ? this.name + ': ' : '';
        var summary = n + time + ' sec.';
        this.result = {
            name: name,
            seconds: seconds,
            nanoseconds: nanoseconds,
            milliseconds: milliseconds,
            startTime: startTime,
            endTime: endTime,
            fullMilliseconds: fullMilliseconds,
            time: time,
            fullNanoseconds: fullNanoseconds,
            fullSeconds: fullSeconds,
            summary: summary,
        };
        return this.result;
    };
    return PerfyItem;
}());
var ErrCodes;
(function (ErrCodes) {
    ErrCodes["NAME"] = "Performance instance name required!";
    ErrCodes["NO_ITEM"] = "No performance instance with name: ";
    ErrCodes["CALLBACK"] = "Callback is not a function!";
})(ErrCodes || (ErrCodes = {}));
var Perfy = /** @class */ (function () {
    function Perfy() {
        this.perfList = {};
    }
    Perfy.prototype.start = function (name, autoDestroy) {
        if (autoDestroy === void 0) { autoDestroy = true; }
        if (!name) {
            throw new Error(ErrCodes.NAME);
        }
        this.perfList[name] = new PerfyItem(name, autoDestroy);
        this.perfList[name].start();
        return this;
    };
    Perfy.prototype.end = function (name) {
        if (!name) {
            throw new Error(ErrCodes.NAME);
        }
        var p = this.perfList[name];
        if (!p) {
            throw new Error(ErrCodes.NO_ITEM + ": " + name);
        }
        // if already ended and has result, return
        if (p.result) {
            return p.result;
        }
        var result = p.end();
        if (p.autoDestroy) {
            delete this.perfList[name];
        }
        return result;
    };
    Perfy.prototype.result = function (name) {
        if (!name) {
            throw new Error(ErrCodes.NAME);
        }
        var p = this.perfList[name];
        if (!p || !p.result) {
            return null;
        }
        return p.result;
    };
    Perfy.prototype.exists = function (name) {
        if (!name) {
            throw new Error(ErrCodes.NAME);
        }
        return !!this.perfList[name];
    };
    Perfy.prototype.names = function () {
        return Object.keys(this.perfList);
    };
    Perfy.prototype.count = function () {
        return this.names().length;
    };
    Perfy.prototype.destroy = function (name) {
        if (!name) {
            throw new Error(ErrCodes.NAME);
        }
        if (this.perfList[name]) {
            delete this.perfList[name];
        }
        return this;
    };
    Perfy.prototype.destroyAll = function () {
        this.perfList = {};
        return this;
    };
    Perfy.prototype.exec = function (_a) {
        var _this = this;
        var fn = _a.fn, _b = _a.name, name = _b === void 0 ? '' : _b;
        var p;
        if (name) {
            this.perfList[name] = new PerfyItem(name, true);
            p = this.perfList[name];
        }
        else {
            p = new PerfyItem('');
        }
        var done = function () {
            var result = p.end();
            if (name && p.autoDestroy) {
                delete _this.perfList[name];
            }
            return result;
        };
        p.start();
        if (fn.length > 0) {
            fn(done);
            return this;
        }
        fn();
        return done();
    };
    Perfy.instance = new Perfy();
    return Perfy;
}());
exports.perfy = new Perfy();
