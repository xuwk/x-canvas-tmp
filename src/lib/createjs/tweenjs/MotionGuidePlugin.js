xc.module.define("xc.createjs.MotionGuidePlugin", function(exports) {

    var Tween = xc.module.require("xc.createjs.Tween");

    /**
     * 一个用于引导运动的 TweenJS 插件。 使用时只需在 TweenJS 加载完的时候简单调用 CSSPlugin.install()。
     * 下一个 tween 的 "guide" 的对象属性详情如下：
     * <h4>例子</h4>
     *      // 使用 Motion Guide
     *      Tween.get(target).to({guide:{ path:[0,0, 0,200,200,200, 200,0,0,0] }},7000);<br/>
     *      // 可视化线
     *      graphics.moveTo(0,0).curveTo(0,200,200,200).curveTo(200,0,0,0);
     * 
     * 每个路径都需要预先计算，以确保高速的性能。这是由于内置没有支持路径变化动态计算。
     * 这些是 Guide Object 的属性:<UL>
     * <LI> path: 必须, 数组 : x/y 的点的集合，用于使用 moveTo 和 1 到 n 的 curveTo。</LI>
     * <LI> start: 可选项, 0-1 : 起始位置， 默认是 0，除非继续延伸相同的路径。</LI>
     * <LI> end: 可选项, 0-1 : 最终位置, 如果没指定，默认值是 1。</LI>
     * <LI> orient: 可选项, bool : 设置目标的在 curve 曲线里对应位置的旋转角度。</LI>
     * </UL>
     * Guide 对象不能被多个 tween 分享，即使他们的属性都是相同的，如果这样做的话，将会导致不可预估的后果。
     * 值在 0-1 范围以外的 tween 将会是定义好的 curve 的 "best guess"。
     *
     * @class MotionGuidePlugin
     * @constructor
     */
    var MotionGuidePlugin = function() {
        throw ("MotionGuidePlugin cannot be instantiated.")
    };

    /**
     * @property priority
     * @protected
     * @static
     */
    MotionGuidePlugin.priority = 0; // high priority, should run sooner

    /**
     * 为 TweenJS 安装当前插件。一旦 TweenJS 加载完成且激活了该插件就执行该方法。
     *
     * @method install
     * @static
     */
    MotionGuidePlugin.install = function() {
        Tween.installPlugin(MotionGuidePlugin, ["guide", "x", "y", "rotation"]);
        return Tween.IGNORE;
    };

    /**
     * @method init
     * @protected
     * @static
     */
    MotionGuidePlugin.init = function(tween, prop, value) {
        var target = tween.target;
        if (!target.hasOwnProperty("x")) {
            target.x = 0;
        }
        if (!target.hasOwnProperty("y")) {
            target.y = 0;
        }
        if (!target.hasOwnProperty("rotation")) {
            target.rotation = 0;
        }
        return prop == "guide" ? null : value;
    };

    /**
     * @method step
     * @protected
     * @static
     */
    MotionGuidePlugin.step = function(tween, prop, startValue, endValue, injectProps) {
        if (prop != "guide") {
            return endValue;
        }
        var temp, data = endValue;
        if (!data.hasOwnProperty("path")) {
            data.path = [];
        }
        var path = data.path;
        if (!data.hasOwnProperty("end")) {
            data.end = 1;
        }
        if (!data.hasOwnProperty("start")) {
            data.start = (startValue && startValue.hasOwnProperty("end") && startValue.path === path) ? startValue.end : 0;
        }
        if (data.hasOwnProperty("_segments") && data._length) {
            return endValue;
        }
        var l = path.length;
        var accuracy = 10; // Adjust to improve line following precision but sacrifice performance (# of seg)
        if (l >= 6 && (l - 2) % 4 == 0) { // Enough points && contains correct number per entry ignoring start
            data._segments = [];
            data._length = 0;
            for ( var i = 2; i < l; i += 4) {
                var sx = path[i - 2], sy = path[i - 1];
                var cx = path[i + 0], cy = path[i + 1];
                var ex = path[i + 2], ey = path[i + 3];
                var oldX = sx, oldY = sy;
                var tempX, tempY, total = 0;
                var sublines = [];
                for ( var j = 1; j <= accuracy; j++) {
                    var t = j / accuracy;
                    var inv = 1 - t;
                    tempX = inv * inv * sx + 2 * inv * t * cx + t * t * ex;
                    tempY = inv * inv * sy + 2 * inv * t * cy + t * t * ey;
                    total += sublines[sublines.push(Math.sqrt((temp = tempX - oldX) * temp + (temp = tempY - oldY) * temp)) - 1];
                    oldX = tempX;
                    oldY = tempY;
                }
                data._segments.push(total);
                data._segments.push(sublines);
                data._length += total;
            }
        } else {
            throw ("invalid 'path' data, please see documentation for valid paths");
        }
        temp = data.orient;
        data.orient = false;
        MotionGuidePlugin.calc(data, data.end, injectProps);
        data.orient = temp;
        return endValue;
    };

    /**
     * @method tween
     * @protected
     * @static
     */
    MotionGuidePlugin.tween = function(tween, prop, value, startValues, endValues, ratio, wait, end) {
        var data = endValues.guide;
        if (data == undefined || data === startValues.guide) {
            return value;
        }
        if (data.lastRatio != ratio) {
            // first time through so calculate what I need to
            var t = ((data.end - data.start) * (wait ? data.end : ratio) + data.start);
            MotionGuidePlugin.calc(data, t, tween.target);
            if (data.orient) {
                tween.target.rotation += startValues.rotation || 0;
            }
            data.lastRatio = ratio;
        }
        if (!data.orient && prop == "rotation") {
            return value;
        }
        return tween.target[prop];
    };

    /**
     * 确定沿着路径的一个的合适的 x/y/rotation 比值。
     * 假设这个路径对象是由所有可选参数指定的。
     * @param data Data 对象。 将会传入 "guide:" 对应的属性值。
     * @param ratio 沿着路径 0-1 的距离，若值大于 0-1 则是 “best guess”。
     * @param target 所有内容要复制到的目标对象，如果没提供该参数，将会创建一个新的对象。
     * @return {Object} 接受了 tweened 属性的目标对象或新创建的对象。
     * @static
     */
    MotionGuidePlugin.calc = function(data, ratio, target) {
        if (data._segments == undefined) {
            MotionGuidePlugin.validate(data);
        }
        if (target == undefined) {
            target = {
                x: 0,
                y: 0,
                rotation: 0
            };
        }
        var seg = data._segments;
        var path = data.path;
        // find segment
        var pos = data._length * ratio;
        var cap = seg.length - 2;
        var n = 0;
        while (pos > seg[n] && n < cap) {
            pos -= seg[n];
            n += 2;
        }
        // find subline
        var sublines = seg[n + 1];
        var i = 0;
        cap = sublines.length - 1;
        while (pos > sublines[i] && i < cap) {
            pos -= sublines[i];
            i++;
        }
        var t = (i / ++cap) + (pos / (cap * sublines[i]));
        // find x/y
        n = (n * 2) + 2;
        var inv = 1 - t;
        target.x = inv * inv * path[n - 2] + 2 * inv * t * path[n + 0] + t * t * path[n + 2];
        target.y = inv * inv * path[n - 1] + 2 * inv * t * path[n + 1] + t * t * path[n + 3];
        // orientation
        if (data.orient) {
            target.rotation = 57.2957795 * Math.atan2((path[n + 1] - path[n - 1]) * inv + (path[n + 3] - path[n + 1]) * t, (path[n + 0] - path[n - 2]) * inv + (path[n + 2] - path[n + 0]) * t);
        }
        return target;
    };

    return MotionGuidePlugin;

});
