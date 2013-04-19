xc.module.define("xc.createjs.Sound", function(exports) {

    var EventDispatcher = xc.module.require("xc.createjs.EventDispatcher");

    /**
     * Sound 类包含所有创建声音，控制声音音量，以及管理插件的 API。
     * 所有在这个类里面的 API 都是静态的。
     *
     * <b>注册和预加载</b><br />
     * 音频必须在播放之前已经被注册。可以通过 {{#crossLink "Sound/registerSound"}}{{/crossLink}} 注册单个音频
     * 或 {{#crossLink "Sound/registerManifest"}}{{/crossLink}} 注册多个。
     * 如果没有及时注册，音频将会在调用 {{#crossLink "Sound/play"}}{{/crossLink}} 时自动注册。
     * 如果使用 <a href="http://preloadjs.com" target="_blank">PreloadJS</a>，则会在加载完成时注册。
     * 这里建议，内部加载音频的时候使用 register 方法，而外部加载的时候使用 PreloadJS。这样会使得音频在任何时候都是准备好的状态。
     * 
     * <b>播放</b><br />
     * 使用 {{#crossLink "Sound/play"}}{{/crossLink}} 方法，播放一段加载并注册好的音频。
     * 方法返回一个 {{#crossLink "SoundInstance"}}{{/crossLink}} 实例，该实例可以 paused，resumed，muted，等等。
     * 请看 {{#crossLink "SoundInstance"}}{{/crossLink}} 文档获取更多 API 信息。
     *
     * <b>插件</b><br />
     * 默认情况下 {{#crossLink "WebAudioPlugin"}}{{/crossLink}} 或 {{#crossLink "HTMLAudioPlugin"}}{{/crossLink}} 插件将被使用（产检可用的前提下），
     * 即使开发者可以改变插件的优先级以及添加新的插件（比如提供一个 {{#crossLink "FlashPlugin"}}{{/crossLink}} 插件）。
     * 请看 {{#crossLink "Sound"}}{{/crossLink}} API 获取更多关于 playback 和 插件 API。
     * 看 {{#crossLink "Sound/installPlugins"}}{{/crossLink}} 获取更多关于安装插件，管理插件信息。
     *
     * <h4>例子</h4>
     *      createjs.Sound.registerPlugins([createjs.WebAudioPlugin, createjs.FlashPlugin]);
     *      createjs.Sound.addEventListener("loadComplete", createjs.proxy(this.loadHandler, (this));
     *      createjs.Sound.registerSound("path/to/mySound.mp3|path/to/mySound.ogg", "sound");
     *      function loadHandler(event) {
     *          // 播放所有注册音频。
     *          var instance = createjs.Sound.play("sound");  // 传入音频 id，同时可以传入资源路径。
     *          instance.addEventListener("complete", createjs.proxy(this.handleComplete, this));
     *          instance.setVolume(0.5);
     *      }
     *
     * 可以通过指定 {{#crossLink "Sound/registerSound"}}{{/crossLink}} 的参数以指定同时播放的音频实例的最大数量。
     *
     *      createjs.Sound.registerSound("sound.mp3", "soundId", 4);
     *
     * Sound 可以作为一个 PreloadJS 的插件，更恰当地加载音频。通过 PreloadJS 加载的音频会自动加载到 Sound 里面。
     * 当音频没有预加载，Sound 会做一个内部的预加载，也就是说，当第一次播放的时候，它并不是马上就播放的，它需要一次预加载的过程。
     * 通过监听 {{#crossLink "Sound/loadComplete"}}{{/crossLink}} 事件判断音频何时加载完成。
     * 这里建议所有的音频都在播放之前先加载完成。
     *
     *      createjs.PreloadJS.installPlugin(createjs.Sound);
     *
     * <h4>已知浏览器和操作系统问题</h4>
     * <b>IE 9 的 html 局限性</b><br />
     * <ul><li> 当改变音频状态的时候有一个延迟。所以进行静音操作时，音频将在延迟的这段时间里面继续播放。此时对音频进行任何操作均无济于事。</li>
     * <li> MP3 编码并不是任何时候都有效，尤其是在 IE 下。但 64kbps 编码是有效的。</li></ul>
     *
     * <b>iOS 6 局限性</b><br />
     * <ul><li>Sound 初始化为静音，一旦在用户内部事件（touch）里调用 play，静音会自动消除。</li>
     *     <li>尽管有相反的意见，但这里还是通过控制音量去解决这个问题。</li></ul>
     * 更多信息: http://stackoverflow.com/questions/12517000/no-sound-on-ios-6-web-audio-api
     *
     * <b>Android 局限性</b><br />
     * <ul><li>当调用 createjs.Sound.BrowserDetect.isChrome 的时候 Android chrome 会返回 true, 但其他不同的浏览器会返回不同的结果。</li>
     *     <li>不能控制音量的大小，只有用户可以设置设备的音量大小。</li>
     *     <li>只能在用户事件里面播放音频，这意味着音频不能循环播放。</li></ul>
     *
     * @class Sound
     * @static
     */
    var Sound = function() {
        throw "Sound cannot be instantiated";
    }

    /**
     * 用于分割开多个资源路径的分隔符。
     * 
     * @property DELIMITER
     * @type {String}
     * @default |
     * @static
     */
    Sound.DELIMITER = "|";

    /**
     * 一个中断值，标识最大数量的音频实例已经在播放时，
     * 中断最早播放并拥有相同资源的音频,该音频距离起点最近。
     * 
     * @property INTERRUPT_EARLY
     * @type {String}
     * @default early
     * @static
     */
    Sound.INTERRUPT_EARLY = "early";

    /**
     * 一个中断值，标识最大数量的音频实例已经在播放时，
     * 中断最晚播放并拥有相同资源的音频,该音频距离起点最远。
     * 
     * @property INTERRUPT_LATE
     * @type {String}
     * @default late
     * @static
     */
    Sound.INTERRUPT_LATE = "late";

    /**
     * 一个中断值，标识最大数量的音频实例已经在播放时，
     * 不中断任何当前播放并拥有相同资源的音频。
     * 
     * @property INTERRUPT_NONE
     * @type {String}
     * @default none
     * @static
     */
    Sound.INTERRUPT_NONE = "none";

    /**
     * 正在播放或暂停的实例状态。
     * 
     * @property PLAY_SUCCEEDED
     * @type {String}
     * @default playSucceeded
     * @static
     */
    Sound.PLAY_SUCCEEDED = "playSucceeded";

    /**
     * 被其他实例中断的实例状态。
     *
     * @property PLAY_INTERRUPTED
     * @type {String}
     * @static
     */
    Sound.PLAY_INTERRUPTED = "playInterrupted";

    /**
     * 完成播放的实例状态。
     *
     * @property PLAY_FINISHED
     * @type {String}
     * @static
     */
    Sound.PLAY_FINISHED = "playFinished";

    /**
     * 一个播放失败的实例状态。这个通常发生在当调用 INTERRUPT_NONE 的时候，缺乏可用频道，播放中断，或找不到音频资源。
     *
     * @property PLAY_FAILED
     * @type {String}
     * @static
     */
    Sound.PLAY_FAILED = "playFailed";

    /**
     * 一个 Sound 默认支持格式列表，Sound 将根据这些格式去播放音频。插件会检查浏览器是否支持列表中的音频格式，
     * 所以当插件初始化之前改变该表格，将允许插件支持额外的音频格式。
     *
     * 注意，目前不支持 {{#crossLink "FlashPlugin"}}{{/crossLink}}。
     *
     * 文件格式更多信息，请查阅 http://en.wikipedia.org/wiki/Audio_file_format。
     * 文件格式列表，请查阅 //http://www.fileinfo.com/filetypes/audio。
     * 一个有用的扩展名格式列表，请查阅 http://html5doctor.com/html5-audio-the-state-of-play/。
     *
     * @property SUPPORTED_EXTENSIONS
     * @type {Array[String]}
     * @default ["mp3", "ogg", "mpeg", "wav", "m4a", "mp4", "aiff", "wma", "mid"]
     * @static
     */
    Sound.SUPPORTED_EXTENSIONS = ["mp3", "ogg", "mpeg", "wav", "m4a", "mp4", "aiff", "wma", "mid"];

    /**
     * 一些扩展类型使用另一种扩展类型的支持（其中一个是 codex）。这个允许映射响应的支持格式，这样插件可以准确地判断
     * 该扩展是否被支持。添加该列表，能帮助插件更加准确地判断扩展是否被支持。
     *
     * @property EXTENSION_MAP
     * @type {Object}
     * @static
     */
    Sound.EXTENSION_MAP = {
        m4a: "mp4"
    };

    /**
     * 利用正则表达解析文件 URI。这个支持简单的文件名，或全局的 URI 查询字符串。
     * 最终匹配是：protocol:$1 domain:$2 path:$3 file:$4 extension:$5 query string:$6。
     *
     * @property FILE_PATTERN
     * @type {RegExp}
     * @static
     * @private
     */
    Sound.FILE_PATTERN = /(\w+:\/{2})?((?:\w+\.){2}\w+)?(\/?[\S]+\/|\/)?([\w\-%\.]+)(?:\.)(\w+)?(\?\S+)?/i;

    /**
     * 定义当最大数量的音频实例已经在播放时，中断当前正在播放且具有相同源的音频实例时的默认行为。
     * 目前默认值是 <code>Sound.INTERRUPT_NONE</code>，但可以通过设置，将改变播放的行为。
     * 这个仅仅在调用 {{#crossLink "Sound/play"}}{{/crossLink}} 时没有传入 interrupt 值的时候生效。
     *
     * @property defaultInterruptBehavior
     * @type {String}
     * @default none
     * @static
     */
    Sound.defaultInterruptBehavior = Sound.INTERRUPT_NONE;

    /**
     * 在内部分配给每个 Sound 实例的 Id。
     *
     * @property lastID
     * @type {Number}
     * @static
     * @private
     */
    Sound.lastId = 0,

    /**
     * 当前活跃的插件。如果这个值为 null，那么没有一个插件能被初始化。
     * 如果没有插件被指定，Sound 会尝试去加载默认的插件：{{#crossLink "WebAudioPlugin"}}{{/crossLink}}，其次是 {{#crossLink "HTMLAudioPlugin"}}{{/crossLink}}。
     *
     * @property activePlugin
     * @type {Object}
     * @static
     */
    Sound.activePlugin = null;

    /**
     * 确定插件是否被注册。如果为 fasle，第一次调用 play() 的时候会初始化默认的插件 ({{#crossLink "WebAudioPlugin"}}{{/crossLink}}
     * 其次是 {{#crossLink "HTMLAudioPlugin"}}{{/crossLink}})。如果插件被注册了，但没有一个适用，那么音频在播放时会失败。
     *
     * @property pluginsRegistered
     * @type {Boolean}
     * @default false
     * @static
     * @private
     */
    Sound.pluginsRegistered = false;

    /**
     * 音量管理。使用 {{#crossLink "Sound/getVolume"}}{{/crossLink}} 和 {{#crossLink "Sound/setVolume"}}{{/crossLink}}
     * 去控制音频音量。
     *
     * @property masterVolume
     * @type {Number}
     * @default 1
     * @private
     */
    Sound.masterVolume = 1;

    /**
     * 静音管理。这个适用于所有 sound 实例。这个值可以通过 {{#crossLink "Sound/setMute"}}{{/crossLink}}
     * 和通过 {{#crossLink "Sound/getMute"}}{{/crossLink}} 获取。
     *
     * @property masterMute
     * @type {Boolean}
     * @default false
     * @private
     * @static
     */
    Sound.masterMute = false;

    /**
     * 一个包含所有当前播放实例的数组。这能帮助 Sound 去控制音量，静音，和通过静态接口去播放所有实例，
     * 比如 {{#crossLink "Sound/stop"}}{{/crossLink}} 和 {{#crossLink "Sound/setVolume"}}{{/crossLink}}。
     * 当一个实例播放完成，它则通过 {{#crossLink "Sound/finishedPlaying"}}{{/crossLink}} 方法移除。
     * 如果用户希望重新播放实例，则需要通过 {{#crossLink "Sound/beginPlaying"}}{{/crossLink}} 方法重新添加到列表。
     *
     * @property instances
     * @type {Array}
     * @private
     * @static
     */
    Sound.instances = [];

    /**
     * 一个哈希集合，通过对应的 id 寻找音频资源。
     *
     * @property idHash
     * @type {Object}
     * @private
     * @static
     */
    Sound.idHash = {};

    /**
     * 一个哈希集合通过解析插件资源，搜索预加载音频资源。包括资源 id，用户传入的数据。
     * 解析资源同时可以包含多个资源实例，id 和数据。
     *
     * @property preloadHash
     * @type {Object}
     * @private
     * @static
     */
    Sound.preloadHash = {};

    /**
     * 一个音频对象，该对象在音频播放失败时使用。允许开发者在不检查实例是否有效的前提下，在失败的实例上继续调用方法。
     * 一旦实例被初始化，将会占用内存空间。
     *
     * @property defaultSoundInstance
     * @type {Object}
     * @protected
     * @static
     */
    Sound.defaultSoundInstance = null;

    /**
     * 当所有的文件加载完成时触发该事件。该事件对所有加载完成的音频都有效，
     * 所有处理程序都必须根据 <code>event.src</code> 去处理特定的音频。
     * 
     * @event loadComplete
     * @param {Object} target 要调度事件的对象。
     * @param {String} type 事件类型。
     * @param {String} src 被加载文件的资源路径。注意这将返回分割符号的一部分。
     * @param {String} [id] 注册音频时，音频的 id。如果没有提供，则为 null。
     * @param {Number|Object} [data] 与该项目相关的任何其他数据。 如果没提供，则为 undefined。
     */

    /**
     * @method sendLoadComplete
     * @param {String} src 一个完成加载的文件资源路径。
     * @private
     * @static
     */
    Sound.sendLoadComplete = function(src) {
        if (!Sound.preloadHash[src]) {
            return;
        }
        for ( var i = 0, l = Sound.preloadHash[src].length; i < l; i++) {
            var item = Sound.preloadHash[src][i];
            var event = {
                target: this,
                type: "loadComplete",
                src: item.src,
                id: item.id,
                data: item.data
            };
            Sound.preloadHash[src][i] = true;
            Sound.dispatchEvent(event);
        }
    }
    
    /**
     * 获取预加载规则，允许 Sound 作为一个 <a href="http://preloadjs.com" target="_blank">PreloadJS</a> 的一个插件。
     * 任何所有匹配到类型的或扩展的加载调用，都会触发回调函数，并且返回 Sound 生成的对象。
     * 这有助于确定正确的路径，以及注册 Sound 实例。这个方法除了 PreloadJS 之外，不能被调用。
     *
     * @method getPreloadHandlers
     * @return {Object} An object containing:
     * <ul>
     *     <li>callback ：一个预加载回调，当文件被添加到 PreloadJS 时候触发，提供 Sound 一个修改加载参数的机制，选择正确的文件格式，注册音频，等等。</li>
     *     <li>types: 一个 Sound 支持的格式列表 (目前支持 "sound")。</li>
     *     <li>extensions 一个 Sound 支持的文件拓展列表 (看 Sound.SUPPORTED_EXTENSIONS)。</li>
     * </ul>
     * @static
     * @protected
     */
    Sound.getPreloadHandlers = function () {
        return {
            callback: Sound.proxy(Sound.initLoad, Sound),
            types: ["sound"],
            extensions: Sound.SUPPORTED_EXTENSIONS
        };
    }

    /**
     * 注册一个 Sound 插件。插件本质上用于播放音频。如果当用户播放音频的时候没有任何其他插件，默认的插件
     * ({{#crossLink "WebAudioPlugin"}}{{/crossLink}}，其次是 {{#crossLink "HTMLAudioPlugin"}}{{/crossLink}})，
     * 
     * <h4>例子</h4>
     *      createjs.FlashPlugin.BASE_PATH = "../src/SoundJS/";
     *      createjs.Sound.registerPlugin(createjs.FlashPlugin);
     *
     * 注册多个插件, 调用 {{#crossLink "Sound/registerPlugins"}}{{/crossLink}}.
     *
     * @method registerPlugin
     * @param {Object} plugin 要安装的插件类。
     * @return {Boolean} 插件是否被成功安装。
     * @static
     */
    Sound.registerPlugin = function(plugin) {
        Sound.pluginsRegistered = true;
        if (plugin == null) {
            return false;
        }
        // 注：每一个传进来的插件都是一个引用，但实例化成一个实例才去运用。
        if (plugin.isSupported()) {
            Sound.activePlugin = new plugin();
            //TODO: Check error on initialization
            return true;
        }
        return false;
    }

    /**
     * 根据优先级注册一个列表的 Sound 插件。要注册一个插件，调用 {{#crossLink "Sound/registerPlugin"}}{{/crossLink}}
     *
     * <h4>例子</h4>
     *      createjs.FlashPlugin.BASE_PATH = "../src/SoundJS/";
     *      createjs.Sound.registerPlugins([createjs.WebAudioPlugin, createjs.HTMLAudioPlugin, createjs.FlashPlugin]);
     *
     * @method registerPlugins
     * @param {Array} plugins 将要被安装的插件类数组。
     * @return {Boolean} 插件是否被成功安装。
     * @static
     */
    Sound.registerPlugins = function(plugins) {
        for ( var i = 0, l = plugins.length; i < l; i++) {
            var plugin = plugins[i];
            if (Sound.registerPlugin(plugin)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 初始化默认插件。当用户注册了所有插件之后，这个方法将被执行，并且让 Sound 能够不安装其他插件的前提下运行。
     * 目前只支持 {{#crossLink "WebAudioPlugin"}}{{/crossLink}}，其次是 {{#crossLink "HTMLAudioPlugin"}}{{/crossLink}}。
     * 
     * @method initializeDefaultPlugins
     * @returns {Boolean} 插件成功初始化 (true) 或 初始化失败(false)。如果浏览器不具备初始化任何一个可用插件的功能时，返回 false。
     * @private
     */
    Sound.initializeDefaultPlugins = function() {
        if (Sound.activePlugin != null) {
            return true;
        }
        if (Sound.pluginsRegistered) {
            return false;
        }
        var WebAudioPlugin = xc.module.require("xc.createjs.WebAudioPlugin");
        var HTMLAudioPlugin = xc.module.require("xc.createjs.HTMLAudioPlugin");
        if (Sound.registerPlugins([WebAudioPlugin, HTMLAudioPlugin])) {
            return true;
        }
        return false;
    }

    /**
     * 确定 Sound 是否已经被初始化，和插件是否可用。
     * 
     * @method isReady
     * @return {Boolean} Sound 是否已经初始化插件。
     * @static
     */
    Sound.isReady = function() {
        return (Sound.activePlugin != null);
    }

    /**
     * 获取插件功能，这有助于确定插件是否在当前环境下可用，或确定插件是否支持特定的功能。
     * Capabilities 包括：
     * <ul>
     *     <li><b>panning:</b> 插件是否可以从左到右调节声道。</li>
     *     <li><b>volume;</b> 插件是否可以控制音量。</li>
     *     <li><b>mp3:</b> 是否支持 mp3 格式。</li>
     *     <li><b>ogg:</b> 是否支持 ogg 格式。</li>
     *     <li><b>wav:</b> 是否支持 wav 格式。</li>
     *     <li><b>mpeg:</b> 是否支持 mpeg 格式。</li>
     *     <li><b>m4a:</b> 是否支持 m4a 格式。</li>
     *     <li><b>mp4:</b> 是否支持 mp4 格式。</li>
     *     <li><b>aiff:</b> 是否支持 aiff 格式。</li>
     *     <li><b>wma:</b> 是否支持 wma 格式。</li>
     *     <li><b>mid:</b> 是否支持 mid 格式。</li>
     *     <li><b>tracks:</b> 该插件可以同时播放音频的最大数。如果不知道最大限度，这个值为 -1。</li>
     *     
     * @method getCapabilities
     * @return {Object} 一个包含插件各项功能的对象。
     * @static
     */
    Sound.getCapabilities = function() {
        if (Sound.activePlugin == null) {
            return null;
        }
        return Sound.activePlugin.capabilities;
    }

    /**
     * 获取指定的插件功能。看 {{#crossLink "Sound/getCapabilities"}}{{/crossLink}} 获取更多关于插件功能信息。
     * 
     * @method getCapability
     * @param {String} key 希望获取的插件功能。
     * @return {Number|Boolean} 插件功能对应的值。
     * @static
     * @see getCapabilities
     */
    Sound.getCapability = function(key) {
        if (Sound.activePlugin == null) {
            return null;
        }
        return Sound.activePlugin.capabilities[key];
    }
    
    /**
     * 处理 <a href="http://preloadjs.com" target="_blank">PreloadJS</a> 的清单。该方法只适用于插件，不适用于直接调用。
     * @method initLoad
     * @param {String | Object} src 将要被加载的资源路径或对象。这里通常是一个字符串路径，但也可以是一个 HTMLAudioElement 或 音频播放对象。
     * @param {String} [type] 对象类型。可能是 "sound" 或 null。
     * @param {String} [id] 可选的用户指定的 id，用于播放音频。
     * @param {Number|String|Boolean|Object} [data] 与该项目相关的数据。Sound 将这些数据参数作为频道用于音频实例。然而，一个 “channels” 属性可被追加到 data 对象，
     * 如果该属性被作为其他信息使用。音频的 channels 属性默认值为 1。
     * @return {Boolean|Object} 一个包含修改完的值的对象，或当当前可用插件不能播放音频类型的时候，返回 false。
     * @protected
     * @static
     */
    Sound.initLoad = function (src, type, id, data) {
        var details = Sound.registerSound(src, id, data, false);
        if (details == null) {
            return false;
        }
        return details;
    }

    /**
    *
    * 注册一个将要在 Sound 中播放的音频。当使用 <a href="http://preloadjs.com" target="_blank">PreloadJS</a> 的时候，这个方法将自动执行。
    * 然而，该方法支持手动注册单一音频。
    * 这里先建议注册所有将要被播放的音频。为了做好充分的准备和预加载。当需要用到音频的时候，Sound 类内部会进行预加载。
    *
    * <h4>Example</h4>
    *      createjs.Sound.registerSound("myAudioPath/mySound.mp3|myAudioPath/mySound.ogg", "myID", 3);
    *
    * @method registerSound
    * @param {String | Object} src 一个资源路径，或一个拥有 src 属性的对象。
    * @param {String} [id] 一个用户指定的 id 标识晚点将要播放的音频。
    * @param {Number | Object} [data] 与该项目相关的数据。Sound 将这些数据参数作为频道用于音频实例。然而，一个 “channels” 属性可被追加到 data 对象，
    * 如果该属性被作为其他信息使用。SoundChannel 属性将会给予 插件设置默认值。
    * @param {Boolean} [preload=true] 如果音频应该再内部预加载，这样音频可以在无需任何 preloader 的前提下播放。
    * @return {Object} 一个包含所有修改后参数的对象，该对象用于地定义一段音频。如果资源路径不能被解析，返回 true。
    * @static
    */
    Sound.registerSound = function(src, id, data) {
        if (!Sound.initializeDefaultPlugins()) {
            return false;
        }
        if (src instanceof Object) {
            src = src.src;
            id = src.id;
            data = src.data;
        }
        var details = Sound.parsePath(src, "sound", id, data);
        if (details == null) {
            return false;
        }
        if (id != null) {
            Sound.idHash[id] = details.src;
        }
        var numChannels = null; // 该值为 null 时，SoundChannel 将会设置成内部的默认最大值。
        if (data != null) {
            if (!isNaN(data.channels)) {
                numChannels = parseInt(data.channels);
            } else if (!isNaN(data)) {
                numChannels = parseInt(data);
            }
        }
        var loader = Sound.activePlugin.register(details.src, numChannels); // 注：只有 HTMLAudio 使用 numChannels
        if (loader != null) {
            if (loader.numChannels != null) {
                numChannels = loader.numChannels;
            } // 目前只有 HTMLAudio 返回这个。
            SoundChannel.create(details.src, numChannels);
            // 返回用户的音频实例数量。这个也会在加载事件里面返回。
            if (data == null || !isNaN(data)) {
                data = details.data = numChannels || SoundChannel.maxPerChannel();
            } else {
                data.channels = details.data.channels = numChannels || SoundChannel.maxPerChannel();
            }
            // 如果加载器返回 tag，则返回 preloading 代替它。
            if (loader.tag != null) {
                details.tag = loader.tag;
            } else if (loader.src) {
                details.src = loader.src;
            }
            // 如果加载器返回完成事件处理程序，则把它传到 preloder。
            if (loader.completeHandler != null) {
                details.completeHandler = loader.completeHandler;
            }
            details.type = loader.type;
        }
        if (!Sound.preloadHash[details.src]) {
            Sound.preloadHash[details.src] = [];
        } // 这样做是为了能够同时保存多个所需的 id 和数据
        Sound.preloadHash[details.src].push({
            src: src,
            id: id,
            data: data
        }); // 保存这个数据，所以可返回 onLoadComplete 处理方法。
        if (Sound.preloadHash[details.src].length == 1) {
            Sound.activePlugin.preload(details.src, loader)
        }
        return details;
    }

    /**
     * 注册一个清单的音频用于在 Sound 中播放。这里先建议注册所有将要被播放的音频。为了做好充分的准备和预加载。当需要用到音频的时候，Sound 类内部会进行预加载。
     *
     * <h4>例子</h4>
     *      var manifest = [
     *          {src:"assetPath/asset0.mp3|assetPath/asset0.ogg", id:"example"},
     *          {src:"assetPath/asset1.mp3|assetPath/asset1.ogg", id:"1", data:6},
     *          {src:"assetPath/asset2.mp3", id:"works"}
     *      ];
     *      createjs.Sound.addEventListener("loadComplete", doneLoading);
     *      createjs.Sound.registerManifest(manifest);
     *
     * @method registerManifest
     * @param {Array} manifest 一个将要加载的对象数组。对象要根据 {{#crossLink "Sound/registerSound"}}{{/crossLink}} 的格式要求: 
     * <code>{src:srcURI, id:ID, data:Data, preload:UseInternalPreloader}</code>
     * "id", "data", 和 "preload" 将是可选项。
     * @return {Object} 一个包含修改后参数的对象数组，用于定义每一个音频。当资源路径不能被解析时，将会返回 false。
     * @static
     */
    Sound.registerManifest = function(manifest) {
        var returnValues = [];
        for ( var i = 0, l = manifest.length; i < l; i++) {
            returnValues[i] = Sound.registerSound(manifest[i].src, manifest[i].id, manifest[i].data);
        }
        return returnValues;
    }

    /**
     * 检查资源是否内部预加载完成。当音频播放时，确保当音频未加载完成时不会启动新的预加载行为。
     * 
     * @method loadComplete 
     * @param {String} src 将要被加载的资源路径或 id。
     * @return {Boolean} 如果资源已经加载，返回 true。
     */
    Sound.loadComplete = function(src) {
        var details = Sound.parsePath(src, "sound");
        if (details) {
            src = Sound.getSrcById(details.src);
        } else {
            src = Sound.getSrcById(src);
        }
        return (Sound.preloadHash[src][0] == true); // src only loads once, so if it's true for the first it's true for all
    }

    /**
     * 解析来自清单项的音频的路径。清单项目支持单个文件的路径，使用 <code>Sound.DELIMITER</code> 支持多个路径，
     * <code>Sound.DELIMITER</code> 默认值为 "|"。当前浏览器支持的第一个路径将被使用。
     * 
     * @method parsePath
     * @param {String} value 音频的资源路径。
     * @param {String} [type] 路径类型。这个通常为 "sound" 或 null.
     * @param {String} [id] 用户指定的 sound-id。这个可能是 null，在这种情况下 src 属性将被使用。
     * @param {Number | String | Boolean | Object} [data] 任意追加到音频的数据，通常是 SoundChannel 的数量。这个方法目前还没有用到这些数据属性。
     * @return {Object} 一个格式化后的对象，可以用 <code>Sound.activePlugin</code> 注册和用于
     * <a href="http://preloadjs.com" target="_blank">PreloadJS</a>。
     * @protected
     */
    Sound.parsePath = function(value, type, id, data) {
        if (typeof (value) != "string") {
            value = value.toString();
        }
        var sounds = value.split(Sound.DELIMITER);
        var ret = {
            type: type || "sound",
            id: id,
            data: data
        };
        var c = Sound.getCapabilities();
        for ( var i = 0, l = sounds.length; i < l; i++) {
            var sound = sounds[i];
            var match = sound.match(Sound.FILE_PATTERN);
            if (match == null) {
                return false;
            }
            var name = match[4];
            var ext = match[5];
            if (c[ext] && Sound.SUPPORTED_EXTENSIONS.indexOf(ext) > -1) {
                ret.name = name;
                ret.src = sound;
                ret.extension = ext;
                return ret;
            }
        }
        return null;
    }

    /**
     * 播放音频以及获取一个可控制的 {{#crossLink "SoundInstance"}}{{/crossLink}}。如果音频播放失败，一个 Sound 实例
     * 依然会返回，同时伴随一个播放状态 <code>Sound.PLAY_FAILED</code>。
     * 请注意，即使音频播放失败，依旧可以调用 sound 实例的 {{#crossLink "SoundInstance/play"}}{{/crossLink}} 方法，
     * 因为失败的原因可能是缺乏可用的频道。
     * 如果没有可用的插件，<code>Sound.defaultSoundInstance</code> 将被返回，他不会播放任何音频，但不会产生任何错误。
     *
     * <h4>例子</h4>
     *      createjs.Sound.registerSound("myAudioPath/mySound.mp3", "myID", 3);
     *      // 等待，直到加载完成
     *      createjs.Sound.play("myID");
     *      // 可以像这样调用：
     *      var myInstance = createjs.Sound.play("myAudioPath/mySound.mp3", createjs.Sound.INTERRUPT_ANY, 0, 0, -1, 1, 0);
     *
     * @method play
     * @param {String} src 音频的资源路径或 id。
     * @param {String} [interrupt="none"] 如何中断其他实例。取值要根据 Sound 类的常数 <code>INTERRUPT_TYPE</code>。
     * @param {Number} [delay=0] 设置延迟时间，以毫秒为单位。
     * @param {Number} [offset=0] 音频开始播放的位置，以毫秒为单位。
     * @param {Number} [loop=0] 设置音频循环播放次数。默认值为 0 (不循环), 而 -1 可以用于无线循环。
     * @param {Number} [volume=1] 音频的音量, 介乎 0 到 1 之间。 注意，主音量使用于单位音量。
     * @param {Number} [pan=0] 音频的左右声道（如果支持），介乎 -1 （左） 和 1 (右)。
     * @return {SoundInstance} 一个 {{#crossLink "SoundInstance"}}{{/crossLink}} 创建后用于控制的。
     * @static
     */
    Sound.play = function(src, interrupt, delay, offset, loop, volume, pan) {
        var instance = Sound.createInstance(src);
        var ok = Sound.playInstance(instance, interrupt, delay, offset, loop, volume, pan);
        if (!ok) {
            instance.playFailed();
        }
        return instance;
    }

    /**
     * 如果 src 对应资源不被支持，则一个默认的 SoundInstance 将被返回，这样调用将是安全的，只是不做任何事而已。
     * 
     * @method createInstance
     * @param {String} src 音频的 src 属性。
     * @return {SoundInstance} 一个 {{#crossLink "SoundInstance"}}{{/crossLink}} 创建后用于控制的。不支持扩展将返回一个默认的 SoundInstance。
     */
    Sound.createInstance = function(src) {
        // TODO this function appears to be causing a memory leak, and needs spike tested.
        // 一个新的音频实例
        if (!Sound.initializeDefaultPlugins()) {
            return Sound.defaultSoundInstance;
        }
        var details = Sound.parsePath(src, "sound");
        if (details) {
            src = Sound.getSrcById(details.src);
        } else {
            src = Sound.getSrcById(src);
        }
        var dot = src.lastIndexOf(".");
        
        var ext = src.slice(dot + 1); // 音频拥有 "path+name . ext" 这样的格式。
        if (dot != -1 && Sound.SUPPORTED_EXTENSIONS.indexOf(ext) > -1) { // 如果该格式被支持，则意味着该插件被支持。
            // 确保有频道
            SoundChannel.create(src);
            var instance = Sound.activePlugin.create(src);
        } else {
            var instance = Sound.defaultSoundInstance; // 资源不被支持，返回一个假实例。
        }
        instance.uniqueId = Sound.lastId++;
        return instance;
    }

    /**
     * 设置音频的主音量。主音量相当于所有单位音量的积。
     * 要设置音频的单位音量，通过 SoundInstance 的 {{#crossLink "SoundInstance/setVolume"}}{{/crossLink}} 方法代替。
     * 
     * @method setVolume
     * @param {Number} value 主音量的值，可接受区间为 0 - 1。
     * @static
     */
    Sound.setVolume = function(value) {
        if (Number(value) == null) {
            return false;
        }
        value = Math.max(0, Math.min(1, value));
        Sound.masterVolume = value;
        if (!this.activePlugin || !this.activePlugin.setVolume || !this.activePlugin.setVolume(value)) {
            var instances = this.instances;
            for ( var i = 0, l = instances.length; i < l; i++) {
                instances[i].setMasterVolume(value);
            }
        }
    }

    /**
     * 获取音频的主音量。主音量相当于所有单位音量的积。
     * 要获取音频的单位音量，通过 SoundInstance 的 {{#crossLink "SoundInstance/getVolume"}}{{/crossLink}} 方法代替。
     * 
     * @method getVolume
     * @return {Number} 主音量的值，可接受区间为 0 - 1。
     * @static
     */
    Sound.getVolume = function(value) {
        return Sound.masterVolume;
    }

    /**
     * 对于所有音频 静音/取消静音。注意静音即音量为 0 。这个全局 mute 属性值保持分开，且将被覆盖，但不能改变单个实例的
     * mute 属性。要使单个实例静音，使用 SoundInstance 的 {{#crossLink "SoundInstance/setMute"}}{{/crossLink}} 代替。
     * @method setMute
     * @param {Boolean} value 音频是否需要被静音。
     * @return {Boolean} 是否设置成功。
     * @static
     */
    Sound.setMute = function(value) {
        if (value == null || value == undefined) {
            return false
        }
        this.masterMute = value;
        if (!this.activePlugin || !this.activePlugin.setMute || !this.activePlugin.setMute(value)) {
            var instances = this.instances;
            for ( var i = 0, l = instances.length; i < l; i++) {
                instances[i].setMasterMute(value);
            }
        }
        return true;
    }

    /**
     * 返回全局 mute 值。要获得单个实例的 mute 值，用 SoundInstance 的 {{#crossLink "SoundInstance/getMute"}}{{/crossLink}} 代替。
     * @method getMute
     * @return {Boolean} Sound 的 mute 属性。
     * @static
     */
    Sound.getMute = function() {
        return this.masterMute;
    }

    /**
     * 停止所有音频（全局停止）。停止音频相当于重置，并不是暂停。要重新启动停止了的音频，调用 {{#crossLink "SoundInstance.play"}}{{/crossLink}}
     * 
     * @method stop
     * @static
     */
    Sound.stop = function() {
        var instances = this.instances;
        for ( var i = instances.length; i > 0; i--) {
            instances[i - 1].stop(); // NOTE stop removes instance from this.instances
        }
    }

    /**
     * 播放一个实例。这个方法将被静态 API 调用，也被插件调用。这使得核心类能控制延时。
     * 
     * @method playInstance
     * @param {SoundInstance} instance 开始播放的 {{#crossLink "SoundInstance"}}{{/crossLink}}
     * @param {String} [interrupt=none] 如何中断其他具有相同源的实例。默认是 <code>Sound.INTERRUPT_NONE</code>。所有中断的取值要根据 Sound 类的常数 <code>INTERRUPT_TYPE</code>。
     * @param {Number} [delay=0] 设置延迟时间，以毫秒为单位。
     * @param {Number} [offset=instance.offset] 音频开始播放的位置，以毫秒为单位。默认为实例的当前值。
     * @param {Number} [loop=0] 设置音频循环播放次数。默认值为 0 (不循环), 而 -1 可以用于无线循环。
     * @param {Number} [volume] 音频的音量, 介乎 0 到 1 之间。默认为当前实例音量。
     * @param {Number} [pan] 音频的左右声道（如果支持）。默认为实例当前值。
     * @return {Boolean} 如果音频可以开始播放，返回 true。音频马上失败则返回 false。Sound 如果有 delay 属性将 返回 true，但依然不能播放。
     * @protected
     * @static
     */
    Sound.playInstance = function(instance, interrupt, delay, offset, loop, volume, pan) {
        interrupt = interrupt || Sound.defaultInterruptBehavior;
        if (delay == null) {
            delay = 0;
        }
        if (offset == null) {
            offset = instance.getPosition();
        }
        if (loop == null) {
            loop = 0;
        }
        if (volume == null) {
            volume = instance.getVolume();
        }
        if (pan == null) {
            pan = instance.getPan();
        }
        if (delay == 0) {
            var ok = Sound.beginPlaying(instance, interrupt, offset, loop, volume, pan);
            if (!ok) {
                return false;
            }
        } else {
            // 注：如果不使用 setTimeout，将不能传参到代理函数中（IE 下），所以要包装一下方法再调用。 
            var delayTimeoutId = setTimeout(function() {
                Sound.beginPlaying(instance, interrupt, offset, loop, volume, pan);
            }, delay);
            instance.delayTimeoutId = delayTimeoutId;
        }
        this.instances.push(instance);
        return true;
    }

    /**
     * 开始播放。这个会马上执行或者过了 {{#crossLink "Sound/playInstance"}}{{/crossLink}} 的 delay 时间执行。
     * 
     * @method beginPlaying
     * @param {SoundInstance} instance 一个 {{#crossLink "SoundInstance"}}{{/crossLink}} 开始播放。
     * @param {String} [interrupt=none] 指出如何中断和当前实例拥有相同源的实例。默认值是 <code>Sound.INTERRUPT_NONE</code>。Interrupts 的取值要根据 Sound 的 <code>INTERRUPT_TYPE</code> 常数。
     * @param {Number} [offset] 指出音频在什么位置开始播放，以毫秒为单位。默认值为当前位置。
     * @param {Number} [loop=0] 设置音频循环播放次数。默认值为 0 (不循环), 而 -1 可以用于无线循环。
     * @param {Number} [volume] 音频的音量, 介乎 0 到 1 之间。默认为当前实例音量。
     * @param {Number} [pan=instance.pan] 声道选择，取值介乎 -1 到 1。默认为当前值。
     * @return {Boolean} 如果音频可以开始播放。如果没有可用的频道，或者实例播放失败，就会返回 false。
     * @protected
     * @static
     */
    Sound.beginPlaying = function(instance, interrupt, offset, loop, volume, pan) {
        if (!SoundChannel.add(instance, interrupt)) {
            return false;
        }
        var result = instance.beginPlaying(offset, loop, volume, pan);
        if (!result) {
            //LM: Should we remove this from the SoundChannel (see finishedPlaying)
            var index = this.instances.indexOf(instance);
            if (index > -1) {
                this.instances.splice(index, 1);
            }
            return false;
        }
        return true;
    }

    /**
     * 通过传入的 id 获取注册了的音频资源。如果没有 id 就返回传入的 value 值。
     * 
     * @method getSrcById
     * @param {String} value 注册了的音频 id
     * @return {String} 音频资源。 当根据此 id 找不到资源时，返回 null。 
     * @protected
     * @static
     */
    Sound.getSrcById = function(value) {
        if (Sound.idHash == null || Sound.idHash[value] == null) {
            return value;
        }
        return Sound.idHash[value];
    }

    /**
     * 一个音频完成播放，完成中断，播放失败，或被停止。这个方法会在 Sound 管理器中移除实例。
     * 当音频重新播放的时候重新添加。注意这个方法是由实例本身调用的。
     * 
     * @method playFinished
     * @param {SoundInstance} instance 完成播放的实例。
     * @protected
     * @static
     */
    Sound.playFinished = function(instance) {
        SoundChannel.remove(instance);
        var index = this.instances.indexOf(instance);
        if (index > -1) {
            this.instances.splice(index, 1);
        }
    }

    /**
     * 一个关于 Sound 方法的代理。默认情况下，Javascript 的方法并不维持作用域，所以传递一个方法作为回调的作用域
     * 将是调用者的作用域。用代理确保方法在合理的作用域内调用。
     * 注意可以传入的 arguments 参数作为将要调用的方法的参数。 
     *
     * <h4>例子<h4>
     *     myObject.myCallback = createjs.proxy(myHandler, this, arg1, arg2);
     *
     * @method proxy
     * @param {Function} method 要调用的方法。
     * @param {Object} scope 方法要调用的作用域。
     * @param {mixed} [arg] 将要调用的方法的参数。
     * @protected
     * @static
     */
    Sound.proxy = function(method, scope) {
        var aArgs = Array.prototype.slice.call(arguments, 2);
        return function() {
            return method.apply(scope, Array.prototype.slice.call(arguments, 0).concat(aArgs));
        };
    }

    /**
     * 一个额外的模块，以确定当前浏览器，版本，操作系统，和其他环境变量。这不是公开说明的。
     * #class BrowserDetect
     * @param {Boolean} isFirefox 如果是 firefox 返回 true。
     * @param {Boolean} isOpera 如果是 opera 返回 true。
     * @param {Boolean} isChrome 如果是 chrome 返回 true。注意 android 的 chrome 会返回 true，但不同的浏览器有不同的能力。
     * @param {Boolean} isIOS 如果是 iOS 设备 (iPad, iPhone, and iPad) 的 safari，返回 true。
     * @param {Boolean} isAndroid 如果是 Aandroid 的 浏览器，返回 true。
     * @param {Boolean} isBlackberry 如果是 Blackberry 的浏览器。
     * @constructor
     * @static
     */
    function BrowserDetect() {}

    BrowserDetect.init = function () {
        var agent = navigator.userAgent;
        BrowserDetect.isFirefox = (agent.indexOf("Firefox") > -1);
        BrowserDetect.isOpera = (window.opera != null);
        BrowserDetect.isChrome = (agent.indexOf("Chrome") > -1);  // NOTE that Chrome on Android returns true but is a completely different browser with different abilities
        BrowserDetect.isIOS = agent.indexOf("iPod") > -1 || agent.indexOf("iPhone") > -1 || agent.indexOf("iPad") > -1;
        BrowserDetect.isAndroid = (agent.indexOf("Android") > -1);
        BrowserDetect.isBlackberry = (agent.indexOf("Blackberry") > -1);
    }

    BrowserDetect.init();

    Sound.BrowserDetect = BrowserDetect;
    
    // 不往 SoundChannel 添加命名空间。

    // 这是一个虚拟的音频实例，用于让 Sound 返回，这样能使开发者不需要每次都检查 null 值。
    function SoundInstance() {
        this.isDefault = true;
        this.addEventListener = this.removeEventListener = this.removeAllEventListener = 
            this.dispatchEvent = this.hasEventListener = this._listeners = this.interrupt = 
                this.playFailed = this.pause = this.resume = this.play = this.beginPlaying = 
                    this.cleanUp = this.stop = this.setMasterVolume = this.setVolume = this.mute = 
                        this.setMute = this.getMute = this.setPan = this.getPosition = 
                            this.setPosition = function () {
            return false;
        };
        this.getVolume = this.getPan = this.getDuration = function () {
            return 0;
        }
        this.playState = Sound.PLAY_FAILED;
        this.toString = function () {
            return "[Sound Default Sound Instance]";
        }
    }
    
    Sound.defaultSoundInstance = new SoundInstance();

    /**
     * 一个内部类，用于管理每一个可用的 {{#crossLink "SoundInstance"}}{{/crossLink}} 实例。
     * 该方法仅仅能被 {{#crossLink "Sound"}}{{/crossLink}} 内部调用。
     * 
     * 即使将来浏览器可能有更好的支持，sounds 的数量总是被认为有限的，目的是为了防止单一声音的过度饱和，以及确保在硬件
     * 容量可支配范围内。
     *
     * 当音频正在播放的时候，该方法确保总有一个可用的实例，或恰当地中断一个正在播放的音频。
     * @class SoundChannel
     * @param {String} src 实例的资源路径。
     * @param {Number} [max=1] 允许实例的数量。
     * @constructor
     * @protected
     */
    var SoundChannel = xc.class.create({
        initialize: function(src, max) {
            this.src = src;
            this.max = max || this.maxDefault;
            if (this.max == -1) {
                this.max == this.maxDefault;
            }
            this.instances = [];
        },

        /**
         * 频道资源
         *
         * @property src
         * @type {String}
         */
        src: null,

        /**
         * 频道可拥有的最大实例数。 -1 表示没限制。
         *
         * @property max
         * @type {Number}
         */
        max: null,

        /**
         * 如果没传入最大值，默认为该最大值。通常传入 -1 的时候用到该值。
         *
         * @property maxDefault
         * @type {Number}
         * @default 100
         */
        maxDefault: 100,

        /**
         * 当前活跃实例数。
         *
         * @property length
         * @type {Number}
         */
        length: 0,

        /**
         * 初始化频道。
         * @method init
         * @param {String} src 频道的资源路径。
         * @param {Number} max 频道的最大实例数。
         * @protected
         */

        /**
         * 根据索引获取实例。
         * 
         * @method get
         * @param {Number} index 索引号。
         * @return {SoundInstance} 指定的实例。
         */
        get: function(index) {
            return this.instances[index];
        },

        /**
         * 添加一个新实例到频道。
         * 
         * @method add
         * @param {SoundInstance} instance 要添加的实例。
         * @return {Boolean} 如果添加成功，返回 true，如果频道满了，返回 false。
         */
        add: function(instance, interrupt) {
            if (!this.getSlot(interrupt, instance)) {
                return false;
            }
            this.instances.push(instance);
            this.length++;
            return true;
        },

        /**
         * 在频道里移除实例，无论是播放完成还是被中断。
         * 
         * @method remove
         * @param {SoundInstance} instance 将要移除的实例。
         * @return {Boolean} 如果成功移除，则返回 true。如果在频道不能找到对应实例，返回 false。
         */
        remove: function(instance) {
            var index = this.instances.indexOf(instance);
            if (index == -1) {
                return false;
            }
            this.instances.splice(index, 1);
            this.length--;
            return true;
        },

        /**
         * 如果插槽可用，则根据中断值获取可用的插槽。
         * 
         * @method getSlot
         * @param {String} interrupt 要用到的中断值。
         * @param {SoundInstance} instance 音频实例。
         * @return {Boolean} 确保是否有一个可用的 slot。
         */
        getSlot: function(interrupt, instance) {
            var target, replacement;
            for ( var i = 0, l = this.max; i < l; i++) {
                target = this.get(i);
                // 可用空间
                if (target == null) {
                    return true;
                } else if (interrupt == Sound.INTERRUPT_NONE && target.playState != Sound.PLAY_FINISHED) {
                    continue;
                }
                // 第一个候选替补
                if (i == 0) {
                    replacement = target;
                    continue;
                }
                // Audio 完成了或没播放
                if (target.playState == Sound.PLAY_FINISHED || target == Sound.PLAY_INTERRUPTED || target == Sound.PLAY_FAILED) {
                    replacement = target;
                    // Audio is a better candidate than the current target, according to playhead
                } else if ((interrupt == Sound.INTERRUPT_EARLY && target.getPosition() < replacement.getPosition())
                || (interrupt == Sound.INTERRUPT_LATE && target.getPosition() > replacement.getPosition())) {
                    replacement = target;
                }
            }
            if (replacement != null) {
                replacement.interrupt();
                this.remove(replacement);
                return true;
            }
            return false;
        },

        toString: function() {
            return "[Sound SoundChannel]";
        }
    });

    /**
     * 一个关于频道实例并以资源路径为索引的哈希集合。
     * 
     * @property channels
     * @type {Object}
     * @static
     */
    SoundChannel.channels = {};

    /**
     * 创建一个 SoundChannel 实例。注意如果 SoundChannel 已经存在，则该方法会执行失败。
     * 
     * @method create
     * @param {String} src 频道的资源路径
     * @param {Number} max 可以保持频道的最大数量。 默认值是 {{#crossLink "SoundChannel.maxDefault"}}{{/crossLink}}.
     * @return {Boolean} 如果频道成功创建，返回 true。
     * @static
     */
    SoundChannel.create = function(src, max) {
        var channel = SoundChannel.get(src);
        if (channel == null) {
            SoundChannel.channels[src] = new SoundChannel(src, max);
            return true;
        }
        return false;
    }

    /**
     * 往 SoundChannel 添加一个音频实例。
     * 
     * @method add
     * @param {SoundInstance} instance 要添加到频道的实例。
     * @param {String} interrupt 要使用的中断值。 请看 {{#crossLink "Sound/play"}}{{/crossLink}} 获取更多中断值信息。
     * @return {Boolean} 方法执行成功，返回 true。如果频道满了，返回 false。
     * @static
     */
    SoundChannel.add = function(instance, interrupt) {
        var channel = SoundChannel.get(instance.src);
        if (channel == null) {
            return false;
        }
        return channel.add(instance, interrupt);
    }

    /**
     * 从频道里移除一个实例。
     * 
     * @method remove
     * @param {SoundInstance} instance 要移除的实例。
     * @return 如果移除成功返回 true，如果没有频道，返回 false。
     * @static
     */
    SoundChannel.remove = function(instance) {
        var channel = SoundChannel.get(instance.src);
        if (channel == null) {
            return false;
        }
        channel.remove(instance);
        return true;
    }

    /**
     * 获取在一个频道里面可以支配的最大音频数。
     * 
     * @method maxPerChannel
     * @return {Number} 可拥有的最大频道数。
     */
    SoundChannel.maxPerChannel = function() {
        return SoundChannel.maxDefault;
    }

    /**
     * 通过资源路径获取频道实例。
     * 
     * @method get
     * @param {String} src 用于寻找频道的资源路径。
     * @static
     */
    SoundChannel.get = function(src) {
        return SoundChannel.channels[src];
    }

    EventDispatcher.initialize(Sound);

    return Sound;

});