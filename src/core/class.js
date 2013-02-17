(function() {
  var initializing = false, fnTest = /xyz/.test(function() {xyz;}) ? /\b_super\b/ : /.*/;
  xc.class = function() {};
  xc.class.create = function(prop) {
    var base = this.prototype;
    initializing = true;
    var prototype = new this();
    initializing = false;
    for (var name in prop) {
      prototype[name] =
          typeof prop[name] == "function" && typeof base[name] == "function" && fnTest.test(prop[name]) ?
              (function(name, fn) {
                return function() {
                  var tmp = this._super;
                  this._super = base[name];
                  var ret = fn.apply(this, arguments);
                  this._super = tmp;
                  return ret;
                };
              })(name, prop[name]) : prop[name];
    }
    prototype._base = base;
    var Class = function() {
      if (!initializing && this._init) {
        this._init.apply(this, arguments);
      }
    };
    Class.prototype = prototype;
    Class.prototype.constructor = Class;
    Class.extend = arguments.callee;
    return Class;
  };
})();
