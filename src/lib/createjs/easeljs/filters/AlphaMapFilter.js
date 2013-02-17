xc.module.define("xc.createjs.AlphaMapFilter", function(exports) {

  var Filter = xc.module.require("xc.createjs.Filter");

  /**
   * Applies a greyscale alpha map image (or canvas) to the target, such that the alpha channel of the result will
   * be copied from the red channel of the map, and the RGB channels will be copied from the target.
   *
   * Generally, it is recommended that you use {{#crossLink "AlphaMaskFilter"}}{{/crossLink}}, because it has much better performance.
   *
   * See {{#crossLink "Filter"}}{{/crossLink}} for an example of how to apply filters.
   *
   * @class AlphaMapFilter
   * @extends Filter
   * @constructor
   * @param {Image} alphaMap The greyscale image (or canvas) to use as the alpha value for the result. This should be
   *  exactly the same dimensions as the target.
   */
  var AlphaMapFilter = Filter.extend({
    _init: function(alphaMap) {
      this.alphaMap = alphaMap;
    },

    /**
     * The greyscale image (or canvas) to use as the alpha value for the result. This should be exactly the same
     * dimensions as the target.
     *
     * @property alphaMap
     * @type Image
     */
    alphaMap: null,

    _alphaMap: null,
    _mapData: null,

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
      if (!this.alphaMap) { return true; }
      if (!this._prepAlphaMap()) { return false; }
      targetCtx = targetCtx || ctx;
      if (targetX == null) { targetX = x; }
      if (targetY == null) { targetY = y; }
      try {
        var imageData = ctx.getImageData(x, y, width, height);
      } catch (e) {
        return false;
      }
      var data = imageData.data;
      var map = this._mapData;
      var l = data.length;
      for (var i = 0; i < l; i += 4) {
        data[i + 3] = map[i] || 0;
      }
      imageData.data = data;
      targetCtx.putImageData(imageData, targetX, targetY);
      return true;
    },

    /**
     * Returns a clone of this object.
     *
     * @return {AlphaMapFilter} A clone of the current AlphaMapFilter instance.
     */
    clone: function() {
      return new AlphaMapFilter(this.mask);
    },

    /**
     * Returns a string representation of this object.
     *
     * @return {String} a string representation of the instance.
     */
    toString: function() {
      return "[AlphaMapFilter]";
    },

    _prepAlphaMap: function() {
      if (!this.alphaMap) { return false; }
      if (this.alphaMap == this._alphaMap && this._mapData) { return true; }
      this._mapData = null;
      var map = this._alphaMap = this.alphaMap;
      var canvas = map;
      if (map instanceof HTMLCanvasElement) {
        ctx = canvas.getContext("2d");
      } else {
        canvas = document.createElement("canvas");
        canvas.width = map.width;
        canvas.height = map.height;
        ctx = canvas.getContext("2d");
        ctx.drawImage(map, 0, 0);
      }
      try {
        var imgData = ctx.getImageData(0, 0, map.width, map.height);
      } catch (e) {
        return false;
      }
      this._mapData = imgData.data;
      return true;
    }
  });

  return AlphaMapFilter;

});