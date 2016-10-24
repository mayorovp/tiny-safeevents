"use strict"

var events = new Map();
var callstack = [];

bind('onloop', (stack) => console && console.warn && console.warn("Loop detected! " + JSON.stringify(stack)));

function bind(event, handler) {
    var list = events.get(event);
    if (!list) events.set(event, list = []);
    list.push(handler);
}

function unbind(event, handler) {
    var list = events.get(event);
    if (!list) return;
    var index = list.indexOf(handler)
    if (index >= 0) return list.splice(index, 1);
}

function trigger(event, ...args) {
    var n = callstack.push(event);
    try {
        if (callstack.indexOf(event) !== n-1 && event !== 'onloop') trigger('onloop', callstack.slice());

        var list = events.get(event);
        if (list) list.forEach(handler => handler(...args));
    }
    finally {
        callstack.pop();
    }
}

function safely(callback) {
    var saved_stack = callstack.slice();
    saved_stack.push("(async)");

    return function () {
        var inner_saved_stack = callstack;
        callstack = saved_stack;
        try {
            var result = callback.apply(this, arguments);
        } finally {
            callstack = inner_saved_stack;
        }
        return result;
    }
}

var global = Function('return this')();
if (global) {
    ['setTimeout', 'setInterval', 'setImmediate', 'requestAnimationFrame'].forEach(name => {
        if (typeof global[name] === 'function')
        {
            var impl = global[name];
            global[name] = function (callback, ...args) {
                return impl(safely(callback), ...args)
            }
        }
    })
}

module.exports = {
    bind: bind,
    unbind: unbind,
    trigger: trigger,
    safely: safely,
};