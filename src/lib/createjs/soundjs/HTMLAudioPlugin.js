/**
 *
 * 在浏览器中使用 HTML <audio> 标签播放音频。这个插件的优先级排第二。在 {{#crossLink "WebAudioPlugin"}}{{/crossLink}} 之后。
 * 支持 Chrome，Safari，IOS。这个在当下的浏览器基本都支持。对于不支持的浏览器，就要安装 {{#crossLink "FlashPlugin"}}{{/crossLink}} 了。
 *
 * <h4>已知 HTML Audio 在浏览器或操作系统的问题</h4>
 * <b>所有浏览器</b><br />
 *  
 * 测试表明，所有的浏览器对允许多少个音频标签实例均有限度。
 * 如果超出限度，结果将不可控。 一旦注册了 sounds 标签，Chrome 就会马上预加载声音。 
 * 请使用 {{#crossLink "Sound.MAX_INSTANCES"}}{{/crossLink}} 作为最大安全音频标签数的参考。 
 *
 * <b>IE9 html 局限性</b><br />
 * <ul><li> 改变音频状态的时候会有一个延迟。所以当希望进行静音操作时，音频将在延迟的这段时间里面继续播放。此时对音频进行任何操作均无济于事。</li>
 * <li> MP3 编码并不是任何时候都有效，尤其是在 IE 下。但默认的 64kbps 编码是有效的</li></ul>。
 *
 * <b>iOS 6 局限性</b><br />
 * 注：建议在 iOS (6+) 中使用 {{#crossLink "WebAudioPlugin"}}{{/crossLink}}，HTML Audio 只能拥有一个 <audio> 标签。
 *     不能预加载或自动播放音频，不能缓存音频，除了在事件里面不能播放音频。
 *
 * <b>Android 局限性</b><br />
 *      <li>用户只能通过控制设备的音量来控制音量。</li>
 *      <li>只能在事件里播放音频，意味着不能循环播放音频。</li></ul>
 *
 * 看 {{#crossLink "Sound"}}{{/crossLink}} 看已知问题。
 *
 * @module xc.createjs.soundjs
 */
xc.module.define("xc.createjs.HTMLAudioPlugin", function(exports) {

    var Sound = xc.module.require("xc.createjs.Sound");
    var SoundInstance = xc.module.require("xc.createjs.SoundInstance");

    /**
     * TagPool 是一个 HTMLAudio 的标签实例。在 Chrome 里面。必须在加载数据前，确定 HTML audio 的标签实例数。
     * （这个可能是 Chrome 的 bug）。
     * 
     * @class TagPool
     * @param {String} src channel 的资源路径。
     * @private
     */
    var TagPool = xc.class.create({
        initialize: function(src) {
            this.src = src;
            this.tags = [];
        },

        /**
         * 标签的资源。
         *
         * @property src
         * @type {String}
         * @private
         */
        src: null,

        /**
         * 当前 HTMLAudio 标签的总数。该设置确保能同时播放的最大实例数。
         *
         * @property length
         * @type {Number}
         * @default 0
         * @private
         */
        length: 0,

        /**
         * 还没使用的 HTMLAudio 标签。
         *
         * @property available
         * @type {Number}
         * @default 0
         * @private
         */
        available: 0,

        /**
         * 所有可用标签的列表。
         *
         * @property tags
         * @type {Array}
         * @private
         */
        tags: null,

        /**
         * 添加一个 HTMLAudio 标签。
         *
         * @method add
         * @param {HTMLAudioElement} tag 一个将要播放的标签。
         */
        add: function(tag) {
            this.tags.push(tag);
            this.length++;
            this.available++;
        },

        /**
         * 获取一个马上要播放的 HTMLAudio 元素。然后把它从标签列表中抽离出来。 
         *
         * @method get
         * @return {HTMLAudioElement} 一个 HTML audio 标签。
         */
        get: function() {
            if (this.tags.length == 0) {
                return null;
            }
            this.available = this.tags.length;
            var tag = this.tags.pop();
            if (tag.parentNode == null) {
                document.body.appendChild(tag);
            }
            return tag;
        },

        /**
         * 把一个 HTMLAudio 元素重新放回标签列表。
         *
         * @method set
         * @param {HTMLAudioElement} tag HTML audio 标签。
         */
        set: function(tag) {
            var index = this.tags.indexOf(tag);
            if (index == -1) {
                this.tags.push(tag);
            }
            this.available = this.tags.length;
        },

        toString: function() {
            return "[HTMLAudioPlugin TagPool]";
        }
    });

    /**
     * 一个用于寻找 SoundChannel 的哈希集合，该哈希以音频资源路径作为索引。
     *
     * @property tags
     * @static
     * @private
     */
    TagPool.tags = {};

    /**
     * 获取一个标签池，如果不存在，则创建一个。
     *
     * @method get
     * @param {String} src 音频标签要用到的音频资源路径。
     * @static
     * @private
     */
    TagPool.get = function(src) {
        var channel = TagPool.tags[src];
        if (channel == null) {
            channel = TagPool.tags[src] = new TagPool(src);
        }
        return channel;
    }

    /**
     * 获取一个标签实例。这个是短方法。
     * 
     * @method getInstance
     * @param {String} src audio 要用到的音频资源路径。
     * @static
     * @private
     */
    TagPool.getInstance = function(src) {
        var channel = TagPool.tags[src];
        if (channel == null) {
            return null;
        }
        return channel.get();
    }

    /**
     * 返回一个标签实例。这个是短方法。
     * 
     * @method setInstance
     * @param {String} src audio 要用到的音频资源路径。
     * @param {HTMLElement} tag 要设置的 Audio 标签。
     * @static
     * @private
     */
    TagPool.setInstance = function(src, tag) {
        var channel = TagPool.tags[src];
        if (channel == null) {
            return null;
        }
        return channel.set(tag);
    }

    /**
     * HTMLAudio 插件的 SoundInstance 具体执行方法。
     */
    var HTMLAudioSoundInstance = SoundInstance.extend({
        initialize: function(src, owner) {
            this.src = src;
            this.owner = owner;
            this.endedHandler = Sound.proxy(this.handleSoundComplete, this);
            this.readyHandler = Sound.proxy(this.handleSoundReady, this);
            this.stalledHandler = Sound.proxy(this.handleSoundStalled, this);
        },

        cleanUp: function() {
            var tag = this.tag;
            if (tag != null) {
                tag.pause();
                try {
                    tag.currentTime = 0;
                } catch (e) {
                } // 重置位置
                tag.removeEventListener(HTMLAudioPlugin.AUDIO_ENDED, this.endedHandler, false);
                tag.removeEventListener(HTMLAudioPlugin.AUDIO_READY, this.readyHandler, false);
                TagPool.setInstance(this.src, tag);
                this.tag = null;
            }
            this._super();
        },

        beginPlaying: function(offset, loop, volume, pan) {
            var tag = this.tag = TagPool.getInstance(this.src);
            if (tag == null) {
                this.playFailed();
                return -1;
            }
            this.duration = this.tag.duration * 1000;
            tag.addEventListener(HTMLAudioPlugin.AUDIO_ENDED, this.endedHandler, false);
            // 重置实例
            this.offset = offset;
            this.volume = volume;
            this.updateVolume(); // 注：更新静音设置
            this.remainingLoops = loop;
            if (tag.readyState !== 4) {
                tag.addEventListener(HTMLAudioPlugin.AUDIO_READY, this.readyHandler, false);
                tag.addEventListener(HTMLAudioPlugin.AUDIO_STALLED, this.stalledHandler, false);
                tag.load();
            } else {
                this.handleSoundReady(null);
            }
            this.sendEvent("succeeded");
            return 1;
        },

        // 注：Sounds stall 将在播放一段还没加载完成的音频时执行，这并不意味着音频不会播放。
        handleSoundStalled: function(event) {
            this.sendEvent("failed");
        },

        handleSoundReady: function(event) {
            this.playState = Sound.PLAY_SUCCEEDED;
            this.paused = false;
            this.tag.removeEventListener(HTMLAudioPlugin.AUDIO_READY, this.readyHandler, false);
            if (this.offset >= this.getDuration()) {
                this.playFailed();
                return;
            } else if (this.offset > 0) {
                this.tag.currentTime = this.offset * 0.001;
            }
            if (this.remainingLoops == -1) {
                this.tag.loop = true;
            }
            this.tag.play();
        },

        handleSoundComplete: function(event) {
            this.offset = 0;
            if (this.remainingLoops != 0) {
                this.remainingLoops--;
                this.tag.play();
                this.sendEvent("loop");
                return;
            }
            this.playState = Sound.PLAY_FINISHED;
            this.sendEvent("complete");
            this.cleanUp();
        },

        pause: function() {
            if (!this.paused && this.playState == Sound.PLAY_SUCCEEDED && this.tag != null) {
                this.paused = true;
                // 注：当用户暂停的时候，会保持一个引用。直到用户执行停止操作。
                this.tag.pause();
                clearTimeout(this.delayTimeoutId);
                return true;
            }
            return false;
        },

        resume: function() {
            if (!this.paused || this.tag == null) {
                return false;
            }
            this.paused = false;
            this.tag.play();
            return true;
        },

        stop: function() {
            this.offset = 0;
            this.pause();
            this.playState = Sound.PLAY_FINISHED;
            this.cleanUp();
            return true;
        },

        setVolume: function(value) {
            if (Number(value) == null) {
                return false;
            }
            value = Math.max(0, Math.min(1, value));
            this.volume = value;
            this.updateVolume();
            return true;
        },

        setMasterVolume: function(value) {
            this.updateVolume();
            return true;
        },

        setMasterMute: function(isMuted) {
            this.updateVolume();
            return true;
        },

        updateVolume: function() {
            if (this.tag != null) {
                var newVolume = (this.muted || Sound.masterMute) ? 0 : this.volume * Sound.masterVolume;
                if (newVolume != this.tag.volume) {
                    this.tag.volume = newVolume;
                }
                return true;
            } else {
                return false;
            }
        },

        setMute: function(isMuted) {
            if (isMuted == null || isMuted == undefined) {
                return false
            }
            this.muted = isMuted;
            this.updateVolume();
            return true;
        },

        setPan: function(value) {
            return false; // HTML 不能设置声道
        },

        getPosition: function() {
            if (this.tag == null) {
                return this.offset;
            }
            return this.tag.currentTime * 1000;
        },

        setPosition: function(value) {
            if (this.tag == null) {
                this.offset = value
            } else {
                try {
                    this.tag.currentTime = value * 0.001;
                } catch (error) { // 越界
                    return false;
                }
            }
            return true;
        },

        toString: function() {
            return "[HTMLAudioPlugin SoundInstance]";
        }
    });

    /**
     * 一个内部的辅助类，利用 HTMLAudioElement 标签预加载 html audio 标签。注意 PreloadJS 不会用这个加载器。
     * 注：这个类和它的方法没有文档是为了避免产生 HTML 文件。
     *
     * #class HTMLAudioLoader
     * @param {String} src 要加载的音频的资源路径。
     * @param {HTMLAudioElement} tag 要播放音频的 audio 标签。
     * @constructor
     * @private
     */
    var HTMLAudioLoader = xc.class.create({
        initialize: function(src, tag) {
            this.src = src;
            this.tag = tag;
            this.preloadTimer = setInterval(Sound.proxy(this.preloadTick, this), 200);
            // 这里告诉用户音频是否具备足够的缓冲去播放。
            // 一旦缓冲足够了，标签将不再保存在 Chrome 里面。
            // 注：Chrome 不支持 canplaythrough 回调，只能触发事件。 
            this.loadedHandler = Sound.proxy(this.sendLoadedEvent, this); // 这里为了能移除事件监听。
            this.loadedHandler = Sound.proxy(this.sendLoadedEvent, this);
            this.tag.addEventListener && this.tag.addEventListener("canplaythrough", this.loadedHandler);
            this.tag.onreadystatechange = Sound.proxy(this.sendLoadedEvent, this);
            this.tag.preload = "auto";
            this.tag.src = src;
            this.tag.load();
        },

        /**
         * 要加载的资源路径
         *
         * @property src
         * @type {String}
         * @default null
         * @protected
         */
        src: null,

        /**
         * 要加载资源的标签。
         *
         * @property tag
         * @type {AudioTag}
         * @default null
         * @protected
         */
        tag: null,

        /**
         * 一个提供内部使用的进度器。
         *
         * @property preloadTimer
         * @type {String}
         * @default null
         * @protected
         */
        preloadTimer: null,

        // 代理，用于更容易移除监听器。
        loadedHandler: null,

        /**
         * 让用户可以知道预加载进度和什么时候完成。
         *
         * @method preloadTick
         * @protected
         */
        preloadTick: function() {
            var buffered = this.tag.buffered;
            var duration = this.tag.duration;
            if (buffered.length > 0) {
                if (buffered.end(0) >= duration - 1) {
                    this.handleTagLoaded();
                }
            }
        },

        /**
         * 标签加载完成的内部处理器。
         *
         * @method handleTagLoaded
         * @protected
         */
        handleTagLoaded: function() {
            clearInterval(this.preloadTimer);
        },

        /**
         * 用于加载完成后与 Sound 之间的通讯。
         *
         * @method sendLoadedEvent
         * @param {Object} evt 加载事件
         */
        sendLoadedEvent: function(evt) {
            this.tag.removeEventListener && this.tag.removeEventListener("canplaythrough", this.loadedHandler); // cleanup and so we don't send the event more than once
            this.tag.onreadystatechange = null; // 移除状态，意味着不会发超过一次的事件信息。
            Sound.sendLoadComplete(this.src); // 在 Sound 中触发事件或调用回调。
        },

        // 用于调试。
        toString: function() {
            return "[HTMLAudioPlugin HTMLAudioLoader]";
        }
    });

    var HTMLAudioPlugin = xc.class.create({
        initialize: function() {
            this.capabilities = HTMLAudioPlugin.capabilities;
            this.audioSources = {};
        },

        /**
         * 插件的功能，通过 {{#crossLink "HTMLAudioPlugin/generateCapabilities"}}{{/crossLink}} 创建
         *
         * @property capabilities
         * @type Object
         * @protected
         */
        capabilities: null,

        /**
         * 一个以文件资源路径为索引的哈希对象，指出音频资源是加载完成还是正在加载。
         *
         * @property audioSources
         * @type {Object}
         * @protected
         */
        audioSources: null,

        /**
         * 默认允许的实例数。当音频资源通过 {{#crossLink "Sound/register"}}{{/crossLink}} 方法注册时，将传回 {{#crossLink "Sound"}}{{/crossLink}}，
         * 这个值仅仅在没提供最大频道数时使用。
         * <b>请注意，此限制只存在于 HTML audio 标签。</b>
         *
         * @property defaultNumChannels
         * @type {Number}
         * @default 2
         */
        defaultNumChannels: 2,

        /**
         * 当一个 sound 实例 预加载/安装 时进行预注册。这个是由 {{#crossLink "Sound"}}{{/crossLink}} 调用的。
         * 注意这里提供了一个对象，该对象包含一个用于预加载的标签，该标签在 <a href="http://preloadjs.com">PreloadJS</a> 预加载时用到。
         * 
         * @method register
         * @param {String} src audio 的资源路径。
         * @param {Number} instances 允许的最大资源实例数。
         * @return {Object} 一个结果对象, 包括一个资源标签和允许的最大实例资源数。
         */
        register: function(src, instances) {
            this.audioSources[src] = true; // Note this does not mean preloading has started
            var channel = TagPool.get(src);
            var tag = null;
            var l = instances || this.defaultNumChannels;
            for ( var i = 0; i < l; i++) {
                tag = this.createTag(src);
                channel.add(tag);
            }
            return {
                tag: tag, // 返回一个用于预加载的实例。
                numChannels: l // Sound 的默认频道数或是传进的值。
            };
        },

        /**
         * 创建一个 HTML audio 标签。
         * @method createTag
         * @param {String} src 设置到 audio 标签的资源。
         * @return {HTMLElement} 返回 HTML audio 标签。
         * @protected
         */
        createTag: function(src) {
            var tag = typeof Audio !== undefined ? new Audio() : document.createElement("audio");
            tag.autoplay = false;
            tag.preload = "none";
            tag.src = src;
            return tag;
        },

        /**
         * 创建音频实例。如果音频没加载完，就会在这里内部加载。
         * 
         * @method create
         * @param {String} src 要用到的音频资源。
         * @return {SoundInstance} 一个能控制的音频实例。
         */
        create: function(src) {
            // 如果该音频没有注册，创建一个标签然后进行预加载。
            if (!this.isPreloadStarted(src)) {
                var channel = TagPool.get(src);
                var tag = this.createTag(src);
                channel.add(tag);
                this.preload(src, {
                    tag: tag
                });
            }
            return new HTMLAudioSoundInstance(src, this);
        },

        /**
         * 检测是否已经开始预加载。
         * 
         * @method isPreloadStarted
         * @param {String} src 要检查的资源 URI。
         * @return {Boolean} 如果已经开始预加载，则返回 true。
         */
        isPreloadStarted: function(src) {
            return (this.audioSources[src] != null);
        },

        /**
         * 内部预加载音频。
         * 
         * @method preload
         * @param {String} src 要加载的音频的 URI。
         * @param {Object} instance 一个实例。
         */
        preload: function(src, instance) {
            this.audioSources[src] = true;
            new HTMLAudioLoader(src, instance.tag);
        },

        toString: function() {
            return "[HTMLAudioPlugin]";
        }
    });

    /**
     * 可以同时播放的最大实例数。这个是浏览器限制的。实际数量会随着浏览器的不同而改变，但这个是安全的估值。
     *
     * @property MAX_INSTANCES
     * @type {Number}
     * @default 30
     * @static
     */
    HTMLAudioPlugin.MAX_INSTANCES = 30;

    /**
     * 插件的功能。这个是通过 SoundInstance {{#crossLink "TMLAudioPlugin/generateCapabilities"}}{{/crossLink}} 创建的。
     * 请看 Sound 的 {{#crossLink "Sound/getCapabilities"}}{{/crossLink}} 方法获取更多可用属性。
     *
     * @property capabilities
     * @type {Object}
     * @static
     */
    HTMLAudioPlugin.capabilities = null;

    /**
     * 代表 canPlayThrough 事件的静态常量。
     *
     * @property AUDIO_READY
     * @type {String}
     * @default canplaythrough
     * @static
     */
    HTMLAudioPlugin.AUDIO_READY = "canplaythrough";

    /**
     * 代表 ended 事件的静态常量。
     *
     * @property AUDIO_ENDED
     * @type {String}
     * @default ended
     * @static
     */
    HTMLAudioPlugin.AUDIO_ENDED = "ended";

    /**
     * 代表 error 事件的静态常量。
     *
     * @property AUDIO_ERROR
     * @type {String}
     * @default error
     * @static
     */
    HTMLAudioPlugin.AUDIO_ERROR = "error"; //TODO: Handle error cases

    /**
     * 代表 stalled 事件的静态常量。
     *
     * @property AUDIO_STALLED
     * @type {String}
     * @default stalled
     * @static
     */
    HTMLAudioPlugin.AUDIO_STALLED = "stalled";

    /**
     * 决定插件是否能再当前 浏览器/操作系统 下运行。
     * 注：audio 标签除了 IOS 系统之外，已经被现今的大部分浏览器支持了。
     * 
     * @method isSupported
     * @return {Boolean} 如果浏览器支持该插件，返回 true。
     * @static
     */
    HTMLAudioPlugin.isSupported = function() {
        // 在 IOS 上，可以通过移除这一行去启用该插件，但基于局限性，这个做法是不推荐的。
        // IOS 只能拥有一个音频实例，不支持预加载以及自动不放，不能缓存音频，而且只能在用户事件中播放（如：click）
        HTMLAudioPlugin.generateCapabilities();
        if (HTMLAudioPlugin.capabilities == null) {
            return false;
        }
        return true;
    };

    /**
     * 决定插件的功能管理。内部使用。请看 Sound API {{#crossLink "Sound/getCapabilities"}}{{/crossLink}} 获取各个属性的值。
     *
     * @method generateCapabiities
     * @static
     * @protected
     */
    HTMLAudioPlugin.generateCapabilities = function() {
        if (HTMLAudioPlugin.capabilities != null) {
            return;
        }
        /*var t = document.createElement("audio");
        if (t.canPlayType == null) {
            return;
        }*/
        HTMLAudioPlugin.capabilities = {
            panning: true,
            volume: true,
            tracks: -1
        };
        // 遍历 Sound.SUPPORTED_EXTENSIONS 确定该浏览器支持那个插件。
        var supportedExtensions = Sound.SUPPORTED_EXTENSIONS;
        var extensionMap = Sound.EXTENSION_MAP;
        for ( var i = 0, l = supportedExtensions.length; i < l; i++) {
            var ext = supportedExtensions[i];
            var playType = extensionMap[ext] || ext;
            HTMLAudioPlugin.capabilities[ext] = true;
            /*(t.canPlayType("audio/" + ext) != "no" && t.canPlayType("audio/" + ext) != "") 
            || (t.canPlayType("audio/" + playType) != "no" && t.canPlayType("audio/" + playType) != "");*/
        }
    }

    return HTMLAudioPlugin;

});
