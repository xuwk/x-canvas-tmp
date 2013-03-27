xc.module.define("xc.createjs.MovieClip", function(exports) {

    var Container = xc.module.require("xc.createjs.Container");
    var Timeline = xc.module.require("xc.createjs.Timeline");
    var Tween = xc.module.require("xc.createjs.Tween");
    var DisplayObject = xc.module.require("xc.createjs.DisplayObject");

    /**
     * MovieClip 类关联一个 EaselJS {{#crossLink "Container"}}{{/crossLink}} 的 TweenJS Timeline。
     * 它可以创建封装时间轴动画对象，可以改变状态，和同步 action。
     * 由于制作一套影片的固有复杂性，这将主要作为输出工具，并不包含在主 EaselJS 库里。
     *
     * 目前 MovieClip 只能基于 tick 去工作，但已做出一些让步让它在未来能基于时间表去工作。
     *
     * @class MovieClip
     * @main MovieClip
     * @extends Container
     * @constructor
     * @param {String} mode 初始化 mode 属性。是 MovieClip.INDEPENDENT, MovieClip.SINGLE_FRAME, 或 MovieClip.SYNCHED 其中一个值。
     * @param {Number} startPosition 初始化 startPosition 属性
     * @param {Boolean} loop 初始化 loop 属性.
     * @param {Object} labels 一个 labels 的 hash 表传入 timeline 实例。
     **/
    var MovieClip = Container.extend({
        initialize: function(mode, startPosition, loop, labels) {
            this.mode = mode || MovieClip.INDEPENDENT;
            this.startPosition = startPosition || 0;
            this.loop = loop;
            props = {
                paused: true,
                position: startPosition,
                useTicks: true
            };
            this._super();
            this.timeline = new Timeline(null, labels, props);
            this._managed = {};
        },

        /**
         * 控制这个 MovieClip 的前进模式。必须是 0 (INDEPENDENT), 1 (SINGLE_FRAME), 或 2 (SYNCHED) 其中一个模式。
         * 
         * @property mode
         * @type String
         * @default null
         */
        mode: null,

        /**
         * 指定 movieclip 从第几帧开始，如果 mode 的值为 SINGLE_FRAME，则该参数是指定只播放哪一帧。
         * 
         * @property startPosition
         * @type Number
         * @default 0
         */
        startPosition: 0,

        /**
         * 说明当前 MovieClip 播放完的时候是否循环播放。
         * 
         * @property loop
         * @type Boolean
         * @default true
         */
        loop: true,

        /**
         * 只读。movieclip 当前的帧。
         * 
         * @property currentFrame
         * @type Number
         */
        currentFrame: 0,

        /**
         * 当前影片的时间轴。这是当 MovieClip 创建的时候就初始化好的。
         * 
         * @property timeline
         * @type Timeline
         * @default null
         */
        timeline: null,

        /**
         * 如果该值为 true，则 MovieClip 将会暂停。
         * 
         * @property paused
         * @type Boolean
         * @default false
         */
        paused: false,

        /**
         * 如果为 true，MovieClip 里面的 action 就会当播放头前进的时候运行。
         * 
         * @property actionsEnabled
         * @type Boolean
         * @default true
         */
        actionsEnabled: true,

        /**
         * 如果为 true，则 timeline 在任何时候往展示列表里面添加返回属性的时候，MoiveClip 都将自动重置到第一帧。
         * 这个仅仅在 mode=INDEPENDENT 的时候生效。
         * <br><br>
         * 举例，如果有一个含有 "body" 子动画的动画。可以设置 body.autoReset = false。
         * 那就可以掌控帧的行为，不用担心它会自动重置了。
         * 
         * @property autoReset
         * @type Boolean
         * @default true
         */
        autoReset: true,

        /**
         * @property _synchOffset
         * @type Number
         * @default 0
         * @private
         */
        _synchOffset: 0,

        /**
         * @property _prevPos
         * @type Number
         * @default -1
         * @private
         */
        _prevPos: -1, // TODO: evaluate using a ._reset Boolean prop instead
        // of -1.

        /**
         * @property _prevPosition
         * @type Number
         * @default 0
         * @private
         */
        _prevPosition: 0,

        /**
         * 将受 MovieClip 管理的显示对象列表。
         * 
         * @property _managed
         * @type Object
         * @private
         */
        _managed: null,

        /**
         * 通过返回 true 或 false 去表示该显示对象画在 canvas 上时，是否被显示。
         * 并不是通过该显示对象是否在 Stage 可视范围内进行判断的。
         * 注：这种方法主要是供内部使用，即使它可能有高级用法。
         * @method isVisible
         * @return {Boolean} Boolean 表示该显示对象画在 Canvas 上时，是否被显示。
         **/
        isVisible: function() {
            // children are placed in draw, so we can't determine if we have
            // content.
            return !!(this.visible && this.alpha > 0 && this.scaleX != 0 && this.scaleY != 0);
        },

        /**
         * 绘制显示对象到指定的上下文，忽略 visible, alpha, shadow, and transform 属性。
         * 当绘制动作正在处理，将返回 true （用于覆盖功能）。
         * 注：这种方法主要是供内部使用，即使它可能有高级用法。
         * @method draw
         * @param {CanvasRenderingContext2D} ctx canvas 2D 上下文对象将渲染到这里。
         * @param {Boolean} ignoreCache 表示这个绘制行为是否忽略当前所有缓存。
         * 例如，用来画 cache （以防止它简单地绘制到自身现有的 cache 上）。
         **/
        draw: function(ctx, ignoreCache) {
            // draw to cache first:
            this.dispObj = new DisplayObject();
            var DisplayObject_draw = this.dispObj.draw;
            if (DisplayObject_draw.apply(this.dispObj, ctx, ignoreCache)) {
                return true;
            }
            this._updateTimeline();
            this._super(ctx, ignoreCache); // Container's draw()
        },

        /**
         * 设置 paused 为 false。
         * @method play
         **/
        play: function() {
            this.paused = false;
        },

        /**
         * 设置 paused 为 true。
         * @method stop
         **/
        stop: function() {
            this.paused = true;
        },

        /**
         * 在特定的位置开始播放该 movie clip。
         * 
         * @method gotoAndPlay
         * @param {String|Number} positionOrLabel
         **/
        gotoAndPlay: function(positionOrLabel) {
            this.paused = false;
            this._goto(positionOrLabel);
        },

        /**
         * 在特定的位置停止该 movie clip。
         * 
         * @method gotoAndStop
         * @param {String|Number} positionOrLabel
         **/
        gotoAndStop: function(positionOrLabel) {
            this.paused = true;
            this._goto(positionOrLabel);
        },

        /**
         * MovieClip 对象不能被克隆。
         * 
         * @method clone
         **/
        clone: function() {
            // TODO: add support for this? Need to clone the Timeline & retarget
            // tweens - pretty complex.
            throw ("MovieClip cannot be cloned.")
        },

        /**
         * 返回该对象的字符串表示形式。
         * 
         * @method toString
         * @return {String} 该对象的字符串表示形式。
         **/
        toString: function() {
            return "[MovieClip (name=" + this.name + ")]";
        },

        /**
         * @method _tick
         * @private
         */
        _tick: function(params) {
            if (!this.paused && this.mode == MovieClip.INDEPENDENT) {
                this._prevPosition = (this._prevPos < 0) ? 0 : this._prevPosition + 1;
            }
            this._super(params);
        },

        /**
         * @method _goto
         * @private
         */
        _goto: function(positionOrLabel) {
            var pos = this.timeline.resolve(positionOrLabel);
            if (pos == null) {
                return;
            }
            // prevent _updateTimeline from overwriting the new position because
            // of a reset:
            if (this._prevPos == -1) {
                this._prevPos = NaN;
            }
            this._prevPosition = pos;
            this._updateTimeline();
        },

        /**
         * @method _reset
         * @private
         */
        _reset: function() {
            this._prevPos = -1;
            this.currentFrame = 0;
        },

        /**
         * @method _updateTimeline
         * @private
         */
        _updateTimeline: function() {
            var tl = this.timeline;
            var tweens = tl._tweens;
            var kids = this.children;
            var synched = this.mode != MovieClip.INDEPENDENT;
            tl.loop = this.loop == null ? true : this.loop;
            // 更新时间抽位置，如果是 graphic，则忽略动作。
            if (synched) {
                // TODO: this would be far more ideal if the _synchOffset was
                // somehow provided by the parent, so that reparenting wouldn't
                // cause problems and we can direct draw. Ditto for _off (though
                // less important).
                tl.setPosition(this.startPosition + (this.mode == MovieClip.SINGLE_FRAME ? 0 : this._synchOffset), Tween.NONE);
            } else {
                tl.setPosition(this._prevPos < 0 ? 0 : this._prevPosition, this.actionsEnabled ? null : Tween.NONE);
            }
            this._prevPosition = tl._prevPosition;
            if (this._prevPos == tl._prevPos) {
                return;
            }
            this.currentFrame = this._prevPos = tl._prevPos;
            for ( var n in this._managed) {
                this._managed[n] = 1;
            }
            for ( var i = tweens.length - 1; i >= 0; i--) {
                var tween = tweens[i];
                var target = tween._target;
                if (target == this) {
                    continue;
                } // TODO: this assumes this is the actions tween. Valid?
                var offset = tween._stepPosition;
                if (target instanceof DisplayObject) {
                    // motion tween.
                    this._addManagedChild(target, offset);
                } else {
                    // state tween.
                    this._setState(target.state, offset);
                }
            }
            for (i = kids.length - 1; i >= 0; i--) {
                var id = kids[i].id;
                if (this._managed[id] == 1) {
                    this.removeChildAt(i);
                    delete (this._managed[id]);
                }
            }
        },

        /**
         * @method _setState
         * @private
         */
        _setState: function(state, offset) {
            if (!state) {
                return;
            }
            for ( var i = 0, l = state.length; i < l; i++) {
                var o = state[i];
                var target = o.t;
                var props = o.p;
                for ( var n in props) {
                    target[n] = props[n];
                }
                this._addManagedChild(target, offset);
            }
        },

        /**
         * 一个孩子添加到时间线，并将其设置为一个托管的孩子。
         * 
         * @method _addManagedChild
         * @private
         **/
        _addManagedChild: function(child, offset) {
            if (child._off) {
                return;
            }
            this.addChild(child);
            if (child instanceof MovieClip) {
                child._synchOffset = offset;
                // TODO: this does not precisely match Flash. Flash loses track
                // of the clip if it is renamed or removed from the timeline,
                // which causes it to reset.
                if (child.mode == MovieClip.INDEPENDENT && child.autoReset && !this._managed[child.id]) {
                    child._reset();
                }
            }
            this._managed[child.id] = 2;
        }
    });

    /**
     * 只读。MovieClip 相对于其父亲是独立的，即使它父亲是暂停的。
     * 这是默认的 mode。
     * 
     * @property INDEPENDENT
     * @static
     * @type String
     * @default "independent"
     */
    MovieClip.INDEPENDENT = "independent";

    /**
     * 只读。MovieClip 将只播放一个独立的 frame（根据 startPosition 属性决定的）。
     * 
     * @property SINGLE_FRAME
     * @static
     * @type String
     * @default "single"
     */
    MovieClip.SINGLE_FRAME = "single";

    /**
     * 只读。每当 MovieClip 的父亲前进，它才会前进，它将与它父亲同步。
     * 
     * @property SYNCHED
     * @static
     * @type String
     * @default "synched"
     */
    MovieClip.SYNCHED = "synched";

    /**
     * 这个插件与 <a href="http://tweenjs.com" target="_blank"> TweenJS </a> 防止 StartPosition 属性补间动画。
     * 
     * @private
     * @class MovieClipPlugin
     * @constructor
     */
    var MovieClipPlugin = function() {
        throw ("MovieClipPlugin cannot be instantiated.")
    }

    /**
     * @method priority
     * @private
     */
    MovieClipPlugin.priority = 100; // very high priority, should run first

    /**
     * @method install
     * @private
     */
    MovieClipPlugin.install = function() {
        Tween.installPlugin(MovieClipPlugin, ["startPosition"]);
    }

    /**
     * @method init
     * @private
     */
    MovieClipPlugin.init = function(tween, prop, value) {
        return value;
    }

    /**
     * @method step
     * @private
     */
    MovieClipPlugin.step = function() {
        // unused.
    }

    /**
     * @method tween
     * @private
     */
    MovieClipPlugin.tween = function(tween, prop, value, startValues, endValues, ratio, wait, end) {
        if (!(tween.target instanceof MovieClip)) {
            return value;
        }
        return (ratio == 1 ? endValues[prop] : startValues[prop]);
    }

    MovieClipPlugin.install();

    return MovieClip;

});
