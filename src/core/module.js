(function() {
  xc.module = {};
  var mapping = {}, cache = {};
  xc.module.define = function(id, factory) {
    mapping[id] = factory;
  };
  xc.module.require = function(id) {
    if (cache[id]) {
      return cache[id];
    } else if (mapping[id]) {
      var factory = mapping[id];
      if (Object.prototype.toString.call(factory) == "[object Function]") {
        var exports = {};
        var result = factory(exports);
        cache[id] = result === undefined ? exports : result;
      } else {
        cache[id] = factory;
      }
      return cache[id];
    }
    throw "module [" + id + "] not found";
  };
})();
