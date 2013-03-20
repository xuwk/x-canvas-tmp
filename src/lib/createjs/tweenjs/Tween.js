xc.module.define("xc.createjs.Tween", function(exports) {

    // TODO: possibly add a END actionsMode (only runs actions that == position)?
    // TODO: evaluate a way to decouple paused from tick registration.

    var Ticker = xc.module.require("xc.createjs.Ticker");
    var EventDispatcher = xc.module.require("xc.createjs.EventDispatcher");

    /**
     * 一个拥有一个目标对象的 Tween 实例。实例的方法可以按顺序简单的连接在一起：
     * 
     * <h4>例子</h4>
     *
     *      target.alpha = 1;
     *      Tween.get(target)
     *           .wait(500)
     *           .to({alpha:0, visible:false}, 1000)
     *           .call(onComplete);
     *      function onComplete() {
     *          //Tween complete
     *      }
     *
     * 多个 tween 可以指向同一个实例。然而，如果他们都改变同一个属性，这将带来不可预估的效果。要移除一个对象上的所有 tween，
     * 使用 {{#crossLink "Tween/removeTweens"}}{{/crossLink}} 或在 props 参数中传入 <code>override:true</code>。
     *
     *      Tween.get(target, {override:true}).to({x:100});
     *
     * 监听 "change" 事件。以便在 target 变化时做出相应处理。
     *      Tween.get(target, {override:true}).to({x:100}).addEventListener("change", handleChange);
     *      function handleChange(event) {
     *          // The tween changed.
     *      }
     *
     * 看 {{#crossLink "Tween/get"}}{{/crossLink}} 方法获取参数说明。
     * 
     * @class Tween
     * @extends EventDispatcher
     * @constructor
     * @param {Object} target
     * @param {Object} props
     * @param {Object} pluginData
     */
    var Tween = xc.class.create({
        initialize: function(target, props, pluginData) {
            this.target = this._target = target;
            if (props) {
                this._useTicks = props.useTicks;
                this.ignoreGlobalPause = props.ignoreGlobalPause;
                this.loop = props.loop;
                this.onChange = props.onChange;
                if (props.override) {
                    Tween.removeTweens(target);
                }
            }
            this.pluginData = pluginData || {};
            this._curQueueProps = {};
            this._initQueueProps = {};
            this._steps = [];
            this._actions = [];
            if (props && props.paused) {
                this._paused = true;
            } else {
                Tween._register(this, true);
            }
            if (props && props.position != null) {
                this.setPosition(props.position, Tween.NONE);
            }
            this.w = this.wait;
            this.t = this.to;
            this.c = this.call;
            this.s = this.set;
        },

        /**
         * 使得当全局暂停的时候，这个 tween 仍然继续运行。举例， 如果 TweenJS 用了 Ticker，
         * 然后，设置这个值为 true 将会导致当调用 Ticker.setPaused(true) 的时候这个 tween 会暂停。
         * 看 Tween.tick() 获取更多信息，可以通过设置 props 参数设置。
         * 
         * @property ignoreGlobalPause
         * @type Boolean
         * @default false
         **/
        ignoreGlobalPause: false,

        /**
         * 如果为 true，当到结尾时，tween 将会重新循环。可以通过设置 props 参数设置。
         *
         * @property loop
         * @type {Boolean}
         * @default false
         */
        loop: false,

        /**
         * 只读。指定 tween 的总周期数，周期以毫秒为单位（如果 userTicks 为 true，则为 tick 的总数量）。
         * 当修改 tween 时，这个值会自动更新。直接改变可能会带来不可预期的行为。
         *
         * @property duration
         * @type {Number}
         * @default 0
         */
        duration: 0,

        /**
         * 可以指定安装的插件将会用到的数据。每个插件使用该参数噶方法都不同，但当设置它的是时候要与插件类相同名。<br/>
         * 例如 myTween.pluginData.PluginClassName = data;<br/>
         * <br/>
         * 同时，很多插件都支持一个属性去确定自身可用或不可用。这一般在插件类名后面接 "_enabled"。<br/>
         * 例如 myTween.pluginData.PluginClassName_enabled = false;<br/>
         * <br/>
         * 一些插件还可以存储该对象的实例数据，一般在属性名为 _PluginClassName 里。看文档里的 individual plugins 获取更多信息。
         * @property pluginData
         * @type {Object}
         */
        pluginData: null,

        /**
         * 当 tween 的位置发生改变的时候就执行。
         *
         * @property onChange
         * @type {Function}
         */
        onChange: null,

        /**
         * 当 tween 的位置发生改变的时候就执行。
         * 
         * @event change
         */
        change: null,

        /**
         * 只读。使用 tween 的目标对象。将要执行 tween 的目标对象。在 tween 创建之后再改变该属性的值是无效的。
         *
         * @property target
         * @type {Object}
         */
        target: null,

        /**
         * 只读。当前 tween 的规范化位置。这个值通常是 0 和 duration 之间的某个数。直接改变这个值是无效的。
         *
         * @property position
         * @type {Object}
         */
        position: null,

        /**
         * @property _paused
         * @type {Boolean}
         * @default false
         * @protected
         */
        _paused: false,

        /**
         * @property _curQueueProps
         * @type {Object}
         * @protected
         */
        _curQueueProps: null,

        /**
         * @property _initQueueProps
         * @type {Object}
         * @protected
         */
        _initQueueProps: null,

        /**
         * @property _steps
         * @type {Array}
         * @protected
         */
        _steps: null,

        /**
         * @property _actions
         * @type {Array}
         * @protected
         */
        _actions: null,

        /**
         * 原始位置
         *
         * @property _prevPosition
         * @type {Number}
         * @default 0
         * @protected
         */
        _prevPosition: 0,

        /**
         * 当前步骤内的位置。
         *
         * @property _stepPosition
         * @type {Number}
         * @default 0
         * @protected
         */
        _stepPosition: 0, // 这个是 MovieClip 需要的。

        /**
         * 规范化后的位置。
         *
         * @property _prevPos
         * @type {Number}
         * @default -1
         * @protected
         */
        _prevPos: -1,

        /**
         * @property _target
         * @type {Object}
         * @protected
         */
        _target: null,

        /**
         * @property _useTicks
         * @type {Boolean}
         * @default false
         * @protected
         */
        _useTicks: false,
        
        // 混合插件:
        // EventDispatcher 方法:
        addEventListener: null,
        removeEventListener: null,
        removeAllEventListeners: null,
        dispatchEvent: null,
        hasEventListener: null,
        _listeners: null,

        /** 
         * 等待（本质上是一个空的 tween）
         * 
         * @example                                                   
         *  //这个 tween 会执行透明度变成 0 之前先等待 1 秒。
         *  createjs.Tween.get(target).wait(1000).to({alpha:0}, 1000);
         *  
         * @method wait
         * @param {Number} duration 需要等待的毫秒数（如果 userTicks 为 true 则为 tick 的总数量）。
         * @return {Tween} 当前的 tween 实例（用于链接方法）。
         **/
        wait: function(duration) {
            if (duration == null || duration <= 0) {
                return this;
            }
            var o = this._cloneProps(this._curQueueProps);
            return this._addStep({
                d: duration,
                p0: o,
                e: this._linearEase,
                p1: o
            });
        },

        /** 
         * 改变 tween 从当前值改变到目标属性值。如果 duration 为 0 的话就直接跳到目标属性值。
         * 数字属性的值将从当前值变到目标值。不是数字的属性将在 duration 的最后被设置成目标值。
         * 
         * @example
         *  createjs.Tween.get(target).to({alpha:0}, 1000);
         *  
         * @method to
         * @param {Object} props 该 tween 目标属性的对象(Ex. {x:300} 将 x 属性变至 300)。
         * @param {Number} duration 可选项. 需要等待的毫秒数（如果 userTicks 为 true 则为 tick 的总数量）。默认值是 0。
         * @param {Function} ease 可选项. 这个 tween 的 easing 方法。默认是 linear ease。
         * @return {Tween} 当前的 tween 实例（用于链接方法）。
         **/
        to: function(props, duration, ease) {
            if (isNaN(duration) || duration < 0) {
                duration = 0;
            }
            return this._addStep({
                d: duration || 0,
                p0: this._cloneProps(this._curQueueProps),
                e: ease,
                p1: this._cloneProps(this._appendQueueProps(props))
            });
        },

        /** 
         * 调用指定的方法。举例：
         * myTween.wait(1000).call(myFunction); 将会在 1s 后调用 myFunction()。
         * 
         * @example
         *   //1 秒后会执行 myFunction()。     
         *   myTween.wait(1000).call(myFunction);
         *   
         * @method call
         * @param {Function} callback 要调用的方法。
         * @param {Array} params 可选项。要调用的方法的参数。如果这个值省略, 那么该方法调用的时候只有单一一个参数。
         * @param {Object} scope 可选项。条用方法的范围。如果省略，则该范围就是目标对象范围。
         * @return {Tween} 当前的 tween 实例（用于链接方法）。
         **/
        call: function(callback, params, scope) {
            return this._addAction({
                f: callback,
                p: params ? params : [this],
                o: scope ? scope : this._target
            });
        },

        // TODO: add clarification between this and a 0 duration .to:
        /** 
         * 对指定的目标设置指定的属性。如果目标为 null，就会作用于当前 tween 的目标对象。
         * 
         * @example
         *  myTween.wait(1000).set({visible:false},foo);
         *  
         * @method set
         * @param {Object} props 要设置的属性集合 (ex. {visible:false}).
         * @param {Object} target 可选项. 指定噶目标，如果省略，则默认为当前 tween 的目标对象。
         * @return {Tween} 当前的 tween 实例（用于链接方法）。
         **/
        set: function(props, target) {
            return this._addAction({
                f: this._set,
                o: this,
                p: [props, target ? target : this._target]
            });
        },

        /** 
         * 播放（消除暂停）指定的 tween。这个可以处理多个 tween。
         * 
         * @example
         *  myTween.to({x:100},500).play(otherTween);
         * 
         * @method play
         * @param {Tween} tween 要播放的 tween
         * @return {Tween} 当前的 tween 实例（用于链接方法）。
         **/
        play: function(tween) {
            return this.call(tween.setPaused, [false], tween);
        },

        /** 
         * 暂停指定的 tween
         * 
         * @method pause
         * @param {Tween} tween 正在播放的 tween，如果为 null，则默认为当前 tween。
         * @return {Tween} 当前的 tween 实例（用于链接方法）。
         **/
        pause: function(tween) {
            if (!tween) {
                tween = this;
            }
            return this.call(tween.setPaused, [true], tween);
        },

        /** 
         * 使 tween 去到指定位置。
         * 
         * @method setPosition
         * @param {Number} value 去到指定位置所需要的的毫秒数。（如果 userTicks 为 true 则为 tick 的总数量）
         * @param {Number} actionsMode 可选项，指出 action 如何处理。 (例如： call, set, play, pause):
         *      Tween.NONE (0) - 没有任何 action。
         *      Tween.LOOP (1) - 如果新的位置小于旧的位置, 则先运行就的位置到 duration，再运行 0 到 新位置。
         *      Tween.REVERSE (2) - 如果新位置小于旧位置，运行所有在他们之间的 action
         * @return {Boolean} 如果 tween 完成了就返回 true (ie. 整个 tween 都运行完了 & loop 为 false)。
         **/
        setPosition: function(value, actionsMode) {
            if (value < 0) {
                value = 0;
            }
            if (actionsMode == null) {
                actionsMode = 1;
            }
            // 正常位置:
            var t = value;
            var end = false;
            if (t >= this.duration) {
                if (this.loop) {
                    t = t % this.duration;
                } else {
                    t = this.duration;
                    end = true;
                }
            }
            if (t == this._prevPos) {
                return end;
            }
            var prevPos = this._prevPos;
            this.position = this._prevPos = t;
            this._prevPosition = value;
            // 处理 tween:
            if (this._target) {
                if (end) {
                    // 解决长度为零的步骤问题
                    this._updateTargetProps(null, 1);
                } else if (this._steps.length > 0) {
                    // 寻找新的 tween 索引；
                    for ( var i = 0, l = this._steps.length; i < l; i++) {
                        if (this._steps[i].t > t) {
                            break;
                        }
                    }
                    var step = this._steps[i - 1];
                    this._updateTargetProps(step, (this._stepPosition = t - step.t) / step.d);
                }
            }
            // 运行 action:
            if (actionsMode != 0 && this._actions.length > 0) {
                if (this._useTicks) {
                    // 只运行已绑定的 action
                    this._runActions(t, t);
                } else if (actionsMode == 1 && t < prevPos) {
                    if (prevPos != this.duration) {
                        this._runActions(prevPos, this.duration);
                    }
                    this._runActions(0, t, true);
                } else {
                    this._runActions(prevPos, t);
                }
            }
            if (end) {
                this.setPaused(true);
            }
            this.onChange && this.onChange(this);
            this.dispatchEvent("change");
            return end;
        },

        /** 
         * 按照指定的相隔毫秒数推进这个 tween。（如果 userTicks 为 true 则为 tick 的总数量）
         * 这个正常会根据 Tween 的引擎前进的（通过 Tween.tick）, 但也暴露给更高级的应用。
         * 
         * @method tick
         * @param {Number} delta 前进一次相隔的毫秒数（如果 userTicks 为 true 的话，则为 tick 的总数量）
         **/
        tick: function(delta) {
            if (this._paused) {
                return;
            }
            this.setPosition(this._prevPosition + delta);
        },

        /** 
         * 暂停或播放 tween
         * 
         * @method setPaused
         * @param {Boolean} value 说明 tween 是被暂停（true）还是播放（false）
         * @return {Tween} 当前的 tween 实例（用于链接方法）。
         **/
        setPaused: function(value) {
            this._paused = !!value;
            Tween._register(this, !value);
            return this;
        },

        /**
         * 返回该对象的字符串表示形式。
         * 
         * @method toString
         * @return {String} 该对象的字符串表示形式。
         **/
        toString: function() {
            return "[Tween]";
        },

        /**
         * @method clone
         * @protected
         */
        clone: function() {
            throw ("Tween can not be cloned.")
        },

        /**
         * @method _updateTargetProps
         * @param {Object} step
         * @param {Number} ratio
         * @protected
         */
        _updateTargetProps: function(step, ratio) {
            var p0, p1, v, v0, v1, arr;
            if (!step && ratio == 1) {
                p0 = p1 = this._curQueueProps;
            } else {
                // apply ease to ratio.
                if (step.e) {
                    ratio = step.e(ratio, 0, 1, 1);
                }
                p0 = step.p0;
                p1 = step.p1;
            }
            for (n in this._initQueueProps) {
                if ((v0 = p0[n]) == null) {
                    p0[n] = v0 = this._initQueueProps[n];
                }
                if ((v1 = p1[n]) == null) {
                    p1[n] = v1 = v0;
                }
                if (v0 == v1 || ratio == 0 || ratio == 1 || (typeof (v0) != "number")) {
                    // no interpolation - either at start, end, values don't change, or the value is non-numeric.
                    v = ratio == 1 ? v1 : v0;
                } else {
                    v = v0 + (v1 - v0) * ratio;
                }
                var ignore = false;
                if (arr = Tween._plugins[n]) {
                    for ( var i = 0, l = arr.length; i < l; i++) {
                        var v2 = arr[i].tween(this, n, v, p0, p1, ratio, !!step && p0 == p1, !step);
                        if (v2 == Tween.IGNORE) {
                            ignore = true;
                        } else {
                            v = v2;
                        }
                    }
                }
                if (!ignore) {
                    this._target[n] = v;
                }
            }
        },

        /**
         * @method _runActions
         * @param {Number} startPos
         * @param {Number} endPos
         * @param {Boolean} includeStart
         * @protected
         */
        _runActions: function(startPos, endPos, includeStart) {
            var sPos = startPos;
            var ePos = endPos;
            var i = -1;
            var j = this._actions.length;
            var k = 1;
            if (startPos > endPos) {
                // running backwards, flip everything:
                sPos = endPos;
                ePos = startPos;
                i = j;
                j = k = -1;
            }
            while ((i += k) != j) {
                var action = this._actions[i];
                var pos = action.t;
                if (pos == ePos || (pos > sPos && pos < ePos) || (includeStart && pos == startPos)) {
                    action.f.apply(action.o, action.p);
                }
            }
        },

        /**
         * @method _appendQueueProps
         * @param {Object} o
         * @protected
         */
        _appendQueueProps: function(o) {
            var arr, oldValue, i, l, injectProps;
            for ( var n in o) {
                if (this._initQueueProps[n] === undefined) {
                    oldValue = this._target[n];
                    // init plugins:
                    if (arr = Tween._plugins[n]) {
                        for (i = 0, l = arr.length; i < l; i++) {
                            oldValue = arr[i].init(this, n, oldValue);
                        }
                    }
                    this._initQueueProps[n] = oldValue === undefined ? null : oldValue;
                } else {
                    oldValue = this._curQueueProps[n];
                }
                if (arr = Tween._plugins[n]) {
                    injectProps = injectProps || {};
                    for (i = 0, l = arr.length; i < l; i++) {
                        // TODO: remove the check for .step in the next version. It's here for backwards compatibility.
                        if (arr[i].step) {
                            arr[i].step(this, n, oldValue, o[n], injectProps);
                        }
                    }
                }
                this._curQueueProps[n] = o[n];
            }
            if (injectProps) {
                this._appendQueueProps(injectProps);
            }
            return this._curQueueProps;
        },

        /**
         * @method _cloneProps
         * @param {Object} props
         * @protected
         */
        _cloneProps: function(props) {
            var o = {};
            for ( var n in props) {
                o[n] = props[n];
            }
            return o;
        },

        /**
         * @method _addStep
         * @param {Object} o
         * @protected
         */
        _addStep: function(o) {
            if (o.d > 0) {
                this._steps.push(o);
                o.t = this.duration;
                this.duration += o.d;
            }
            return this;
        },

        /**
         * @method _addAction
         * @param {Object} o
         * @protected
         */
        _addAction: function(o) {
            o.t = this.duration;
            this._actions.push(o);
            return this;
        },

        /**
         * @method _set
         * @param {Object} props
         * @param {Object} o
         * @protected
         */
        _set: function(props, o) {
            for ( var n in props) {
                o[n] = props[n];
            }
        }
    });

    /** 
     * 用于 setPostion 的常量 none 模型
     * 
     * @property NONE
     * @type Number
     * @default 0
     * @static
     **/
    Tween.NONE = 0;

    /** 
     * 用于 setPostion 的常量 loop 模型
     * 
     * @property LOOP
     * @type Number
     * @default 1
     * @static
     **/
    Tween.LOOP = 1;

    /** 
     * 用于 setPostion 的常量 reverse 模型
     * 
     * @property REVERSE
     * @type Number
     * @default 2
     * @static
     **/
    Tween.REVERSE = 2;

    /**
     * 插件返回的常量让 tween 不要用默认的分配。
     * 
     * @property IGNORE
     * @type Object
     * @static
     */
    Tween.IGNORE = {};

    /**
     * @property _listeners
     * @type Array[Tween]
     * @static
     * @protected
     */
    Tween._tweens = [];

    /**
     * @property _plugins
     * @type Object
     * @static
     * @protected
     */
    Tween._plugins = {};

    /**
     * 返回一个新的 tween 实例。这个功能上等同于使用 “new Tween(...)”，但是当链接起来的时候看起来更加简洁。
     * 
     * @method get
     * @static
     * @param {Object} target 需要补间的目标对象。
     * @param {Object} props 将应用于 tween 实例的配置属性。 (ex. {loop:true, paused:true}).
     * 所有的配置默认值都是 false。支持以下属性:<UL>
     *    <LI> loop: 设置 tween 的 loop 属性。</LI>
     *    <LI> useTicks: 利用 tick 充当毫秒作为补间周期。</LI>
     *    <LI> ignoreGlobalPause: 设置当前 tween 的 ignoreGlobalPause 属性。</LI>
     *    <LI> override: 如果为 true，Tween.removeTweens(target) 将会删除所有拥有同一目标的所有对象。
     *    <LI> paused: 说明是否开启补间暂停。</LI>
     *    <LI> position: 说明 tween 的初始位置。</LI>
     *    <LI> onChanged: 指定该对象的 onChange 处理程序。</LI>
     * </UL>
     * @param {Object} pluginData 可选项。一个包含用于 installed plugins 数据的对象。看 individual
     *      plugins' 文档获取更多信息。
     * @param {Boolean} override 如果为 true, 所有值钱拥有项目 target 的 tween 将被删除。这个与
     *      calling Tween.removeTweens(target) 的功能相同。
     * @return {Tween} 创建的 tween 实例。
     **/
    Tween.get = function(target, props, pluginData, override) {
        if (override) {
            Tween.removeTweens(target);
        }
        return new Tween(target, props, pluginData);
    };

    /**
     * 推进所有 tween。这个通常是用到 Ticker 类（在 EaselJS 库），但如果想用自己的“心跳”模式，也可以手动更改它。
     * 
     * @method tick
     * @static
     * @param {Number} delta 一个时间间隔，以毫秒为单位。必须的，除非所有 tween 的 useTicks 都设置为 true。
     * @param {Boolean} paused 指出 ignoreGlobalPause 是否能影响到这里。有 ignoreGlobalPause 的 Tweens 都会无视这个属性。
     *      但如果这里设置为 true，则其他的 tween 都会暂停。
     **/
    Tween.tick = function(delta, paused) {
        var tweens = Tween._tweens.slice(); // to avoid race conditions.
        for ( var i = tweens.length - 1; i >= 0; i--) {
            var tween = tweens[i];
            if ((paused && !tween.ignoreGlobalPause) || tween._paused) {
                continue;
            }
            tween.tick(tween._useTicks ? 1 : delta);
        }
    };

    /** 
     * 删除指定 target 下的所有 tween。当新的 tween 的 “override” 属性为 true 时，会自动调用。
     * 
     * @method removeTweens
     * @static
     * @param {Object} target 要删除 tween 的对象。
     **/
    Tween.removeTweens = function(target) {
        if (!target.tweenjs_count) {
            return;
        }
        var tweens = Tween._tweens;
        for ( var i = tweens.length - 1; i >= 0; i--) {
            if (tweens[i]._target == target) {
                tweens[i]._paused = true;
                tweens.splice(i, 1);
            }
        }
        target.tweenjs_count = 0;
    };

    /** 
     * 指出在对象（如果指定）中或全局是否存在活跃的 tween。
     * 
     * @method hasActiveTweens
     * @static
     * @param {Object} target 可选。 如果没指定，一旦检测到任何活跃的 tween ，返回值都为 true。
     * @return {Boolean} 一个 boolean 值说明是否有活跃的 tween。
     **/
    Tween.hasActiveTweens = function(target) {
        if (target) {
            return target.tweenjs_count;
        }
        return Tween._tweens && Tween._tweens.length;
    };

    /** 
     * 安装插件，该插件可以在 tween 过程中，修改某些属性的处理方法。看 CSSPlugin 学习如何写 TweenJS 插件。
     * 
     * @method installPlugin
     * @static
     * @param {Object} plugin
     * @param {Array} properties
     **/
    Tween.installPlugin = function(plugin, properties) {
        var priority = plugin.priority;
        if (priority == null) {
            plugin.priority = priority = 0;
        }
        for ( var i = 0, l = properties.length, p = Tween._plugins; i < l; i++) {
            var n = properties[i];
            if (!p[n]) {
                p[n] = [plugin];
            } else {
                var arr = p[n];
                for ( var j = 0, jl = arr.length; j < jl; j++) {
                    if (priority < arr[j].priority) {
                        break;
                    }
                }
                p[n].splice(j, 0, plugin);
            }
        }
    };

    /** 
     * 在 ticking 系统中注册或注销一个 tween。
     * 
     * @method _register
     * @static
     * @protected 
     **/
    Tween._register = function(tween, value) {
        var target = tween._target;
        if (value) {
            // TODO: this approach might fail if a dev is using sealed objects in ES5
            if (target) {
                target.tweenjs_count = target.tweenjs_count ? target.tweenjs_count + 1 : 1;
            }
            Tween._tweens.push(tween);
        } else {
            if (target) {
                target.tweenjs_count--;
            }
            var i = Tween._tweens.indexOf(tween);
            if (i != -1) {
                Tween._tweens.splice(i, 1);
            }
        }
    };
    
    EventDispatcher.initialize(Tween.prototype);
    
    Ticker.addListener(Tween, false);
    
    return Tween;

});
