xc.module.define("xc.createjs.SoundInstance", function(exports) {

    var EventDispatcher = xc.module.require("xc.createjs.EventDispatcher");

    /**
     * SoundInstance，当调用 Sound API 的 {{#crossLink "Sound/play"}}{{/crossLink}} 方法，或 {{#crossLink "Sound/createInstance"}}{{/crossLink}}
     * 的时候就会创建。这个 SoundInstance 是通过活跃的插件返回给用户去操作的。
     *
     * <h4>例子</h4>
     *      Sound.play("myAssetPath/mySrcFile.mp3");
     *
     * 几个额外的参数提供给用户快速设置音频如果播放。请看 Sound API {{#crossLink "Sound/play"}}{{/crossLink}} 获取参数信息。
     * 
     * 一旦 SoundInstance 创建了，将会储存一个引用用于通过给 SoundInstance 直接控制 audio。如果无储存引用，则 SoundInstance
     * 将直接播放音频（无限循环），然后去引用 {{#crossLink "Sound"}}{{/crossLink}} 以便它能够被清除。
     * 如果 audio 播放完成，{{#crossLink "SoundInstance/play"}}{{/crossLink}} 的一个简单调用则会重新建立引用，因为 Sound 类需要去控它。
     *
     *      var myInstance = Sound.play("myAssetPath/mySrcFile.mp3");
     *      myInstance.addEventListener("complete", playAgain);
     *      function playAgain(event) {
     *          myInstance.play();
     *      }
     *
     * 事件分配到实例，用于监听音频播放 完成，循环，或播放失败。
     *
     *      var myInstance = Sound.play("myAssetPath/mySrcFile.mp3");
     *      myInstance.addEventListener("complete", playAgain);
     *      myInstance.addEventListener("loop", handleLoop);
     *      myInstance.addEventListener("playbackFailed", handleFailed);
     *
     *
     * @class SoundInstance
     * @param {String} src 音频的文件名或资源路径。
     * @param {Object} owner 创建该 SoundInstance 的插件实例。
     * @uses EventDispatcher
     * @constructor
     */
    var SoundInstance = EventDispatcher.extend({
        /**
         * 初始化 SoundInstance，由构造函数调用。
         * @method initialize
         * @param {string} src 音频的资源。
         * @param {Class} owner 创建该实例的插件。
         * @protected
         */
        initialize: function(src, owner) {
        },

        /**
         * 音频资源。
         * 
         * @property src
         * @type {String}
         * @default null
         * @protected
         */
        src: null,

        /**
         * 实例的唯一 id。通过 <code>Sound</code> 设置的。
         *
         * @property uniqueId
         * @type {String} | Number
         * @default -1
         * @protected
         */
        uniqueId: -1,

        /**
         * 音频的播放状态。在 <code>Sound</code> 中定义的。
         *
         * @property playState
         * @type {String}
         * @default null
         */
        playState: null,

        /**
         * 创建实例的插件。
         *
         * @property owner
         * @type {Object}
         * @default null
         * @protected
         */
        owner: null,

        /**
         * 音频开始播放了多久。以毫秒为单位。
         * 注：这里从秒为单位变成秒为单位是为了和 WebAudio API 保持一致性。
         *
         * @property offset
         * @type {Number}
         * @default 0
         * @protected
         */
        offset: 0,

        /**
         * 音频的音量。在 0 到 1 之间。
         * 通过 <code>getVolume</code> 和 <code>setVolume</code> 去访问。
         *
         * @property volume
         * @type {Number}
         * @default 1
         * @protected
         */
        volume: 1,

        /**
         * 音频的剪辑长度，以毫秒为单位。
         * 用 <code>getDuration</code> 去访问。
         *
         * @property duration
         * @type {Number}
         * @default 0
         * @protected
         */
        duration: 0,

        /**
         * 剩余的循环次数，负数表示无限循环。
         *
         * @property remainingLoops
         * @type {Number}
         * @default 0
         * @protected
         */
        remainingLoops: 0,

        /**
         * 由 <code>Sound</code> 决定的超时值。这个允许 SoundInstance 在播放开始前清除延迟。 
         *
         * @property delayTimeoutId
         * @type {timeoutVariable}
         * @default null
         * @protected
         */
        delayTimeoutId: null,

        /**
         * 决定音频当期是否静音。
         * 用 <code>getMute</code> 和 <code>setMute</code> 去访问。
         *
         * @property muted
         * @type {Boolean}
         * @default false
         * @protected
         */
        muted: false,

        /**
         * 决定音频当前是否暂停。
         * 用 <code>pause()</code> 和 <code>resume()</code> 去设置。
         *
         * @property paused
         * @type {Boolean}
         * @default false
         * @protected
         */
        paused: false,

        /**
         * 音频的声道，在 -1（左） 到 1（右） 指间。注意 pan 在 HTML Audio 中无效。
         * 使用 <code>getPan</code> 和 <code>setPan</code> 去访问。
         *
         * @property pan
         * @type {Number}
         * @default 0
         * @protected
         */
        pan: 0,

        /**
         * 注：这个只是作为一个 <code>WebAudioPlugin</code> 的属性存在，而且只是用于高级用法。
         * panNode 允许左右声道平移。连接到 <code>WebAudioPlugin.gainNode</code> 等同于 <code>context.destination</code>。
         *
         * @property panNode
         * @type {AudioPannerNode}
         * @default null
         */
        panNode: null,

        /**
         * 注：这个只是作为一个 <code>WebAudioPlugin</code> 的属性存在，而且只是用于高级用法。
         * GainNode 用于控制 <code>SoundInstance</code> 的音量。链接到 <code>panNode</code>。
         *
         * @property gainNode
         * @type {AudioGainNode}
         * @default null
         */
        gainNode: null,

        /**
         * 注：这个只是作为一个 <code>WebAudioPlugin</code> 的属性存在，而且只是用于高级用法。
         * sourceNode 是音频资源。 链接到 <code>gainNode</code>。
         *
         * @property sourceNode
         * @type {AudioSourceNode}
         * @default null
         */
        sourceNode: null,

        /**
         * 当音频准备要播放的时候触发该事件。
         * 
         * @event ready
         * @param {Object} target 被事件调度的对象。
         * @param {String} type 事件类型。
         */

        /**
         * 当音频成功播放的时候触发该事件。
         * 
         * @event succeeded
         * @param {Object} target 被事件调度的对象。
         * @param {String} type 事件类型。
         */

        /**
         * 当播放中断的时候触发改事件。当一个调用相同资源的音频播放的时候而停止了这个音频的时候，会触发该事件。
         * 
         * @event interrupted
         * @param {Object} target 被事件调度的对象。
         * @param {String} type 事件类型。
         */

        /**
         * 当播放失败的时候触发该事件。通常是过多调用相同资源的频道同时播放的时候，触发该事件（以及中断值设置错误）。
         * 或者是音频不能被播放，又可能是 404 错误。
         *
         * @event failed
         * @param {Object} target 被事件调度的对象。
         * @param {String} type 事件类型。
         */

        /**
         * 当播放完成但要重新播放的时候触发该事件。
         * 
         * @event loop
         * @param {Object} target 被事件调度的对象。
         * @param {String} type 事件类型。
         */

        /**
         * 当播放完成时触发该事件。但音频完全播放完成才会触发，包括所有循环。
         * 
         * @event complete
         * @param {Object} target 被事件调度的对象。
         * @param {String} type 事件类型。
         */

        /**
         * 调度所有 SoundInstance 事件的一个辅助方法。
         * 
         * @method sendEvent
         * @param {String} type 事件类型
         * @private
         */
        sendEvent: function(type) {
            var event = {
                target: this,
                type: type
            };
            this.dispatchEvent(event);
        },

        /**
         * 清除实例。移除引用以及清除所有的额外参数。例如 timers。
         *
         * @method cleanup
         * @protected
         */
        cleanUp: function() {
            clearTimeout(this.delayTimeoutId); // 清除播放时的 timeout。
            createjs.Sound.playFinished(this);
        },

        /**
         * 中断音频。
         *
         * @method interrupt
         * @protected
         */
        interrupt: function() {
            this.playState = createjs.Sound.PLAY_INTERRUPTED;
            this.sendEvent("interrupted");
            this.cleanUp();
            this.paused = false;
        },

        /**
         * 播放失败，可能有许多理由导致的。
         *
         * @method playFailed
         * @protected
         */
        playFailed: function() {
            this.playState = createjs.Sound.PLAY_FAILED;
            this.sendEvent("failed");
            this.cleanUp();
        },

        /**
         * 播放一个实例。该方法用于被已存在的 SoundInstances 调用，该 SoundInstances 通过 {{#crossLink "createInstance"}}{{/crossLink}} 创建,
         * 或已播放完成，而且需要在重新播放。
         *
         * <h4>例子</h4>
         *      var myInstance = createJS.Sound.createInstance(mySrc);
         *      myInstance.play(createJS.Sound.INTERRUPT_ANY);
         *
         * @method play
         * @param {String} [interrupt=none] 这个音频如何中断其他拥有相同资源的实例。中断方式在 {{#crossLink "Sound"}}{{/crossLink}} 作为常数定义。
         * 默认值是 <code>Sound.INTERRUPT_NONE</code>。
         * @param {Number} [delay=0] 以毫秒为单位的延迟时间。
         * @param {Number} [offset=0] 音频播放了多长。以毫秒为单位。
         * @param {Number} [loop=0] 音频的循环次数，-1 表示无限循环。
         * @param {Number} [volume=1] 音频的音量，-1 到 1。
         * @param {Number} [pan=0] 音频的声道 -1（左）和 1（右）。注意 pan 在 HTML Audio 下无效。
         */
        play: function(interrupt, delay, offset, loop, volume, pan) {
            this.cleanUp();
            createjs.Sound.playInstance(this, interrupt, delay, offset, loop, volume, pan);
        },

        /**
         * 当音频准备好播放（延迟时间到了）的时候，将由 Sound 类调用该方法。
         * 
         * @method beginPlaying
         * @param {Number} offset 音频播放了多长。以毫秒为单位。
         * @param {Number} loop T音频的循环次数，-1 表示无限循环。
         * @param {Number} volume 音频的音量，-1 到 1。
         * @param {Number} pan 音频的声道 -1（左）和 1（右）。注意 pan 在 HTML Audio 下无效。
         * @protected
         */
        beginPlaying: function(offset, loop, volume, pan) {
            throw "not implemented.";
        },

        /**
         * 暂停实例。暂停的音频会在当前时间停止，但可以通过 {{#crossLink "SoundInstance/resume"}}{{/crossLink}} 恢复。
         *
         * <h4>例子</h4>
         *      myInstance.pause();
         *
         * @method pause
         * @return {Boolean} 如果成功暂停音频，返回 true。如果当前音频如果不是正在播放，则返回 false。
         */
        pause: function() {
            throw "not implemented.";
        },

        /**
         * 恢复一个通过 {{#crossLink "SoundInstance/pause"}}{{/crossLink}} 暂停的音频。
         * 当一个音频还没开始播放的时候，对该音频调用该方法，音频不会播放。
         * 
         * @method resume
         * @return {Boolean} 如果成功恢复音频，返回 true。如果音频没有被暂停，将返回 false。
         */
        resume: function() {
            throw "not implemented.";
        },

        /**
         * 停止正在播放的实例。停止音频将重置他们的 position，而且调用 {{#crossLink "SoundInstance/resume"}}{{/crossLink}} 会失败。
         * 
         * @method stop
         * @return {Boolean} 如果成功停止音频将返回 true。
         */
        stop: function() {
            throw "not implemented.";
        },

        /**
         * 设置实例的音量。通过 {{#crossLink "SoundInstance/getVolume"}}{{/crossLink}} 获取音量。
         * <h4>例子</h4>
         *      myInstance.setVolume(0.5);
         *
         * 注意通过 Sound API 的方法 {{#crossLink "Sound/setVolume"}}{{/crossLink}} 设置音量，将应用于实例音量的最上层。
         *
         * @method setVolume
         * @param value 要设置的音量，介乎 0 到 1 之间。
         * @return {Boolean} 如果成功设置音量，返回 true。
         */
        setVolume: function(value) {
            throw "not implemented.";
        },

        /**
         * 内部使用的方法，基于主音量，实例音量，实例静音值和主静音值更新音量。
         * 
         * @method updateVolume
         * @return {Boolean} 如果音量被成功更新，返回 true。
         * @protected
         */
        updateVolume: function() {
            throw "not implemented.";
        },

        /**
         * 获取实例的音量值。实际的输出音量可以通过以下方式计算。
         *
         *      instance.getVolume() x Sound.getVolume();
         *
         * @method getVolume
         * @return 当前 sound 实例的音量值。
         */
        getVolume: function() {
            return this.volume;
        },

        /**
         * 设置音频静音和不静音。静音了的音频相当于以音量为 0 在播放。
         * 注意，取消静音的音频可能以为 Sound volume, instance volume, 和 Sound mute 依旧静音。
         * 
         * @method mute
         * @param {Boolean} value 音频是否需要静音。
         * @return {Boolean} 如果音频成功被静音，返回 true。
         */
        setMute: function(value) {
            if (value == null || value == undefined) {
                return false
            }
            this.muted = value;
            this.updateVolume();
            return true;
        },

        /**
         * 获取实例的静音值。
         *
         * <h4>例子</h4>
         *      var isMuted = myInstance.getMute();
         *
         * @method getMute
         * @return {Boolean} 实例的静音值。
         */
        getMute: function() {
            return this.muted;
        },

        /**
         * 获取播放头的位置，以毫秒为单位。
         * 
         * @method getPosition
         * @return {Number} 播放头的位置，以毫秒为单位。
         */
        getPosition: function() {
            throw "not implemented.";
        },

        /**
         * 设置实例播放头的位置。这个可以当音频正在播放时，暂停时，甚至停止的时候设置。
         *
         * <h4>例子</h4>
         *      myInstance.setPosition(myInstance.getDuration()/2); // 设置音频到中间的位置。
         *
         * @method setPosition
         * @param {Number} value 放置播放头的位置，以毫秒为单位。
         */
        setPosition: function(value) {
            throw "not implemented.";
        },

        /**
         * 设置实例的 左/右 声道。注意 {{#crossLink "HTMLAudioPlugin"}}{{/crossLink}} 不支持 panning，
         * 而 {{#crossLink "WebAudioPlugin"}}{{/crossLink}} 也仅仅支持简单的 左/右 panning。
         * 默认值是 0 （中间）。
         * 
         * @method setPan
         * @param {Number} value pan 值。-1（左）到 1（右）。
         * @return {Number} 如果成功设置 pan 值，返回 true。
         */
        setPan: function(value) {
            throw "not implemented.";
        },

        /**
         * 获取实例的 左/右 pan 值。
         * 注意，即使是 3D 音频，WebAudioPlugin 也只能提供 pan 的 “x” 值。
         * 
         * @method getPan
         * @return {Number} pan 值。-1（左）到 1（右）
         */
        getPan: function() {
            return this.pan;
        },

        /**
         * 获取实例的周期，以毫秒为单位。
         * 注：在很多情况下，需要在周期正确返回之前，就要调用 {{#crossLink "SoundInstance/play"}}{{/crossLink}} 或 
         * Sound API {{#crossLink "Sound.play"}}{{/crossLink}}。
         * 
         * @method getDuration
         * @return {Number} 实例的周期。
         */
        getDuration: function() {
            return this.duration;
        }
    });

    return SoundInstance;

});
