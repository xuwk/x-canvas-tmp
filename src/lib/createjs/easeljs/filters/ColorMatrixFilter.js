xc.module.define("xc.createjs.ColorMatrixFilter", function(exports) {

    var Filter = xc.module.require("xc.createjs.Filter");

    /**
     * Allows you to carry out complex color operations such as modifying saturation, brightness, or inverting. See the
     * {{#crossLink "ColorMatrix"}}{{/crossLink}} for more information on changing colors.
     *
     * See {{#crossLink "Filter"}}{{/crossLink}} for an example of how to apply filters.
     *
     * @class ColorMatrixFilter
     * @constructor
     * @extends Filter
     * @param {Array} matrix A 4x5 matrix describing the color operation to perform. See also the ColorMatrix class.
     */
    var ColorMatrixFilter = Filter.extend({
        initialize: function(matrix) {
            this.matrix = matrix;
        },

        matrix: null,

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
        applyFilter: function(ctx, x, y, width, height, targetCtx, targetX, targetY) {
            targetCtx = targetCtx || ctx;
            if (targetX == null) {
                targetX = x;
            }
            if (targetY == null) {
                targetY = y;
            }
            try {
                var imageData = ctx.getImageData(x, y, width, height);
            } catch (e) {
                //if (!this.suppressCrossDomainErrors) throw new Error("unable to access local image data: " + e);
                return false;
            }
            var data = imageData.data;
            var l = data.length;
            var r, g, b, a;
            var mtx = this.matrix;
            var m0 = mtx[0], m1 = mtx[1], m2 = mtx[2], m3 = mtx[3], m4 = mtx[4];
            var m5 = mtx[5], m6 = mtx[6], m7 = mtx[7], m8 = mtx[8], m9 = mtx[9];
            var m10 = mtx[10], m11 = mtx[11], m12 = mtx[12], m13 = mtx[13], m14 = mtx[14];
            var m15 = mtx[15], m16 = mtx[16], m17 = mtx[17], m18 = mtx[18], m19 = mtx[19];
            for ( var i = 0; i < l; i += 4) {
                r = data[i];
                g = data[i + 1];
                b = data[i + 2];
                a = data[i + 3];
                data[i] = r * m0 + g * m1 + b * m2 + a * m3 + m4; // red
                data[i + 1] = r * m5 + g * m6 + b * m7 + a * m8 + m9; // green
                data[i + 2] = r * m10 + g * m11 + b * m12 + a * m13 + m14; // blue
                data[i + 3] = r * m15 + g * m16 + b * m17 + a * m18 + m19; // alpha
            }
            imageData.data = data;
            targetCtx.putImageData(imageData, targetX, targetY);
            return true;
        },

        /**
         * Returns a string representation of this object.
         *
         * @method toString
         * @return {String} a string representation of the instance.
         */
        toString: function() {
            return "[ColorMatrixFilter]";
        },

        /**
         * Returns a clone of this ColorMatrixFilter instance.
         *
         * @method clone
         * @return {ColorMatrixFilter} A clone of the current ColorMatrixFilter instance.
         */
        clone: function() {
            return new ColorMatrixFilter(this.matrix);
        }
    });

    return ColorMatrixFilter;

});