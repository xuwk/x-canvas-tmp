xc.module.define("xc.createjs.Shadow", function(exports) {

    /**
     * This class encapsulates the properties required to define a shadow to apply to a
     * {{#crossLink "DisplayObject"}}{{/crossLink}} via it's <code>shadow</code> property.
     *
     * <h4>Example</h4>
     *     myImage.shadow = new Shadow("#000000", 5, 5, 10);
     *
     * @class Shadow
     * @constructor
     * @param {String} color The color of the shadow.
     * @param {Number} offsetX The x offset of the shadow in pixels.
     * @param {Number} offsetY The y offset of the shadow in pixels.
     * @param {Number} blur The size of the blurring effect.
     */
    var Shadow = xc.class.create({
        _init: function(color, offsetX, offsetY, blur) {
            this.color = color;
            this.offsetX = offsetX;
            this.offsetY = offsetY;
            this.blur = blur;
        },

        /**
         * The color of the shadow.
         *
         * @property color
         * @type String
         * @default null
         */
        color: null,

        /**
         * The x offset of the shadow.
         *
         * @property offsetX
         * @type Number
         * @default 0
         */
        offsetX: 0,

        /**
         * The y offset of the shadow.
         *
         * @property offsetY
         * @type Number
         * @default 0
         */
        offsetY: 0,

        /**
         * The blur of the shadow.
         *
         * @property blur
         * @type Number
         * @default 0
         */
        blur: 0,

        /**
         * Returns a string representation of this object.
         *
         * @method toString
         * @return {String} a string representation of the instance.
         */
        toString: function() {
            return "[Shadow]";
        },

        /**
         * Returns a clone of this Shadow instance.
         *
         * @method clone
         * @return {Shadow} A clone of the current Shadow instance.
         */
        clone: function() {
            return new Shadow(this.color, this.offsetX, this.offsetY, this.blur);
        }
    });

    /**
     * An identity shadow object (all properties are set to 0). Read-only.
     *
     * @property identity
     * @type Shadow
     * @static
     * @final
     */
    Shadow.identity = new Shadow("transparent", 0, 0, 0);

    return Shadow;

});