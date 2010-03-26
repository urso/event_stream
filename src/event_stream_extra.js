
/**
 * adds a default value to be returned to an event stream.
 */
function $ESinject(/*val, event stream*/) {
    var current = arguments[0];
    var es = function() {
        var tmp = current;
        current = arguments[0];
        return tmp;
    }.stream();
    return es.apply(es, $A(arguments).slice(1));
}

/**
 * counts the number of times the given event stream has fired.
 */
var $ESpos = function(evt) {
    var i = 0;
    return function(){ return i++; }.stream(evt);
}

/**
 * computes the sum of all number values returned by another event stream.
 */
var $ESsum = function(evt) {
    var s = 0;
    return function(x) { s += x; return s; }.stream(evt);
};

/**
 * creates event stream, which always returns the same value if its input
 * event stream fires.
 */
var $ESconst = function(/*init, observers*/) {
    var init = arguments[0];
    return $ES(function() {
        return init;
    }).apply(this, $A(arguments).slice(1));
}

/**
 * Just for fun, this event stream returns the fibonaci value of
 * the number of events already fired by input event stream.
 */
var $ESfib = function(evt) {
    var v1 = 0, v2 = 1;
    return $ESinject(0, function(){
        var ret = v1 + v2;
        v1 = v2;
        v2 = ret;
        return ret;
    }.stream(evt));
}

