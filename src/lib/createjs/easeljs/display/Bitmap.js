/**
 * EaselJS 是一个 Javascript 库，该库提供了一个图像模型，可以让 canvas 拥有一个分层展示列表，一个核心交互模式，以及一个辅助类。
 * 这样可以更容易地在 Canvas 上处理 2D 图像。
 * EaselJS 提供一个关于 HTML5 Canvas 处理丰富和交互图像的解决方案。
 *
 * <h4>开始</h4> 
 * 开始使用 Easel，首先创建一个包含 CANVAS 元素的 {{#crossLink "Stage"}}{{/crossLink}}，以及添加一个
 * {{#crossLink "DisplayObject"}}{{/crossLink}} 实例作为其子对象。EaselJS 支持：
 * <ul>
 *      <li>处理图片使用 {{#crossLink "Bitmap"}}{{/crossLink}}</li>
 *      <li>处理矢量图使用 {{#crossLink "Shape"}}{{/crossLink}} 和 {{#crossLink "Graphics"}}{{/crossLink}}</li>
 *      <li>处理动画使用 {{#crossLink "SpriteSheet"}}{{/crossLink}} 和 {{#crossLink "BitmapAnimation"}}{{/crossLink}}
 *      <li>简单 text 实例 {{#crossLink "Text"}}{{/crossLink}}</li>
 *      <li>作为容器装载其他显示对象使用 {{#crossLink "Container"}}{{/crossLink}}</li>
 *      <li>控制 HTML 元素使用 {{#crossLink "DOMElement"}}{{/crossLink}}</li>
 * </ul>
 *
 * 所有的显示对象都可以作为儿子添加到舞台里面，或直接绘制到 canvas 上。
 *
 * <b>用户交互</b><br/>
 * 所有 Stage 里面的显示对象（除了 DOM 元素），当用户有交互的时候（如鼠标点击或触碰），都将调度事件。
 * EaselJS 支持 hover, press, 和 release 事件，也有 easy-to-use drag-and-drop 模式。
 * 参阅 {{#crossLink "MouseEvent"}}{{/crossLink}} 获取更多信息。
 *
 * <h4>简单例子</h4>
 * 这个例子阐述了如何去创建和定位一个 {{#crossLink "Shape"}}{{/crossLink}} 到 {{#crossLink "Stage"}}{{/crossLink}} 里。
 *
 *      //通过 canvas 的引用创建一个 stage。
 *      stage = new createjs.Stage("demoCanvas");
 *      //创建一个 Shape 显示对象。
 *      circle = new createjs.Shape();
 *      circle.graphics.beginFill("red").drawCircle(0, 0, 40);
 *      //设置 Shape 的位置。
 *      circle.x = circle.y = 50;
 *      //添加 Shape 实例到 Stage 的显示列表。
 *      stage.addChild(circle);
 *      //更新 Stage 将会在下一帧渲染。
 *      stage.update();
 *
 * <b>简单动画例子</b><br />
 * 这个例子让上一个例子创建的 Shape 实例移动起来。横跨屏幕。
 *
 *      //更新 stage 将会在下一帧渲染。
 *      createjs.Ticker.addEventListener("tick", handleTick);
 *
 *      function handleTick() {
 *        //Circle 将会向右移动 10 个单位。
 *        circle.x += 10;
 *        //当去到边界，则循环开始。
 *        if (circle.x > stage.canvas.width) { circle.x = 0; }
 *        stage.update();
 *      }
 *
 * <h4>其他特征</h4>
 * EaselJS 还内置了许多支持：
 * <ul>
 *     <li>Canvas 特征，例如： {{#crossLink "Shadow"}}{{/crossLink}} 和 CompositeOperation</li>
 *     <li>{{#crossLink "Ticker"}}{{/crossLink}}, 一个全局心跳对象。</li>
 *     <li>过滤器, 包括 {{#crossLink "ColorMatrixFilter"}}{{/crossLink}}, {{#crossLink "AlphaMaskFilter"}}{{/crossLink}},
 *     {{#crossLink "AlphaMapFilter"}}{{/crossLink}}, 和 {{#crossLink "BoxBlurFilter"}}{{/crossLink}}。 看 {{#crossLink "Filter"}}{{/crossLink}}
 *         获取更多信息。</li>
 *     <li>一个 {{#crossLink "ButtonHelper"}}{{/crossLink}} 辅助类，使得创建按钮更加容易。</li>
 *     <li>运行时有 {{#crossLink "SpriteSheetUtils"}}{{/crossLink}} 和一个 {{#crossLink "SpriteSheetBuilder"}}{{/crossLink}} 用于
 *         辅助构建和管理 {{#crossLink "SpriteSheet"}}{{/crossLink}} 功能 。</li>
 * </ul>
 *
 * @module xc.createjs.easeljs
 */

xc.module.define("xc.createjs.Bitmap", function(exports) {

    var DisplayObject = xc.module.require("xc.createjs.DisplayObject");

    /**
     * 一个 Bitmap 可以是展示列表里的一张图片，Canvas, 或 Video。
     * 也可以是一个现有的 HTML 元素实例，或者是字符串实例。
     *
     * <h4>例子</h4>
     *      var bitmap = new createjs.Bitmap("imagePath.jpg");
     *
     * 注：如果字符串路径或图片标签还未加载，则 stage 在显示之前需要重新绘制。
     *
     * @class Bitmap
     * @extends DisplayObject
     * @constructor
     * @param {Image | HTMLCanvasElement | HTMLVideoElement | String} imageOrUri 所显示图片的源对象或 URI。可以是 Image, Canvas,Video 对象, 或是待加载使用图片文件的 URI 字符串。如果是 URI，将构造一个新的图片对象并赋予图片属性。
     */
    var Bitmap = DisplayObject.extend({
        initialize: function(imageOrUri) {
            this._super();
            if (typeof imageOrUri == "string") {
                this.image = new Image();
                this.image.src = imageOrUri;
            } else {
                this.image = imageOrUri;
            }
        },

        /**
         * 将要渲染的 Image 对象。这里可以是 Image, Canvas, Video。
         *
         * @property image
         * @type Image | HTMLCanvasElement | HTMLVideoElement
         */
        image: null,

        /**
         * Bitmap 是否需要根据全像素坐标绘制。
         *
         * @property snapToPixel
         * @type Boolean
         * @default true
         */
        snapToPixel: true,

        /**
         * 指定源图像绘制的区域。如果缺省，则整个图片都将重新绘制。
         *
         * @property sourceRect
         * @type Rectangle
         * @default null
         */
        sourceRect: null,

        /**
         * 通过返回 true 或 false 去表示该显示对象画在 Canvas 上时，是否被显示。
         * 并不是通过该显示对象是否在 Stage 可视范围内进行判断的。
         * 注：这种方法主要是供内部使用，即使它可能有高级用法。
         *
         * @method isVisible
         * @return {Boolean} Boolean 表示该显示对象画在 Canvas 上时，是否被显示。
         */
        isVisible: function() {
            var hasContent = this.cacheCanvas
                    || (this.image && (this.image.complete || this.image.getContext || this.image.readyState >= 2));
            return !!(this.visible && this.alpha > 0 && this.scaleX != 0 && this.scaleY != 0 && hasContent);
        },

        /**
         * 绘制显示对象到指定的上下文，忽略 visible, alpha, shadow, and transform 属性。
         * 当绘制动作正在处理，将返回 true （用于覆盖功能）。
         * 注：这种方法主要是供内部使用，即使它可能有高级用法。
         *
         * @method draw
         * @param {CanvasRenderingContext2D} ctx canvas 2D 上下文对象将渲染到这里。
         * @param {Boolean} ignoreCache 表示这个绘制行为是否忽略当前所有缓存。
         * 例如，用来画 cache （以防止它简单地绘制到自身现有的 cache 上）。
         */
        draw: function(ctx, ignoreCache) {
            if (this._super(ctx, ignoreCache)) {
                return true;
            }
            var rect = this.sourceRect;
            if (rect) {
                ctx.drawImage(this.image, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
            } else {
                ctx.drawImage(this.image, 0, 0);
            }
            return true;
        },

        /**
         * 返回克隆后的 Bitmap 实例。
         *
         * @method clone
         * @return {Bitmap} 克隆后的 Bitmap 实例。
         */
        clone: function() {
            var o = new Bitmap(this.image);
            if (this.sourceRect) {
                o.sourceRect = this.sourceRect.clone();
            }
            this.cloneProps(o);
            return o;
        },

        /**
         * 返回该对象的字符串表示形式。
         *
         * @method toString
         * @return {String} 该对象的字符串表示形式。
         */
        toString: function() {
            return "[Bitmap (name=" + this.name + ")]";
        }
    });

    return Bitmap;

});