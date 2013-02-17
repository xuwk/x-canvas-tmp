xc.module.define("xc.createjs.Sound", function(exports) {

  var EventDispatcher = xc.module.require("xc.createjs.EventDispatcher");

  /**
   * The Sound class is the public API for creating sounds, controlling the overall sound levels, and managing plugins.
   * All Sound APIs on this class are static.
   *
   * <b>Registering</b><br/>
   * Before you can play a sound, it <b>must</b> be registered. You can do this with {{#crossLink "Sound/registerSound"}}{{/crossLink}},
   * or register multiple sounds using {{#crossLink "Sound/registerManifest"}}{{/crossLink}}. If you don't register
   * them immediately, they will be automatically registered if you try and play a sound using {{#crossLink "Sound/play"}}{{/crossLink}},
   * or if you create a stopped sound using {{#crossLink "Sound/createInstance"}}{{/crossLink}}.
   *
   * <b>Playback</b><br/>
   * To play a sound once its been registered, use the {{#crossLink "Sound/play"}}{{/crossLink}} method.
   * This method returns a {{#crossLink "SoundInstance"}}{{/crossLink}} which can be paused, resumed, muted, etc.
   * Please see the {{#crossLink "SoundInstance"}}{{/crossLink}} documentation for more on the instance control APIs.
   *
   * <b>Plugins</b><br/>
   * By default, the {{#crossLink "WebAudioPlugin"}}{{/crossLink}} or the {{#crossLink "HTMLAudioPlugin"}}{{/crossLink}}
   * are used (when available), although developers can change plugin priority or add new plugins.
   * Please see the {{#crossLink "Sound"}}{{/crossLink}} API methods for more on the playback and plugin APIs.
   * To install plugins, or specify a different plugin order, see {{#crossLink "Sound/installPlugins"}}{{/crossLink}}.
   *
   * <h4>Example</h4>
   *     Sound.registerPlugins([WebAudioPlugin, HTMLAudioPlugin]);
   *     Sound.addEventListener("loadComplete", Sound.proxy(this.loadHandler, (this)));
   *     Sound.registerSound("path/to/mySound.mp3|path/to/mySound.ogg", "sound");
   *     function loadHandler(event) {
   *         // This is fired for each sound that is registered.
   *         var instance = Sound.play("sound");  // play using id. Could also use source.
   *         instance.addEventListener("playComplete", Sound.proxy(this.handleComplete, this));
   *         instance.setVolume(0.5);
	 *     }
   *
   * The maximum number of concurrently playing instances of the same sound can be specified in the "data" argument
   * of {{#crossLink "Sound/registerSound"}}{{/crossLink}}.
   *
   *      Sound.registerSound("sound.mp3", "soundId", 4);
   *
   * <h4>Known Browser and OS issues</h4>
   * <b>IE 9 html audio quirk</b><br/>
   * Note in IE 9 there is a delay in applying volume changes to tags that occurs once playback is started. So if you have
   * muted all sounds, they will all play during this delay until the mute applies internally. This happens regardless of
   * when or how you apply the volume change, as the tag seems to need to play to apply it.
   *
   * <b>iOS 6 limitations</b><br/>
   * <ul>
   *  <li>Sound is initially muted and will only unmute through play being called inside a user initiated event (touch).</li>
   *  <li>Despite suggestions to the opposite, we have control over audio volume through our gain nodes.</li>
   * </ul>
   * More details: http://stackoverflow.com/questions/12517000/no-sound-on-ios-6-web-audio-api
   *
   * <b>Android limitations</b><br/>
   * <ul>
   *  <li>We have no control over audio volume. Only the user can set volume on their device.</li>
   *  <li>We can only play audio inside a user event (touch).  This currently means you cannot loop sound.</li>
   * </ul>
   *
   * @class Sound
   * @static
   */
  var Sound = function() {
    throw "Sound cannot be instantiated";
  }

  /**
   * The character (or characters) that are used to split multiple paths from an audio source.
   *
   * @property DELIMITER
   * @type {String}
   * @static
   */
  Sound.DELIMITER = "|";

  /**
   * The interrupt value to interrupt the earliest currently playing instance with the same source that progressed the
   * least distance in the audio track, if the maximum number of instances of the sound are already playing.
   *
   * @property INTERRUPT_EARLY
   * @type {String}
   * @static
   */
  Sound.INTERRUPT_EARLY = "early";

  /**
   * The interrupt value to interrupt the currently playing instance with the same source that progressed the most
   * distance in the audio track, if the maximum number of instances of the sound are already playing.
   *
   * @property INTERRUPT_LATE
   * @type {String}
   * @static
   */
  Sound.INTERRUPT_LATE = "late";

  /**
   * The interrupt value to interrupt no currently playing instances with the same source, if the maximum number of
   * instances of the sound are already playing.
   *
   * @property INTERRUPT_NONE
   * @type {String}
   * @static
   */
  Sound.INTERRUPT_NONE = "none";

  /**
   * Defines the playState of an instance that is currently playing or paused.
   *
   * @property PLAY_SUCCEEDED
   * @type {String}
   * @static
   */
  Sound.PLAY_SUCCEEDED = "playSucceeded";

  /**
   * Defines the playState of an instance that was interrupted by another instance.
   *
   * @property PLAY_INTERRUPTED
   * @type {String}
   * @static
   */
  Sound.PLAY_INTERRUPTED = "playInterrupted";

  /**
   * Defines the playState of an instance that completed playback.
   *
   * @property PLAY_FINISHED
   * @type {String}
   * @static
   */
  Sound.PLAY_FINISHED = "playFinished";

  /**
   * Defines the playState of an instance that failed to play. This is usually caused by a lack of available channels
   * when the interrupt mode was "INTERRUPT_NONE", the playback stalled, or the sound could not be found.
   *
   * @property PLAY_FAILED
   * @type {String}
   * @static
   */
  Sound.PLAY_FAILED = "playFailed";

  /**
   * A list of the default supported extensions that Sound will <i>try</i> to play. Plugins will check if the browser
   * can play these types, so modifying this list before a plugin is initialized will allow the plugins to try and
   * support additional media types.
   *
   * More details on file formats can be found at http://en.wikipedia.org/wiki/Audio_file_format. A very detailed
   * list of file formats can be found //http://www.fileinfo.com/filetypes/audio. A useful list of extensions for a
   * format can be found at http://html5doctor.com/html5-audio-the-state-of-play/
   *
   * @property SUPPORTED_EXTENSIONS
   * @type {Array[String]}
   * @default ["mp3", "ogg", "mpeg", "wav", "m4a", "mp4", "aiff", "wma", "mid"]
   * @static
   */
  Sound.SUPPORTED_EXTENSIONS = ["mp3", "ogg", "mpeg", "wav", "m4a", "mp4", "aiff", "wma", "mid"];

  /**
   * Some extensions use another type of extension support to play (one of them is a codex).  This allows you to map
   * that support so plugins can accurately determine if an extension is supported.  Adding to this list can help
   * plugins determine more accurately if an extension is supported.
   *
   * @property EXTENSION_MAP
   * @type {Object}
   * @static
   */
  Sound.EXTENSION_MAP = {
    m4a: "mp4"
  };

  /**
   * The RegExp pattern to use to parse file URIs. This supports simple file names, as well as full domain URIs with
   * query strings. The resulting match is: protocol:$1 domain:$2 path:$3 file:$4 extension:$5 query string:$6.
   *
   * @property FILE_PATTERN
   * @type {RegExp}
   * @static
   * @private
   */
  Sound.FILE_PATTERN = /(\w+:\/{2})?((?:\w+\.){2}\w+)?(\/?[\S]+\/|\/)?([\w\-%\.]+)(?:\.)(\w+)?(\?\S+)?/i;

  /**
   * Determines the default behavior for interrupting other currently playing instances with the same source, if the
   * maximum number of instances of the sound are already playing.  Currently the default is <code>Sound.INTERRUPT_NONE</code>
   * but this can be set and will change playback behavior accordingly.  This is only used if {{#crossLink "Sound/play"}}{{/crossLink}}
   * is called without passing a value for interrupt.
   *
   * @property defaultInterruptBehavior
   * @type {String}
   * @default none
   * @static
   */
  Sound.defaultInterruptBehavior = Sound.INTERRUPT_NONE;

  /**
   * Used internally to assign unique IDs to each SoundInstance
   *
   * @property lastID
   * @type {Number}
   * @static
   * @private
   */
  Sound.lastId = 0,

  /**
   * The currently active plugin. If this is null, then no plugin could be initialized. If no plugin was specified,
   * Sound attempts to apply the default plugins: {{#crossLink "WebAudioPlugin"}}{{/crossLink}}, followed by
   * {{#crossLink "HTMLAudioPlugin"}}{{/crossLink}}.
   *
   * @property activePlugin
   * @type {Object}
   * @static
   */
  Sound.activePlugin = null;

  /**
   * Determines if the plugins have been registered. If false, the first call to play() will instantiate the default
   * plugins ({{#crossLink "WebAudioPlugin"}}{{/crossLink}}, followed by {{#crossLink "HTMLAudioPlugin"}}{{/crossLink}}).
   * If plugins have been registered, but none are applicable, then sound playback will fail.
   *
   * @property pluginsRegistered
   * @type {Boolean}
   * @default false
   * @static
   * @private
   */
  Sound.pluginsRegistered = false;

  /**
   * The master volume value. Use {{#crossLink "Sound/getVolume"}}{{/crossLink}} and {{#crossLink "Sound/setVolume"}}{{/crossLink}}
   * to modify the volume of all audio.
   *
   * @property masterVolume
   * @type {Number}
   * @default 1
   * @private
   */
  Sound.masterVolume = 1;

  /**
   * The master mute value for Sound.  This is applies to all sound instances.  This value can be set through
   * {{#crossLink "Sound/setMute"}}{{/crossLink}} and accessed via {{#crossLink "Sound/getMute"}}{{/crossLink}}.
   *
   * @property masterMute
   * @type {Boolean}
   * @default false
   * @private
   * @static
   */
  Sound.masterMute = false;

  /**
   * An array containing all currently playing instances. This helps Sound control the volume, mute, and playback of
   * all instances when using static APIs like {{#crossLink "Sound/stop"}}{{/crossLink}} and {{#crossLink "Sound/setVolume"}}{{/crossLink}}.
   * When an instance has finished playback, it gets removed via the {{#crossLink "Sound/finishedPlaying"}}{{/crossLink}}
   * method. If the user replays an instance, it gets added back in via the {{#crossLink "Sound/beginPlaying"}}{{/crossLink}} method.
   *
   * @property instances
   * @type {Array}
   * @private
   * @static
   */
  Sound.instances = [];

  /**
   * A hash lookup of sound sources via the corresponding ID.
   *
   * @property idHash
   * @type {Object}
   * @private
   * @static
   */
  Sound.idHash = {};

  /**
   * A hash lookup of preloading sound sources via the parsed source that is passed to the plugin.  Contains the
   * source, id, and data that was passed in by the user.  Parsed sources can contain multiple instances of source, id,
   * and data.
   *
   * @property preloadHash
   * @type {Object}
   * @private
   * @static
   */
  Sound.preloadHash = {};

  /**
   * An object that stands in for audio that fails to play. This allows developers to continue to call methods
   * on the failed instance without having to check if it is valid first. The instance is instantiated once, and
   * shared to keep the memory footprint down.
   *
   * @property defaultSoundInstance
   * @type {Object}
   * @protected
   * @static
   */
  Sound.defaultSoundInstance = null;

  /**
   * This event that is fired when a file finishes loading internally. This event is fired for each loaded sound,
   * so any handler methods should look up the <code>event.src</code> to handle a particular sound.
   *
   * @event loadComplete
   * @param {Object} target The object that dispatched the event.
   * @param {String} type The event type.
   * @param {String} src The source of the sound that was loaded. Note this will only return the loaded part of a
   *  delimiter-separated source.
   * @param {String} [id] The id passed in when the sound was registered. If one was not provided, it will be null.
   * @param {Number|Object} [data] Any additional data associated with the item. If not provided, it will be undefined.
   */

  /**
   * @method sendLoadComplete
   * @param {String} src A sound file has completed loading, and should be dispatched.
   * @private
   * @static
   */
  Sound.sendLoadComplete = function(src) {
    if (!Sound.preloadHash[src]) {
      return;
    }
    for (var i = 0, l = Sound.preloadHash[src].length; i < l; i++) {
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
   * Register a Sound plugin. Plugins handle the actual playback of audio. The default plugins are
   * ({{#crossLink "WebAudioPlugin"}}{{/crossLink}} followed by the {{#crossLink "HTMLAudioPlugin"}}{{/crossLink}}),
   * and are installed if no other plugins are present when the user starts playback.
   *
   * <h4>Example</h4>
   *     Sound.registerPlugin(HTMLAudioPlugin);
   *
   * To register multiple plugins, use {{#crossLink "Sound/registerPlugins"}}{{/crossLink}}.
   *
   * @method registerPlugin
   * @param {Object} plugin The plugin class to install.
   * @return {Boolean} Whether the plugin was successfully initialized.
   * @static
   */
  Sound.registerPlugin = function(plugin) {
    Sound.pluginsRegistered = true;
    if (plugin == null) {
      return false;
    }
    // Note: Each plugin is passed in as a class reference, but we store the activePlugin as an instance
    if (plugin.isSupported()) {
      Sound.activePlugin = new plugin();
      //TODO: Check error on initialization
      return true;
    }
    return false;
  }

  /**
   * Register a list of Sound plugins, in order of precedence. To register a single plugin, use
   * {{#crossLink "Sound/registerPlugin"}}{{/crossLink}}.
   *
   * <h4>Example</h4>
   *     Sound.registerPlugins([WebAudioPlugin, HTMLAudioPlugin]);
   *
   * @method registerPlugins
   * @param {Array} plugins An array of plugins classes to install.
   * @return {Boolean} Whether a plugin was successfully initialized.
   * @static
   */
  Sound.registerPlugins = function(plugins) {
    for (var i = 0, l = plugins.length; i < l; i++) {
      var plugin = plugins[i];
      if (Sound.registerPlugin(plugin)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Initialize the default plugins. This method is called when any audio is played before the user has registered
   * any plugins, and enables Sound to work without manual plugin setup. Currently, the default plugins are
   * {{#crossLink "WebAudioPlugin"}}{{/crossLink}} followed by {{#crossLink "HTMLAudioPlugin"}}{{/crossLink}}.
   *
   * @method initializeDefaultPlugins
   * @returns {Boolean} If a plugin is initialized (true) or not (false). If the browser does not have the
   *  capabilities to initialize any available plugins, this will return false.
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
   * Determines if Sound has been initialized, and a plugin has been activated.
   *
   * @method isReady
   * @return {Boolean} If Sound has initialized a plugin.
   * @static
   */
  Sound.isReady = function() {
    return (Sound.activePlugin != null);
  }

  /**
   * Get the active plugins capabilities, which help determine if a plugin can be used in the current environment,
   * or if the plugin supports a specific feature. Capabilities include:
   * <ul>
   *  <li><b>panning:</b> If the plugin can pan audio from left to right</li>
   *  <li><b>volume;</b> If the plugin can control audio volume.</li>
   *  <li><b>mp3:</b> If MP3 audio is supported.</li>
   *  <li><b>ogg:</b> If OGG audio is supported.</li>
   *  <li><b>wav:</b> If WAV audio is supported.</li>
   *  <li><b>mpeg:</b> If MPEG audio is supported.</li>
   *  <li><b>m4a:</b> If M4A audio is supported.</li>
   *  <li><b>mp4:</b> If MP4 audio is supported.</li>
   *  <li><b>aiff:</b> If aiff audio is supported.</li>
   *  <li><b>wma:</b> If wma audio is supported.</li>
   *  <li><b>mid:</b> If mid audio is supported.</li>
   *  <li><b>tracks:</b> The maximum number of audio tracks that can be played back at a time. This will be -1 if there is no known limit.</li>
   * </ul>
   *
   * @method getCapabilities
   * @return {Object} An object containing the capabilities of the active plugin.
   * @static
   */
  Sound.getCapabilities = function() {
    if (Sound.activePlugin == null) {
      return null;
    }
    return Sound.activePlugin.capabilities;
  }

  /**
   * Get a specific capability of the active plugin. See {{#crossLink "Sound/getCapabilities"}}{{/crossLink}} for a
   * full list of capabilities.
   *
   * @method getCapability
   * @param {String} key The capability to retrieve
   * @return {Number|Boolean} The value of the capability.
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
   * Register a sound to playback in Sound. It is recommended to register all sounds that need to be played back in order
   * to properly prepare and preload them. Sound does internal preloading when required.
   *
   * <h4>Example</h4>
   *     Sound.registerSound("myAudioPath/mySound.mp3|myAudioPath/mySound.ogg", "myID", 3);
   *
   * @method registerSound
   * @param {String | Object} src The source or an Objects with a "src" property
   * @param {String} [id] An id specified by the user to play the sound later.
   * @param {Number | Object} [data] Data associated with the item. Sound uses the data parameter as the number of
   *  channels for an audio instance, however a "channels" property can be appended to the data object if it is used
   *  for other information. The audio channels will set a default based on plugin if no value is found.
   * @return {Object} An object with the modified values that were passed in, which defines the sound. Returns false
   *  if the source cannot be parsed.
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
    var numChannels = null; // null will set all SoundChannel to set this to it's internal maxDefault
    if (data != null) {
      if (!isNaN(data.channels)) {
        numChannels = parseInt(data.channels);
      }
      else if (!isNaN(data)) {
        numChannels = parseInt(data);
      }
    }
    var loader = Sound.activePlugin.register(details.src, numChannels);  // Note only HTML audio uses numChannels
    if (loader != null) {
      if (loader.numChannels != null) {
        numChannels = loader.numChannels;
      } // currently only HTMLAudio returns this
      SoundChannel.create(details.src, numChannels);
      // return the number of instances to the user.  This will also be returned in the load event.
      if (data == null || !isNaN(data)) {
        data = details.data = numChannels || SoundChannel.maxPerChannel();
      } else {
        data.channels = details.data.channels = numChannels || SoundChannel.maxPerChannel();
      }
      // If the loader returns a tag, return it instead for preloading.
      if (loader.tag != null) {
        details.tag = loader.tag;
      }
      else if (loader.src) {
        details.src = loader.src;
      }
      // If the loader returns a complete handler, pass it on to the prelaoder.
      if (loader.completeHandler != null) {
        details.completeHandler = loader.completeHandler;
      }
      details.type = loader.type;
    }
    if (!Sound.preloadHash[details.src]) {
      Sound.preloadHash[details.src] = [];
    }  // we do this so we can store multiple id's and data if needed
    Sound.preloadHash[details.src].push({src: src, id: id, data: data});  // keep this data so we can return it onLoadComplete
    if (Sound.preloadHash[details.src].length == 1) {
      Sound.activePlugin.preload(details.src, loader)
    }
    return details;
  }

  /**
   * Register a manifest of sounds to playback in Sound. It is recommended to register all sounds that need to be
   * played back in order to properly prepare and preload them. Sound does internal preloading when required.
   *
   * <h4>Example</h4>
   *     var manifest = [
   *         {src:"assetPath/asset0.mp3|assetPath/asset0.ogg", id:"example"}, // Note the Sound.DELIMITER
   *         {src:"assetPath/asset1.mp3|assetPath/asset1.ogg", id:"1", data:6},
   *         {src:"assetPath/asset2.mp3", id:"works"}
   *     ];
   *     Sound.addEventListener("loadComplete", doneLoading); // call doneLoading when each sound loads
   *     Sound.registerManifest(manifest);
   *
   *
   * @method registerManifest
   * @param {Array} manifest An array of objects to load. Objects are expected to be in the format needed for
   *  {{#crossLink "Sound/registerSound"}}{{/crossLink}}: <code>{src:srcURI, id:ID, data:Data, preload:UseInternalPreloader}</code>
   *  with "id" and "data" being optional.
   * @return {Object} An array of objects with the modified values that were passed in, which defines each sound. It
   *  will return false for any values that the source cannot be parsed.
   * @static
   */
  Sound.registerManifest = function(manifest) {
    var returnValues = [];
    for (var i = 0, l = manifest.length; i < l; i++) {
      returnValues[i] = Sound.registerSound(manifest[i].src, manifest[i].id, manifest[i].data);
    }
    return returnValues;
  }

  /**
   * Check if a source has been loaded by internal preloaders. This is necessary to ensure that sounds that are
   * not completed preloading will not kick off a new internal preload if they are played.
   *
   * @method loadComplete
   * @param {String} src The src or id that is being loaded.
   * @return {Boolean} If the src is already loaded.
   */
  Sound.loadComplete = function(src) {
    var details = Sound.parsePath(src, "sound");
    if (details) {
      src = Sound.getSrcById(details.src);
    } else {
      src = Sound.getSrcById(src);
    }
    return (Sound.preloadHash[src][0] == true);  // src only loads once, so if it's true for the first it's true for all
  }

  /**
   * Parse the path of a sound, usually from a manifest item. Manifest items support single file paths, as well as
   * composite paths using <code>Sound.DELIMITER</code>, which defaults to "|". The first path supported by the
   * current browser/plugin will be used.
   *
   * @method parsePath
   * @param {String} value The path to an audio source.
   * @param {String} [type] The type of path. This will typically be "sound" or null.
   * @param {String} [id] The user-specified sound ID. This may be null, in which case the src will be used instead.
   * @param {Number | String | Boolean | Object} [data] Arbitrary data appended to the sound, usually denoting the
   *  number of channels for the sound. This method doesn't currently do anything with the data property.
   * @return {Object} A formatted object that can be registered with the <code>Sound.activePlugin</code> and returned
   *  to a preloader like <a href="http://preloadjs.com" target="_blank">PreloadJS</a>.
   * @protected
   */
  Sound.parsePath = function(value, type, id, data) {
    if (typeof(value) != "string") {value = value.toString();}
    var sounds = value.split(Sound.DELIMITER);
    var ret = {type: type || "sound", id: id, data: data};
    var c = Sound.getCapabilities();
    for (var i = 0, l = sounds.length; i < l; i++) {
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
   * Play a sound and get a {{#crossLink "SoundInstance"}}{{/crossLink}} to control. If the sound fails to play, a
   * SoundInstance will still be returned, and have a playState of <code>Sound.PLAY_FAILED</code>. Note that even on
   * sounds with failed playback, you may still be able to call SoundInstance {{#crossLink "SoundInstance/play"}}{{/crossLink}},
   * since the failure could be due to lack of available channels. If there is no available plugin,
   * <code>Sound.defaultSoundInstance</code> will be returned, which will not play any audio, but will not generate
   * errors.
   *
   * <h4>Example</h4>
   *     Sound.registerSound("myAudioPath/mySound.mp3", "myID", 3);
   *     // wait until load is complete
   *     Sound.play("myID");
   *     // alternately we could call the following
   *     var myInstance = Sound.play("myAudioPath/mySound.mp3", Sound.INTERRUPT_NONE, 0, 0, -1, 1, 0);
   *
   * @method play
   * @param {String} src The src or ID of the audio.
   * @param {String} [interrupt="none"] How to interrupt other instances of audio. Values are defined as <code>INTERRUPT_TYPE</code>
   *  constants on the Sound class.
   * @param {Number} [delay=0] The amount of time to delay the start of the audio in milliseconds.
   * @param {Number} [offset=0] The point to start the audio in milliseconds.
   * @param {Number} [loop=0] How many times the audio loops when it reaches the end of playback. The efault is 0 (no
   *  loops), and -1 can be used for infinite playback.
   * @param {Number} [volume=1] The volume of the sound, between 0 and 1. Note that the master volume is applied
   *  against the individual volume.
   * @param {Number} [pan=0] The left-right pan of the sound (if supported), between -1 (left) and 1 (right).
   * @return {SoundInstance} A {{#crossLink "SoundInstance"}}{{/crossLink}} that can be controlled after it is created.
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
   * Creates a {{#crossLink "SoundInstance"}}{{/crossLink}} using the passed in src. If the src does not have a
   * supported extension, a default SoundInstance will be returned that can be called safely but does nothing.
   *
   * @method createInstance
   * @param {String} src The src of the audio.
   * @return {SoundInstance} A {{#crossLink "SoundInstance"}}{{/crossLink}} that can be controlled after it is created.
   *  Unsupported extensions will return the default SoundInstance.
   */
  Sound.createInstance = function(src) {
    // TODO this function appears to be causing a memory leak, and needs spike tested.
    // in new SoundInstance
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
    var ext = src.slice(dot + 1);  // sound have format of "path+name . ext"
    if (dot != -1 && Sound.SUPPORTED_EXTENSIONS.indexOf(ext) > -1) {  // we have an ext and it is one of our supported,Note this does not mean the plugin supports it.
      // make sure that we have a sound channel (sound is registered or previously played)
      SoundChannel.create(src);
      var instance = Sound.activePlugin.create(src);
    } else {
      var instance = Sound.defaultSoundInstance; // the src is not supported, so give back a dummy instance.
    }
    instance.uniqueId = Sound.lastId++;
    return instance;
  }

  /**
   * Set the master volume of Sound. The master volume is multiplied against each sound's individual volume.
   * To set individual sound volume, use SoundInstance {{#crossLink "SoundInstance/setVolume"}}{{/crossLink}} instead.
   *
   * @method setVolume
   * @param {Number} value The master volume value. The acceptable range is 0-1.
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
      for (var i = 0, l = instances.length; i < l; i++) {
        instances[i].setMasterVolume(value);
      }
    }
  }

  /**
   * Get the master volume of Sound. The master volume is multiplied against each sound's individual volume.
   * To get individual sound volume, use SoundInstance {{#crossLink "SoundInstance/getVolume"}}{{/crossLink}} instead.
   *
   * @method getVolume
   * @return {Number} The master volume, in a range of 0-1.
   * @static
   */
  Sound.getVolume = function(value) {
    return Sound.masterVolume;
  }

  /**
   * Mute/Unmute all audio. Note that muted audio still plays at 0 volume. This global mute value is maintained
   * separately and will override, but not change the mute property of individual instances. To mute an individual
   * instance, use SoundInstance {{#crossLink "SoundInstance/setMute"}}{{/crossLink}} instead.
   *
   * @method setMute
   * @param {Boolean} value Whether the audio should be muted or not.
   * @return {Boolean} If the mute was set.
   * @static
   */
  Sound.setMute = function(value) {
    if (value == null || value == undefined) {
      return false
    }
    this.masterMute = value;
    if (!this.activePlugin || !this.activePlugin.setMute || !this.activePlugin.setMute(value)) {
      var instances = this.instances;
      for (var i = 0, l = instances.length; i < l; i++) {
        instances[i].setMasterMute(value);
      }
    }
    return true;
  }

  /**
   * Returns the global mute value. To get the mute value of an individual instance, use SoundInstance
   * {{#crossLink "SoundInstance/getMute"}}{{/crossLink}} instead.
   *
   * @method getMute
   * @return {Boolean} The mute value of Sound.
   * @static
   */
  Sound.getMute = function() {
    return this.masterMute;
  }

  /**
   * Stop all audio (global stop). Stopped audio is reset, and not paused. To play back audio that has been stopped,
   * call {{#crossLink "SoundInstance.play"}}{{/crossLink}}.
   *
   * @method stop
   * @static
   */
  Sound.stop = function() {
    var instances = this.instances;
    for (var i = instances.length; i > 0; i--) {
      instances[i - 1].stop();  // NOTE stop removes instance from this.instances
    }
  }

  /**
   * Play an instance. This is called by the static API, as well as from plugins. This allows the core class to
   * control delays.
   *
   * @method playInstance
   * @param {SoundInstance} instance The {{#crossLink "SoundInstance"}}{{/crossLink}} to start playing.
   * @param {String} [interrupt=none] How this sound interrupts other instances with the same source.  Defaults to
   *  <code>Sound.INTERRUPT_NONE</code>. All interrupt values are defined as <code>INTERRUPT_TYPE</code>constants on Sound.
   * @param {Number} [delay=0] Time in milliseconds before playback begins.
   * @param {Number} [offset=instance.offset] Time into the sound to begin playback in milliseconds.  Defaults to the
   *  current value on the instance.
   * @param {Number} [loop=0] The number of times to loop the audio. Use 0 for no loops, and -1 for an infinite loop.
   * @param {Number} [volume] The volume of the sound between 0 and 1. Defaults to current instance value.
   * @param {Number} [pan] The pan of the sound between -1 and 1. Defaults to current instance value.
   * @return {Boolean} If the sound can start playing. Sounds that fail immediately will return false. Sounds that
   *  have a delay will return true, but may still fail to play.
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
      //Note that we can't pass arguments to proxy OR setTimeout (IE only), so just wrap the function call.
      var delayTimeoutId = setTimeout(function() {
        Sound.beginPlaying(instance, interrupt, offset, loop, volume, pan);
      }, delay);
      instance.delayTimeoutId = delayTimeoutId;
    }
    this.instances.push(instance);
    return true;
  }

  /**
   * Begin playback. This is called immediately or after delay by {{#crossLink "Sound/playInstance"}}{{/crossLink}}.
   *
   * @method beginPlaying
   * @param {SoundInstance} instance A {{#crossLink "SoundInstance"}}{{/crossLink}} to begin playback.
   * @param {String} [interrupt=none] How this sound interrupts other instances with the same source. Defaults to
   *  <code>Sound.INTERRUPT_NONE</code>. Interrupts are defined as <code>INTERRUPT_TYPE</code> constants on Sound.
   * @param {Number} [offset] Time in milliseconds into the sound to begin playback.  Defaults to the current value on
   *  the instance.
   * @param {Number} [loop=0] The number of times to loop the audio. Use 0 for no loops, and -1 for an infinite loop.
   * @param {Number} [volume] The volume of the sound between 0 and 1. Defaults to the current value on the instance.
   * @param {Number} [pan=instance.pan] The pan of the sound between -1 and 1. Defaults to current instance value.
   * @return {Boolean} If the sound can start playing. If there are no available channels, or the instance fails to
   *  start, this will return false.
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
   * Get the source of a sound via the ID passed in with a register call. If no ID is found the value is returned
   * instead.
   *
   * @method getSrcById
   * @param {String} value The ID the sound was registered with.
   * @return {String} The source of the sound.  Returns null if src has been registered with this id.
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
   * A sound has completed playback, been interrupted, failed, or been stopped. This method removes the instance from
   * Sound management. It will be added again, if the sound re-plays. Note that this method is called from the
   * instances themselves.
   *
   * @method playFinished
   * @param {SoundInstance} instance The instance that finished playback.
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
   * A function proxy for Sound methods. By default, JavaScript methods do not maintain scope, so passing a
   * method as a callback will result in the method getting called in the scope of the caller. Using a proxy
   * ensures that the method gets called in the correct scope.
   * Note arguments can be passed that will be applied to the function when it is called.
   *
   * <h4>Example<h4>
   *     myObject.myCallback = Sound.proxy(myHandler, this, arg1, arg2);
   *
   * #method proxy
   * @param {Function} method The function to call
   * @param {Object} scope The scope to call the method name on
   * @param {mixed} [arg]* Arguments that are appended to the callback for additional params.
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
   * An internal class that manages the number of active {{#crossLink "SoundInstance"}}{{/crossLink}} instances for
   * each sound type. This method is only used internally by the {{#crossLink "Sound"}}{{/crossLink}} class.
   *
   * The number of sounds is artificially limited by Sound in order to prevent over-saturation of a
   * single sound, as well as to stay within hardware limitations, although the latter may disappear with better
   * browser support.
   *
   * When a sound is played, this class ensures that there is an available instance, or interrupts an appropriate
   * sound that is already playing.
   *
   * @class SoundChannel
   * @param {String} src The source of the instances
   * @param {Number} [max=1] The number of instances allowed
   * @constructor
   * @protected
   */
  var SoundChannel = xc.class.create({
    _init: function(src, max) {
      this.src = src;
      this.max = max || this.maxDefault;
      if (this.max == -1) {
        this.max == this.maxDefault;
      }
      this.instances = [];
    },

    /**
     * The source of the channel.
     *
     * @property src
     * @type {String}
     */
    src: null,

    /**
     * The maximum number of instances in this channel. -1 indicates no limit
     *
     * @property max
     * @type {Number}
     */
    max: null,

    /**
     * The default value to set for max, if it isn't passed in.  Also used if -1 is passed.
     *
     * @property maxDefault
     * @type {Number}
     * @default 100
     */
    maxDefault: 100,

    /**
     * The current number of active instances.
     *
     * @property length
     * @type {Number}
     */
    length: 0,

    /**
     * Initialize the channel.
     *
     * @method init
     * @param {String} src The source of the channel
     * @param {Number} max The maximum number of instances in the channel
     * @protected
     */

    /**
     * Get an instance by index.
     *
     * @method get
     * @param {Number} index The index to return.
     * @return {SoundInstance} The SoundInstance at a specific instance.
     */
    get: function(index) {
      return this.instances[index];
    },

    /**
     * Add a new instance to the channel.
     *
     * @method add
     * @param {SoundInstance} instance The instance to add.
     * @param {String} interrupt The interrupt value to use.
     * @return {Boolean} The success of the method call. If the channel is full, it will return false.
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
     * Remove an instance from the channel, either when it has finished playing, or it has been interrupted.
     *
     * @method remove
     * @param {SoundInstance} instance The instance to remove
     * @return {Boolean} The success of the remove call. If the instance is not found in this channel, it will
     *  return false.
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
     * Get an available slot depending on interrupt value and if slots are available.
     *
     * @method getSlot
     * @param {String} interrupt The interrupt value to use.
     * @param {SoundInstance} instance The sound instance that will go in the channel if successful.
     * @return {Boolean} Determines if there is an available slot. Depending on the interrupt mode, if there are no slots,
     *  an existing SoundInstance may be interrupted. If there are no slots, this method returns false.
     */
    getSlot: function(interrupt, instance) {
      var target, replacement;
      for (var i = 0, l = this.max; i < l; i++) {
        target = this.get(i);
        // Available Space
        if (target == null) {
          return true;
        } else if (interrupt == Sound.INTERRUPT_NONE && target.playState != Sound.PLAY_FINISHED) {
          continue;
        }
        // First replacement candidate
        if (i == 0) {
          replacement = target;
          continue;
        }
        // Audio is complete or not playing
        if (target.playState == Sound.PLAY_FINISHED ||
            target == Sound.PLAY_INTERRUPTED ||
            target == Sound.PLAY_FAILED) {
          replacement = target;
          // Audio is a better candidate than the current target, according to playhead
        } else if (
            (interrupt == Sound.INTERRUPT_EARLY && target.getPosition() < replacement.getPosition()) ||
                (interrupt == Sound.INTERRUPT_LATE && target.getPosition() > replacement.getPosition())) {
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
   * A hash of channel instances indexed by source.
   *
   * @property channels
   * @type {Object}
   * @static
   */
  SoundChannel.channels = {};

  /**
   * Create a sound channel. Note that if the sound channel already exists, this will fail.
   *
   * @method create
   * @param {String} src The source for the channel
   * @param {Number} max The maximum amount this channel holds. The default is {{#crossLink "SoundChannel.maxDefault"}}{{/crossLink}}.
   * @return {Boolean} If the channels were created.
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
   * Add an instance to a sound channel.
   *
   * @method add
   * @param {SoundInstance} instance The instance to add to the channel
   * @param {String} interrupt The interrupt value to use. Please see the {{#crossLink "Sound/play"}}{{/crossLink}}
   *  for details on interrupt modes.
   * @return {Boolean} The success of the method call. If the channel is full, it will return false.
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
   * Remove an instance from the channel.
   *
   * @method remove
   * @param {SoundInstance} instance The instance to remove from the channel
   * @return The success of the method call. If there is no channel, it will return false.
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
   * Get the maximum number of sounds you can have in a channel.
   *
   * @method maxPerChannel
   * @return {Number} The maximum number of sounds you can have in a channel.
   * @static
   */
  SoundChannel.maxPerChannel = function() {
    return p.maxDefault;
  }

  /**
   * Get a channel instance by its src.
   *
   * @method get
   * @param {String} src The src to use to look up the channel
   * @static
   */
  SoundChannel.get = function(src) {
    return SoundChannel.channels[src];
  }

  EventDispatcher.initialize(Sound);

  return Sound;

});
