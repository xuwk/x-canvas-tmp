xc.module.define("xc.createjs.BitmapAnimation", function(exports) {

    var DisplayObject = xc.module.require("xc.createjs.DisplayObject");

    /**
     * 图片精灵的帧或帧序列（即动画）。一个图片精灵就是一系列的图片（通常是动画帧）
     * 组合到一张大图片中（或许多张图片）。例如，一个动画由 8 张 100x100 的图片组成，就会组合成一个 400 x 200 的图片精灵。
     * 可以单独将一个帧作为动画播放，也可以将多个动画组合在一起播放。
     *
     * 看 {{#crossLink "SpriteSheet"}}{{/crossLink}} 类获取更多关于构建帧和动画的信息。
     *
     * <h4>例子</h4>
     *      var instance = new createjs.BitmapAnimation(spriteSheet);
     *      instance.gotoAndStop("frameName");
     *
     * @class BitmapAnimation
     * @extends DisplayObject
     * @constructor
     * @param {SpriteSheet} spriteSheet 待播放的SpriteSheet实例。
     * 这里包括图片资源，帧尺寸，和帧数据。看 {{#crossLink "SpriteSheet"}}{{/crossLink}} 获取更多信息。
     */
    var BitmapAnimation = DisplayObject.extend({
        initialize: function(spriteSheet) {
            this._super();
            this.spriteSheet = spriteSheet;
        },

        /**
         * 当动画播放到尾之后触发。
         *
         * @event animationend
         * @param {Object} target 监听该事件的目标对象。
         * @param {String} type 事件类型。
         * @param {String} name 刚播放完的动画的名称。
         * @param {String} next 下一个要播放的动画，或为 null，如果动画在循环，则这个值和 name 属性的值相同。
         */

        /**
         * 当 draw 方法在执行时，将要被渲染的帧。
         * 注：有一些 SpriteSheet 数据是不按顺序前进的。
         * 只读。
         *
         * @property currentFrame
         * @type {Number}
         * @default -1
         */
        currentFrame: -1,

        /**
         * 返回正在播放的动画。只读。
         *
         * @property currentAnimation
         * @type {String}
         * @final
         */
        currentAnimation: null, // 只读

        /**
         * 阻止动画前进。例如，可以创建一个图片精灵，然后设置 paused 属性 为 true，
         * 而通过改变 <code>currentFrame</code> 的值来达到播放效果。
         *
         * @property paused
         * @type {Boolean}
         * @default false
         */
        paused: true,

        /**
         * 当前实例正在播放的 SpriteSheet。这里包括图片资源，帧尺寸，和帧数据。
         * 看 {{#crossLink "SpriteSheet"}}{{/crossLink}} 获取更多信息。
         *
         * @property spriteSheet
         * @type {SpriteSheet}
         */
        spriteSheet: null,

        /**
         * 是否需要根据全像素坐标绘制。
         *
         * @property snapToPixel
         * @type {Boolean}
         * @default true
         */
        snapToPixel: true,

        /**
         * 当使用多个交替的动画的时候，这个能决定哪个 tick 才是播放头。
         * 举例，可以创建 2 个 BitmapAnimation 对象，大家的频率都是 2，但其中有一个的 offset 属性设置为 1。两个实例都会在每一
         * 个 tick 往前移，但它们会交替向前。（属性所影响到的地方就是，其中一个将会在奇数 tick 的时候前进，另外一个则会在偶数 tick 的时候前进）。
         *
         * @property offset
         * @type {Number}
         * @default 0
         */
        offset: 0,

        /**
         * 指定当前正在播放的动画的帧的索引号。当播放是正常的时候，这里会返回当前动画的帧的索引号。
         *
         * @property currentAnimationFrame
         * @type {Number}
         * @default 0
         */
        currentAnimationFrame: 0,

        /**
         * @property _advanceCount
         * @protected
         * @type {Number}
         * @default 0
         */
        _advanceCount: 0,

        /**
         * @property _animation
         * @protected
         * @type {Object}
         * @default null
         */
        _animation: null,

        /**
         * 通过返回 true 或 false 去表示该显示对象画在 Canvas 上时，是否被显示。
         * 并不是通过该显示对象是否在 Stage 可视范围内进行判断的。
         * 注：这种方法主要是供内部使用，即使它可能有高级用法。
         *
         * @method isVisible
         * @return {Boolean} Boolean 表示该显示对象画在 Canvas 上时，是否被显示。
         */
        isVisible: function() {
            var hasContent = this.cacheCanvas || (this.spriteSheet.complete && this.currentFrame >= 0);
            return !!(this.visible && this.alpha > 0 && this.scaleX != 0 && this.scaleY != 0 && hasContent);
        },

        /**
         * 绘制显示对象到指定的上下文，忽略 visible, alpha, shadow, and transform 属性。
         * 当绘制动作正在处理，将返回 true （用于覆盖功能）。
         * 注：这种方法主要是供内部使用，即使它可能有高级用法。
         *
         * @method draw
         * @param {CanvasRenderingContext2D} ctx canvas 2D 上下文对象将渲染到这里。
         * @param {Boolean} ignoreCache 表示这个绘制行为是否忽略当前所有缓存。
         * 例如，用来画 cache （以防止它简单地绘制到自身现有的 cache 上）。
         */
        draw: function(ctx, ignoreCache) {
            if (this._super(ctx, ignoreCache)) {
                return true;
            }
            this._normalizeFrame();
            var o = this.spriteSheet.getFrame(this.currentFrame);
            if (!o) {
                return false;
            }
            var rect = o.rect;
            ctx.drawImage(o.image, rect.x, rect.y, rect.width, rect.height, -o.regX, -o.regY, rect.width, rect.height);
            return true;
        },

        /**
         * 播放正在暂停的动画。
         * 当调用 {{#crossLink "BitmapAnimation/stop"}}{{/crossLink}} 或 {{#crossLink "BitmapAnimation/gotoAndStop"}}{{/crossLink}} 时，
         * BitmapAnimation 就会暂停。
         * 单格动画将保持不变。
         *
         * @method play
         */
        play: function() {
            this.paused = false;
        },

        /**
         * 停止正在播放的动画。
         * 当调用 {{#crossLink "BitmapAnimation/gotoAndPlay"}}{{/crossLink}} 时，动画就会播放。
         * 注：当调用 {{#crossLink "BitmapAnimation/gotoAndPlay"}}{{/crossLink}} 或 {{#crossLink "BitmapAnimation/play"}}{{/crossLink}} 的时候会恢复播放。
         *
         * @method stop
         */
        stop: function() {
            this.paused = true;
        },

        /**
         * 设置 paused 属性为 false 以及跳到特定的帧或帧号，播放特定的动画。
         *
         * @method gotoAndPlay
         * @param {String|Number} frameOrAnimation 将要播放的帧号或动画名称。
         */
        gotoAndPlay: function(frameOrAnimation) {
            this.paused = false;
            this._goto(frameOrAnimation);
        },

        /**
         * 设置 paused 属性为 true 以及跳到特定的帧或帧号，停止播放特定的动画。
         *
         * @method gotoAndStop
         * @param {String|Number} frameOrAnimation 将要到那里停止播放的帧号或动画名称。
         */
        gotoAndStop: function(frameOrAnimation) {
            this.paused = true;
            this._goto(frameOrAnimation);
        },

        /**
         * 推进正在播放的动画。在每一个 tick 都会自动调用。
         *
         * @method advance
         */
        advance: function() {
            if (this._animation) {
                this.currentAnimationFrame++;
            } else {
                this.currentFrame++;
            }
            this._normalizeFrame();
        },

        /**
         * 返回一个描述当前帧相对于帧原点的 {{#crossLink "Rectangle"}}{{/crossLink}} 实例。
         * 举例，一个 90 x 70 的帧，<code>regX=50</code> 和 <code>regY=40</code> 将会返回 [x=-50, y=-40, width=90, height=70]
         *
         * 也可以看 SpriteSheet 的 {{#crossLink "SpriteSheet/getFrameBounds"}}{{/crossLink}} 方法获取更多信息。
         *
         * @method getBounds
         * @return {Rectangle} 一个 Rectangle 实例. 当帧不存在或图片没有加载完全的时候，返回 null。
         */
        getBounds: function() {
            return this.spriteSheet.getFrameBounds(this.currentFrame);
        },

        /**
         * 返回克隆后的 BitmapAnimation 实例。注：克隆出来的 BitmapAnimation 实例与原来的 BitmapAnimation 共用一个 SpriteSheet。
         *
         * @method clone
         * @return {BitmapAnimation} 克隆后的 BitmapAnimation 实例。
         */
        clone: function() {
            var o = new BitmapAnimation(this.spriteSheet);
            this.cloneProps(o);
            return o;
        },

        /**
         * 返回该对象的字符串表示形式。
         *
         * @method toString
         * @return {String} 该对象的字符串表示形式。
         */
        toString: function() {
            return "[BitmapAnimation (name=" + this.name + ")]";
        },

        /**
         * 如果 paused = true，推进 <code>currentFrame</code> 。每当 {{#crossLink "Stage"}}{{/crossLink}} 调用 tick 的时候，这个方法就会自动执行。
         *
         * @protected
         * @method _tick
         */
        _tick: function(params) {
            var f = this._animation ? this._animation.frequency : 1;
            if (!this.paused && ((++this._advanceCount) + this.offset) % f == 0) {
                this.advance();
            }
            this._super(params);
        },

        /**
         * 标准化的当前帧，推进动画和调度适当的回调。
         *
         * @protected
         * @method _normalizeCurrentFrame
         */
        _normalizeFrame: function() {
            var animation = this._animation;
            var frame = this.currentFrame;
            var paused = this.paused;
            var l;
            if (animation) {
                l = animation.frames.length;
                if (this.currentAnimationFrame >= l) {
                    var next = animation.next;
                    if (this._dispatchAnimationEnd(animation, frame, paused, next, l - 1)) {
                        // 当事件栈改变的时候做出的相关处理。
                    } else if (next) {
                        this._goto(next);
                    } else {
                        this.paused = true;
                        this.currentAnimationFrame = animation.frames.length - 1;
                        this.currentFrame = animation.frames[this.currentAnimationFrame];
                    }
                } else {
                    this.currentFrame = animation.frames[this.currentAnimationFrame];
                }
            } else {
                l = this.spriteSheet.getNumFrames();
                if (frame >= l) {
                    if (!this._dispatchAnimationEnd(animation, frame, paused, l - 1)) {
                        this.currentFrame = 0;
                    }
                }
            }
        },

        /**
         * 调用 animationend 事件。当动画发生了改变的时候返回 true。
         * (例如，调用 {{#crossLink "BitmapAnimation/stop"}}{{/crossLink}}, {{#crossLink "BitmapAnimation/gotoAndPlay"}}{{/crossLink}}等等.)
         *
         * @property _dispatchAnimationEnd
         * @private
         * @type {Function}
         */
        _dispatchAnimationEnd: function(animation, frame, paused, next, end) {
            var name = animation ? animation.name : null;
            this.dispatchEvent({
                type: "animationend",
                name: name,
                next: next
            });
            if (!paused && this.paused) {
                this.currentAnimationFrame = end;
            }
            return (this.paused != paused || this._animation != animation || this.currentFrame != frame);
        },

        /**
         * @method cloneProps
         * @param {Text} o
         * @protected
         */
        cloneProps: function(o) {
            this._super(o);
            o.currentFrame = this.currentFrame;
            o.currentAnimation = this.currentAnimation;
            o.paused = this.paused;
            o.offset = this.offset;
            o._animation = this._animation;
            o.currentAnimationFrame = this.currentAnimationFrame;
        },

        /**
         * 将播放头移动到指定的帧号或动画。
         *
         * @method _goto
         * @param {String|Number} frameOrAnimation 将要移动到的帧号或动画。
         * @protected
         */
        _goto: function(frameOrAnimation) {
            if (isNaN(frameOrAnimation)) {
                var data = this.spriteSheet.getAnimation(frameOrAnimation);
                if (data) {
                    this.currentAnimationFrame = 0;
                    this._animation = data;
                    this.currentAnimation = frameOrAnimation;
                    this._normalizeFrame();
                }
            } else {
                this.currentAnimation = this._animation = null;
                this.currentFrame = frameOrAnimation;
            }
        }
    });

    return BitmapAnimation;

});
