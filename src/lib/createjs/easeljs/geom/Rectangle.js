xc.module.define("xc.createjs.Rectangle", function(exports) {

    /**
     * 代表一个起始点为(x, y)、宽为width、高为height的矩形。
     *
     * <h4>样例</h4>
     *     var rect = new Rectangle(0, 0, 100, 100);
     *
     * @class Rectangle
     * @constructor
     * @param {Number} [x=0] X 坐标位置。
     * @param {Number} [y=0] Y 坐标位置。
     * @param {Number} [width=0] 矩形的宽。
     * @param {Number} [height=0] 矩形的高。
     */
    var Rectangle = xc.class.create({
        initialize: function(x, y, width, height) {
            this.x = (x == null ? 0 : x);
            this.y = (y == null ? 0 : y);
            this.width = (width == null ? 0 : width);
            this.height = (height == null ? 0 : height);
        },

        /**
         * X 坐标位置。
         *
         * @property x
         * @type Number
         */
        x: 0,

        /**
         * Y 坐标位置。
         *
         * @property y
         * @type Number
         */
        y: 0,

        /**
         * 宽度。
         *
         * @property width
         * @type Number
         */
        width: 0,

        /**
         * 高度。
         *
         * @property height
         * @type Number
         */
        height: 0,

        /**
         * 返回一个矩形实例的克隆。
         *
         * @method clone
         * @return {Rectangle} 一个矩形实例的克隆。
         */
        clone: function() {
            return new Rectangle(this.x, this.y, this.width, this.height);
        },

        /**
         * 返回当前实例的字符串表示。
         *
         * @method toString
         * @return {String} 当前实例的字符串表示。
         */
        toString: function() {
            return "[Rectangle (x=" + this.x + " y=" + this.y + " width=" + this.width + " height=" + this.height + ")]";
        }
    });

    return Rectangle;

});