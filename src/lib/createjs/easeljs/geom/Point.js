xc.module.define("xc.createjs.Point", function(exports) {

    /**
     * Represents a point on a 2 dimensional x / y coordinate system.
     *
     * <h4>Example</h4>
     *     var point = new Point(0, 100);
     *
     * @class Point
     * @constructor
     * @param {Number} [x=0] X position.
     * @param {Number} [y=0] Y position.
     */
    var Point = xc.class.create({
        initialize: function(x, y) {
            this.x = (x == null ? 0 : x);
            this.y = (y == null ? 0 : y);
        },

        /**
         * X position.
         *
         * @property x
         * @type Number
         */
        x: 0,

        /**
         * Y position.
         *
         * @property y
         * @type Number
         */
        y: 0,

        /**
         * Returns a clone of the Point instance.
         *
         * @method clone
         * @return {Point} a clone of the Point instance.
         */
        clone: function() {
            return new Point(this.x, this.y);
        },

        /**
         * Returns a string representation of this object.
         *
         * @method toString
         * @return {String} a string representation of the instance.
         */
        toString: function() {
            return "[Point (x=" + this.x + " y=" + this.y + ")]";
        }
    });

    return Point;

});