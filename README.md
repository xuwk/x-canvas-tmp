JavaScript 编码规范
===================
为规范代码管理，lib 中的所有 JavaScript 代码都必须遵守此编码规范。

文件编码
========
文件编码统一采用 UTF-8。

缩进
=====
统一使用 4 个空格来缩进。折行缩进 8 个空格。

空格
=====
if/for/while/switch/catch 与左括号之间留 1 空格。
函数定义、函数调用的函数名与左括号之间不留空格。
二元操作符两边留 1 空格。
function/if/else/for/while/do/switch/try/catch/finally 与左大括号之间留 1 空格
右大括号与 else/while/catch/finally 之间留 1 空格。
函数参数定义、函数调用参数、if/for/while/switch/catch 的条件括号内侧不留空格。
三元操作符 ?: 的 ? 和 : 两边留 1 空格。
逗号左边不留空格，逗号右边留 1 空格。
冒号左边不留空格，冒号右边留 1 空格。

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

空行
=====

折行
=====

注释
=====

包
=====

类
=====
