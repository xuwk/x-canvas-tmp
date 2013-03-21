/**
 * 一个基于标签方式加载内容的加载器。通过这个加载器加载HTML音频和图片可以避免跨域时造成的安全问题，反之，任何基于XHR方式的加载都不可避免的存在跨域请求所带来的问题。
 * 
 * 注：对于audio标签，我们依赖<code>canPlayThrough</code>事件，在当前下载速度的情况下，当缓存内容足够让音频可以播放时调用该事件。对于大部分的音效，可以进行完整地加载，
 * 但是对于那些在背景播放的长音轨来说，触发事件的时候可能只加载了其中一部分。大部分浏览器（Chrome除外）会在触发事件之后继续加载，因此这个在大部分情况下是够用的。
 * 
 * @class TagLoader
 * @constructor
 * @extends AbstractLoader
 * @param {Object} item 需要加载的项。想了解更多关于加载项的信息，请查看{{#crossLink "LoadQueue/loadFile"}}{{/crossLink}}。
 */
xc.module.define("xc.createjs.TagLoader", function(exports) {
    var AbstractLoader = xc.module.require("xc.createjs.AbstractLoader");
    
    var TagLoader = AbstractLoader.extend({
        // 覆盖AbstractLoader中的抽象方法
        initialize: function (item) {
            this._item = item;
            this._tag = item.tag;
            this._isAudio = (window.HTMLAudioElement && item.tag instanceof HTMLAudioElement);
            this._tagCompleteProxy = createjs.proxy(this._handleLoad, this);
        },
        
     // 受保护的
         /**
          * setTimeout返回的值，用来代表持续一段时间没有任何内容被加载的情况下触发的事件。想了解超时时间，请查看<code>LoadQueue.LOAD_TIMEOUT</code>。
          * 
          * @property _loadTimeout
          * @type {Number}
          * @private
          */
         _loadTimeout: null,

         /**
          * 一个绑定函数的引用，当加载结束时可以用来准确地清除那些事件操作。
          * 
          * @property _tagCompleteProxy
          * @type {Function}
          * @private
          */
         _tagCompleteProxy: null,

         /**
          * 判断加载的项是否是一个audio标签，因为我们使用了一些特定的方式来准确地加载音频。
          * 
          * @property _isAudio
          * @type {Boolean}
          * @default false
          */
         _isAudio: false,

         /**
          * 这个加载器用来加载内容的HTML标签或Javascript对象。注：一个tag有可能是一个匹配HTML标签接口的自定义对象（加载方法、onload回调）。例如，SoundJS中的flash audio为
          * 了处理Flash音频和WebAudio的加载，传入了一个自定义的对象。
          * 
          * @property _tag
          * @type {HTMLAudioElement | Object}
          * @private
          */
         _tag: null,
         
         /**
          * 获取加载完的内容。这个通常是一个完全加载完的HTML标签或其他标签风格的对象。如果没有完成加载，这个值为null。
          * 
          * @method getResult
          * @return {HTMLImageElement | HTMLAudioElement} 已加载和解析的内容。
          */
         getResult: function() {
             return this._tag;
         },

         // 覆盖AbstractLoader中的抽象方法
         cancel: function() {
             this.canceled = true;
             this._clean();
             var item = this.getItem();
         },

         // 覆盖AbstractLoader中的抽象方法
         load: function() {
             var item = this._item;
             var tag = this._tag;

             // 以防我们没有得到任何事件。
             clearTimeout(this._loadTimeout); // 清空任何timeout
             this._loadTimeout = setTimeout(createjs.proxy(this._handleTimeout, this), createjs.LoadQueue.LOAD_TIMEOUT);

             if (this._isAudio) {
                 /* 
                                                    把资源置为空，以便我们可以把加载的类型设置“auto”而不需要启动一个加载操作。这个仅仅在开发者传入audio标签时是必须的。
                 */
                 tag.src = null; 
                 tag.preload = "auto";
             }

             // 面对所有标签的操作
             tag.onerror = createjs.proxy(this._handleError,  this);
             // 注：我们仅仅在Chrome下面得到progress事件，但是Chrome的行为决定，那些标签是不会完整加载的，因此我们忽略了progress。

             if (this._isAudio) {
                 tag.onstalled = createjs.proxy(this._handleStalled,  this);
                 // 这个会告诉我们当前的音频什么时候缓存到足以播放，而不是等它加载完。
                 // 在Chrome下面，当缓存足够时，当前标签就不会继续加载了，这个我们已经确认这个行为是够用的。
                 tag.addEventListener("canplaythrough", this._tagCompleteProxy, false); // 在Chrome下canplaythrough回调无法使用，因此我们用事件代替。
             } else {
                 tag.onload = createjs.proxy(this._handleLoad,  this);
                 tag.onreadystatechange = createjs.proxy(this._handleReadyStateChange,  this);
             }

             // 在所有事件添加完毕后设置src
             switch(item.type) {
                 case createjs.LoadQueue.CSS:
                     tag.href = item.src;
                     break;
                 case createjs.LoadQueue.SVG:
                     tag.data = item.src;
                     break;
                 default:
                     tag.src = item.src;
             }

             // SVG需要在DOM上面才能加载（在它发送complete消息前我们会把它移除掉）。
             // 重要提示：这个会在设置src/data <b>之后</>发生。
             if (item.type == createjs.LoadQueue.SVG || item.type == createjs.LoadQueue.JAVASCRIPT 
                 || item.type == createjs.LoadQueue.CSS) {
                 (document.body || document.getElementsByTagName("body")[0]).appendChild(tag);
                 //TODO：把SVG移出屏幕。
             }

             // 注：在旧版本的Firefox下当我们为OGG标签调用load方法时，貌似不起作用。貌似在15.0.1下解决了。
             if (tag.load != null) {
                 tag.load();
             }
         },

         toString: function() {
             return "[PreloadJS TagLoader]";
         },

         /**
          * 处理音频加载的超时情况。新版的浏览器会从标签上获得一个回调，但老的版本需要用setTimeout来处理。这个setTimeout会一直运行直至浏览器处理了一个相应。
          * 
          * @method _handleTimeout
          * @private
          */
         _handleTimeout: function() {
             this._clean();
             this._sendError({reason:"PRELOAD_TIMEOUT"}); 
         },

         /**
          * 处理一个停止加载的音频事件。那个我们认为可以捕获这个的主要地方是，在Chrome下面加载HTMLAudio且当我们尝试重放一个正在加载的音频的时候，不过没有完成。
          * 
          * @method _handleStalled
          * @private
          */
         _handleStalled: function() {
             //忽略，让超时情况去操心吧。某些时候它未必真的就停止了。
         },

         /**
          * 处理一个标签导致的错误事件。
          * 
          * @method _handleError
          * @private
          */
         _handleError: function() {
             this._clean();
             this._sendError(); //TODO: 理由或者是错误信息？
         },

         /**
          * 处理一个由标签触发的readyStateChange事件。有时候我们需要这个来代替onload事件（主要是script和link标签），但是其他情况也可能存在。
          * 
          * @method _handleReadyStateChange
          * @private
          */
         _handleReadyStateChange: function() {
             clearTimeout(this._loadTimeout);
             // 这个完全是为那些不支持onload事件的浏览器标签而进行的。
             var tag = this.getItem().tag;
             if (tag.readyState == "loaded") {
                 this._handleLoad();
             }
         },

         /**
          * 处理一个load(complete)事件。这个是在标签的回调方法里面调用的，也可以是readyStateChange和canPlayThrough事件调用的。一旦加载完成，
          * 那个项就会被分发到{{#crossLink "LoadQueue"}}{{/crossLink}}上。
          * 
          * @method _handleLoad
          * @param {Object} [event] 来源于标签的load事件。这个某些时候是其他不带事件的处理方法所调用的。
          * @private
          */
         _handleLoad: function(event) {
             if (this._isCanceled()) { return; }

             var item = this.getItem();
             var tag = item.tag;

             if (this.loaded || this.isAudio && tag.readyState !== 4) { return; }
             this.loaded = true;

             // 从DOM中移除
             if (item.type == createjs.LoadQueue.SVG) { 
                 (document.body || document.getElementsByTagName("body")[0]).removeChild(tag);
             }

             this._clean();
             this._sendComplete();
         },

         /**
          * 清空当前加载器。这个方法会停止所有的计时器、为了防止不当的回调而移除相关引用，并且会清空内存信息。
          * 
          * @method _clean
          * @private
          */
         _clean: function() {
             clearTimeout(this._loadTimeout);

             // 删除所有操作
             var tag = this.getItem().tag;
             tag.onload = null;
             tag.removeEventListener && tag.removeEventListener("canplaythrough", this._tagCompleteProxy, false);
             tag.onstalled = null;
             tag.onprogress = null;
             tag.onerror = null;

             if (tag.parentNode) {
                 tag.parentNode.removeChild(tag);
             }
         }
    });
    
    return TagLoader;
});