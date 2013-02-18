xc.module.define("xc.createjs.Text", function(exports) {

  var DisplayObject = xc.module.require("xc.createjs.DisplayObject");

  /**
   * Display one or more lines of dynamic text (not user editable) in the display list. Line wrapping support (using the
   * lineWidth) is very basic, wrapping on spaces and tabs only. Note that as an alternative to Text, you can position
   * HTML text above or below the canvas relative to items in the display list using the {{#crossLink "DisplayObject/localToGlobal"}}{{/crossLink}}
   * method, or using {{#crossLink "DOMElement"}}{{/crossLink}}.
   *
   * <b>Please note that Text does not support HTML text, and can only display one font style at a time.</b>
   * To use multiple font styles, you will need to create multiple text instances, and position them manually.
   *
   * <h4>Example</h4>
   *     var text = new Text("Hello World", "20px Arial", #ff7700");
   *     text.x = 100;
   *     text.textBaseline = "alphabetic";
   *
   * CreateJS Text supports web fonts (the same rules as Canvas). The font must be loaded and supported by the browser
   * before it can be displayed.
   *
   * @class Text
   * @extends DisplayObject
   * @constructor
   * @param {String} [text] The text to display.
   * @param {String} [font] The font style to use. Any valid value for the CSS font attribute is acceptable (ex. "bold
   *  36px Arial").
   * @param {String} [color] The color to draw the text in. Any valid value for the CSS color attribute is acceptable (ex.
   *  "#F00", "red", or "#FF0000").
   */
  var Text = DisplayObject.extend({
    _init: function(text, font, color) {
      this._super();
      this.text = text;
      this.font = font;
      this.color = color ? color : "#000";
    },

    /**
     * The text to display.
     *
     * @property text
     * @type String
     */
    text: "",

    /**
     * The font style to use. Any valid value for the CSS font attribute is acceptable (ex. "bold 36px Arial").
     *
     * @property font
     * @type String
     */
    font: null,

    /**
     * The color to draw the text in. Any valid value for the CSS color attribute is acceptable (ex. "#F00"). Default is "#000".
     *
     * @property color
     * @type String
     */
    color: "#000",

    /**
     * The horizontal text alignment. Any of "start", "end", "left", "right", and "center".
     * For detailed information view the:
     * <a href="http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#text-styles">whatwg spec</a>. Default is "left".
     *
     * @property textAlign
     * @type String
     */
    textAlign: "left",

    /**
     * The vertical alignment point on the font. Any of "top", "hanging", "middle", "alphabetic", "ideographic", or "bottom".
     * For detailed information view the:
     * <a href="http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#text-styles">whatwg spec</a>. Default is "top".
     *
     * @property textBaseline
     * @type String
     */
    textBaseline: "top",

    /**
     * The maximum width to draw the text. If maxWidth is specified (not null), the text will be condensed or shrunk to make it fit in this width.
     * For detailed information view the:
     * <a href="http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#text-styles">whatwg spec</a>.
     *
     * @property maxWidth
     * @type Number
     */
    maxWidth: null,

    /**
     * If true, the text will be drawn as a stroke (outline). If false, the text will be drawn as a fill.
     *
     * @property outline
     * @type Boolean
     */
    outline: false,

    /**
     * Indicates the line height (vertical distance between baselines) for multi-line text. If null or 0,
     * the value of getMeasuredLineHeight is used.
     *
     * @property lineHeight
     * @type Number
     */
    lineHeight: 0,

    /**
     * Indicates the maximum width for a line of text before it is wrapped to multiple lines. If null,
     * the text will not be wrapped.
     *
     * @property lineWidth
     * @type Number
     */
    lineWidth: null,

    /**
     * Returns true or false indicating whether the display object would be visible if drawn to a canvas.
     * This does not account for whether it would be visible within the boundaries of the stage.
     *
     * Note: This method is mainly for internal use, though it may be useful for advanced uses.
     *
     * @method isVisible
     * @return {Boolean} Whether the display object would be visible if drawn to a canvas
     */
    isVisible: function() {
      var hasContent = this.cacheCanvas || (this.text != null && this.text !== "");
      return !!(this.visible && this.alpha > 0 && this.scaleX != 0 && this.scaleY != 0 && hasContent);
    },

    /**
     * Draws the Text into the specified context ignoring it's visible, alpha, shadow, and transform.
     * Returns true if the draw was handled (useful for overriding functionality).
     *
     * Note: This method is mainly for internal use, though it may be useful for advanced uses.
     *
     * @method draw
     * @param {CanvasRenderingContext2D} ctx The canvas 2D context object to draw into.
     * @param {Boolean} ignoreCache Indicates whether the draw operation should ignore any current cache.
     *  For example, used for drawing the cache (to prevent it from simply drawing an existing cache back into itself).
     */
    draw: function(ctx, ignoreCache) {
      if (this._super(ctx, ignoreCache)) { return true; }
      if (this.outline) { ctx.strokeStyle = this.color; } else { ctx.fillStyle = this.color; }
      ctx.font = this.font;
      ctx.textAlign = this.textAlign || "start";
      ctx.textBaseline = this.textBaseline || "alphabetic";
      this._drawText(ctx);
      return true;
    },

    /**
     * Returns the measured, untransformed width of the text without wrapping.
     *
     * @method getMeasuredWidth
     * @return {Number} The measured, untransformed width of the text.
     */
    getMeasuredWidth: function() {
      return this._getWorkingContext().measureText(this.text).width;
    },

    /**
     * Returns an approximate line height of the text, ignoring the lineHeight property. This is based
     * on the measured width of a "M" character multiplied by 1.2, which approximates em for most fonts.
     *
     * @method getMeasuredLineHeight
     * @return {Number} an approximate line height of the text, ignoring the lineHeight property. This is
     *  based on the measured width of a "M" character multiplied by 1.2, which approximates em for most fonts.
     */
    getMeasuredLineHeight: function() {
      return this._getWorkingContext().measureText("M").width * 1.2;
    },

    /**
     * Returns the approximate height of multiline text by multiplying the number of lines against either the lineHeight
     * (if specified) or getMeasuredLineHeight(). Note that this operation requires the text flowing logic to run,
     * which has an associated CPU cost.
     *
     * @method getMeasuredHeight
     * @return {Number} The approximate height of the drawn multiline text.
     */
    getMeasuredHeight: function() {
      return this._drawText() * (this.lineHeight || this.getMeasuredLineHeight());
    },

    /**
     * Returns a clone of the Text instance.
     *
     * @method clone
     * @return {Text} a clone of the Text instance.
     */
    clone: function() {
      var o = new Text(this.text, this.font, this.color);
      this.cloneProps(o);
      return o;
    },

    /**
     * Returns a string representation of this object.
     *
     * @method toString
     * @return {String} a string representation of the instance.
     */
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
     * Draws multiline text.
     *
     * @method _getWorkingContext
     * @protected
     * @return {Number} The number of lines drawn.
     */
    _drawText: function(ctx) {
      var paint = !!ctx;
      if (!paint) { ctx = this._getWorkingContext(); }
      var lines = String(this.text).split(/(?:\r\n|\r|\n)/);
      var lineHeight = this.lineHeight || this.getMeasuredLineHeight();
      var count = 0;
      for (var i = 0, l = lines.length; i < l; i++) {
        var w = ctx.measureText(lines[i]).width;
        if (this.lineWidth == null || w < this.lineWidth) {
          if (paint) { this._drawTextLine(ctx, lines[i], count * lineHeight); }
          count++;
          continue;
        }
        // split up the line
        var words = lines[i].split(/(\s)/);
        var str = words[0];
        for (var j = 1, jl = words.length; j < jl; j += 2) {
          // Line needs to wrap:
          if (ctx.measureText(str + words[j] + words[j + 1]).width > this.lineWidth) {
            if (paint) { this._drawTextLine(ctx, str, count * lineHeight); }
            count++;
            str = words[j + 1];
          } else {
            str += words[j] + words[j + 1];
          }
        }
        if (paint) { this._drawTextLine(ctx, str, count * lineHeight); } // Draw remaining text
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