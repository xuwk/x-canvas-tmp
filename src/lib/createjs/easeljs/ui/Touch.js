xc.module.define("xc.createjs.Touch", function(exports) {

    // TODO: support for double tap.

    /**
     * EaselJS内支持多点触控的工具。当前支持W3C标准的Touch接口（iOS 和 安卓浏览器）和IE10。
     * 当整理你的应用时确保已经关闭touch事件{{#crossLink "Touch/disable"}}{{/crossLink}}。
     * 注：你没有必要在打开触控前特意去检查一下设备是否支持，因为如果确实不支持的话，它不会打开成功的。
     *
     * <h4>样例</h4>
     *     var stage = new Stage("canvas");
     *     Touch.enable(stage);
     *
     * @class Touch
     * @static
     *
     * @module xc.createjs.easeljs
     */
    var Touch = function() {
        throw "Touch不能被实例化";
    };

    /**
     * 如果当前浏览器支持触控事件，则返回true。
     *
     * @method isSupported
     * @return {Boolean} 表示当前浏览器是否支持触控。
     * @static
     */
    Touch.isSupported = function() {
        return ('ontouchstart' in window) || // iOS
        (window.navigator['msPointerEnabled']); // IE10
    };

    /**
     * 使指定的EaselJS场景支持触控的交互方式。当前支持iOS（和适配的浏览器，例如当今的安卓浏览器），和IE10。
     * 支持单点或多点触控模式。扩展自EaselJS的MouseEvent模块，但是不支持双击或经过/离开事件。想了解更多信息，请看MouseEvent.pointerID。
     *
     * @method enable
     * @param {Stage} stage 需要打开触控的场景。
     * @param {Boolean} [singleTouch=false] 如果设置为true，则只支持单点触控。
     * @param {Boolean} [allowDefault=false] 如果设为true，则当用户在目标画布上操作时，默认的手势操作（滚动，放大等）会被允许。
     * @return {Boolean} 如果目标场景的触控被成功打开，则返回true。
     * @static
     */
    Touch.enable = function(stage, singleTouch, allowDefault) {
        if (!stage || !stage.canvas || !Touch.isSupported()) {
            return false;
        }
        // 往场景上注入需要的属性
        stage.__touch = {
            pointers: {},
            multitouch: !singleTouch,
            preventDefault: !allowDefault,
            count: 0
        };
        // 将来我们可能需要在添加这些事件前把标准的鼠标事件模块禁用掉以防止多次调用。虽然这个在iOS设备上不是一个问题。
        if ('ontouchstart' in window) {
            Touch._IOS_enable(stage);
        } else if (window.navigator['msPointerEnabled']) {
            Touch._IE_enable(stage);
        }
        return true;
    };

    /**
     * 把场景里面通过Touch.enable打开的监听器移除掉。
     *
     * @method disable
     * @param {Stage} stage 需要移除Touch监听器的场景。
     * @static
     */
    Touch.disable = function(stage) {
        if (!stage) {
            return;
        }
        if ('ontouchstart' in window) {
            Touch._IOS_disable(stage);
        } else if (window.navigator['msPointerEnabled']) {
            Touch._IE_disable(stage);
        }
    };

    /**
     * @method _IOS_enable
     * @protected
     * @param {Stage} stage
     * @static
     */
    Touch._IOS_enable = function(stage) {
        var canvas = stage.canvas;
        var f = stage.__touch.f = function(e) {
            Touch._IOS_handleEvent(stage, e);
        };
        canvas.addEventListener("touchstart", f, false);
        canvas.addEventListener("touchmove", f, false);
        canvas.addEventListener("touchend", f, false);
        canvas.addEventListener("touchcancel", f, false);
    };

    /**
     * @method _IOS_disable
     * @protected
     * @param {Stage} stage
     * @static
     */
    Touch._IOS_disable = function(stage) {
        var canvas = stage.canvas;
        if (!canvas) {
            return;
        }
        var f = stage.__touch.f;
        canvas.removeEventListener("touchstart", f, false);
        canvas.removeEventListener("touchmove", f, false);
        canvas.removeEventListener("touchend", f, false);
        canvas.removeEventListener("touchcancel", f, false);
    };

    /**
     * @method _IOS_handleEvent
     * @protected
     * @static
     */
    Touch._IOS_handleEvent = function(stage, e) {
        if (!stage) {
            return;
        }
        if (stage.__touch.preventDefault) {
            e.preventDefault && e.preventDefault();
        }
        var touches = e.changedTouches;
        var type = e.type;
        for ( var i = 0, l = touches.length; i < l; i++) {
            var touch = touches[i];
            var id = touch.identifier;
            if (touch.target != stage.canvas) {
                continue;
            }
            if (type == "touchstart") {
                this._handleStart(stage, id, e, touch.pageX, touch.pageY);
            } else if (type == "touchmove") {
                this._handleMove(stage, id, e, touch.pageX, touch.pageY);
            } else if (type == "touchend" || type == "touchcancel") {
                this._handleEnd(stage, id, e);
            }
        }
    };

    /**
     * @method _IE_enable
     * @protected
     * @param {Stage} stage
     * @static
     */
    Touch._IE_enable = function(stage) {
        var canvas = stage.canvas;
        var f = stage.__touch.f = function(e) {
            Touch._IE_handleEvent(stage, e);
        };
        canvas.addEventListener("MSPointerDown", f, false);
        window.addEventListener("MSPointerMove", f, false);
        window.addEventListener("MSPointerUp", f, false);
        window.addEventListener("MSPointerCancel", f, false);
        if (stage.__touch.preventDefault) {
            canvas.style.msTouchAction = "none";
        }
        stage.__touch.activeIDs = {};
    };

    /**
     * @method _IE_enable
     * @protected
     * @param {Stage} stage
     * @static
     */
    Touch._IE_disable = function(stage) {
        var f = stage.__touch.f;
        window.removeEventListener("MSPointerMove", f, false);
        window.removeEventListener("MSPointerUp", f, false);
        window.removeEventListener("MSPointerCancel", f, false);
        if (stage.canvas) {
            stage.canvas.removeEventListener("MSPointerDown", f, false);
        }
    };

    /**
     * @method _IE_handleEvent
     * @protected
     * @static
     */
    Touch._IE_handleEvent = function(stage, e) {
        if (!stage) {
            return;
        }
        if (stage.__touch.preventDefault) {
            e.preventDefault && e.preventDefault();
        }
        var type = e.type;
        var id = e.pointerId;
        var ids = stage.__touch.activeIDs;
        if (type == "MSPointerDown") {
            if (e.srcElement != stage.canvas) {
                return;
            }
            ids[id] = true;
            this._handleStart(stage, id, e, e.pageX, e.pageY);
        } else if (ids[id]) { // it's an id we're watching
            if (type == "MSPointerMove") {
                this._handleMove(stage, id, e, e.pageX, e.pageY);
            } else if (type == "MSPointerUp" || type == "MSPointerCancel") {
                delete (ids[id]);
                this._handleEnd(stage, id, e);
            }
        }
    };

    /**
     * @method _handleStart
     * @protected
     */
    Touch._handleStart = function(stage, id, e, x, y) {
        var props = stage.__touch;
        if (!props.multitouch && props.count) {
            return;
        }
        var ids = props.pointers;
        if (ids[id]) {
            return;
        }
        ids[id] = true;
        props.count++;
        stage._handlePointerDown(id, e, x, y);
    };

    /**
     * @method _handleMove
     * @protected
     */
    Touch._handleMove = function(stage, id, e, x, y) {
        if (!stage.__touch.pointers[id]) {
            return;
        }
        stage._handlePointerMove(id, e, x, y);
    };

    /**
     * @method _handleEnd
     * @protected
     */
    Touch._handleEnd = function(stage, id, e) {
        // TODO: cancel should be handled differently for proper UI (ex. an up would trigger a click, a cancel would more closely resemble an out).
        var props = stage.__touch;
        var ids = props.pointers;
        if (!ids[id]) {
            return;
        }
        props.count--;
        stage._handlePointerUp(id, e, true);
        delete (ids[id]);
    };

    return Touch;
});