xc.module.define("xc.createjs.EventDispatcher", function(exports) {

    /**
     * EventDispatcher提供了事件监听器和事件分派优先队列管理的功能。所有的{{#crossLink "DisplayObject"}}{{/crossLink}}类需要分派事件，某些工具像{{#crossLink "Ticker"}}{{/crossLink}}之类的也是。
     * 
     * 你也可以扩展这个类或者把它的那些方法混合到一个已存在的原型链内，或者通过EventDispatcher {{#crossLink "EventDispatcher/initialize"}}{{/crossLink}}方法来进行实例化。
     * <h4>样例</h4>
     * 把EventDispatcher的功能添加到“MyClass”类里面。
     * 
     *      EventDispatcher.initialize(MyClass.prototype);
     * 
     * 添加一个事件（详情请看{{#crossLink "EventDispatcher/addEventListener"}}{{/crossLink}}）
     * 
     *      instance.addEventListener("eventName", handlerMethod);
     *      function handlerMethod(event) {
     *          console.log(event.target + " Was Clicked");
     *      }
     *      
     * <b>维持适当的作用域</b><br />
     * 当你在一个类里面使用EventDispatcher，你可能需要使用<code>Function.bind</code>或其他努力去维持你的方法的作用域。注：Function.bind在一些旧版本的浏览器上不支持。
     * 
     *      instance.addEventListener("click", handleClick.bind(this));
     *      function handleClick(event) {
     *          console.log("Method called in scope: " + this);
     *      }
     *
     * 注：当前EventDispatcher并不支持事件的优先级别和冒泡。将来的版本可能会添加一个或多个这些特性的支持。
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
         * 添加指定的事件监听器。
         *
         * @method addEventListener
         * @param {String} type 事件类型名称。
         * @param {Function | Object} listener 一个带有事件响应方法的对象，或者一个函数，这个会在事件分派的时候被调用。
         * @return {Function | Object} 返回分派的监听器。
         */
        addEventListener: function(type, listener) {
            var listeners = this._listeners;
            if (!listeners) {
                listeners = this._listeners = {};
            } else {
                this.removeEventListener(type, listener);
            }
            var arr = listeners[type];
            if (!arr) {
                arr = listeners[type] = [];
            }
            arr.push(listener);
            return listener;
        },

        /**
         * 移除指定的事件监听器。
         *
         * @method removeEventListener
         * @param {String} type 事件类型名称。
         * @param {Function | Object} listener 函数或对象监听器。
         */
        removeEventListener: function(type, listener) {
            var listeners = this._listeners;
            if (!listeners) {
                return;
            }
            var arr = listeners[type];
            if (!arr) {
                return;
            }
            for ( var i = 0, l = arr.length; i < l; i++) {
                if (arr[i] == listener) {
                    if (l == 1) {
                        delete (listeners[type]);
                    } // 如果长度只有1，那么事件只有一个，直接删除就行了，检查可以更快速
                    else {
                        arr.splice(i, 1);
                    }
                    break;
                }
            }
        },

        /**
         * 移除指定类型或所有类型下的所有监听器。
         *
         * @method removeAllEventListeners
         * @param {String} [type] 事件的类型名称。如果没提供，所有类型的所有监听器会被移除掉。
         */
        removeAllEventListeners: function(type) {
            if (!type) {
                this._listeners = null;
            } else if (this._listeners) {
                delete (this._listeners[type]);
            }
        },

        /**
         * 分派指定的事件。
         *
         * @method dispatchEvent
         * @param {Object | String} eventObj 一个包含了“type”属性的对象，或者一个类型名称。如果使用类型名称，dispatchEvent会构造一个包含了“type”和“params”的通用事件对象。
         * @param {Object} [target] 此对象用于事件对象的目标属性，默认为分配对象。
         * @return {Boolean} 如果任意一个监听器返回true则返回true。
         */
        dispatchEvent: function(eventObj, target) {
            var ret = false, listeners = this._listeners;
            if (eventObj && listeners) {
                if (typeof eventObj == "string") {
                    eventObj = {
                        type: eventObj
                    };
                }
                eventObj.target = target || this;
                var arr = listeners[eventObj.type];
                if (!arr) {
                    return ret;
                }
                arr = arr.slice(); // 用来避免一些在分发事件过程中移除或添加项时的错误
                for ( var i = 0, l = arr.length; i < l; i++) {
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
         * 检查指定的事件类型上是否至少有一个监听器。
         *
         * @method hasEventListener
         * @param {String} type 事件名称。
         * @return {Boolean} 如果指定事件里面有监听器就返回true。
         */
        hasEventListener: function(type) {
            var listeners = this._listeners;
            return !!(listeners && listeners[type]);
        },

        /**
         * @method toString
         * @return {String} 实例的字符串描述。
         */
        toString: function() {
            return "[EventDispatcher]";
        }
    });

    /**
     * 注入EventDispatcher方法的静态的初始化工具
     *
     * @method initialize
     * @static
     * @param {Object} target 需要注入到EventDispatcher方法的目标对象。这个可以是一个实例或者是一个原型链。
     */
    EventDispatcher.initialize = function(target) {
        var p = EventDispatcher.prototype;
        target.addEventListener = p.addEventListener;
        target.removeEventListener = p.removeEventListener;
        target.removeAllEventListeners = p.removeAllEventListeners;
        target.hasEventListener = p.hasEventListener;
        target.dispatchEvent = p.dispatchEvent;
    };

    return EventDispatcher;

});