xc.module.define("xc.createjs.Text", function(exports) {

    var DisplayObject = xc.module.require("xc.createjs.DisplayObject");

    /**
     *  
     * 显示一行或多行的动态文字（用户不能编辑的）在展示列表上。支持最基本的换行（利用行宽），包含了 spaces 和 tabs。
     * 注：作为替代文本，可以调用 {{#crossLink "DisplayObject/localToGlobal"}}{{/crossLink}} 或 {{#crossLink "DOMElement"}}{{/crossLink}}
     * 定位 HTML 文本在 canvas 的上方 或者 下方
     *
     * <b>注： Text 不支持 HTML 文本，一次只能显示一种字体样式</b>
     * 如果需要多种字体样式，只能创建多个 Text 实例，再手动对他们进行排序。
     *
     * <h4>例子</h4>
     *      var text = new createjs.Text("Hello World", "20px Arial", #ff7700");
     *      text.x = 100;
     *      text.textBaseline = "alphabetic";
     *
     * CreateJS文本支持网络字体 （与 Canvas 有相同规则）。
     * 在文字显示的前提是浏览器能支持这种字体。
     *
     * @class Text
     * @extends DisplayObject
     * @constructor
     * @param {String} [text] 要显示的文字。
     * @param {String} [font] 文本样式. 任何有效的 CSS 字体属性的值都是有效的 (ex. "bold 36px Arial")。
     * @param {String} [color] 画中的文字的颜色。任何有效的 CSS 颜色属性的值是有效的 (ex. "#F00", "red", or "#FF0000")。
     **/
    var Text = DisplayObject.extend({
        initialize: function(text, font, color) {
            this._super();
            this.text = text;
            this.font = font;
            this.color = color ? color : "#000";
        },

        /**
         * 要显示的文字
         * 
         * @property text
         * @type String
         **/
        text: "",

        /**
         * 文本样式. 任何有效的 CSS 字体属性的值都是有效的 (ex. "bold 36px Arial")。默认值 null。
         *
         * @property font
         * @type String
         */
        font: null,

        /**
         * 画中的文字的颜色。任何有效的 CSS 颜色属性的值是有效的 (ex. "#F00"). 默认值 "#000"。
         *
         * @property color
         * @type String
         */
        color: "#000",

        /**
         * 水平文本对齐方式. 可以是 "start", "end", "left", "right", 和 "center"。
         * 获取更多信息：
         * <a href="http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#text-styles">
         * whatwg spec</a>。默认值 "left"。
         *
         * @property textAlign
         * @type String
         */
        textAlign: "left",

        /**
         * 字体的垂直对齐点. 可以是 "top", "hanging", "middle", "alphabetic", 
         * "ideographic", 或 "bottom"。
         * 获取更多信息：
         * <a href="http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#text-styles">
         * whatwg spec</a>. 默认值 "top".
         *
         * @property textBaseline
         * @type String
         */
        textBaseline: "top",

        /**
         * text 的最大宽度，如果该值被指定（不为 null），文本将被浓缩或缩小，使其适合在这个宽度。
         * 获取更多信息：
         * <a href="http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#text-styles">
         * whatwg spec</a>.
         *
         * @property maxWidth
         * @type Number
         */
        maxWidth: null,

        /**
         * 如果为 true，text 会作为 stroke 渲染。如果为 false，text 会被作为 fill 渲染。
         *
         * @property outline
         * @type Boolean
         */
        outline: false,

        /**
         * 显示多行文本行的高度（基线之间的垂直距离）。如果为 null 或 0，将使用 getMeasuredLineHeight 的值。
         *
         * @property lineHeight
         * @type Number
         */
        lineHeight: 0,

        /**
         * 文档换行的最大宽度，如果为 null，则文档不能换行。
         *
         * @property lineWidth
         * @type Number
         */
        lineWidth: null,

        /**
         * 通过返回 true 或 false 去表示该显示对象画在 Canvas 上时，是否被显示
         * 这里并不是通过该显示对象是否显示在 Stage 内进行判断的。
         * 注：这种方法主要是供内部使用，虽然它可能有高级用法。
         * 
         * @method isVisible
         * @return {Boolean} Boolean 表示该 display object 画在 canvas 上时，是否被显示。
         **/
        isVisible: function() {
            var hasContent = this.cacheCanvas || (this.text != null && this.text !== "");
            return !!(this.visible && this.alpha > 0 && this.scaleX != 0 && this.scaleY != 0 && hasContent);
        },

        /**
         * 绘制显示对象到指定的上下文，忽略 visible, alpha, shadow, and transform 属性。
         * 当绘制动作正在处理，将返回 true （用于覆盖功能）。
         * 注：这种方法主要是供内部使用，即使它可能有高级用法。
         * 
         * @method draw
         * @param {CanvasRenderingContext2D} ctx canvas 2D 上下文对象将渲染到这里。
         * @param {Boolean} ignoreCache 表示这个绘制行为是否忽略当前所有缓存。
         * 例如，用来画 cache （以防止它简单地绘制到自身现有的 cache 上）。
         **/
        draw: function(ctx, ignoreCache) {
            if (this._super(ctx, ignoreCache)) {
                return true;
            }
            if (this.outline) {
                ctx.strokeStyle = this.color;
            } else {
                ctx.fillStyle = this.color;
            }
            ctx.font = this.font;
            ctx.textAlign = this.textAlign || "start";
            ctx.textBaseline = this.textBaseline || "alphabetic";
            this._drawText(ctx);
            return true;
        },

        /**
         * 返回测量好的，未转换的纯文本宽度（不包括包装）。
         * 
         * @method getMeasuredWidth
         * @return {Number} 测量好的，未转换的纯文本宽度（不包括包装）。
         **/
        getMeasuredWidth: function() {
            return this._getWorkingContext().measureText(this.text).width;
        },

        /**
         * 返回 text 行高度的近似值，忽略 lineHeight 属性。
         * 这里是基于测量到的 ‘M’ 的宽度 x 1.2 得到的，因为 M 近似于大多数字体。  
         * 
         * @method getMeasuredLineHeight
         * @return {Number} text 行高度的近似值，忽略 lineHeight 属性。这里是基于测量到的 ‘M’ 的宽度 x 1.2 得到的，因为 M 近似于大多数字体。  
         **/
        getMeasuredLineHeight: function() {
            return this._getWorkingContext().measureText("M").width * 1.2;
        },

        /**
         * 返回 text 的高度，该高度根据每行 lineHeight 属性或调用 getMeasuredLineHeight() 得到的行高度相加得到。 
         * 注：这个操作运用到文字逻辑，这会关系到 CPU 性能消耗的。
         * 
         * @method getMeasuredHeight
         * @return {Number} 多行文本的总高度。
         **/
        getMeasuredHeight: function() {
            return this._drawText() * (this.lineHeight || this.getMeasuredLineHeight());
        },

        /**
         * 返回克隆后的 Text 实例。
         * 
         * @method clone
         * @return {Bitmap} 克隆后的 Text 实例。
         **/
        clone: function() {
            var o = new Text(this.text, this.font, this.color);
            this.cloneProps(o);
            return o;
        },

        /**
         * 返回该对象的字符串表示形式。
         * 
         * @method toString
         * @return {String} 该对象的字符串表示形式。
         **/
        toString: function() {
            return "[Text (text=" + (this.text.length > 20 ? this.text.substr(0, 17) + "..." : this.text) + ")]";
        },

        /**
         * @method cloneProps
         * @param {Text} o
         * @protected
         */
        cloneProps: function(o) {
            this._super(o);
            o.textAlign = this.textAlign;
            o.textBaseline = this.textBaseline;
            o.maxWidth = this.maxWidth;
            o.outline = this.outline;
            o.lineHeight = this.lineHeight;
            o.lineWidth = this.lineWidth;
        },

        /**
         * @method _getWorkingContext
         * @protected
         */
        _getWorkingContext: function() {
            var ctx = Text._workingContext;
            ctx.font = this.font;
            ctx.textAlign = this.textAlign || "start";
            ctx.textBaseline = this.textBaseline || "alphabetic";
            return ctx;
        },

        /**
         * 渲染多行文本。
         * 
         * @method _getWorkingContext
         * @protected
         * @return {Number} 渲染的总行数
         **/
        _drawText: function(ctx) {
            var paint = !!ctx;
            if (!paint) {
                ctx = this._getWorkingContext();
            }
            var lines = String(this.text).split(/(?:\r\n|\r|\n)/);
            var lineHeight = this.lineHeight || this.getMeasuredLineHeight();
            var count = 0;
            for ( var i = 0, l = lines.length; i < l; i++) {
                var w = ctx.measureText(lines[i]).width;
                if (this.lineWidth == null || w < this.lineWidth) {
                    if (paint) {
                        this._drawTextLine(ctx, lines[i], count * lineHeight);
                    }
                    count++;
                    continue;
                }
                // split up the line
                var words = lines[i].split(/(\s)/);
                var str = words[0];
                for ( var j = 1, jl = words.length; j < jl; j += 2) {
                    // Line needs to wrap:
                    if (ctx.measureText(str + words[j] + words[j + 1]).width > this.lineWidth) {
                        if (paint) {
                            this._drawTextLine(ctx, str, count * lineHeight);
                        }
                        count++;
                        str = words[j + 1];
                    } else {
                        str += words[j] + words[j + 1];
                    }
                }
                if (paint) {
                    this._drawTextLine(ctx, str, count * lineHeight);
                } // Draw remaining text
                count++;
            }
            return count;
        },

        /**
         * @method _drawTextLine
         * @param {CanvasRenderingContext2D} ctx
         * @param {Text} text
         * @param {Number} y
         * @protected
         */
        _drawTextLine: function(ctx, text, y) {
            // Chrome 17 will fail to draw the text if the last param is included but null, so we feed it a large value instead:
            if (this.outline) {
                ctx.strokeText(text, 0, y, this.maxWidth || 0xFFFF);
            } else {
                ctx.fillText(text, 0, y, this.maxWidth || 0xFFFF);
            }
        }
    });

    /**
     * @property _workingContext
     * @type CanvasRenderingContext2D
     * @private
     */
    Text._workingContext = document.createElement("canvas").getContext("2d");

    return Text;

});