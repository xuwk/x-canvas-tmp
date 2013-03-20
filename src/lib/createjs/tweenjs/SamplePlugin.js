xc.module.define("xc.createjs.SamplePlugin", function(exports) {
    var Tween = xc.module.require("xc.createjs.Tween");
    
    /**
     * 一个简单的 TweenJS 插件。这个插件不作用于 tweens 的任何部分，目的仅仅在于说明如何构建 TweenJS 插件。
     * 请看代码的内嵌注释。<br/><br/>
     * 一个 TweenJS 插件是一个简单的对象，该对象暴露一个属性（优先级），和 3 个方法（init，step，和 tween）。
     * 创建一个插件将会同时暴露一个 install 方法，即使这个不是有严格的必要的。
     * @class SamplePlugin
     * @constructor
     **/
    var SamplePlugin = function() {
        throw("SamplePlugin cannot be instantiated.")
    };
    
    /**
     * 用于给 TweenJS 去判断什么时候执行该插件。
     * 插件按照优先级高的先执行。优先级的值可以是正负整数。
     * @property priority
     * @static
     **/
    SamplePlugin.priority = 0;

    /**
     * 为 TweenJS 安装该插件，和注册一个关于该插件操作的属性列表。
     * 一旦 TweenJS 加载完成且激活了该插件就执行该方法。
     * @method install
     * @static
     **/
    SamplePlugin.install = function() {
        // this registers this plugin to work with the "test" property.
        Tween.installPlugin(SamplePlugin, ["test"]);
    };
    
    /**
     * 当前插件注册到的 tween 属性初始化时执行该方法。一般来说，Plugin.init 会紧接着执行 Plugin.to。
     * @method init
     * @param {Tween} tween 相关的 tween 实例。 
     * @param {String} prop 要初始化的属性名。
     * @param {any} value tween 的目标属性的当前值。
     * @return {any} tween 的初始值。在很多案例里，通常简单返回一个参数值，但一些插件可能需要修改初始值。
     * @static
     **/
    SamplePlugin.init = function(tween, prop, value) {
        console.log("init", prop, value);
        
        // 返回没修改过的属性值:
        return value;
    };

    /**
     * 当该插件添加到 tween 的属性时执行，(例如： 一个新的 "to" 行为添加到 tween)。
     * @method init
     * @param {Tween} tween 相关的 tween 实例。
     * @param {String} prop tween 正在执行的属性名。
     * @param {any} startValue 步骤开端的属性值。如果这个步骤是第一个步骤，
     *                         则该值将等于初始化值。如果不是第一个步骤，则该值将会等于上一个步骤对应的该属性的值。
     * @param {Object} injectProps 一个普通对象，该对象可以让当前插件展开其他可以在这个步骤里 update 的属性。
     * @param {any} endValue 该步骤结尾时对应 tween 属性的值。
     * @static
     **/
    SamplePlugin.step = function(tween, prop, startValue, endValue, injectProps) {
        console.log("to: ", prop, startValue, endValue);
    };

    /**
     * 当该插件注册到的 tween 属性正在前进时执行。
     * @method tween
     * @param {Tween} tween 相关的 tween 实例。
     * @param {String} prop tween 正在执行的属性名。
     * @param {any} value tween 当前属性的值, 由 TweenJS 计算。
     * @param {Object} 一个关于当前步骤的初始值哈希集合。可以通过 startValues[prop] 获取当前属性的初始值。
     * @param {Object} endValues  一个关于当前 step 结束后的所有属性的值的哈希集合。
     * @param {Number} ratio 一个指出当前步骤的 eased 进度的值。这个值一般在 0 到 1 之间，即使有些 eases 会产生在 0 到 1 之外的值。
     * @param {Boolean} wait 指出当前的步骤是不是一个 “wait” 步骤。
     * @param {Boolean} end 指出 tween 是否结束。
     * @return {any} 返回一些能分配到目标属性上的值。举例，返回 <code>Math.round(value)</code> 会分配一个正整数到目标属性。
     *               返回 Tween.IGNORE 将会禁止目标属性分配到值。
     * @static
     **/
    SamplePlugin.tween = function(tween, prop, value, startValues, endValues, ratio, wait, end) {
        // ratio 是 eased 比例。
        console.log("tween", prop, value, ratio, wait, end);
        
        // 返回没修改过的 tween 值（使用默认的 tween 行为）。
        return value;
    };
    
    return SamplePlugin;
});