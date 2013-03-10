/**
 * The EaselJS Javascript library provides a retained graphics mode for canvas including a full hierarchical display
 * list, a core interaction model, and helper classes to make working with 2D graphics in Canvas much easier.
 * EaselJS provides straight forward solutions for working with rich graphics and interactivity with HTML5 Canvas...
 *
 * <h4>Getting Started</h4>
 * To get started with Easel, create a {{#crossLink "Stage"}}{{/crossLink}} that wraps a CANVAS element, and add
 * {{#crossLink "DisplayObject"}}{{/crossLink}} instances as children.
 *
 * EaselJS supports:
 * <ul>
 *  <li>Images using {{#crossLink "Bitmap"}}{{/crossLink}}</li>
 *  <li>Vector graphics using {{#crossLink "Shape"}}{{/crossLink}} and {{#crossLink "Graphics"}}{{/crossLink}}</li>
 *  <li>Animated bitmaps using {{#crossLink "SpriteSheet"}}{{/crossLink}} and {{#crossLink "BitmapAnimation"}}{{/crossLink}}
 *  <li>Simple text instances using {{#crossLink "Text"}}{{/crossLink}}</li>
 *  <li>Containers that hold other DisplayObjects using {{#crossLink "Container"}}{{/crossLink}}</li>
 * </ul>
 *
 * All display objects can be added to the stage as children, or drawn to a canvas directly.
 *
 * <b>User Interactions</b><br/>
 * All display objects on stage will dispatch events when interacted with using a mouse or touch.
 * EaselJS supports hover, press, and release events, as well as an easy-to-use drag-and-drop model. Check out
 * {{#crossLink "MouseEvent"}}{{/crossLink}} for more information.
 *
 * <h4>Simple Example</h4>
 * This example illustrates how to create and position a {{#crossLink "Shape"}}{{/crossLink}} on the {{#crossLink "Stage"}}{{/crossLink}}
 * using EaselJS' drawing API.
 *
 *     // Create a stage by getting a reference to the canvas
 *     var stage = new Stage("demoCanvas");
 *     // Create a Shape DisplayObject.
 *     var circle = new Shape();
 *     circle.graphics.beginFill("red").drawCircle(0, 0, 40);
 *     // Set position of Shape instance.
 *     circle.x = circle.y = 50;
 *     // Add Shape instance to stage display list.
 *     stage.addChild(circle);
 *     // Update stage will render next frame
 *     stage.update();
 *
 * <b>Simple Animation Example</b><br/>
 * This example moves the shape created in the previous demo across the screen.
 *
 *     // Update stage will render next frame
 *     Ticker.addEventListener("tick", handleTick);
 *
 *     function handleTick() {
 *         // Circle will move 10 units to the right.
 *         circle.x += 10;
 *         // Will cause the circle to wrap back
 *         if (circle.x > stage.canvas.width) { circle.x = 0; }
 *         stage.update();
 *     }
 *
 * <h4>Other Features</h4>
 * EaselJS also has built in support for
 * <ul>
 *  <li>Canvas features such as {{#crossLink "Shadow"}}{{/crossLink}} and CompositeOperation</li>
 *  <li>{{#crossLink "Ticker"}}{{/crossLink}}, a global heartbeat that objects can subscribe to</li>
 *  <li>Filters, including a provided {{#crossLink "ColorMatrixFilter"}}{{/crossLink}},
 *      {{#crossLink "AlphaMaskFilter"}}{{/crossLink}},
 *      {{#crossLink "AlphaMapFilter"}}{{/crossLink}},
 *      and {{#crossLink "BoxBlurFilter"}}{{/crossLink}}.
 *      See {{#crossLink "Filter"}}{{/crossLink}} for more information</li>
 *  <li>A {{#crossLink "ButtonHelper"}}{{/crossLink}} utility, to easily create interactive buttons</li>
 *  <li>{{#crossLink "SpriteSheetUtils"}}{{/crossLink}} and a {{#crossLink "SpriteSheetBuilder"}}{{/crossLink}} to help
 *      build and manage {{#crossLink "SpriteSheet"}}{{/crossLink}} functionality at run-time.</li>
 * </ul>
 *
 * @module xc.createjs.easeljs
 */

xc.module.define("xc.createjs.Bitmap", function(exports) {

    var DisplayObject = xc.module.require("xc.createjs.DisplayObject");

    /**
     * A Bitmap represents an Image, Canvas, or Video in the display list.
     * A Bitmap can be instantiated using an existing HTML element, or a string.
     *
     * <h4>Example</h4>
     *     var bitmap = new Bitmap("imagePath.jpg");
     *
     * Note: When a string path or image tag that is not yet loaded is used, the stage may need to be redrawn before it
     * will be displayed.
     *
     * @class Bitmap
     * @extends DisplayObject
     * @constructor
     * @param {Image | HTMLCanvasElement | HTMLVideoElement | String} imageOrUri The source object or URI to an image to
     *  display. This can be either an Image, Canvas, or Video object, or a string URI to an image file to load and use.
     *  If it is a URI, a new Image object will be constructed and assigned to the .image property.
     */
    var Bitmap = DisplayObject.extend({
        _init: function(imageOrUri) {
            this._super();
            if (typeof imageOrUri == "string") {
                this.image = new Image();
                this.image.src = imageOrUri;
            } else {
                this.image = imageOrUri;
            }
        },

        /**
         * The image to render. This can be an Image, a Canvas, or a Video.
         *
         * @property image
         * @type Image | HTMLCanvasElement | HTMLVideoElement
         */
        image: null,

        /**
         * Whether or not the Bitmap should be draw to the canvas at whole pixel coordinates.
         *
         * @property snapToPixel
         * @type Boolean
         * @default true
         */
        snapToPixel: true,

        /**
         * Specifies an area of the source image to draw. If omitted, the whole image will be drawn.
         *
         * @property sourceRect
         * @type Rectangle
         * @default null
         */
        sourceRect: null,

        /**
         * Returns true or false indicating whether the display object would be visible if drawn to a canvas.
         * This does not account for whether it would be visible within the boundaries of the stage.
         *
         * Note: This method is mainly for internal use, though it may be useful for advanced uses.
         *
         * @method isVisible
         * @return {Boolean} Boolean indicating whether the display object would be visible if drawn to a canvas.
         */
        isVisible: function() {
            var hasContent = this.cacheCanvas ||
                    (this.image && (this.image.complete || this.image.getContext || this.image.readyState >= 2));
            return !!(this.visible && this.alpha > 0 && this.scaleX != 0 && this.scaleY != 0 && hasContent);
        },

        /**
         * Draws the display object into the specified context ignoring it's visible, alpha, shadow, and transform.
         * Returns true if the draw was handled (useful for overriding functionality).
         *
         * Note: This method is mainly for internal use, though it may be useful for advanced uses.
         *
         * @method draw
         * @param {CanvasRenderingContext2D} ctx The canvas 2D context object to draw into.
         * @param {Boolean} ignoreCache Indicates whether the draw operation should ignore any current cache.
         *  For example, used for drawing the cache (to prevent it from simply drawing an existing cache back into itself).
         */
        draw: function(ctx, ignoreCache) {
            if (this._super(ctx, ignoreCache)) { return true; }
            var rect = this.sourceRect;
            if (rect) {
                ctx.drawImage(this.image, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
            } else {
                ctx.drawImage(this.image, 0, 0);
            }
            return true;
        },

        /**
         * Returns a clone of the Bitmap instance.
         *
         * @method clone
         * @return {Bitmap} a clone of the Bitmap instance.
         */
        clone: function() {
            var o = new Bitmap(this.image);
            if (this.sourceRect) { o.sourceRect = this.sourceRect.clone(); }
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
            return "[Bitmap (name=" + this.name + ")]";
        }
    });

    return Bitmap;

});