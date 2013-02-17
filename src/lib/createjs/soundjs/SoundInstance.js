xc.module.define("xc.createjs.SoundInstance", function(exports) {

  var EventDispatcher = xc.module.require("xc.createjs.EventDispatcher");

  /**
   * A SoundInstance is created when any calls to the Sound API method {{#crossLink "Sound/play"}}{{/crossLink}} or
   * {{#crossLink "Sound/createInstance"}}{{/crossLink}} are made. The SoundInstance is returned by the active plugin
   * for control by the user.
   *
   * <h4>Example</h4>
   *     Sound.play("myAssetPath/mySrcFile.mp3");
   *
   * A number of additional parameters provide a quick way to determine how a sound is played. Please see the Sound
   * API method {{#crossLink "Sound/play"}}{{/crossLink}} for a list of arguments.
   *
   * Once a SoundInstance is created, a reference can be stored that can be used to control the audio directly through
   * the SoundInstance. If the reference is not stored, the SoundInstance will play out its audio (and any loops), and
   * is then de-referenced from the {{#crossLink "Sound"}}{{/crossLink}} class so that it can be cleaned up. If audio
   * playback has completed, a simple call to the {{#crossLink "SoundInstance/play"}}{{/crossLink}} instance method
   * will rebuild the references the Sound class need to control it.
   *
   *     var myInstance = Sound.play("myAssetPath/mySrcFile.mp3");
   *     myInstance.addEventListener("complete", playAgain);
   *     function playAgain(event) {
   *         myInstance.play();
   *     }
   *
   * Events are dispatched from the instance to notify when the sound has completed, looped, or when playback fails
   *
   *     var myInstance = Sound.play("myAssetPath/mySrcFile.mp3");
   *     myInstance.addEventListener("complete", playAgain);
   *     myInstance.addEventListener("loop", handleLoop);
   *     myInstance.addEventListener("playbackFailed", handleFailed);
   *
   *
   * @class SoundInstance
   * @extends EventDispatcher
   * @constructor
   * @param {String} src The path to and file name of the sound.
   * @param {Object} owner The plugin instance that created this SoundInstance.
   */
  var SoundInstance = EventDispatcher.extend({
    _init: function(src, owner) { },

    /**
     * The source of the sound.
     *
     * @property src
     * @type {String}
     * @default null
     * @protected
     */
    src: null,

    /**
     * The unique ID of the instance. This is set by <code>Sound</code>.
     *
     * @property uniqueId
     * @type {String} | Number
     * @default -1
     * @protected
     */
    uniqueId: -1,

    /**
     * The play state of the sound. Play states are defined as constants on <code>Sound</code>.
     *
     * @property playState
     * @type {String}
     * @default null
     */
    playState: null,

    /**
     * The plugin that created the instance
     *
     * @property owner
     * @type {Object}
     * @default null
     * @protected
     */
    owner: null,

    /**
     * How far into the sound to begin playback in milliseconds. This is passed in when play is called and used by
     * pause and setPosition to track where the sound should be at.
     *
     * Note: this is converted from milliseconds to seconds for consistency with the WebAudio API.
     *
     * @property offset
     * @type {Number}
     * @default 0
     * @protected
     */
    offset: 0,

    /**
     * The volume of the sound, between 0 and 1.
     * Use <code>getVolume</code> and <code>setVolume</code> to access.
     *
     * @property volume
     * @type {Number}
     * @default 1
     * @protected
     */
    volume: 1,

    /**
     * The length of the audio clip, in milliseconds.
     * Use <code>getDuration</code> to access.
     *
     * @property duration
     * @type {Number}
     * @default 0
     * @protected
     */
    duration: 0,

    /**
     * The number of play loops remaining. Negative values will loop infinitely.
     *
     * @property remainingLoops
     * @type {Number}
     * @default 0
     * @protected
     */
    remainingLoops: 0,

    /**
     * A Timout created by <code>Sound</code> when this SoundInstance is played with a delay. This allows SoundInstance
     * to remove the delay if stop or pause or cleanup are called before playback begins.
     *
     * @property delayTimeoutId
     * @type {timeoutVariable}
     * @default null
     * @protected
     */
    delayTimeoutId: null,

    /**
     * Determines if the audio is currently muted.
     * Use <code>getMute</code> and <code>setMute</code> to access.
     *
     * @property muted
     * @type {Boolean}
     * @default false
     * @protected
     */
    muted: false,

    /**
     * Determines if the audio is currently paused.
     * Use <code>pause()</code> and <code>resume()</code> to set.
     *
     * @property paused
     * @type {Boolean}
     * @default false
     * @protected
     */
    paused: false,

    /**
     * The pan of the sound, between -1 (left) and 1 (right). Note that pan does not work for HTML Audio.
     * Use <code>getPan</code> and <code>setPan</code> to access.
     *
     * @property pan
     * @type {Number}
     * @default 0
     * @protected
     */
    pan: 0,

    /**
     * NOTE this only exists as a <code>WebAudioPlugin</code> property and is only intended for use by advanced users.
     * A panNode allowing left and right audio channel panning only. Connected to our <code>WebAudioPlugin.gainNode</code>
     * that sequences to <code>context.destination</code>.
     *
     * @property panNode
     * @type {AudioPannerNode}
     * @default null
     */
    panNode: null,

    /**
     * NOTE this only exists as a <code>WebAudioPlugin</code> property and is only intended for use by advanced users.
     * GainNode for controlling <code>SoundInstance</code> volume. Connected to <code>panNode</code>.
     *
     * @property gainNode
     * @type {AudioGainNode}
     * @default null
     */
    gainNode: null,

    /**
     * NOTE this only exists as a <code>WebAudioPlugin</code> property and is only intended for use by advanced users.
     * sourceNode is our audio source. Connected to <code>gainNode</code>.
     *
     * @property sourceNode
     * @type {AudioSourceNode}
     * @default null
     */
    sourceNode: null,

    /**
     * The event that is fired when a sound is ready to play.
     *
     * @event ready
     * @param {Object} target The object that dispatched the event.
     * @param {String} type The event type.
     */

    /**
     * The event that is fired when playback has started successfully.
     *
     * @event succeeded
     * @param {Object} target The object that dispatched the event.
     * @param {String} type The event type.
     */

    /**
     * The event that is fired when playback is interrupted. This happens when another sound with the same
     * src property is played using an interrupt value that causes this instance to stop playing.
     *
     * @event interrupted
     * @param {Object} target The object that dispatched the event.
     * @param {String} type The event type.
     */

    /**
     * The event that is fired when playback has failed. This happens when there are too many channels with the same
     * src property already playing (and the interrupt value doesn't cause an interrupt of another instance), or
     * the sound could not be played, perhaps due to a 404 error.
     *
     * @event failed
     * @param {Object} target The object that dispatched the event.
     * @param {String} type The event type.
     */

    /**
     * The event that is fired when a sound has finished playing but has loops remaining.
     *
     * @event loop
     * @param {Object} target The object that dispatched the event.
     * @param {String} type The event type.
     */

    /**
     * The event that is fired when playback completes. This means that the sound has finished playing in its
     * entirety, including its loop iterations.
     *
     * @event complete
     * @param {Object} target The object that dispatched the event.
     * @param {String} type The event type.
     */

    /**
     * A helper method that dispatches all events for SoundInstance.
     *
     * @method sendEvent
     * @param {String} type The event type
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
     * Clean up the instance. Remove references and clean up any additional properties such as timers.
     *
     * @method cleanup
     * @protected
     */
    cleanUp: function() {
      clearTimeout(this.delayTimeoutId); // clear timeout that plays delayed sound
      Sound.playFinished(this);
    },

    /**
     * The sound has been interrupted.
     *
     * @method interrupt
     * @protected
     */
    interrupt: function() {
      this.playState = Sound.PLAY_INTERRUPTED;
      this.sendEvent("interrupted");
      this.cleanUp();
      this.paused = false;
    },

    /**
     * Play has failed, which can happen for a variety of reasons.
     *
     * @method playFailed
     * @protected
     */
    playFailed: function() {
      this.playState = Sound.PLAY_FAILED;
      this.sendEvent("failed");
      this.cleanUp();
    },

    /**
     * Play an instance. This method is intended to be called on SoundInstances that already exist (were created
     * with the Sound API {{#crossLink "createInstance"}}{{/crossLink}}, or have completed playback, and need to
     * be played again.
     *
     * <h4>Example</h4>
     *     var myInstance = Sound.createInstance(mySrc);
     *     myInstance.play(Sound.INTERRUPT_NONE);
     *
     * @method play
     * @param {String} [interrupt=none] How this sound interrupts other instances with the same source. Interrupt values
     *  are defined as constants on {{#crossLink "Sound"}}{{/crossLink}}. The default value is <code>Sound.INTERRUPT_NONE</code>.
     * @param {Number} [delay=0] The delay in milliseconds before the sound starts
     * @param {Number} [offset=0] How far into the sound to begin playback, in milliseconds.
     * @param {Number} [loop=0] The number of times to loop the audio. Use -1 for infinite loops.
     * @param {Number} [volume=1] The volume of the sound, between 0 and 1.
     * @param {Number} [pan=0] The pan of the sound between -1 (left) and 1 (right). Note that pan does not work for HTML Audio.
     */
    play: function(interrupt, delay, offset, loop, volume, pan) {
      this.cleanUp();
      Sound.playInstance(this, interrupt, delay, offset, loop, volume, pan);
    },

    /**
     * Called by the Sound class when the audio is ready to play (delay has completed). Starts sound playing if the
     * src is loaded, otherwise playback will fail.
     *
     * @method beginPlaying
     * @param {Number} offset How far into the sound to begin playback, in milliseconds.
     * @param {Number} loop The number of times to loop the audio. Use -1 for infinite loops.
     * @param {Number} volume The volume of the sound, between 0 and 1.
     * @param {Number} pan The pan of the sound between -1 (left) and 1 (right). Note that pan does not work for HTML Audio.
     * @protected
     */
    beginPlaying: function(offset, loop, volume, pan) {
      throw "not implemented.";
    },

    /**
     * Pause the instance. Paused audio will stop at the current time, and can be resumed using
     * {{#crossLink "SoundInstance/resume"}}{{/crossLink}}.
     *
     * <h4>Example</h4>
     *     myInstance.pause();
     *
     * @method pause
     * @return {Boolean} If the pause call succeeds. This will return false if the sound isn't currently playing.
     */
    pause: function() {
      throw "not implemented.";
    },

    /**
     * Resume an instance that has been paused using {{#crossLink "SoundInstance/pause"}}{{/crossLink}}. Audio that
     * has not been started may not resume when this method is called.
     *
     * @method resume
     * @return {Boolean} If the resume call succeeds. This will return false if called on a sound that is not paused.
     */
    resume: function() {
      throw "not implemented.";
    },

    /**
     * Stop playback of the instance. Stopped sounds will reset their position, and calls to {{#crossLink "SoundInstance/resume"}}{{/crossLink}}
     * may fail.
     *
     * @method stop
     * @return {Boolean} If the stop call succeeds.
     */
    stop: function() {
      throw "not implemented.";
    },

    /**
     * Set the volume of the instance. You can retrieve the volume using {{#crossLink "SoundInstance/getVolume"}}{{/crossLink}}.
     *
     * <h4>Example</h4>
     *      myInstance.setVolume(0.5);
     *
     * Note that the master volume set using the Sound API method {{#crossLink "Sound/setVolume"}}{{/crossLink}}
     * will apply on top of the instance volume.
     *
     * @method setVolume
     * @param value The volume to set, between 0 and 1.
     * @return {Boolean} If the setVolume call succeeds.
     */
    setVolume: function(value) {
      throw "not implemented.";
    },

    /**
     * Internal function used to update the volume based on the instance volume, master volume, instance mute value,
     * and master mute value.
     *
     * @method updateVolume
     * @return {Boolean} if the volume was updated.
     * @protected
     */
    updateVolume: function() {
      throw "not implemented.";
    },

    /**
     * Get the volume of the instance. The actual output volume of a sound can be calculated using:
     *
     *     instance.getVolume() x Sound.getVolume();
     *
     * @method getVolume
     * @return The current volume of the sound instance.
     */
    getVolume: function() {
      return this.volume;
    },

    /**
     * Mute and unmute the sound. Muted sounds will still play at 0 volume. Note that an unmuted sound may still be
     * muted depending on the Sound volume, instance volume, and Sound mute.
     *
     * @method mute
     * @param {Boolean} value If the sound should be muted.
     * @return {Boolean} If the mute call succeeds.
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
     * Get the mute value of the instance.
     *
     * <h4>Example</h4>
     *     var isMuted = myInstance.getMute();
     *
     * @method getMute
     * @return {Boolean} If the sound is muted.
     */
    getMute: function() {
      return this.muted;
    },

    /**
     * Get the position of the playhead in the instance in milliseconds.
     *
     * @method getPosition
     * @return {Number} The position of the playhead in the sound, in milliseconds.
     */
    getPosition: function() {
      throw "not implemented.";
    },

    /**
     * Set the position of the playhead in the instance. This can be set while a sound is playing, paused, or even stopped.
     *
     * <h4>Example</h4>
     *     myInstance.setPosition(myInstance.getDuration()/2); // set audio to it's halfway point.
     *
     * @method setPosition
     * @param {Number} value The position to place the playhead, in milliseconds.
     */
    setPosition: function(value) {
      throw "not implemented.";
    },

    /**
     * Set the left/right pan of the instance. Note that {{#crossLink "HTMLAudioPlugin"}}{{/crossLink}} does not
     * support panning, and only simple left/right panning has been implemented for {{#crossLink "WebAudioPlugin"}}{{/crossLink}}.
     * The default pan value is 0 (center).
     *
     * @method setPan
     * @param {Number} value The pan value, between -1 (left) and 1 (right).
     * @return {Number} If the setPan call succeeds.
     */
    setPan: function(value) {
      throw "not implemented.";
    },

    /**
     * Get the left/right pan of the instance. Note in WebAudioPlugin this only gives us the "x" value of what is
     * actually 3D audio.
     *
     * @method getPan
     * @return {Number} The value of the pan, between -1 (left) and 1 (right).
     */
    getPan: function() {
      return this.pan;
    },

    /**
     * Get the duration of the instance, in milliseconds. Note in most cases, you need to play as sound using
     * {{#crossLink "SoundInstance/play"}}{{/crossLink}} or the Sound API {{#crossLink "Sound.play"}}{{/crossLink}}
     * method before it's duration can be reported accurately.
     *
     * @method getDuration
     * @return {Number} The duration of the sound instance in milliseconds.
     */
    getDuration: function() {
      return this.duration;
    }
  });

  return SoundInstance;

});
