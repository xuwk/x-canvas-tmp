xc.module.define("xc.createjs.Timeline", function(exports) {

    var Tween = xc.module.require("xc.createjs.Tween");

    /**
     * The Timeline class synchronizes multiple tweens and allows them to be controlled as a group. Please note that if a
     * timeline is looping, the tweens on it may appear to loop even if the "loop" property of the tween is false.
     *
     * @class Timeline
     * @constructor
     * @param tweens An array of Tweens to add to this timeline. See addTween for more info.
     * @param labels An object defining labels for using gotoAndPlay/Stop. See {{#crossLink "Timeline/setLabels"}}{{/crossLink}}
     *  for details.
     * @param props The configuration properties to apply to this tween instance (ex. {loop:true}). All properties default to false.
     *  Supported props are:
     *  <ul>
     *    <li>loop: sets the loop property on this tween.</li>
     *    <li>useTicks: uses ticks for all durations instead of milliseconds.</li>
     *    <li>ignoreGlobalPause: sets the ignoreGlobalPause property on this tween.</li>
     *    <li>paused: indicates whether to start the tween paused.</li>
     *    <li>position: indicates the initial position for this timeline.</li>
     *    <li>onChanged: specifies an onChange handler for this timeline.</li>
     *  </ul>
     */
    var Timeline = xc.class.create({
        _init: function(tweens, labels, props) {
            this._tweens = [];
            if (props) {
                this._useTicks = props.useTicks;
                this.loop = props.loop;
                this.ignoreGlobalPause = props.ignoreGlobalPause;
                this.onChange = props.onChange;
            }
            if (tweens) { this.addTween.apply(this, tweens); }
            this.setLabels(labels);
            if (props && props.paused) { this._paused = true; }
            else { Tween._register(this, true); }
            if (props && props.position != null) { this.setPosition(props.position, Tween.NONE); }
        },

        /**
         * Causes this timeline to continue playing when a global pause is active.
         *
         * @property ignoreGlobalPause
         * @type Boolean
         */
        ignoreGlobalPause: false,

        /**
         * Read-only property specifying the total duration of this timeline in milliseconds (or ticks if useTicks is true).
         * This value is usually automatically updated as you modify the timeline. See updateDuration for more information.
         *
         * @property duration
         * @type Number
         */
        duration: 0,

        /**
         * If true, the timeline will loop when it reaches the end. Can be set via the props param.
         *
         * @property loop
         * @type Boolean
         */
        loop: false,

        /**
         * Called, with a single parameter referencing this timeline instance, whenever the timeline's position changes.
         *
         * @property onChange
         * @type Function
         */
        onChange: null,

        /**
         * Read-only. The current normalized position of the timeline. This will always be a value between 0 and duration.
         * Changing this property directly will have no effect.
         *
         * @property position
         * @type Object
         */
        position: null,

        /**
         * @property _paused
         * @type Boolean
         * @protected
         */
        _paused: false,

        /**
         * @property _tweens
         * @type Array[Tween]
         * @protected
         */
        _tweens: null,

        /**
         * @property _labels
         * @type Array[String]
         * @protected
         */
        _labels: null,

        /**
         * @property _prevPosition
         * @type Number
         * @protected
         */
        _prevPosition: 0,

        /**
         * @property _prevPos
         * @type Number
         * @protected
         */
        _prevPos: -1,

        /**
         * @property _useTicks
         * @type Boolean
         * @protected
         */
        _useTicks: false,

        /**
         * Adds one or more tweens (or timelines) to this timeline. The tweens will be paused (to remove them from the normal ticking system)
         * and managed by this timeline. Adding a tween to multiple timelines will result in unexpected behaviour.
         *
         * @method addTween
         * @param tween The tween(s) to add. Accepts multiple arguments.
         * @return Tween The first tween that was passed in.
         */
        addTween: function(tween) {
            var l = arguments.length;
            if (l > 1) {
                for (var i = 0; i < l; i++) { this.addTween(arguments[i]); }
                return arguments[0];
            } else if (l == 0) { return null; }
            this.removeTween(tween);
            this._tweens.push(tween);
            tween.setPaused(true);
            tween._paused = false;
            tween._useTicks = this._useTicks;
            if (tween.duration > this.duration) { this.duration = tween.duration; }
            if (this._prevPos >= 0) { tween.setPosition(this._prevPos, Tween.NONE); }
            return tween;
        },

        /**
         * Removes one or more tweens from this timeline.
         *
         * @method removeTween
         * @param tween The tween(s) to remove. Accepts multiple arguments.
         * @return Boolean Returns true if all of the tweens were successfully removed.
         */
        removeTween: function(tween) {
            var l = arguments.length;
            if (l > 1) {
                var good = true;
                for (var i = 0; i < l; i++) { good = good && this.removeTween(arguments[i]); }
                return good;
            } else if (l == 0) { return false; }
            var index = this._tweens.indexOf(tween);
            if (index != -1) {
                this._tweens.splice(index, 1);
                if (tween.duration >= this.duration) { this.updateDuration(); }
                return true;
            } else { return false; }
        },

        /**
         * Adds a label that can be used with gotoAndPlay/Stop.
         *
         * @method addLabel
         * @param label The label name.
         * @param position The position this label represents.
         */
        addLabel: function(label, position) {
            this._labels[label] = position;
        },

        /**
         * Defines labels for use with gotoAndPlay/Stop. Overwrites any previously set labels.
         *
         * @method addLabel
         * @param o An object defining labels for using gotoAndPlay/Stop in the form {labelName:time} where time is in ms (or ticks if useTicks is true).
         */
        setLabels: function(o) {
            this._labels = o ? o : {};
        },

        /**
         * Unpauses this timeline and jumps to the specified position or label.
         *
         * @method gotoAndPlay
         * @param positionOrLabel The position in milliseconds (or ticks if useTicks is true) or label to jump to.
         */
        gotoAndPlay: function(positionOrLabel) {
            this.setPaused(false);
            this._goto(positionOrLabel);
        },

        /**
         * Pauses this timeline and jumps to the specified position or label.
         *
         * @method gotoAndStop
         * @param positionOrLabel The position in milliseconds (or ticks if useTicks is true) or label to jump to.
         */
        gotoAndStop: function(positionOrLabel) {
            this.setPaused(true);
            this._goto(positionOrLabel);
        },

        /**
         * Advances the timeline to the specified position.
         *
         * @method setPosition
         * @param value The position to seek to in milliseconds (or ticks if useTicks is true).
         * @param actionsMode Optional parameter specifying how actions are handled. See Tween.setPosition for more details.
         * @return Boolean Returns true if the timeline is complete (ie. the full timeline has run & loop is false).
         */
        setPosition: function(value, actionsMode) {
            if (value < 0) { value = 0; }
            var t = this.loop ? value % this.duration : value;
            var end = !this.loop && value >= this.duration;
            if (t == this._prevPos) { return end; }
            this._prevPosition = value;
            this.position = this._prevPos = t; // in case an action changes the current frame.
            for (var i = 0, l = this._tweens.length; i < l; i++) {
                this._tweens[i].setPosition(t, actionsMode);
                if (t != this._prevPos) { return false; } // an action changed this timeline's position.
            }
            if (end) { this.setPaused(true); }
            this.onChange && this.onChange(this);
            return end;
        },

        /**
         * Pauses or plays this timeline.
         *
         * @method setPaused
         * @param value Indicates whether the tween should be paused (true) or played (false).
         */
        setPaused: function(value) {
            this._paused = !!value;
            Tween._register(this, !value);
        },

        /**
         * Recalculates the duration of the timeline.
         * The duration is automatically updated when tweens are added or removed, but this method is useful
         * if you modify a tween after it was added to the timeline.
         *
         * @method updateDuration
         */
        updateDuration: function() {
            this.duration = 0;
            for (var i = 0, l = this._tweens.length; i < l; i++) {
                tween = this._tweens[i];
                if (tween.duration > this.duration) { this.duration = tween.duration; }
            }
        },

        /**
         * Advances this timeline by the specified amount of time in milliseconds (or ticks if useTicks is true).
         * This is normally called automatically by the Tween engine (via Tween.tick), but is exposed for advanced uses.
         *
         * @method tick
         * @param delta The time to advance in milliseconds (or ticks if useTicks is true).
         */
        tick: function(delta) {
            this.setPosition(this._prevPosition + delta);
        },

        /**
         * If a numeric position is passed, it is returned unchanged. If a string is passed, the position of the
         * corresponding frame label will be returned, or null if a matching label is not defined.
         *
         * @method resolve
         * @param positionOrLabel A numeric position value or label string.
         */
        resolve: function(positionOrLabel) {
            var pos = parseFloat(positionOrLabel);
            if (isNaN(pos)) { pos = this._labels[positionOrLabel]; }
            return pos;
        },

        /**
         * Returns a string representation of this object.
         *
         * @method toString
         * @return {String} a string representation of the instance.
         */
        toString: function() {
            return "[Timeline]";
        },

        /**
         * @method clone
         * @protected
         */
        clone: function() {
            throw("Timeline can not be cloned.")
        },

        /**
         * @method _goto
         * @protected
         */
        _goto: function(positionOrLabel) {
            var pos = this.resolve(positionOrLabel);
            if (pos != null) { this.setPosition(pos); }
        }
    });

    return Timeline;

});
