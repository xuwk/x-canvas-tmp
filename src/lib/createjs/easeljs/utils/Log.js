xc.module.define("xc.createjs.Log", function(exports) {

    /**
     * Log提供一个集中输出错误信息的系统。它默认会调用console.log方法去打印信息，但是这个可以通过输出属性去修改输出方式。
     *
     * @class Log
     * @constructor
     */
    var Log = {};

    /**
     * 只读。不输出任何信息。
     *
     * @type Number
     * @property NONE
     * @default 0
     * @static
     */
    Log.NONE = 0;

    /**
     * 只读。输出错误信息。
     *
     * @type Number
     * @property ERROR
     * @default 1
     * @static
     */
    Log.ERROR = 1;

    /**
     * 只读。输出警告信息。
     *
     * @type Number
     * @property WARNING
     * @default 2
     * @static
     */
    Log.WARNING = 2;

    /**
     * 只读。输出跟踪信息。
     *
     * @type Number
     * @property TRACE
     * @default 3
     * @static
     */
    Log.TRACE = 3;

    /**
     * 只读。输出所有信息。
     *
     * @type Number
     * @property ALL
     * @default 255
     * @static
     */
    Log.ALL = 255;

    /**
     * 定义一个用来处理所有日志信息的方法。默认情况下使用console.log。像Log.log方法一样会有三个参数传入到指定的方法内，但是一旦碰到适配的关键词，消息就会被展开。<br /><br />
     * 例如，你可以改写一个方法把所有日志记录在服务器，或者提示到一个文本框内。你也可以把这个设为空值来禁止所有的日志。<br /><br />
     * 所有的信息都会传递到out方法，无论你设为什么等级，你的方法必须适当地控制日志等级来输出信息。例如，你完全可以允许所有信息都传递到服务器，但仅仅在前台展示当前等级设置相对应的信息。
     *
     * @type Function
     * @property out
     * @static
     */
    Log.out = function(message, details, level) {
        if (level <= Log.level && window.console) {
            if (details === undefined) {
                console.log(message);
            } else {
                console.log(message, details);
            }
        }
    };

    /**
     * 指定了日志输出的等级。例如，如果你设置<code>Log.level = Log.WARNING</code>，那么所以等级在2（Log.WARNING）或更低的等级（例如：Log.ERROR）会被输出。默认： Log.ALL。
     *
     * @type Function
     * @property out
     * @default 255
     * @static
     */
    Log.level = 255;

    /**
     * @property _keys
     * @static
     * @type Array
     * @protected
     */
    Log._keys = [];

    /**
     * 添加一个自定义对象，该对象保存了若干个关键词和信息主体，方便输出一些较长的信息。这些信息可以选择性地包含“%DETAILS%”，该关键词会在信息传递到输出方法时被替换。例如：<br/>
     * 
     * Log.addKeys( {MY_ERROR:"这是一段输出内容 [%DETAILS%]"} );
     * Log.error( "MY_ERROR" , 5 ); // 会输出成 "这是一段输出内容 [5]"
     *
     * @method addKeys
     * @param {Object} keys 定义了关键词和消息的对象。
     * @static
     */
    Log.addKeys = function(keys) {
        Log._keys.unshift(keys);
    };

    /**
     * 通过被分配为“out”属性的方法，把指定的输出信息展示出来。如果是一个关键词，且这个关键词已经加到_keys里面，那么它会直接替换掉原来的消息。
     *
     * @method log
     * @param {String} message 要输出的信息或者关键词。
     * @param {Object} details 与这条信息相关的任何详情。
     * @param {Number} level 一个介乎1和254之间的数字，它代表了该信息的严重程度。查看Log.level获取更多信息。
     * @static
     */
    Log.log = function(message, details, level) {
        var out = Log.out;
        if (!out) {
            return;
        }
        var keys = Log._keys;
        if (level == null) {
            level = 3;
        }
        for ( var i = 0; i < keys.length; i++) {
            if (keys[i][message]) {
                message = keys[i][message];
                break;
            }
        }
        out(message, details, level);
    };

    return Log;

});