/**
 * Quick and dirty implementation of an EventEmitter
 *
 * This should work in any platform (node, browser, react native)
 */

'use strict';

let immediate = null;

if (typeof setImmediate === 'function') {
    immediate = setImmediate;
} else if (typeof Promise === 'function' && typeof Promise.resolve === 'function') {
    immediate = (fn) => Promise.resolve().then(fn);
} else {
    immediate = (fn) => setTimeout(fn, 0);
}

const EventListener = function () {
    this._listeners = {};
};

EventListener.prototype.emit = function (event, arg) {
    if (Array.isArray(this._listeners[event])) {
        this._listeners[event].forEach(fn => immediate(() => fn(arg)));
    }
};

EventListener.prototype.addListener = function (event, fn) {
    if (Array.isArray(this._listeners[event])) {
        if (!this._listeners[event].some(fn)) {
            this._listeners[event].push(fn);
        }
    } else {
        this._listeners[event] = [fn];
    }
};

EventListener.prototype.on = EventListener.prototype.addListener;

EventListener.prototype.removeListener = function (event, fn) {
    if (Array.isArray(this._listeners[event])) {
        this._listeners[event] = this._listeners[event].filter(f => f !== fn);
    }
};

module.exports = EventListener;
