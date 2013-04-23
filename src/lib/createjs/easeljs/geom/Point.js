xc.module.define("xc.createjs.Point", function(exports) {

    /**
     * 代表一个在二维(X/Y)坐标系统上的点。
     *
     * <h4>样例</h4>
     *      var point = new Point(0, 100);
     *
     * @class Point
     * @constructor
     * @param {Number} [x=0] X 坐标位置。
     * @param {Number} [y=0] Y 坐标位置。
     */
    var Point = xc.class.create({
        initialize: function(x, y) {
            this.x = (x == null ? 0 : x);
            this.y = (y == null ? 0 : y);
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
         * 返回当前Point实例的克隆。
         *
         * @method clone
         * @return {Point} 当前Point实例的克隆。
         */
        clone: function() {
            return new Point(this.x, this.y);
        },

        /**
         * 返回当前对象的字符串表示。
         *
         * @method toString
         * @return {String} 当前实例的字符串表示。
         */
        toString: function() {
            return "[Point (x=" + this.x + " y=" + this.y + ")]";
        }
    });

    return Point;

});