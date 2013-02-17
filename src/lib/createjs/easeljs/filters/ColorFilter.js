xc.module.define("xc.createjs.ColorFilter", function(exports) {

  var Filter = xc.module.require("xc.createjs.Filter");

  /**
   * Applies color transforms.
   *
   * See {{#crossLink "Filter"}}{{/crossLink}} for an example of how to apply filters.
   *
   * @class ColorFilter
   * @constructor
   * @extends Filter
   * @param {Number} redMultiplier
   * @param {Number} greenMultiplier
   * @param {Number} blueMultiplier
   * @param {Number} alphaMultiplier
   * @param {Number} redOffset
   * @param {Number} greenOffset
   * @param {Number} blueOffset
   * @param {Number} alphaOffset
   */
  var ColorFilter = Filter.extend({
    _init: function(redMultiplier, greenMultiplier, blueMultiplier, alphaMultiplier, redOffset, greenOffset, blueOffset, alphaOffset) {
      this.redMultiplier = redMultiplier != null ? redMultiplier : 1;
      this.greenMultiplier = greenMultiplier != null ? greenMultiplier : 1;
      this.blueMultiplier = blueMultiplier != null ? blueMultiplier : 1;
      this.alphaMultiplier = alphaMultiplier != null ? alphaMultiplier : 1;
      this.redOffset = redOffset || 0;
      this.greenOffset = greenOffset || 0;
      this.blueOffset = blueOffset || 0;
      this.alphaOffset = alphaOffset || 0;
    },

    /**
     * Red channel multiplier.
     *
     * @property redMultiplier
     * @type Number
     */
    redMultiplier: 1,

    /**
     * Green channel multiplier.
     *
     * @property greenMultiplier
     * @type Number
     */
    greenMultiplier: 1,

    /**
     * Blue channel multiplier.
     *
     * @property blueMultiplier
     * @type Number
     */
    blueMultiplier: 1,

    /**
     * Alpha channel multiplier.
     *
     * @property redMultiplier
     * @type Number
     */
    alphaMultiplier: 1,

    /**
     * Red channel offset (added to value).
     *
     * @property redOffset
     * @type Number
     */
    redOffset: 0,

    /**
     * Green channel offset (added to value).
     *
     * @property greenOffset
     * @type Number
     */
    greenOffset: 0,

    /**
     * Blue channel offset (added to value).
     *
     * @property blueOffset
     * @type Number
     */
    blueOffset: 0,

    /**
     * Alpha channel offset (added to value).
     *
     * @property alphaOffset
     * @type Number
     */
    alphaOffset: 0,

    /**
     * Applies the filter to the specified context.
     *
     * @method applyFilter
     * @param {CanvasRenderingContext2D} ctx The 2D context to use as the source.
     * @param {Number} x The x position to use for the source rect.
     * @param {Number} y The y position to use for the source rect.
     * @param {Number} width The width to use for the source rect.
     * @param {Number} height The height to use for the source rect.
     * @param {CanvasRenderingContext2D} targetCtx Optional. The 2D context to draw the result to. Defaults to the context passed to ctx.
     * @param {Number} targetX Optional. The x position to draw the result to. Defaults to the value passed to x.
     * @param {Number} targetY Optional. The y position to draw the result to. Defaults to the value passed to y.
     * @return {Boolean}
     */
    applyFilter: function(ctx, x, y, width, height, targetCtx, targetX, targetY) {
      targetCtx = targetCtx || ctx;
      if (targetX == null) { targetX = x; }
      if (targetY == null) { targetY = y; }
      try {
        var imageData = ctx.getImageData(x, y, width, height);
      } catch (e) {
        //if (!this.suppressCrossDomainErrors) throw new Error("unable to access local image data: " + e);
        return false;
      }
      var data = imageData.data;
      var l = data.length;
      for (var i = 0; i < l; i += 4) {
        data[i] = data[i] * this.redMultiplier + this.redOffset;
        data[i + 1] = data[i + 1] * this.greenMultiplier + this.greenOffset;
        data[i + 2] = data[i + 2] * this.blueMultiplier + this.blueOffset;
        data[i + 3] = data[i + 3] * this.alphaMultiplier + this.alphaOffset;
      }
      imageData.data = data;
      targetCtx.putImageData(imageData, targetX, targetY);
      return true;
    },

    /**
     * Returns a string representation of this object.
     *
     * @method toString
     * @return {String} a string representation of the instance.
     */
    toString: function() {
      return "[ColorFilter]";
    },

    /**
     * Returns a clone of this ColorFilter instance.
     *
     * @method clone
     * @return {ColorFilter} A clone of the current ColorFilter instance.
     */
    clone: function() {
      return new ColorFilter(this.redMultiplier, this.greenMultiplier, this.blueMultiplier, this.alphaMultiplier,
          this.redOffset, this.greenOffset, this.blueOffset, this.alphaOffset);
    }
  });

  return ColorFilter;

});