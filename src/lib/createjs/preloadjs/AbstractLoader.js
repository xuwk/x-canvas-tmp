/**
 * 基础加载器，它定义了所有通用的回调方法和事件。所有加载器继承这个类，包括{{#crossLink "LoadQueue"}}{{/crossLink}}。
 * 
 * @class AbstractLoader
 * @uses EventDispatcher
 */
xc.module.define("xc.createjs.AbstractLoader", function(exports) {
    var EventDispatcher = xc.module.require("xc.createjs.EventDispatcher");

    var AbstractLoader = EventDispatcher.extend({
        /**
         * 初始化加载器。这个被构造方法调用。
         * 
         * @method initialize
         * @private
         */
        initialize: function() {
        },

        /**
         * 在整体进度发生改变时触发的事件。
         * 
         * @event progress
         * @param {Object} target 分发事件的对象。
         * @param {String} type 事件类型。
         * @param {Number} loaded 已加载的总数量。注：这个有可能百分比为“1”的值，因为在一个加载开始前文件大小是根本无法被判断出来的。
         * @param {Number} total 字节总数。注意这个有可能只是1。
         * @param {Number} percent 已经加载的百分比。这会是一个0-1之间的数字。
         */

        /**
         * 加载启动时触发的事件。
         * 
         * @event loadStart
         * @param {Object} target 分发事件的对象。
         * @param {String} type 事件类型。
         */

        /**
         * 整个队列加载完毕时触发的事件。
         * 
         * @event complete
         * @param {Object} target 分发事件的对象。
         * @param {String} type 事件类型。
         */

        /**
         * 当加载器发生错误时触发的事件。如果是一个文件导致的错误，那么event参数会包含发生错误的那个项。这个会在事件对象上附加一些属性，如错误原因。
         * 
         * @event error
         * @param {Object} target 分发事件的对象。
         * @param {String} type 事件类型。
         * @param {Object} [item] 那个加载过程中发生错误的项。那个项是在调用{{#crossLink "LoadQueue/loadFile"}}{{/crossLink}}
         * 或{{#crossLink "LoadQueue/loadManifest"}}{{/crossLink}}时指定的。如果只指定了路径或者标签，那么改对象会把这个值作为属性包含在内。
         * @param {String} [error] 错误对象或者文本。
         */

        /**
         * 表示加载器是否已经完成加载。这不仅仅提供一个快速检查的方法，也保证不同的加载方式不会把结果累加在不同<code>complete</code>事件上。
         * 
         * @property loaded
         * @type {Boolean}
         * @default false
         */
        loaded: false,

        /**
         * 判断一个加载实例是否已经被取消。被取消的加载任务不能触发完成事件。注：{{#crossLink "LoadQueue"}}{{/crossLink}}队列应该会被
         * {{#crossLink "AbstractLoader/close"}}{{/crossLink}}方法关闭而不是“取消”。
         * 
         * @property canceled
         * @type {Boolean}
         * @default false
         */
        canceled: false,

        /**
         * 当前文件的加载进度（百分比）。这个会是0-1的值。
         * 
         * @property progress
         * @type {Number}
         * @default 0
         */
        progress: 0,

        /**
         * 加载器代理的项。注：这个在{{#crossLink "LoadQueue"}}{{/crossLink}}里的值是null，但对于类似{{#crossLink "XHRLoader"}}{{/crossLink}}
         * 和{{#crossLink "TagLoader"}}{{/crossLink}}来说是可用的。
         * 
         * @property _item
         * @type {Object}
         * @private
         */
        _item: null,

        /**
         * 获取一个通过加载器加载的项的引用。在大多数情况下这个值会通过{{#crossLink "LoadQueue/loadFile"}}{{/crossLink}} 或
         * {{#crossLink "LoadQueue/loadManifest"}}{{/crossLink}}方法传入{{#crossLink "LoadQueue"}}{{/crossLink}}中。
         * 但是如果只传入一个路径的字符串，那么就会是一个由LoadQueue创建的对象。
         * 
         * @return {Object} 当前加载器所负责加载的项。
         */
        getItem: function() {
            return this._item;
        },

        /**
         * 开始加载队列项。这个方法会在{{#crossLink "LoadQueue"}}{{/crossLink}}建立时被调用，但不会马上启动。
         * 
         * @example
         *      var queue = new createjs.LoadQueue();
         *      queue.addEventListener("complete", handleComplete);
         *      queue.loadManifest(fileArray, false); // 第二个参数告诉队列不要马上开始加载
         *      queue.load();
         * @method load
         */
        load: function() {
        },

        /**
         * 关闭活动的队列。关闭一个队列并完全清空之，并阻止加载余下的项。注：当前任何活动中的加载项都会继续进行，且余下的事件都会被处理掉。
         * 要停止并重启一个队列，请用{{#crossLink "LoadQueue/setPaused"}}{{/crossLink}}方法代替。
         * 
         * @method close
         */
        close: function() {
        },

        /**
         * @method toString
         * @return {String} 当前实例的字符串表示。
         */
        toString: function() {
            return "[PreloadJS AbstractLoader]";
        },

        //回调方法代理
        /**
         * 分发一个loadStart事件（和onLoadStart回调方法）。请查看<code>AbstractLoader.loadStart</code>事件获取事件负载的详细信息。
         * 
         * @method _sendLoadStart
         * @protected
         */
        _sendLoadStart: function() {
            if (this._isCanceled()) {
                return;
            }
            this.dispatchEvent("loadStart");
        },

        /**
         * 分发一个progress事件（和onProgress回调方法）。请查看<code>AbstractLoader.progress</code>事件获取事件负载的详细信息。
         * 
         * @method _sendProgress
         * @param {Number | Object} value 已加载项的总体进度，或者是一个包含<code>loaded</code>和<code>total</code>属性的对象。
         * @protected
         */
        _sendProgress: function(value) {
            if (this._isCanceled()) {
                return;
            }
            var event = null;
            if (typeof (value) == "number") {
                this.progress = value;
                event = {
                    loaded: this.progress,
                    total: 1
                };
            } else {
                event = value;
                this.progress = value.loaded / value.total;
                if (isNaN(this.progress) || this.progress == Infinity) {
                    this.progress = 0;
                }
            }
            event.target = this;
            event.type = "progress";
            this.dispatchEvent(event);
        },

        /**
         * 分发一个complete事件（和onComplete回调方法）。请查看<code>AbstractLoader.complete</code>事件获取事件负载的详细信息。
         * 
         * @method _sendComplete
         * @protected
         */
        _sendComplete: function() {
            if (this._isCanceled()) {
                return;
            }
            this.dispatchEvent("complete");
        },

        /**
         * 分发一个error事件（和onError回调方法）。请查看<code>AbstractLoader.error</code>事件获取事件负载的详细信息。
         * 
         * @method _sendError
         * @param {Object} event 包含指定error属性的事件对象。
         * @protected
         */
        _sendError: function(event) {
            if (this._isCanceled()) {
                return;
            }
            if (event == null) {
                event = {};
            }
            event.target = this;
            event.type = "error";
            this.dispatchEvent(event);
        },

        /**
         * 判断加载操作是否被取消了。这个很重要，它保证在队列被清空之后方法的调用或异步的事件不会产生任何问题。
         * 
         * @method _isCanceled
         * @return {Boolean} 加载器是否被取消了。
         * @protected
         */
        _isCanceled: function() {
            if (window.createjs == null || this.canceled) {
                return true;
            }
            return false;
        },

        /**
         * 使用<code>AbstractLoader.FILE_PATTERN</code>正则表达式对一个文件的URI进行解析。
         * 
         * @method _parseURI
         * @param {String} path 需要解析的文件路径。
         * @return {Array} 匹配的文件内容。请查看<code>AbstractLoader.FILE_PATTERN</code>属性来获取返回的详细信息。不匹配的情况下会返回null。
         * @protected
         */
        _parseURI: function(path) {
            if (!path) {
                return null;
            }
            return path.match(AbstractLoader.FILE_PATTERN);
        }
    });

    /**
     * 用来解析文件URI的正则表达式。这个支持简单的文件名称，也支持带参数带完整域名的URI。适配的结果是：http头:$1，域名:$2，路径:$3，文件名:$4，文件后缀:$5，参数:$6。
     * 
     * @property FILE_PATTERN
     * @type {RegExp}
     * @static
     * @protected
     */
    AbstractLoader.FILE_PATTERN = /(\w+:\/{2})?((?:\w+\.){2}\w+)?(\/?[\S]+\/|\/)?([\w\-%\.]+)(?:\.)(\w+)?(\?\S+)?/i;
    
    return AbstractLoader;
});