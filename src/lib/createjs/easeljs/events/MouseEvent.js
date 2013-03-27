xc.module.define("xc.createjs.MouseEvent", function(exports) {

    var EventDispatcher = xc.module.require("xc.createjs.EventDispatcher");

    /**
     * 这个会被作为参数传进mousedown, mouseup, mousemove, stagemouseup, stagemousedown, mouseover, mouseout和{{#crossLink "DisplayObject"}}{{/crossLink}}实例上的点击事件。
     *
     * @class MouseEvent
     * @extends EventDispatcher
     * @constructor
     * @param {String} type 事件类型。
     * @param {Number} stageX 关联到场景的正常的x坐标值。
     * @param {Number} stageY 关联到场景的正常的y坐标值。
     * @param {DisplayObject} target 这个事件关联到的显示对象。注：这个会被EventDispatcher分派的事件覆盖掉。
     * @param {MouseEvent} nativeEvent 关联到鼠标事件的本地DOM事件。 
     * @param {Number} pointerID 鼠标指针的唯一id。
     * @param {Boolean} primary 定义在多点触控的环境下该指针是否是第一个点。
     * @param {Number} rawX 关联场景的原始x坐标值。
     * @param {Number} rawY 关联场景的原始y坐标值。
     */
    var MouseEvent = EventDispatcher.extend({
        initialize: function(type, stageX, stageY, target, nativeEvent, pointerID, primary, rawX, rawY) {
            this.type = type;
            this.stageX = stageX;
            this.stageY = stageY;
            this.target = target;
            this.nativeEvent = nativeEvent;
            this.pointerID = pointerID;
            this.primary = primary;
            this.rawX = (rawX == null) ? stageX : rawX;
            this.rawY = (rawY == null) ? stageY : rawY;
        },

        /**
         * 对于“mousedown”类型的MouseEvent对象，mousemove事件会在用户释放鼠标按钮前不断被分派。
         * 这个事件能让你监听到一个按键操作的过程中鼠标移动时的交互事件，这个在拖拽操作中是非常有用的。
         * 从{{#crossLink "MouseEvent"}}{{/crossLink}}类里面查看事件属性的列表。
         *
         * @event mousemove
         */

        /**
         * 对于“mousedown”类型的MouseEvent对象，mouseup事件会在用户释放鼠标按钮的时候被分派。
         * 这个事件能让你监听到一个指定按键过程中对应的鼠标释放事件，这个在拖拽操作中是非常有用的。
         * 从{{#crossLink "MouseEvent"}}{{/crossLink}}类里面查看事件属性的列表。
         *
         * @event mouseup
         */

        /**
         * 场景中正常的x坐标值。这个值的范围通常在0和场景的宽度之间。
         *
         * @property stageX
         * @type Number
         */
        stageX: 0,

        /**
         * 场景中正常的y坐标值。这个值的范围通常在0和场景的高度之间。
         *
         * @property stageY
         * @type Number
         */
        stageY: 0,

        /**
         * 关联到场景的原始x坐标值。正常情况下它的值与stageX一致，除非stage.mouseMoveOutside的值为true且用户的指针位置在场景外。
         *
         * @property rawX
         * @type Number
         */
        rawX: 0,

        /**
         * 关联到场景的原始y坐标值。正常情况下它的值与stageY一致，除非stage.mouseMoveOutside的值为true且用户的指针位置在场景外。
         *
         * @property rawY
         * @type Number
         */
        rawY: 0,

        /**
         * 鼠标的事件名称。这个与回调操作的名称是一一对应的（onPress, onMouseDown, onMouseUp, onMouseMove, 或者 onClick）。
         *
         * @property type
         * @type String
         */
        type: null,

        /**
         * 浏览器生成的本地鼠标事件。不同的浏览器，这个事件的属性和API有可能有差异。当EaselJS的属性没有从原生的鼠标事件生成该值时，该属性值为空。
         *
         * @property nativeEvent
         * @type MouseEvent
         * @default null
         */
        nativeEvent: null,

        /**
         * 与这个事件关联的显示对象。
         *
         * @property target
         * @type DisplayObject
         * @default null
         */
        target: null,

        /**
         * 指针的唯一ID（触摸点或者鼠标指针）。对于鼠标，这个值可能为-1，也可能是系统分配的一个值。
         *
         * @property pointerID
         * @type {Number}
         */
        pointerID: 0,

        /**
         * 定义在多点触控的环境下该指针是否是第一个点。这个在用鼠标时常常是true的。在多点时，在堆栈的第一个点常常被认定为是这个的值。
         *
         * @property primary
         * @type {Boolean}
         */
        primary: false,

        /**
         * 返回MouseEvent实例的克隆。
         *
         * @method clone
         * @return {MouseEvent} MouseEvent实例的克隆
         */
        clone: function() {
            return new MouseEvent(this.type, this.stageX, this.stageY, 
                                this.target, this.nativeEvent, this.pointerID, 
                                this.primary, this.rawX, this.rawY);
        },

        /**
         * 返回一个代表当前对象的字符串。
         *
         * @method toString
         * @return {String} 一个代表当前对象的字符串。
         */
        toString: function() {
            return "[MouseEvent (type=" + this.type + " stageX=" + this.stageX + " stageY=" + this.stageY + ")]";
        }
    });

    return MouseEvent;

});