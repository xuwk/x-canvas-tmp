xc.module.define("xc.createjs.MovieClip", function(exports) {

  var Container = xc.module.require("xc.createjs.Container");
  var Timeline = xc.module.require("xc.createjs.Timeline");
  var Tween = xc.module.require("xc.createjs.Tween");
  var DisplayObject = xc.module.require("xc.createjs.DisplayObject");

  /**
   * The MovieClip class associates a TweenJS Timeline with an EaselJS {{#crossLink "Container"}}{{/crossLink}}.
   * It allows you to create objects which encapsulate timeline animations, state changes, and synched actions.
   * Due to the complexities inherent in correctly setting up a MovieClip, it is largely intended for tool output and
   * is not included in the main EaselJS library.
   *
   * Currently MovieClip only works properly if it is tick based (as opposed to time based) though some concessions have
   * been made to support time-based timelines in the future.
   *
   * @class MovieClip
   * @extends Container
   * @constructor
   * @param {String} mode Initial value for the mode property. One of MovieClip.INDEPENDENT, MovieClip.SINGLE_FRAME,
   *  or MovieClip.SYNCHED.
   * @param {Number} startPosition Initial value for the startPosition property.
   * @param {Boolean} loop Initial value for the loop property.
   * @param {Object} labels A hash of labels to pass to the timeline instance associated with this MovieClip.
   */
  var MovieClip = Container.extend({
    _init: function(mode, startPosition, loop, labels) {
      this.mode = mode || MovieClip.INDEPENDENT;
      this.startPosition = startPosition || 0;
      this.loop = loop;
      props = {paused: true, position: startPosition, useTicks: true};
      this.Container_initialize();
      this.timeline = new Timeline(null, labels, props);
      this._managed = {};
    },

    /**
     * Controls how this MovieClip advances its time. Must be one of 0 (INDEPENDENT), 1 (SINGLE_FRAME), or 2 (SYNCHED).
     * See each constant for a description of the behaviour.
     *
     * @property mode
     * @type String
     * @default null
     */
    mode: null,

    /**
     * Specifies what the first frame to play in this movieclip, or the only frame to display if mode is SINGLE_FRAME.
     *
     * @property startPosition
     * @type Number
     * @default 0
     */
    startPosition: 0,

    /**
     * Indicates whether this MovieClip should loop when it reaches the end of its timeline.
     *
     * @property loop
     * @type Boolean
     * @default true
     */
    loop: true,

    /**
     * Read-Only. The current frame of the movieclip.
     *
     * @property currentFrame
     * @type Number
     */
    currentFrame: 0,

    /**
     * The TweenJS Timeline that is associated with this MovieClip. This is created automatically when the MovieClip
     * instance is initialized.
     *
     * @property timeline
     * @type Timeline
     * @default null
     */
    timeline: null,

    /**
     * If true, the MovieClip's position will not advance when ticked.
     *
     * @property paused
     * @type Boolean
     * @default false
     */
    paused: false,

    /**
     * If true, actions in this MovieClip's tweens will be run when the playhead advances.
     *
     * @property actionsEnabled
     * @type Boolean
     * @default true
     */
    actionsEnabled: true,

    /**
     * If true, the MovieClip will automatically be reset to its first frame whenever the timeline adds
     * it back onto the display list. This only applies to MovieClip instances with mode=INDEPENDENT.
     *
     * For example, if you had a character animation with a "body" child MovieClip instance with different costumes on
     * each frame, you could set body.autoReset = false, so that you can manually change the frame it is on, without
     * worrying that it will be reset automatically.
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
    _prevPos: -1, // TODO: evaluate using a ._reset Boolean prop instead of -1.

    /**
     * @property _prevPosition
     * @type Number
     * @default 0
     * @private
     */
    _prevPosition: 0,

    /**
     * List of display objects that are actively being managed by the MovieClip.
     * @property _managed
     * @type Object
     * @private
     */
    _managed: null,

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
      // children are placed in draw, so we can't determine if we have content.
      return !!(this.visible && this.alpha > 0 && this.scaleX != 0 && this.scaleY != 0);
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
      // draw to cache first:
      if (this._base._base.draw.apply(this, ctx, ignoreCache)) { return true; } // DisplayObject's draw()
      this._updateTimeline();
      this._super(ctx, ignoreCache);  // Container's draw()
    },

    /**
     * Sets paused to false.
     *
     * @method play
     */
    play: function() {
      this.paused = false;
    },

    /**
     * Sets paused to true.
     *
     * @method stop
     */
    stop: function() {
      this.paused = true;
    },

    /**
     * Advances this movie clip to the specified position or label and sets paused to false.
     *
     * @method gotoAndPlay
     * @param {String|Number} positionOrLabel
     */
    gotoAndPlay: function(positionOrLabel) {
      this.paused = false;
      this._goto(positionOrLabel);
    },

    /**
     * Advances this movie clip to the specified position or label and sets paused to true.
     *
     * @method gotoAndStop
     * @param {String|Number} positionOrLabel
     */
    gotoAndStop: function(positionOrLabel) {
      this.paused = true;
      this._goto(positionOrLabel);
    },

    /**
     * MovieClip instances cannot be cloned.
     *
     * @method clone
     */
    clone: function() {
      // TODO: add support for this? Need to clone the Timeline & retarget tweens - pretty complex.
      throw("MovieClip cannot be cloned.")
    },

    /**
     * Returns a string representation of this object.
     *
     * @method toString
     * @return {String} a string representation of the instance.
     */
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
      if (pos == null) { return; }
      // prevent _updateTimeline from overwriting the new position because of a reset:
      if (this._prevPos == -1) { this._prevPos = NaN; }
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
      // update timeline position, ignoring actions if this is a graphic.
      if (synched) {
        // TODO: this would be far more ideal if the _synchOffset was somehow provided by the parent, so that reparenting wouldn't cause problems and we can direct draw. Ditto for _off (though less important).
        tl.setPosition(this.startPosition + (this.mode == MovieClip.SINGLE_FRAME ? 0 : this._synchOffset), Tween.NONE);
      } else {
        tl.setPosition(this._prevPos < 0 ? 0 : this._prevPosition, this.actionsEnabled ? null : Tween.NONE);
      }
      this._prevPosition = tl._prevPosition;
      if (this._prevPos == tl._prevPos) { return; }
      this.currentFrame = this._prevPos = tl._prevPos;
      for (var n in this._managed) { this._managed[n] = 1; }
      for (var i = tweens.length - 1; i >= 0; i--) {
        var tween = tweens[i];
        var target = tween._target;
        if (target == this) { continue; } // TODO: this assumes this is the actions tween. Valid?
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
          delete(this._managed[id]);
        }
      }
    },

    /**
     * @method _setState
     * @private
     */
    _setState: function(state, offset) {
      if (!state) { return; }
      for (var i = 0, l = state.length; i < l; i++) {
        var o = state[i];
        var target = o.t;
        var props = o.p;
        for (var n in props) { target[n] = props[n]; }
        this._addManagedChild(target, offset);
      }
    },

    /**
     * Adds a child to the timeline, and sets it up as a managed child.
     *
     * @method _addManagedChild
     * @private
     */
    _addManagedChild: function(child, offset) {
      if (child._off) { return; }
      this.addChild(child);
      if (child instanceof MovieClip) {
        child._synchOffset = offset;
        // TODO: this does not precisely match Flash. Flash loses track of the clip if it is renamed or removed from the timeline, which causes it to reset.
        if (child.mode == MovieClip.INDEPENDENT && child.autoReset && !this._managed[child.id]) { child._reset(); }
      }
      this._managed[child.id] = 2;
    }
  });

  /**
   * Read-only. The MovieClip will advance independently of its parent, even if its parent is paused.
   * This is the default mode.
   *
   * @property INDEPENDENT
   * @static
   * @type String
   * @default "independent"
   */
  MovieClip.INDEPENDENT = "independent";

  /**
   * Read-only. The MovieClip will only display a single frame (as determined by the startPosition property).
   *
   * @property SINGLE_FRAME
   * @static
   * @type String
   * @default "single"
   */
  MovieClip.SINGLE_FRAME = "single";

  /**
   * Read-only. The MovieClip will be advanced only when it's parent advances and will be synched to the position of
   * the parent MovieClip.
   *
   * @property SYNCHED
   * @static
   * @type String
   * @default "synched"
   */
  MovieClip.SYNCHED = "synched";

  /**
   * This plugin works with <a href="http://tweenjs.com" target="_blank">TweenJS</a> to prevent the startPosition
   * property from tweening.
   *
   * @private
   * @class MovieClipPlugin
   * @constructor
   */
  var MovieClipPlugin = function() {
    throw("MovieClipPlugin cannot be instantiated.")
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
    if (!(tween.target instanceof MovieClip)) { return value; }
    return (ratio == 1 ? endValues[prop] : startValues[prop]);
  }

  MovieClipPlugin.install();

  return MovieClip;

});
