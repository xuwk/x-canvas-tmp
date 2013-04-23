xc.module.define("xc.createjs.AlphaMapFilter", function(exports) {

    var Filter = xc.module.require("xc.createjs.Filter");

    /**
     * 把一张灰度alpha图片（或canvas）应用到目标上，这样图片的红色通道会复制到输出结果的alpha通道上，当前目标的RGB通道也会复制到结果的对应通道上。
     * 
     * 一般来说，推荐你使用{{#crossLink "AlphaMaskFilter"}}{{/crossLink}}，因为它的效率高很多。
     * 想了解滤镜的使用，请查看{{#crossLink "Filter"}}{{/crossLink}}。
     *
     * @class AlphaMapFilter
     * @extends Filter
     * @constructor
     * @param {Image} alphaMap 被用作输出结果alpha值的灰度图片。尺寸要跟目标完全一致。
     */
    var AlphaMapFilter = Filter.extend({
        initialize: function(alphaMap) {
            this.alphaMap = alphaMap;
        },

        /**
         * 被用作输出结果alpha值的灰度图片。尺寸要跟目标完全一致。
         *
         * @property alphaMap
         * @type Image
         */
        alphaMap: null,

        _alphaMap: null,
        _mapData: null,

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
            if (!this.alphaMap) {
                return true;
            }
            if (!this._prepAlphaMap()) {
                return false;
            }
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
                return false;
            }
            var data = imageData.data;
            var map = this._mapData;
            var l = data.length;
            for ( var i = 0; i < l; i += 4) {
                data[i + 3] = map[i] || 0;
            }
            imageData.data = data;
            targetCtx.putImageData(imageData, targetX, targetY);
            return true;
        },

        /**
         * 返回当前对象的克隆。
         *
         * @return {AlphaMapFilter} 当前AlphaMapFilter实例的克隆。
         */
        clone: function() {
            return new AlphaMapFilter(this.mask);
        },

        /**
         * 返回一个当前对象的字符串表示。
         *
         * @return {String} 一个当前对象的字符串表示。
         */
        toString: function() {
            return "[AlphaMapFilter]";
        },

        _prepAlphaMap: function() {
            if (!this.alphaMap) {
                return false;
            }
            if (this.alphaMap == this._alphaMap && this._mapData) {
                return true;
            }
            this._mapData = null;
            var map = this._alphaMap = this.alphaMap;
            var canvas = map;
            if (map instanceof HTMLCanvasElement) {
                ctx = canvas.getContext("2d");
            } else {
                canvas = document.createElement("canvas");
                canvas.width = map.width;
                canvas.height = map.height;
                ctx = canvas.getContext("2d");
                ctx.drawImage(map, 0, 0);
            }
            try {
                var imgData = ctx.getImageData(0, 0, map.width, map.height);
            } catch (e) {
                return false;
            }
            this._mapData = imgData.data;
            return true;
        }
    });

    return AlphaMapFilter;

});