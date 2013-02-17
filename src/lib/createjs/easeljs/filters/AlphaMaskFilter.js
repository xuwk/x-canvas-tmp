xc.module.define("xc.createjs.AlphaMaskFilter", function(exports) {

  var Filter = xc.module.require("xc.createjs.Filter");

  /**
   * Applies the alpha from the mask image (or canvas) to the target, such that the alpha channel of the result will
   * be derived from the mask, and the RGB channels will be copied from the target. This can be used, for example, to
   * apply an alpha mask to a display object. This can also be used to combine a JPG compressed RGB image with a PNG32
   * alpha mask, which can result in a much smaller file size than a single PNG32 containing ARGB.
   *
   * <b>IMPORTANT NOTE: This filter currently does not support the targetCtx, or targetX/Y parameters correctly.</b>
   *
   * See {{#crossLink "Filter"}}{{/crossLink}} for an example of how to apply filters.
   *
   * @class AlphaMaskFilter
   * @extends Filter
   * @constructor
   * @param {Image} mask
   */
  var AlphaMaskFilter = Filter.extend({
    _init: function(mask) {
      this.mask = mask;
    },

    /**
     * The image (or canvas) to use as the mask.
     *
     * @property mask
     * @type Image
     */
    mask: null,

    /**
     * Applies the filter to the specified context. IMPORTANT NOTE: This filter currently does not support the targetCtx,
     * or targetX/Y parameters correctly.
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
      if (!this.mask) { return true; }
      targetCtx = targetCtx || ctx;
      if (targetX == null) { targetX = x; }
      if (targetY == null) { targetY = y; }
      targetCtx.save();
      if (ctx != targetCtx) {
        // TODO: support targetCtx and targetX/Y
        // clearRect, then draw the ctx in?
      }
      targetCtx.globalCompositeOperation = "destination-in";
      targetCtx.drawImage(this.mask, targetX, targetY);
      targetCtx.restore();
      return true;
    },

    /**
     * Returns a clone of this object.
     *
     * @return {AlphaMaskFilter}
     */
    clone: function() {
      return new AlphaMaskFilter(this.mask);
    },

    /**
     * Returns a string representation of this object.
     *
     * @return {String} a string representation of the instance.
     */
    toString: function() {
      return "[AlphaMaskFilter]";
    }
  });

  return AlphaMaskFilter;

});