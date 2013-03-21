/**
 * 一个使用XHR方式请求加载项的加载器，通常是XMLHttpRequest。在跨域请求的情况下会尽可能使用XDomainRequests，且当必要的时候，在老版本的IE上会退而用回ActiveX对象。
 * XHR请求会把内容作为文本或二进制数据进行加载，提供了进度和一致的完成事件，并且可以在加载过程中取消。
 * 注：在IE6或更早的浏览器上不支持XHR，并且不推荐跨域加载。
 * 
 * @class XHRLoader
 * @constructor
 * @param {Object} file 定义需要加载文件的对象。想了解支持文件属性的概貌，请查阅{{#crossLink "LoadQueue/loadFile"}}{{/crossLink}}。
 * @extends AbstractLoader
 */
xc.module.define("xc.createjs.XHRLoader", function(exports) {
    var AbstractLoader = xc.module.require("xc.createjs.AbstractLoader");
    
    var XHRLoader = AbstractLoader.extend({
        // 覆盖AbstractLoader中的抽象方法
        initialize: function (item) {
            this._item = item;
            if (!this._createXHR(item)) {
                //TODO: 抛异常？
            }
        },
        
      //受保护的属性
        /**
         * 用来加载内容的XHR引用。
         * 
         * @property _request
         * @type {XMLHttpRequest | XDomainRequest | ActiveX.XMLHTTP}
         * @private
         */
        _request: null,

        /**
         * 一个setTimeout的引用，这个是给那些不支持XHR的onTimeout事件的浏览器使用的（XHR level 1，代表：IE9）。
         * 
         * @property _loadTimeout
         * @type {Number}
         * @private
         */
        _loadTimeout: null,

        /**
         * 浏览器的XHR (XMLHTTPRequest) 版本。这里支持的版本是1和2。目前没有一个正式的方法来检测该版本号，因此我们以能力来作猜测。
         * 
         * @property _xhrLevel
         * @type {Number}
         * @default 1
         * @private
         */
        _xhrLevel: 1,

        /**
         * 已加载文件的结果。把这个值赋值给一个参数的意图是，不断去获取它的代价很高。这个属性值在文件加载完之前会一直为null。
         * 
         * @property _response
         * @type {mixed}
         * @private
         */
        _response: null,

        /**
         * 已加载文件的未经处理的结果。在大多数情况下，加载完的内容会被转化成一个HTML标签或者格式化过的对象，并且会被赋值给<code>result</code>属性，但是开发者可能
         * 仍然需要对加载后的裸数据进行处理。
         * 
         * @property _rawResponse
         * @type {String|Object}
         * @private
         */
        _rawResponse: null,
        
        /**
         * 获取加载后的结果。
         * 
         * @method getResult
         * @param {Boolean} [rawResult=false] 返回纯数据格式的结果而不是格式化后的结果。这应用在那些通过XHR加载的内容如脚本、XML、CSS和图片。如果没有纯数据格式结果，则会返回格式化后的结果。
         * @return {Object} 一个包含了加载内容的结果对象，如：
         * <ul>
         *      <li>一个针对图片的image标签(&lt;image /&gt;)</li>
         *      <li>一个针对JavaScript的script标签(&lt;script&gt;&lt;/script&gt;)，注：通过标签加载完成的脚步会被添加到HTML的头部。</li>
         *      <li>一个针对CSS的style标签(&lt;style&gt;&lt;/style&gt;)</li>
         *      <li>纯文本</li>
         *      <li>被定义为JSON的Javascript对象</li>
         *      <li>一个XML文档</li>
         *      <li>一个由XHR加载的二进制数组缓存</li>
         * </ul>
         * 注：如果请求的是纯数据结果，但是没有找到，就会把格式化的结果返回。
         */
        getResult: function (rawResult) {
            if (rawResult && this._rawResponse) {
                return this._rawResponse;
            }
            return this._response;
        },

        // 覆盖AbstractLoader中的抽象方法
        cancel: function () {
            this.canceled = true;
            this._clean();
            this._request.abort();
        },

        // 覆盖AbstractLoader中的抽象方法
        load: function () {
            if (this._request == null) {
                this._handleError();
                return;
            }

            //事件
            this._request.onloadstart = createjs.proxy(this._handleLoadStart, this);
            this._request.onprogress = createjs.proxy(this._handleProgress, this);
            this._request.onabort = createjs.proxy(this._handleAbort, this);
            this._request.onerror = createjs.proxy(this._handleError, this);
            this._request.ontimeout = createjs.proxy(this._handleTimeout, this);
            
            // 如果我们没有XHR2，就设置一个超时处理
            if (this._xhrLevel == 1) {
                this._loadTimeout = setTimeout(createjs.proxy(this._handleTimeout, this), createjs.LoadQueue.LOAD_TIMEOUT);
            }

            // 注：不一定所有的浏览器都有onload操作（早期的FF和IE），用onReadyStateChange来代替。
            this._request.onload = createjs.proxy(this._handleLoad, this);
            if (this._request.onreadystatechange) {
                this._request.onreadystatechange = this._handleReadyStateChange(this);
            }

            // 某些时候可能响应的是404，特别是那些跨域的请求（这个在Chrome下面是捕获不到的）。
            try {
                this._request.send();
            } catch (error) {
                this._sendError({source:error});
            }
        },
        
        toString: function () {
            return "[PreloadJS XHRLoader]";
        },

        // 受保护的方法
        /**
         * XHR发出的总体进度。
         * 
         * @method _handleProgress
         * @param {Object} event XHR的progress事件。
         * @private
         */
        _handleProgress: function (event) {
            if (event.loaded > 0 && event.total == 0) {
                return; // 某些时候可能没有“total”的值，忽略progress事件就行了。
            }
            this._sendProgress({loaded:event.loaded, total:event.total});
        },

        /**
         * XHR发出了加载开始的指令。
         * 
         * @method _handleLoadStart
         * @param {Object} event XHR的loadStart事件。
         * @private
         */
        _handleLoadStart: function (event) {
            clearTimeout(this._loadTimeout);
            this._sendLoadStart();
        },

        /**
         * XHR发出了abort事件的指令。
         * 
         * @method handleAbort
         * @param {Object} event XHR的abort事件。
         * @private
         */
        _handleAbort: function (event) {
            this._clean();
            this._sendError();
        },

        /**
         * XHR发出了error事件的指令。
         * 
         * @method _handleError
         * @param {Object} event XHR的error事件。
         * @private
         */
        _handleError: function (event) {
            this._clean();
            this._sendError();
        },

        /**
         * XHR发出了开始状态更改的指令。
         * 注：那些相对较旧的浏览器（IE7/8）不提供onload事件，因此我们必须监控readyStateChange来判断文件是否已经加载完。
         * 
         * @method _handleReadyStateChange
         * @param {Object} event XHR的readyStateChange事件。
         * @private
         */
        _handleReadyStateChange: function (event) {
            if (this._request.readyState == 4) {
                this._handleLoad();
            }
        },

        /**
         * XHR请求完成。这个是被XHR请求直接调用的，或者是通过监控readyStateChange的<code>request.readyState == 4</code>时触发的。只有第一次调用这个
         * 方法时，才会被受理。
         * 
         * @method _handleLoad
         * @param {Object} event  XHR的load事件。
         * @private
         */
        _handleLoad: function (event) {
            if (this.loaded) {
                return;
            }
            this.loaded = true;

            if (!this._checkError()) {
                this._handleError();
                return;
            }

            this._response = this._getResponse();
            this._clean();
            var isComplete = this._generateTag();
            if (isComplete) {
                this._sendComplete();
            }
        },

        /**
         * XHR请求超时了。这个是被XHR请求直接调用的，或者通过<code>setTimeout</code>的回调处理的。
         * 
         * @method _handleTimeout
         * @param {Object} [event] XHR的timeout事件。这个在setTimeout的回调触发时会偶尔为空。
         * @private
         */
        _handleTimeout: function (event) {
            this._clean();
            this._sendError({reason:"PRELOAD_TIMEOUT"});
        },

        /**
         * 判断当前的加载是否存在错误。这个为问题代码提供请求状态的检查。
         * 注：这个不会对实际的响应进行检查。一般情况下，它只检查404或0代码。
         * 
         * @method _checkError
         * @return {Boolean} 请求的状态是否返回错误代码。
         * @private
         */
        _checkError: function () {
            var status = parseInt(this._request.status);

            switch (status) {
                case 404:   // 不存在
                case 0:     // 未加载
                    return false;
            }
            return true;
        },

        /**
         * 验证请求结果。不同的浏览器有不同的方法，在某些浏览器下处理会抛出异常。如果这里没有返回，那么<code>_response</code>属性必然为空。
         * 
         * @method _getResponse
         * @private
         */
        _getResponse: function () {
            if (this._response != null) {
                return this._response;
            }

            if (this._request.response != null) {
                return this._request.response;
            }

            // Android 2.2使用.responseText
            try {
                if (this._request.responseText != null) {
                    return this._request.responseText;
                }
            } catch (e) {
            }

            // 正在加载XML的时候，IE9不会返回.response，它会返回responseXML.xml
            //TODO: TEST
            try {
                if (this._request.responseXML != null) {
                    return this._request.responseXML;
                }
            } catch (e) {
            }
            return null;
        },

        /**
         * 创建一个XHR请求。根据一系列的因素，我们会获得不同的结果。
         * <ol><li>某些浏览器跨域加载时会得到<code>XDomainRequest</code>。</li>
         *      <li>如果可以的话，创建XMLHttpRequest。</li>
         *      <li>旧版的IE会使用ActiveX.XMLHTTP对象。</li>
         *      <li>可能的情况下，文本结果会覆盖MIME类型。</li>
         *      <li>在某些浏览器下，跨域的请求会发送本地的请求头。</li>
         *      <li>二进制的请求会把响应类型设为“arraybuffer”</li></ol>
         * 
         * @method _createXHR
         * @param {Object} item 将要被加载的请求项。
         * @return {Boolean} XHR或类似的请求是否创建成功。
         * @private
         */
        _createXHR: function (item) {
            // 检查是否跨域请求。我们无法完全支持，不过会尽量尝试。
            var target = document.createElement("a");
            target.href = item.src;
            var host = document.createElement("a");
            host.href = location.href;
            var crossdomain = (target.hostname != "") && (target.port != host.port 
                || target.protocol != host.protocol || target.hostname != host.hostname);

            // 创建请求。无论我们支持什么，返回什么。
            var req = null;
            if (crossdomain && window.XDomainRequest) {
                req = new XDomainRequest(); // 注：如果不是跨域请求，IE9会失败。
            } else if (window.XMLHttpRequest) { // 旧版的IE使用不同的方法。
                req = new XMLHttpRequest();
            } else {
                try {
                    req = new ActiveXObject("Msxml2.XMLHTTP.6.0");
                } catch (e) {
                    try {
                        req = new ActiveXObject("Msxml2.XMLHTTP.3.0");
                    } catch (e) {
                        try {
                            req = new ActiveXObject("Msxml2.XMLHTTP");
                        } catch (e) {
                            return false;
                        }
                    }
                }
            }

            // IE9不支持overrideMimeType，因此我们需要先检查一下。
            if (item.type == createjs.LoadQueue.TEXT && req.overrideMimeType) {
                req.overrideMimeType("text/plain; charset=x-user-defined");
            }

            // 判断XHR的级别。
            this._xhrLevel = (typeof req.responseType === "string") ? 2 : 1;

            // 开始请求。如果支持跨域，则设置一个标志位（只在XHR的级别为1的情况下）。
            req.open("GET", item.src, true);
            if (crossdomain && req instanceof XMLHttpRequest && this._xhrLevel == 1) {
                req.setRequestHeader("Origin", location.origin);
            }

            // 二进制的加载方式是不一样的。
            if (createjs.LoadQueue.isBinary(item.type)) {
                req.responseType = "arraybuffer";
            }

            this._request = req;
            return true;
        },

        /**
         * 请求完成（或失败，或被取消），需要被清除掉。
         * 
         * @method _clean
         * @private
         */
        _clean: function () {
            clearTimeout(this._loadTimeout);

            var req = this._request;
            req.onloadstart = null;
            req.onprogress = null;
            req.onabort = null;
            req.onerror = null;
            req.onload = null;
            req.ontimeout = null;
            req.onloadend = null;
            req.onreadystatechange = null;
        },

        /**
         * 为那些可以被标签表示的加载项生成一个标签。例如，image、script和link。这个同样也可以用来处理XML和SVG对象。
         * 
         * @method _generateTag
         * @return {Boolean} 是否已生成tag且已经为实例化做好准备了。如果仍然需要处理，会返回false。
         * @private
         */
        _generateTag: function () {
            var type = this._item.type;
            var tag = this._item.tag;

            switch (type) {
                // 注：图片需要等待onload事件的触发，同时也会使用到缓存。
                case createjs.LoadQueue.IMAGE:
                    tag.onload = createjs.proxy(this._handleTagReady, this);
                    tag.src = this._item.src;

                    this._rawResponse = this._response;
                    this._response = tag;
                    return false; // 首先需要得到一个onload事件

                case createjs.LoadQueue.JAVASCRIPT:
                    tag = document.createElement("script");
                    tag.text = this._response;

                    this._rawResponse = this._response;
                    this._response = tag;
                    return true;

                case createjs.LoadQueue.CSS:
                    // 或许需要有条件地使用？
                    var head = document.getElementsByTagName("head")[0]; //注：这个在IE6/7/8下不可用
                    head.appendChild(tag);

                    if (tag.styleSheet) { // IE
                        tag.styleSheet.cssText = this._response;
                    } else {
                        var textNode = document.createTextNode(this._response);
                        tag.appendChild(textNode);
                    }

                    this._rawResponse = this._response;
                    this._response = tag;
                    return true;

                case createjs.LoadQueue.XML:
                    var xml = this._parseXML(this._response, "text/xml");
                    this._response = xml;
                    return true;

                case createjs.LoadQueue.SVG:
                    var xml = this._parseXML(this._response, "image/svg+xml");
                    this._rawResponse = this._response;
                    tag.appendChild(xml.documentElement);
                    this._response = tag;
                    return true;

                case createjs.LoadQueue.JSON:
                    var json = {};
                    try {
                        json = JSON.parse(this._response);
                    } catch (error) {
                        // 记录错误日志？
                        json = null;
                    }

                    this._rawResponse = this._response;
                    this._response = json;
                    return true;

            }
            return true;
        },

        /**
         * 用DOM来解析XML。这个在加载XML或SVG时需要到。
         * 
         * @method _parseXML
         * @param {String} text 使用XHR加载的纯文本或XML。
         * @param {String} type XML的MIME类型。
         * @return {XML} 一个XML文档
         * @private
         */
        _parseXML: function (text, type) {
            var xml = null;
            if (window.DOMParser) {
                var parser = new DOMParser();
                xml = parser.parseFromString(text, type);
            } else { // IE
                xml = new ActiveXObject("Microsoft.XMLDOM");
                xml.async = false;
                xml.loadXML(text);
            }
            return xml;
        },

        /**
         * 一个已生成的准备好的标签。
         * 
         * @method _handleTagReady
         * @private
         */
        _handleTagReady: function () {
            this._sendComplete();
        }
    });
    
    return XHRLoader;
});