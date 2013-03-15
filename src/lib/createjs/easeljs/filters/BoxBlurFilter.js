xc.module.define("xc.createjs.BoxBlurFilter", function(exports) {

    var Rectangle = xc.module.require("xc.createjs.Rectangle");
    var Filter = xc.module.require("xc.createjs.Filter");

    /**
     * BoxBlurFilter把快速均值模糊应用到显示对象上。
     * 想了解滤镜的使用，请查看{{#crossLink "Filter"}}{{/crossLink}}。
     *
     * @class BoxBlurFilter
     * @extends Filter
     * @constructor
     * @param {Number} blurX
     * @param {Number} blurY
     * @param {Number} quality
     */
    var BoxBlurFilter = Filter.extend({
        initialize: function(blurX, blurY, quality) {
            if (isNaN(blurX) || blurX < 0) {
                blurX = 0;
            }
            this.blurX = blurX | 0;
            if (isNaN(blurY) || blurY < 0) {
                blurY = 0;
            }
            this.blurY = blurY | 0;
            if (isNaN(quality) || quality < 1) {
                quality = 1;
            }
            this.quality = quality | 0;
        },

        /**
         * 水平模糊半径
         *
         * @property blurX
         * @type Number
         */
        blurX: 0,

        /**
         * 垂直模糊半径
         *
         * @property blurY
         * @type Number
         */
        blurY: 0,

        /**
         * 模糊迭代次数。例如，值为1会产生一个僵硬的模糊效果。值为2会产生一个较为平滑的效果，不过也需要2倍的运算时间。
         *
         * @property quality
         * @type Number
         */
        quality: 1,

        /**
         * 返回一个绘制滤镜所需的边框宽度的长方形。例如，一个滤镜会向外扩展绘图区域左4个像素，右7个像素（上下不扩展），那么会返回一个（x=-4, y=0, width=11, height=0）的长方形。
         *
         * @method getBounds
         * @return {Rectangle} 一个绘制滤镜所需的边框宽度的长方形。
         */
        getBounds: function() {
            // TODO: 这个不作为模糊的质量。
            return new Rectangle(-this.blurX, -this.blurY, 2 * this.blurX, 2 * this.blurY);
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
            var radiusX = this.blurX;
            if (isNaN(radiusX) || radiusX < 0) {
                return false;
            }
            radiusX |= 0;
            var radiusY = this.blurY;
            if (isNaN(radiusY) || radiusY < 0) {
                return false;
            }
            radiusY |= 0;
            if (radiusX == 0 && radiusY == 0) {
                return false;
            }
            var iterations = this.quality;
            if (isNaN(iterations) || iterations < 1) {
                iterations = 1;
            }
            iterations |= 0;
            if (iterations > 3) {
                iterations = 3;
            }
            if (iterations < 1) {
                iterations = 1;
            }
            var pixels = imageData.data;
            var rsum, gsum, bsum, asum, x, y, i, p, p1, p2, yp, yi, yw;
            var wm = width - 1;
            var hm = height - 1;
            var rad1x = radiusX + 1;
            var divx = radiusX + rad1x;
            var rad1y = radiusY + 1;
            var divy = radiusY + rad1y;
            var div2 = 1 / (divx * divy);
            var r = [];
            var g = [];
            var b = [];
            var a = [];
            var vmin = [];
            var vmax = [];
            while (iterations-- > 0) {
                yw = yi = 0;
                for (y = 0; y < height; y++) {
                    rsum = pixels[yw] * rad1x;
                    gsum = pixels[yw + 1] * rad1x;
                    bsum = pixels[yw + 2] * rad1x;
                    asum = pixels[yw + 3] * rad1x;
                    for (i = 1; i <= radiusX; i++) {
                        p = yw + (((i > wm ? wm : i)) << 2);
                        rsum += pixels[p++];
                        gsum += pixels[p++];
                        bsum += pixels[p++];
                        asum += pixels[p]
                    }
                    for (x = 0; x < width; x++) {
                        r[yi] = rsum;
                        g[yi] = gsum;
                        b[yi] = bsum;
                        a[yi] = asum;
                        if (y == 0) {
                            vmin[x] = Math.min(x + rad1x, wm) << 2;
                            vmax[x] = Math.max(x - radiusX, 0) << 2;
                        }
                        p1 = yw + vmin[x];
                        p2 = yw + vmax[x];
                        rsum += pixels[p1++] - pixels[p2++];
                        gsum += pixels[p1++] - pixels[p2++];
                        bsum += pixels[p1++] - pixels[p2++];
                        asum += pixels[p1] - pixels[p2];
                        yi++;
                    }
                    yw += (width << 2);
                }
                for (x = 0; x < width; x++) {
                    yp = x;
                    rsum = r[yp] * rad1y;
                    gsum = g[yp] * rad1y;
                    bsum = b[yp] * rad1y;
                    asum = a[yp] * rad1y;
                    for (i = 1; i <= radiusY; i++) {
                        yp += (i > hm ? 0 : width);
                        rsum += r[yp];
                        gsum += g[yp];
                        bsum += b[yp];
                        asum += a[yp];
                    }
                    yi = x << 2;
                    for (y = 0; y < height; y++) {
                        pixels[yi] = (rsum * div2 + 0.5) | 0;
                        pixels[yi + 1] = (gsum * div2 + 0.5) | 0;
                        pixels[yi + 2] = (bsum * div2 + 0.5) | 0;
                        pixels[yi + 3] = (asum * div2 + 0.5) | 0;
                        if (x == 0) {
                            vmin[y] = Math.min(y + rad1y, hm) * width;
                            vmax[y] = Math.max(y - radiusY, 0) * width;
                        }
                        p1 = x + vmin[y];
                        p2 = x + vmax[y];
                        rsum += r[p1] - r[p2];
                        gsum += g[p1] - g[p2];
                        bsum += b[p1] - b[p2];
                        asum += a[p1] - a[p2];
                        yi += width << 2;
                    }
                }
            }
            targetCtx.putImageData(imageData, targetX, targetY);
            return true;
        },

        /**
         * 返回当前对象的克隆。
         *
         * @return {BoxBlurFilter}
         */
        clone: function() {
            return new BoxBlurFilter(this.blurX, this.blurY, this.quality);
        },

        /**
         * 返回一个当前对象的字符串表示。
         *
         * @return {String}
         */
        toString: function() {
            return "[BoxBlurFilter]";
        }
    });

    return BoxBlurFilter;

});