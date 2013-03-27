xc.module.define("xc.createjs.ButtonHelper", function(exports) {

    /**
     * ButtonHelper是一个小助手，它可以帮你把按钮的交互创建在{{#crossLink "MovieClip"}}{{/crossLink}}或者{{#crossLink "BitmapAnimation"}}{{/crossLink}}实例上。
     * ButtonHelper会从一个对象上拦截鼠标的事件，并自动执行{{#crossLink "BitmapAnimation/gotoAndStop"}}{{/crossLink}} 
     * 或者 {{#crossLink "BitmapAnimation/gotoAndPlay"}}{{/crossLink}}方法，
     * 它可以根据不同的事件创建标识、修改鼠标经过的指针图标，并且可以让用户指定点击的区域。
     * 
     * ButtonHelper的实例不需要创建在场景上，不过你需要维护一个引用来防止垃圾回收的机制。
     *
     * <h4>样例</h4>
     *     var helper = new ButtonHelper(myInstance, "out", "over", "down", false, myInstance, "hit");
     *
     * @param {BitmapAnimation|MovieClip} target BitmapAnimation或MovieClip的实例。
     * @param {String} [outLabel="out"] 当用户离开当前按钮时显示的标识或动画。
     * @param {String} [overLabel="over"] 当用户停留在当前按钮上时显示的标识或动画。
     * @param {String} [downLabel="down"] 当用户按下按钮时显示的标识或动画。
     * @param {Boolean} [play=false] 该参数判断当按钮的状态改变时应该触发“gotoAndPlay”还是“gotoAndStop”方法。
     * @param {DisplayObject} [hitArea] 这是一个可选的参数，它用来限定按钮的点击区域。如果这个参数没有定义，则按钮可以在可视区域内被点击。注：与“target”参数值相同的实例可以被用作点击区域。
     * @param {String} [hitLabel] 定义了点击区域界限的标识或动画。如果为空，则以默认的点击区域代替。
     * @constructor
     */
    var ButtonHelper = xc.class.create({
        initialize: function(target, outLabel, overLabel, downLabel, play, hitArea, hitLabel) {
            if (!target.addEventListener) {
                return;
            }
            this.target = target;
            target.cursor = "pointer";
            this.overLabel = overLabel == null ? "over" : overLabel;
            this.outLabel = outLabel == null ? "out" : outLabel;
            this.downLabel = downLabel == null ? "down" : downLabel;
            this.play = play;
            this.setEnabled(true);
            this.handleEvent({});
            if (hitArea) {
                if (hitLabel) {
                    hitArea.actionsEnabled = false;
                    hitArea.gotoAndStop && hitArea.gotoAndStop(hitLabel);
                }
                target.hitArea = hitArea;
            }
        },

        /**
         * 只读。需要创建按钮事件的目标。
         *
         * @property target
         * @type MovieClip | BitmapAnimation
         */
        target: null,

        /**
         * 当用户鼠标经过当前目标时显示的标识名或帧数。默认为“over”。
         *
         * @property overLabel
         * @type String | Number
         */
        overLabel: null,

        /**
         * 当用户鼠标离开当前目标时显示的标识名或帧数。默认为“out”。
         *
         * @property outLabel
         * @type String | Number
         */
        outLabel: null,

        /**
         * 当用户按压当前目标时显示的标识名或帧数。默认为“down”。
         *
         * @property downLabel
         * @type String | Number
         */
        downLabel: null,

        /**
         * 如果为true，ButtonHelper会触发gotoAndPlay，否则会用gotoAndStop代替。默认是false。
         *
         * @property play
         * @default false
         * @type Boolean
         */
        play: false,

        /**
         * @property _isPressed
         * @type Boolean
         * @protected
         */
        _isPressed: false,

        /**
         * @property _isPressed
         * @type Boolean
         * @protected
         */
        _isOver: false,

        /**
         * 打开或关闭当前目标上的按钮事件。
         *
         * @method setEnabled
         * @param {Boolean} value
         */
        setEnabled: function(value) {
            var o = this.target;
            if (value) {
                o.addEventListener("mouseover", this);
                o.addEventListener("mouseout", this);
                o.addEventListener("mousedown", this);
            } else {
                o.removeEventListener("mouseover", this);
                o.removeEventListener("mouseout", this);
                o.removeEventListener("mousedown", this);
            }
        },

        /**
         * 返回当前对象的字符串表示。
         *
         * @method toString
         * @return {String} 当前对象的字符串表示。
         */
        toString: function() {
            return "[ButtonHelper]";
        },

        /**
         * @method handleEvent
         * @protected
         */
        handleEvent: function(evt) {
            var label, t = this.target, type = evt.type;
            if (type == "mousedown") {
                evt.addEventListener("mouseup", this);
                this._isPressed = true;
                label = this.downLabel;
            } else if (type == "mouseup") {
                this._isPressed = false;
                label = this._isOver ? this.overLabel : this.outLabel;
            } else if (type == "mouseover") {
                this._isOver = true;
                label = this._isPressed ? this.downLabel : this.overLabel;
            } else { // mouseout and default
                this._isOver = false;
                label = this._isPressed ? this.overLabel : this.outLabel;
            }
            if (this.play) {
                t.gotoAndPlay && t.gotoAndPlay(label);
            } else {
                t.gotoAndStop && t.gotoAndStop(label);
            }
        }
    });

    return ButtonHelper;

});
