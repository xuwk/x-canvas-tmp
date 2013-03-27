xc.module.define("xc.createjs.Filter", function(exports) {

    var Rectangle = xc.module.require("xc.createjs.Rectangle");

    /**
     * 所有滤镜需要继承的基类。滤镜需要应用在那些已经使用了{{#crossLink "DisplayObject/cache"}}{{/crossLink}}方法缓存的对象上。如果一个对象改变了，请再缓存一次，
     * 或者使用{{#crossLink "DisplayObject/updateCache"}}{{/crossLink}}来更新缓存。
     * 
     * <h4>样例</h4>
     *      myInstance.cache(0,0, 100, 100);
     *      myInstance.filters = [
     *          new createjs.ColorFilter(0, 0, 0, 1, 255, 0, 0),
     *          new createjs.BoxBlurFilter(5, 5, 10)
     *      ];
     *      
     * <h4>EaselJS 滤镜</h4>
     * EaselJS带来了一些预制的滤镜。注：独立的滤镜没有压缩在EaselJS的压缩版里面。想使用它们，你必须手动在HTML里加载它们。
     * <ul><li>{{#crossLink "AlphaMapFilter"}}{{/crossLink}}: 把一张灰度图片映射到一个显示对象的alpha通道上。</li>
     *      <li>{{#crossLink "AlphaMaskFilter"}}{{/crossLink}}: 把一张图片的alpha通道映射到一个显示对象的alpha通道上。</li>
     *      <li>{{#crossLink "BoxBlurFilter"}}{{/crossLink}}: 在一个显示对象上应用横向和纵向的快速均值模糊滤镜。</li>
     *      <li>{{#crossLink "ColorFilter"}}{{/crossLink}}: 转换一个显示对象的颜色。</li>
     *      <li>{{#crossLink "ColorMatrixFilter"}}{{/crossLink}}: 通过{{#crossLink "ColorMatrix"}}{{/crossLink}}转换一张图片。</li>
     * </ul>
     *
     * @class Filter
     * @constructor
     */
    var Filter = xc.class.create({

        /**
         * 返回一个绘制滤镜所需的边框宽度的长方形。例如，一个滤镜会向外扩展绘图区域左4个像素，右7个像素（上下不扩展），那么会返回一个（x=-4, y=0, width=11, height=0）的长方形。
         *
         * @method getBounds
         * @return {Rectangle} 一个绘制滤镜所需的边框宽度的长方形。
         */
        getBounds: function() {
            return new Rectangle(0, 0, 0, 0);
        },

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
        },

        /**
         * 返回一个表示当前对象的字符串。
         *
         * @method toString
         * @return {String} 一个表示当前对象的字符串。
         */
        toString: function() {
            return "[Filter]";
        },

        /**
         * 返回当前Filter实例的克隆。
         *
         * @method clone
         * @return {Filter} 当前Filter实例的克隆。
         */
        clone: function() {
            return new Filter();
        }
    });

    return Filter;

});