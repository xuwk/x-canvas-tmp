xc.module.define("xc.createjs.Timeline", function(exports) {

    var Tween = xc.module.require("xc.createjs.Tween");

    /**
     * Temeline 类将许多个 tweens 同步管理，并允许他们以组为单位控制。
     * @class Timeline
     * @constructor
     * @param tweens 一组将会被添加到 timeline 的 Tween。看 addTween 获取更多信息。
     * @param labels 一个对象，该对象记录用于使用 gotoAndPlay/Stop 的标签。 看 {{#crossLink "Timeline/setLabels"}}{{/crossLink}} 获取更多信息。
     * 应用到这个 tween 实例的配置属性 (ex. {loop:true})。所有属性的默认值都是 false。支持以下属性：<UL>
     *    <LI> loop: 设置这个 tween 的 loop 属性。</LI>
     *    <LI> useTicks: 利用 tick 替代毫秒充当所有周期</LI>
     *    <LI> ignoreGlobalPause: 设置这个 tween 的 ignoreGlobalPause 属性。</LI>
     *    <LI> paused: 表示是否启动补间暂停。</LI>
     *    <LI> position: 指出 timeline 的起始位置。</LI>
     *    <LI> onChanged: 配置一个 onChanged 处理程序。</LI>
     * </UL>
     **/
    var Timeline = xc.class.create({
        initialize: function(tweens, labels, props) {
            this._tweens = [];
            if (props) {
                this._useTicks = props.useTicks;
                this.loop = props.loop;
                this.ignoreGlobalPause = props.ignoreGlobalPause;
                this.onChange = props.onChange;
            }
            if (tweens) {
                this.addTween.apply(this, tweens);
            }
            this.setLabels(labels);
            if (props && props.paused) {
                this._paused = true;
            } else {
                Tween._register(this, true);
            }
            if (props && props.position != null) {
                this.setPosition(props.position, Tween.NONE);
            }
        },

        /**
         * 若为 true，能使得这个 timeline 当全局暂停的时候继续运行。
         *
         * @property ignoreGlobalPause
         * @type Boolean
         */
        ignoreGlobalPause: false,

        /**
         * 只读。指出当前 timeline 有多少个以毫秒为单位的周期（或当 useTicks 为 true 时候，以 tick 为单位）。
         * 这个值通常会在更改了 timeline 之后自动更新。看 updateDuration 获取更多信息。
         *
         * @property duration
         * @type Number
         */
        duration: 0,

        /**
         * 如果为 true，这个 timeline 一旦去到最后端将会循环。可以通过 props 参数设置该属性。
         *
         * @property loop
         * @type Boolean
         */
        loop: false,

        /**
         * 每当 timeline 的位置发生改变的时候，这个方法都会执行。
         *
         * @property onChange
         * @type Function
         */
        onChange: null,

        /**
         * 只读。timeline 的当前位置。这个值通常是 0 到 duration 之间。
         * 直接修改这个值是无效的。
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
         * 添加一个或多个 tween (或 timelines) 到这个 timeline 里面。所有被添加的 tween 将会暂停（即在 ticking 系统里面删除它们），然后由 timeline 管理。
         * 将一个 tween 添加到多个 timeline 里面将会导致不可预估的后果。
         *
         * @method addTween
         * @param tween 要添加的 tween，可接受多个参数。
         * @return Tween 第一个传进来的 tween。
         */
        addTween: function(tween) {
            var l = arguments.length;
            if (l > 1) {
                for ( var i = 0; i < l; i++) {
                    this.addTween(arguments[i]);
                }
                return arguments[0];
            } else if (l == 0) {
                return null;
            }
            this.removeTween(tween);
            this._tweens.push(tween);
            tween.setPaused(true);
            tween._paused = false;
            tween._useTicks = this._useTicks;
            if (tween.duration > this.duration) {
                this.duration = tween.duration;
            }
            if (this._prevPos >= 0) {
                tween.setPosition(this._prevPos, Tween.NONE);
            }
            return tween;
        },

        /** 
         * 从 timeline 里面删除一个或多个 tween。
         * 
         * @method removeTween
         * @param tween 要删除的 tween，可接受多个参数。
         * @return Boolean 如果所有的 tween 都成功删除，则返回 true。
         **/
        removeTween: function(tween) {
            var l = arguments.length;
            if (l > 1) {
                var good = true;
                for ( var i = 0; i < l; i++) {
                    good = good && this.removeTween(arguments[i]);
                }
                return good;
            } else if (l == 0) {
                return false;
            }
            var index = this._tweens.indexOf(tween);
            if (index != -1) {
                this._tweens.splice(index, 1);
                if (tween.duration >= this.duration) {
                    this.updateDuration();
                }
                return true;
            } else {
                return false;
            }
        },

        /** 
         * 添加一个标签，该标签用于 gotoAndPlay/Stop。
         * 
         * @method addLabel
         * @param label label名。
         * @param position 这个标签所代表的位置。
         **/
        addLabel: function(label, position) {
            this._labels[label] = position;
        },

        /** 
         * 定义一个标签对象，该对象记录用于使用 gotoAndPlay/Stop 的标签。覆盖前面所有设置了的标签。
         * 
         * @method addLabel
         * @param o 一个对象，该对象定义了时间以毫秒做单位（或当 useTicks 为 true 时候，以 tick 为单位）处的标签，用于使用 gotoAndPlay/Stop。
         **/
        setLabels: function(o) {
            this._labels = o ? o : {};
        },

        /** 
         * 让 timeline 取消暂停以及跳到指定的位置或标签。
         * 
         * @method gotoAndPlay
         * @param positionOrLabel 以毫秒为单位的位置（或当 useTicks 为 true 时候，以 tick 为单位）或标签。
         **/
        gotoAndPlay: function(positionOrLabel) {
            this.setPaused(false);
            this._goto(positionOrLabel);
        },

        /** 
         * 让 timeline 启动暂停以及跳到指定的位置或标签。
         * 
         * @method gotoAndPlay
         * @param positionOrLabel 以毫秒为单位的位置（或当 useTicks 为 true 时候，以 tick 为单位）或标签。
         **/
        gotoAndStop: function(positionOrLabel) {
            this.setPaused(true);
            this._goto(positionOrLabel);
        },

        /** 
         * 使得 timeline 前进到指定位置。
         * 
         * @method setPosition
         * @param value 以毫秒为单位的位置（或当 useTicks 为 true 时候，以 tick 为单位）
         * @param actionsMode 可选项参数，指出如何处理 action。 看 Tween.setPosition 获取更多信息。
         * @return Boolean 如果 timeline 完成，返回 true (例如：整个 tween 都运行完了 & loop 为 false)。
         **/
        setPosition: function(value, actionsMode) {
            if (value < 0) {
                value = 0;
            }
            var t = this.loop ? value % this.duration : value;
            var end = !this.loop && value >= this.duration;
            if (t == this._prevPos) {
                return end;
            }
            this._prevPosition = value;
            this.position = this._prevPos = t; // 如果一个 action 改变当前帧
            for ( var i = 0, l = this._tweens.length; i < l; i++) {
                this._tweens[i].setPosition(t, actionsMode);
                if (t != this._prevPos) {
                    return false;
                } // 一个改变 timeline 当前位置的 action
            }
            if (end) {
                this.setPaused(true);
            }
            this.onChange && this.onChange(this);
            return end;
        },

        /** 
         * 暂停或播放 timeline。
         * 
         * @method setPaused
         * @param value 指出 tween 是否应该被暂停或播放。
         **/
        setPaused: function(value) {
            this._paused = !!value;
            Tween._register(this, !value);
        },

        /** 
         * 重新计算 timeline 的周期数。
         * 周期数会在每当添加或删除 tween 的时候自动更新的，这个方法主要用于当添加了一个 tween 之后再对其进行修改。
         * 
         * @method updateDuration
         **/
        updateDuration: function() {
            this.duration = 0;
            for ( var i = 0, l = this._tweens.length; i < l; i++) {
                tween = this._tweens[i];
                if (tween.duration > this.duration) {
                    this.duration = tween.duration;
                }
            }
        },

        /** 
         * 根据指定的毫秒数（或者是 tick 数，如果 useTicks 为 true）为周期，推进该 timeline。
         * 这个正常会在 Tween 引擎中自动执行（通过 Tween.tick）。但同时也暴露出来作为推进 timeline 的方法。
         * 
         * @method tick
         * @param delta delta 前进一次相隔的毫秒数（如果 userTicks 为 true 的话，则为 tick 数量）
         **/
        tick: function(delta) {
            this.setPosition(this._prevPosition + delta);
        },

        /** 
         * 如果传入的是数值，则直接返回。如果传入的是一个 string，返回对应帧标签的位置，当找不到对应标签的时候，返回 null。
         * 
         * @method resolve
         * @param positionOrLabel 一个数值位置或字符串标签。
         **/
        resolve: function(positionOrLabel) {
            var pos = parseFloat(positionOrLabel);
            if (isNaN(pos)) {
                pos = this._labels[positionOrLabel];
            }
            return pos;
        },

        /**
         * 返回该对象的字符串表示形式
         * 
         * @method toString
         * @return {String} 该对象的字符串表示形式。
         **/
        toString: function() {
            return "[Timeline]";
        },

        /**
         * @method clone
         * @protected
         */
        clone: function() {
            throw ("Timeline can not be cloned.")
        },

        /**
         * @method _goto
         * @protected
         */
        _goto: function(positionOrLabel) {
            var pos = this.resolve(positionOrLabel);
            if (pos != null) {
                this.setPosition(pos);
            }
        }
    });

    return Timeline;

});
