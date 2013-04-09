xc.module.define("xc.createjs.WebAudioPlugin", function(exports) {

    var Sound = xc.module.require("xc.createjs.Sound");
    var SoundInstance = xc.module.require("xc.createjs.SoundInstance");

    /**
     * WebAudioPlugin 的 SoundInstance 具体执行方法。
     */
    var WebAudioSoundInstance = SoundInstance.extend({
        initialize: function(src, owner) {
            this.owner = owner;
            this.src = src;
            this.panNode = this.owner.context.createPanner(); // 允许用户选择左右声道。  // TODO test how this affects when we have mono audio
            this.gainNode = this.owner.context.createGainNode(); // 允许用户操作实例。
            this.gainNode.connect(this.panNode); // 链接到序列。
            if (this.owner.isPreloadComplete(this.src)) {
                this.duration = this.owner.arrayBuffers[this.src].duration * 1000;
            }
            this.endedHandler = Sound.proxy(this.handleSoundComplete, this);
            this.readyHandler = Sound.proxy(this.handleSoundReady, this);
            this.stalledHandler = Sound.proxy(this.handleSoundStalled, this);
        },

        soundCompleteTimeout: null,

        startTime: 0,

        /**
         * 清除实例。移除引用以及清除所有的额外参数。例如 timers。
         * 
         * @method cleanup
         * @protected
         */
        cleanUp: function() {
            // 如果 playbackState 的值为 UNSCHEDULED_STATE，继而 noteON 或 noteGrainOn 没有被调用，则调用 noteOff 会抛出错误。
            if (this.sourceNode && this.sourceNode.playbackState != this.sourceNode.UNSCHEDULED_STATE) {
                this.sourceNode.noteOff(0);
                this.sourceNode = null; // 删除音频引用，以便可以进行垃圾回收。
            }
            if (this.panNode.numberOfOutputs != 0) {
                this.panNode.disconnect(0);
            } // 执行这个是因为只有一个链接，而且该链接断开的时候就会返回 0。
            clearTimeout(this.delayTimeoutId); // 清除播放时的 timeout。
            clearTimeout(this.soundCompleteTimeout); // 清除完成时的 timeout。
            Sound.playFinished(this);
        },

        // 播放已止步不前，因此失败。
        handleSoundStalled: function(event) {
            this.sendEvent("failed");
        },

        // 声音已经准备好播放。
        handleSoundReady: function(event) {
            if (this.offset > this.getDuration()) {
                this.playFailed();
                return;
            } else if (this.offset < 0) { // 当 noteGrainOn 忽略 negative 值时，不需要执行该判断，这个没有在 API http://www.w3.org/TR/webaudio/#AudioBufferSourceNode 中指定。
                this.offset = 0;
            }
            this.playState = Sound.PLAY_SUCCEEDED;
            this.paused = false;
            this.panNode.connect(this.owner.gainNode); //这行可能会导致内存泄露。  
            // 注：用户需要从 audioDestination 断开链接或任何可能导致这种情况的序列。
            // WebAudio 支持 BufferSource, MediaElementSource, 和 MediaStreamSource。
            // 注：因为 MediaElementSource 是用 audio 标签的，所以要求不同的命令去播放，暂停，和停止。
            // 即使 MediaStreamSource 和 MediaElementSource 共享相同的命令，但仍然假定 MediaStreamSource 也拥有自己独特的命令。
            this.sourceNode = this.owner.context.createBufferSource();
            this.sourceNode.buffer = this.owner.arrayBuffers[this.src];
            this.duration = this.owner.arrayBuffers[this.src].duration * 1000;
            this.sourceNode.connect(this.gainNode);
            this.soundCompleteTimeout = setTimeout(this.endedHandler, (this.sourceNode.buffer.duration - this.offset) * 1000); // NOTE *1000 because WebAudio reports everything in seconds but js uses milliseconds
            this.startTime = this.owner.context.currentTime - this.offset;
            this.sourceNode.noteGrainOn(0, this.offset, this.sourceNode.buffer.duration - this.offset);
        },

        // 音频完成播放。如果有需要，手动循环。
        // 提供给 WebAudioPlugin 的 soundCompleteTimeout 内部调用。
        handleSoundComplete: function(event) {
            this.offset = 0; // 必须设置这个，因为它会在播放过程中暂停时被改变。
            if (this.remainingLoops != 0) {
                this.remainingLoops--; // 注：这里介绍了一个循环的极限值 size x 2 - 1
                this.handleSoundReady(null);
                if (this.onLoop != null) {
                    this.onLoop(this);
                }
                this.sendEvent("loop");
                return;
            }
            this.playState = Sound.PLAY_FINISHED;
            if (this.onComplete != null) {
                this.onComplete(this);
            }
            this.sendEvent("complete");
            this.cleanUp();
        },

        beginPlaying: function(offset, loop, volume, pan) {
            if (!this.src) {
                return;
            }
            this.offset = offset / 1000; //转换毫秒为秒。
            this.remainingLoops = loop;
            this.setVolume(volume);
            this.setPan(pan);
            if (this.owner.isPreloadComplete(this.src)) {
                this.handleSoundReady(null);
                this.onPlaySucceeded && this.onPlaySucceeded(this);
                this.sendEvent("succeeded");
                return 1;
            } else {
                this.playFailed();
                return;
            }
        },

        pause: function() {
            if (!this.paused && this.playState == Sound.PLAY_SUCCEEDED) {
                this.paused = true;
                this.offset = this.owner.context.currentTime - this.startTime; // 在相同位置重新播放音频
                this.sourceNode.noteOff(0); // 注：这意味着 sourceNode 不能被重用，只能重新创建。
                if (this.panNode.numberOfOutputs != 0) {
                    this.panNode.disconnect();
                } // 执行这个是因为只有一个链接，而且该链接断开的时候就会返回 0。
                clearTimeout(this.delayTimeoutId); // 清除播放时的 timeout。
                clearTimeout(this.soundCompleteTimeout); // 清除完成时的 timeout。
                return true;
            }
            return false;
        },

        resume: function() {
            if (!this.paused) {
                return false;
            }
            this.handleSoundReady(null);
            return true;
        },

        stop: function() {
            this.playState = Sound.PLAY_FINISHED;
            this.cleanUp();
            this.offset = 0; // 设置音频在开始出播放。
            return true;
        },

        setVolume: function(value) {
            if (Number(value) == null) {
                return false;
            }
            value = Math.max(0, Math.min(1, value));
            this.volume = value;
            this.updateVolume();
            return true; // 这里永远返回 true，因为即使音量不被更新，也是已经被设置的。
        },

        updateVolume: function() {
            var newVolume = this.muted ? 0 : this.volume;
            if (newVolume != this.gainNode.gain.value) {
                this.gainNode.gain.value = newVolume;
                return true;
            }
            return false;
        },

        setMute: function(value) {
            if (value == null || value == undefined) {
                return false
            }
            this.muted = value;
            this.updateVolume();
            return true;
        },

        setPan: function(value) {
            if (this.owner.capabilities.panning) {
                // 注：WebAudioPlugin 可以支持 3D 音频，但该引用还没能支持。
                this.panNode.setPosition(value, 0, -0.5); // z 需要设为 -0.5 达到音频只能播放 2D 的效果。
                this.pan = value; // 不幸的是，音频没有提供一个能设置该音效的方法。 http://www.w3.org/TR/webaudio/#AudioPannerNode
            } else {
                return false;
            }
        },

        getPosition: function() {
            if (this.paused || this.sourceNode == null) {
                var pos = this.offset;
            } else {
                var pos = this.owner.context.currentTime - this.startTime;
            }
            return pos * 1000; // 转换为毫秒。
        },

        setPosition: function(value) {
            this.offset = value / 1000; // 转换毫秒为秒。
            if (this.sourceNode && this.sourceNode.playbackState != this.sourceNode.UNSCHEDULED_STATE) { //如果 playbackState 的值为 UNSCHEDULED_STATE，继而 noteON 或 noteGrainOn 没有被调用，则调用 noteOff 会抛出错误。
                this.sourceNode.noteOff(0); // 停止该音频, 因为需要创建一个重新定位的 sourceNode
                clearTimeout(this.soundCompleteTimeout); // 清除完成时的 timeout。
            }// 注：不能仅仅执行 cleanup，原因是同时执行了 Sound 类的 playFinished 方法。
            if (!this.paused && this.playState == Sound.PLAY_SUCCEEDED) {
                this.handleSoundReady(null);
            }
            return true;
        },

        toString: function() {
            return "[WebAudioPlugin SoundInstance]";
        }
    });

    /**
     * 一个内部辅助类，用于帮助 web audio 通过 XHR，预加载。
     * 注：这个类和它的方法没有适当的说明是为了避免产生 HTML 文档。
     * 
     * @class WebAudioLoader
     * @param {String} src 要加载的音频资源。
     * @param {Object} owner 创建当前实例的类的引用。
     * @constructor
     */
    var WebAudioLoader = xc.class.create({
        initialize: function(src, owner) {
            this.src = src;
            this.owner = owner;
        },

        // XHR2 请求的请求对象。
        request: null,

        owner: null,

        progress: -1,

        /**
         * 要加载的音频资源。返回这个类的时候用于回调函数。
         * 
         * @property src
         * @type {String}
         */
        src: null,

        /**
         * 加载完成时的返回的解压后的 AudioBuffer。
         * 
         * @property result
         * @type {AudioBuffer}
         * @protected
         */
        result: null,

        /**
         * 当加载完成的时候触发该回调。这个紧接 HTML 标签命名。
         * 
         * @property onload
         * @type {Method}
         */
        onload: null,

        /**
         * 当加载进度向前的时候触发。这个跟着 HTML 标签命名
         * 
         * @property onprogress
         * @type {Method}
         */
        onprogress: null,

        /**
         * 当加载出现错误的时候触发该回调。
         * 
         * @property onError
         * @type {Method}
         * @protected
         */
        onError: null,

        /**
         * 开始加载内容。
         * 
         * @method load
         * @param {String} src 音频的资源路径。
         */
        load: function(src) {
            if (src != null) {
                this.src = src;
            }
            this.request = new XMLHttpRequest();
            this.request.open("GET", this.src, true);
            this.request.responseType = "arraybuffer";
            this.request.onload = Sound.proxy(this.handleLoad, this);
            this.request.onError = Sound.proxy(this.handleError, this);
            this.request.onprogress = Sound.proxy(this.handleProgress, this);
            this.request.send();
        },

        /**
         * 一个汇报进度的加载器。
         * 
         * @method handleProgress
         * @param {Number} loaded 加载数。
         * @param {Number} total 总数。
         * @private
         */
        handleProgress: function(loaded, total) {
            this.progress = loaded / total;
            if (this.onprogress == null) {
                return;
            }
            this.onprogress({
                loaded: loaded,
                total: total,
                progress: this.progress
            });
        },

        /**
         * 音频完成了加载。
         * 
         * @method handleLoad
         * @protected
         */
        handleLoad: function() {
            WebAudioPlugin.context.decodeAudioData(this.request.response, Sound.proxy(this.handleAudioDecoded, this), Sound.proxy(this.handleError, this));
        },

        /**
         * 音频被解码。
         * 
         * @method handleAudioDecoded
         * @protected
         */
        handleAudioDecoded: function(decodedAudio) {
            this.progress = 1;
            this.result = decodedAudio;
            this.owner.addPreloadResults(this.src, this.result);
            this.onload && this.onload();
        },

        /**
         * 加载器导致的错误。
         * 
         * @method handleError
         * @protected
         */
        handleError: function(evt) {
            this.owner.removeFromPreload(this.src);
            this.onerror && this.onerror(evt);
        },

        toString: function() {
            return "[WebAudioPlugin WebAudioLoader]";
        }
    });

    /**
     * 通过 Web Audio 在浏览器播放音频。WebAudio 插件已经成功通过以下测试：
     * <ul><li>Google Chrome, version 23+ on OS X and Windows</li>
     *      <li>Safari 6+ on OS X</li>
     *      <li>Mobile Safari on iOS 6+</li>
     * </ul>
     * 
     * WebAudioPlugin 是当前的默认默认插件。以及会在任何支持它的情况下用到它。如果要修改它的优先级，
     * 请查阅 Sound API 的 {{#crossLink "Sound/registerPlugins"}}{{/crossLink}} 方法。
     *
     * <h4>已知 Web Audio 插件浏览器和操作系统的问题</h4>
     * <b>Webkit (Chrome 和 Safari)</b><br />
     * <ul><li>AudioNode.disconnect 不是每次都有效。这个取决于文件的大小。</li>
     *
     * <b>iOS 6 局限性</b><br />
     * <ul><li>Sound 在用户事件里面不能静音 (touch)。</li>
     *
     * @class WebAudioPlugin
     * @constructor
     */
    var WebAudioPlugin = xc.class.create({
        initialize: function() {
            this.capabilities = WebAudioPlugin.capabilities;
            this.arrayBuffers = {};
            this.context = WebAudioPlugin.context;
            this.gainNode = WebAudioPlugin.gainNode;
            this.dynamicsCompressorNode = WebAudioPlugin.dynamicsCompressorNode;
        },

        capabilities: null, // doc'd above

        /**
         * web audio 上下文，用于播放音频。所有 WebAudioPlugin 的节点都必须在 context 内。
         * 
         * @property context
         * @type {AudioContext}
         */
        context: null,

        /**
         * 用于改善声音以及防止声音失真（http://www.w3.org/TR/webaudio/#DynamicsCompressorNode）。
         * 链接到 <code>context.destination</code>。
         * 
         * @property dynamicsCompressorNode
         * @type {AudioNode}
         */
        dynamicsCompressorNode: null,

        /**
         * 一个用于控制主音量 GainNode。链接到 <code>dynamicsCompressorNode</code>。
         * 
         * @property gainNode
         * @type {AudioGainNode}
         */
        gainNode: null,

        /** 
         * 一个内部使用的哈希集合，以资源的 URI 作为索引。这个用于防止多次加载或解析音频。
         * 如果文件已经开始加载，<code>arrayBuffers[src]</code> 会设置为 true。一旦加载完成，则设置一个加载完成的 ArrayBuffer 实例。
         * 
         * @property arrayBuffers
         * @type {Object}
         * @protected
         */
        arrayBuffers: null,

        /**
         * 为音频的预加载和安装进行预注册。这个通过 {{#crossLink "Sound"}}{{/crossLink}} 调用。
         * 注意 WebAudio 提供了一个 <code>WebAudioLoader</code> 实例，该实例可以协助 <a href="http://preloadjs.com">PreloadJS</a> 去预加载。
         * 
         * @method register
         * @param {String} src 音频的资源路径
         * @param {Number} instances 正在播放的音频实例允许 channel 的数量。请注意，WebAudioPlugin 不管理此优先级。
         * @return {Object} 一个包含预加载标签的对象。
         */
        register: function(src, instances) {
            this.arrayBuffers[src] = true; // This is needed for PreloadJS
            var tag = new WebAudioLoader(src, this);
            return {
                tag: tag
            };
        },

        /**
         * 检测是否已经开始预加载。
         * 
         * @method isPreloadStarted
         * @param {String} src 要检查的资源 URI。
         * @return {Boolean} 如果已经开始预加载，则返回 true。
         */
        isPreloadStarted: function(src) {
            return (this.arrayBuffers[src] != null);
        },

        /**
         * 检查是否已经对指定资源完成预加载，如果资源已经定义（但不 === true），即加载完成。
         * 
         * @method isPreloadComplete
         * @param {String} src 要加载音频的 URI。
         * @return {Boolean}
         */
        isPreloadComplete: function(src) {
            return (!(this.arrayBuffers[src] == null || this.arrayBuffers[src] == true));
        },

        /**
         * 从预加载列表里移除一个资源。注意这个不会停止预加载。
         * 
         * @method removeFromPreload
         * @param {String} src 要加载音频的 URI。
         * @return {Boolean}
         */
        removeFromPreload: function(src) {
            delete (this.arrayBuffers[src]);
        },

        /**
         * 将结果加载到预加载哈希集合。
         * 
         * @method addPreloadResults
         * @param {String} src 要卸载声音的 URI。
         * @return {Boolean}
         */
        addPreloadResults: function(src, result) {
            this.arrayBuffers[src] = result;
        },

        /**
         * 处理内部预加载完成。
         * 
         * @method handlePreloadComplete
         * @private
         */
        handlePreloadComplete: function() {
            Sound.sendLoadComplete(this.src); // fire event or callback on Sound
        },

        /**
         * 内部预加载音频。利用 XHR2 加载 arraybuffer 格式的音频用于 WebAudio。
         * 
         * @method preload
         * @param {String} src 要加载的音频的 URI。
         * @param {Object} instance 不在插件内使用。
         * @protected
         */
        preload: function(src, instance) {
            this.arrayBuffers[src] = true;
            var loader = new WebAudioLoader(src, this);
            loader.onload = this.handlePreloadComplete;
            loader.load();
        },

        /**
         * 创建一个音频实例。如果音频是没有预加载的，则会进行内部加载。
         * 
         * @method create
         * @param {String} src 要加载的音频的 URI。
         * @return {SoundInstance} 一个用于播放和可以控制的音频实例。
         */
        create: function(src) {
            if (!this.isPreloadStarted(src)) {
                this.preload(src);
            }
            return new WebAudioSoundInstance(src, this);
        },

        toString: function() {
            return "[WebAudioPlugin]";
        }
    });

    /**
     * 插件的功能。这个通过 <code>"WebAudioPlugin/generateCapabilities</code> 创建。
     * 
     * @property capabilities
     * @type {Object}
     * @default null
     * @static
     */
    WebAudioPlugin.capabilities = null;

    /**
     * 判断插件能否在当前的 浏览器/操作系统 使用。
     * 
     * @method isSupported
     * @return {Boolean} 如果插件能被初始化，返回 true。
     * @static
     */
    WebAudioPlugin.isSupported = function() {
        if (location.protocol == "file:") {
            return false;
        } // Web Audio 利用 XHR, 意味着不能再本地使用。
        WebAudioPlugin.generateCapabilities();
        if (WebAudioPlugin.context == null) {
            return false;
        }
        return true;
    };

    /**
     * 决定插件的功能。内部使用，请看 Sound API 的 {{#crossLink "Sound/getCapabilities"}}{{/crossLink}} 方法了解如何重写插件的功能。
     * 
     * @method generateCapabiities
     * @static
     * @protected
     */
    WebAudioPlugin.generateCapabilities = function() {
        if (WebAudioPlugin.capabilities != null) {
            return;
        }
        // Web Audio 可以播放所有支持的音频元素，http://www.w3.org/TR/webaudio/#AudioContext-section，
        // 因此，标签在使用之前仍需要先检查其功能。
        var t = document.createElement("audio");
        if (t.canPlayType == null) {
            return null;
        }
        // 首先检查目前在使用什么，按照规则要求应该是 AudioContext，这里会随着时间的变化而变化。
        if (window.webkitAudioContext) {
            WebAudioPlugin.context = new webkitAudioContext();
        } else if (window.AudioContext) {
            WebAudioPlugin.context = new AudioContext();
        } else {
            return null;
        }
        WebAudioPlugin.capabilities = {
            panning: true,
            volume: true,
            tracks: -1
        };
        // 遍历 Sound.SUPPORTED_EXTENSIONS，判断当前浏览器支持该插件的什么功能。
        var supportedExtensions = Sound.SUPPORTED_EXTENSIONS;
        var extensionMap = Sound.EXTENSION_MAP;
        for ( var i = 0, l = supportedExtensions.length; i < l; i++) {
            var ext = supportedExtensions[i];
            var playType = extensionMap[ext] || ext;
            WebAudioPlugin.capabilities[ext] =
            (t.canPlayType("audio/" + ext) != "no" && t.canPlayType("audio/" + ext) != "") 
            || (t.canPlayType("audio/" + playType) != "no" && t.canPlayType("audio/" + playType) != "");
        }
        // 0=no output, 1=mono, 2=stereo, 4=surround, 6=5.1 surround。
        // 看 http://www.w3.org/TR/webaudio/#AudioChannelSplitter 获取更多平道信息。
        if (WebAudioPlugin.context.destination.numberOfChannels < 2) {
            WebAudioPlugin.capabilities.panning = false;
        }
        // 设立将要进行连接的 AudioNodes
        WebAudioPlugin.dynamicsCompressorNode = WebAudioPlugin.context.createDynamicsCompressor();
        WebAudioPlugin.dynamicsCompressorNode.connect(WebAudioPlugin.context.destination);
        WebAudioPlugin.gainNode = WebAudioPlugin.context.createGainNode();
        WebAudioPlugin.gainNode.connect(WebAudioPlugin.dynamicsCompressorNode);
    }

    return WebAudioPlugin;

});
