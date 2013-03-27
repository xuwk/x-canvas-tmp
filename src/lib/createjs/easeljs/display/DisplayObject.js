xc.module.define("xc.createjs.DisplayObject", function(exports) {
    var UID = xc.module.require("xc.createjs.UID");
    var Matrix2D = xc.module.require("xc.createjs.Matrix2D");
    var Point = xc.module.require("xc.createjs.Point");
    var EventDispatcher = xc.module.require("xc.createjs.EventDispatcher");

    /**
     * DisplayObject 作为一个抽象类，不能直接构造。但能构造子类，比如 Container，Bitmap，Shape。
     * 在 EaselJS 库里，DisplayObject 是所有显示对象的基类。他定义了许多显示对象共有的属性和方法。
     * 比如 transformation 属性 (x, y, scaleX, scaleY 等等), 缓存, 和鼠标事件。
     * @class DisplayObject
     * @extends EventDispatcher
     * @constructor
     */
    var DisplayObject = EventDispatcher.extend({
        initialize: function() {
            this.id = UID.get();
            this._matrix = new Matrix2D();
        },

        /**
         * 当用户在显示对象上按下鼠标左键时触发该事件。事件属性的列表，请参阅 {{#crossLink "MouseEvent"}}{{/crossLink}} 类。
         * @event mousedown
         */
         
        /**
         * 当用户在显示对象上按下鼠标左键再放开左键时触发该事件。事件属性的列表，请参阅 {{#crossLink "MouseEvent"}}{{/crossLink}} 类。
         * @event click
         */
         
        /**
         * 当用户在显示对象上双击鼠标左键时触发该事件。事件属性的列表，请参阅 {{#crossLink "MouseEvent"}}{{/crossLink}} 类。
         * @event dblClick
         */
         
        /**
         * 当用户鼠标在显示对象上滑过时触发该事件。必须调用了 Stage.enableMouseOver 该事件才能生效。
         * 事件属性的列表，请参阅 {{#crossLink "MouseEvent"}}{{/crossLink}} 类。
         * @event mouseover
         */
         
        
        /**
         * 当用户鼠标在显示对象上滑出时触发该事件。必须调用了 Stage.enableMouseOver 该事件才能生效。
         * 事件属性的列表，请参阅 {{#crossLink "MouseEvent"}}{{/crossLink}} 类。
         * @event mouseout
         */
         
        /**
         * 每当 Stage 执行 updates 时，stage 上的每个显示对象都会触发该方法。
         * 通常在渲染之前执行。当 Stage 执行 update 的时候，Stage 上的所有显示对象优先执行 tick 方法，再绘制到 Stage 上。
         * 子对象将会根据他们的深度来执行按顺序执行各自的 tick 方法。
         * @event tick
         * @param {Object} target 调用该事件的object。
         * @param {String} type 事件类型。
         * @param {Array} params 一个包含所有传递到 stage update 的参数。
         * 例如 如果执行 stage.update("hello"), 那参数就会是 ["hello"]。
         */

        /**
         * 描述该显示对象的透明度. 0 表示完全透明, 1 表示完全不透明。
         * @property alpha
         * @type {Number}
         * @default 1
         */
        alpha: 1,

        /**
         * 如果缓存是可用的，返回持有该显示对象缓存版本的 canvas。
         * 只读。
         * @property cacheCanvas
         * @type {HTMLCanvasElement | Object}
         * @default null
         */
        cacheCanvas: null,

        /**
         * 显示对象特有的 id， 使显示对象使用起来更方便。
         * @property id
         * @type {Number}
         * @default -1
         */
        id: -1,

        /**
         * 当执行 Stage.getObjectsUnderPoint() 时，通过该属性判断是否应该包含当前显示对象，从而影响鼠标行为。
         * 当为 Containers 设定该值为 true 时，无论该 Containers 的孩子该值是否为 true，该 Container 都会被返回。
         * @property mouseEnabled
         * @type {Boolean}
         * @default true
         */
        mouseEnabled: true,

        /**
         * 该显示对象一个可选的名字，当执行 toString() 方法时，会包含在里面，主要用于调试。
         * @property name
         * @type {String}
         * @default null
         */
        name: null,

        /**
         * 包含此显示对象的 Container 或 Stage 对象。
         * 当该显示对象未曾添加到对应的 Container 或 Stage 对象，该值为空。
         * 只读。
         * @property parent
         * @final
         * @type {Container}
         * @default null
         */
        parent: null,

        /**
         * 用于定位该显示对象的 x 坐标。
         * 比如：当需要一个 100x100px 的 Bitmap 围绕其中心旋转，应该设置 regX = regY = 50。
         * @property regX
         * @type {Number}
         * @default 0
         */
        regX: 0,

        /**
         * 用于定位该显示对象的 y 坐标。
         * 比如：当需要一个 100x100px 的 Bitmap 围绕其中心旋转，应该设置 regX = regY = 50。
         * @property regY
         * @type {Number}
         * @default 0
         */
        regY: 0,

        /**
         * 该显示对象旋转的角度。
         * @property rotation
         * @type {Number}
         * @default 0
         */
        rotation: 0,

        /**
         * 该显示对象的水平放大倍数。
         * 比如, 设置 scaleX 为 2，该显示对象的宽度将变为正常宽度的 2 倍。
         * @property scaleX
         * @type {Number}
         * @default 1
         */
        scaleX: 1,

        /**
         * 该显示对象的垂直放大倍数。
         * 比如, 设置 scaleY 为 2，该显示对象的高度将变为正常高度的 2 倍。
         * @property scaleY
         * @type {Number}
         * @default 1
         */
        scaleY: 1,

        /**
         * 该显示对象的水平倾斜度。
         * @property skewX
         * @type {Number}
         * @default 0
         */
        skewX: 0,

        /**
         * 该显示对象的垂直倾斜度。
         * @property skewY
         * @type {Number}
         * @default 0
         */
        skewY: 0,

        /**
         * 渲染在该显示对象上的的阴影对象。
         * 设置为 null 可除去阴影。
         * 当该值为 null 时，该属性的值从父容器继承。
         * @property shadow
         * @type {Shadow}
         * @default null
         */
        shadow: null,

        /**
         * 指出该显示对象是否应该被渲染到 canvas 里，以及在运行 Stage.getObjectsUnderPoint() 时是否应该被包含。 
         * @property visible
         * @type {Boolean}
         * @default true
         */
        visible: true,

        /**
         * 该显示对象相对于其父容器的 x 坐标。
         * @property x
         * @type {Number}
         * @default 0
         */
        x: 0,

        /**
         * 该显示对象相对于其父容器的 y 坐标。
         * @property y
         * @type {Number}
         * @default 0
         */
        y: 0,

        /**
         * 用于指出该显示对象的像素如何与它背后的元素合成。
         * 如果该值为 null，该属性的值从父容器继承。
         * 点击获取更多信息 <a href="http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#compositing">
         * whatwg spec on compositing</a>。
         * @property compositeOperation
         * @type {String}
         * @default null
         */
        compositeOperation: null,

        /**
         * 用于该显示对象的过滤器对象的数组。仅当显示对象执行 cache() 或 updateCache(), 
         * Filters 才能作用或更新，且仅适用于缓存区域。
         * @property filters
         * @type {Array}
         * @default null
         */
        filters: null,

        /**
         * 返回该显示对象当前的缓存的特有的 ID。
         * 该属性有助于分析缓存是否已经改变。
         * @property cacheID
         * @type {Number}
         * @default 0
         */
        cacheID: 0,

        /**
         * Shape 实例为显示对象定义了一个矢量蒙层（剪贴路径）。
         * Shape 的改造是相对于显示对象的父坐标的（当它作为一个子对象时）。
         * @property mask
         * @type {Shape}
         * @default null
         */
        mask: null,

        /**
         * 一个用于检测鼠标事件或 getObjectsUnderPoint 方法的显示对象。
         * 该区域会相对于当前的显示对象进行坐标转换
         *（该对象甚至可以是当前显示对象的子对象，坐标相对于它的 regX/Y），
         * hitArea 只根据自己的 alpha 值去运作，和目标对象以及目标对象父对象的alpha 值无关。
         * hitArea 目前不在 hitTest() 方法中使用。
         * 注： hitArea 在 stage 中不支持。
         * @property hitArea
         * @type {DisplayObject}
         * @default null
         */
        hitArea: null,

        /**
         * 一个 CSS 光标（例如“指针”，“帮助器”，“文本”等），将在用户悬停在该显示对象时显示。
         * 必须当 mouseover 事件可用时，这个属性才能生效，可以通过 stage.enableMouseOver() 方法去激活 mouseover 事件。
         * 如果该值为 null，将使用默认光标。
         * @property cursor
         * @type {String}
         * @default null
         */
        cursor: null,

        /**
         * @property _cacheOffsetX
         * @protected
         * @type {Number}
         * @default 0
         */
        _cacheOffsetX: 0,

        /**
         * @property _cacheOffsetY
         * @protected
         * @type {Number}
         * @default 0
         */
        _cacheOffsetY: 0,

        /**
         * @property _cacheScale
         * @protected
         * @type {Number}
         * @default 1
         */
        _cacheScale: 1,

        /**
         * @property _cacheDataURLID
         * @protected
         * @type {Number}
         * @default 0
         */
        _cacheDataURLID: 0,

        /**
         * @property _cacheDataURL
         * @protected
         * @type {String}
         * @default null
         */
        _cacheDataURL: null,

        /**
         * @property _matrix
         * @protected
         * @type {Matrix2D}
         * @default null
         */
        _matrix: null,

        /**
         * 通过返回 true 或 false 去表示该显示对象画在 Canvas 上时，是否被显示。
         * 并不是通过该显示对象是否在 stage 可视范围内进行判断的。
         * 注：这种方法主要是供内部使用，即使它可能有高级用法。
         * @method isVisible
         * @return {Boolean} Boolean 表示该显示对象画在 Canvas 上时，是否被显示。
         */
        isVisible: function() {
            return !!(this.visible && this.alpha > 0 && this.scaleX != 0 && this.scaleY != 0);
        },

        /**
         * 绘制显示对象到指定的上下文，忽略 visible, alpha, shadow, 和 transform 属性。
         * 当绘制动作正在处理，将返回 true （用于覆盖功能）。
         * 注：这种方法主要是供内部使用，即使它可能有高级用法。
         * @method draw
         * @param {CanvasRenderingContext2D} ctx canvas 2D 上下文对象将渲染到这里。
         * @param {Boolean} ignoreCache 表示这个绘制行为是否忽略当前所有缓存。
         * 例如，用来画 cache （以防止它简单地绘制到自身现有的 cache 上）。
         */
        draw: function(ctx, ignoreCache) {
            var cacheCanvas = this.cacheCanvas;
            if (ignoreCache || !cacheCanvas) {
                return false;
            }
            var scale = this._cacheScale;
            ctx.drawImage(cacheCanvas, this._cacheOffsetX, this._cacheOffsetY
                            , cacheCanvas.width / scale, cacheCanvas.height / scale);
            return true;
        },

        /**
         * 适用于显示对象的转型, 例如 globalCompositeOperation, clipping path (mask), 和 shadow 到指定上下文。
         * 该方法通常在 draw 方法执行前执行。
         * @method setupContext
         * @param {CanvasRenderingContext2D} ctx 用于更新的 canvas 2D。
         */
        updateContext: function(ctx) {
            var mtx, mask = this.mask, o = this;
            if (mask && mask.graphics && !mask.graphics.isEmpty()) {
                mtx = mask.getMatrix(mask._matrix);
                ctx.transform(mtx.a, mtx.b, mtx.c, mtx.d, mtx.tx, mtx.ty);
                mask.graphics.drawAsPath(ctx);
                ctx.clip();
                mtx.invert();
                ctx.transform(mtx.a, mtx.b, mtx.c, mtx.d, mtx.tx, mtx.ty);
            }
            mtx = o._matrix.identity()
                    .appendTransform(o.x, o.y, o.scaleX, o.scaleY, o.rotation, o.skewX, o.skewY, o.regX, o.regY);
            // TODO: should be a better way to manage this setting. For now, using dynamic access to avoid circular dependencies:
            if (o.snapToPixel) {
                ctx.transform(mtx.a, mtx.b, mtx.c, mtx.d, mtx.tx + 0.5 | 0, mtx.ty + 0.5 | 0);
            } else {
                ctx.transform(mtx.a, mtx.b, mtx.c, mtx.d, mtx.tx, mtx.ty);
            }
            ctx.globalAlpha *= o.alpha;
            if (o.compositeOperation) {
                ctx.globalCompositeOperation = o.compositeOperation;
            }
            if (o.shadow) {
                this._applyShadow(ctx, o.shadow);
            }
        },

        /**
         * 将显示对象绘制到一个后续使用的新 Canvas 上。
         * 这样已经合成的内容就不必每次更改（如一个包含许多不移动子对象的 Container，或者一个合成的矢量模型），
         * 由于不需要在每一个 tick 里面重新渲染，渲染速度会快很多。缓存对象可以自由移动、翻转、消失等等。
         * 当它的内容改变，必须通过 updateCache() 或 cache() 来更新 cache 里面的内容。
         * 必须通过 x, y, w, 和 h 参数来指定缓存区域，这样定义的矩形区域，将根据显示对象的坐标来渲染。
         * 例如 如果定义一个 Shape 来画一个以（0,0）为圆心，25为半径的圆，将调用 myShape.cache(-25, -25, 50, 50) 去缓存整个 shape。
         * @method cache
         * @param {Number} x 缓存区域的 x 坐标原点。
         * @param {Number} y 缓存区域的 y 坐标原点。
         * @param {Number} width 缓存区域的宽度。
         * @param {Number} height 缓存区域的高度。
         * @param {Number} scale 可选. 放大倍数。
         * 例如，如果用缓存画一个矢量图 myShape.cache(0,0,100,100,2) 它将产生一个 200*200 px 的缓存 Canvas。
         * 这可以通过缩放和旋转缓存使得元素有更高的保真度。
         * 默认值 1。
         */
        cache: function(x, y, width, height, scale) {
            // 绘制到 canvas.
            scale = scale || 1;
            if (!this.cacheCanvas) {
                this.cacheCanvas = document.createElement("canvas");
            }
            this.cacheCanvas.width = Math.ceil(width * scale);
            this.cacheCanvas.height = Math.ceil(height * scale);
            this._cacheOffsetX = x;
            this._cacheOffsetY = y;
            this._cacheScale = scale || 1;
            this.updateCache();
        },

        /**
         * 在 cache 重新绘制显示对象。
         * 调用 updateCache 时没有可用，将抛出一个错误。
         * 如果 compositeOperation 为 null，则当前 cache 将在 cleared 后再进行绘制。
         * 否则，显示对象将通过指定的 compositeOperation 绘制在现有的 cache 上。
         * @method updateCache
         * @param {String} compositeOperation compositeOperation 将被使用，或为 null 在绘制之前先清空 cache。
         * <a href="http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#compositing">whatwg
         * spec on compositing</a>.
         */
        updateCache: function(compositeOperation) {
            var cacheCanvas = this.cacheCanvas, scale = this._cacheScale, offX = this._cacheOffsetX * scale, 
                offY = this._cacheOffsetY * scale;
            if (!cacheCanvas) {
                throw "cache() must be called before updateCache()";
            }
            var ctx = cacheCanvas.getContext("2d");
            ctx.save();
            if (!compositeOperation) {
                ctx.clearRect(0, 0, cacheCanvas.width, cacheCanvas.height);
            }
            ctx.globalCompositeOperation = compositeOperation;
            ctx.setTransform(scale, 0, 0, scale, -offX, -offY);
            this.draw(ctx, true);
            this._applyFilters();
            ctx.restore();
            this.cacheID = DisplayObject._nextCacheID++;
        },

        /**
         * 清空当前 cache，看 cache() 获取更多信息。
         * @method uncache
         */
        uncache: function() {
            this._cacheDataURL = this.cacheCanvas = null;
            this.cacheID = this._cacheOffsetX = this._cacheOffsetY = 0;
            this._cacheScale = 1;
        },

        /**
         * 返回 cache 的数据 URL，如果该显示对象没有 cache 则返回 null。
         * 通过 cacheID 确保当 cache 没有改变时，不会产生新的 data URL。
         * @method getCacheDataURL.
         */
        getCacheDataURL: function() {
            if (!this.cacheCanvas) {
                return null;
            }
            if (this.cacheID != this._cacheDataURLID) {
                this._cacheDataURL = this.cacheCanvas.toDataURL();
            }
            return this._cacheDataURL;
        },

        /**
         * 返回渲染该显示对象的 Stage，如果该显示对象没有渲染到 stage 里，则返回 null。
         * @method getStage
         * @return {Stage} 渲染该显示对象的 stage，如果该显示对象没有渲染到 stage 里，则返回 null。
         */
        getStage: function() {
            var o = this;
            while (o.parent) {
                o = o.parent;
            }
            // 使用动态的访问，以避免循环依赖关系。
            var Stage = xc.module.require("xc.createjs.Stage");
            if (o instanceof Stage) {
                return o;
            }
            return null;
        },

        /**
         * 将相对于显示对象坐标系的 x，y 坐标，转换为全局（Stage）坐标系的 x，y 坐标。
         * 例如，这个可以用来定位一个 HTML 标签，该标签嵌套在一个显示对象里面。
         * 返回一个 Point 实例，该实例包括转换后 Stage 坐标系的 x ，y 坐标。
         * @method localToGlobal
         * @param {Number} x 将用来转换的显示对象的 x 坐标。
         * @param {Number} y 将用来转换的显示对象的 y 坐标。
         * @return {Point} 一个 Point 实例，该实例包括转换后 Stage 坐标系的 x ，y 坐标。
         */
        localToGlobal: function(x, y) {
            var mtx = this.getConcatenatedMatrix(this._matrix);
            if (mtx == null) {
                return null;
            }
            mtx.append(1, 0, 0, 1, x, y);
            return new Point(mtx.tx, mtx.ty);
        },

        /**
         * 将相对于全局（Stage）坐标系的 x，y 坐标，转换为显示对象坐标系的 x，y 坐标。
         * 例如，确定鼠标是否在显示对象内。
         * 返回一个 Point 实例，该实例包括转换后相对于显示对象坐标系的 x ，y 坐标。
         * @method globalToLocal
         * @param {Number} x 用于转换的全局坐标系的 x 坐标。
         * @param {Number} y 用于转换的全局坐标系的 y 坐标。
         * @return {Point} 一个 Point 实例，该实例包括转换后相对于显示对象坐标系的 x ，y 坐标。
         */
        globalToLocal: function(x, y) {
            var mtx = this.getConcatenatedMatrix(this._matrix);
            if (mtx == null) {
                return null;
            }
            mtx.invert();
            mtx.append(1, 0, 0, 1, x, y);
            return new Point(mtx.tx, mtx.ty);
        },

        /**
         * 将相对于显示对象坐标系的 x，y 坐标，转换为另一个显示对象坐标系的 x，y 坐标。
         * 返回一个 Point 实例，该实例包括转换后相对于显示对象坐标系的 x ，y 坐标。
         * 相当于执行了 var pt = this.localToGlobal(x, y); pt = target.globalToLocal(pt.x, pt.y);
         * @method localToLocal
         * @param {Number} x 用于转换的显示对象坐标系的 x 坐标。
         * @param {Number} y 用于转换的显示对象坐标系的 y 坐标。
         * @param {DisplayObject} target 将要转换坐标的目标显示对象。
         * @return {Point} Returns 一个 Point 实例，该实例包括转换后相对于显示对象坐标系的 x ，y 坐标。
         */
        localToLocal: function(x, y, target) {
            var pt = this.localToGlobal(x, y);
            return target.globalToLocal(pt.x, pt.y);
        },

        /**
         * 快捷方法用于快速设置显示对象的 transform 属性。所有属性都是可选。
         * 省略的参数有默认值设置 (例如 0 for x/y, 1 for scaleX/Y)。
         * @method setTransform
         * @param {Number} x
         * @param {Number} y
         * @param {Number} scaleX
         * @param {Number} scaleY
         * @param {Number} rotation
         * @param {Number} skewX
         * @param {Number} skewY
         * @param {Number} regX
         * @param {Number} regY
         * @return {DisplayObject} 返回当前实例，有助于链接命令。
         */
        setTransform: function(x, y, scaleX, scaleY, rotation, skewX, skewY, regX, regY) {
            this.x = x || 0;
            this.y = y || 0;
            this.scaleX = scaleX == null ? 1 : scaleX;
            this.scaleY = scaleY == null ? 1 : scaleY;
            this.rotation = rotation || 0;
            this.skewX = skewX || 0;
            this.skewY = skewY || 0;
            this.regX = regX || 0;
            this.regY = regY || 0;
            return this;
        },

        /**
         * 返回基于此显示对象的变换矩阵
         * @method getMatrix
         * @param {Matrix2D} matrix 可选。一个根据计算值填充好的 Matrix2D 对象，如果为 null，则返回一个新的 Matrix2D 对象。
         * @return {Matrix2D} 代表此对象的变换矩阵。
         */
        getMatrix: function(matrix) {
            var o = this;
            return (matrix ? matrix.identity() : new Matrix2D()).
                    appendTransform(o.x, o.y, o.scaleX, o.scaleY, o.rotation, o.skewX, o.skewY, o.regX, o.regY).
                    appendProperties(o.alpha, o.shadow, o.compositeOperation);
        },

        /**
         * 生成一个级联的 Matrix2D 对象，该对象代表该显示对象的结合变换，以及它所有的父对象（通常是 stage ）的结合变换。
         * 这可以用于变换坐标系之间的位置。例如 localToGlobal 和 globalToLocal。
         * @method getConcatenatedMatrix
         * @param {Matrix2D} matrix 可选。一个根据计算值填充好的 Matrix2D 对象，该对象代表该显示对象的结合变换，如果为 null，则返回一个新的 Matrix2D 对象
         * @return {Matrix2D} 一个级联的 Matrix2D 对象代表该显示对象的结合变换，以及它所有的父对象（通常是 stage ）的结合变换。
         */
        getConcatenatedMatrix: function(matrix) {
            if (matrix) {
                matrix.identity();
            } else {
                matrix = new Matrix2D();
            }
            var o = this;
            while (o != null) {
                matrix.prependTransform(o.x, o.y, o.scaleX, o.scaleY, o.rotation, o.skewX, o.skewY, o.regX, o.regY)
                .prependProperties(o.alpha, o.shadow, o.compositeOperation);
                o = o.parent;
            }
            return matrix;
        },

        /**
         * 测试显示对象是否与本地特定的位置相交（例如： 在特定的位置绘制一个 alpha > 0 的像素）
         * 该方法执行时不受显示对象的 alpha, shadow 和 compositeOperation, 和所有的 transform 属性，包括 regX/Y 影响。
         * @method hitTest
         * @param {Number} x显示对象坐标系的 x 坐标，将用于检测。
         * @param {Number} y显示对象坐标系的 y 坐标，将用于检测。
         * @return {Boolean} 一个 Boolean 值指出显示对象是否相交于某个特定的位置。
         */
        hitTest: function(x, y) {
            var ctx = DisplayObject._hitTestContext;
            var canvas = DisplayObject._hitTestCanvas;
            ctx.setTransform(1, 0, 0, 1, -x, -y);
            this.draw(ctx);
            var hit = this._testHit(ctx);
            canvas.width = 0;
            canvas.width = 1;
            return hit;
        },

        /**
         * 提供了一个可链接的快捷方法用于设置显示对象实例上一系列属性，
         * 例子.<br/>
         * var shape = stage.addChild( new Shape() ).set({graphics:myGraphics, x:100, y:100, alpha:0.5});
         * @method set
         * @param {Object} props 一个包含属性的对象将复制到显示对象实例。
         * @return {DisplayObject} 返回调用该方法的显示对象(链式调用时很有用)。
         */
        set: function(props) {
            for ( var n in props) {
                this[n] = props[n];
            }
            return this;
        },

        /**
         * 返回克隆后的显示对象。一些在当前背景下的特定属性值将还原为默认值（例如 .parent）。
         * @method clone
         * @return {DisplayObject} 克隆后的显示对象实例。
         */
        clone: function() {
            var o = new DisplayObject();
            this.cloneProps(o);
            return o;
        },

        /**
         * 返回该对象的字符串表示形式。
         * @method toString
         * @return {String} 该对象的字符串表示形式。
         */
        toString: function() {
            return "[DisplayObject (name=" + this.name + ")]";
        },

        /**
         * @method cloneProps
         * @protected
         * @param {DisplayObject} o 显示对象实例，包含从当前对象复制的所有属性。
         */
        cloneProps: function(o) {
            o.alpha = this.alpha;
            o.name = this.name;
            o.regX = this.regX;
            o.regY = this.regY;
            o.rotation = this.rotation;
            o.scaleX = this.scaleX;
            o.scaleY = this.scaleY;
            o.shadow = this.shadow;
            o.skewX = this.skewX;
            o.skewY = this.skewY;
            o.visible = this.visible;
            o.x = this.x;
            o.y = this.y;
            o.mouseEnabled = this.mouseEnabled;
            o.compositeOperation = this.compositeOperation;
            if (this.cacheCanvas) {
                o.cacheCanvas = this.cacheCanvas.cloneNode(true);
                o.cacheCanvas.getContext("2d").putImageData(this.cacheCanvas.getContext("2d")
                .getImageData(0, 0, this.cacheCanvas.width, this.cacheCanvas.height), 0, 0);
            }
        },

        /**
         * @method _applyShadow
         * @protected
         * @param {CanvasRenderingContext2D} ctx
         * @param {Shadow} shadow
         */
        _applyShadow: function(ctx, shadow) {
            shadow = shadow || Shadow.identity;
            ctx.shadowColor = shadow.color;
            ctx.shadowOffsetX = shadow.offsetX;
            ctx.shadowOffsetY = shadow.offsetY;
            ctx.shadowBlur = shadow.blur;
        },

        /**
         * @method _tick
         * @protected
         */
        _tick: function(params) {
            // 因为 onTick 性能是很敏感，所以将内联一些 dispatchEvent 工作。
            // 这或许可以在某些时候能解决某些问题。这对现今有成千上万的对象的浏览器有显著的影响。
            var ls = this._listeners;
            if (ls && ls["tick"]) {
                this.dispatchEvent({
                    type: "tick",
                    params: params
                });
            }
        },

        /**
         * @method _testHit
         * @protected
         * @param {CanvasRenderingContext2D} ctx
         * @return {Boolean}
         */
        _testHit: function(ctx) {
            try {
                var hit = ctx.getImageData(0, 0, 1, 1).data[3] > 1;
            } catch (e) {
                if (!DisplayObject.suppressCrossDomainErrors) {
                    throw "An error has occurred. This is most likely due to security restrictions on reading canvas pixel data with local or cross-domain images.";
                }
            }
            return hit;
        },

        /**
         * @method _applyFilters
         * @protected
         */
        _applyFilters: function() {
            if (!this.filters || this.filters.length == 0 || !this.cacheCanvas) {
                return;
            }
            var l = this.filters.length;
            var ctx = this.cacheCanvas.getContext("2d");
            var w = this.cacheCanvas.width;
            var h = this.cacheCanvas.height;
            for ( var i = 0; i < l; i++) {
                this.filters[i].applyFilter(ctx, 0, 0, w, h);
            }
        },

        /**
         * 指出对象是否有对应类型的监听器。
         * @method _hasMouseHandler
         * @param {Number} typeMask 一个位掩码，表示事件类型来。第 1 位指定 press 和 click 和 double click，第2位，指定它应该是 mouse over 和 mouse out。此实现可能会改变。
         * @return {Boolean}
         * @protected
         */
        _hasMouseHandler: function(typeMask) {
            var ls = this._listeners;
            return !!((typeMask & 1 && (ls && (this.hasEventListener("mousedown") 
                        || this.hasEventListener("click") || this.hasEventListener("dblclick")))) 
                        || (typeMask & 2 && (ls && (this.hasEventListener("mouseover") 
                        || this.hasEventListener("mouseout")))));
        }
    });

    /**
     * 当使用类似：hitTest，鼠标事件，或 getObjectsUnderPoint 出现跨域问题时产生的错误。
     * @property suppressCrossDomainErrors
     * @static
     * @type {Boolean}
     * @default false
     */
    DisplayObject.suppressCrossDomainErrors = false;

    /**
     * @property _hitTestCanvas
     * @type {HTMLCanvasElement | Object}
     * @static
     * @protected
     */
    DisplayObject._hitTestCanvas = document.createElement("canvas");
    DisplayObject._hitTestCanvas.width = DisplayObject._hitTestCanvas.height = 1;

    /**
     * @property _hitTestContext
     * @type {CanvasRenderingContext2D}
     * @static
     * @protected
     */
    DisplayObject._hitTestContext = DisplayObject._hitTestCanvas.getContext("2d");

    /**
     * @property _nextCacheID
     * @type {Number}
     * @static
     * @protected
     */
    DisplayObject._nextCacheID = 1;

    return DisplayObject;

});