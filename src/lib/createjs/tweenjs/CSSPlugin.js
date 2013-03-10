/**
 * The TweenJS Javascript library provides a simple but powerful tweening interface. It supports tweening of both
 * numeric object properties & CSS style properties, and allows you to chain tweens and actions together to create
 * complex sequences.
 *
 * <h4>Simple Tween</h4>
 * This tween will tween the target's alpha property from 0 to 1 for 1s then call the <code>onComplete</code> function.
 *
 *     target.alpha = 0;
 *     Tween.get(target).to({alpha:1}, 1000).call(onComplete);
 *     function onComplete() {
 *         // Tween complete
 *     }
 *
 * <h4>Chainable Tween</h4>
 * This tween will wait 0.5s, tween the target's alpha property to 0 over 1s, set it's visible to false, then call the
 * <code>onComplete</code> function.
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
     * A TweenJS plugin for working with numeric CSS string properties (ex. top, left). To use simply install after
     * TweenJS has loaded:
     *
     *     CSSPlugin.install();
     *
     * You can adjust the CSS properties it will work with by modifying the <code>cssSuffixMap</code> property. Currently,
     * the top, left, bottom, right, width, height have a "px" suffix appended.
     *
     * @class CSSPlugin
     * @constructor
     */
    var CSSPlugin = function() {
        throw("CSSPlugin cannot be instantiated.")
    };

    /**
     * Defines the default suffix map for CSS tweens. This can be overridden on a per tween basis by specifying a
     * cssSuffixMap value for the individual tween. The object maps CSS property names to the suffix to use when
     * reading or setting those properties. For example a map in the form {top:"px"} specifies that when tweening
     * the "top" CSS property, it should use the "px" suffix (ex. target.style.top = "20.5px"). This only applies
     * to tweens with the "css" config property set to true.
     *
     * @property cssSuffixMap
     * @type Object
     * @static
     */
    CSSPlugin.cssSuffixMap = {top: "px", left: "px", bottom: "px", right: "px", width: "px", height: "px", opacity: ""};

    /**
     * @property priority
     * @protected
     * @static
     */
    CSSPlugin.priority = -100; // very low priority, should run last

    /**
     * Installs this plugin for use with TweenJS. Call this once after TweenJS is loaded to enable this plugin.
     *
     * @method install
     * @static
     */
    CSSPlugin.install = function() {
        var arr = [], map = CSSPlugin.cssSuffixMap;
        for (var n in map) { arr.push(n); }
        Tween.installPlugin(CSSPlugin, arr);
    };

    /**
     * @method init
     * @protected
     * @static
     */
    CSSPlugin.init = function(tween, prop, value) {
        var sfx0, sfx1, style, map = CSSPlugin.cssSuffixMap;
        if ((sfx0 = map[prop]) == null || !(style = tween.target.style)) { return value; }
        var str = style[prop];
        if (!str) { return 0; } // no style set.
        var i = str.length - sfx0.length;
        if ((sfx1 = str.substr(i)) != sfx0) {
            throw("CSSPlugin Error: Suffixes do not match. (" + sfx0 + ":" + sfx1 + ")");
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
        if (map[prop] == null || !(style = tween.target.style)) { return value; }
        style[prop] = value + map[prop];
        return Tween.IGNORE;
    };

    return CSSPlugin;

});
