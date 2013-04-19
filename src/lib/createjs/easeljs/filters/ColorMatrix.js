xc.module.define("xc.createjs.ColorMatrix", function(exports) {

    /**
     * 提供一些帮助组装矩阵给{{#crossLink "ColorMatrixFilter"}}{{/crossLink}}使用的方法，或者可以作为那个直接给ColorMatrixFilter使用的矩阵。
     * 大部分的方法返回当前实例以便提供链式的调用。
     * 
     * <h4>样例</h4>
     *     myColorMatrix.adjustHue(20).adjustBrightness(50);
     * 想了解滤镜的使用，请查看{{#crossLink "Filter"}}{{/crossLink}}。
     *
     * @class ColorMatrix
     * @constructor
     * @extends Array
     * @param {Number} brightness
     * @param {Number} contrast
     * @param {Number} saturation
     * @param {Number} hue
     */
    var ColorMatrix =
    xc.class.create({
        initialize: function(brightness, contrast, saturation, hue) {
            this.reset();
            this.adjustColor(brightness, contrast, saturation, hue);
            return this;
        },

        /**
         * 把当前矩阵重置为单位矩阵。
         *
         * @method reset
         * @return {ColorMatrix} 当前方法调用的ColorMatrix实例（用来链式调用的）。
         */
        reset: function() {
            return this.copyMatrix(ColorMatrix.IDENTITY_MATRIX);
        },

        /**
         * 调节亮度、对比度、饱和度、色调的快捷方法。与调用adjustHue(色调), adjustContrast(对比度),
         * adjustBrightness(亮度), adjustSaturation(饱和度)等效。
         *
         * @param {Number} brightness
         * @param {Number} contrast
         * @param {Number} saturation
         * @param {Number} hue
         * @return {ColorMatrix} 当前方法调用的ColorMatrix实例（用来链式调用的）。
         */
        adjustColor: function(brightness, contrast, saturation, hue) {
            this.adjustHue(hue);
            this.adjustContrast(contrast);
            this.adjustBrightness(brightness);
            return this.adjustSaturation(saturation);
        },

        /**
         * 通过给每个像素的红绿蓝通道调整数值来调整亮度。正数会使图片亮度增大，负数会转暗。
         *
         * @param {Number} value 加到RGB通道的值，值域为-255至255。
         * @return {ColorMatrix} 当前方法调用的ColorMatrix实例（用来链式调用的）。
         */
        adjustBrightness: function(value) {
            if (value == 0 || isNaN(value)) {
                return this;
            }
            value = this._cleanValue(value, 255);
            this._multiplyMatrix([1, 0, 0, 0, value, 0, 1, 0, 0, value, 0, 0, 1, 0, value, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1]);
            return this;
        },

        /**
         * 调整像素颜色的对比度。正数会提高对比度，负数则会降低。
         *
         * @param {Number} value 一个介于-100和100之间的值。
         * @return {ColorMatrix} 当前方法调用的ColorMatrix实例（用来链式调用的）。
         */
        adjustContrast: function(value) {
            if (value == 0 || isNaN(value)) {
                return this;
            }
            value = this._cleanValue(value, 100);
            var x;
            if (value < 0) {
                x = 127 + value / 100 * 127;
            } else {
                x = value % 1;
                if (x == 0) {
                    x = ColorMatrix.DELTA_INDEX[value];
                } else {
                    x = ColorMatrix.DELTA_INDEX[(value << 0)] * (1 - x) + ColorMatrix.DELTA_INDEX[(value << 0) + 1] * x; // 使用线性插值来提供更大的粒度。
                }
                x = x * 127 + 127;
            }
            this._multiplyMatrix([x / 127, 0, 0, 0, 0.5 * (127 - x), 0, x / 127, 0, 0, 0.5 * (127 - x), 0, 0, x / 127, 0, 0.5 * (127 - x), 0, 0, 0, 1, 0, 0, 0, 0, 0, 1]);
            return this;
        },

        /**
         * 调整像素的颜色饱和度。正数提高饱和度，负数减低饱和度（趋向灰度）。
         *
         * @param {Number} value 一个介于-100和100之间的值。
         * @return {ColorMatrix} 当前方法调用的ColorMatrix实例（用来链式调用的）。
         */
        adjustSaturation: function(value) {
            if (value == 0 || isNaN(value)) {
                return this;
            }
            value = this._cleanValue(value, 100);
            var x = 1 + ((value > 0) ? 3 * value / 100 : value / 100);
            var lumR = 0.3086;
            var lumG = 0.6094;
            var lumB = 0.0820;
            this._multiplyMatrix([lumR * (1 - x) + x, lumG * (1 - x), lumB * (1 - x), 0, 0, lumR * (1 - x), lumG * (1 - x) + x, lumB * (1 - x), 0, 0, lumR * (1 - x), lumG * (1 - x),
            lumB * (1 - x) + x, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1]);
            return this;
        },

        /**
         * 调整像素颜色的色调。
         *
         * @param {Number} value 一个介于-180和180之间的值。
         * @return {ColorMatrix} 当前方法调用的ColorMatrix实例（用来链式调用的）。
         */
        adjustHue: function(value) {
            if (value == 0 || isNaN(value)) {
                return this;
            }
            value = this._cleanValue(value, 180) / 180 * Math.PI;
            var cosVal = Math.cos(value);
            var sinVal = Math.sin(value);
            var lumR = 0.213;
            var lumG = 0.715;
            var lumB = 0.072;
            this._multiplyMatrix([lumR + cosVal * (1 - lumR) + sinVal * (-lumR), 
                                  lumG + cosVal * (-lumG) + sinVal * (-lumG), 
                                  lumB + cosVal * (-lumB) + sinVal * (1 - lumB), 0, 0,
                                  lumR + cosVal * (-lumR) + sinVal * (0.143), 
                                  lumG + cosVal * (1 - lumG) + sinVal * (0.140), 
                                  lumB + cosVal * (-lumB) + sinVal * (-0.283), 0, 0,
                                  lumR + cosVal * (-lumR) + sinVal * (-(1 - lumR)), 
                                  lumG + cosVal * (-lumG) + sinVal * (lumG), 
                                  lumB + cosVal * (1 - lumB) + sinVal * (lumB), 
                                  0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1]);
            return this;
        },

        /**
         * 把指定的矩阵合并到当前矩阵。
         *
         * @param {Array} matrix 一个数组或者ColorMatrix的实例。
         * @return {ColorMatrix} 当前方法调用的ColorMatrix实例（用来链式调用的）。
         */
        concat: function(matrix) {
            matrix = this._fixMatrix(matrix);
            if (matrix.length != ColorMatrix.LENGTH) {
                return this;
            }
            this._multiplyMatrix(matrix);
            return this;
        },

        /**
         * 返回当前ColorMatrix的克隆。
         *
         * @return {ColorMatrix} 当前ColorMatrix的克隆。
         */
        clone: function() {
            return new ColorMatrix(this);
        },

        /**
         * 返回一个包含当前矩阵值的长度为25的数组。
         * @return {Array} 包含当前矩阵值的数组。
         */
        toArray: function() {
            return this.slice(0, ColorMatrix.LENGTH);
        },

        /**
         * 把指定矩阵的值复制到当前矩阵。
         *
         * @param {Array} matrix 一个数组或者ColorMatrix的实例。
         * @return {ColorMatrix} 当前方法调用的ColorMatrix实例（用来链式调用的）。
         */
        copyMatrix: function(matrix) {
            var l = ColorMatrix.LENGTH;
            for ( var i = 0; i < l; i++) {
                this[i] = matrix[i];
            }
            return this;
        },

        /**
         * @method _multiplyMatrix
         * @protected
         */
        _multiplyMatrix: function(matrix) {
            var col = [];
            for ( var i = 0; i < 5; i++) {
                for ( var j = 0; j < 5; j++) {
                    col[j] = this[j + i * 5];
                }
                for ( var j = 0; j < 5; j++) {
                    var val = 0;
                    for ( var k = 0; k < 5; k++) {
                        val += matrix[j + k * 5] * col[k];
                    }
                    this[j + i * 5] = val;
                }
            }
        },

        /**
         * 确保传递的值在指定的范围内，色调的上限是180，亮度是255，其他是100。
         *
         * @method _cleanValue
         * @protected
         */
        _cleanValue: function(value, limit) {
            return Math.min(limit, Math.max(-limit, value));
        },

        /**
         * 确保矩阵是5×5（长度25）的。
         *
         * @method _fixMatrix
         * @protected
         */
        _fixMatrix: function(matrix) {
            if (matrix instanceof ColorMatrix) {
                matrix = matrix.slice(0);
            }
            if (matrix.length < ColorMatrix.LENGTH) {
                matrix = matrix.slice(0, matrix.length).concat(ColorMatrix.IDENTITY_MATRIX.slice(matrix.length, ColorMatrix.LENGTH));
            } else if (matrix.length > ColorMatrix.LENGTH) {
                matrix = matrix.slice(0, ColorMatrix.LENGTH);
            }
            return matrix;
        }
    });

    /**
     * 对比度计算的差值数组。
     *
     * @property DELTA_INDEX
     * @type Array
     * @static
     */
    ColorMatrix.DELTA_INDEX =
    [0, 0.01, 0.02, 0.04, 0.05, 0.06, 0.07, 0.08, 0.1, 0.11, 0.12, 0.14, 0.15, 0.16, 0.17, 0.18, 0.20, 0.21, 0.22, 0.24, 0.25, 0.27, 0.28, 0.30, 0.32, 0.34, 0.36, 0.38, 0.40, 0.42, 0.44, 0.46, 0.48,
    0.5, 0.53, 0.56, 0.59, 0.62, 0.65, 0.68, 0.71, 0.74, 0.77, 0.80, 0.83, 0.86, 0.89, 0.92, 0.95, 0.98, 1.0, 1.06, 1.12, 1.18, 1.24, 1.30, 1.36, 1.42, 1.48, 1.54, 1.60, 1.66, 1.72, 1.78, 1.84, 1.90,
    1.96, 2.0, 2.12, 2.25, 2.37, 2.50, 2.62, 2.75, 2.87, 3.0, 3.2, 3.4, 3.6, 3.8, 4.0, 4.3, 4.7, 4.9, 5.0, 5.5, 6.0, 6.5, 6.8, 7.0, 7.3, 7.5, 7.8, 8.0, 8.4, 8.7, 9.0, 9.4, 9.6, 9.8, 10.0];

    /**
     * 单位颜色矩阵。
     *
     * @property IDENTITY_MATRIX
     * @type Array
     * @static
     */
    ColorMatrix.IDENTITY_MATRIX = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1];

    /**
     * 颜色矩阵的长度。
     *
     * @property LENGTH
     * @type Number
     * @static
     */
    ColorMatrix.LENGTH = ColorMatrix.IDENTITY_MATRIX.length;

    return ColorMatrix;

});
