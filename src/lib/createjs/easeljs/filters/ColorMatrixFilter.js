xc.module.define("xc.createjs.ColorMatrixFilter", function(exports) {

    var Filter = xc.module.require("xc.createjs.Filter");

    /**
     * 允许你抛开复杂的颜色操作如：修改饱和度、亮度或反转颜色。
     * 
     * 查看{{#crossLink "ColorMatrix"}}{{/crossLink}}了解更多颜色转换的信息。
     *
     * 想了解滤镜的使用，请查看{{#crossLink "Filter"}}{{/crossLink}}。
     *
     * @class ColorMatrixFilter
     * @constructor
     * @extends Filter
     * @param {Array} matrix 一个待转换颜色的4×5矩阵。请查看ColorMatrix类。
     */
    var ColorMatrixFilter = Filter.extend({
        initialize: function(matrix) {
            this.matrix = matrix;
        },

        matrix: null,

        /**
         * 把滤镜应用到指定的上下文。
         *
         * @method applyFilter
         * @param {CanvasRenderingContext2D} ctx 用作资源的2D上下文。
         * @param {Number} x 应用到资源矩阵的x坐标值。
         * @param {Number} y 应用到资源矩阵的y坐标值。
         * @param {Number} width 应用到资源矩阵的宽度。
         * @param {Number} height 应用到资源矩阵的高度。
         * @param {CanvasRenderingContext2D} targetCtx 可选。绘制结果的2D上下文。默认为ctx代表的上下文。
         * @param {Number} targetX 可选。绘制结果的x坐标值。默认为x传递的坐标值。
         * @param {Number} targetY 可选。绘制结果的y坐标值。默认为y传递的坐标值。
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
         * 返回当前对象的字符串表示。
         *
         * @method toString
         * @return {String} 当前对象的字符串表示。
         */
        toString: function() {
            return "[ColorMatrixFilter]";
        },

        /**
         * 返回当前ColorMatrixFilter实例的克隆。
         *
         * @method clone
         * @return {ColorMatrixFilter} 当前ColorMatrixFilter实例的克隆。
         */
        clone: function() {
            return new ColorMatrixFilter(this.matrix);
        }
    });

    return ColorMatrixFilter;

});