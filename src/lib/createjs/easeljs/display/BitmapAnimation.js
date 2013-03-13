xc.module.define("xc.createjs.BitmapAnimation", function(exports) {

    var DisplayObject = xc.module.require("xc.createjs.DisplayObject");

    /**
     * Displays frames or sequences of frames (ie. animations) from a sprite sheet image. A sprite sheet is a series of
     * images (usually animation frames) combined into a single image. For example, an animation consisting of 8 100x100
     * images could be combined into a 400x200 sprite sheet (4 frames across by 2 high). You can display individual
     * frames, play frames as an animation, and even sequence animations together.
     *
     * See the {{#crossLink "SpriteSheet"}}{{/crossLink}} class for more information on setting up frames and animations.
     *
     * <h4>Example</h4>
     *     var instance = new BitmapAnimation(spriteSheet);
     *     instance.gotoAndStop("frameName");
     *
     * @class BitmapAnimation
     * @extends DisplayObject
     * @constructor
     * @param {SpriteSheet} spriteSheet The SpriteSheet instance to play back. This includes the source image(s), frame
     *  dimensions, and frame data. See {{#crossLink "SpriteSheet"}}{{/crossLink}} for more information.
     */
    var BitmapAnimation = DisplayObject.extend({
        initialize: function(spriteSheet) {
            this._super();
            this.spriteSheet = spriteSheet;
        },

        /**
         * Dispatched when an animation reaches its ends.
         *
         * @event animationend
         * @param {Object} target The object that dispatched the event.
         * @param {String} type The event type.
         * @param {String} name The name of the animation that just ended.
         * @param {String} next The name of the next animation that will be played, or null.
         *  This will be the same as name if the animation is looping.
         */

        /**
         * The frame that will be drawn when draw is called. Note that with some SpriteSheet data, this will advance
         * non-sequentially. READ-ONLY.
         *
         * @property currentFrame
         * @type {Number}
         * @default -1
         */
        currentFrame: -1,

        /**
         * Returns the currently playing animation. READ-ONLY.
         *
         * @property currentAnimation
         * @type {String}
         * @final
         */
        currentAnimation: null, // READ-ONLY

        /**
         * Prevents the animation from advancing each tick automatically. For example, you could create a sprite sheet of
         * icons, set paused to true, and display the appropriate icon by setting <code>currentFrame</code>.
         *
         * @property paused
         * @type {Boolean}
         * @default false
         */
        paused: true,

        /**
         * The SpriteSheet instance to play back. This includes the source image, frame dimensions, and frame data.
         * See {{#crossLink "SpriteSheet"}}{{/crossLink}} for more information.
         *
         * @property spriteSheet
         * @type {SpriteSheet}
         */
        spriteSheet: null,

        /**
         * Whether or not the image should be draw to the canvas at whole pixel coordinates.
         *
         * @property snapToPixel
         * @type {Boolean}
         * @default true
         */
        snapToPixel: true,

        /**
         * When used in conjunction with animations having an frequency greater than 1, this lets you offset which tick the
         * playhead will advance on. For example, you could create two BitmapAnimations, both playing an animation with a
         * frequency of 2, but one having offset set to 1. Both instances would advance every second tick, but they would
         * advance on alternating ticks (effectively, one instance would advance on odd ticks, the other on even ticks).
         *
         * @property offset
         * @type {Number}
         * @default 0
         */
        offset: 0,

        /**
         * Specifies the current frame index within the current playing animation. When playing normally, this will increase
         * successively from 0 to n-1, where n is the number of frames in the current animation.
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
         * Returns true or false indicating whether the display object would be visible if drawn to a canvas.
         * This does not account for whether it would be visible within the boundaries of the stage.
         *
         * Note: This method is mainly for internal use, though it may be useful for advanced uses.
         *
         * @method isVisible
         * @return {Boolean} Boolean indicating whether the display object would be visible if drawn to a canvas
         */
        isVisible: function() {
            var hasContent = this.cacheCanvas || (this.spriteSheet.complete && this.currentFrame >= 0);
            return !!(this.visible && this.alpha > 0 && this.scaleX != 0 && this.scaleY != 0 && hasContent);
        },

        /**
         * Draws the display object into the specified context ignoring it's visible, alpha, shadow, and transform.
         * Returns true if the draw was handled (useful for overriding functionality).
         *
         * Note: This method is mainly for internal use, though it may be useful for advanced uses.
         *
         * @method draw
         * @param {CanvasRenderingContext2D} ctx The canvas 2D context object to draw into.
         * @param {Boolean} ignoreCache Indicates whether the draw operation should ignore any current cache.
         *  For example, used for drawing the cache (to prevent it from simply drawing an existing cache back into itself).
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
         * Begin playing a paused animation.
         * The BitmapAnimation will be paused if either {{#crossLink "BitmapAnimation/stop"}}{{/crossLink}}
         * or {{#crossLink "BitmapAnimation/gotoAndStop"}}{{/crossLink}} is called.
         * Single frame animations will remain unchanged.
         *
         * @method play
         */
        play: function() {
            this.paused = false;
        },

        /**
         * Stop playing a running animation.
         * The BitmapAnimation will be playing if {{#crossLink "BitmapAnimation/gotoAndPlay"}}{{/crossLink}} is called.
         * Note that calling {{#crossLink "BitmapAnimation/gotoAndPlay"}}{{/crossLink}}
         * or {{#crossLink "BitmapAnimation/play"}}{{/crossLink}} will resume playback.
         *
         * @method stop
         */
        stop: function() {
            this.paused = true;
        },

        /**
         * Sets paused to false and plays the specified animation name, named frame, or frame number.
         *
         * @method gotoAndPlay
         * @param {String|Number} frameOrAnimation The frame number or animation name that the playhead should move to and
         *  begin playing.
         */
        gotoAndPlay: function(frameOrAnimation) {
            this.paused = false;
            this._goto(frameOrAnimation);
        },

        /**
         * Sets paused to true and seeks to the specified animation name, named frame, or frame number.
         *
         * @method gotoAndStop
         * @param {String|Number} frameOrAnimation The frame number or animation name that the playhead should move to and
         *  stop.
         */
        gotoAndStop: function(frameOrAnimation) {
            this.paused = true;
            this._goto(frameOrAnimation);
        },

        /**
         * Advances the playhead. This occurs automatically each tick by default.
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
         * Returns a {{#crossLink "Rectangle"}}{{/crossLink}} instance defining the bounds of the current frame relative to
         * the origin. For example, a 90 x 70 frame with <code>regX=50</code> and <code>regY=40</code> would return a
         * rectangle with [x=-50, y=-40, width=90, height=70].
         *
         * Also see the SpriteSheet {{#crossLink "SpriteSheet/getFrameBounds"}}{{/crossLink}} method.
         *
         * @method getBounds
         * @return {Rectangle} A Rectangle instance. Returns null if the frame does not exist, or the image is not fully loaded.
         */
        getBounds: function() {
            return this.spriteSheet.getFrameBounds(this.currentFrame);
        },

        /**
         * Returns a clone of the BitmapAnimation instance. Note that the same SpriteSheet is shared between cloned instances.
         *
         * @method clone
         * @return {BitmapAnimation} a clone of the BitmapAnimation instance.
         */
        clone: function() {
            var o = new BitmapAnimation(this.spriteSheet);
            this.cloneProps(o);
            return o;
        },

        /**
         * Returns a string representation of this object.
         *
         * @method toString
         * @return {String} a string representation of the instance.
         */
        toString: function() {
            return "[BitmapAnimation (name=" + this.name + ")]";
        },

        /**
         * Advances the <code>currentFrame</code> if paused is not true. This is called automatically when the
         * {{#crossLink "Stage"}}{{/crossLink}} ticks.
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
         * Normalizes the current frame, advancing animations and dispatching callbacks as appropriate.
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
                        // do nothing, something changed in the event stack.
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
         * Dispatches the "animationend" event. Returns true if a handler changed the animation
         * (ex. calling {{#crossLink "BitmapAnimation/stop"}}{{/crossLink}},
         * {{#crossLink "BitmapAnimation/gotoAndPlay"}}{{/crossLink}}, etc.)
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
         * Moves the playhead to the specified frame number or animation.
         *
         * @method _goto
         * @param {String|Number} frameOrAnimation The frame number or animation that the playhead should move to.
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
