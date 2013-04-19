xc.module.define("xc.createjs.UID", function(exports) {

    /**
     * 生成自增唯一ID数的全局工具。UID类使用静态的接口 (例如： <code>UID.get()</code>)且不能被实例化。
     *
     * @class UID
     * @static
     */
    var UID = function() {
        throw "UID不能被实例化。";
    };

    /**
     * @property _nextID
     * @type Number
     * @protected
     */
    UID._nextID = 0;

    /**
     * 返回下一个唯一ID。
     * @method get
     * @return {Number} 下一个唯一ID。
     * @static
     */
    UID.get = function() {
        return UID._nextID++;
    };

    return UID;

});