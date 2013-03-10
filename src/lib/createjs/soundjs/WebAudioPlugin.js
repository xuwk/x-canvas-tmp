xc.module.define("xc.createjs.WebAudioPlugin", function(exports) {

    var Sound = xc.module.require("xc.createjs.Sound");
    var SoundInstance = xc.module.require("xc.createjs.SoundInstance");

    /**
     * WebAudioPlugin's SoundInstance implementation.
     */
    var WebAudioSoundInstance = SoundInstance.extend({
        _init: function(src, owner) {
            this.owner = owner;
            this.src = src;
            this.panNode = this.owner.context.createPanner();  // allows us to manipulate left and right audio  // TODO test how this affects when we have mono audio
            this.gainNode = this.owner.context.createGainNode();  // allows us to manipulate instance volume
            this.gainNode.connect(this.panNode);  // connect us to our sequence that leads to context.destination
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
         * Clean up the instance. Remove references and clean up any additional properties such as timers.
         *
         * @method cleanup
         * @protected
         */
        cleanUp: function() {
            // if playbackState is UNSCHEDULED_STATE, then noteON or noteGrainOn has not been called so calling noteOff would throw an error
            if (this.sourceNode && this.sourceNode.playbackState != this.sourceNode.UNSCHEDULED_STATE) {
                this.sourceNode.noteOff(0);
                this.sourceNode = null; // release reference so Web Audio can handle removing references and garbage collection
            }
            if (this.panNode.numberOfOutputs != 0) {
                this.panNode.disconnect(0);
            } // this works because we only have one connection, and it returns 0 if we've already disconnected it.
            clearTimeout(this.delayTimeoutId); // clear timeout that plays delayed sound
            clearTimeout(this.soundCompleteTimeout);  // clear timeout that triggers sound complete
            Sound.playFinished(this);
        },

        // Playback has stalled, and therefore failed.
        handleSoundStalled: function(event) {
            this.sendEvent("failed");
        },

        // The sound is ready for playing
        handleSoundReady: function(event) {
            if (this.offset > this.getDuration()) {
                this.playFailed();
                return;
            } else if (this.offset < 0) {  // may not need this check if noteGrainOn ignores negative values, this is not specified in the API http://www.w3.org/TR/webaudio/#AudioBufferSourceNode
                this.offset = 0;
            }
            this.playState = Sound.PLAY_SUCCEEDED;
            this.paused = false;
            this.panNode.connect(this.owner.gainNode);  // this line can cause a memory leak.  Nodes need to be disconnected from the audioDestination or any sequence that leads to it.
            // WebAudio supports BufferSource, MediaElementSource, and MediaStreamSource.
            // NOTE MediaElementSource requires different commands to play, pause, and stop because it uses audio tags.
            // The same is assumed for MediaStreamSource, although it may share the same commands as MediaElementSource.
            this.sourceNode = this.owner.context.createBufferSource();
            this.sourceNode.buffer = this.owner.arrayBuffers[this.src];
            this.duration = this.owner.arrayBuffers[this.src].duration * 1000;
            this.sourceNode.connect(this.gainNode);
            this.soundCompleteTimeout = setTimeout(this.endedHandler, (this.sourceNode.buffer.duration - this.offset) * 1000);  // NOTE *1000 because WebAudio reports everything in seconds but js uses milliseconds
            this.startTime = this.owner.context.currentTime - this.offset;
            this.sourceNode.noteGrainOn(0, this.offset, this.sourceNode.buffer.duration - this.offset);
        },

        // Audio has finished playing. Manually loop it if required.
        // called internally by soundCompleteTimeout in WebAudioPlugin
        handleSoundComplete: function(event) {
            this.offset = 0;  // have to set this as it can be set by pause during playback
            if (this.remainingLoops != 0) {
                this.remainingLoops--;  // NOTE this introduces a theoretical limit on loops = float max size x 2 - 1
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
            this.offset = offset / 1000;  //convert ms to sec
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
                this.offset = this.owner.context.currentTime - this.startTime;  // this allows us to restart the sound at the same point in playback
                this.sourceNode.noteOff(0);  // note this means the sourceNode cannot be reused and must be recreated
                if (this.panNode.numberOfOutputs != 0) {
                    this.panNode.disconnect();
                }  // this works because we only have one connection, and it returns 0 if we've already disconnected it.
                clearTimeout(this.delayTimeoutId); // clear timeout that plays delayed sound
                clearTimeout(this.soundCompleteTimeout);  // clear timeout that triggers sound complete
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
            this.offset = 0;  // set audio to start at the beginning
            return true;
        },

        setVolume: function(value) {
            if (Number(value) == null) {
                return false;
            }
            value = Math.max(0, Math.min(1, value));
            this.volume = value;
            this.updateVolume();
            return true;  // This is always true because even if the volume is not updated, the value is set
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
                // Note that panning in WebAudioPlugin can support 3D audio, but our implementation does not.
                this.panNode.setPosition(value, 0, -0.5);  // z need to be -0.5 otherwise the sound only plays in left, right, or center
                this.pan = value;  // Unfortunately panner does not give us a way to access this after it is set http://www.w3.org/TR/webaudio/#AudioPannerNode
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
            return pos * 1000; // pos in seconds * 1000 to give milliseconds
        },

        setPosition: function(value) {
            this.offset = value / 1000; // convert milliseconds to seconds
            if (this.sourceNode && this.sourceNode.playbackState != this.sourceNode.UNSCHEDULED_STATE) {  // if playbackState is UNSCHEDULED_STATE, then noteON or noteGrainOn has not been called so calling noteOff would throw an error
                this.sourceNode.noteOff(0);  // we need to stop this sound from continuing to play, as we need to recreate the sourceNode to change position
                clearTimeout(this.soundCompleteTimeout);  // clear timeout that triggers sound complete
            }  // NOTE we cannot just call cleanup because it also calls the Sound function playFinished which releases this instance in SoundChannel
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
     * An internal helper class that preloads web audio via XHR. Note that this class and its methods are not documented
     * properly to avoid generating HTML documentation.
     *
     * @class WebAudioLoader
     * @param {String} src The source of the sound to load.
     * @param {Object} owner A reference to the class that created this instance.
     * @constructor
     */
    var WebAudioLoader = xc.class.create({
        _init: function(src, owner) {
            this.src = src;
            this.owner = owner;
        },

        // the request object for or XHR2 request
        request: null,

        owner: null,

        progress: -1,

        /**
         * The source of the sound to load. Used by callback functions when we return this class.
         *
         * @property src
         * @type {String}
         */
        src: null,

        /**
         * The decoded AudioBuffer array that is returned when loading is complete.
         *
         * @property result
         * @type {AudioBuffer}
         * @protected
         */
        result: null,

        /**
         * The callback that fires when the load completes. This follows HTML tag naming.
         *
         * @property onload
         * @type {Method}
         */
        onload: null,

        /**
         * The callback that fires as the load progresses. This follows HTML tag naming.
         *
         * @property onprogress
         * @type {Method}
         */
        onprogress: null,

        /**
         * The callback that fires if the load hits an error.
         *
         * @property onError
         * @type {Method}
         * @protected
         */
        onError: null,

        /**
         * Begin loading the content.
         *
         * @method load
         * @param {String} src The path to the sound.
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
         * The loader has reported progress.
         *
         * @method handleProgress
         * @param {Number} loaded The loaded amount.
         * @param {Number} total The total amount.
         * @private
         */
        handleProgress: function(loaded, total) {
            this.progress = loaded / total;
            if (this.onprogress == null) {
                return;
            }
            this.onprogress({loaded: loaded, total: total, progress: this.progress});
        },

        /**
         * The sound has completed loading.
         *
         * @method handleLoad
         * @protected
         */
        handleLoad: function() {
            s.context.decodeAudioData(this.request.response,
                    Sound.proxy(this.handleAudioDecoded, this),
                    Sound.proxy(this.handleError, this));
        },

        /**
         * The audio has been decoded.
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
         * Errors have been caused by the loader.
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
     * Play sounds using Web Audio in the browser. The WebAudio plugin has been successfully tested with:
     * <ul>
     *  <li>Google Chrome, version 23+ on OS X and Windows</li>
     *  <li>Safari 6+ on OS X</li>
     *  <li>Mobile Safari on iOS 6+</li>
     * </ul>
     *
     * The WebAudioPlugin is currently the default plugin, and will be used anywhere that it is supported. To change
     * plugin priority, check out the Sound API {{#crossLink "Sound/registerPlugins"}}{{/crossLink}} method.

     * <h4>Known Browser and OS issues for Web Audio Plugin</h4>
     * <b>Webkit (Chrome and Safari)</b><br />
     * <ul>
     *  <li>AudioNode.disconnect does not always seem to work. This can cause your file size to grow over time if you are playing a lot of audio files.</li>
     * </ul>
     *
     * <b>iOS 6 limitations</b><br />
     * <ul>
     *  <li>Sound is initially muted and will only unmute through play being called inside a user initiated event (touch).</li>
     * </ul>
     *
     * @class WebAudioPlugin
     * @constructor
     */
    var WebAudioPlugin = xc.class.create({
        _init: function() {
            this.capabilities = WebAudioPlugin.capabilities;
            this.arrayBuffers = {};
            this.context = WebAudioPlugin.context;
            this.gainNode = WebAudioPlugin.gainNode;
            this.dynamicsCompressorNode = WebAudioPlugin.dynamicsCompressorNode;
        },

        capabilities: null, // doc'd above

        /**
         * The web audio context, which WebAudio uses to play audio. All nodes that interact with the WebAudioPlugin
         * need to be created within this context.
         *
         * @property context
         * @type {AudioContext}
         */
        context: null,

        /**
         * A DynamicsCompressorNode, which is used to improve sound and prevent audio distortion according to
         * http://www.w3.org/TR/webaudio/#DynamicsCompressorNode. It is connected to <code>context.destination</code>.
         *
         * @property dynamicsCompressorNode
         * @type {AudioNode}
         */
        dynamicsCompressorNode: null,

        /**
         * A GainNode for controlling master volume. It is connected to <code>dynamicsCompressorNode</code>.
         *
         * @property gainNode
         * @type {AudioGainNode}
         */
        gainNode: null,

        /**
         * A hash used internally to store ArrayBuffers, indexed by the source URI used  to load it. This prevents
         * having to load and decode audio files more than once. If a load has been started on a file, <code>arrayBuffers[src]</code>
         * will be set to true. Once load is complete, it is set the the loaded ArrayBuffer instance.
         *
         * @property arrayBuffers
         * @type {Object}
         * @protected
         */
        arrayBuffers: null,

        /**
         * Pre-register a sound for preloading and setup. This is called by {{#crossLink "Sound"}}{{/crossLink}}.
         * Note that WebAudio provides a <code>WebAudioLoader</code> instance, which <a href="http://preloadjs.com">PreloadJS</a>
         * can use to assist with preloading.
         *
         * @method register
         * @param {String} src The source of the audio
         * @param {Number} instances The number of concurrently playing instances to allow for the channel at any time.
         *  Note that the WebAudioPlugin does not manage this property.
         * @return {Object} A result object, containing a "tag" for preloading purposes.
         */
        register: function(src, instances) {
            this.arrayBuffers[src] = true;  // This is needed for PreloadJS
            var tag = new WebAudioLoader(src, this);
            return {
                tag: tag
            };
        },

        /**
         * Checks if preloading has started for a specific source. If the source is found, we can assume it is loading,
         * or has already finished loading.
         *
         * @method isPreloadStarted
         * @param {String} src The sound URI to check.
         * @return {Boolean}
         */
        isPreloadStarted: function(src) {
            return (this.arrayBuffers[src] != null);
        },

        /**
         * Checks if preloading has finished for a specific source. If the source is defined (but not === true), then
         * it has finished loading.
         *
         * @method isPreloadComplete
         * @param {String} src The sound URI to load.
         * @return {Boolean}
         */
        isPreloadComplete: function(src) {
            return (!(this.arrayBuffers[src] == null || this.arrayBuffers[src] == true));
        },

        /**
         * Remove a source from our preload list. Note this does not cancel a preload.
         *
         * @method removeFromPreload
         * @param {String} src The sound URI to unload.
         * @return {Boolean}
         */
        removeFromPreload: function(src) {
            delete(this.arrayBuffers[src]);
        },

        /**
         * Add loaded results to the preload hash.
         *
         * @method addPreloadResults
         * @param {String} src The sound URI to unload.
         * @param {AudioBuffer} result The reload result.
         * @return {Boolean}
         */
        addPreloadResults: function(src, result) {
            this.arrayBuffers[src] = result;
        },

        /**
         * Handles internal preload completion.
         *
         * @method handlePreloadComplete
         * @private
         */
        handlePreloadComplete: function() {
            Sound.sendLoadComplete(this.src);  // fire event or callback on Sound
        },

        /**
         * Internally preload a sound. Loading uses XHR2 to load an array buffer for use with WebAudio.
         *
         * @method preload
         * @param {String} src The sound URI to load.
         * @param {Object} instance Not used in this plugin.
         * @protected
         */
        preload: function(src, instance) {
            this.arrayBuffers[src] = true;
            var loader = new WebAudioLoader(src, this);
            loader.onload = this.handlePreloadComplete;
            loader.load();
        },

        /**
         * Create a sound instance. If the sound has not been preloaded, it is internally preloaded here.
         *
         * @method create
         * @param {String} src The sound source to use.
         * @return {SoundInstance} A sound instance for playback and control.
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
     * The capabilities of the plugin. This is generated via the <code>"WebAudioPlugin/generateCapabilities</code>
     * method.
     *
     * @property capabilities
     * @type {Object}
     * @default null
     * @static
     */
    WebAudioPlugin.capabilities = null;

    /**
     * Determine if the plugin can be used in the current browser/OS.
     *
     * @method isSupported
     * @return {Boolean} If the plugin can be initialized.
     * @static
     */
    WebAudioPlugin.isSupported = function() {
        if (location.protocol == "file:") { return false; }  // Web Audio requires XHR, which is not available locally
        WebAudioPlugin.generateCapabilities();
        if (WebAudioPlugin.context == null) {
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
    WebAudioPlugin.generateCapabilities = function() {
        if (WebAudioPlugin.capabilities != null) {
            return;
        }
        // Web Audio can be in any formats supported by the audio element, from http://www.w3.org/TR/webaudio/#AudioContext-section,
        // therefore tag is still required for the capabilities check
        var t = document.createElement("audio");
        if (t.canPlayType == null) {
            return null;
        }
        // This check is first because it's what is currently used, but the spec calls for it to be AudioContext so this
        // will probably change in time
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
        // determine which extensions our browser supports for this plugin by iterating through Sound.SUPPORTED_EXTENSIONS
        var supportedExtensions = Sound.SUPPORTED_EXTENSIONS;
        var extensionMap = Sound.EXTENSION_MAP;
        for (var i = 0, l = supportedExtensions.length; i < l; i++) {
            var ext = supportedExtensions[i];
            var playType = extensionMap[ext] || ext;
            WebAudioPlugin.capabilities[ext] = (t.canPlayType("audio/" + ext) != "no" && t.canPlayType("audio/" + ext) != "") || (t.canPlayType("audio/" + playType) != "no" && t.canPlayType("audio/" + playType) != "");
        }
        // 0=no output, 1=mono, 2=stereo, 4=surround, 6=5.1 surround.
        // See http://www.w3.org/TR/webaudio/#AudioChannelSplitter for more details on channels.
        if (WebAudioPlugin.context.destination.numberOfChannels < 2) {
            WebAudioPlugin.capabilities.panning = false;
        }
        // set up AudioNodes that all of our source audio will connect to
        WebAudioPlugin.dynamicsCompressorNode = WebAudioPlugin.context.createDynamicsCompressor();
        WebAudioPlugin.dynamicsCompressorNode.connect(WebAudioPlugin.context.destination);
        WebAudioPlugin.gainNode = WebAudioPlugin.context.createGainNode();
        WebAudioPlugin.gainNode.connect(WebAudioPlugin.dynamicsCompressorNode);
    }

    return WebAudioPlugin;

});
