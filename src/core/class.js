/**
 * 参考：http://ejohn.org/blog/simple-javascript-inheritance/
 *
 * xc.class 提供一个简单、直观的 JavaScript 继承写法。
 *
 * JavaScript 中没有类的概念，继承是通过 prototype 来实现的，标准的写法是这样：
 *
 *     var Person = function(name) {
 *         this.name = name;
 *     }
 *
 *     // 在 prototype 中定义的属性和方法，每个 Person 实例都能访问
 *     Persion.prototype = {
 *         getName: function() {
 *             return this.name;
 *         },
 *         setName: function(name) {
 *             this.name = name;
 *         }
 *     }
 *     var zhansan = new Person("张三");
 *     console.log(zhansan.getName()); // 输出：张三
 *
 *     var Employee(name, employeeId) {
 *         this.name = name;
 *         this.employeeId = employeeId;
 *     }
 *
 *     // Employee 继承 Person
 *     Employee.prototype = new Person();
 *     Employee.prototype.getEmployeeId = function() {
 *         return this.employeeId;
 *     }
 *
 *     var lisi = new Employee("李四", 1);
 *     console.log(lisi.getName());       // 输出：李四
 *     console.log(lisi.getEmployeeId()); // 输出：1
 *
 * 标准的写法其实没什么不好，只是写起来有点繁琐。如果采用 xc.class，可以这样写：
 *
 *     // 定义 Person 类
 *     var Person = xc.class.create({
 *         _init: function(name) {
 *             this.name = name;
 *         },
 *         getName: function() {
 *             return this.name;
 *         },
 *         setName: function(name) {
 *             this.name = name;
 *         }
 *     });
 *
 *     // 定义 Employee 类，继承 Person
 *     var Employee = Person.extend({
 *         _init: function(name, employeeId) {
 *             this._super(name);
 *             this.employeeId = employeeId;
 *         },
 *         getEmployeeId: function() {
 *             return this.getEmployeeId;
 *         }
 *     });
 *
 * 采用这种写法有 3 个好处：
 * <ul>
 *  <li>单个类的属性和方法在一个 {} 中完成定义，类的继承方式更加直观。</li>
 *  <li>提供一个 _init 方法，更易于理解为“构造函数”。</li>
 *  <li>提供一个 _super 方法，用于访问基类的同名方法。重载父类方法时经常需要用到此方法。</li>
 * </ul>
 *
 * 注意：xc.class 并没有改变 JavaScript 的继承原理，只是提供一个更方便，更直观的继承写法。
 *
 * @class xc.class
 */
(function() {
    var initializing = false, fnTest = /xyz/.test(function() {xyz;}) ? /\b_super\b/ : /.*/;
    xc.class = function() {};
    /**
     * 创建一个类。
     *
     * @method create
     * @static
     * @param {Object} prop 复制到 prototype 中的属性和方法
     * @return {Function}
     */
    xc.class.create = function(prop) {
        var base = this.prototype;
        initializing = true;
        var prototype = new this();
        initializing = false;
        for (var name in prop) {
            prototype[name] = typeof prop[name] == "function" 
                && typeof base[name] == "function" && fnTest.test(prop[name]) ? (function(name, fn) {
                    return function() {
                        var tmp = this._super;
                        this._super = base[name];
                        var ret = fn.apply(this, arguments);
                        this._super = tmp;
                        return ret;
                    };
                })(name, prop[name]) : prop[name];
        }
        var Class = function() {
            if (!initializing && this.initialize) {
                this.initialize.apply(this, arguments);
            }
        };
        Class.prototype = prototype;
        Class.prototype.constructor = Class;
        Class.extend = arguments.callee;
        return Class;
    };
})();
