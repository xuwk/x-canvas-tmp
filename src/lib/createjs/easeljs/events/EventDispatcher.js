xc.module.define("xc.createjs.EventDispatcher", function(exports) {

  /**
   * The EventDispatcher provides methods for managing prioritized queues of event listeners and dispatching events.
   * All {{#crossLink "DisplayObject"}}{{/crossLink}} classes dispatch events, as well as some of the utilities like
   * {{#crossLink "Ticker"}}{{/crossLink}}.
   *
   * Add an event (see {{#crossLink "EventDispatcher/addEventListener"}}{{/crossLink}}).
   *
   *     instance.addEventListener("eventName", handlerMethod);
   *     function handlerMethod(event) {
   *         console.log(event.target + " Was Clicked");
   *     }
   *
   * <b>Maintaining proper scope</b><br/>
   * When using EventDispatcher in a class, you may need to use <code>Function.bind</code> or another approach to
   * maintain you method scope. Note that Function.bind is not supported in some older browsers.
   *
   *     instance.addEventListener("click", handleClick.bind(this));
   *     function handleClick(event) {
   *         console.log("Method called in scope: " + this);
   *     }
   *
   * Please note that currently, EventDispatcher does not support event priority or bubbling. Future versions may add
   * support for one or both of these features.
   *
   * @class EventDispatcher
   * @constructor
   */
  var EventDispatcher = xc.class.create({

    /**
     * @protected
     * @property _listeners
     * @type Object
     */
    _listeners: null,

    /**
     * Adds the specified event listener.
     *
     * @method addEventListener
     * @param {String} type The string type of the event.
     * @param {Function | Object} listener An object with a handleEvent method, or a function that will be called when
     *  the event is dispatched.
     * @return {Function | Object} Returns the listener for chaining or assignment.
     */
    addEventListener: function(type, listener) {
      var listeners = this._listeners;
      if (!listeners) { listeners = this._listeners = {}; }
      else { this.removeEventListener(type, listener); }
      var arr = listeners[type];
      if (!arr) { arr = listeners[type] = []; }
      arr.push(listener);
      return listener;
    },

    /**
     * Removes the specified event listener.
     *
     * @method removeEventListener
     * @param {String} type The string type of the event.
     * @param {Function | Object} listener The listener function or object.
     */
    removeEventListener: function(type, listener) {
      var listeners = this._listeners;
      if (!listeners) { return; }
      var arr = listeners[type];
      if (!arr) { return; }
      for (var i = 0, l = arr.length; i < l; i++) {
        if (arr[i] == listener) {
          if (l == 1) { delete(listeners[type]); } // allows for faster checks.
          else { arr.splice(i, 1); }
          break;
        }
      }
    },

    /**
     * Removes all listeners for the specified type, or all listeners of all types.
     *
     * @method removeAllEventListeners
     * @param {String} [type] The string type of the event. If omitted, all listeners for all types will be removed.
     */
    removeAllEventListeners: function(type) {
      if (!type) { this._listeners = null; }
      else if (this._listeners) { delete(this._listeners[type]); }
    },

    /**
     * Dispatches the specified event.
     *
     * @method dispatchEvent
     * @param {Object | String} eventObj An object with a "type" property, or a string type. If a string is used,
     *  dispatchEvent will contstruct a generic event object with "type" and "params" properties.
     * @param {Object} [target] The object to use as the target property of the event object. This will default to the
     *  dispatching object.
     * @return {Boolean} Returns true if any listener returned true.
     */
    dispatchEvent: function(eventObj, target) {
      var ret = false, listeners = this._listeners;
      if (eventObj && listeners) {
        if (typeof eventObj == "string") { eventObj = {type: eventObj}; }
        eventObj.target = target || this;
        var arr = listeners[eventObj.type];
        if (!arr) { return ret; }
        arr = arr.slice(); // to avoid issues with items being removed or added during the dispatch
        for (var i = 0, l = arr.length; i < l; i++) {
          var o = arr[i];
          if (o instanceof Function) {
            ret = ret || o.apply(null, [eventObj]);
          } else if (o.handleEvent) {
            ret = ret || o.handleEvent(eventObj);
          }
        }
      }
      return !!ret;
    },

    /**
     * Indicates whether there is at least one listener for the specified event type.
     *
     * @method hasEventListener
     * @param {String} type The string type of the event.
     * @return {Boolean} Returns true if there is at least one listener for the specified event.
     */
    hasEventListener: function(type) {
      var listeners = this._listeners;
      return !!(listeners && listeners[type]);
    },

    /**
     * @method toString
     * @return {String} a string representation of the instance.
     */
    toString: function() {
      return "[EventDispatcher]";
    }
  });

  /**
   * Static initializer to mix in EventDispatcher methods.
   *
   * @method initialize
   * @static
   * @param {Object} target The target object to inject EventDispatcher methods into. This can be an instance or a
   *  prototype.
   */
  EventDispatcher.initialize = function(target) {
    var p = EventDispatcher.prototype;
    target.addEventListener = p.addEventListener;
    target.removeEventListener = p.removeEventListener;
    target.removeAllEventListeners = p.removeAllEventListeners;
    target.hasEventListener = p.hasEventListener;
    target.dispatchEvent = p.dispatchEvent;
  };

  return  EventDispatcher;

});