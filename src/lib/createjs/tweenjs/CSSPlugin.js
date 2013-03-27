/**
 *
 * TweenJs 库提供了一个简单但非常有用的补间接口。它同时支持数据对象属性和 CSS 样式属性，同时可以把 action 链接在一起。
 *
 * <h4>简单 Tween</h4>
 * 这个 tween 将会对目标对象的透明度进行补间，该补间是在 1 秒内将透明度从 0 变到 1，然后调用 <code>onComplete</code> 回调。
 *     target.alpha = 0;
 *     Tween.get(target).to({alpha:1}, 1000).call(onComplete);
 *     function onComplete() {
 *         // Tween complete
 *     }
 *
 * <h4>可链接的 Tween</h4>
 * 这个补间首先等待 0.5 秒，然后目标对象从的透明度从在 1 秒内变到 0，再设置 visible 属性为 false，然后调用 onComplete 回调。
 *
 *     target.alpha = 1;
 *     Tween.get(target).wait(500).to({alpha:0, visible:false}, 1000).call(onComplete);
 *     function onComplete() {
 *         // Tween complete
 *     }
 *
 * @module xc.createjs.tweenjs
 */

xc.module.define("xc.createjs.CSSPlugin", function(exports) {

    var Tween = xc.module.require("xc.createjs.Tween");

    /**
     * 一个 TweenJS 插件，用于处理 CSS 属性值 (ex. top, left)。使用时只需在 TweenJS 加载完成的时候简单调用：
     *
     *   createjs.CSSPlugin.install();
     *
     * 当调整 CSS 的属性值时，会用到 <code>cssSuffixMap</code> 属性。
     * 当前，top, left, bottom, right, width, height 属性都是 "px" 后缀。
     *
     * @class CSSPlugin
     * @constructor
     */
    var CSSPlugin = function() {
        throw ("CSSPlugin cannot be instantiated.")
    };

    /**
     * 一个默认的 CSS tween 的后缀列表。当要读取或设置属性的时候，将要用到 cssSuffixMap 的后缀。
     * 例如，当有一个 map 是 {top:"px"} 这样的，则该 map 指定了当 tweening 有一个 Top CSS 属性的时候，就必须用 "px"
     * 作为后缀，(ex. target.style.top = "20.5px")。这个仅仅在 tween 的 “css” 属性设置为 true 的时候生效。
     *
     * @property cssSuffixMap
     * @type Object
     * @static
     */
    CSSPlugin.cssSuffixMap = {
        top: "px",
        left: "px",
        bottom: "px",
        right: "px",
        width: "px",
        height: "px",
        opacity: ""
    };

    /**
     * @property priority
     * @protected
     * @static
     */
    CSSPlugin.priority = -100; // very low priority, should run last

    /**
     * 为 TweenJS 安装该插件。一旦 TweenJS 加载完成且激活了该插件就执行该方法。
     *
     * @method install
     * @static
     */
    CSSPlugin.install = function() {
        var arr = [], map = CSSPlugin.cssSuffixMap;
        for ( var n in map) {
            arr.push(n);
        }
        Tween.installPlugin(CSSPlugin, arr);
    };

    /**
     * @method init
     * @protected
     * @static
     */
    CSSPlugin.init = function(tween, prop, value) {
        var sfx0, sfx1, style, map = CSSPlugin.cssSuffixMap;
        if ((sfx0 = map[prop]) == null || !(style = tween.target.style)) {
            return value;
        }
        var str = style[prop];
        if (!str) {
            return 0;
        } // no style set.
        var i = str.length - sfx0.length;
        if ((sfx1 = str.substr(i)) != sfx0) {
            throw ("CSSPlugin Error: Suffixes do not match. (" + sfx0 + ":" + sfx1 + ")");
        } else {
            return parseInt(str.substr(0, i));
        }
    };

    /**
     * @method step
     * @protected
     * @static
     */
    CSSPlugin.step = function(tween, prop, startValue, endValue, injectProps) {
        // unused
    };

    /**
     * @method tween
     * @protected
     * @static
     */
    CSSPlugin.tween = function(tween, prop, value, startValues, endValues, ratio, wait, end) {
        var style, map = CSSPlugin.cssSuffixMap;
        if (map[prop] == null || !(style = tween.target.style)) {
            return value;
        }
        style[prop] = value + map[prop];
        return Tween.IGNORE;
    };

    return CSSPlugin;

});
