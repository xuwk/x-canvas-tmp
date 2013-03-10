JavaScript 编码规范
==================
为规范代码管理，lib 中的所有 JavaScript 代码都必须遵守此编码规范。


文件编码
=======
文件编码统一采用 UTF-8。


缩进
====
统一使用 4 个空格来缩进。折行缩进 8 个空格。


空格
====

规则：
* if/for/while/switch/catch 与左括号之间留 1 空格
* 函数定义、函数调用的函数名与左括号之间不留空格
* 二元操作符两边留 1 空格
* function/if/else/for/while/do/switch/try/catch/finally 与左大括号之间留 1 空格
* 右大括号与 else/while/catch/finally 之间留 1 空格
* 函数参数定义、函数调用参数、if/for/while/switch/catch 的条件括号内侧不留空格
* 三元操作符 ?: 的 ? 和 : 两边留 1 空格
* 逗号左边不留空格，逗号右边留 1 空格
* 冒号左边不留空格，冒号右边留 1 空格

举例：
```JavaScript
function foo(x, y, z) {
    bar(1, b);
    var i = 0;
    var x = {0: "zero", 1: "one"};
    var foo = function() {}
    if (!i > 10) {
        for (var j = 0; j < 10; j++) {
            switch (j) {
            case 0:
                value = "zero";
                break;
            case 1:
                value = "one";
                break;
            }
            var c = j > 5 ? "GT 5" : "LE 5";
        }
    } else {
        var j = 0;
        try {
            while (j < 10) {
                if (i == j || j > 5) {
                    a[j] = i + j * 12;
                }
                i = (j << 2) & 4;
                j++;
            }
            do {
                j--;
            } while (j > 0)
        } catch (e) {
            alert("Failure: " + e.message);
        } finally {
            reset(a, i);
        }
    }
}
```


折行
====

规则：
* 单行长度不超过 120 个字符，超过就需要折行，折行比上一行缩进 8 个空格
* 函数定义、if/for/while/do/switch/try 的左大括号放在同一行的行末
* else/else if 和上个代码块的右大括号放在同一行

举例：
```JavaScript
function buzz() {
    return 0;
}

var foo = {
    numbers: ['one', 'two', 'three', 'four', 'five', 'six'],

    fOne: function(argA, argB, argC, argD, argE, argF, argG, argH) {
        var x = argA + argB + argC + argD + argE + argF + argG + argH;
        this.fTwo(argA, argB, argC, this.fThree(argD, argE, argF, argG, argH));
        var z = argA == 'Some string' ? 'yes' : 'no';
        var colors = ['red', 'green', 'blue', 'black', 'white', 'gray'];
        for (var colorIndex = 0; colorIndex < colors.length; colorIndex++) {
            var colorString = this.numbers[colorIndex];
        }
    },

    fTwo: function(strA, strB, strC, strD) {
        if (true) {
            return strC;
        }
        if (strA == 'one' && (strB == 'two' || strC == 'three')) {
            return strA + strB + strC;
        } else {
            return D;
        }
        if (strA == 'one') {
            return 1;
        } else if (strA == 'two') {
            return 2;
        }
        var number = -10;
        while(number < 0) {
            number = number + 1;
        }
        do {
            number = number + 1;
        } while (number < 10);
        return strD;
    },

    fThree: function(strA, strB, strC, strD, strE) {
        var number = prompt("Enter a number:", 0);
        switch (number) {
        case 0:
            alert("Zero");
            break;
        case 1:
            alert("One");
            break;
        }
        try {
            a[2] = 10;

        } catch (e) {
            alert("Failure: " + e.message);
        }
        return strA + strB + strC + strD + strE;
    }
};
```


注释
====
使用 [YUIDoc](http://yui.github.com/yuidoc/) 来添加注释文档。

class 例子：
```JavaScript
/**
 * This is the description for my class.
 *
 * @class MyClass
 * @constructor
 */
```

method 例子：
```JavaScript
/**
 * My method description.  Like other pieces of your comment blocks,
 * this can span multiple lines.
 *
 * @method methodName
 * @param {String} foo Argument 1
 * @param {Object} config A config object
 * @param {String} config.name The name on the config object
 * @param {Function} config.callback A callback function on the config object
 * @param {Boolean} [extra=false] Do extra, optional work
 * @return {Boolean} Returns true on success
 */
```

property 例子：
```JavaScript
/**
 * My property description.  Like other pieces of your comment blocks,
 * this can span multiple lines.
 *
 * @property propertyName
 * @type {Object}
 * @default "foo"
 */
```

以上例子要注意几点：
* 每行的 * 要和第一行的 * 左边对齐
* 每行的内容要和开头的 * 隔 1 空格
* 注释块结尾用单一行的 */


模块
==
module.js 中规范了模块的定义方法。

```JavaScript
xc.module.define("core.AbstractClass", function(exports) {
    var AbstractClass = xc.class.create({ ... });
    return AbstractClass;
}

xc.module.define("all.types", function(exports) {
    var AbstractClass = xc.module.require("core.AbstractClass");
    exports.NewClass = AbstractClass.extend({ ... });
    exports.NewClass2 = AbstractClass.extend({ ... });
}
```


类
==
class.js 中规范了类的定义方法。

```JavaScript
// 定义 Person 类
var Person = xc.class.create({
    _init: function(name) {
        this.name = name;
    },
    getName: function() {
        return this.name;
    },
    setName: function(name) {
        this.name = name;
    }
});

// 定义 Employee 类，继承 Person
var Employee = Person.extend({
    _init: function(name, employeeId) {
        this._super(name);
        this.employeeId = employeeId;
    },
    getEmployeeId: function() {
        return this.getEmployeeId;
    }
});
```
