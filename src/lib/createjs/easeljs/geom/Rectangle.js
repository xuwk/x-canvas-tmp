xc.module.define("xc.createjs.Rectangle", function(exports) {

    /**
     * Represents a rectangle as defined by the points (x, y) and (x+width, y+height).
     *
     * <h4>Example</h4>
     *     var rect = new Rectangle(0, 0, 100, 100);
     *
     * @class Rectangle
     * @constructor
     * @param {Number} [x=0] X position.
     * @param {Number} [y=0] Y position.
     * @param {Number} [width=0] The width of the Rectangle.
     * @param {Number} [height=0] The height of the Rectangle.
     */
    var Rectangle = xc.class.create({
        _init: function(x, y, width, height) {
            this.x = (x == null ? 0 : x);
            this.y = (y == null ? 0 : y);
            this.width = (width == null ? 0 : width);
            this.height = (height == null ? 0 : height);
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
         * Width.
         *
         * @property width
         * @type Number
         */
        width: 0,

        /**
         * Height.
         *
         * @property height
         * @type Number
         */
        height: 0,

        /**
         * Returns a clone of the Rectangle instance.
         *
         * @method clone
         * @return {Rectangle} a clone of the Rectangle instance.
         */
        clone: function() {
            return new Rectangle(this.x, this.y, this.width, this.height);
        },

        /**
         * Returns a string representation of this object.
         *
         * @method toString
         * @return {String} a string representation of the instance.
         */
        toString: function() {
            return "[Rectangle (x=" + this.x + " y=" + this.y + " width=" + this.width + " height=" + this.height + ")]";
        }
    });

    return Rectangle;

});