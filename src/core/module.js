/**
 * xc.module 提供一个简单的模块定义方法。
 *
 * 写法如下：
 *
 *     xc.module.define("core.AbstractClass", function(exports) {
 *         var AbstractClass = xc.class.create({ ... });
 *         return AbstractClass;
 *     }
 *
 *     xc.module.define("all.types", function(exports) {
 *         var AbstractClass = xc.module.require("core.AbstractClass");
 *         exports.NewClass = AbstractClass.extend({ ... });
 *         exports.NewClass2 = AbstractClass.extend({ ... });
 *     }
 *
 * 采用这种写法有 2 个好处：
 * <ul>
 *  <li>模块代码在一个函数闭包中定义，可减少全局变量污染。</li>
 *  <li>模块代码在被 require 时才真正执行，可提升页面加载速度。</li>
 * </ul>
 *
 * @class xc.module
 */
(function() {
    xc.module = {};
    var mapping = {}, cache = {};
    /**
     * 定义一个模块。
     *
     * @method define
     * @static
     * @param {String} id 模块标识。建议采用 a.b.c 这种有层次的模块标识写法。
     * @param {Function} factory 模块对象生成函数。factory 写法为：<code>function(exports) {}</code>，其中 exports 是模块对象。
     *  如果 factory 有返回值，则把返回值作为模块对象。
     */
    xc.module.define = function(id, factory) {
        mapping[id] = factory;
    };
    
    /**
     * 获取模块对象。
     *
     * @method require
     * @static
     * @param {String} id 模块标识。
     * @return {*} 返回模块对象。如果模块不存在，会抛出一个异常。factory 在首次 require 时执行，生成模块对象。
     */
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
    
    /**
     * 获取所有模块的标识
     * 
     * @method getIds
     * @static
     * @return {Array} 所有模块的标识
     */
    xc.module.getIds = function () {
        return Object.keys(mapping);
    };
})();
