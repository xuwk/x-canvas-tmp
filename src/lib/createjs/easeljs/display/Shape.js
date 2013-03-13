xc.module.define("xc.createjs.Shape", function(exports) {

    var DisplayObject = xc.module.require("xc.createjs.DisplayObject");
    var Graphics = xc.module.require("xc.createjs.Graphics");

    /**
     * A Shape allows you to display vector art in the display list.
     * It composites a {{#crossLink "Graphics"}}{{/crossLink}} instance which exposes all of the vector drawing methods.
     * The Graphics instance can be shared between multiple Shape instances to display the same vector graphics with
     * different positions or transforms.
     *
     * If the vector art will not change between draws, you may want to use the
     * {{#crossLink "DisplayObject/cache"}}{{/crossLink}} method to reduce the rendering cost.
     *
     * <h4>Example</h4>
     *     var graphics = new Graphics().beginFill("#ff0000").drawRect(0, 0, 100, 100);
     *     var shape = new Shape(graphics);
     *
     *     // Alternatively use can also use the graphics property of the Shape class to renderer the same as above.
     *     var shape = new Shape();
     *     shape.graphics.beginFill("#ff0000").drawRect(0, 0, 100, 100);
     *
     * @class Shape
     * @extends DisplayObject
     * @constructor
     * @param {Graphics} graphics Optional. The graphics instance to display. If null, a new Graphics instance will be created.
     */
    var Shape = DisplayObject.extend({
        initialize: function(graphics) {
            this._super();
            this.graphics = graphics ? graphics : new Graphics();
        },

        /**
         * The graphics instance to display.
         *
         * @property graphics
         * @type Graphics
         */
        graphics: null,

        /**
         * Returns true or false indicating whether the Shape would be visible if drawn to a canvas.
         * This does not account for whether it would be visible within the boundaries of the stage.
         *
         * Note: This method is mainly for internal use, though it may be useful for advanced uses.
         *
         * @method isVisible
         * @return {Boolean} Boolean indicating whether the Shape would be visible if drawn to a canvas
         */
        isVisible: function() {
            var hasContent = this.cacheCanvas || (this.graphics && !this.graphics.isEmpty());
            return !!(this.visible && this.alpha > 0 && this.scaleX != 0 && this.scaleY != 0 && hasContent);
        },

        /**
         * Draws the Shape into the specified context ignoring it's visible, alpha, shadow, and transform. Returns true if
         * the draw was handled (useful for overriding functionality).
         *
         * Note: This method is mainly for internal use, though it may be useful for advanced uses.
         *
         * @method draw
         * @param {CanvasRenderingContext2D} ctx The canvas 2D context object to draw into.
         * @param {Boolean} ignoreCache Indicates whether the draw operation should ignore any current cache. For example,
         *  used for drawing the cache (to prevent it from simply drawing an existing cache back into itself).
         */
        draw: function(ctx, ignoreCache) {
            if (this._super(ctx, ignoreCache)) {
                return true;
            }
            this.graphics.draw(ctx);
            return true;
        },

        /**
         * Returns a clone of this Shape. Some properties that are specific to this instance's current context are reverted
         * to their defaults (for example .parent).
         *
         * @method clone
         * @param {Boolean} recursive If true, this Shape's {{#crossLink "Graphics"}}{{/crossLink}} instance will also be
         *  cloned. If false, the Graphics instance will be shared with the new Shape.
         */
        clone: function(recursive) {
            var o = new Shape((recursive && this.graphics) ? this.graphics.clone() : this.graphics);
            this.cloneProps(o);
            return o;
        },

        /**
         * Returns a string representation of this object.
         *
         * @method toString
         * @return {String} a string representation of the instance.
         */
        toString: function() {
            return "[Shape (name=" + this.name + ")]";
        }
    });

    return Shape;

});