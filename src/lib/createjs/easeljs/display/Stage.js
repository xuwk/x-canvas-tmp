xc.module.define("xc.createjs.Stage", function(exports) {

    var Container = xc.module.require("xc.createjs.Container");
    var MouseEvent = xc.module.require("xc.createjs.MouseEvent");

    /**
     * stage 是展示列表中根一级的 {{#crossLink "Container"}}{{/crossLink}}。 
     * 每当执行 {{#crossLink "Stage/tick"}}{{/crossLink}} 的时候，它都会将它的显示列表渲染到目标 canvas 上。
     *
     * <h4>例子</h4>
     * 这个例子创建一个 stage，往里面添加一个子对象, 然后通过执行 {{#crossLink "Ticker"}}{{/crossLink}} 来更新子对象，
     * 通过 {{#crossLink "Stage/update"}}{{/crossLink}} 来重新绘制。
     *
     *      var stage = new createjs.Stage("canvasElementId");
     *      var image = new createjs.Bitmap("imagePath.png");
     *      createjs.Ticker.addEventListener("tick", handleTick);
     *      function handleTick(event) {
     *          bitmap.x += 10;
     *          stage.update();
     *      }
     *
     * @class Stage
     * @extends Container
     * @constructor
     * @param {HTMLCanvasElement | String | Object} canvas stage 将会渲染到的 canvas，或者是一个当前文档里面 canvas 的 字符串 id。
     */
    var Stage = Container.extend({
        initialize: function(canvas) {
            this._super();
            this.canvas = (typeof canvas == "string") ? document.getElementById(canvas) : canvas;
            this._pointerData = {};
            this.enableDOMEvents(true);
            // I am sorry that I've hacked,but this won't stay for long...
            this.tick = this.update;
        },

        /**
        * 当用户鼠标在 canvas 上滑过时触发。事件属性的列表，请参阅 {{#crossLink "MouseEvent"}}{{/crossLink}} 类。
         * 事件属性的列表，请参阅 {{#crossLink "MouseEvent"}}{{/crossLink}} 类。
         * 
         * @event stagemousemove
         */

        /**
         * 当用户在可检测范围松开鼠标时触发。（这在不同的浏览器之间有微小的差别）。
         * 事件属性的列表，请参阅 {{#crossLink "MouseEvent"}}{{/crossLink}} 类。
         * 
         * @event stagemouseup
         */

        /**
         * 当用户在可检测范内按下鼠标时触发。（这在不同的浏览器之间有微小的差别）。
         * 事件属性的列表，请参阅 {{#crossLink "MouseEvent"}}{{/crossLink}} 类。
         * 
         * @event stagemousedown
         */

        /**
         * 指出 stage 是否在每一次渲染之前清空，可以设置为 false 然后手动去控制 stage 的清空。
         * 
         * @property autoClear
         * @type Boolean
         * @default true
         **/
        autoClear: true,

        /**
         * 用于渲染 stage 的 canvas，多个 stage 可以共用一个 canvas，但必须禁止除第一个 stage 之外的所有 stage 的 autoClear 属性 （否则 stage 会清空其他 stage 渲染的内容）
         *
         * @property canvas
         * @type HTMLCanvasElement | Object
         */
        canvas: null,

        /**
         * 只读。当前鼠标相对于 canvas 的 x 坐标。如果鼠标离开了 canvas，这个值会保存鼠标离开 canvas 时的 x 坐标，
         * 同时 mouseInBounds 属性将被设置为 false。
         *
         * @property mouseX
         * @type Number
         */
        mouseX: 0,

        /**
         * 只读。当前鼠标相对于 canvas 的 y 坐标。如果鼠标离开了 canvas，这个值会保存鼠标离开 canvas 时的 y 坐标，
         * 同时 mouseInBounds 属性将被设置为 false。
         *
         * @property mouseY
         * @type Number
         */
        mouseY: 0,

        /**
         * 指出鼠标是否在当前 canvas 内。
         *
         * @property mouseInBounds
         * @type Boolean
         * @default false
         */
        mouseInBounds: false,

        /**
         * 如果为 true，stage 下的每个显示对象在渲染到 canvas 之前都将先执行 tick 回调函数。
         *
         * @property tickOnUpdate
         * @type Boolean
         * @default true
         */
        tickOnUpdate: true,

        /**
         * 如果为 true， 鼠标移动时间将在鼠标离开目标 canvas 后仍然继续进行。参阅 mouseInBounds 和 MouseEvent.x/y/rawX/rawY。
         *
         * @property mouseMoveOutside
         * @type Boolean
         * @default false
         */
        mouseMoveOutside: false,

        /**
         * Stage 不支持 hitArea 属性
         * @property hitArea
         * @type {DisplayObject}
         * @default null
         */

        /**
         * 持有所有活动对象指针的数据，每个对象都包含一下属性：
         * x, y, event, target, overTarget, overX, overY, inBounds
         *
         * @property _pointerData
         * @type {Object}
         * @private
         */
        _pointerData: null,

        /**
         * 活动指针数量。
         *
         * @property _pointerCount
         * @type {Object}
         * @private
         */
        _pointerCount: 0,

        /**
         * 私有对象指针 ID。
         *
         * @property _pointerCount
         * @type {Object}
         * @private
         */
        _primaryPointerID: null,

        /**
         * @property _mouseOverIntervalID
         * @protected
         * @type Number
         */
        _mouseOverIntervalID: null,

        /**
         * 每当执行 update 方法， stage 就会执行其所有子对象的 tick 方法 (ex. {{#crossLink "BitmapAnimation"}}{{/crossLink}})，
         * 以及渲染整个展示列表到 canvas 上。所有传到 update 的参数都会传到任何一个 tick 上。
         * onTick handlers.
         * 
         * @method update
         */
        update: function() {
            if (!this.canvas) {
                return;
            }
            if (this.autoClear) {
                this.clear();
            }
            if (this.tickOnUpdate) {
                this._tick((arguments.length ? arguments : null));
            }
            var ctx = this.canvas.getContext("2d");
            ctx.save();
            this.updateContext(ctx);
            this.draw(ctx, false);
            ctx.restore();
        },

        /**
         * 默认事件处理机制，当接收到 “tick” 事件的时候，调用 Stage.update()。
         * 这里可以直接注册一个 stage 到 {{#crossLink "Ticker"}}{{/crossLink}} 事件监听里面, 通过：
         * 
         *      Ticker.addEventListener("tick", myStage");
         * 
         * 注：如果通过这种模式订阅 ticker，那么该 tick 事件对象将被传递到显示对象，替代了原来的 delta 和 paused 参数
         * @property handleEvent
         * @type Function
         */
        handleEvent: function(evt) {
            if (evt.type == "tick") {
                this.update(evt);
            }
        },

        /**
         * 清空目标 canvas。如果 <code>autoClear</code> 设置为 false 的时候用到。
         * @method clear
         */
        clear: function() {
            if (!this.canvas) {
                return;
            }
            var ctx = this.canvas.getContext("2d");
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        },

        /**
         * 返回一个 stage 内容里的 Base64 编码的图片资源路径，返回的数据可以被指定为一个图像元素的资源路径。
         * @method toDataURL
         * @param {String} backgroundColor 生成的图片的背景颜色。这个值可以是所有 HTML 颜色值。包括 HEX，rgb，rgba。默认是透明的。
         * @param {String} mimeType 生成的图片的 MIME type。默认是 "image/png"，当传入的 MIME type 是未知的，或浏览器不能识别该 MIME type, 则会使用默认值。
         * @return {String} 一个 Base64 编码的图片。
         **/
        toDataURL: function(backgroundColor, mimeType) {
            if (!mimeType) {
                mimeType = "image/png";
            }
            var ctx = this.canvas.getContext('2d');
            var w = this.canvas.width;
            var h = this.canvas.height;
            var data;
            if (backgroundColor) {
                // 为 canvas 获取当前图片数据。
                data = ctx.getImageData(0, 0, w, h);

                // 存储当前globalCompositeOperation
                var compositeOperation = ctx.globalCompositeOperation;

                // 设置在当前内容后面绘制
                ctx.globalCompositeOperation = "destination-over";

                //设置背景颜色
                ctx.fillStyle = backgroundColor;

                //整个画布上绘制背景
                ctx.fillRect(0, 0, w, h);
            }
            //从画布上获取图像数据
            var dataURL = this.canvas.toDataURL(mimeType);
            if (backgroundColor) {
                //清空 canvas
                ctx.clearRect(0, 0, w, h);

                //恢复原来的设置
                ctx.putImageData(data, 0, 0);

                //恢复 globalCompositeOperation 为原来值
                ctx.globalCompositeOperation = compositeOperation;
            }
            return dataURL;
        },

        /**
         * 设置监听或不监听（传递的 frequency 为 0）这个 stage 里面的所有显示对象的 mouse over 事件（moverover 和 mouseout）。
         * 这些事件都是高消耗性能的，所以它们的默认值都为 false。
         * 而且事件的频率可以通过独立设置 mouse move 事件的可选项 <code>frequency</code> 去改变的。
         * @method enableMouseOver
         * @param {Number} [frequency=20] 可选参数，指定监听 mousemove 事件的最大时间间隔。
         * 当该值为0的时候，表示不监听 mouse over 事件。最大值为 50。
         * 频率越低越不敏感，但消耗 CPU 就越少。
         **/
        enableMouseOver: function(frequency) {
            if (this._mouseOverIntervalID) {
                clearInterval(this._mouseOverIntervalID);
                this._mouseOverIntervalID = null;
            }
            if (frequency == null) {
                frequency = 20;
            } else if (frequency <= 0) {
                return;
            }
            var o = this;
            this._mouseOverIntervalID = setInterval(function() {
                o._testMouseOver();
                o._testTouchOver();
            }, 1000 / Math.min(1000, frequency));
        },

        /**
         * Enables or disables the event listeners that stage adds to DOM elements (window, document and canvas).
         * It is good practice to disable events when disposing of a Stage instance, otherwise the stage will
         * continue to receive events from the page.
         *
         * @method enableDOMEvents
         * @param {Boolean} [enable=true] Indicates whether to enable or disable the events. Default is true.
         */
        enableDOMEvents: function(enable) {
            if (enable == null) {
                enable = true;
            }
            var n, o, ls = this._eventListeners;
            if (!enable && ls) {
                for (n in ls) {
                    o = ls[n];
                    o.t.removeEventListener(n, o.f);
                }
                this._eventListeners = null;
            } else if (enable && !ls) {
                var t = window.addEventListener ? window : document;
                var _this = this;
                ls = this._eventListeners = {};
                ls["mouseup"] = {
                    t: t,
                    f: function(e) {
                        _this._handleMouseUp(e)
                    }
                };
                ls["mousemove"] = {
                    t: t,
                    f: function(e) {
                        _this._handleMouseMove(e)
                    }
                };
                ls["dblclick"] = {
                    t: t,
                    f: function(e) {
                        _this._handleDoubleClick(e)
                    }
                };
                t = this.canvas;
                if (t) {
                    ls["mousedown"] = {
                        t: t,
                        f: function(e) {
                            _this._handleMouseDown(e)
                        }
                    };
                }
                for (n in ls) {
                    o = ls[n];
                    o.t.addEventListener(n, o.f);
                }
            }
        },

        /**
         * 返回一个克隆后的 stage 实例。
         * 
         * @return {Stage} 一个克隆后的 stage 实例。
         **/
        clone: function() {
            var o = new Stage(null);
            this.cloneProps(o);
            return o;
        },

        /**
         * 返回该对象的字符串表示形式。
         * 
         * @method toString
         * @return {String} 该对象的字符串表示形式。
         **/
        toString: function() {
            return "[Stage (name=" + this.name + ")]";
        },

        /**
         * @method _getPointerData
         * @protected
         * @param {Number} id
         */
        _getPointerData: function(id) {
            var data = this._pointerData[id];
            if (!data) {
                data = this._pointerData[id] = {
                    x: 0,
                    y: 0
                };
                // 如果是鼠标第一次点击或第一次触碰，就是指它为私用的指针 id：
                if (this._primaryPointerID == null) {
                    this._primaryPointerID = id;
                }
            }
            return data;
        },

        /**
         * @method _handleMouseMove
         * @protected
         * @param {MouseEvent} e
         */
        _handleMouseMove: function(e) {
            if (!e) {
                e = window.event;
            }
            this._handlePointerMove(-1, e, e.pageX, e.pageY);
        },

        /**
         * @method _handlePointerMove
         * @protected
         * @param {Number} id
         * @param {Event} e
         * @param {Number} pageX
         * @param {Number} pageY
         */
        _handlePointerMove: function(id, e, pageX, pageY) {
            if (!this.canvas) {
                return;
            } // this.mouseX = this.mouseY = null;
            var evt;
            var o = this._getPointerData(id);
            var inBounds = o.inBounds;
            this._updatePointerPosition(id, pageX, pageY);
            if (!inBounds && !o.inBounds && !this.mouseMoveOutside) {
                return;
            }
            if (this.hasEventListener("stagemousemove")) {
                evt = new MouseEvent("stagemousemove", o.x, o.y, this, e, id, id == this._primaryPointerID, o.rawX, o.rawY);
                this.dispatchEvent(evt);
            }
            var oEvt = o.event;
            if (oEvt && oEvt.hasEventListener("mousemove")) {
                evt = new MouseEvent("mousemove", o.x, o.y, oEvt.target, e, id, id == this._primaryPointerID, o.rawX, o.rawY);
                oEvt.dispatchEvent(evt, oEvt.target);
            }
        },

        /**
         * @method _updatePointerPosition
         * @protected
         * @param {Number} id
         * @param {Number} pageX
         * @param {Number} pageY
         */
        _updatePointerPosition: function(id, pageX, pageY) {
            var rect = this._getElementRect(this.canvas);
            pageX -= rect.left;
            pageY -= rect.top;
            var w = this.canvas.width;
            var h = this.canvas.height;
            pageX /= (rect.right - rect.left) / w;
            pageY /= (rect.bottom - rect.top) / h;
            var o = this._getPointerData(id);
            if (o.inBounds = (pageX >= 0 && pageY >= 0 && pageX <= w - 1 && pageY <= h - 1)) {
                o.x = pageX;
                o.y = pageY;
            } else if (this.mouseMoveOutside) {
                o.x = pageX < 0 ? 0 : (pageX > w - 1 ? w - 1 : pageX);
                o.y = pageY < 0 ? 0 : (pageY > h - 1 ? h - 1 : pageY);
            }
            o.rawX = pageX;
            o.rawY = pageY;
            if (id == this._primaryPointerID) {
                this.mouseX = o.x;
                this.mouseY = o.y;
                this.mouseInBounds = o.inBounds;
            }
            this.touchs[id] = {
                id: id,
                x: o.x,
                y: o.y,
                inBounds: o.inBounds
            }
        },

        /**
         * @method _getElementRect
         * @protected
         * @param {HTMLElement} e
         */
        _getElementRect: function(e) {
            if(typeof Canvas != "undefined") {
                return {
                    left : 0,
                    right : e.width,
                    top : 0,
                    bottom : e.height
                };
            } else {
                var bounds;
                try {
                    bounds = e.getBoundingClientRect();
                } // this can fail on disconnected DOM elements in IE9
                catch (err) {
                    bounds = {
                        top: e.offsetTop,
                        left: e.offsetLeft,
                        width: e.offsetWidth,
                        height: e.offsetHeight
                    };
                }
                var offX = (window.pageXOffset || document.scrollLeft || 0) - (document.clientLeft || document.body.clientLeft || 0);
                var offY = (window.pageYOffset || document.scrollTop || 0) - (document.clientTop || document.body.clientTop || 0);
                var styles = window.getComputedStyle ? getComputedStyle(e) : e.currentStyle; // IE <9 compatibility.
                var padL = parseInt(styles.paddingLeft) + parseInt(styles.borderLeftWidth);
                var padT = parseInt(styles.paddingTop) + parseInt(styles.borderTopWidth);
                var padR = parseInt(styles.paddingRight) + parseInt(styles.borderRightWidth);
                var padB = parseInt(styles.paddingBottom) + parseInt(styles.borderBottomWidth);
                // note: in some browsers bounds properties are read only.
                return {
                    left: bounds.left + offX + padL,
                    right: bounds.right + offX - padR,
                    top: bounds.top + offY + padT,
                    bottom: bounds.bottom + offY - padB
                }
            }
        },

        /**
         * @method _handleMouseUp
         * @protected
         * @param {MouseEvent} e
         */
        _handleMouseUp: function(e) {
            this._handlePointerUp(-1, e, false);
        },

        /**
         * @method _handlePointerUp
         * @protected
         * @param {Number} id
         * @param {Event} e
         * @param {Boolean} clear
         */
        _handlePointerUp: function(id, e, clear) {
            var o = this._getPointerData(id);
            var evt;
            if (this.hasEventListener("stagemouseup")) {
                evt = new MouseEvent("stagemouseup", o.x, o.y, this, e, id, id == this._primaryPointerID, o.rawX, o.rawY);
                this.dispatchEvent(evt);
            }
            var oEvt = o.event;
            if (oEvt && oEvt.hasEventListener("mouseup")) {
                evt = new MouseEvent("mouseup", o.x, o.y, oEvt.target, e, id, id == this._primaryPointerID, o.rawX, o.rawY);
                oEvt.dispatchEvent(evt, oEvt.target);
            }
            var oTarget = o.target;
            if (oTarget && oTarget.hasEventListener("click") && 
                this._getObjectsUnderPoint(o.x, o.y, null, true, (this._mouseOverIntervalID ? 3 : 1)) == oTarget) {
                evt = new MouseEvent("click", o.x, o.y, oTarget, e, id, id == this._primaryPointerID, o.rawX, o.rawY);
                oTarget.dispatchEvent(evt);
            }
            if (clear) {
                if (id == this._primaryPointerID) {
                    this._primaryPointerID = null;
                }
                delete (this._pointerData[id]);
            } else {
                o.event = o.target = null;
            }
        },

        /**
         * @method _handleMouseDown
         * @protected
         * @param {MouseEvent} e
         */
        _handleMouseDown: function(e) {
            this._handlePointerDown(-1, e, false);
        },

        /**
         * @method _handlePointerDown
         * @protected
         * @param {Number} id
         * @param {Event} e
         * @param {Number} x
         * @param {Number} y
         */
        _handlePointerDown: function(id, e, x, y) {
            var o = this._getPointerData(id);
            if (y != null) {
                this._updatePointerPosition(id, x, y);
            }
            if (this.hasEventListener("stagemousedown")) {
                var evt = new MouseEvent("stagemousedown", o.x, o.y, this, e, id, id == this._primaryPointerID, o.rawX, o.rawY);
                this.dispatchEvent(evt);
            }
            var target = this._getObjectsUnderPoint(o.x, o.y, null, (this._mouseOverIntervalID ? 3 : 1));
            if (target) {
                o.target = target;
                if (target.hasEventListener("mousedown")) {
                    evt = new MouseEvent("mousedown", o.x, o.y, target, e, id, id == this._primaryPointerID, o.rawX, o.rawY);
                    target.dispatchEvent(evt);
                    if (evt.hasEventListener("mousemove") || evt.hasEventListener("mouseup")) {
                        o.event = evt;
                    }
                }
            }
        },

        /**
         * @method _testMouseOver
         * @protected
         */
        _testMouseOver: function() {
            // 就目前而言，这只是测试鼠标
            if (this._primaryPointerID != -1) {
                return;
            }
            // 仅当鼠标位置发生改变时才更新，这里提供了很多优化的地方，所以需要放弃某些其他东西。
            if (this.mouseX == this._mouseOverX && this.mouseY == this._mouseOverY && this.mouseInBounds) {
                return;
            }
            var target = null;
            if (this.mouseInBounds) {
                target = this._getObjectsUnderPoint(this.mouseX, this.mouseY, null, 3);
                this._mouseOverX = this.mouseX;
                this._mouseOverY = this.mouseY;
            }
            var mouseOverTarget = this._mouseOverTarget;
            if (mouseOverTarget != target) {
                var o = this._getPointerData(-1);
                if (mouseOverTarget && mouseOverTarget.hasEventListener("mouseout")) {
                    var evt = new MouseEvent("mouseout", o.x, o.y, mouseOverTarget, null, -1, o.rawX, o.rawY);
                    mouseOverTarget.dispatchEvent(evt);
                }
                if (mouseOverTarget) {
                    this.canvas.style.cursor = "";
                }
                if (target && target.hasEventListener("mouseover")) {
                    evt = new MouseEvent("mouseover", o.x, o.y, target, null, -1, o.rawX, o.rawY);
                    target.dispatchEvent(evt);
                }
                if (target) {
                    this.canvas.style.cursor = target.cursor || "";
                }
                this._mouseOverTarget = target;
            }
        },

        touchs: {},
        _touchOver: {},
        mouseOverTargets: {},

        _testTouchOver: function() {
            for (var i in this.touchs) {
                if (i == -1) {
                    continue;
                }
                var touch = this.touchs[i];
                var _touchOver = this._touchOver[i];
                if (touch && _touchOver && _touchOver.x == touch.x && _touchOver.y == touch.y && touch.inBounds) {
                    continue;
                };

                var target = null;
                if (touch.inBounds) {
                    target = this._getObjectsUnderPoint(touch.x, touch.y, null, 3);
                    this._touchOver[i] = {
                        x: touch.x,
                        y: touch.y
                    }
                }

                var mouseOverTarget = this.mouseOverTargets[i];
                if (mouseOverTarget != target) {
                    var o = this._getPointerData(i);
                    if (mouseOverTarget && (mouseOverTarget.onMouseOut || mouseOverTarget.hasEventListener("mouseout"))) {
                        var evt = new createjs.MouseEvent("mouseout", o.x, o.y, mouseOverTarget, null, -1, o.rawX, o.rawY);
                        mouseOverTarget.onMouseOut && mouseOverTarget.onMouseOut(evt);
                        mouseOverTarget.dispatchEvent(evt);
                        this.touchs[i] = undefined;
                    }
                    if (mouseOverTarget) {
                        this.canvas.style.cursor = "";
                    }

                    if (target && (target.onMouseOver || target.hasEventListener("mouseover"))) {
                        evt = new createjs.MouseEvent("mouseover", o.x, o.y, target, null, -1, o.rawX, o.rawY);
                        target.onMouseOver && target.onMouseOver(evt);
                        target.dispatchEvent(evt);
                    }
                    if (target) {
                        this.canvas.style.cursor = target.cursor || "";
                    }

                    this.mouseOverTargets[i] = target;
                }
            }
        },

        /**
         * @method _handleDoubleClick
         * @protected
         * @param {MouseEvent} e
         */
        _handleDoubleClick: function(e) {
            var o = this._getPointerData(-1);
            var target = this._getObjectsUnderPoint(o.x, o.y, null, (this._mouseOverIntervalID ? 3 : 1));
            if (target && target.hasEventListener("dblclick")) {
                evt = new MouseEvent("dblclick", o.x, o.y, target, e, -1, true, o.rawX, o.rawY);
                target.dispatchEvent(evt);
            }
        }
    });

    return Stage;

});