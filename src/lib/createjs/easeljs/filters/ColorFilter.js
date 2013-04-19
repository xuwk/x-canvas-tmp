xc.module.define("xc.createjs.ColorFilter", function(exports) {

    var Filter = xc.module.require("xc.createjs.Filter");

    /**
     * 颜色转换滤镜。
     *
     * 想了解滤镜的使用，请查看{{#crossLink "Filter"}}{{/crossLink}}。
     *
     * @class ColorFilter
     * @constructor
     * @extends Filter
     * @param {Number} redMultiplier
     * @param {Number} greenMultiplier
     * @param {Number} blueMultiplier
     * @param {Number} alphaMultiplier
     * @param {Number} redOffset
     * @param {Number} greenOffset
     * @param {Number} blueOffset
     * @param {Number} alphaOffset
     */
    var ColorFilter = Filter.extend({
        initialize: function(redMultiplier, greenMultiplier, blueMultiplier, alphaMultiplier, redOffset, greenOffset, blueOffset, alphaOffset) {
            this.redMultiplier = redMultiplier != null ? redMultiplier : 1;
            this.greenMultiplier = greenMultiplier != null ? greenMultiplier : 1;
            this.blueMultiplier = blueMultiplier != null ? blueMultiplier : 1;
            this.alphaMultiplier = alphaMultiplier != null ? alphaMultiplier : 1;
            this.redOffset = redOffset || 0;
            this.greenOffset = greenOffset || 0;
            this.blueOffset = blueOffset || 0;
            this.alphaOffset = alphaOffset || 0;
        },

        /**
         * 红色通道乘数。
         *
         * @property redMultiplier
         * @type Number
         */
        redMultiplier: 1,

        /**
         * 绿色通道乘数。
         *
         * @property greenMultiplier
         * @type Number
         */
        greenMultiplier: 1,

        /**
         * 蓝色通道乘数。
         *
         * @property blueMultiplier
         * @type Number
         */
        blueMultiplier: 1,

        /**
         * alpha通道乘数。
         *
         * @property redMultiplier
         * @type Number
         */
        alphaMultiplier: 1,

        /**
         * 红色通道补偿（附加值）。
         *
         * @property redOffset
         * @type Number
         */
        redOffset: 0,

        /**
         * 绿色通道补偿（附加值）。
         *
         * @property greenOffset
         * @type Number
         */
        greenOffset: 0,

        /**
         * 蓝色通道补偿（附加值）。
         *
         * @property blueOffset
         * @type Number
         */
        blueOffset: 0,

        /**
         * alpha通道补偿（附加值）。
         *
         * @property alphaOffset
         * @type Number
         */
        alphaOffset: 0,

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
            for ( var i = 0; i < l; i += 4) {
                data[i] = data[i] * this.redMultiplier + this.redOffset;
                data[i + 1] = data[i + 1] * this.greenMultiplier + this.greenOffset;
                data[i + 2] = data[i + 2] * this.blueMultiplier + this.blueOffset;
                data[i + 3] = data[i + 3] * this.alphaMultiplier + this.alphaOffset;
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
            return "[ColorFilter]";
        },

        /**
         * 返回ColorFilter实例的克隆。
         *
         * @method clone
         * @return {ColorFilter} ColorFilter实例的克隆。
         */
        clone: function() {
            return new ColorFilter(this.redMultiplier, this.greenMultiplier, this.blueMultiplier, this.alphaMultiplier, this.redOffset, this.greenOffset, this.blueOffset, this.alphaOffset);
        }
    });

    return ColorFilter;

});