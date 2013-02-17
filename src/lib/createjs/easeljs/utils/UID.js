xc.module.define("xc.createjs.UID", function(exports) {

  /**
   * Global utility for generating sequential unique ID numbers. The UID class uses a static interface (ex. <code>UID.get()</code>)
   * and should not be instantiated.
   *
   * @class UID
   * @static
   */
  var UID = function() {
    throw "UID cannot be instantiated.";
  };

  /**
   * @property _nextID
   * @type Number
   * @protected
   */
  UID._nextID = 0;

  /**
   * Returns the next unique id.
   * @method get
   * @return {Number} The next unique id
   * @static
   */
  UID.get = function() {
    return UID._nextID++;
  };

  return UID;

});