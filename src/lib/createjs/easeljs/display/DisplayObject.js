xc.module.define("xc.createjs.DisplayObject", function(exports) {
    var UID = xc.module.require("xc.createjs.UID");
    var Matrix2D = xc.module.require("xc.createjs.Matrix2D");
    var Point = xc.module.require("xc.createjs.Point");
    var EventDispatcher = xc.module.require("xc.createjs.EventDispatcher");

    /**
     * DisplayObject 作为一个抽象类，不能直接构造。但能构造子类，比如 Container，Bitmap，Shape。
     * 在 EaselJS 库里，DisplayObject 是所有 display object 的基类。他定义了许多 display object 共有的属性和方法。
     * 比如 transformation properties (x, y, scaleX, scaleY, etc), caching, 和 mouse handlers。
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
         * 当用户在 display object 上按下鼠标左键时触发该事件。事件属性的列表，请参阅 {{#crossLink "MouseEvent"}}{{/crossLink}} 类。
         * @event mousedown
         * @since 0.6.0
         */
         
        /**
         * 当用户在 display object 上按下鼠标左键再放开左键时触发该事件。事件属性的列表，请参阅 {{#crossLink "MouseEvent"}}{{/crossLink}} 类。
         * @event click
         * @since 0.6.0
         */
         
        /**
         * 当用户在 display object 上点击 2 下鼠标左键时触发该事件。事件属性的列表，请参阅 {{#crossLink "MouseEvent"}}{{/crossLink}} 类。
         * @event dblClick
         * @since 0.6.0
         */
         
        /**
         * 当用户鼠标在 display object 上滑过时触发该事件。必须调用了 Stage.enableMouseOver 该事件才能生效。
         * 事件属性的列表，请参阅 {{#crossLink "MouseEvent"}}{{/crossLink}} 类。
         * @event mouseover
         * @since 0.6.0
         */
         
        
        /**
         * 当用户鼠标在 display object 上滑出时触发该事件。必须调用了 Stage.enableMouseOver 该事件才能生效。
         * 事件属性的列表，请参阅 {{#crossLink "MouseEvent"}}{{/crossLink}} 类。
         * @event mouseout
         * @since 0.6.0
         */
         
        /**
         * 每当 stage 执行 updates 时，stage 上的每个display object 都会触发该方法。
         * 通常在渲染之前执行。当 Stage 执行 update 的时候，Stage 上的所有 display object 优先执行 tick 方法，再绘制到 stage 上。
         * 孩子将会根据他们的深度来执行按顺序执行各自的 tick 方法。
         * @event tick
         * @param {Object} target 调用该事件的object。
         * @param {String} type 事件类型。
         * @param {Array} params 一个包含所有传递到 stage update 的参数。
         * 例如 如果你执行 stage.update("hello"), 那 param 就会是 ["hello"]。
         * @since 0.6.0
         */

        /**
         * 描述该 display object 的透明度. 0 表示完全透明, 1 表示完全不透明。
         * @property alpha
         * @type {Number}
         * @default 1
         */
        alpha: 1,

        /**
         * 如果缓存是可用的，返回持有该 display object 缓存版本的 canvas。
         * 只读。
         * @property cacheCanvas
         * @type {HTMLCanvasElement | Object}
         * @default null
         */
        cacheCanvas: null,

        /**
         * display object 特有的 id， 使 display object 使用起来更方便。
         * @property id
         * @type {Number}
         * @default -1
         */
        id: -1,

        /**
         * 当执行 Stage.getObjectsUnderPoint() 时，通过该属性判断是否应该包含当前 display object ，从而影响鼠标行为。
         * 当为 Containers 设定该值为 true 时，无论该 Containers 的孩子该值是否为 true，该 Container 都会被返回。
         * @property mouseEnabled
         * @type {Boolean}
         * @default true
         */
        mouseEnabled: true,

        /**
         * 该 display object 一个可选的名字，当执行 toString() 方法时，会包含在里面，主要用于调试。
         * @property name
         * @type {String}
         * @default null
         */
        name: null,

        /**
         * 包含此 display object 的 Container 或 Stage 对象。
         * 当该 display object 未曾添加到对应的 Container 或 Stage 对象，该值为空。
         * 只读。
         * @property parent
         * @final
         * @type {Container}
         * @default null
         */
        parent: null,

        /**
         * 用于定位该 display object 的 x 坐标。
         * 比如：当你需要一个 100x100px 的 Bitmap 围绕其中心旋转，你应该设置 regX = regY = 50。
         * @property regX
         * @type {Number}
         * @default 0
         */
        regX: 0,

        /**
         * 用于定位该 display object 的 y 坐标。
         * 比如：当你需要一个 100x100px 的 Bitmap 围绕其中心旋转，你应该设置 regX = regY = 50。
         * @property regY
         * @type {Number}
         * @default 0
         */
        regY: 0,

        /**
         * 该 display object 旋转的度数。
         * @property rotation
         * @type {Number}
         * @default 0
         */
        rotation: 0,

        /**
         * 该 display object 的水平放大倍数。
         * 比如, 设置 scaleX 为 2，该 display object 的宽度将变为正常宽度的 2 倍。
         * @property scaleX
         * @type {Number}
         * @default 1
         */
        scaleX: 1,

        /**
         * 该 display object 的垂直放大倍数。
         * 比如, 设置 scaleY 为 2，该 display object 的高度将变为正常高度的 2 倍。
         * @property scaleY
         * @type {Number}
         * @default 1
         */
        scaleY: 1,

        /**
         * 该 display object 的水平倾斜度。
         * @property skewX
         * @type {Number}
         * @default 0
         */
        skewX: 0,

        /**
         * 该 display object 的垂直倾斜度。
         * @property skewY
         * @type {Number}
         * @default 0
         */
        skewY: 0,

        /**
         * 渲染在该 display object 上的的阴影对象。
         * 设置为 null 可除去阴影。
         * 当该值为 null 时，该属性的值从父容器继承。
         * @property shadow
         * @type {Shadow}
         * @default null
         */
        shadow: null,

        /**
         * 指出该 display object 是否应该被渲染到 canvas 里，以及在运行 Stage.getObjectsUnderPoint() 时是否应该被包含。 
         * @property visible
         * @type {Boolean}
         * @default true
         */
        visible: true,

        /**
         * 该 display object 相对于其父容器的 x 坐标。
         * @property x
         * @type {Number}
         * @default 0
         */
        x: 0,

        /**
         * The y (vertical) position of the display object, relative to its parent.
         * @property y
         * @type {Number}
         * @default 0
         */
        y: 0,

        /**
         * 用于指出该 display object 的像素如何与它背后的元素合成。
         * 如果该值为 null，该属性的值从父容器继承。
         * 点击获取更多信息 <a href="http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#compositing">
         * whatwg spec on compositing</a>。
         * @property compositeOperation
         * @type {String}
         * @default null
         */
        compositeOperation: null,

        /**
         * 用于该 display object 的过滤器对象的数组。仅当 display object 执行 cache() 或 updateCache(), 
         * Filters 才能作用或更新，且仅适用于缓存区域。
         * @property filters
         * @type {Array}
         * @default null
         */
        filters: null,

        /**
         * 返回该 display object 当前的缓存的特有的 ID。
         * 该属性有助于分析缓存是否已经改变。
         * @property cacheID
         * @type {Number}
         * @default 0
         */
        cacheID: 0,

        /**
         * Shape 实例为 display object 定义了一个矢量蒙层（剪贴路径）。
         * Shape 的改造是相对于 display object 的父坐标的（当它作为一个孩子时）。
         * @property mask
         * @type {Shape}
         * @default null
         */
        mask: null,

        /**
         * 一个 display object 用于检测鼠标事件或 getObjectsUnderPoint 方法。
         * 这个 hit area 有自己一个相对于当前 display object 的坐标空间转换器
         *（即使 hit test object 是当前 display object 的孩子甚至是相对于它的 regX/Y）。
         * hitArea 仅仅会根据自己的 alpha 值去运作，无论目标对象和目标对象的父亲的 alpha 值。
         * hitArea 现在不在 hitTest() 方法中使用.
         *
         * 注： hitArea 在 stage 中不支持。
         * @property hitArea
         * @type {DisplayObject}
         * @default null
         */
        hitArea: null,

        /**
         * 一个 CSS 光标（例如“指针”，“帮助器”，“文本”等），将在用户悬停在该 display object 时显示。
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
         * 通过返回 true 或 false 去表示该 display object 画在 canvas 上时，是否被显示。
         * 并不是通过该 display object 是否在 stage 可视范围内进行判断的。
         * 注：这种方法主要是供内部使用，即使它可能有高级用法。
         * @method isVisible
         * @return {Boolean} Boolean 表示该 display object 画在 canvas 上时，是否被显示。
         */
        isVisible: function() {
            return !!(this.visible && this.alpha > 0 && this.scaleX != 0 && this.scaleY != 0);
        },

        /**
         * 绘制 display object 到指定的上下文，忽略 visible, alpha, shadow, and transform 属性。
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
         * 适用于 display object 的转型, 例如 globalCompositeOperation, clipping path (mask), 和 shadow 到指定上下文。
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
         * 将 display object 绘制到一个新的画布，然后将其用于后续的绘制。
         * 目的在于使复杂的内容，不会频繁更改 (例如：一个装有很多不移动的孩子的 container , 或者一个复杂的矢量形状),
         * 这样可以提供一个快很多的渲染速度，因为内容不需要在每一个 tick 里面重新渲染。cache 对象可以 moved, rotated, faded, etc freely。
         * 然而，当它的内容改变，你必须通过 updateCache() 或 cache() 来更新 cache 里面的内容。
         * 你必须通过 x, y, w, 和 h 参数来指定缓存区域，这样定义的矩形区域，将根据 display object 的坐标来渲染。
         * 例如 如果你定义一个 Shape 来画一个以（0,0）为圆心，25为半径的圆，你将调用 myShape.cache(-25, -25, 50, 50) 去缓存整个 shape。
         * @method cache
         * @param {Number} x 缓存区域的 x 坐标原点。
         * @param {Number} y 缓存区域的 y 坐标原点。
         * @param {Number} width 缓存区域的宽度。
         * @param {Number} height 缓存区域的高度。
         * @param {Number} scale 可选. 放大倍数。
         * 例如，如果你用 cache 画一个矢量图 myShape.cache(0,0,100,100,2) 它将产生一个 200*200 px 的 cacheCanvas。
         * 这使你可以通过缩放和旋转缓存使得元素有更高的保真度。
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
         * 在 cache 重新绘制 display object。
         * 调用 updateCache 时没有可用，将抛出一个错误。
         * 如果 compositeOperation 为 null，则当前 cache 将在 cleared 后再进行绘制。
         * 否则，display object 将通过指定的 compositeOperation 绘制在现有的 cache 上。
         * @method updateCache
         * @param {String} compositeOperation compositeOperation 将被使用，或为 null 在绘制之前先清空 cache。
         * <a
         * href="http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#compositing">whatwg
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
         * 返回 cache 的 data URL，如果该 display object 没有 cache 则返回 null。
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
         * 返回渲染该 display object 的 stage，如果该 display object 没有渲染到 stage 里，则返回 null。
         * @method getStage
         * @return {Stage} 渲染该 display object 的 stage，如果该 display object 没有渲染到 stage 里，则返回 null。
         */
        getStage: function() {
            var o = this;
            while (o.parent) {
                o = o.parent;
            }
            // using dynamic access to avoid circular dependencies;
            var Stage = xc.module.require("xc.createjs.Stage");
            if (o instanceof Stage) {
                return o;
            }
            return null;
        },

        /**
         * 将相对于 display object 坐标系的 x，y 坐标，转换为全局（stage）坐标系的 x，y 坐标。
         * 例如，这个可以用来定位一个 HTML 标签，该标签嵌套在一个 display object 里面。
         * 返回一个 Point 实例，该实例包括转换后 stage 坐标系的 x ，y 坐标。
         * @method localToGlobal
         * @param {Number} x 将用来转换的 display object 的 x 坐标。
         * @param {Number} y 将用来转换的 display object 的 y 坐标。
         * @return {Point} 一个 Point 实例，该实例包括转换后 stage 坐标系的 x ，y 坐标。
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
         * 将相对于全局（stage）坐标系的 x，y 坐标，转换为 display object 坐标系的 x，y 坐标。
         * 例如，确定鼠标是否在 display object 内。
         * 返回一个 Point 实例，该实例包括转换后相对于 display object 坐标系的 x ，y 坐标。
         * @method globalToLocal
         * @param {Number} x 用于转换的全局坐标系的 x 坐标。
         * @param {Number} y 用于转换的全局坐标系的 y 坐标。
         * @return {Point} 一个 Point 实例，该实例包括转换后相对于 display object 坐标系的 x ，y 坐标。
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
         * 将相对于 display object 坐标系的 x，y 坐标，转换为另一个 display object 坐标系的 x，y 坐标。
         * 返回一个 Point 实例，该实例包括转换后相对于 display object 坐标系的 x ，y 坐标。
         * 相当于执行了 var pt = this.localToGlobal(x, y); pt = target.globalToLocal(pt.x, pt.y);
         * @method localToLocal
         * @param {Number} x 用于转换的 display object 坐标系的 x 坐标。
         * @param {Number} y 用于转换的 display object 坐标系的 y 坐标。
         * @param {DisplayObject} target 将要转换坐标的目标 display object。
         * @return {Point} Returns 一个 Point 实例，该实例包括转换后相对于 display object 坐标系的 x ，y 坐标。
         */
        localToLocal: function(x, y, target) {
            var pt = this.localToGlobal(x, y);
            return target.globalToLocal(pt.x, pt.y);
        },

        /**
         * 快捷方法用于快速设置 display object 的 transform 属性。所有属性都是可选。
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
         * 返回基于此 display object 的变换矩阵
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
         * 生成一个级联的 Matrix2D 对象，该对象代表该 display object 的结合变换，以及它所有的祖先（通常是 stage ）的结合变换。
         * 这可以用于变换坐标系之间的位置。例如 localToGlobal 和 globalToLocal。
         * @method getConcatenatedMatrix
         * @param {Matrix2D} matrix 可选。一个根据计算值填充好的 Matrix2D 对象，该对象代表该 display object 的结合变换，如果为 null，则返回一个新的 Matrix2D 对象
         * @return {Matrix2D} 一个级联的 Matrix2D 对象代表该 display object 的结合变换，以及它所有的祖先（通常是 stage ）的结合变换。
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
         * 测试 display objcet 是否与本地特定的位置相交（ie. 在特定的位置绘制一个 alpha > 0 的像素）
         * 该方法执行时不受 display object 的 alpha, shadow 和 compositeOperation, 和所有的 transform 属性，包括 regX/Y 影响。
         * @method hitTest
         * @param {Number} x display object 坐标系的 x 坐标，将用于检测。
         * @param {Number} y display object 坐标系的 y 坐标，将用于检测。
         * @return {Boolean} 一个 Boolean 值指出 displayObject 可以部门是否相交于某个特定的位置。
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
         * 提供了一个可链接的快捷方法用于设置 display object 实例上一系列属性，
         * 例子.<br/>
         * var shape = stage.addChild( new Shape() ).set({graphics:myGraphics, x:100, y:100, alpha:0.5});
         * @method set
         * @param {Object} props 一个包含属性的对象将复制到 display object 实例.
         * @return {DisplayObject} 返回调用该方法的 display object (链式调用时很有用)。
         */
        set: function(props) {
            for ( var n in props) {
                this[n] = props[n];
            }
            return this;
        },

        /**
         * 返回克隆后的 display object。一些在当前背景下的特定属性值将还原为默认值（例如 .parent）。
         * @method clone
         * @return {DisplayObject} 克隆后的 display object 实例。
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
         * @param {DisplayObject} o display object 实例，包含从当前对象复制的所有属性。
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
            // 因为 onTick 性能却是很敏感，所以我们将内联一些 dispatchEvent 工作。
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
         * @param {Number} typeMask 一个位掩码，表示事件类型来。第1位指定 press 和 click 和 double click，第2位，指定它应该是 mouse over 和 mouse out。此实现可能会改变。
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
     * 当使用类似：hitTest，mouse events，或 getObjectsUnderPoint 出现跨域问题时产生的错误。
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