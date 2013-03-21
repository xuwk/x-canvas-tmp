/**
 * PreloadJS为HTML应用提供了一致的方式来加载内容。可以通过使用HTML标签、XHR方式来完成。
 * 
 * 默认情况下，PreloadJS会尝试使用XHR加载内容，因为它为进度提示和完成事件等提供了更好的支持，<b>但是基于跨域问题，仍然建议使用基于标签方式进行加载。</b>注：某些内容
 * 需要用XHR方式加载（纯文本、WebAudio），但是某些是需要标签的（HTML音频），这个是自动处理的。
 * 
 * PreloadJS现在支持现今所有的浏览器，并且我们已经尽最大的能力去支持大多数老的浏览器。如果你发现任何关于系统或浏览器的问题，请访问http://community.createjs.com/并报告之。
 * 
 * <h4>开始</h4>
 * 开始前，先检查{{#crossLink "LoadQueue"}}{{/crossLink}}类，它包含了一些加载文件和处理结果的便捷的使用方法。
 *
 * <h4>样例</h4>
 *      var queue = new LoadQueue();
 *      queue.installPlugin(createjs.Sound);
 *      queue.addEventListener("complete", handleComplete);
 *      queue.loadFile({id:"sound", src:"http://path/to/sound.mp3"});
 *      queue.loadManifest([
 *          {id: "myImage", src:"path/to/myImage.jpg"}
 *      ]);
 *      function handleComplete() {
 *          createjs.Sound.play("sound");
 *          var image = queue.getResult("myImage");
 *          document.body.appendChild(image);
 *      }
 *
 *<b>关于插件的重要提醒:</b> 插件必须在待加载项添加到队列<b>之前</b>安装，否则是不会被处理的，即使还没有开始进行加载。插件功能在待加载项添加到LoadQueue时就会被调用。
 * 
 * @module xc.createjs.preloadjs
 */
xc.module.define("xc.createjs.LoadQueue", function(exports) {
    var AbstractLoader = xc.module.require("xc.createjs.AbstractLoader");
    var XHRLoader = xc.module.require("xc.createjs.XHRLoader");
    var TagLoader = xc.module.require("xc.createjs.TagLoader");
    //TODO: JSONP的支持？
    //TODO: addHeadTags的支持
    
    /*
    TODO: Windows的问题：
        * 在IE 678里面的HTML音频没有错误提示
        * 在IE 67（可能8也是）里面SVG的标签加载和XHR都没有失败错误提示
        * 在IE 67里面使用标签加载方式，没有脚本加载完成的操作（XHR是有的）
        * IE6里面没有XML和JSON的标签加载方式
     */
    
    /**
     * LoadQueue类提供了预加载内容的主接口。LoadQueue是一个管理单个或多个文件形成的文件队列的加载管理器。
     * <b>创建一个队列</b><br />
     * 如果要使用LoadQueue，先创建一个LoadQueue实例。如果你想尽可能使用标签加载的方式，请把useXHR参数设为false。 
     *
     *      var queue = new LoadQueue(true);
     * 
     * <b>事件监听</b><br />
     * 把任何你想添加的事件添加到队列里面。从PreloadJS 0.3.0开始，{{#crossLink "EventDispatcher"}}{{/crossLink}}可以让你尽情添加任何你想要的事件，
     * 你可以订阅加载完成、加载错误、文件加载完毕、加载进度和文件下载进度等事件。
     * 
     *      queue.addEventListener("fileload", handleFileLoad);
     *      queue.addEventListener("complete", handleComplete);
     *
     *<b>添加多个文件或文件列表</b><br />
     * 多次使用{{#crossLink "LoadQueue/loadFile"}}{{/crossLink}}来添加多个文件或者一次性使用{{#crossLink "LoadQueue/loadManifest"}}{{/crossLink}}
     * 来添加多个文件。那些文件只是被压到加载队列后面，所以你可以随时随地无限次使用那些方法来添加你想加载的文件。
     *
     *      queue.loadFile("filePath/file.jpg");
     *      queue.loadFile({id:"image", src:"filePath/file.jpg"});
     *      queue.loadManifest(["filePath/file.jpg", {id:"image", src:"filePath/file.jpg"}];
     *
     * 第二个参数如果你传了false，那么队列不会马上开始加载（除非它已经开始了）。调用{{#crossLink "AbstractLoader/load"}}{{/crossLink}}来重启一个暂停的队列。
     * 注：当添加新的文件时，暂停的队列会自动开始加载的。
     *
     *      queue.load();
     *      
     * <b>对结果进行操控</b><br />
     * 当一个文件下载完成时，会分派一个叫“fileload”的事件。在上面的例子中，有一小段是描述“fileload”事件的。加载完的文件通常是一个可以马上被使用的对象，其中包含了：
     * <ul>
     *     <li>图片: 一个 &lt;img /&gt; 标签</li>
     *     <li>音频: 一个 &lt;audio /&gt; 标签</a>
     *     <li>JavaScript: 一个 &lt;script /&gt; 标签</li>
     *     <li>CSS: 一个 &lt;link /&gt; 标签</li>
     *     <li>XML: 一个 XML DOM 结点</li>
     *     <li>SVG: 一个 &lt;object /&gt; 标签</li>
     *     <li>JSON: 一个格式化的JavaScript对象</li>
     *     <li>文本: 纯文本内容</li>
     *     <li>二进制: 二进制加载的结果</li>
     * </ul>
     *
     *      function handleFileLoad(event) {
     *          var item = event.item; // 一个传入的加载项的引用
     *          var type = item.type;
     *
     *          // 往页面上添加图片
     *          if (type == LoadQueue.IMAGE) {
     *              document.body.appendChild(event.result);
     *          }
     *      }
     *
     * 文件加载完的任何时候（通常是队列已经加载完的时候），你可以使用{{#crossLink "LoadQueue/getResult"}}{{/crossLink}}方法，传入对应的“id”来进行结果的查找。
     * 如果没有提供id，则可以使用“src”或文件路径来代替。通常建议使用id。
     *
     *      var image = queue.getResult("image");
     *      document.body.appendChild(image);
     *
     * 你可以直接通过<code>fileload</code>事件中的<code>rawResult</code>属性来操作裸数据内容，或者使用{{#crossLink "LoadQueue/getResult"}}{{/crossLink}}
     * 获取它（第二个参数设为true）。这个仅仅对那些已经编译为浏览器可用的内容有效，例如，Javascript、CSS、XML、SVG、JSON对象。
     *
     *      var image = queue.getResult("image", true);
     *      
     * <b>插件</b><br />
     * LoadQueue有一个简单易用的插件机制，它可以帮助你预加载和处理内容。例如，用来加载音频，请确认你已经安装了<a href="http://soundjs.com">SoundJS</a>音效类，你可以用它来加载
     * HTML的音频，Flash音频和WebAudio文件，这个需要在加载任何音频文件<b>之前</b>安装。
     *
     *      queue.installPlugin(createjs.Sound);
     *
     * <h4>已知的浏览器问题</h4>
     * <ul><li>不支持音频的浏览器不能加载音频文件。</li>
     *      <li>音频标签类的下载操作会持续到<code>canPlayThrough</code>事件被触发的时候。与大多数浏览器不一样，Chrome会一直在后台进行下载。</li>
     *      <li>如果直接用标签来加载脚本，他们会被自动添加到DOM里面。</li>
     *      <li>通过XHR加载的脚本有可能无法被浏览器的工具准确识别到。</li>
     *      <li>IE6 和 IE7 (和其他的一些浏览器)可能无法加载XML、文本或JSON，除非他们使用XHR加载。</li>
     *      <li>通过标签来加载内容是不会输出进度的，虽然它们可以被取消，但是仍然会在后台进行下载。</li>
     * </ul>
     * @class LoadQueue
     * @param {Boolean} [useXHR=true] 用来定义预加载实例是用XHR（XML HTTP Requests）进行加载还是HTML标签方式加载。
     * 如果是<code>false</code>，LoadQueue会尽可能使用标签加载，必须时才使用XHR。
     * @constructor
     * @extends AbstractLoader
     */
    var LoadQueue = AbstractLoader.extend({
        initialize: function(useXHR) {
            // 重写AbstractLoader上的抽象方法。
            this._numItems = this._numItemsLoaded = 0;
            this._paused = false;
            this._loadStartWasDispatched = false;
    
            this._currentLoads = [];
            this._loadQueue = [];
            this._loadQueueBackup = [];
            this._scriptOrder = [];
            this._loadedScripts = [];
            this._loadItemsById = {};
            this._loadItemsBySrc = {};
            this._loadedResults = {};
            this._loadedRawResults = {};
    
            // 为插件提供回调方法
            this._typeCallbacks = {};
            this._extensionCallbacks = {};
    
            this.setUseXHR(useXHR);
        },
        
        /**
         * 有条件的时候使用XMLHttpRequest。注：LoadQueue会根据待加载项的媒体类型来强制加载方式（标签或XHR）。例如，HTML音频无法使用XHR加载，WebAudio无法使用标签加载，
         * 因此它会忽略用户定义的类型，强制使用正确的类型来进行加载。
         * 
         * @property useXHR
         * @type {Boolean}
         * @readOnly
         * @default true
         */
        useXHR: true,

        /**
         * 当错误发生时停止当前队列的进程。
         * @property stopOnError
         * @type {Boolean}
         * @default false
         */
        stopOnError: false,

        /**
         * 确保脚本是按指定顺序已经加载完毕。注：在同一时间内，只会有一个脚本文件通过标签方式进行加载，并且当它加载完时，会添加到DOM里面。
         * 
         * @property maintainScriptOrder
         * @type {Boolean}
         * @default true
         */
        maintainScriptOrder: true,

        /**
         * 在当前队列加载完成时需要启动的下一个队列。如果当前队列抛出一个错误，并且<code>loadQueue.stopOnError</code>参数值为<code>true</code>，则
         * 下个队列不会被执行。
         * 
         * @property next
         * @type {LoadQueue}
         * @default null
         */
        next: null,

    // 事件
        /**
         * 当一个文件被加载完成时触发这个事件，并且会被执行。
         * 
         * @event fileload
         * @param {Object} target 分派事件的对象。
         * @param {String} type 事件类型。
         * @param {Object} item 在{{#crossLink "LoadQueue/loadFile"}}{{/crossLink}}或{{#crossLink "LoadQueue/loadManifest"}}{{/crossLink}}里面指定加载的文件项。
         * 如果只提供了路径或指定标签，那么该对象会把它当作一个属性包含在值里面。
         * @param {Object} result 加载完成项的HTML标签或解析结果。
         * @param {Object} rawResult 未处理的结果，通常是未转化成可用对象的纯文本或二进制数据。
         */

        /**
         * 当单个文件加载进度发生变化时触发的事件。
         * 
         * @event fileprogress
         * @param {Object} target 分派事件的对象。
         * @param {String} type 事件类型。
         * @param {Object} item 在{{#crossLink "LoadQueue/loadFile"}}{{/crossLink}}或{{#crossLink "LoadQueue/loadManifest"}}{{/crossLink}}里面指定加载的文件项。
         * 如果只提供了路径或指定标签，那么该对象会把它当作一个属性包含在值里面。
         * @param {Number} loaded 已经加载了的字节。注：这个有可能百分比为“1”的值。
         * @param {Number} total 总的字节数。如果未知，值为1。
         * @param {Number} percent 已经加载的百分比。这个至介于0和1之间。
         */

    // 受保护的属性
        /**
         * 文件加载前基于不同文件类型触发的回调方法的哈希列表的对象，为插件提供加载方法的重写能力。查看{{#crossLink "LoadQueue/installPlugin"}}{{/crossLink}}
         * 方法来获取更多信息。
         * 
         * @property _typeCallbacks
         * @type {Object}
         * @private
         */
        _typeCallbacks: null,

        /**
         * 文件加载完毕时基于不同文件扩展名触发的回调方法的哈希列表的对象，为插件提供加载方法的重写能力。查看{{#crossLink "LoadQueue/installPlugin"}}{{/crossLink}}
         * 方法来获取更多信息。
         * 
         * @property _extensionCallbacks
         * @type {null}
         * @private
         */
        _extensionCallbacks: null,

        /**
         * 检查loadStart事件是否已经被分派了。这个事件仅仅在请求第一个文件时被触发，且只触发一次。
         * 
         * @property _loadStartWasDispatched
         * @type {Boolean}
         * @default false
         * @private
         */
        _loadStartWasDispatched: false,

        /**
         * loadQueue尝试保持的最大连接数。查看{{#crossLink "LoadQueue/setMaxConnections"}}{{/crossLink}}获取更多信息。
         * 
         * @property _maxConnections
         * @type {Number}
         * @default 1
         * @private
         */
        _maxConnections: 1,

        /**
         * 判断当前是否有一个脚本正在加载。这个帮助确保在使用script标签加载时，只有一个脚本被加载。
         * 
         * @property _currentlyLoadingScript
         * @type {Boolean}
         * @private
         */
        _currentlyLoadingScript: null,

        /**
         * 包含当前正在下载文件的数组。
         * 
         * @property _currentLoads
         * @type {Array}
         * @private
         */
        _currentLoads: null,

        /**
         * 包含还没有开始下载队列项的数组。
         * 
         * @property _loadQueue
         * @type {Array}
         * @private
         */
        _loadQueue: null,

        /**
         * 包含未完成下载项的数组，因此LoadQueue可以准确地重置待加载项。
         * 
         * @property _loadQueueBackup
         * @type {Array}
         * @private
         */
        _loadQueueBackup: null,

        /**
         * 一个代表已经加载完毕项的哈希列表的对象，以ID为索引。
         * 
         * @property _loadItemsById
         * @type {Object}
         * @private
         */
        _loadItemsById: null,

        /**
         * 一个代表已经加载完毕项的哈希列表的对象，以源路径为索引。
         * 
         * @property _loadItemsBySrc
         * @type {Object}
         * @private
         */
        _loadItemsBySrc: null,

        /**
         * 加载完项的哈希列表对象，以加载项的ID为索引。
         * 
         * @property _loadedResults
         * @type {Object}
         * @private
         */
        _loadedResults: null,

        /**
         * 未解析加载完项的哈希列表对象，以加载项的ID为索引。
         * 
         * @property _loadedRawResults
         * @type {Object}
         * @private
         */
        _loadedRawResults: null,

        /**
         * 已经被请求过的项的数量。这个可以帮助管理总体的进度而不需要关心文件的大小。
         * 
         * @property _numItems
         * @type {Number}
         * @default 0
         * @private
         */
        _numItems: 0,

        /**
         * 完成加载的项的数量。这个可以帮助管理总体的进度而不需要关心文件的大小。
         * 
         * @property _numItemsLoaded
         * @type {Number}
         * @default 0
         * @private
         */
        _numItemsLoaded: 0,

        /**
         * 需要按序加载的脚本的列表。这个帮助确保脚本是按照顺序加载完成的。
         * 
         * @property _scriptOrder
         * @type {Array}
         * @private
         */
        _scriptOrder: null,

        /**
         * 已经加载完的脚本序列。当待加载项被请求时，会作为<code>null</code>值添加到这个数组内，加载完成时会包含已加载的信息，但是这时仍不会分派给用户，当他们都加载完成并分配
         * 事件给用户时，值会改为<code>true</true>.
         * 
         * @property _loadedScripts
         * @type {Array}
         * @private
         */
        _loadedScripts: null,
        
        /**
         * 改变useXHR的值。注：如果这个设为true，有可能会导致浏览器适配依赖失败。
         * 
         * @method setUseXHR
         * @param {Boolean} value 需要设置的新useXHR值。
         * @return {Boolean} 新的useXHR值。如果浏览器不支持XHR，这个会返回false，即使提供的参数是true。
         */
        setUseXHR: function(value) {
            // 判断我们是否能使用XHR。XHR默认为TRUE，但是浏览器可能不支持。
            //TODO：我们能不能检查一下其他的XHR类型？需要像createXHR一样针对不同的类型做个try/catch
            this.useXHR = (value != false && window.XMLHttpRequest != null);
            return this.useXHR;
        },

        /**
         * 停止所有的队列和加载中的内容，并清空队列。这个也会把已经加载内容的所有内在引用移除掉，且允许队列被重新使用。那些还没开始加载的内容可以通过使用
         * {{#crossLink "AbstractLoader/load"}}{{/crossLink}}方法重新打开。
         * 
         * @method removeAll
         */
        removeAll: function() {
            this.remove();
        },

        /**
         * 停止一个正在加载的文件，并从队列中移除它。如果不传参数，所有的文件会被移除。这个方法同样会把已经加载的文件的内在引用移除掉。
         * 
         * @method remove
         * @param {String | Array} idsOrUrls 那些需要从队列中移除的id，你可以传递一个id/URL，或id/URL的数组，也可以是id和URL混合的数组。
         */
        remove: function(idsOrUrls) {
            var args = null;

            if (idsOrUrls && !(idsOrUrls instanceof Array)) {
                args = [idsOrUrls];
            } else if (idsOrUrls) {
                args = idsOrUrls;
            }

            var itemsWereRemoved = false;

            // 毁灭所有～
            if (!args) {
                this.close();

                for (var n in this._loadItemsById) {
                    this._disposeItem(this._loadItemsById[n]);
                }

                this.initialize(this.useXHR);

            // 移除指定的项
            } else {
                while (args.length) {
                    var item = args.pop();
                    var r = this.getResult(item);

                    //从加载主队列中移除
                    for (i = this._loadQueue.length-1;i>=0;i--) {
                        loadItem = this._loadQueue[i].getItem();
                        if (loadItem.id == item || loadItem.src == item) {
                            this._loadQueue.splice(i,1)[0].cancel();
                            break;
                        }
                    }

                    //从备份队列中移除
                    for (i = this._loadQueueBackup.length-1;i>=0;i--) {
                        loadItem = this._loadQueueBackup[i].getItem();
                        if (loadItem.id == item || loadItem.src == item) {
                            this._loadQueueBackup.splice(i,1)[0].cancel();
                            break;
                        }
                    }

                    if (r) {
                        delete this._loadItemsById[r.id];
                        delete this._loadItemsBySrc[r.src];
                        this._disposeItem(r);
                    } else {
                        for (var i=this._currentLoads.length-1;i>=0;i--) {
                            var loadItem = this._currentLoads[i].getItem();
                            if (loadItem.id == item || loadItem.src == item) {
                                this._currentLoads.splice(i,1)[0].cancel();
                                itemsWereRemoved = true;
                                break;
                            }
                        }
                    }
                }

                // 如果移除操作是在一个加载进程中触发的，那么就尝试加载下一个文件。
                if (itemsWereRemoved) {
                    this._loadNext();
                }
            }
        },

        /**
         * 停止所有打开了的加载进程、毁掉所有已加载的项、重置队列，可以调用{{#crossLink "AbstractLoader/load"}}{{/crossLink}}把所有项重新加载一边了。
         * 队列里面的项不会被移除，如果你想要移除它们，请调用{{#crossLink "LoadQueue/remove"}}{{/crossLink}}
         * 或<b>{{#crossLink "LoadQueue/removeAll"}}{{/crossLink}}</b>方法。
         * 
         * @method reset
         */
        reset: function() {
            this.close();
            for (var n in this._loadItemsById) {
                this._disposeItem(this._loadItemsById[n]);
            }

            //重置队列至开始状态
            var a = [];
            for (i=0,l=this._loadQueueBackup.length;i<l;i++) {
                a.push(this._loadQueueBackup[i].getItem());
            }

            this.loadManifest(a, false);
        },
        
        /**
         * 注册一个插件。插件可以对应所有的类型（音频、图片等等），也可以对应指定的文件扩展名（png、mp3等等）。一般情况下，每种类型/扩展名只能对应一个插件。
         * 插件必须返回一个包含以下属性的对象：
         * <ul><li>callback: 调用的方法</li>
         *     <li>types: 可处理的类型数组</li>
         *     <li>extensions: 可处理的文件扩展名的数组，这个会被指定的类型处理方法覆盖掉。</li></ul>
         * 注：即使一个插件可以适配某种类型和扩展名的处理方法，但是当两者存在时，类型处理方法的优先级较高而且仅仅只有类型的处理方法会被触发。例如你有一个处理类型为音频的方法，并且同时有
         * 一个处理扩展名为mp3的方法，但是当一个mp3文件被加载时，仅仅只有类型的方法会被触发。
         * 
         * @method installPlugin
         * @param {Function} plugin 需要安装的插件
         */
        installPlugin: function(plugin) {
            if (plugin == null || plugin.getPreloadHandlers == null) { return; }
            var map = plugin.getPreloadHandlers();
            if (map.types != null) {
                for (var i=0, l=map.types.length; i<l; i++) {
                    this._typeCallbacks[map.types[i]] = map.callback;
                }
            }
            if (map.extensions != null) {
                for (i=0, l=map.extensions.length; i<l; i++) {
                    this._extensionCallbacks[map.extensions[i]] = map.callback;
                }
            }
        },

        /**
         * 设置可同时存在的最大连接数。注：浏览器和服务器都有一个固定的最大连接数，所以任何新增的链接在浏览器打开连接前都只能保持等待状态；在使用标签进行加载的时候，
         * 且<code>maintainScriptOrder=true</code>，由于浏览器的限制，每次只能加载一个脚本。
         * 
         * @method setMaxConnections
         * @param {Number} value 允许可同时存在的加载数，默认为任何时刻都只能存在单个连接。
         */
        setMaxConnections: function (value) {
            this._maxConnections = value;
            if (!this._paused) {
                this._loadNext();
            }
        },

        /**
         * 加载单个文件。需要一次性加载多个文件，请使用{{#crossLink "LoadQueue/loadManifest"}}{{/crossLink}}方法。
         * 注：待加载的文件通常是添加到当前加载队列的，因此使用这个方法加载很多文件的话，那可能需要消耗很多时间。需要先清空队列的话，
         * 请使用{{#crossLink "AbstractLoader/close"}}{{/crossLink}}方法。
         * 
         * @method loadFile
         * @param {Object | String} file 要加载的文件对象或路径。一个文件可以是
         * <ol>
         *     <li>一个指向目标资源的字符串路径。注：这种形式的加载会在后台把目标转成一个对象</li>
         *     <li>或者是一个包含以下内容的对象：<ul>
         *         <li>src: 需要进行加载的文件源。这个属性的<b>必须的</b>。这个源可以是一个字符串（推荐），或者是一个HTML标签。</li>
         *         <li>type: 待加载文件的类型(图片、音频、json等等)。PreloadJS会根据文件的后缀自动判断文件类型。所有支持的类型会在PreloadJS里面定义，例如PreloadJS.IMAGE。
         *         建议在使用不标准的文件URI（例如.php）时指定具体的文件类型。</li>
         *         <li>id: 用来引用被加载对象的特征字符串。</li>
         *         <li>data: 一个包含了被加载对象的任意数据对象。</li>
         *     </ul>
         * </ol>
         * 
         * @param {Boolean} [loadNow=true] 马上加载（true）或等候加载（false）。默认为true。
         * 如果使用了{{#crossLink "LoadQueue/setPaused"}}{{/crossLink}}暂停队列的话，且这个值为true，那么队列会自动重新开始。
         */
        loadFile: function(file, loadNow) {
            if (file == null) {
                this._sendError({text: "PRELOAD_NO_FILE"});
                return;
            }
            this._addItem(file);

            if (loadNow !== false) {
                this.setPaused(false);
            }
        },

        /**
         * 加载一个文件列表。若要加载单个文件，请使用loadFile方法。在列表里面的文件会被按顺序进行请求，但是如果使用{{#crossLink "LoadQueue/setMaxConnections"}}{{/crossLink}}
         * 方法把最大连接数设为1，那就不一定会按照原来的顺序完成加载。只要把<code>loadQueue.maintainScriptOrder</code>设为true（这个是默认值），脚本就会按顺序进行加载。
         * 注：待加载的文件通常是添加到当前加载队列的，因此使用这个方法加载很多文件的话，那可能需要消耗很多时间。需要先清空队列的话，
         * 请使用{{#crossLink "AbstractLoader/close"}}{{/crossLink}}方法。
         * 
         * @method loadManifest
         * @param {Array} manifest 需要加载的文件列表。每个文件可以是
         * <ol>
         *     <li>一个指向目标资源的字符串路径。注：这种形式的加载会在后台把目标转成一个对象</li>
         *     <li>或者是一个包含以下内容的对象：<ul>
         *         <li>src: 需要进行加载的文件源。这个属性的<b>必须的</b>。这个源可以是一个字符串（推荐），或者是一个HTML标签。</li>
         *         <li>type: 待加载文件的类型(图片、音频、json等等)。PreloadJS会根据文件的后缀自动判断文件类型。所有支持的类型会在PreloadJS里面定义，例如PreloadJS.IMAGE。
         *         建议在使用不标准的文件URI（例如.php）时指定具体的文件类型。</li>
         *         <li>id: 用来引用被加载对象的特征字符串。</li>
         *         <li>data: 一个包含了被加载对象的任意数据对象。</li>
         *     </ul>
         * </ol>
         * 
         * @param {Boolean} [loadNow=true] 马上加载（true）或等候加载（false）。默认为true。
         * 如果使用了{{#crossLink "LoadQueue/setPaused"}}{{/crossLink}}暂停队列的话，且这个值为true，那么队列会自动重新开始。
         */
        loadManifest: function(manifest, loadNow) {
            var data = null;

            if (manifest instanceof Array) {
                if (manifest.length == 0) {
                    this._sendError({text: "PRELOAD_MANIFEST_EMPTY"});
                    return;
                }
                data = manifest;
            } else {
                if (manifest == null) {
                    this._sendError({text: "PRELOAD_MANIFEST_NULL"});
                    return;
                }
                data = [manifest];
            }

            for (var i=0, l=data.length; i<l; i++) {
                this._addItem(data[i]);
            }

            if (loadNow !== false) {
                this.setPaused(false);
            }
        },

        // 覆盖AbstractLoader里面的抽象方法
        load: function() {
            this.setPaused(false);
        },

        /**
         * 通过加载过程时指定的“id”或“src”值来查找一个待加载的项。
         * 
         * @method getItem
         * @param {String} value 待加载完项的<code>id</code>或<code>src</code>。
         * @return {Object} 通过使用{{#crossLink "LoadQueue/loadFile"}}{{/crossLink}}或{{#crossLink "LoadQueue/loadManifest"}}{{/crossLink}}
         * 方法进行初始化请求的待加载项。这个对象也会通过“fileload”事件的“item”属性中返回。
         */
        getItem: function(value) {
            return this._loadItemsById[value] || this._loadItemsBySrc[value];
        },

        /**
         * 通过加载过程时指定的“id”或“src”值来查找一个已加载完的项。
         * 
         * @method getResult
         * @param {String} value 待加载完项的<code>id</code>或<code>src</code>。
         * @param {Boolean} [rawResult=false] 返回纯数据格式的结果而不是格式化后的结果。这应用在那些通过XHR加载的内容如脚本、XML、CSS和图片。如果没有纯数据格式结果，则会返回格式化后的结果。
         * @return {Object} 一个包含了加载内容的结果对象，如：
         * <ul>
         *      <li>一个针对图片的image标签(&lt;image /&gt;)</li>
         *      <li>一个针对音频的audio标签(&lt;audio &gt;)</li>
         *      <li>一个针对JavaScript的script标签(&lt;script&gt;&lt;/script&gt;)，注：通过标签加载完成的脚步会被添加到HTML的头部。</li>
         *      <li>一个针对CSS的style标签(&lt;style&gt;&lt;/style&gt;)</li>
         *      <li>纯文本</li>
         *      <li>被定义为JSON的Javascript对象</li>
         *      <li>一个XML文档</li>
         *      <li>一个由XHR加载的二进制数组缓存</li>
         * </ul>
         * 这个对象也会通过“fileload”事件中的“item”属性返回。如果没有纯数据格式结果，则会返回格式化后的结果。
         */
        getResult: function(value, rawResult) {
            var item = this._loadItemsById[value] || this._loadItemsBySrc[value];
            if (item == null) { return null; }
            var id = item.id;
            if (rawResult && this._loadedRawResults[id]) {
                return this._loadedRawResults[id];
            }
            return this._loadedResults[id];
        },

        /**
         * 暂停或重启当前加载进程。正在活动的项不会被取消，不过后续队列中的项目在活动项加载完之前是不会被处理的。LoadQueues默认时不是暂停的。
         * 
         * @method setPaused
         * @param {Boolean} value 队列是否会被暂停。
         */
        setPaused: function(value) {
            this._paused = value;
            if (!this._paused) {
                this._loadNext();
            }
        },

        // 重写AbstractLoader中的抽象方法。
        close: function() {
            while (this._currentLoads.length) {
                this._currentLoads.pop().cancel();
            }
            this._scriptOrder.length = 0;
            this._loadedScripts.length = 0;
            this.loadStartWasDispatched = false;
        },
        
        toString: function() {
            return "[PreloadJS LoadQueue]";
        },

    //受保护的方法
        /**
         * 往队列添加一个待加载项。那些项会被格式化成一个有用的对象，该对象包含了加载时所需要用到的一切属性。加载队列会被处理预加载操作的加载器实例（而不是用户通过传参方式传入的待加载项）填充。
         * 你可以使用{{#crossLink "LoadQueue.getItem"}}{{/crossLink}}方法，通过传入id或src来查找加载项。
         * 
         * @method _addItem
         * @param {String|Object} value 需要添加到队列的待加载项。
         * @private
         */
        _addItem: function(value) {
            var item = this._createLoadItem(value);
            if (item == null) { return; } // 某些时候某些插件或类型会被忽略掉。
            var loader = this._createLoader(item);
            if (loader != null) {
                this._loadQueue.push(loader);
                this._loadQueueBackup.push(loader);

                this._numItems++;
                this._updateProgress();

                // 只关心使用XHR加载脚本时的顺序。标签每次只会加载一个。
                if (this.maintainScriptOrder
                        && item.type == LoadQueue.JAVASCRIPT
                        && loader instanceof XHRLoader) {
                    this._scriptOrder.push(item);
                    this._loadedScripts.push(null);
                }
            }
        },

        /**
         * 创建一个改善过的加载项，其包含了所有所需的属性（源路径、类型、扩展名、标签）。加载项的类型是由浏览器支持的情况所决定的，那些所需属性是基于文件类型和开发者设定所决定的。例如，
         * XHR只提供给那些新版浏览器所支持的文件类型使用。
         * 
         * 在加载项返回前，任何安装了的用来处理类型或扩展名的插件会被调起，用来取代当前加载项。
         * 
         * @method _createLoadItem
         * @param {String | Object | HTMLAudioElement | HTMLImageElement} value 待加载项。
         * @return {Object} 加载器实例。
         * @private
         */
        _createLoadItem: function(value) {
            var item = null;

            // 创建/修改一个加载项
            switch(typeof(value)) {
                case "string":
                    item = {
                        src: value
                    }; break;
                case "object":
                    if (window.HTMLAudioElement && value instanceof HTMLAudioElement) {
                        item = {
                            tag: value,
                            src: item.tag.src,
                            type: LoadQueue.SOUND
                        };
                    } else {
                        item = value;
                    }
                    break;
                default:
                    break;
            }

            var match = this._parseURI(item.src);
            if (match != null) { item.ext = match[5]; }
            if (item.type == null) {
                item.type = this._getTypeByExtension(item.ext);
            }

            // 为加载项创建一个标签。这个确保在完成时有东西可以加载或放置。
            if (item.tag == null) {
                item.tag = this._createTag(item.type);
            }

            // 如果没有id，设置一个。
            if (item.id == null || item.id == "") {
                item.id = item.src;
            }

            // 给插件们一个修改loadItem的机会
            var customHandler = this._typeCallbacks[item.type] || this._extensionCallbacks[item.ext];
            if (customHandler) {
                var result = customHandler(item.src, item.type, item.id, item.data);
                // 插件会去处理加载操作，所以直接忽略掉。
                if (result === false) {
                    return null;

                // 正常加载
                } else if (result === true) {
                    // 不做任何事

                // 结果是一个加载器的类
                } else {
                    if (result.src != null) { item.src = result.src; }
                    if (result.id != null) { item.id = result.id; }
                    if (result.tag != null && result.tag.load instanceof Function) { // 有我们需要加载的项
                        item.tag = result.tag;
                    }
                    if (result.completeHandler != null) {
                        item.completeHandler = result.completeHandler;
                    }  // 当我们完成加载时需要回调这个函数
                }

                // 允许类型重写
                if (result.type) { item.type = result.type; }

                // 类型转换后需要更新扩展名
                match = this._parseURI(item.src);
                if (match != null) { item.ext = match[5]; }
            }

            // 保存加载项以便于查找，同时也方便后续的清理工作。
            this._loadItemsById[item.id] = item;
            this._loadItemsBySrc[item.src] = item;

            return item;
        },

        /**
         * 为加载项创建一个加载器。
         * 
         * @method _createLoader
         * @param {Object} item 一个可以用来生成加载器的格式化加载项。
         * @return {AbstractLoader} 一个可以用来加载内容的加载器。
         * @private
         */
        _createLoader: function(item) {
            // 一开始，尝试使用已提供或已支持的XHR模式：
            var useXHR = this.useXHR;

            // 判断哪些需要类型需要置换XHR的使用：
            switch (item.type) {
                case LoadQueue.JSON:
                case LoadQueue.XML:
                case LoadQueue.TEXT:
                    useXHR = true; // 通常使用XHR2加载文本或XML
                    break;
                case LoadQueue.SOUND:
                    useXHR = false; // 绝对不用XHR加载音频。WebAudio会提供它的专用加载器的。
                    break;
                // 注：图片、样式、脚本和SVG都可以使用标签或XHR加载。
            }

            if (useXHR) {
                return new XHRLoader(item);
            } else {
                return new TagLoader(item);
            }
        },

        /**
         * 加载队列中的下一个项。如果队列为空（所有项已经加载完），那么“complete”事件会被触发。队列会填满任何的空闲的进程，
         * 空闲进程数取决于通过{{#crossLink "LoadQueue.setMaxConnections"}}{{/crossLink}}
         * 方法设置的指定最大连接数。唯一的例外是使用标签加载脚本时，需要逐个进行加载来维持加载的顺序。
         * 
         * @method _loadNext
         * @private
         */
        _loadNext: function() {
            if (this._paused) { return; }

            // 仅当首个文件加载完毕时分派loadStart事件
            if (!this._loadStartWasDispatched) {
                this._sendLoadStart();
                this._loadStartWasDispatched = true;
            }

            if (this._numItems == this._numItemsLoaded) {
                this.loaded = true;
                this._sendComplete();
                if (this.next && this.next.load) {
                    this.next.load();
                    //TODO: 测试。这个是从原来的load.apply转换过来的
                }
            }

            // 需要按序循环加载。
            for (var i=0, l=this._loadQueue.length; i<l; i++) {
                if (this._currentLoads.length >= this._maxConnections) { break; }
                var loader = this._loadQueue[i];

                // 用来判断当前是否只有一个在加载
                if (this.maintainScriptOrder
                        && loader instanceof TagLoader
                        && loader.getItem().type == LoadQueue.JAVASCRIPT) {
                    if (this._currentlyLoadingScript) { continue; } // 队列往后的项不能是脚本。
                    this._currentlyLoadingScript = true;
                }
                this._loadQueue.splice(i, 1);
                this._loadItem(loader);
                i--; l--;
            }
        },

        /**
         * 开始加载一个项。那些事件只会在加载开始之后被添加到加载器里面。
         * 
         * @method _loadItem
         * @param {AbstractLoader} 需要启动的加载器实例。一般情况下，这个会是XHRLoader或者TagLoader。
         * @private
         */
        _loadItem: function(loader) {
            loader.addEventListener("progress", createjs.proxy(this._handleProgress, this));
            loader.addEventListener("complete", createjs.proxy(this._handleFileComplete, this));
            loader.addEventListener("error", createjs.proxy(this._handleFileError, this));
            this._currentLoads.push(loader);
            loader.load();
        },

        /**
         * 当加载器遇到错误时触发的回调方法。队列会持续进行加载直至<code>stopOnError</code>被设置为<code>true</code>。
         * 
         * @method _handleFileError
         * @param {Object} event 错误事件，包含了相关的错误信息。
         * @private
         */
        _handleFileError: function(event) {
            var loader = event.target;
            this._numItemsLoaded++;
            this._updateProgress();

            var event = {
                //TODO: 添加错误提示？
                item: loader.getItem()
            };
            this._sendError(event);

            if (!this.stopOnError) {
                this._removeLoadItem(loader);
                this._loadNext();
            }
        },

        /**
         * 某个项加载完毕时触发的回调方法。我们设定它是完全加载完毕的，已经解析成可以马上使用，并且在加载项的“result”属性是可用的。已解析项（例如JSON、XML、CSS和Javascript等等）的纯文本
         * 结果对“rawResult”事件是可用的，并且可以通过使用{{#crossLink "LoadQueue/getResult"}}{{/crossLink}}方法进行查找。
         * 
         * @method _handleFileComplete
         * @param {Object} event 加载器中的事件对象。
         * @private
         */
        _handleFileComplete: function(event) {
            var loader = event.target;
            var item = loader.getItem();

            this._loadedResults[item.id] = loader.getResult();
            if (loader instanceof XHRLoader) {
                this._loadedRawResults[item.id] = loader.getResult(true);
            }

            this._removeLoadItem(loader);

            // 确保脚本按照正确的顺序加载
            if (this.maintainScriptOrder && item.type == LoadQueue.JAVASCRIPT) {
                if (loader instanceof TagLoader) {
                    this._currentlyLoadingScript = false;
                } else {
                    this._loadedScripts[this._scriptOrder.indexOf(item)] = item;
                    this._checkScriptLoadOrder(loader);
                    return;
                }
            }

            this._processFinishedLoad(item);
        },

        _processFinishedLoad: function(item) {
            // 这个是旧版本中的_handleFileTagComplete方法
            this._numItemsLoaded++;

            this._updateProgress();
            this._sendFileComplete(item);

            this._loadNext();
        },

        /**
         * 确保脚本按准确的顺序进行加载和分发。使用XHR时，脚本会按照添加的顺序保存在数组内，但是值为“null”。当它们加载完毕时，这个值会被设为加载的项，当它们被处理完毕并已
         * 分发出去时，这个值会被设为<code>true</code>。这个方法简单地循环了当前数组，并确保不会有任何已加载的项在某个<code>null</code>值的项之前被分派。
         * 
         * @method _checkScriptLoadOrder
         * @private
         */
        _checkScriptLoadOrder: function () {
            var l = this._loadedScripts.length;

            for (var i=0;i<l;i++) {
                var item = this._loadedScripts[i];
                if (item === null) { break; } // 正在加载中，不允许再往下执行。
                if (item === true) { continue; } // 已经完成，并已经被处理，继续。

                // 这个项已经完成了，并对下一个项进行分发。
                this._processFinishedLoad(item);
                this._loadedScripts[i] = true;
                i--; l--;
            }
        },

        /**
         * 一个加载项已经完成或被取消，并需要从加载队列中移除。
         * 
         * @method _removeLoadItem
         * @param {AbstractLoader} loader 需要移除的加载器实例。
         * @private
         */
        _removeLoadItem: function(loader) {
            var l = this._currentLoads.length;
            for (var i=0;i<l;i++) {
                if (this._currentLoads[i] == loader) {
                    this._currentLoads.splice(i,1); break;
                }
            }
        },

        /**
         * 处理加载项进度分派的回调方法。广播这个进度，并更新整个加载队列的进度。
         * 
         * @method _handleProgress
         * @param {Object} event 加载项中的progress事件
         * @private
         */
        _handleProgress: function(event) {
            var loader = event.target;
            this._sendFileProgress(loader.getItem(), loader.progress);
            this._updateProgress();
        },

        /**
         * 整体进度已经改变，因此确定新的进度并分发之。这个会在加载项分发进度或完成的时候改变。注：因为在加载项加载完以前我们不知道它的文件大小，且即使下载完我们也只可以获取到XHR加载的项的文件大小，
         * 这种情况下，我们为每个加载项定义了一个百分比（10项中的一项是10%），并且把加载完的进度添加到“已加载完毕的那些项”上。
         * 例如，有5/10 的项已经加载完了，且第6项已经完成20%，那么总体的进度是：<ul>
         *      <li>队列中5/10的项(50%)</li>
         *      <li>加上第6项的20%(10% × 20% = 2%)</li>
         *      <li>等于 52%</li></ul>
         * 
         * @method _updateProgress
         * @private
         */
        _updateProgress: function () {
            var loaded = this._numItemsLoaded / this._numItems; // 总的加载进度
            var remaining = this._numItems-this._numItemsLoaded;
            if (remaining > 0) {
                var chunk = 0;
                for (var i=0, l=this._currentLoads.length; i<l; i++) {
                    chunk += this._currentLoads[i].progress;
                }
                loaded += (chunk / remaining) * (remaining/this._numItems);
            }
            this._sendProgress(loaded);
        },

        /**
         * 清空某项的结果，释放它们的内存。主要是把加载完的项和结果从内部哈希中清除掉。
         * 
         * @method _disposeItem
         * @param {Object} item 预加载的项。
         * @private
         */
        _disposeItem: function(item) {
            delete this._loadedResults[item.id];
            delete this._loadedRawResults[item.id];
            delete this._loadItemsById[item.id];
            delete this._loadItemsBySrc[item.src];
        },

        /**
         * 创建一个HTML标签。这个放在LoadQueue而不是在{{#crossLink "TagLoader"}}{{/crossLink}}的原因是，不管我们如何加载数据，最终都需要在一个标签
         * 里面进行调用。
         * 
         * @method _createTag
         * @param {String} type 加载项的类型。开发人员传入的值，或者通过扩展名判断。
         * @return {HTMLImageElement|HTMLAudioElement|HTMLScriptElement|HTMLLinkElement|Object} 被创建的标签。注：这些标签不会被添加到HTML的主体上。
         * @private
         */
        _createTag: function(type) {
            var tag = null;
            switch (type) {
                case LoadQueue.IMAGE:
                    return document.createElement("img");
                case LoadQueue.SOUND:
                    tag = document.createElement("audio");
                    tag.autoplay = false;
                    // 注：type属性看上去并不重要
                    return tag;
                case LoadQueue.JAVASCRIPT:
                    tag = document.createElement("script");
                    tag.type = "text/javascript";
                    return tag;
                case LoadQueue.CSS:
                    if (this.useXHR) {
                        tag = document.createElement("style");
                    } else {
                        tag = document.createElement("link");
                    }
                    tag.rel  = "stylesheet";
                    tag.type = "text/css";
                    return tag;
                case LoadQueue.SVG:
                    if (this.useXHR) {
                        tag = document.createElement("svg");
                    } else {
                        tag = document.createElement("object");
                        tag.type = "image/svg+xml";
                    }
                    return tag;
            }
            return null;
        },

        /**
         * 通过常用的扩展名判断当前对象的类型。注：如果加载项没有一个常用的扩展名，可以把它的类型随着加载项传入。
         * 
         * @param {String} extension 用来判断类型的扩展名。
         * @return {String} 判断出来的类型（例如，<code>LoadQueue.IMAGE</code>）或者无法判断时会返回null。
         * @private
         */
        _getTypeByExtension: function(extension) {
            switch (extension) {
                case "jpeg":
                case "jpg":
                case "gif":
                case "png":
                case "webp":
                case "bmp":
                    return LoadQueue.IMAGE;
                case "ogg":
                case "mp3":
                case "wav":
                    return LoadQueue.SOUND;
                case "json":
                    return LoadQueue.JSON;
                case "xml":
                    return LoadQueue.XML;
                case "css":
                    return LoadQueue.CSS;
                case "js":
                    return LoadQueue.JAVASCRIPT;
                case 'svg':
                    return LoadQueue.SVG;
                default:
                    return LoadQueue.TEXT;
            }
        },

        /**
         * 分发一个fileprogress事件（并调用onFileProgress回调方法）。请查看<code>LoadQueue.fileprogress</code>事件获取事件负载的详细信息。
         * 
         * @method _sendFileProgress
         * @param {Object} item 正在被加载的项。
         * @param {Number} progress 被加载的项的进度（0-1）。
         * @protected
         */
        _sendFileProgress: function(item, progress) {
            if (this._isCanceled()) {
                this._cleanUp();
                return;
            }
            var event = {
                target: this,
                type: "fileprogress",
                progress: progress,
                loaded: progress,
                total: 1,
                item: item
            };
            this.dispatchEvent(event);
        },

        /**
         * 分发一个fileload事件（并调用onFileLoad回调方法）。请查看<code>LoadQueue.fileload</code>事件获取事件负载的详细信息。
         * 
         * @method _sendFileComplete
         * @param {Object} item 正在被加载的项。
         * @protected
         */
        _sendFileComplete: function(item) {
            if (this._isCanceled()) { return; }
            var event = {
                target: this,
                type: "fileload",
                item: item,
                result: this._loadedResults[item.id],
                rawResult: this._loadedRawResults[item.id]
            };

            // 这里调用一个实际加载项中指定的操作方法。一般情况下，SoundJS插件使用这个。
            if (item.completeHandler) {
                item.completeHandler(event);
            }

            this.dispatchEvent(event);
        }
    });
    
    /**
     * 超时时间，单位：毫秒。
     * @property LOAD_TIMEOUT
     * @type {Number}
     * @default 8000
     * @static
     */
    LoadQueue.LOAD_TIMEOUT = 8000;

// 预加载类型
    /**
     * 通用二进制类型。注：图片和音频会被作为二进制格式。
     * @property BINARY
     * @type {String}
     * @default binary
     * @static
     */
    LoadQueue.BINARY = "binary";

    /**
     * 预加载类型——css。CSS文件会加载到一个LINK或者STYLE标签内（这个依赖加载类型）
     * @property CSS
     * @type {String}
     * @default css
     * @static
     */
    LoadQueue.CSS = "css";

    /**
     * 预加载类型——图片，通常是png、gif、或jpg/jpeg。图片会加载到一个IMAGE标签内。
     * @property IMAGE
     * @type {String}
     * @default image
     * @static
     */
    LoadQueue.IMAGE = "image";

    /**
     * 预加载类型——js，通常扩展名是.js的文件。Javascript文件会加载到一个SCRIPT标签内。
     * @property JAVASCRIPT
     * @type {String}
     * @default javascript
     * @static
     */
    LoadQueue.JAVASCRIPT = "javascript";

    /**
     * 预加载类型——json，通常扩展名是.json的文件。JSON数据会被加载和解析到一个Javascript对象内。
     * @property JSON
     * @type {String}
     * @default json
     * @static
     */
    LoadQueue.JSON = "json";

    /**
     * 预加载类型——音频，通常是mp3、ogg或wav。音频会加载到一个AUDIO标签内。
     * @property SOUND
     * @type {String}
     * @default sound
     * @static
     */
    LoadQueue.SOUND = "sound";

    /**
     * 预加载类型——SVG。
     * @property SVG
     * @type {String}
     * @default svg
     * @static
     */
    LoadQueue.SVG = "svg";

    /**
     * 预加载类型——文本，这个也是默认的文件类型，假如当前类型无法确认时。文本会被作为纯文本格式加载。
     * @property TEXT
     * @type {String}
     * @default text
     * @static
     */
    LoadQueue.TEXT = "text";

    /**
     * 预加载类型——xml。XML会加载到一个XML的DOM里面。
     * @property XML
     * @type {String}
     * @default xml
     * @static
     */
    LoadQueue.XML = "xml";
    
    /**
     * 判断指定的类型是否能被作为二进制文件进行加载。一般情况下，只有图片或者被特指为“binary”的项才能以二进制的方式加载。注：音频<b>不是</b>二进制类型，因为我们不能以二进制形式加载完
     * 然后用audio标签进行播放。插件可以把待加载项的类型转换为二进制，以便确保它可以作为二进制被使用。二进制文件是使用XHR2方式加载的。
     * 
     * @method isBinary
     * @param {String} type 加载项的类型
     * @return 指定的类型是否二进制。
     * @private
     */
    LoadQueue.isBinary = function(type) {
        switch (type) {
            case LoadQueue.IMAGE:
            case LoadQueue.BINARY:
                return true;
            default:
                return false;
        }
    };
    
    // 一个用来判断当前浏览器、版本、操作系统和其他环境变量的附加模块。
    var BrowserDetect = function() {}

    BrowserDetect.init = function() {
        var agent = navigator.userAgent;
        BrowserDetect.isFirefox = (agent.indexOf("Firefox") > -1);
        BrowserDetect.isOpera = (window.opera != null);
        BrowserDetect.isChrome = (agent.indexOf("Chrome") > -1);
        BrowserDetect.isIOS = agent.indexOf("iPod") > -1 || agent.indexOf("iPhone") > -1 || agent.indexOf("iPad") > -1;
    }

    BrowserDetect.init();

    LoadQueue.BrowserDetect = BrowserDetect;
    
    // 帮助方法
    /**
     * 一个针对PreloadJS所有方法的函数代理。默认的情况下，JavaScript方法是不保证作用域的，因此把方法以回调的方式进行调用，可以把作用域维持在调用者的范围内。
     * 使用代理可以确保当前方法在准确的作用域内被调用。所有PreloadJS的内部回调方法都使用了这种方式。
     * 
     * @param {Function} method 被调用的函数
     * @param {Object} scope 调用方法的作用域对象
     * @param {mixed} [arg]* 被传入到回调方法的参数
     * @static
     * @private
     */
    createjs.proxy = function(method, scope) {
        var aArgs = Array.prototype.slice.call(arguments, 2);
        return function() {
            return method.apply(scope, Array.prototype.slice.call(arguments, 0).concat(aArgs));
        };
    }
    
    return LoadQueue;
});