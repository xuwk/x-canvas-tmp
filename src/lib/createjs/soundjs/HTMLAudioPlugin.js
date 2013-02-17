/**
 * The SoundJS library manages the playback of audio on the web. It works via plugins which abstract the actual audio
 * implementation, so playback is possible on any platform without specific knowledge of what mechanisms are necessary
 * to play sounds.
 *
 * To use SoundJS, use the public API on the {{#crossLink "Sound"}}{{/crossLink}} class. This API is for:
 * <ul>
 *  <li>Installing Plugins</li>
 *  <li>Registering sounds</li>
 *  <li>Playing sounds</li>
 *  <li>Controlling all sounds volume, mute, and stopping everything</li>
 * </ul>
 *
 * <b>Controlling Sounds</b><br/>
 * Playing sounds creates {{#crossLink "SoundInstance"}}{{/crossLink}} instances, which can be controlled individually.
 * <ul>
 *  <li>Pause, resume, and stop sounds</li>
 *  <li>Control a sound's volume, mute, and pan</li>
 *  <li>Add events to sound instances to get notified when they finish, loop, or fail</li>
 * </ul>
 *
 * <h4>Feature Set Example</h4>
 *     Sound.addEventListener("loadComplete", Sound.proxy(this.loadHandler, this));
 *     Sound.registerSound("path/to/mySound.mp3|path/to/mySound.ogg", "sound");
 *     function loadHandler(event) {
 *         // This is fired for each sound that is registered.
 *         var instance = Sound.play("sound");  // play using id. Could also use source.
 *         instance.addEventListener("playComplete", Sound.proxy(this.handleComplete, this));
 *         instance.setVolume(0.5);
 *     }
 *
 * @module xc.createjs.soundjs
 */
xc.module.define("xc.createjs.HTMLAudioPlugin", function(exports) {

  var Sound = xc.module.require("xc.createjs.Sound");
  var SoundInstance = xc.module.require("xc.createjs.SoundInstance");

  /**
   * The TagPool is an object pool for HTMLAudio tag instances. In Chrome, we have to pre-create the number of HTML
   * audio tag instances that we are going to play before we load the data, otherwise the audio stalls.
   * (Note: This seems to be a bug in Chrome)
   *
   * @class TagPool
   * @param {String} src The source of the channel.
   * @private
   */
  var TagPool = xc.class.create({
    _init: function(src) {
      this.src = src;
      this.tags = [];
    },

    /**
     * The source of the tag pool.
     *
     * @property src
     * @type {String}
     * @private
     */
    src: null,

    /**
     * The total number of HTMLAudio tags in this pool. This is the maximum number of instance of a certain sound
     * that can play at one time.
     *
     * @property length
     * @type {Number}
     * @default 0
     * @private
     */
    length: 0,

    /**
     * The number of unused HTMLAudio tags.
     *
     * @property available
     * @type {Number}
     * @default 0
     * @private
     */
    available: 0,

    /**
     * A list of all available tags in the pool.
     *
     * @property tags
     * @type {Array}
     * @private
     */
    tags: null,

    /**
     * Add an HTMLAudio tag into the pool.
     *
     * @method add
     * @param {HTMLAudioElement} tag A tag to be used for playback.
     */
    add: function(tag) {
      this.tags.push(tag);
      this.length++;
      this.available++;
    },

    /**
     * Get an HTMLAudioElement for immediate playback. This takes it out of the pool.
     *
     * @method get
     * @return {HTMLAudioElement} An HTML audio tag.
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
     * Put an HTMLAudioElement back in the pool for use.
     *
     * @method set
     * @param {HTMLAudioElement} tag HTML audio tag
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
   * A hash lookup of each sound channel, indexed by the audio source.
   *
   * @property tags
   * @static
   * @private
   */
  TagPool.tags = {};

  /**
   * Get a tag pool. If the pool doesn't exist, create it.
   *
   * @method get
   * @param {String} src The source file used by the audio tag.
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
   * Get a tag instance. This is a shortcut method.
   *
   * @method getInstance
   * @param {String} src The source file used by the audio tag.
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
   * Return a tag instance. This is a shortcut method.
   *
   * @method setInstance
   * @param {String} src The source file used by the audio tag.
   * @param {HTMLElement} tag Audio tag to set.
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
   * HTMLAudioPlugin's SoundInstance implementation.
   */
  var HTMLAudioSoundInstance = SoundInstance.extend({
    _init: function(src, owner) {
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
        } // Reset Position
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
      // Reset this instance.
      this.offset = offset;
      this.volume = volume;
      this.updateVolume();  // note this will set for mute and masterMute
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

    // Note: Sounds stall when trying to begin playback of a new audio instance when the existing instances
    // has not loaded yet. This doesn't mean the sound will not play.
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
        // Note: when paused by user, we hold a reference to our tag. We do not release it until stopped.
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
      return false; // Can not set pan in HTML
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
        } catch (error) { // Out of range
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
   * An internal helper class that preloads html audio via HTMLAudioElement tags.
   * Note that this class and its methods are not documented properly to avoid generating HTML documentation.
   *
   * @class HTMLAudioLoader
   * @param {String} src The source of the sound to load.
   * @param {HTMLAudioElement} tag The audio tag of the sound to load.
   * @constructor
   * @private
   */
  var HTMLAudioLoader = xc.class.create({
    _init: function(src, tag) {
      this.src = src;
      this.tag = tag;
      this.preloadTimer = setInterval(Sound.proxy(this.preloadTick, this), 200);
      // This will tell us when audio is buffered enough to play through, but not when its loaded.
      // The tag doesn't keep loading in Chrome once enough has buffered, and we have decided that behaviour is sufficient.
      // Note that canplaythrough callback doesn't work in Chrome, we have to use the event.
      this.loadedHandler = Sound.proxy(this.sendLoadedEvent, this);  // we need this bind to be able to remove event listeners
      this.tag.addEventListener && this.tag.addEventListener("canplaythrough", this.loadedHandler);
      this.tag.onreadystatechange = Sound.proxy(this.sendLoadedEvent, this);
      this.tag.preload = "auto";
      this.tag.src = src;
      this.tag.load();
    },

    /**
     * The source to be loaded.
     *
     * @property src
     * @type {String}
     * @default null
     * @protected
     */
    src: null,

    /**
     * The tag to load the source with / into.
     *
     * @property tag
     * @type {AudioTag}
     * @default null
     * @protected
     */
    tag: null,

    /**
     * An intervale used to give us progress.
     *
     * @property preloadTimer
     * @type {String}
     * @default null
     * @protected
     */
    preloadTimer: null,

    // Proxies, make removing listeners easier.
    loadedHandler: null,

    /**
     * Allows us to have preloading progress and tell when its done.
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
     * Internal handler for when a tag is loaded.
     *
     * @method handleTagLoaded
     * @protected
     */
    handleTagLoaded: function() {
      clearInterval(this.preloadTimer);
    },

    /**
     * Communicates back to Sound that a load is complete.
     *
     * @method sendLoadedEvent
     * @param {Object} evt The load Event
     */
    sendLoadedEvent: function(evt) {
      this.tag.removeEventListener && this.tag.removeEventListener("canplaythrough", this.loadedHandler);  // cleanup and so we don't send the event more than once
      this.tag.onreadystatechange = null;  // cleanup and so we don't send the event more than once
      Sound.sendLoadComplete(this.src);  // fire event or callback on Sound
    },

    toString: function() {
      return "[HTMLAudioPlugin HTMLAudioLoader]";
    }
  });

  /**
   * Play sounds using HTML &lt;audio&gt; tags in the browser. This plugin is the second priority plugin installed
   * by default, after the {{#crossLink "WebAudioPlugin"}}{{/crossLink}}, which is supported on Chrome, Safari, and
   * iOS. This handles audio in all other modern browsers.
   *
   * <h4>Known Browser and OS issues for HTML Audio</h4>
   * <b>All browsers</b><br/>
   * Testing has shown in all browsers there is a limit to how many audio tag instances you are allowed. If you exceed
   * this limit, you can expect to see unpredictable results. This will be seen as soon as you register sounds, as
   * tags are precreated to all Chrome to load them. Please use {{#crossLink "Sound.MAX_INSTANCES"}}{{/crossLink}} as
   * a guide to how many total audio tags you can safely use in all browsers.
   *
   * <b>IE 9 html audio quirk</b><br/>
   * Note in IE 9 there is a delay in applying volume changes to tags that occurs once playback is started. So if you have
   * muted all sounds, they will all play during this delay until the mute applies internally. This happens regardless of
   * when or how you apply the volume change, as the tag seems to need to play to apply it.
   *
   * <b>iOS 6 limitations</b><br/>
   * Note it is recommended to use {{#crossLink "WebAudioPlugin"}}{{/crossLink}} for iOS (6+). HTML Audio can only
   * have one &lt;audio&gt; tag, can not preload or autoplay the audio, can not cache the audio, and can not play the
   * audio except inside a user initiated event.
   *
   * <b>Android limitations</b><br/>
   * <ul>
   *  <li>We have no control over audio volume. Only the user can set volume on their device.</li>
   *  <li>We can only play audio inside a user event (touch).  This currently means you cannot loop sound.</li>
   * </ul>
   *
   * See {{#crossLink "Sound"}}{{/crossLink}} for general notes on known issues.
   *
   * @class HTMLAudioPlugin
   * @constructor
   */
  var HTMLAudioPlugin = xc.class.create({
    _init: function() {
      this.capabilities = HTMLAudioPlugin.capabilities;
      this.audioSources = {};
    },

    /**
     * The capabilities of the plugin, created by the {{#crossLink "HTMLAudioPlugin/generateCapabilities"}}{{/crossLink}}
     * method.
     *
     * @property capabilities
     * @type Object
     * @protected
     */
    capabilities: null,

    /**
     * Object hash indexed by the source of each file to indicate if an audio source is loaded, or loading.
     *
     * @property audioSources
     * @type {Object}
     * @protected
     */
    audioSources: null,

    /**
     * The default number of instances to allow. Passed back to {{#crossLink "Sound"}}{{/crossLink}} when a source
     * is registered using the {{#crossLink "Sound/register"}}{{/crossLink}} method. This is only used if
     * a value is not provided.
     *
     * <b>NOTE this only exists as a limitation of HTML audio.</b>
     *
     * @property defaultNumChannels
     * @type {Number}
     * @default 2
     */
    defaultNumChannels: 2,

    /**
     * Pre-register a sound instance when setup. This is called by {{#crossLink "Sound"}}{{/crossLink}}.
     *
     * @method register
     * @param {String} src The source of the audio
     * @param {Number} instances The number of concurrently playing instances to allow for the channel at any time.
     * @return {Object} A result object, containing a tag for preloading purposes and a numChannels value for internally
     *  controlling how many instances of a source can be played by default.
     */
    register: function(src, instances) {
      this.audioSources[src] = true;  // Note this does not mean preloading has started
      var channel = TagPool.get(src);
      var tag = null;
      var l = instances || this.defaultNumChannels;
      for (var i = 0; i < l; i++) {
        tag = this.createTag(src);
        channel.add(tag);
      }
      return {
        tag: tag, // Return one instance for preloading purposes
        numChannels: l  // The default number of channels to make for this Sound or the passed in value
      };
    },

    /**
     * Create an HTML audio tag.
     *
     * @method createTag
     * @param {String} src The source file to set for the audio tag.
     * @return {HTMLElement} Returns an HTML audio tag.
     * @protected
     */
    createTag: function(src) {
      var tag = document.createElement("audio");
      tag.autoplay = false;
      tag.preload = "none";
      tag.src = src;
      return tag;
    },

    /**
     * Create a sound instance. If the sound has not been preloaded, it is internally preloaded here.
     *
     * @method create
     * @param {String} src The sound source to use.
     * @return {SoundInstance} A sound instance for playback and control.
     */
    create: function(src) {
      // if this sound has not be registered, create a tag and preload it
      if (!this.isPreloadStarted(src)) {
        var channel = TagPool.get(src);
        var tag = this.createTag(src);
        channel.add(tag);
        this.preload(src, {tag: tag});
      }
      return new HTMLAudioSoundInstance(src, this);
    },

    /**
     * Checks if preloading has started for a specific source.
     *
     * @method isPreloadStarted
     * @param {String} src The sound URI to check.
     * @return {Boolean} If the preload has started.
     */
    isPreloadStarted: function(src) {
      return (this.audioSources[src] != null);
    },

    /**
     * Internally preload a sound.
     * @method preload
     * @param {String} src The sound URI to load.
     * @param {Object} instance An object containing a tag property that is an HTML audio tag used to load src.
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
   * The maximum number of instances that can be played. This is a browser limitation. The actual number varies from
   * browser to browser (and is largely hardware dependant), but this is a safe estimate.
   *
   * @property MAX_INSTANCES
   * @type {Number}
   * @default 30
   * @static
   */
  HTMLAudioPlugin.MAX_INSTANCES = 30;

  /**
   * The capabilities of the plugin. This is generated via the the SoundInstance {{#crossLink "HTMLAudioPlugin/generateCapabilities"}}{{/crossLink}}
   * method. Please see the Sound {{#crossLink "Sound/getCapabilities"}}{{/crossLink}} method for an overview of all
   * of the available properties.
   *
   * @property capabilities
   * @type {Object}
   * @static
   */
  HTMLAudioPlugin.capabilities = null;

  /**
   * Event constant for the "canPlayThrough" event for cleaner code.
   *
   * @property AUDIO_READY
   * @type {String}
   * @default canplaythrough
   * @static
   */
  HTMLAudioPlugin.AUDIO_READY = "canplaythrough";

  /**
   * Event constant for the "ended" event for cleaner code.
   *
   * @property AUDIO_ENDED
   * @type {String}
   * @default ended
   * @static
   */
  HTMLAudioPlugin.AUDIO_ENDED = "ended";

  /**
   * Event constant for the "error" event for cleaner code.
   *
   * @property AUDIO_ERROR
   * @type {String}
   * @default error
   * @static
   */
  HTMLAudioPlugin.AUDIO_ERROR = "error"; //TODO: Handle error cases

  /**
   * Event constant for the "stalled" event for cleaner code.
   *
   * @property AUDIO_STALLED
   * @type {String}
   * @default stalled
   * @static
   */
  HTMLAudioPlugin.AUDIO_STALLED = "stalled";

  /**
   * Determine if the plugin can be used in the current browser/OS. Note that HTML audio is available in most modern
   * browsers except iOS, where it is limited.
   *
   * @method isSupported
   * @return {Boolean} If the plugin can be initialized.
   * @static
   */
  HTMLAudioPlugin.isSupported = function() {
    // You can enable this plugin on iOS by removing this line, but it is not recommended due to the limitations:
    // iOS can only have a single <audio> instance, cannot preload or autoplay, cannot cache sound, and can only be
    // played in response to a user event (click)
    HTMLAudioPlugin.generateCapabilities();
    if (HTMLAudioPlugin.capabilities == null) {
      return false;
    }
    return true;
  };

  /**
   * Determine the capabilities of the plugin. Used internally. Please see the Sound API {{#crossLink "Sound/getCapabilities"}}{{/crossLink}}
   * method for an overview of plugin capabilities.
   *
   * @method generateCapabiities
   * @static
   * @protected
   */
  HTMLAudioPlugin.generateCapabilities = function() {
    if (HTMLAudioPlugin.capabilities != null) {
      return;
    }
    var t = document.createElement("audio");
    if (t.canPlayType == null) {
      return;
    }
    HTMLAudioPlugin.capabilities = {
      panning: true,
      volume: true,
      tracks: -1
    };
    // determine which extensions our browser supports for this plugin by iterating through Sound.SUPPORTED_EXTENSIONS
    var supportedExtensions = Sound.SUPPORTED_EXTENSIONS;
    var extensionMap = Sound.EXTENSION_MAP;
    for (var i = 0, l = supportedExtensions.length; i < l; i++) {
      var ext = supportedExtensions[i];
      var playType = extensionMap[ext] || ext;
      HTMLAudioPlugin.capabilities[ext] = (t.canPlayType("audio/" + ext) != "no" && t.canPlayType("audio/" + ext) != "") || (t.canPlayType("audio/" + playType) != "no" && t.canPlayType("audio/" + playType) != "");
    }
  }

  return HTMLAudioPlugin;

});
