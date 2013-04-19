xc.module.define("xc.createjs.Matrix2D", function(exports) {

    /**
     * 代表一个仿射的变换矩阵，并提供了一些构造和合并矩阵的工具。
     *
     * @class Matrix2D
     * @constructor
     * @param {Number} a 为一个新的矩阵指定一个a属性。
     * @param {Number} b 为一个新的矩阵指定一个b属性。
     * @param {Number} c 为一个新的矩阵指定一个c属性。
     * @param {Number} d 为一个新的矩阵指定一个d属性。
     * @param {Number} tx 为一个新的矩阵指定一个tx属性。
     * @param {Number} ty 为一个新的矩阵指定一个ty属性。
     */
    var Matrix2D = xc.class.create({
        initialize: function(a, b, c, d, tx, ty) {
            if (a != null) {
                this.a = a;
            }
            this.b = b || 0;
            this.c = c || 0;
            if (d != null) {
                this.d = d;
            }
            this.tx = tx || 0;
            this.ty = ty || 0;
            return this;
        },

        /**
         * 在3×3仿射变换矩阵中（0, 0）位置的值。
         *
         * @property a
         * @type Number
         */
        a: 1,

        /**
         * 在3×3仿射变换矩阵中（0, 1）位置的值。
         *
         * @property b
         * @type Number
         */
        b: 0,

        /**
         * 在3×3仿射变换矩阵中（1, 0）位置的值。
         *
         * @property c
         * @type Number
         */
        c: 0,

        /**
         * 在3×3仿射变换矩阵中（1, 1）位置的值。
         *
         * @property d
         * @type Number
         */
        d: 1,

        /**
         * 在3×3仿射变换矩阵中（2, 0）位置的值。
         *
         * @property atx
         * @type Number
         */
        tx: 0,

        /**
         * 在3×3仿射变换矩阵中（2, 1）位置的值。
         *
         * @property ty
         * @type Number
         */
        ty: 0,

        /**
         * 该属性代表了一个显示对象的透明度。这不是矩阵操作的一部分，但是会在类似getConcatenatedMatrix等方法里面提供合并后的透明度值。
         *
         * @property alpha
         * @type Number
         */
        alpha: 1,

        /**
         * 该属性代表了一个显示对象的阴影值。这不是矩阵操作的一部分，但是会在类似getConcatenatedMatrix等方法里面提供合并后的阴影值。
         *
         * @property shadow
         * @type Shadow
         */
        shadow: null,

        /**
         * 该属性代表了一个显示对象的组合操作。这不是矩阵操作的一部分，但是会在类似getConcatenatedMatrix等方法里面提供合并的组合操作。
         * 你可以在下面的地址里面找到一个组合操作的列表：
         * <a href="https://developer.mozilla.org/zh-CN/docs/Canvas_tutorial/Compositing">https://developer.mozilla.org/zh-CN/docs/Canvas_tutorial/Compositing</a>
         *
         * @property compositeOperation
         * @type String
         */
        compositeOperation: null,

        /**
         * 通过将当前矩阵对象与另一个矩阵相乘来追加一个矩阵。要求提供所有参数的值。
         *
         * @method prepend
         * @param {Number} a
         * @param {Number} b
         * @param {Number} c
         * @param {Number} d
         * @param {Number} tx
         * @param {Number} ty
         * @return {Matrix2D} 当前矩阵。这个在链式方法调用上使用。
         */
        prepend: function(a, b, c, d, tx, ty) {
            var tx1 = this.tx;
            if (a != 1 || b != 0 || c != 0 || d != 1) {
                var a1 = this.a;
                var c1 = this.c;
                this.a = a1 * a + this.b * c;
                this.b = a1 * b + this.b * d;
                this.c = c1 * a + this.d * c;
                this.d = c1 * b + this.d * d;
            }
            this.tx = tx1 * a + this.ty * c + tx;
            this.ty = tx1 * b + this.ty * d + ty;
            return this;
        },

        /**
         * 通过另一个矩阵与当前矩阵相乘来附加一个矩阵。要求提供所有参数的值。
         *
         * @method append
         * @param {Number} a
         * @param {Number} b
         * @param {Number} c
         * @param {Number} d
         * @param {Number} tx
         * @param {Number} ty
         * @return {Matrix2D} 当前矩阵。这个在链式方法调用上使用。
         */
        append: function(a, b, c, d, tx, ty) {
            var a1 = this.a;
            var b1 = this.b;
            var c1 = this.c;
            var d1 = this.d;
            this.a = a * a1 + b * c1;
            this.b = a * b1 + b * d1;
            this.c = c * a1 + d * c1;
            this.d = c * b1 + d * d1;
            this.tx = tx * a1 + ty * c1 + this.tx;
            this.ty = tx * b1 + ty * d1 + this.ty;
            return this;
        },

        /**
         * 把一个指定矩阵追加到当前矩阵上。
         *
         * @method prependMatrix
         * @param {Matrix2D} matrix
         * @return {Matrix2D} 当前矩阵。这个在链式方法调用上使用。
         */
        prependMatrix: function(matrix) {
            this.prepend(matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty);
            this.prependProperties(matrix.alpha, matrix.shadow, matrix.compositeOperation);
            return this;
        },

        /**
         * 把一个指定矩阵附加到当前矩阵上。
         *
         * @method appendMatrix
         * @param {Matrix2D} matrix
         * @return {Matrix2D} 当前矩阵。这个在链式方法调用上使用。
         */
        appendMatrix: function(matrix) {
            this.append(matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty);
            this.appendProperties(matrix.alpha, matrix.shadow, matrix.compositeOperation);
            return this;
        },

        /**
         * 把指定的矩阵属性追加到当前矩阵上，该矩阵由指定的显示对象中的转换属性组成。
         * 例如，你可以使用以下方式从一个显示对象上生成一个矩阵：
         * var o = new DisplayObject();
         * var mtx = new Matrix2D();
         * mtx.prependTransform(o.x, o.y, o.scaleX, o.scaleY, o.rotation);
         *
         * @method prependTransform
         * @param {Number} x
         * @param {Number} y
         * @param {Number} scaleX
         * @param {Number} scaleY
         * @param {Number} rotation
         * @param {Number} skewX
         * @param {Number} skewY
         * @param {Number} regX 可选。
         * @param {Number} regY 可选。
         * @return {Matrix2D} 当前矩阵。这个在链式方法调用上使用。
         */
        prependTransform: function(x, y, scaleX, scaleY, rotation, skewX, skewY, regX, regY) {
            if (rotation % 360) {
                var r = rotation * Matrix2D.DEG_TO_RAD;
                var cos = Math.cos(r);
                var sin = Math.sin(r);
            } else {
                cos = 1;
                sin = 0;
            }
            if (regX || regY) {
                // 把偏移值计算上
                this.tx -= regX;
                this.ty -= regY;
            }
            if (skewX || skewY) {
                // TODO: 这个能不能合并为单一的追加操作？
                skewX *= Matrix2D.DEG_TO_RAD;
                skewY *= Matrix2D.DEG_TO_RAD;
                this.prepend(cos * scaleX, sin * scaleX, -sin * scaleY, cos * scaleY, 0, 0);
                this.prepend(Math.cos(skewY), Math.sin(skewY), -Math.sin(skewX), Math.cos(skewX), x, y);
            } else {
                this.prepend(cos * scaleX, sin * scaleX, -sin * scaleY, cos * scaleY, x, y);
            }
            return this;
        },

        /**
         * 把指定的矩阵属性附加到当前矩阵上，该矩阵由指定的显示对象中的转换属性组成。
         * 例如，你可以使用以下方式从一个显示对象上生成一个矩阵：
         * var o = new DisplayObject();
         * var mtx = new Matrix2D();
         * mtx.appendTransform(o.x, o.y, o.scaleX, o.scaleY, o.rotation);
         * 
         * @method appendTransform
         * @param {Number} x
         * @param {Number} y
         * @param {Number} scaleX
         * @param {Number} scaleY
         * @param {Number} rotation
         * @param {Number} skewX
         * @param {Number} skewY
         * @param {Number} regX 可选。
         * @param {Number} regY 可选。
         * @return {Matrix2D} 当前矩阵。这个在链式方法调用上使用。
         */
        appendTransform: function(x, y, scaleX, scaleY, rotation, skewX, skewY, regX, regY) {
            if (rotation % 360) {
                var r = rotation * Matrix2D.DEG_TO_RAD;
                var cos = Math.cos(r);
                var sin = Math.sin(r);
            } else {
                cos = 1;
                sin = 0;
            }
            if (skewX || skewY) {
                // TODO: 这个能不能合并为单一的附加操作？
                skewX *= Matrix2D.DEG_TO_RAD;
                skewY *= Matrix2D.DEG_TO_RAD;
                this.append(Math.cos(skewY), Math.sin(skewY), -Math.sin(skewX), Math.cos(skewX), x, y);
                this.append(cos * scaleX, sin * scaleX, -sin * scaleY, cos * scaleY, 0, 0);
            } else {
                this.append(cos * scaleX, sin * scaleX, -sin * scaleY, cos * scaleY, x, y);
            }
            if (regX || regY) {
             // 把偏移值计算上
                this.tx -= regX * this.a + regY * this.c;
                this.ty -= regX * this.b + regY * this.d;
            }
            return this;
        },

        /**
         * 对指定的矩阵作旋转操作。
         *
         * @method rotate
         * @param {Number} angle 角度。
         * @return {Matrix2D} 当前矩阵。这个在链式方法调用上使用。
         */
        rotate: function(angle) {
            var cos = Math.cos(angle);
            var sin = Math.sin(angle);
            var c1 = this.c;
            var tx1 = this.tx;
            this.a = a1 * cos - this.b * sin;
            this.b = a1 * sin + this.b * cos;
            this.c = c1 * cos - this.d * sin;
            this.d = c1 * sin + this.d * cos;
            this.tx = tx1 * cos - this.ty * sin;
            this.ty = tx1 * sin + this.ty * cos;
            return this;
        },

        /**
         * 对指定的矩阵作倾斜操作。
         *
         * @method skew
         * @param {Number} skewX 水平倾斜的角度。
         * @param {Number} skewY 垂直倾斜的角度。
         * @return {Matrix2D} 当前矩阵。这个在链式方法调用上使用。
         */
        skew: function(skewX, skewY) {
            skewX = skewX * Matrix2D.DEG_TO_RAD;
            skewY = skewY * Matrix2D.DEG_TO_RAD;
            this.append(Math.cos(skewY), Math.sin(skewY), -Math.sin(skewX), Math.cos(skewX), 0, 0);
            return this;
        },

        /**
         * 对指定矩阵作缩放操作。
         *
         * @method scale
         * @param {Number} x
         * @param {Number} y
         * @return {Matrix2D} 当前矩阵。这个在链式方法调用上使用。
         */
        scale: function(x, y) {
            this.a *= x;
            this.d *= y;
            this.tx *= x;
            this.ty *= y;
            return this;
        },

        /**
         * 在xy轴上对矩阵作移位操作。
         *
         * @method translate
         * @param {Number} x
         * @param {Number} y
         * @return {Matrix2D} 当前矩阵。这个在链式方法调用上使用。
         */
        translate: function(x, y) {
            this.tx += x;
            this.ty += y;
            return this;
        },

        /**
         * 把当前矩阵的属性值设置为单位矩阵的属性值。
         *
         * @method identity
         * @return {Matrix2D} 当前矩阵。这个在链式方法调用上使用。
         */
        identity: function() {
            this.alpha = this.a = this.d = 1;
            this.b = this.c = this.tx = this.ty = 0;
            this.shadow = this.compositeOperation = null;
            return this;
        },

        /**
         * 把当前矩阵翻转，使它转换到完全相反的位置上。
         * @method invert
         * @return {Matrix2D} 当前矩阵。这个在链式方法调用上使用。
         */
        invert: function() {
            var a1 = this.a;
            var b1 = this.b;
            var c1 = this.c;
            var d1 = this.d;
            var tx1 = this.tx;
            var n = a1 * d1 - b1 * c1;
            this.a = d1 / n;
            this.b = -b1 / n;
            this.c = -c1 / n;
            this.d = a1 / n;
            this.tx = (c1 * this.ty - d1 * tx1) / n;
            this.ty = -(a1 * this.ty - b1 * tx1) / n;
            return this;
        },

        /**
         * 判断当前矩阵是否为单位矩阵。
         *
         * @method isIdentity
         * @return {Boolean}
         */
        isIdentity: function() {
            return this.tx == 0 && this.ty == 0 && this.a == 1 && this.b == 0 && this.c == 0 && this.d == 1;
        },

        /**
         * 把当前矩阵拆分为变换属性(x, y, scaleX, scaleY, 和 rotation)。注意：这些值可能不会与你过去生成的矩阵的属性值一致，虽然他们产生的视觉效果可能是一样的。
         *
         * @method decompose
         * @param {Object} target 需要进行拆分的对象。如果为空，则返回一个新创建的对象。
         * @return {Matrix2D} 当前矩阵。这个在链式方法调用上使用。
         */
        decompose: function(target) {
            // TODO: 如果能够仅仅把矩阵拆分为缩放或旋转属性，那就很好了。
            if (target == null) {
                target = {};
            }
            target.x = this.tx;
            target.y = this.ty;
            target.scaleX = Math.sqrt(this.a * this.a + this.b * this.b);
            target.scaleY = Math.sqrt(this.c * this.c + this.d * this.d);
            var skewX = Math.atan2(-this.c, this.d);
            var skewY = Math.atan2(this.b, this.a);
            if (skewX == skewY) {
                target.rotation = skewY / Matrix2D.DEG_TO_RAD;
                if (this.a < 0 && this.d >= 0) {
                    target.rotation += (target.rotation <= 0) ? 180 : -180;
                }
                target.skewX = target.skewY = 0;
            } else {
                target.skewX = skewX / Matrix2D.DEG_TO_RAD;
                target.skewY = skewY / Matrix2D.DEG_TO_RAD;
            }
            return target;
        },

        /**
         * 把当前矩阵的所有属性值重新初始化成指定值。
         *
         * @method appendProperties
         * @param {Number} a
         * @param {Number} b
         * @param {Number} c
         * @param {Number} d
         * @param {Number} tx
         * @param {Number} ty
         * @param {Number} alpha 透明度。
         * @param {Shadow} shadow 阴影值。
         * @param {String} compositeOperation 组合操作
         * @return {Matrix2D} 当前矩阵。这个在链式方法调用上使用。
         */
        reinitialize: function(a, b, c, d, tx, ty, alpha, shadow, compositeOperation) {
            this._init(a, b, c, d, tx, ty);
            this.alpha = alpha || 1;
            this.shadow = shadow;
            this.compositeOperation = compositeOperation;
            return this;
        },

        /**
         * 把指定的视觉属性附加到当前矩阵上。
         *
         * @method appendProperties
         * @param {Number} alpha 透明度。
         * @param {Shadow} shadow 阴影值。
         * @param {String} compositeOperation 组合操作。
         * @return {Matrix2D} 当前矩阵。这个在链式方法调用上使用。
         */
        appendProperties: function(alpha, shadow, compositeOperation) {
            this.alpha *= alpha;
            this.shadow = shadow || this.shadow;
            this.compositeOperation = compositeOperation || this.compositeOperation;
            return this;
        },

        /**
         * 把指定的视觉属性追加到当前矩阵前。
         *
         * @method prependProperties
         * @param {Number} alpha 透明度。
         * @param {Shadow} shadow 阴影值。
         * @param {String} compositeOperation 组合操作。
         * @return {Matrix2D} 当前矩阵。这个在链式方法调用上使用。
         */
        prependProperties: function(alpha, shadow, compositeOperation) {
            this.alpha *= alpha;
            this.shadow = this.shadow || shadow;
            this.compositeOperation = this.compositeOperation || compositeOperation;
            return this;
        },

        /**
         * 返回当前矩阵的克隆实例。
         *
         * @method clone
         * @return {Matrix2D} 克隆的矩阵实例。
         */
        clone: function() {
            var mtx = new Matrix2D(this.a, this.b, this.c, this.d, this.tx, this.ty);
            mtx.shadow = this.shadow;
            mtx.alpha = this.alpha;
            mtx.compositeOperation = this.compositeOperation;
            return mtx;
        },

        /**
         * 返回当前对象的字符串表示。
         *
         * @method toString
         * @return {String} 当前实例的字符串表示。
         */
        toString: function() {
            return "[Matrix2D (a=" + this.a + " b=" + this.b + " c=" + this.c + " d=" + this.d + " tx=" + this.tx + " ty=" + this.ty + ")]";
        }
    });

    /**
     * 只读。把角度转化成弧度的乘数。在Matrix2D内部使用。
     *
     * @property DEG_TO_RAD
     * @static
     * @final
     * @type Number
     */
    Matrix2D.DEG_TO_RAD = Math.PI / 180;

    /**
     * 只读。一个单位矩阵，代表了一个未经变换的矩阵。
     *
     * @property identity
     * @static
     * @type Matrix2D
     */
    Matrix2D.identity = new Matrix2D(1, 0, 0, 1, 0, 0);

    return Matrix2D;

});