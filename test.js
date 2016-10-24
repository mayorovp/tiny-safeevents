require("babel-register");
var safeevents = require('./safeevents');
var assert = require('assert');

console.log("loaded");

it('should works', function () {
    var result = 0;
    safeevents.bind('A1', function () {
        safeevents.trigger('B1');
    });
    safeevents.bind('B1', function () {
        safeevents.trigger('C1');
    });
    safeevents.bind('C1', function () {
        result++;
    });
    safeevents.trigger('A1');

    assert.equal(1, result);
});

it('should detect', function () {
    var onloop;
    safeevents.bind('onloop', onloop = function() {
        throw "loop";
    });

    safeevents.bind('A2', function () {
        safeevents.trigger('B2');
    });
    safeevents.bind('B2', function () {
        safeevents.trigger('C2');
    });
    safeevents.bind('C2', function () {
        safeevents.trigger('A2');
    });

    try {
        safeevents.trigger('A2');
        assert.ok(false);
    } catch (ex) {
        assert.equal("loop", ex);
    } finally {
        safeevents.unbind('onloop', onloop);
    }
});

it('should detect async', function (done) {
    var r = false;
    safeevents.bind('onloop', function() {
        safeevents.unbind('onloop', arguments.callee);
        done();
        r = true;
    });

    safeevents.bind('A3', function () {
        if (r) return;
        setImmediate(() => safeevents.trigger('B3'));
    });
    safeevents.bind('B3', function () {
        if (r) return;
        setImmediate(() => safeevents.trigger('C3'));
    });
    safeevents.bind('C3', function () {
        if (r) return;
        setImmediate(() => safeevents.trigger('A3'));
    });

    safeevents.trigger('A3');
});
