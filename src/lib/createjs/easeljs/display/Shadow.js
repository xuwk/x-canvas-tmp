xc.module.define("xc.createjs.Shadow", function(exports) {

    /**
     * 这个类封装了一系列用于定义阴影的属性，然后通过其 <code>shadow</code> 属性应用于 {{#crossLink "DisplayObject"}}{{/crossLink}}
     *
     * <h4>例子</h4>
     *      myImage.shadow = new createjs.Shadow("#000000", 5, 5, 10);
     *
     * @class Shadow
     * @constructor
     * @param {String} color 阴影颜色。
     * @param {Number} offsetX 阴影的 x 偏移（以像素为单位）。
     * @param {Number} offsetY 阴影的 y 偏移（以像素为单位）。
     * @param {Number} blur 阴影的模糊度。
     **/
    var Shadow = xc.class.create({
        initialize: function(color, offsetX, offsetY, blur) {
            this.color = color;
            this.offsetX = offsetX;
            this.offsetY = offsetY;
            this.blur = blur;
        },

        /** 
         * 阴影颜色。
         * @property color
         * @type String
         * @default null
         */
        color: null,

        /** 
         * 阴影的 x 偏移量。
         * @property offsetX
         * @type Number
         * @default 0
         */
        offsetX: 0,

        /** 
         * 阴影的 y 偏移量。
         * @property offsetY
         * @type Number
         * @default 0
         */
        offsetY: 0,

        /** 
         * 阴影的模糊度。
         * @property blur
         * @type Number
         * @default 0
         */
        blur: 0,

        /**
         * 返回该对象的字符串表示形式。
         * @method toString
         * @return {String} 该对象的字符串表示形式。
         **/
        toString: function() {
            return "[Shadow]";
        },

        /**
         * 返回克隆后的 Shadow 实例。
         * @method clone
         * @return {Shadow} 克隆后的 Shadow 实例。
         **/
        clone: function() {
            return new Shadow(this.color, this.offsetX, this.offsetY, this.blur);
        }
    });

    /**
     * 一个代表阴影身份的对象，只读。（所有属性都设置为 0）。
     * @property identity
     * @type Shadow
     * @static
     * @final
     **/
    Shadow.identity = new Shadow("transparent", 0, 0, 0);

    return Shadow;

});