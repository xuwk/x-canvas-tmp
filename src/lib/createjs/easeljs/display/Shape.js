xc.module.define("xc.createjs.Shape", function(exports) {

    var DisplayObject = xc.module.require("xc.createjs.DisplayObject");
    var Graphics = xc.module.require("xc.createjs.Graphics");

    /**
     * 一个 Shape 可以在展示列表上画矢量图。包含了一个封装了所有矢量绘制方法的 {{#crossLink "Graphics"}}{{/crossLink}} 实例。
     * 一个 Graphics 实例可以被多个 Shape 实例共同来显示不同位置的形状。
     *
     * 如果矢量图在 draws 方法之间不用变动的，那可以使用 {{#crossLink "DisplayObject/cache"}}{{/crossLink}} 方法去减低性能消耗。
     *
     * <h4>例子</h4>
     *      var graphics = new createjs.Graphics().beginFill("#ff0000").drawRect(0, 0, 100, 100);
     *      var shape = new createjs.Shape(graphics);
     *      
     *      //Alternatively use can also use the graphics property of the Shape class to renderer the same as above.
     *      var shape = new createjs.Shape();
     *      shape.graphics.beginFill("#ff0000").drawRect(0, 0, 100, 100);
     *
     * @class Shape
     * @extends DisplayObject
     * @constructor
     * @param {Graphics} graphics 可选项. 用于显示的 graphics 实例。 如果为 null, 将会创建一个新的 graphics 实例。
     **/
    var Shape = DisplayObject.extend({
        initialize: function(graphics) {
            this._super();
            this.graphics = graphics ? graphics : new Graphics();
        },

        /**
         * 用于显示的 graphics 实例。
         * 
         * @property graphics
         * @type Graphics
         **/
        graphics: null,

        /**
         * 通过返回 true 或 false 去表示该显示对象画在 Canvas 上时，是否被显示。
         * 并不是通过该显示对象是否在 Stage 可视范围内进行判断的。
         * 注：这种方法主要是供内部使用，即使它可能有高级用法。
         * @method isVisible
         * @return {Boolean} Boolean 表示该显示对象画在 Canvas 上时，是否被显示。
         **/
        isVisible: function() {
            var hasContent = this.cacheCanvas || (this.graphics && !this.graphics.isEmpty());
            return !!(this.visible && this.alpha > 0 && this.scaleX != 0 && this.scaleY != 0 && hasContent);
        },

        /**
         * 绘制 Shape 到指定的上下文，忽略 visible, alpha, shadow, and transform 属性。
         * 当绘制动作正在处理，将返回 true （用于覆盖功能）。
         * 注：这种方法主要是供内部使用，几时它可能有高级用法。
         * @method draw
         * @param {CanvasRenderingContext2D} ctx canvas 2D 上下文对象将渲染到这里。
         * @param {Boolean} ignoreCache 表示这个画的行为是否忽略所有当前的缓存。
         * 例如，用来画 cache （以防止它简单地绘制到自身现有的 cache）。
         **/
        draw: function(ctx, ignoreCache) {
            if (this._super(ctx, ignoreCache)) {
                return true;
            }
            this.graphics.draw(ctx);
            return true;
        },

        /**
         * 返回克隆后的 Shape。一些在当前背景下的特定属性值将还原为默认值（例如 .parent）。
         * @method clone
         * @param {Boolean} recursive 如果为 true，这个 Shape 的 {{#crossLink "Graphics"}}{{/crossLink}} 实例也会被克隆，
         * 如果为 false，这个 Graphics 实例将会和克隆出来的 Shape 实例共用。
         **/
        clone: function(recursive) {
            var o = new Shape((recursive && this.graphics) ? this.graphics.clone() : this.graphics);
            this.cloneProps(o);
            return o;
        },

        /**
         * 返回该对象的字符串表示形式。
         * @method toString
         * @return {String} 该对象的字符串表示形式。
         **/
        toString: function() {
            return "[Shape (name=" + this.name + ")]";
        }
    });

    return Shape;

});