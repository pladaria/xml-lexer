const EventListener = function () {
    this._listeners = {};
};

EventListener.prototype.emit = function (event, arg) {
    if (Array.isArray(this._listeners[event])) {
        this._listeners[event].forEach(fn => fn(arg));
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
