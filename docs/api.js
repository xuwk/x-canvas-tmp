YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "AlphaMapFilter",
        "AlphaMaskFilter",
        "Bitmap",
        "BitmapAnimation",
        "BoxBlurFilter",
        "CSSPlugin",
        "ColorFilter",
        "ColorMatrix",
        "ColorMatrixFilter",
        "Command",
        "Container",
        "DisplayObject",
        "Ease",
        "EventDispatcher",
        "Filter",
        "Graphics",
        "HTMLAudioLoader",
        "HTMLAudioPlugin",
        "Log",
        "Matrix2D",
        "MotionGuidePlugin",
        "MouseEvent",
        "MovieClip",
        "MovieClipPlugin",
        "Point",
        "Rectangle",
        "Shadow",
        "Shape",
        "Sound",
        "SoundChannel",
        "SoundInstance",
        "SpriteSheet",
        "SpriteSheetBuilder",
        "SpriteSheetUtils",
        "Stage",
        "TagPool",
        "Text",
        "Ticker",
        "Timeline",
        "Touch",
        "Tween",
        "UID",
        "WebAudioLoader",
        "WebAudioPlugin"
    ],
    "modules": [
        "xc",
        "xc.core",
        "xc.createjs",
        "xc.createjs.easeljs",
        "xc.createjs.soundjs",
        "xc.createjs.tweenjs"
    ],
    "allModules": [
        {
            "displayName": "xc",
            "name": "xc"
        },
        {
            "displayName": "xc.core",
            "name": "xc.core"
        },
        {
            "displayName": "xc.createjs",
            "name": "xc.createjs"
        },
        {
            "displayName": "xc.createjs.easeljs",
            "name": "xc.createjs.easeljs",
            "description": "The EaselJS Javascript library provides a retained graphics mode for canvas including a full hierarchical display\nlist, a core interaction model, and helper classes to make working with 2D graphics in Canvas much easier.\nEaselJS provides straight forward solutions for working with rich graphics and interactivity with HTML5 Canvas...\n\n<h4>Getting Started</h4>\nTo get started with Easel, create a {{#crossLink \"Stage\"}}{{/crossLink}} that wraps a CANVAS element, and add\n{{#crossLink \"DisplayObject\"}}{{/crossLink}} instances as children.\n\nEaselJS supports:\n<ul>\n <li>Images using {{#crossLink \"Bitmap\"}}{{/crossLink}}</li>\n <li>Vector graphics using {{#crossLink \"Shape\"}}{{/crossLink}} and {{#crossLink \"Graphics\"}}{{/crossLink}}</li>\n <li>Animated bitmaps using {{#crossLink \"SpriteSheet\"}}{{/crossLink}} and {{#crossLink \"BitmapAnimation\"}}{{/crossLink}}\n <li>Simple text instances using {{#crossLink \"Text\"}}{{/crossLink}}</li>\n <li>Containers that hold other DisplayObjects using {{#crossLink \"Container\"}}{{/crossLink}}</li>\n</ul>\n\nAll display objects can be added to the stage as children, or drawn to a canvas directly.\n\n<b>User Interactions</b><br/>\nAll display objects on stage will dispatch events when interacted with using a mouse or touch.\nEaselJS supports hover, press, and release events, as well as an easy-to-use drag-and-drop model. Check out\n{{#crossLink \"MouseEvent\"}}{{/crossLink}} for more information.\n\n<h4>Simple Example</h4>\nThis example illustrates how to create and position a {{#crossLink \"Shape\"}}{{/crossLink}} on the {{#crossLink \"Stage\"}}{{/crossLink}}\nusing EaselJS' drawing API.\n\n    // Create a stage by getting a reference to the canvas\n    var stage = new Stage(\"demoCanvas\");\n    // Create a Shape DisplayObject.\n    var circle = new Shape();\n    circle.graphics.beginFill(\"red\").drawCircle(0, 0, 40);\n    // Set position of Shape instance.\n    circle.x = circle.y = 50;\n    // Add Shape instance to stage display list.\n    stage.addChild(circle);\n    // Update stage will render next frame\n    stage.update();\n\n<b>Simple Animation Example</b><br/>\nThis example moves the shape created in the previous demo across the screen.\n\n    // Update stage will render next frame\n    Ticker.addEventListener(\"tick\", handleTick);\n\n    function handleTick() {\n        // Circle will move 10 units to the right.\n        circle.x += 10;\n        // Will cause the circle to wrap back\n        if (circle.x > stage.canvas.width) { circle.x = 0; }\n        stage.update();\n    }\n\n<h4>Other Features</h4>\nEaselJS also has built in support for\n<ul>\n <li>Canvas features such as {{#crossLink \"Shadow\"}}{{/crossLink}} and CompositeOperation</li>\n <li>{{#crossLink \"Ticker\"}}{{/crossLink}}, a global heartbeat that objects can subscribe to</li>\n <li>Filters, including a provided {{#crossLink \"ColorMatrixFilter\"}}{{/crossLink}},\n     {{#crossLink \"AlphaMaskFilter\"}}{{/crossLink}},\n     {{#crossLink \"AlphaMapFilter\"}}{{/crossLink}},\n     and {{#crossLink \"BoxBlurFilter\"}}{{/crossLink}}.\n     See {{#crossLink \"Filter\"}}{{/crossLink}} for more information</li>\n <li>A {{#crossLink \"ButtonHelper\"}}{{/crossLink}} utility, to easily create interactive buttons</li>\n <li>{{#crossLink \"SpriteSheetUtils\"}}{{/crossLink}} and a {{#crossLink \"SpriteSheetBuilder\"}}{{/crossLink}} to help\n     build and manage {{#crossLink \"SpriteSheet\"}}{{/crossLink}} functionality at run-time.</li>\n</ul>"
        },
        {
            "displayName": "xc.createjs.soundjs",
            "name": "xc.createjs.soundjs",
            "description": "The SoundJS library manages the playback of audio on the web. It works via plugins which abstract the actual audio\nimplementation, so playback is possible on any platform without specific knowledge of what mechanisms are necessary\nto play sounds.\n\nTo use SoundJS, use the public API on the {{#crossLink \"Sound\"}}{{/crossLink}} class. This API is for:\n<ul>\n <li>Installing Plugins</li>\n <li>Registering sounds</li>\n <li>Playing sounds</li>\n <li>Controlling all sounds volume, mute, and stopping everything</li>\n</ul>\n\n<b>Controlling Sounds</b><br/>\nPlaying sounds creates {{#crossLink \"SoundInstance\"}}{{/crossLink}} instances, which can be controlled individually.\n<ul>\n <li>Pause, resume, and stop sounds</li>\n <li>Control a sound's volume, mute, and pan</li>\n <li>Add events to sound instances to get notified when they finish, loop, or fail</li>\n</ul>\n\n<h4>Feature Set Example</h4>\n    Sound.addEventListener(\"loadComplete\", Sound.proxy(this.loadHandler, this));\n    Sound.registerSound(\"path/to/mySound.mp3|path/to/mySound.ogg\", \"sound\");\n    function loadHandler(event) {\n        // This is fired for each sound that is registered.\n        var instance = Sound.play(\"sound\");  // play using id. Could also use source.\n        instance.addEventListener(\"playComplete\", Sound.proxy(this.handleComplete, this));\n        instance.setVolume(0.5);\n    }"
        },
        {
            "displayName": "xc.createjs.tweenjs",
            "name": "xc.createjs.tweenjs",
            "description": "The TweenJS Javascript library provides a simple but powerful tweening interface. It supports tweening of both\nnumeric object properties & CSS style properties, and allows you to chain tweens and actions together to create\ncomplex sequences.\n\n<h4>Simple Tween</h4>\nThis tween will tween the target's alpha property from 0 to 1 for 1s then call the <code>onComplete</code> function.\n\n    target.alpha = 0;\n    Tween.get(target).to({alpha:1}, 1000).call(onComplete);\n    function onComplete() {\n        // Tween complete\n    }\n\n<h4>Chainable Tween</h4>\nThis tween will wait 0.5s, tween the target's alpha property to 0 over 1s, set it's visible to false, then call the\n<code>onComplete</code> function.\n\n    target.alpha = 1;\n    Tween.get(target).wait(500).to({alpha:0, visible:false}, 1000).call(onComplete);\n    function onComplete() {\n        // Tween complete\n    }"
        }
    ]
} };
});