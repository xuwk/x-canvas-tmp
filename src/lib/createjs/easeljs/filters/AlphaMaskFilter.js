xc.module.define("xc.createjs.AlphaMaskFilter", function(exports) {

    var Filter = xc.module.require("xc.createjs.Filter");

    /**
     * 想了解滤镜的使用，请查看{{#crossLink "Filter"}}{{/crossLink}}。
     * 把遮罩图片（或canvas）的alpha通道应用到目标上，这样就可以从遮罩图片中导出结果的alpha通道，当前目标的RGB通道也会复制到结果的对应通道上。例如，可以用来给一个显示对象加蒙层。
     * 这个也可以用来合并一张压缩的带RGB通道的JPG图片和一张带alpha遮罩的PNG32图片，这样生成图片体积会比一张带ARGB通道的PNG32图片小得多。 
     * 
     * <b>重要提示: 这个滤镜现在还没法准确地支持targetCtx或targetX/Y参数。</b>
     * 想了解滤镜的使用，请查看{{#crossLink "Filter"}}{{/crossLink}}。
     *
     * @class AlphaMaskFilter
     * @extends Filter
     * @constructor
     * @param {Image} mask
     */
    var AlphaMaskFilter = Filter.extend({
        initialize: function(mask) {
            this.mask = mask;
        },

        /**
         * 作为遮罩使用的图片（或canvas）。
         *
         * @property mask
         * @type Image
         */
        mask: null,

        /**
         * 把滤镜应用到指定的上下文。<b>重要信息：<b>这个滤镜暂时无法准确地支持targetCtx或targetX/Y参数。
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
            if (!this.mask) {
                return true;
            }
            targetCtx = targetCtx || ctx;
            if (targetX == null) {
                targetX = x;
            }
            if (targetY == null) {
                targetY = y;
            }
            targetCtx.save();
            if (ctx != targetCtx) {
                // TODO: 支持targetCtx和targetX/Y的清空矩阵，然后把ctx画进去？
            }
            targetCtx.globalCompositeOperation = "destination-in";
            targetCtx.drawImage(this.mask, targetX, targetY);
            targetCtx.restore();
            return true;
        },

        /**
         * 返回当前对象的克隆。
         *
         * @return {AlphaMaskFilter}
         */
        clone: function() {
            return new AlphaMaskFilter(this.mask);
        },

        /**
         * 返回一个当前对象的字符串表示。
         *
         * @return {String} 一个当前对象的字符串表示。
         */
        toString: function() {
            return "[AlphaMaskFilter]";
        }
    });

    return AlphaMaskFilter;

});