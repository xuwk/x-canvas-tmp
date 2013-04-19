xc.module.define("xc.createjs.Ticker", function(exports) {

    var EventDispatcher = xc.module.require("xc.createjs.EventDispatcher");

    /**
     * Ticker在一个设定的时间间隔内提供一个中央的tick或心跳的广播。监听者可以通过订阅tick事件，在一个设定周期内监听到Ticker通知的消息。
     * 注：tick事件调用的时间间隔是一个设定的目标间隔，在CPU高负载的时候广播消息的时间间隔会加大。Ticker类使用静态的接口方法（例如:<code>Ticker.getPaused()</code>），不能被实例化。
     *
     * <h4>样例</h4>
     *     Ticker.addEventListener("tick", handleTick);
     *     function handleTick(event) {
     *         // 每帧的动作
     *     }
     *
     * @class Ticker
     * @static
     * @uses EventDispatcher
     */
    var Ticker = function() {
        throw "Ticker不能被实例化。";
    }

    /**
     * 分发每个tick事件。
     *
     * @event tick
     * @param {Object} target 分发事件的对象。
     * @param {String} type 对象类型。
     * @param {Boolean} paused 表示当前的tick是否已经暂停。
     * @param {Number} delta 最后一个tick直至目前所消耗的时间。单位：毫秒。
     * @param {Number} time 从Ticker初始化到现在为止的总时间。单位：毫秒。
     * @param {Number} runTime Ticker在从初始化后的运行时间，单位：毫秒。例如，你可以用来判断从初始化到目前为止暂停的总时间。
     */

    /**
     * 表示如果在当前浏览器支持的情况下，Ticker是否应当使用requestAnimationFrame。如果为false，Ticker会使用setTimeout。如果用了RAF，推荐你使用60的约数作为帧率（例如：15、20、30、60）。
     *
     * @property useRAF
     * @static
     * @type {Boolean}
     * @default false
     */
    Ticker.useRAF = false;

    /**
     * @property _listeners
     * @type {Array}
     * @protected
     */
    Ticker._listeners = null;

    /**
     * @property _pauseable
     * @type {Array}
     * @protected
     */
    Ticker._pauseable = null;

    /**
     * @property _paused
     * @type {Boolean}
     * @protected
     */
    Ticker._paused = false;

    /**
     * @property _inited
     * @type {Boolean}
     * @protected
     */
    Ticker._inited = false;

    /**
     * @property _startTime
     * @type {Number}
     * @protected
     */
    Ticker._startTime = 0;

    /**
     * @property _pausedTime
     * @type {Number}
     * @protected
     */
    Ticker._pausedTime = 0;

    /**
     * 已通过的tick数量。
     *
     * @property _ticks
     * @type {Number}
     * @protected
     */
    Ticker._ticks = 0;

    /**
     * 当Ticker停止后，通过的tick的数量。
     *
     * @property _pausedTicks
     * @type {Number}
     * @protected
     */
    Ticker._pausedTicks = 0;

    /**
     * @property _interval
     * @type {Number}
     * @protected
     */
    Ticker._interval = 50; // 只读

    /**
     * @property _lastTime
     * @type {Number}
     * @protected
     */
    Ticker._lastTime = 0;

    /**
     * @property _times
     * @type {Array}
     * @protected
     */
    Ticker._times = null;

    /**
     * @property _tickTimes
     * @type {Array}
     * @protected
     */
    Ticker._tickTimes = null;

    /**
     * @property _rafActive
     * @type {Boolean}
     * @protected
     */
    Ticker._rafActive = false;

    /**
     * @property _timeoutID
     * @type {Number}
     * @protected
     */
    Ticker._timeoutID = null;

    /**
     * 给tick事件添加一个监听器。监听器必须是一个暴露了tick方法的对象，或者是一个函数。在每一个tick或时间间隔内监听器会被调用一次。那个“时间间隔”是在.setInterval(ms)方法里面指定的。
     * 那个函数或指定的tick方法会被传入两个参数：上一个tick和当前那个时间消耗的时间；一个代表Ticker是否已经暂停的布尔值。
     *
     * @method addListener
     * @static
     * @param {Object} o 那个作为监听器的对象或者函数。
     * @param {Boolean} pauseable 如果为false，监听器会继续调用tick，即使已经调用Ticker.pause()方法来暂停Ticker。默认为true。
     * @deprecated 兼容“tick”事件。这个会在将来的版本移除掉。
     */
    Ticker.addListener = function(o, pauseable) {
        if (o == null) {
            return;
        }
        Ticker.removeListener(o);
        Ticker._pauseable[Ticker._listeners.length] = (pauseable == null) ? true : pauseable;
        Ticker._listeners.push(o);
    };

    /**
     * 初始化或重置计时器，清空所有关联的监听器和fps计量数据，启动tick。这个方法会在增加第一个监听器时自动调用。
     *
     * @method init
     * @static
     */
    Ticker.init = function() {
        Ticker._inited = true;
        Ticker._times = [];
        Ticker._tickTimes = [];
        Ticker._pauseable = [];
        Ticker._listeners = [];
        Ticker._times.push(Ticker._lastTime = Ticker._startTime = Ticker._getTime());
        Ticker.setInterval(Ticker._interval);
    };

    /**
     * 移除指定的监听器。
     *
     * @method removeListener
     * @static
     * @param {Object} o 从监听中的tick事件里移除对象或者函数。
     * @deprecated 兼容“tick”事件。这个会在将来的版本移除掉。
     */
    Ticker.removeListener = function(o) {
        var listeners = Ticker._listeners;
        if (!listeners) {
            return;
        }
        var index = listeners.indexOf(o);
        if (index != -1) {
            listeners.splice(index, 1);
            Ticker._pauseable.splice(index, 1);
        }
    };

    /**
     * 移除所有的监听器。
     *
     * @method removeAllListeners
     * @static
     * @deprecated 兼容“tick”事件。这个会在将来的版本移除掉。
     */
    Ticker.removeAllListeners = function() {
        Ticker._listeners = [];
        Ticker._pauseable = [];
    };

    /**
     * 设置tick与tick之间的目标时间（毫秒）。默认是50（20 FPS）。
     * 注：实际的时间可能随CPU的负载的上升而上升。
     *
     * @method setInterval
     * @static
     * @param {Number} interval tick与tick之间的毫秒数。默认值为50。
     */
    Ticker.setInterval = function(interval) {
        Ticker._interval = interval;
        if (!Ticker._inited) {
            return;
        }
        Ticker._setupTick();
    };

    /**
     * 返回当前tick与tick之间的时间间隔。
     *
     * @method getInterval
     * @static
     * @return {Number} tick事件之间的时间间隔，单位：毫秒。
     */
    Ticker.getInterval = function() {
        return Ticker._interval;
    };

    /**
     * 设置目标帧率（每秒显示帧数）。例如，一个40毫秒的时间间隔，getFPS会返回25（1000毫秒除以40毫秒/每tick等于25fps）。
     *
     * @method setFPS
     * @static
     * @param {Number} value 每秒钟广播tick的目标数量。
     */
    Ticker.setFPS = function(value) {
        Ticker.setInterval(1000 / value);
    };

    /**
     * 返回目标帧率（每秒显示帧数）。例如，一个40毫秒的时间间隔，getFPS会返回25（1000毫秒除以40毫秒/每tick等于25fps）。
     *
     * @method getFPS
     * @static
     * @return {Number} 当前目标每秒钟广播的帧数（tick数量）。
     */
    Ticker.getFPS = function() {
        return 1000 / Ticker._interval;
    };

    /**
     * 返回实际每秒帧数（tick数）
     *
     * @method getMeasuredFPS
     * @static
     * @param {Number} ticks 可选值。之前使用的tick数量，用来衡量实际运行时的帧数（tick数）。默认为设定的每秒帧数（tick数）。
     * @return {Number} 返回实际的每秒帧数（tick数）。这个取决于性能，这个可能跟目标的每秒帧数（tick数）有些不一样。
     */
    Ticker.getMeasuredFPS = function(ticks) {
        if (Ticker._times.length < 2) {
            return -1;
        }
        // 默认值，计算过去1秒内的fps值：
        if (ticks == null) {
            ticks = Ticker.getFPS() | 0;
        }
        ticks = Math.min(Ticker._times.length - 1, ticks);
        return 1000 / ((Ticker._times[0] - Ticker._times[ticks]) / ticks);
    };

    /**
     * 当Ticker暂停时，那些可暂停的监听器会暂停运作。请看addListener获取更多信息。
     *
     * @method setPaused
     * @static
     * @param {Boolean} value 代表是（true）否（false）暂停Ticker
     */
    Ticker.setPaused = function(value) {
        Ticker._paused = value;
    };

    /**
     * 返回一个表示当前Ticker是否为暂停状态的布尔值。
     *
     * @method getPaused
     * @static
     * @return {Boolean} 当前Ticker是否已经暂停。
     */
    Ticker.getPaused = function() {
        return Ticker._paused;
    };

    /**
     * 返回自Ticker初始化以来一共消耗的时间。比如，你可以使用一个异步动作来确定消耗的确切时间。
     *
     * @method getTime
     * @static
     * @param {Boolean} runTime 如果为true则只返回Ticker运行时所消耗的时间，不算上暂停的时间。否则，返回自第一个tick事件监听器被添加至今所消耗的总时间。默认为false。
     * @return {Number} 自Ticker初始化所消耗的时间，单位：毫秒。
     */
    Ticker.getTime = function(runTime) {
        return Ticker._getTime() - Ticker._startTime - (runTime ? Ticker._pausedTime : 0);
    };

    /**
     * 返回Ticker已经广播的tick数量。
     *
     * @method getTicks
     * @static
     * @param {Boolean} pauseable 代表是否包含那些在Ticker暂停时仍然进行广播的tick数量。如果为true则只返回Ticker运作时的tick数量，否则返回所有（包含暂停时也广播的数量）。默认为false。
     * @return {Number} 广播的tick数量。
     */
    Ticker.getTicks = function(pauseable) {
        return Ticker._ticks - (pauseable ? Ticker._pausedTicks : 0);
    };

    /**
     * @method _handleAF
     * @protected
     */
    Ticker._handleAF = function() {
        Ticker._rafActive = false;
        Ticker._setupTick();
        // 如果消耗了足够时间就运行，会有一点机动的提前，因为看上去RAF的运行频率会略高于60hz。
        if (Ticker._getTime() - Ticker._lastTime >= (Ticker._interval - 1) * 0.97) {
            Ticker._tick();
        }
    };

    /**
     * @method _handleTimeout
     * @protected
     */
    Ticker._handleTimeout = function() {
        Ticker.timeoutID = null;
        Ticker._setupTick();
        Ticker._tick();
    };

    /**
     * @method _setupTick
     * @protected
     */
    Ticker._setupTick = function() {
        if (Ticker._rafActive || Ticker.timeoutID != null) {
            return;
        } // 避免重复
        if (Ticker.useRAF) {
            var f = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame;
            if (f) {
                f(Ticker._handleAF);
                Ticker._rafActive = true;
                return;
            }
        }
        Ticker.timeoutID = setTimeout(Ticker._handleTimeout, Ticker._interval);
    };

    /**
     * @method _tick
     * @protected
     */
    Ticker._tick = function() {
        var time = Ticker._getTime();
        Ticker._ticks++;
        var elapsedTime = time - Ticker._lastTime;
        var paused = Ticker._paused;
        if (paused) {
            Ticker._pausedTicks++;
            Ticker._pausedTime += elapsedTime;
        }
        Ticker._lastTime = time;
        var pauseable = Ticker._pauseable;
        var listeners = Ticker._listeners.slice();
        var l = listeners ? listeners.length : 0;
        for ( var i = 0; i < l; i++) {
            var listener = listeners[i];
            if (listener == null || (paused && pauseable[i])) {
                continue;
            }
            if (listener.tick) {
                listener.tick(elapsedTime, paused);
            } else if (listener instanceof Function) {
                listener(elapsedTime, paused);
            }
        }
        Ticker.dispatchEvent({
            type: "tick",
            paused: paused,
            delta: elapsedTime,
            time: time,
            runTime: time - Ticker._pausedTime
        })
        Ticker._tickTimes.unshift(Ticker._getTime() - time);
        while (Ticker._tickTimes.length > 100) {
            Ticker._tickTimes.pop();
        }
        Ticker._times.unshift(time);
        while (Ticker._times.length > 100) {
            Ticker._times.pop();
        }
    };

    /**
     * @method _getTime
     * @protected
     */
    var now = window.performance && (performance.now || performance.mozNow || performance.msNow || performance.oNow || performance.webkitNow);
    Ticker._getTime = function() {
        return (now && now.call(performance)) || (new Date().getTime());
    };

    EventDispatcher.initialize(Ticker);
    Ticker.init();

    return Ticker;

});
