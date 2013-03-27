xc.module.define("xc.createjs.SpriteSheet", function(exports) {

    var EventDispatcher = xc.module.require("xc.createjs.EventDispatcher");
    var Rectangle = xc.module.require("xc.createjs.Rectangle");

    /**
     *
     * 封装一系列关于 sprite sheet 的属性和方法。一个 sprite sheet 就是一系列的图片（通常是动画帧），
     * 组合到一张大图片中（或许多张图片）。例如，一个动画由 8 张 100x100 的图片组成，就会组合成一个 400 x 200 的 sprite sheet。
     * 
     * 3个传递到 SpriteSheet 的数据定义了 3 个比较重要的信息:<ol>
     *    <li> 将要用到的图片 </li>
     *    <li> 帧定义，动画每一帧对应的图片位置。这些数据可以通过 2 种方式表示:
     *             作为一个规则的网格的顺序，同等大小的帧，或单独定义的，可变大小的帧，排列不规则的（非顺序）。</li>
     *    <li> 同样，动画可以在两个方面表示：作为一系列连续画幅，所定义的开始和结束帧[0,3]，或者作为一个帧列表[0,1,2,3]。</li>
     * </OL>
     *
     * <h4>SpriteSheet 格式</h4>
     *
     *      data = {
     *
     *          // 定义图片:
     *
     *          // 图片列表 或 图片 URI 列表。SpriteSheet 有预加载功能。
     *          // 该命令决定了帧对应的索引号。
     *          images: [image1, "path/to/image2.png"],
     *
     *          // 定义 FRAMES:
     *
     *          // 一种简单定义帧的方法，只需要定义真的大小，因为帧是连续的：
     *          // 定义帧的 width 或 height 和 可选项（包括 count regx regy）。 
     *          // 如果 count 省略了，那么将会根据图片的尺寸自动计算该值。
     *          frames: {width:64, height:64, count:20, regX: 32, regY:64},
     *
     *          // 或者，一种复杂的方法去定义帧，通过定义单位矩形。
     *          frames: [
     *              // x, y, width, height, imageIndex, regX, regY
     *              [0,0,64,64,0,32,64],
     *              [64,0,96,64,0]
     *          ],
     *
     *          // 定义动画:
     *
     *          // 简单动画定义。定义一个连续的帧。
     *          // 同样可以自选的定义下一帧的名称用于测序。
     *          // 设置 next 属性为 false 使得它一旦接收到 end 就会停止。
     *          animations: {
     *              // start, end, next, frequency
     *              run: [0,8],
     *              jump: [9,12,"run",2],
     *              stand: 13
     *          }
     *
     *          // 复杂的方法，通过索引指定动画中的每一帧
     *          animations: {
     *              run: {
     *                  frames: [1,2,3,3,2,1]
     *              },
     *              jump: {
     *                  frames: [1,4,5,6,1],
     *                  next: "run",
     *                  frequency: 2
     *              },
     *              stand: { frames: [7] }
     *          }
     *
     *          // 上面2种方法可以结合在一起使用，当然也可以单独使用一种:
     *          animations: {
     *              run: [0,8,true,2],
     *              jump: {
     *                  frames: [8,9,10,9,8],
     *                  next: "run",
     *                  frequency: 2
     *              },
     *              stand: 7
     *          }
     *      }
     *
     * <h4>例子</h4>
     * 定义一个简单的精灵表，一张以 50x50 为网格的图片 "sprites.jpg", “run” 动作从 0 到 4 帧。“jump” 动作从 5 到 8 帧，然后再接 “run”。
     * 
     *      var data = {
     *          images: ["sprites.jpg"],
     *          frames: {width:50, height:50},
     *          animations: {run:[0,4], jump:[5,8,"run"]}
     *      };
     *      var animation = new createjs.BitmapAnimation(data);
     *      animation.gotoAndPlay("run");
     *
     * @class SpriteSheet
     * @constructor
     * @param data
     * @uses EventDispatcher
     **/
    var SpriteSheet = EventDispatcher.extend({
        initialize: function(data) {
            var i, l, o, a;
            if (data == null) {
                return;
            }
            //解析图片:
            if (data.images && (l = data.images.length) > 0) {
                a = this._images = [];
                for (i = 0; i < l; i++) {
                    var img = data.images[i];
                    if (typeof img == "string") {
                        var src = img;
                        img = new Image();
                        img.src = src;
                    }
                    a.push(img);
                    if (!img.getContext && !img.complete) {
                        this._loadCount++;
                        this.complete = false;
                        (function(o) {
                            img.onload = function() {
                                o._handleImageLoad();
                            }
                        })(this);
                    }
                }
            }
            // parse frames:
            if (data.frames == null) { // nothing
            } else if (data.frames instanceof Array) {
                this._frames = [];
                a = data.frames;
                for (i = 0, l = a.length; i < l; i++) {
                    var arr = a[i];
                    this._frames.push({
                        image: this._images[arr[4] ? arr[4] : 0],
                        rect: new Rectangle(arr[0], arr[1], arr[2], arr[3]),
                        regX: arr[5] || 0,
                        regY: arr[6] || 0
                    });
                }
            } else {
                o = data.frames;
                this._frameWidth = o.width;
                this._frameHeight = o.height;
                this._regX = o.regX || 0;
                this._regY = o.regY || 0;
                this._numFrames = o.count;
                if (this._loadCount == 0) {
                    this._calculateFrames();
                }
            }
            // parse animations:
            if ((o = data.animations) != null) {
                this._animations = [];
                this._data = {};
                var name;
                for (name in o) {
                    var anim = {
                        name: name
                    };
                    var obj = o[name];
                    if (typeof obj == "number") { // single frame
                        a = anim.frames = [obj];
                    } else if (obj instanceof Array) { // simple
                        if (obj.length == 1) {
                            anim.frames = [obj[0]];
                        } else {
                            anim.frequency = obj[3];
                            anim.next = obj[2];
                            a = anim.frames = [];
                            for (i = obj[0]; i <= obj[1]; i++) {
                                a.push(i);
                            }
                        }
                    } else { // complex
                        anim.frequency = obj.frequency;
                        anim.next = obj.next;
                        var frames = obj.frames;
                        a = anim.frames = (typeof frames == "number") ? [frames] : frames.slice(0);
                    }
                    anim.next = (a.length < 2 || anim.next == false) ? null : (anim.next == null || anim.next == true) ? name : anim.next;
                    if (!anim.frequency) {
                        anim.frequency = 1;
                    }
                    this._animations.push(name);
                    this._data[name] = anim;
                }
            }
        },

        /**
         * 当所有图片加载完时触发该事件。
         * 注：这个事件只能在初始化 spritesheet 的时候没完全加载完图片时能绑定。
         * 所以必须在监听这个事件之前检查一下 sprite sheet 的 complete 属性。
         * Ex.
         * <pre><code>var sheet = new SpriteSheet(data);
         * if (!sheet.complete) {
         *  &nbsp; // not preloaded, listen for onComplete:
         *  &nbsp; sheet.addEventListener("complete", handler);
         * }</code></pre>
         * @event complete
         * @param {Object} target 要监听事件的对象。
         * @param {String} type 事件类型。
         */

        /**
         * 只读。指出所有的图片是否已经加载完成。
         *
         * @property complete
         * @type Boolean
         */
        complete: true,

        /**
         * @property _animations
         * @protected
         */
        _animations: null,

        /**
         * @property _frames
         * @protected
         */
        _frames: null,

        /**
         * @property _images
         * @protected
         */
        _images: null,

        /**
         * @property _data
         * @protected
         */
        _data: null,

        /**
         * @property _loadCount
         * @protected
         */
        _loadCount: 0,

        /**
         * @property _frameHeight
         * @protected
         */
        _frameHeight: 0,

        /**
         * @property _frameWidth
         * @protected
         */
        _frameWidth: 0,

        /**
         * @property _numFrames
         * @protected
         */
        _numFrames: 0,

        /**
         * @property _regX
         * @protected
         */
        _regX: 0,

        /**
         * @property _regY
         * @protected
         */
        _regY: 0,

        /**
         * 返回指定动画的帧的总数，当 animation 参数省略时，返回所有 srpite sheet 的帧的总数。
         * 
         * @method getNumFrames
         * @param {String} animation 指定要计算该动画的帧的总数。
         * @return {Number} 指定动画的帧的总数，当动画参数省略时，返回所有 srpite sheet 的帧的总数。
         */
        getNumFrames: function(animation) {
            if (animation == null) {
                return this._frames ? this._frames.length : this._numFrames;
            } else {
                var data = this._data[animation];
                if (data == null) {
                    return 0;
                } else {
                    return data.frames.length;
                }
            }
        },

        /**
         * 返回所有有效动画名字的字符串数组。
         * 
         * @method getAnimations
         * @return {Array} 所有有效动画名字的字符串数组。
         **/
        getAnimations: function() {
            return this._animations.slice(0);
        },

        /**
         * 返回一个指定的动画对象。
         * 返回的对象包括一个包括该对象所有帧的 id 数组，frequency 属性，
         * frames 属性，
         * name 属性，该动画名称，
         * 和 next 属性，该属性指定了下一个动画。
         * 该动画的频率属性，
         * 如果当一个动画循环播放，则 name 属性会等于 next 属性。
         * @method getAnimation
         * @param {String} name 要获取的动画对象的 name 属性。
         * @return {Object} 一个带有 frames, frequency, name, next 属性的对象。
         **/
        getAnimation: function(name) {
            return this._data[name];
        },

        /**
         * 返回一个对象，该对象包括图片资源和指定帧对应的矩形。
         * 返回的对象包括一个 image 属性，该属性持有指定帧对应的 image 属性，
         * 以及指定帧对应在图片内的矩形。
         * 
         * @method getFrame
         * @param {Number} frameIndex 帧的下标号。
         * @return {Object} 一个对象，该对象包括图片资源和指定帧对应的矩形。
         **/
        getFrame: function(frameIndex) {
            var frame;
            if (this.complete && this._frames && (frame = this._frames[frameIndex])) {
                return frame;
            }
            return null;
        },

        /**
         * 返回一个指定帧的范围的 Rectangle 实例。例如，一个 90 x 70 的帧，regX = 50 和 regY = 40，就会返回[x=-50, y=-40, width=90, height=70]。
         * 
         * @method getFrameBounds
         * @param {Number} frameIndex 帧的索引号。
         * @return {Rectangle} 一个指定帧的范围的 Rectangle 实例，当帧不存在或图片没有加载完全的时候，返回 null。
         **/
        getFrameBounds: function(frameIndex) {
            var frame = this.getFrame(frameIndex);
            return frame ? new Rectangle(-frame.regX, -frame.regY, frame.rect.width, frame.rect.height) : null;
        },

        /**
         * 返回该对象的字符串表示形式。
         * 
         * @method toString
         * @return {String} 该对象的字符串表示形式。
         **/
        toString: function() {
            return "[SpriteSheet]";
        },

        /**
         * 返回克隆后的 SpriteSheet 实例。
         * 
         * @method clone
         * @return {Bitmap} 克隆后的 SpriteSheet 实例。
         **/
        clone: function() {
            // TODO: there isn't really any reason to clone SpriteSheet instances, because they can be reused.
            var o = new SpriteSheet();
            o.complete = this.complete;
            o._animations = this._animations;
            o._frames = this._frames;
            o._images = this._images;
            o._data = this._data;
            o._frameHeight = this._frameHeight;
            o._frameWidth = this._frameWidth;
            o._numFrames = this._numFrames;
            o._loadCount = this._loadCount;
            return o;
        },

        /**
         * @method _handleImageLoad
         * @protected
         */
        _handleImageLoad: function() {
            if (--this._loadCount == 0) {
                this._calculateFrames();
                this.complete = true;
                this.dispatchEvent("complete");
            }
        },

        /**
         * @method _calculateFrames
         * @protected
         */
        _calculateFrames: function() {
            if (this._frames || this._frameWidth == 0) {
                return;
            }
            this._frames = [];
            var ttlFrames = 0;
            var fw = this._frameWidth;
            var fh = this._frameHeight;
            for ( var i = 0, imgs = this._images; i < imgs.length; i++) {
                var img = imgs[i];
                var cols = (img.width + 1) / fw | 0;
                var rows = (img.height + 1) / fh | 0;
                var ttl = this._numFrames > 0 ? Math.min(this._numFrames - ttlFrames, cols * rows) : cols * rows;
                for ( var j = 0; j < ttl; j++) {
                    this._frames.push({
                        image: img,
                        rect: new Rectangle(j % cols * fw, (j / cols | 0) * fh, fw, fh),
                        regX: this._regX,
                        regY: this._regY
                    });
                }
                ttlFrames += ttl;
            }
            this._numFrames = ttlFrames;
        }
    });

    return SpriteSheet;

});
