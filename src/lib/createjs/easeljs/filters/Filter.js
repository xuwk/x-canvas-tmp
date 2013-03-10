xc.module.define("xc.createjs.Filter", function(exports) {

    var Rectangle = xc.module.require("xc.createjs.Rectangle");

    /**
     * Base class that all filters should inherit from. Filters need to be applied to objects that have been cached using
     * the {{#crossLink "DisplayObject/cache"}}{{/crossLink}} method. If an object changes, please cache it again, or use
     * {{#crossLink "DisplayObject/updateCache"}}{{/crossLink}}.
     *
     * <h4>Example</h4>
     *     myInstance.cache(0,0, 100, 100);
     *     myInstance.filters = [
     *         new ColorFilter(0, 0, 0, 1, 255, 0, 0),
     *         new BoxBlurFilter(5, 5, 10)
     *     ];
     *
     * <h4>EaselJS Filters</h4>
     * EaselJS comes with a number of pre-built filters. Note that individual filters are not compiled into the minified
     * version of EaselJS. To use them, you must include them manually in the HTML.
     * <ul>
     *  <li>AlphaMapFilter: Map a greyscale image to the alpha channel of a display object</li>
     *  <li>{{#crossLink "AlphaMapFilter"}}{{/crossLink}}: Map an image's alpha channel to the alpha channel of a display object</li>
     *  <li>{{#crossLink "BoxBlurFilter"}}{{/crossLink}}: Apply vertical and horizontal blur to a display object</li>
     *  <li>{{#crossLink "ColorFilter"}}{{/crossLink}}: Color transform a display object</li>
     *  <li>{{#crossLink "ColorMatrixFilter"}}{{/crossLink}}: Transform an image using a {{#crossLink "ColorMatrix"}}{{/crossLink}}</li>
     * </ul>
     *
     * @class Filter
     * @constructor
     */
    var Filter = xc.class.create({

        /**
         * Returns a rectangle with values indicating the margins required to draw the filter.
         * For example, a filter that will extend the drawing area 4 pixels to the left, and 7 pixels to the right
         * (but no pixels up or down) would return a rectangle with (x=-4, y=0, width=11, height=0).
         *
         * @method getBounds
         * @return {Rectangle} a rectangle object indicating the margins required to draw the filter.
         */
        getBounds: function() {
            return new Rectangle(0, 0, 0, 0);
        },

        /**
         * Applies the filter to the specified context.
         *
         * @method applyFilter
         * @param {CanvasRenderingContext2D} ctx The 2D context to use as the source.
         * @param {Number} x The x position to use for the source rect.
         * @param {Number} y The y position to use for the source rect.
         * @param {Number} width The width to use for the source rect.
         * @param {Number} height The height to use for the source rect.
         * @param {CanvasRenderingContext2D} targetCtx Optional. The 2D context to draw the result to. Defaults to the context passed to ctx.
         * @param {Number} targetX Optional. The x position to draw the result to. Defaults to the value passed to x.
         * @param {Number} targetY Optional. The y position to draw the result to. Defaults to the value passed to y.
         * @return {Boolean}
         */
        applyFilter: function(ctx, x, y, width, height, targetCtx, targetX, targetY) {},

        /**
         * Returns a string representation of this object.
         *
         * @method toString
         * @return {String} a string representation of the instance.
         */
        toString: function() {
            return "[Filter]";
        },

        /**
         * Returns a clone of this Filter instance.
         *
         * @method clone
         * @return {Filter} A clone of the current Filter instance.
         */
        clone: function() {
            return new Filter();
        }
    });

    return Filter;

});