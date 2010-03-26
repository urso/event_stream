//

(function () {

    // database of available plugins
    // Each plugin entry must be an object with the following fields:
    //
    // [tagName] : tagName is a tag its string representation
    //          if the plugin is to be applied to an HTML Element
    //
    // [pred]: a function return true, if plugin will be applied to
    //         input value
    //
    // event (if input plugin): event to listen for
    //
    // [tans] (if input plugin): function to be applied on object to compute a
    //                           value being forwarded in the event stream.
    //                           
    // callback (if output plugin): a function which will update the target
    //                              given an input value
    //
    //
    var inPlugins = []; /// input values plugins
    var outPlugins = []; /// output values plugins
    
    function findPlugin(obj, plugins) {
        for (var i = plugins.length; i--;) { //search from back so
                                          //users can easily overwrite
                                          //existing ones
            
            if (obj.tagName === undefined ) {
                if (plugins[i].tagName || 
                    (plugins[i].pred && !plugins[i].pred(obj))) 
                {
                    continue;
                }
            } else {
                if(plugins[i].tagName) {
                    if (obj.tagName.toUpperCase() !== plugins[i].tagName || 
                        (plugins[i].pred && !plugins[i].pred(obj))) {
                        continue;
                    }
                } else if (plugins[i].pred && !plugins[i].pred(obj)) {
                    continue;
                }
            }
            
            return plugins[i];
        }
        return null;
    }

    /** @scope _global_ */
    /**
     * adds an event stream input value plugin
     *
     * @function
     */
    this.addEventStreamInputPlugin = function (plugin) {
        inPlugins.push(plugin);
    };

    /** @scope _global_ */
    /**
     * adds an event stream output value plugin
     */
    this.addEventStreamOutputPlugin = function (plugin) {
        outPlugins.push(plugin);
    };
    
    function prepare(objs) {
        return objs.map(function (obj) {
                if (obj instanceof Array && obj.length > 1) { 
                    return obj; 
                }
                
                var o = obj instanceof Array ? obj[0] : obj;
                var p = findPlugin(o, inPlugins);
                if (!p) {
                    throw {message: "no stanard behavior for object",
                           object: o};
                }
                var value = p.toobj ? p.toobj(o) : o;
                var event = p.event instanceof Function ? p.event(o) : p.event;
                return [value, event, p.trans];
            });
    }
    
    function findOutPluginFn (obj) {
        var p = findPlugin(obj, outPlugins);
        return p ? p.callback.curry(obj) : null;
    }

    function defaultCallback(cont, evt, value) {
        cont(value, evt);
    }

    function mkCallback(contFn) {
        return function (evt) {
            var args = arguments.length == 1 ? arguments[0] : $A(arguments);
            var vals = zip(function (obj, trans) {
                var tmp = trans ? trans(obj, args) : obj;
                return tmp;
            }, this.objs, this.transformers);

            contFn(function(newValue, evt){
                var ret = this.fn.apply(evt, newValue);
                this.value = ret === undefined ? newValue : ret;

                this.fireEvent('observe', evt,  this.value);
            }.bind(this), evt, vals);

            return true;
        }
    }

    /** @scope _global_ */
    /**
     * An event Stream
     *
     * @param fn object or function to call when any input object sends an
     *           event.
     * @param objsAndEvents array of input objects (and optional event information)
     *                      
     * @param [callbackFn] callback function to be called when event arived.
     *                     this function must meet the following protocol:
     *
     *                     function(cont, evt, value) with
     *
     *                     cont: event stream continuation
     *                     evt: String for received event
     *                     value: the current event stream element's value
     *
     *                     The callback function must call "cont(newValue, evt)"
     *                     any time later, when apropriate.
     *
     * @class
     */
    var EventStream = function (fn, objsAndEvents, callbackFn) {
        this.$events = {}; // just to satisfy Events() prototype

        this.objsAndEvents = prepare(objsAndEvents);
        this.objs = this.objsAndEvents.map($aref(0));
        
        this.fn = typeof fn === 'function' ? fn : findOutPluginFn(fn, outPlugins);
        if (!fn) {
            throw new Error('unsupported event stream target');
        }

        this.transformers = this.objsAndEvents.map(function (x) {
                if (x.length > 2 && x[2]) {
                    return x[2];
                }
                return null;
            });

        this.callback = mkCallback(callbackFn || defaultCallback).bind(this);
    };


    this.EventStream = EventStream;
    inPlugins.push( { pred: function(x) { return x instanceof EventStream; },
                      event: 'observe',
                      trans: function(obj, evt) { return obj.value; }
               });
}());

EventStream.prototype = new Events();

EventStream.prototype.fireEvent = function (type, values, evt) {
    var fns = this.$events[type];
    if (!fns) {
        return this;
    }

    fns.forEach(function (fn) {
        setTimeout(function () { fn(values, evt); }, 0);
    });
};

EventStream.prototype.start = function(){
    this.objsAndEvents.map(function (x) {
        var obj = x[0];
        var evt = x[1];
        obj.addEvent(evt, this.callback);
    }.bind(this));
};

EventStream.prototype.stop = function () {
    this.objsAndEvents.forEach(function (x) {
        var obj = x[0];
        var evt = x[1];
        obj.removeEvent(evt, this.callback);
    }.bind(this));
};

EventStream.prototype.destroy = function() {
    this.stop();
    this.objs = [];
    delete this;
}

EventStream.prototype.getObjects = function () {
    return this.objs;
};


function isEventStream(o) {
    return o instanceof EventStream;
}
    
/**
 * transforms a function into an event stream.
 */
function $ES(fun) {
    return function (init, objs) {
        if(typeof init === 'boolean') {
            var initialize = init;
            var objects = $A(arguments).slice(1);
        } else {
            var initialize = true;
            var objects = $A(arguments);
        }

        var es = new EventStream(fun, objects);

        es.start();
        if (initialize) { es.callback(null); }
        return es;
    };
}

function $ESRequest(opt) {
    var request = opt instanceof Request ? opt : new Request(opt);

    return function (init, objs) {
        if(typeof init === 'boolean') {
            var initialize = init;
            var objects = $A(arguments).slice(1);
        } else {
            var initialize = true;
            var objects = $A(arguments);
        }

        var callback = function (cont, evt, value) {
            var onSuccess, onFailure, onCancel;

            function cleanup() {
                onSuccess.destroy();
                onFailure.destroy();
                onCancel.destroy();
            }

            onSuccess = function (v) {
                cleanup();

                cont(v, evt);
            }.stream(false, [request, 'onSuccess', function(obj, ret){
                return ret;
            }]);

            onFailure = function(v) {
                cleanup();

                cont(v, evt);
            }.stream(false, [request, 'onFailure', function(obj, ret){
                return ret;
            }]);

            onCancel = function() {
                cleanup();
            }.stream(false, [request, 'onCancel']);

            request.send(value);
        }

        var es = new EventStream($id, objects, callback);

        es.start();
        if (initialize) { es.callback(null); }
        return es;
    }
}

/**
 * returns a function accepting a variable number of
 * event streams, but only the value of the first stream fireing and event
 * is given to output stream. 
 *
 * @param stream output event stream target
 */
function $ESoneOf(stream) {
    return function(){
        var ret = new Array(arguments.length);
        for(var i = 0; i < arguments.length; i++) {
            ret[i] = stream(false, arguments[i]);
        }
        return ret;
    };
}

Function.prototype.stream = function() {
        var tmp = $ES(this);
        return arguments.length ?  tmp.apply(this, arguments) : tmp;
}

Element.prototype.stream = Function.prototype.stream;

Request.prototype.stream = function() {
    var tmp = $ESRequest(this);
    return arguments.length ? tmp.apply(this, arguments) : tmp;
}

