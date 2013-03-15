xc.module.define("xc.createjs.SpriteSheetBuilder", function(exports) {

    var EventDispatcher = xc.module.require("xc.createjs.EventDispatcher");
    var Rectangle = xc.module.require("xc.createjs.Rectangle");
    var SpriteSheet = xc.module.require("xc.createjs.SpriteSheet");

    /**
     * SpriteSheetBuilder允许你从任何正在显示的对象上创建图片精灵。它可以允许你把内容保存为矢量图形（体积更小的文件），并且在运行时作为图片精灵渲染出来，这样可以获得更好的性能。
     * 你可以同步或异步生成图片精灵，因此体积较大的图片精灵可以在不阻塞UI的前提下生成出来。
     * 注：那些最终生成的图片精灵“图片”其实是在canvas上的，并且他们的大小会被定义为2的次方，最大值设定为<code>maxWidth</code> 或 <code>maxHeight</code>。
     *
     * @class SpriteSheetBuilder
     * @extends EventDispatcher
     * @constructor
     */
    var SpriteSheetBuilder = EventDispatcher.extend({
        initialize: function() {
            this._frames = [];
            this._animations = {};
        },

        /**
         * 完成时分派的事件。
         *
         * @event complete
         * @param {Object} target 分派事件的对象。
         * @param {String} type 事件类型。
         */

        /**
         * 当异步进程启动时分派的事件。
         *
         * @event complete
         * @param {Object} target 分派事件的对象。
         * @param {String} type 事件类型。
         * @param {Number} progress 当前进度（0-1）。
         */

        /**
         * 最终生成的图片精灵（不是独立的帧哦）的最大宽度限制。推荐使用2的N次方值（例如：1024，2048，4096）.如果不能在最大范围内塞完那些帧，则需要另外创建一些图片了。
         *
         * @property maxWidth
         * @type Number
         * @default 2048
         */
        maxWidth: 2048,

        /**
         * 最终生成的图片精灵（不是独立的帧哦）的最大高度限制。推荐使用2的N次方值（例如：1024，2048，4096）.如果不能在最大范围内塞完那些帧，则需要另外创建一些图片了。
         *
         * @property maxHeight
         * @type Number
         * @default 2048
         */
        maxHeight: 2048,

        /**
         * 生成出来的图片精灵。在生成完毕前是一个null值。
         *
         * @property spriteSheet
         * @type SpriteSheet
         */
        spriteSheet: null,

        /**
         * 用来把所有帧描绘成精灵表单的缩放率。这个是用来乘以addFrame方法里面指定的缩放比例的。例如，这个可以用来生成一个针对特定设备来进行尺寸裁剪的图片精灵（例如：平板和手机）。
         *
         * @property defaultScale
         * @type Number
         * @default 1
         */
        scale: 1,

        /**
         * 帧与帧之间的间距。这个是用来保证内容不发生重叠的。
         *
         * @property padding
         * @type Number
         * @default 1
         */
        padding: 1,

        /**
         * 代表了这个生成器可以用的时间比例，值域是0.01至0.99。它的意思是生成器可以在每秒钟运作多少次。例如，这个值为0.3，则生成器在一秒内运作20次，每次生成要用接近15毫秒的时间（有效时间的30%，或0.3秒）。
         * 默认：0.3
         *
         * @property timeSlice
         * @type Number
         * @default 0.3
         */
        timeSlice: 0.3,

        /**
         * 只读。0或者1，代表了一次生成的进度，或者-1代表未开始生成。
         *
         * @property progress
         * @type Number
         * @default -1
         */
        progress: -1,

        /**
         * @property _frames
         * @protected
         * @type Array
         */
        _frames: null,

        /**
         * @property _animations
         * @protected
         * @type Array
         */
        _animations: null,

        /**
         * @property _data
         * @protected
         * @type Array
         */
        _data: null,

        /**
         * @property _nextFrameIndex
         * @protected
         * @type Number
         */
        _nextFrameIndex: 0,

        /**
         * @property _index
         * @protected
         * @type Number
         */
        _index: 0,

        /**
         * @property _timerID
         * @protected
         * @type Number
         */
        _timerID: null,

        /**
         * @property _scale
         * @protected
         * @type Number
         */
        _scale: 1,

        /**
         * 往{{#crossLink "SpriteSheet"}}{{/crossLink}}添加一个帧。注：在你没有执行{{#crossLink "SpriteSheetBuilder/build"}}{{/crossLink}}方法前，这个帧是不会被画出来的。
         * 那些带“setup”的可选参数允许你在画图发生前立即执行一个函数。例如，这个允许你多次添加一个单独的资源，但可以用它或者它的子集去修改并生成不同的帧。
         * 
         * 注：除了rexX/Y，资源里面的其他转换（如x, y, scale, rotate, alpha）会被忽略掉，如果要把转换应用到一个资源对象里面，并且想让它捕获到图片精灵里面的话，
         * 很简单，只需要放在一个{{#crossLink "Container"}}{{/crossLink}}内，并且把Container当作资源传进去就行。
         *
         * @method addFrame
         * @param {DisplayObject} source 需要当作帧进行绘画的{{#crossLink "DisplayObject"}}{{/crossLink}}资源
         * @param {Rectangle} [sourceRect] 一个{{#crossLink "Rectangle"}}{{/crossLink}}代表了需要画到帧的资源的一部分。
         * 如果没有指定，它会查找资源中的<code>getBounds</code>方法、bounds属性或者<code>nominalBounds</code>属性来使用。如果还是没有的话，这个帧会被忽略掉。
         * @param {Number} [scale=1] 可选参数。画图的缩放率。默认为1。
         * @param {Function} [setupFunction] 可选。画帧之前马上调用的函数。
         * @param {Array} [setupParams] 传递到setupFunction的参数。
         * @param {Object} [setupScope] 传递到setupFunction的作用对象。
         * @return {Number} 返回刚刚添加的帧的下标，如果该对象不能被识别则返回空。
         */
        addFrame: function(source, sourceRect, scale, setupFunction, setupParams, setupScope) {
            if (this._data) {
                throw SpriteSheetBuilder.ERR_RUNNING;
            }
            var rect = sourceRect || source.bounds || source.nominalBounds;
            if (!rect && source.getBounds) {
                rect = source.getBounds();
            }
            if (!rect) {
                return null;
            }
            scale = scale || 1;
            return this._frames.push({
                source: source,
                sourceRect: rect,
                scale: scale,
                funct: setupFunction,
                params: setupParams,
                scope: setupScope,
                index: this._frames.length,
                height: rect.height * scale
            }) - 1;
        },

        /**
         * 添加一个可以在创建图片精灵时包含进去的动画。
         *
         * @method addAnimation
         * @param {String} name 动画名称。
         * @param {Array} frames 组成动画的帧的下标数组。例如，[3,6,5]表示一个动画会按照3,6,5的顺序去渲染那些帧。
         * @param {String} [next] 该参数指定当上一个动画完成时需要继续播放的下一个动画。你也可以传一个false，表示该动画需要停止了。默认会循环播放相同的动画。
         * @param {Number} [frequency] 为动画指定一个帧的前进频率。例如，把它设置为2会使每帧运行次数提高。
         */
        addAnimation: function(name, frames, next, frequency) {
            if (this._data) {
                throw SpriteSheetBuilder.ERR_RUNNING;
            }
            this._animations[name] = {
                frames: frames,
                next: next,
                frequency: frequency
            };
        },

        /**
         * 这个方法会把MovieClip（动画剪辑）及其所有的帧和标识放进生成器。标识会被作为动画运行的标识，一个接一个运行。例如，如果在第0帧上有一个叫“foo”的标识，和一个在第10帧上的叫“bar”的标识，
         * 然后在一个有15帧的MovieClip上，它会添加一个从0至9帧的叫“foo”的动画，和一个从10到14帧的动画“bar”。
         * 注：这个方法会播放整个MovieClip，并把actionsEnabled参数设为false，在最后一帧结束。
         *
         * @method addMovieClip
         * @param {MovieClip} source 加到当前图片精灵的MovieClip资源。
         * @param {Rectangle} [sourceRect] 一个{{#crossLink "Rectangle"}}{{/crossLink}}代表了需要在帧上绘图的资源的一部分。如果没有指定，
         * 它会查找资源中的<code>getBounds</code>方法、<code>frameBounds</code>数组、bounds属性或者<code>nominalBounds</code>属性来使用。
         * 如果还是没有的话，这个MovieClip会被忽略掉。
         * @param {Number} [scale=1] 动画剪辑的缩放比例。
         */
        addMovieClip: function(source, sourceRect, scale) {
            if (this._data) {
                throw SpriteSheetBuilder.ERR_RUNNING;
            }
            var rects = source.frameBounds;
            var rect = sourceRect || source.bounds || source.nominalBounds;
            if (!rect && source.getBounds) {
                rect = source.getBounds();
            }
            if (!rect && !rects) {
                return null;
            }
            var baseFrameIndex = this._frames.length;
            var duration = source.timeline.duration;
            for ( var i = 0; i < duration; i++) {
                var r = (rects && rects[i]) ? rects[i] : rect;
                this.addFrame(source, r, scale, function(frame) {
                    var ae = this.actionsEnabled;
                    this.actionsEnabled = false;
                    this.gotoAndStop(frame);
                    this.actionsEnabled = ae;
                }, [i], source);
            }
            var labels = source.timeline._labels;
            var lbls = [];
            for ( var n in labels) {
                lbls.push({
                    index: labels[n],
                    label: n
                });
            }
            if (lbls.length) {
                lbls.sort(function(a, b) {
                    return a.index - b.index;
                });
                for ( var i = 0, l = lbls.length; i < l; i++) {
                    var label = lbls[i].label;
                    var start = baseFrameIndex + lbls[i].index;
                    var end = baseFrameIndex + ((i == l - 1) ? duration : lbls[i + 1].index);
                    var frames = [];
                    for ( var j = start; j < end; j++) {
                        frames.push(j);
                    }
                    this.addAnimation(label, frames, true); // for now, this loops all animations.
                }
            }
        },

        /**
         * 基于当前的所有帧创建一个图片精灵的实例。
         *
         * @method build
         * @return SpriteSheet 被创建的图片精灵实例，当已经存在一个正在创建的表单或发生错误时返回空。
         */
        build: function() {
            if (this._data) {
                throw SpriteSheetBuilder.ERR_RUNNING;
            }
            this._startBuild();
            while (this._drawNext()) {
            }
            this._endBuild();
            return this.spriteSheet;
        },

        /**
         * 异步创建一个基于当前所有帧的{{#crossLink "SpriteSheet"}}{{/crossLink}}实例。它会以20次每秒的速度运行，使用<code>timeSlice</code>定义的时间。当结束时会调用一个指定的回调函数。
         *
         * @method buildAsync
         * @param {Number} [timeSlice] 在当前实例上设置timeSlice属性。
         */
        buildAsync: function(timeSlice) {
            if (this._data) {
                throw SpriteSheetBuilder.ERR_RUNNING;
            }
            this.timeSlice = timeSlice;
            this._startBuild();
            var _this = this;
            this._timerID = setTimeout(function() {
                _this._run();
            }, 50 - Math.max(0.01, Math.min(0.99, this.timeSlice || 0.3)) * 50);
        },

        /**
         * 停止当前的异步创建。
         *
         * @method stopAsync
         */
        stopAsync: function() {
            clearTimeout(this._timerID);
            this._data = null;
        },

        /**
         * SpriteSheetBuilder实例不能被克隆。
         *
         * @method clone
         */
        clone: function() {
            throw ("SpriteSheetBuilder实例不能被克隆。");
        },

        /**
         * 返回当前对象的字符串表示。
         *
         * @method toString
         * @return {String} 当前对象的字符串表示。
         */
        toString: function() {
            return "[SpriteSheetBuilder]";
        },

        /**
         * @method _startBuild
         * @protected
         */
        _startBuild: function() {
            var pad = this.padding || 0;
            this.progress = 0;
            this.spriteSheet = null;
            this._index = 0;
            this._scale = this.scale;
            var dataFrames = [];
            this._data = {
                images: [],
                frames: dataFrames,
                animations: this._animations
            // TODO: should we "clone" _animations in case someone adds more animations after a build?
            };
            var frames = this._frames.slice();
            frames.sort(function(a, b) {
                return (a.height <= b.height) ? -1 : 1;
            });
            if (frames[frames.length - 1].height + pad * 2 > this.maxHeight) {
                throw SpriteSheetBuilder.ERR_DIMENSIONS;
            }
            var y = 0, x = 0;
            var img = 0;
            while (frames.length) {
                var o = this._fillRow(frames, y, img, dataFrames, pad);
                if (o.w > x) {
                    x = o.w;
                }
                y += o.h;
                if (!o.h || !frames.length) {
                    var canvas = document.createElement("canvas");
                    canvas.width = this._getSize(x, this.maxWidth);
                    canvas.height = this._getSize(y, this.maxHeight);
                    this._data.images[img] = canvas;
                    if (!o.h) {
                        x = y = 0;
                        img++;
                    }
                }
            }
        },

        /**
         * @method _fillRow
         * @protected
         * @return {Number} 返回每行的宽和高。
         */
        _getSize: function(size, max) {
            var pow = 4;
            while (Math.pow(2, ++pow) < size) {
            }
            return Math.min(max, Math.pow(2, pow));
        },

        /**
         * @method _fillRow
         * @protected
         * @return {Number} 返回每行的宽和高。
         */
        _fillRow: function(frames, y, img, dataFrames, pad) {
            var w = this.maxWidth;
            var maxH = this.maxHeight;
            y += pad;
            var h = maxH - y;
            var x = pad;
            var height = 0;
            for ( var i = frames.length - 1; i >= 0; i--) {
                var frame = frames[i];
                var sc = this._scale * frame.scale;
                var rect = frame.sourceRect;
                var source = frame.source;
                var rx = Math.floor(sc * rect.x - pad);
                var ry = Math.floor(sc * rect.y - pad);
                var rh = Math.ceil(sc * rect.height + pad * 2);
                var rw = Math.ceil(sc * rect.width + pad * 2);
                if (rw > w) {
                    throw SpriteSheetBuilder.ERR_DIMENSIONS;
                }
                if (rh > h || x + rw > w) {
                    continue;
                }
                frame.img = img;
                frame.rect = new Rectangle(x, y, rw, rh);
                height = height || rh;
                frames.splice(i, 1);
                dataFrames[frame.index] = [x, y, rw, rh, img, Math.round(-rx + sc * source.regX - pad), Math.round(-ry + sc * source.regY - pad)];
                x += rw;
            }
            return {
                w: x,
                h: height
            };
        },

        /**
         * @method _endBuild
         * @protected
         */
        _endBuild: function() {
            this.spriteSheet = new SpriteSheet(this._data);
            this._data = null;
            this.progress = 1;
            this.dispatchEvent("complete");
        },

        /**
         * @method _run
         * @protected
         */
        _run: function() {
            var ts = Math.max(0.01, Math.min(0.99, this.timeSlice || 0.3)) * 50;
            var t = (new Date()).getTime() + ts;
            var complete = false;
            while (t > (new Date()).getTime()) {
                if (!this._drawNext()) {
                    complete = true;
                    break;
                }
            }
            if (complete) {
                this._endBuild();
            } else {
                var _this = this;
                this._timerID = setTimeout(function() {
                    _this._run();
                }, 50 - ts);
            }
            var p = this.progress = this._index / this._frames.length;
            this.dispatchEvent({
                type: "progress",
                progress: p
            });
        },

        /**
         * @method _drawNext
         * @protected
         * @return Boolean 当画到最后一张时返回false
         */
        _drawNext: function() {
            var frame = this._frames[this._index];
            var sc = frame.scale * this._scale;
            var rect = frame.rect;
            var sourceRect = frame.sourceRect;
            var canvas = this._data.images[frame.img];
            var ctx = canvas.getContext("2d");
            frame.funct && frame.funct.apply(frame.scope, frame.params);
            ctx.save();
            ctx.beginPath();
            ctx.rect(rect.x, rect.y, rect.width, rect.height);
            ctx.clip();
            ctx.translate(Math.ceil(rect.x - sourceRect.x * sc), Math.ceil(rect.y - sourceRect.y * sc));
            ctx.scale(sc, sc);
            frame.source.draw(ctx); // DisplayObject会进行自绘的
            ctx.restore();
            return (++this._index) < this._frames.length;
        }
    });

    SpriteSheetBuilder.ERR_DIMENSIONS = "帧面积超出图片精灵最大面积。";
    SpriteSheetBuilder.ERR_RUNNING = "已经有一个正在生成的表单了。";

    return SpriteSheetBuilder;

});