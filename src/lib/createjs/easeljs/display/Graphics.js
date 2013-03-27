xc.module.define("xc.createjs.Graphics", function(exports) {

    /**
     * {{#crossLink "Graphics"}}{{/crossLink}} 的 内部类，用于在 Graphics 创建指令列表：
     * @class Command
     * @protected
     * @constructor
     */
    function Command(f, params, path) {
        this.f = f;
        this.params = params;
        this.path = path == null ? true : path;
    }

    /**
     * @method exec
     * @protected
     * @param {Object} scope
     */
    Command.prototype.exec = function(scope) {
        this.f.apply(scope, this.params);
    }

    /**
    *
    * Graphics 类提供了一系列用于生成和绘制矢量图的 API 的指令。 
    * 注：Graphics 的使用可以不依赖于框架直接在 draw 中使用，也可以通过 Shape 对象在画架显示列表环境中去绘制矢量图形。cs 的使用不依赖于什么框架，可以直接在 {{#crossLink "DisplayObject/draw"}}{{/crossLink}} 中使用，也可以通过 
    * {{#crossLink "Shape"}}{{/crossLink}} 对象去调用。
    *
    * <h4>例子</h4>
    *      var g = new Graphics();
    *      g.setStrokeStyle(1);
    *      g.beginStroke(Graphics.getRGB(0,0,0));
    *      g.beginFill(Graphics.getRGB(255,0,0));
    *      g.drawCircle(0,0,3);
    *
    *      var s = new Shape(g);
    *          s.x = 100;
    *          s.y = 100;
    *
    *      stage.addChild(s);
    *      stage.update();
    *
    * 注： Graphics 类中，每一个画图方法都会返回一个 Graphics 实例，因此可以把它们链在一起使用。
    * 例如，下面一段代码功能是用指定的 context2D 画一个红色边框，蓝色填充的矩形。
    *
    *      myGraphics.beginStroke("#F00").beginFill("#00F").drawRect(20, 20, 100, 50).draw(myContext2D);
    *

    * <h4>tiny API</h4>
    *
    * Graphics 类同时提供了一套短方法，这些 API 把原来 Graphics 类的画图方法缩短成只有一到两个字母的方法。
    * 这些方法有助于构建简洁的指令。与此同时，Toolkit for CreateJS 也通过这些方法生成可读代码。所有的短方法都
    * 是 protected 的，所以可以在文档里面查阅。
    *
    * <table>
    *     <tr><td><b>Tiny</b></td><td><b>Method</b></td><td><b>Tiny</b></td><td><b>Method</b></td></tr>
    *     <tr><td>mt</td><td>{{#crossLink "Graphics/moveTo"}}{{/crossLink}} </td>
    *     <td>lt</td> <td>{{#crossLink "Graphics/lineTo"}}{{/crossLink}}</td></tr>
    *     <tr><td>at</td><td>{{#crossLink "Graphics/arcTo"}}{{/crossLink}} </td>
    *     <td>bt</td><td>{{#crossLink "Graphics/bezierCurveTo"}}{{/crossLink}} </td></tr>
    *     <tr><td>qt</td><td>{{#crossLink "Graphics/quadraticCurveTo"}}{{/crossLink}} (also curveTo)</td>
    *     <td>r</td><td>{{#crossLink "Graphics/rect"}}{{/crossLink}} </td></tr>
    *     <tr><td>cp</td><td>{{#crossLink "Graphics/closePath"}}{{/crossLink}} </td>
    *     <td>c</td><td>{{#crossLink "Graphics/clear"}}{{/crossLink}} </td></tr>
    *     <tr><td>f</td><td>{{#crossLink "Graphics/beginFill"}}{{/crossLink}} </td>
    *     <td>lf</td><td>{{#crossLink "Graphics/beginLinearGradientFill"}}{{/crossLink}} </td></tr>
    *     <tr><td>rf</td><td>{{#crossLink "Graphics/beginRadialGradientFill"}}{{/crossLink}} </td>
    *     <td>bf</td><td>{{#crossLink "Graphics/beginBitmapFill"}}{{/crossLink}} </td></tr>
    *     <tr><td>ef</td><td>{{#crossLink "Graphics/endFill"}}{{/crossLink}} </td>
    *     <td>ss</td><td>{{#crossLink "Graphics/setStrokeStyle"}}{{/crossLink}} </td></tr>
    *     <tr><td>s</td><td>{{#crossLink "Graphics/beginStroke"}}{{/crossLink}} </td>
    *     <td>ls</td><td>{{#crossLink "Graphics/beginLinearGradientStroke"}}{{/crossLink}} </td></tr>
    *     <tr><td>rs</td><td>{{#crossLink "Graphics/beginRadialGradientStroke"}}{{/crossLink}} </td>
    *     <td>bs</td><td>{{#crossLink "Graphics/beginBitmapStroke"}}{{/crossLink}} </td></tr>
    *     <tr><td>es</td><td>{{#crossLink "Graphics/endStroke"}}{{/crossLink}} </td>
    *     <td>dr</td><td>{{#crossLink "Graphics/drawRect"}}{{/crossLink}} </td></tr>
    *     <tr><td>rr</td><td>{{#crossLink "Graphics/drawRoundRect"}}{{/crossLink}} </td>
    *     <td>rc</td><td>{{#crossLink "Graphics/drawRoundRectComplex"}}{{/crossLink}} </td></tr>
    *     <tr><td>dc</td><td>{{#crossLink "Graphics/drawCircle"}}{{/crossLink}} </td>
    *     <td>de</td><td>{{#crossLink "Graphics/drawEllipse"}}{{/crossLink}} </td></tr>
    *     <tr><td>dp</td><td>{{#crossLink "Graphics/drawPolyStar"}}{{/crossLink}} </td>
    *     <td>p</td><td>{{#crossLink "Graphics/decodePath"}}{{/crossLink}} </td></tr>
    * </table>
    *
    * 这是上面例子转换为短方法后的代码。
    *
    *      myGraphics.s("#F00").f("#00F").r(20, 20, 100, 50).draw(myContext2D);
    *
    * @class Graphics
    * @constructor
    * @for Graphics
    **/
    var Graphics = xc.class.create({
        initialize: function() {
            this.clear();
            this._ctx = Graphics._ctx;
        },

        /**
         * @property _strokeInstructions
         * @protected
         * @type {Array}
         */
        _strokeInstructions: null,

        /**
         * @property _strokeStyleInstructions
         * @protected
         * @type {Array}
         */
        _strokeStyleInstructions: null,

        /**
         * @property _ignoreScaleStroke
         * @protected
         * @type Boolean
         */
        _ignoreScaleStroke: false,

        /**
         * @property _fillInstructions
         * @protected
         * @type {Array}
         */
        _fillInstructions: null,

        /**
         * @property _instructions
         * @protected
         * @type {Array}
         */
        _instructions: null,

        /**
         * @property _oldInstructions
         * @protected
         * @type {Array}
         */
        _oldInstructions: null,

        /**
         * @property _activeInstructions
         * @protected
         * @type {Array}
         */
        _activeInstructions: null,

        /**
         * @property _active
         * @protected
         * @type {Boolean}
         * @default false
         */
        _active: false,

        /**
         * @property _dirty
         * @protected
         * @type {Boolean}
         * @default false
         */
        _dirty: false,

        /**
         * 当 Graphics 实例里面没有指令集合的时候，返回 true。
         * @method isEmpty
         * @return {Boolean} 当 Graphics 实例里面没有指令集合的时候，返回 true。
         */
        isEmpty: function() {
            return !(this._instructions.length || this._oldInstructions.length || this._activeInstructions.length);
        },

        /**
         * 绘制显示对象到指定的上下文，忽略 visible, alpha, shadow, 和 transform 属性。
         * 当绘制动作正在处理，将返回 true （用于覆盖功能）。
         * 注：这种方法主要是供内部使用，即使它可能有高级用法。
         * @method draw
         * @param {CanvasRenderingContext2D} ctx canvas 2D 上下文对象将渲染到这里。
         */
        draw: function(ctx) {
            if (this._dirty) {
                this._updateInstructions();
            }
            var instr = this._instructions;
            for ( var i = 0, l = instr.length; i < l; i++) {
                instr[i].exec(ctx);
            }
        },

        /**
         * 只绘制这个 Graphics 实例的路径，跳过所有不是描述路径的指令，包括填充和画笔描述。例如，可能用于 DisplayObject.clippingPath
         * 去剪贴路径。
         * @method drawAsPath
         * @param {CanvasRenderingContext2D} ctx canvas 2D 上下文对象将渲染到这里。
         */
        drawAsPath: function(ctx) {
            if (this._dirty) {
                this._updateInstructions();
            }
            var instr, instrs = this._instructions;
            for ( var i = 0, l = instrs.length; i < l; i++) {
                // the first command is always a beginPath command.
                if ((instr = instrs[i]).path || i == 0) {
                    instr.exec(ctx);
                }
            }
        },

        /**
         * 移动画笔到指定位置。
         * @method moveTo
         * @param {Number} x 目标位置的 x 坐标。
         * @param {Number} y 目标位置的 y 坐标。
         * @return {Graphics} 调用该方法的 Graphics（用于把方法链接在一起）。
         */
        moveTo: function(x, y) {
            this._activeInstructions.push(new Command(this._ctx.moveTo, [x, y]));
            return this;
        },

        /**
         * 从当前位置画一条直线到目标位置。
         * 获取更多信息，请看：
         * <a href="http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#complex-shapes-(paths)">
         * whatwg spec</a>.
         * @method lineTo
         * @param {Number} x 目标位置的 x 坐标。
         * @param {Number} y 目标位置的 y 坐标。
         * @return {Graphics} 调用该方法的 Graphics（用于把方法链接在一起）。
         */
        lineTo: function(x, y) {
            this._dirty = this._active = true;
            this._activeInstructions.push(new Command(this._ctx.lineTo, [x, y]));
            return this;
        },

        /**
         * 根据特定参数画圆。获取更多信息，请看：
         * <a href="http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#dom-context-2d-arcto">
         * whatwg spec</a>.
         * @method arcTo
         * @param {Number} x1
         * @param {Number} y1
         * @param {Number} x2
         * @param {Number} y2
         * @param {Number} radius
         * @return {Graphics} 调用该方法的 Graphics（用于把方法链接在一起）。
         */
        arcTo: function(x1, y1, x2, y2, radius) {
            this._dirty = this._active = true;
            this._activeInstructions.push(new Command(this._ctx.arcTo, [x1, y1, x2, y2, radius]));
            return this;
        },

        /**
         * 根据 radius, startAngle 和 endAngle ，以 (x, y) 为中心画圆。
         * 例如，要花一个全圆，以（100,100）为圆心，20 为半径。
         *      arc(100, 100, 20, 0, Math.PI*2);
         *
         * 获取更多信息，请看：
         * <a href="http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#dom-context-2d-arc">whatwg spec</a>.
         * @method arc
         * @param {Number} x
         * @param {Number} y
         * @param {Number} radius
         * @param {Number} startAngle 以弧度为单位。
         * @param {Number} endAngle 以弧度为单位。
         * @param {Boolean} anticlockwise 逆时针方向。
         * @return {Graphics} 调用该方法的 Graphics（用于把方法链接在一起）。
         */
        arc: function(x, y, radius, startAngle, endAngle, anticlockwise) {
            this._dirty = this._active = true;
            if (anticlockwise == null) {
                anticlockwise = false;
            }
            this._activeInstructions.push(new Command(this._ctx.arc, [x, y, radius, startAngle, endAngle, anticlockwise]));
            return this;
        },

        /**
         * 为当前的子路径添加一条贝塞尔曲线。这条曲线从当前点开始，到 (x,y) 结束。控制点 (cpX,cpY) 说明了这两个点之间的曲线的形状。
         * 获取更多信息，请看 <a href="http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#dom-context-2d-quadraticcurveto">
         * whatwg spec</a>.
         * @method quadraticCurveTo
         * @param {Number} cpx
         * @param {Number} cpy
         * @param {Number} x
         * @param {Number} y
         * @return {Graphics} 调用该方法的 Graphics（用于把方法链接在一起）。
         */
        quadraticCurveTo: function(cpx, cpy, x, y) {
            this._dirty = this._active = true;
            this._activeInstructions.push(new Command(this._ctx.quadraticCurveTo, [cpx, cpy, x, y]));
            return this;
        },

        /**
         * 为一个画布的当前子路径添加一条三次贝塞尔曲线。这条曲线的开始点是画布的当前点，而结束点是 (x, y)。两条贝塞尔曲线控制点 (cpX1, cpY1) 和 (cpX2, cpY2) 定义了曲线的形状。
         * 获取更多信息，请看 <a href="http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#dom-context-2d-beziercurveto">
         * whatwg spec</a>.
         * @method bezierCurveTo
         * @param {Number} cp1x
         * @param {Number} cp1y
         * @param {Number} cp2x
         * @param {Number} cp2y
         * @param {Number} x
         * @param {Number} y
         * @return {Graphics} 调用该方法的 Graphics（用于把方法链接在一起）。
         */
        bezierCurveTo: function(cp1x, cp1y, cp2x, cp2y, x, y) {
            this._dirty = this._active = true;
            this._activeInstructions.push(new Command(this._ctx.bezierCurveTo, [cp1x, cp1y, cp2x, cp2y, x, y]));
            return this;
        },

        /**
         * 在 (x,y) 处根据指定的宽度和高度画矩形。
         * 获取更多信息，请看
         * <a href="http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#dom-context-2d-rect">
         * whatwg spec</a>.
         * @method rect
         * @param {Number} x
         * @param {Number} y
         * @param {Number} w 矩形的宽度
         * @param {Number} h 矩形的高度
         * @return {Graphics} 调用该方法的 Graphics（用于把方法链接在一起）。
         */
        rect: function(x, y, w, h) {
            this._dirty = this._active = true;
            this._activeInstructions.push(new Command(this._ctx.rect, [x, y, w, h]));
            return this;
        },

        /**
         * 关闭当前的路径，有效地在当前描绘点和对上那个 fill 或 stroke 方法设置的描绘点之间画一条线。
         * 
         * @method closePath
         * @return {Graphics} 调用该方法的 Graphics（用于把方法链接在一起）。
         */
        closePath: function() {
            if (this._active) {
                this._dirty = true;
                this._activeInstructions.push(new Command(this._ctx.closePath, []));
            }
            return this;
        },

        /**
         * 清空所有画图指令，有效的重置 Graphics 实例。
         * @method clear
         * @return {Graphics} 调用该方法的 Graphics（用于把方法链接在一起）。
         */
        clear: function() {
            this._instructions = [];
            this._oldInstructions = [];
            this._activeInstructions = [];
            this._strokeStyleInstructions = this._strokeInstructions = this._fillInstructions = null;
            this._active = this._dirty = false;
            return this;
        },

        /**
         * 开始用指定的颜色填充。这将结束当前的子路径。
         * @method beginFill
         * @param {String} color 一个 CSS 颜色值 (ex. "red", "#FF0000", or "rgba(255,0,0,0.5)")，如果为 null 则不会填充任何颜色。
         * @return {Graphics} 调用该方法的 Graphics（用于把方法链接在一起）。
         */
        beginFill: function(color) {
            if (this._active) {
                this._newPath();
            }
            this._fillInstructions = color ? [new Command(this._setProp, ["fillStyle", color], false), Graphics.fillCmd] : null;
            return this;
        },

        /**
         * 
         * 开始从 (x0, y0) 到 (x1, y1) 进行线性渐变画线。这会结束当前子路径。
         * 例如，下面的代码定义了一条从黑到白的垂直线性渐变，从 20px 到 120px 的方形。
         *      myGraphics.beginLinearGradientFill(["#000","#FFF"], [0, 1], 0, 20, 0, 120).drawRect(20, 20, 120, 120);
         *
         * @method beginLinearGradientFill
         * @param {Array} colors 一个 CSS 颜色数组。举例， ["#F00","#00F"] 将定义从红到蓝。
         * @param {Array} ratios 一个关于颜色的梯度数组。举例，定义 [0.1, 0.9] 将第一个颜色画成 10% 到第二个颜色 90%。
         * @param {Number} x0 第一个点的位置，决定了梯度方向和大小。
         * @param {Number} y0 第一个点的位置，决定了梯度方向和大小。
         * @param {Number} x1 第二个点的位置，决定了梯度方向和大小。
         * @param {Number} y1 第二个点的位置，决定了梯度方向和大小。
         * @return {Graphics} 调用该方法的 Graphics（用于把方法链接在一起）。
         *
         **/
        beginLinearGradientFill: function(colors, ratios, x0, y0, x1, y1) {
            if (this._active) {
                this._newPath();
            }
            // X-Canvas暂时不兼容
            /*var o = this._ctx.createLinearGradient(x0, y0, x1, y1);
            for ( var i = 0, l = colors.length; i < l; i++) {
                o.addColorStop(ratios[i], colors[i]);
            }*/
            this._fillInstructions = [new Command(this._setProp, ["fillStyle", colors[colors.length - 1]], false), Graphics.fillCmd];
            return this;
        },

        /**
         * 开始径向梯度填充。这会结束当前子路径。举例, 以下代码就是要画一个颜色从红到蓝，以（100， 100）为圆心，
         * 以 50 为半径的圆：
         *      myGraphics.beginRadialGradientFill(["#F00","#00F"], [0, 1], 100, 100, 0, 100, 100, 50).drawCircle(100, 100, 50);
         *
         * @param {Array} colors 一个 CSS 颜色数组。举例， ["#F00","#00F"] 将定义从红到蓝。
         * @param {Array} ratios 一个关于颜色的梯度数组。举例，定义 [0.1, 0.9] 将第一个颜色画成 10% 到第二个颜色 90%。让第二个颜色为 100%。
         * @param {Number} x0 内圆的圆心。
         * @param {Number} y0 内圆的圆心。
         * @param {Number} r0 内圆的半径。
         * @param {Number} x1 外圆的圆心。
         * @param {Number} y1 外圆的圆心。
         * @param {Number} r1 外圆的半径。
         * @return {Graphics} 调用该方法的 Graphics（用于把方法链接在一起）。
         **/
        beginRadialGradientFill: function(colors, ratios, x0, y0, r0, x1, y1, r1) {
            if (this._active) {
                this._newPath();
            }
            // X-Canvas暂时不兼容
            /*var o = this._ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
            for ( var i = 0, l = colors.length; i < l; i++) {
                o.addColorStop(ratios[i], colors[i]);
            }*/
            this._fillInstructions = [new Command(this._setProp, ["fillStyle", colors[colors.length - 1]], false), Graphics.fillCmd];
            return this;
        },

        /**
         * 利用指定的图片填充内容。这将结束当前的子路径。
         * @method beginBitmapFill
         * @param {HTMLImageElement | HTMLCanvasElement | HTMLVideoElement} image Image Canvas 或 Video。
         * @param {String} repetition 可选项。说明图片是否需要重复去填充区域，可以使 "repeat", "repeat-x", "repeat-y",
         * "no-repeat", 默认值是"repeat"。
         * @param {Matrix2D} matrix 可选项。指定位图填充的变换矩阵。这种转变将相对于父变换。
         * @return {Graphics} 调用该方法的 Graphics（用于把方法链接在一起）。
         **/
        beginBitmapFill: function(image, repetition, matrix) {
            if (this._active) {
                this._newPath();
            }
            repetition = repetition || "";
            var o = this._ctx.createPattern(image, repetition);
            var cmd = new Command(this._setProp, ["fillStyle", o], false);
            var arr;
            if (matrix) {
                arr = [cmd, new Command(this._ctx.save, [], false), 
                       new Command(this._ctx.transform, [matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty], 
                       false), Graphics.fillCmd,
                new Command(this._ctx.restore, [], false)];
            } else {
                arr = [cmd, Graphics.fillCmd];
            }
            this._fillInstructions = arr;
            return this;
        },

        /**
         * 结束当前子路径，并开始一个新的无填充的子路径。功能上等同于 <code>beginFill(null)</code>。
         * @method endFill
         * @return {Graphics} 调用该方法的 Graphics（用于把方法链接在一起）
         **/
        endFill: function() {
            return this.beginFill();
        },

        /**
         * 设置当前子路径的 stroke 样式。像所有的绘图方法一样，这个也可以与其他方法连接在一起，所以可以
         * 单独在一行里面定义 stroke 的样式和颜色。例如：
         * 
         *      myGraphics.setStrokeStyle(8,"round").beginStroke("#F00");
         *
         * @method setStrokeStyle
         * @param {Number} thickness stroke 的宽度。
         * @param {String | Number} [caps=0] 指示的行结束时使用的类型的 cap type。butt，round 或 square。默认为 “butt”。此外，还接受值0（butt），1（round）和2（square）使用tiny API。
         * @param {String | Number} [joints=0] 指定 joints（两条线相交）的类型。其中的 bevel，round 或 miter。默认为“miter”。此外，还接受值0（miter），1（round）和2（bevel）使用tiny API。
         * @param {Number} [miterLimit=10] 如果 joints 属性设置为 miter， 那可以指定 miterLimit 属性。
         * @param {Boolean} [ignoreScale=false] 如果为 true，stroke 将会根据指定的厚度绘制，不理会活动的 transformations。
         * @return {Graphics} 调用该方法的 Graphics（用于把方法链接在一起）。
         **/
        setStrokeStyle: function(thickness, caps, joints, miterLimit, ignoreScale) {
            if (this._active) {
                this._newPath();
            }
            this._strokeStyleInstructions =
            [new Command(this._setProp, ["lineWidth", (thickness == null ? "1" : thickness)], false),
            new Command(this._setProp, 
                    ["lineCap", 
                     (caps == null ? "butt" : (isNaN(caps) ? caps : Graphics.STROKE_CAPS_MAP[caps]))], false),
            new Command(this._setProp, 
                    ["lineJoin", 
                     (joints == null ? "miter" : (isNaN(joints) ? joints : Graphics.STROKE_JOINTS_MAP[joints]))], false),
            new Command(this._setProp, 
                    ["miterLimit", 
                     (miterLimit == null ? "10" : miterLimit)], false)];
            this._ignoreScaleStroke = ignoreScale;
            return this;
        },

        /**
         * 开始通过指定的颜色执行 stroke 方法。这将会结束当前子路径。
         * @method beginStroke
         * @param {String} color 一个 CSS 颜色值 (ex. "red", "#FF0000", or "rgba(255,0,0,0.5)")，如果为 null 则不会填充任何颜色。
         * @return {Graphics} 调用该方法的 Graphics（用于把方法链接在一起）。
         **/
        beginStroke: function(color) {
            if (this._active) {
                this._newPath();
            }
            this._strokeInstructions = color ? [new Command(this._setProp, ["strokeStyle", color], false)] : null;
            return this;
        },

        /**
         * 开始线性渐地变 stroke 一条从 (x0, y0) 到 (x1, y1) 的直线，这会结束当前的子路径。
         * 举例，下面的代码就是定义从黑到白垂直渐变，从 20px 到 120px 的矩形。
         * 
         *      myGraphics.setStrokeStyle(10).beginLinearGradientStroke(["#000","#FFF"], [0, 1], 0, 20, 0, 120).drawRect(20, 20, 120, 120);
         *
         * @method beginLinearGradientStroke
         * @param {Array} colors 一个 CSS 颜色数组。举例， ["#F00","#00F"] 将定义从红到蓝。
         * @param {Array} ratios 一个关于颜色的梯度数组。举例，定义 [0.1, 0.9] 将第一个颜色画成 10% 到第二个颜色 90%。
         * @param {Number} x0 第一个点的位置，决定了梯度方向和大小。
         * @param {Number} y0 第一个点的位置，决定了梯度方向和大小。
         * @param {Number} x1 第二个点的位置，决定了梯度方向和大小。
         * @param {Number} y1 第二个点的位置，决定了梯度方向和大小。
         * @return {Graphics} 调用该方法的 Graphics（用于把方法链接在一起）。
         **/
        beginLinearGradientStroke: function(colors, ratios, x0, y0, x1, y1) {
            if (this._active) {
                this._newPath();
            }
            var o = this._ctx.createLinearGradient(x0, y0, x1, y1);
            for ( var i = 0, l = colors.length; i < l; i++) {
                o.addColorStop(ratios[i], colors[i]);
            }
            this._strokeInstructions = [new Command(this._setProp, ["strokeStyle", o], false)];
            return this;
        },

        /**
         * 开始径向梯度 stroke. 这会结束当前子路径. 举例, 以下代码定义了从红到蓝的径向梯度以 (100, 100) 为中心，50 为半径的矩形。
         *
         *      myGraphics.setStrokeStyle(10)
         *          .beginRadialGradientStroke(["#F00","#00F"], [0, 1], 100, 100, 0, 100, 100, 50)
         *          .drawRect(50, 90, 150, 110);
         *
         * @method beginRadialGradientStroke
         * @param {Array} colors 一个 CSS 颜色数组。举例， ["#F00","#00F"] 将定义从红到蓝。
         * @param {Array} ratios 一个关于颜色的梯度数组。举例，定义 [0.1, 0.9] 将第一个颜色画成 10% 到第二个颜色 90%。让第二个颜色为 100%。
         * @param {Number} x0 内圆的圆心。
         * @param {Number} y0 内圆的圆心。
         * @param {Number} r0 内圆的半径。
         * @param {Number} x1 外圆的圆心。
         * @param {Number} y1 外圆的圆心。
         * @param {Number} r1 外圆的半径。
         * @return {Graphics} 调用该方法的 Graphics（用于把方法链接在一起）。
         **/
        beginRadialGradientStroke: function(colors, ratios, x0, y0, r0, x1, y1, r1) {
            if (this._active) {
                this._newPath();
            }
            var o = this._ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
            for ( var i = 0, l = colors.length; i < l; i++) {
                o.addColorStop(ratios[i], colors[i]);
            }
            this._strokeInstructions = [new Command(this._setProp, ["strokeStyle", o], false)];
            return this;
        },

        /**
         * 利用指定的图片填充内容.这会结束当前子路径。区别于 bitmap fills，strokes 目前不支持矩阵参数，这是由于 canvas API 的限制。
         * @method beginBitmapStroke
         * @param {HTMLImageElement | HTMLCanvasElement | HTMLVideoElement} image Image，Canvas 或 Vedio。
         * @param {String} [repetition=repeat] 可选项。 说明图片是否需要 repeat 去填充区域，可以使 "repeat", "repeat-x", "repeat-y",
           "no-repeat", 默认值是 "repeat"。
         * @return {Graphics} 调用该方法的 Graphics（用于把方法链接在一起）。
         **/
        beginBitmapStroke: function(image, repetition) {
            if (this._active) {
                this._newPath();
            }
            repetition = repetition || "";
            var o = this._ctx.createPattern(image, repetition);
            this._strokeInstructions = [new Command(this._setProp, ["strokeStyle", o], false)];
            return this;
        },

        /**
         * 结束当前子路径，以及重新开一条新的没有 stroke 路径。功能与 <code>beginStroke(null)</ code> 相同。
         * @method endStroke
         * @return {Graphics} 调用该方法的 Graphics（用于把方法链接在一起）。
         **/
        endStroke: function() {
            this.beginStroke();
            return this;
        },

        /**
         * 画一个 4 角有相同弧度圆角的矩形。
         * @method drawRoundRect
         * @param {Number} x
         * @param {Number} y
         * @param {Number} w
         * @param {Number} h
         * @param {Number} radius 圆角弧度。
         * @return {Graphics} 调用该方法的 Graphics（用于把方法链接在一起）。
         **/
        drawRoundRect: function(x, y, w, h, radius) {
            this.drawRoundRectComplex(x, y, w, h, radius, radius, radius, radius);
            return this;
        },

        /**
         * 画一个 4 个角都有不同弧度圆角的矩形。
         * @method drawRoundRectComplex
         * @param {Number} x
         * @param {Number} y
         * @param {Number} w
         * @param {Number} h
         * @param {Number} radiusTL 左上角弧度。
         * @param {Number} radiusTR 右上角弧度。
         * @param {Number} radiusBR 右下角弧度。
         * @param {Number} radiusBL 左下角弧度。
         * @return {Graphics} 调用该方法的 Graphics（用于把方法链接在一起）。
         **/
        drawRoundRectComplex: function(x, y, w, h, radiusTL, radiusTR, radiusBR, radiusBL) {
            var max = (w < h ? w : h) / 2;
            var mTL = 0, mTR = 0, mBR = 0, mBL = 0;
            if (radiusTL < 0) {
                radiusTL *= (mTL = -1);
            }
            if (radiusTL > max) {
                radiusTL = max;
            }
            if (radiusTR < 0) {
                radiusTR *= (mTR = -1);
            }
            if (radiusTR > max) {
                radiusTR = max;
            }
            if (radiusBR < 0) {
                radiusBR *= (mBR = -1);
            }
            if (radiusBR > max) {
                radiusBR = max;
            }
            if (radiusBL < 0) {
                radiusBL *= (mBL = -1);
            }
            if (radiusBL > max) {
                radiusBL = max;
            }
            this._dirty = this._active = true;
            var arcTo = this._ctx.arcTo, lineTo = this._ctx.lineTo;
            this._activeInstructions.push(new Command(this._ctx.moveTo, [x + w - radiusTR, y]), new Command(arcTo, [x + w + radiusTR * mTR, y - radiusTR * mTR, x + w, y + radiusTR, radiusTR]),
            new Command(lineTo, [x + w, y + h - radiusBR]), new Command(arcTo, [x + w + radiusBR * mBR, y + h + radiusBR * mBR, x + w - radiusBR, y + h, radiusBR]), new Command(lineTo, [x + radiusBL,
            y + h]), new Command(arcTo, [x - radiusBL * mBL, y + h + radiusBL * mBL, x, y + h - radiusBL, radiusBL]), new Command(lineTo, [x, y + radiusTL]), new Command(arcTo, [x - radiusTL * mTL,
            y - radiusTL * mTL, x + radiusTL, y, radiusTL]), new Command(this._ctx.closePath));
            return this;
        },

        /**
         * 画一个指定圆心为（x，y）的圆。
         *
         *      var g = new Graphics();
         *      g.setStrokeStyle(1);
         *      g.beginStroke(Graphics.getRGB(0,0,0));
         *      g.beginFill(Graphics.getRGB(255,0,0));
         *      g.drawCircle(0,0,3);
         *
         *      var s = new Shape(g);
         *      s.x = 100;
         *      s.y = 100;
         *
         *      stage.addChild(s);
         *      stage.update();
         *
         * @method drawCircle
         * @param {Number} x 圆心 x 坐标。
         * @param {Number} y 圆心 y 坐标。
         * @param {Number} radius 圆的半径。
         * @return {Graphics} 调用该方法的 Graphics（用于把方法链接在一起）。
         **/
        drawCircle: function(x, y, radius) {
            this.arc(x, y, radius, 0, Math.PI * 2);
            return this;
        },

        /**
         * 根据指定的 宽度 (w) 和 高度 (h), 类似于 {{#crossLink "Graphics/drawCircle"}}{{/crossLink}} 方法，宽度和高度可以不同。
         * @method drawEllipse
         * @param {Number} x ellipse 中心的 x 坐标。
         * @param {Number} y ellipse 中心的 y 坐标。
         * @param {Number} w ellipse 的宽度。 水平半径将是这个值的一半。
         * @param {Number} h ellipse 的高度。 垂直半径将是这个值的一半。
         * @return {Graphics} 调用该方法的 Graphics（用于把方法链接在一起）
         **/
        drawEllipse: function(x, y, w, h) {
            this._dirty = this._active = true;
            var k = 0.5522848;
            var ox = (w / 2) * k;
            var oy = (h / 2) * k;
            var xe = x + w;
            var ye = y + h;
            var xm = x + w / 2;
            var ym = y + h / 2;
            this._activeInstructions.push(new Command(this._ctx.moveTo, [x, ym]), 
                                        new Command(this._ctx.bezierCurveTo, [x, ym - oy, xm - ox, y, xm, y]), 
                                        new Command(this._ctx.bezierCurveTo, [xm + ox, y, xe, ym - oy, xe, ym]), 
                                        new Command(this._ctx.bezierCurveTo, [xe, ym + oy, xm + ox, ye, xm, ye]), 
                                        new Command(this._ctx.bezierCurveTo, [xm - ox, ye, x, ym + oy, x, ym]));
            return this;
        },

        /**
         * 如果 pointSize 大于 0，则画一个星星，如果 pointSize 等于 0，则画一个正多边形。
         * 例如，下面的代码是以 100 ，100 为中心 50 为半径，画一个 5 角星。
         *      myGraphics.beginFill("#FF0").drawPolyStar(100, 100, 50, 5, 0.6, -90);
         *      //注：-90 是使得第一个点垂直。
         *
         * @method drawPolyStar
         * @param {Number} x shape 的中心 x 坐标。
         * @param {Number} y shape 的中心 y 坐标。
         * @param {Number} radius shape 半径。
         * @param {Number} sides 星星角的数量或多边形边的数量。
         * @param {Number} pointSize 星星角的深度或尖的程度。如果 pointSize 为 0 的话会描绘一个规则的正多边形。pointSize 为 1 的话将什么都画不出来。因为这样尖的程度将无限大。
         * @param {Number} angle 第一个弯度/点的角度。举例，如果该值为 0，就会从第一个点直接画到右边第二个点。
         * @return {Graphics} 调用该方法的 Graphics（用于把方法链接在一起）。
         **/
        drawPolyStar: function(x, y, radius, sides, pointSize, angle) {
            this._dirty = this._active = true;
            if (pointSize == null) {
                pointSize = 0;
            }
            pointSize = 1 - pointSize;
            if (angle == null) {
                angle = 0;
            } else {
                angle /= 180 / Math.PI;
            }
            var a = Math.PI / sides;
            this._activeInstructions.push(new Command(this._ctx.moveTo, 
                                            [x + Math.cos(angle) * radius, y + Math.sin(angle) * radius]));
            for ( var i = 0; i < sides; i++) {
                angle += a;
                if (pointSize != 1) {
                    this._activeInstructions.push(new Command(this._ctx.lineTo, 
                    [x + Math.cos(angle) * radius * pointSize, y + Math.sin(angle) * radius * pointSize]));
                }
                angle += a;
                this._activeInstructions.push(new Command(this._ctx.lineTo, 
                                                [x + Math.cos(angle) * radius, y + Math.sin(angle) * radius]));
            }
            return this;
        },

        /**
         * 解码一系列编码的路径字符串，使其加入 instructions 指令集。
         * 这种格式是不可读的，是通过工具去解读的。
         * 格式使用 base64 编码字符集，每个字符代表6位，定义了一系列的绘制命令。
         *
         * 每一个 Command 由单一个 “header” 后接 x 和 y 的位置。从左到右读 “header”，1 到 3 字节指定了操作类型(0-moveTo, 1-lineTo, 2-quadraticCurveTo, 3-bezierCurveTo, 4-closePath, 5-7 unused)。
         * 第 4 个字节表示，位置值是使用 12 字节的，还是使用 18 字节的。第 5 和第 6 字节目前还没用到。
         *
         * 紧接着 header 是一系列的 0 (closePath), 2 (moveTo, lineTo), 4 (quadraticCurveTo), or 6 (bezierCurveTo) 参数。
         * 这些参数为交替的x / y的位置，由2个或3个字符表示。
         * 这些字符包括一个1位的符号（1是负的，0是正的），然后由一个11（2字符）或17（3字符）位的整数值。所有的位置值是10像素。
         * 
         * 举例，一个 "A3cAAMAu4AAA" 字符串代表了一条直线，从 -150,0 开始到 150,0。
         * <br />A - bits 000000. 前三位 (000) 表示移动操作。 第四个 bit (0) 表示每个参数为 2 个字符。
         * <br />n0 - 110111011100. x 的绝对位置为 -150.0px. 第一个参数表示负数，其余位表示1500像素。
         * <br />AA - 000000000000. y 的绝对位置为 0。
         * <br />I - 001100. 前三位 (001) 表示画线操作。 第四位 (1) 表示每个参数为 3 个字符。
         * <br />Au4 - 000000101110111000. x 偏移位置 300.0px, 由 -150px 到 150px。
         * <br />AAA - 000000000000000000. y 的 delta 值为 0。
         * 
         * @method decodePath
         * @param {String} str 要解析的路径的字符串形式。
         * @return {Graphics} 调用该方法的 Graphics（用于把方法链接在一起）。
         **/
        decodePath: function(str) {
            var instructions = [this.moveTo, this.lineTo, this.quadraticCurveTo, this.bezierCurveTo, this.closePath];
            var paramCount = [2, 2, 4, 6, 0];
            var i = 0, l = str.length;
            var params = [];
            var x = 0, y = 0;
            var base64 = Graphics.BASE_64;
            while (i < l) {
                var c = str.charAt(i);
                var n = base64[c];
                var fi = n >> 3; // highest order bits 1-3 code for operation.
                var f = instructions[fi];
                // check that we have a valid instruction & that the unused bits are empty:
                if (!f || (n & 3)) {
                    throw ("bad path data (@" + i + "): " + c);
                }
                var pl = paramCount[fi];
                if (!fi) {
                    x = y = 0;
                } // move operations reset the position.
                params.length = 0;
                i++;
                var charCount = (n >> 2 & 1) + 2; // 4th header bit indicates number size for this operation.
                for ( var p = 0; p < pl; p++) {
                    var num = base64[str.charAt(i)];
                    var sign = (num >> 5) ? -1 : 1;
                    num = ((num & 31) << 6) | (base64[str.charAt(i + 1)]);
                    if (charCount == 3) {
                        num = (num << 6) | (base64[str.charAt(i + 2)]);
                    }
                    num = sign * num / 10;
                    if (p % 2) {
                        x = (num += x);
                    } else {
                        y = (num += y);
                    }
                    params[p] = num;
                    i += charCount;
                }
                f.apply(this, params);
            }
            return this;
        },

        /**
         * 返回克隆后的 Graphics 实例。
         * @method clone
         * @return {Graphics} 克隆后的 Graphics 实例。
         **/
        clone: function() {
            var o = new Graphics();
            o._instructions = this._instructions.slice();
            o._activeInstructions = this._activeInstructions.slice();
            o._oldInstructions = this._oldInstructions.slice();
            if (this._fillInstructions) {
                o._fillInstructions = this._fillInstructions.slice();
            }
            if (this._strokeInstructions) {
                o._strokeInstructions = this._strokeInstructions.slice();
            }
            if (this._strokeStyleInstructions) {
                o._strokeStyleInstructions = this._strokeStyleInstructions.slice();
            }
            o._active = this._active;
            o._dirty = this._dirty;
            return o;
        },

        /**
         * 返回该对象的字符串表示形式。
         * @method toString
         * @return {String} 该对象的字符串表示形式。
         **/
        toString: function() {
            return "[Graphics]";
        },

        /**
         * @method _updateInstructions
         * @protected
         */
        _updateInstructions: function() {
            this._instructions = this._oldInstructions.slice();
            this._instructions.push(Graphics.beginCmd);
            this._instructions.push.apply(this._instructions, this._activeInstructions);
            if (this._fillInstructions) {
                this._instructions.push.apply(this._instructions, this._fillInstructions);
            }
            if (this._strokeInstructions) {
                if (this._strokeStyleInstructions) {
                    this._instructions.push.apply(this._instructions, this._strokeStyleInstructions);
                }
                this._instructions.push.apply(this._instructions, this._strokeInstructions);
                if (this._ignoreScaleStroke) {
                    this._instructions.push(new Command(this._ctx.save, [], false), 
                                            new Command(this._ctx.setTransform, [1, 0, 0, 1, 0, 0], false), 
                                            Graphics.strokeCmd, new Command(this._ctx.restore,
                        [], false));
                } else {
                    this._instructions.push(Graphics.strokeCmd);
                }
            }
        },

        /**
         * @method _newPath
         * @protected
         */
        _newPath: function() {
            if (this._dirty) {
                this._updateInstructions();
            }
            this._oldInstructions = this._instructions;
            this._activeInstructions = [];
            this._active = this._dirty = false;
        },

        /**
         * 用于设置属性值的指令。
         * @method _setProp
         * @param {String} name
         * @param {String} value
         * @protected
         */
        _setProp: function(name, value) {
            this[name] = value;
        }
    });

    /**
    *
    * 返回一个通过 RGB 模式指定的 CSS 颜色，如 "rgba(255,255,255)"。如果 alpha 是 null，则返回例如 “rgb(255,255,255)”。
    * 例如： 
    *
    *      Graphics.getRGB(50, 100, 150, 0.5);
    *
    * 将会返回 "rgba(50,100,150,0.5)"。这同时可以传入一个十六进制模式的 css 颜色作为第一个参数，以及一个可选的 alpha 值
    * 作为第二个参数。例如：
    * 
    *      Graphics.getRGB(0xFF00FF, 0.2);
    *
    * 将会返回 "rgba(255,0,255,0.2)"。
    * @method getRGB
    * @static
    * @param {Number} r 颜色组成的红色成分，介于 0 到 0xFF (255) 之间。
    * @param {Number} g 颜色组成的绿色成分，介于 0 到 0xFF (255) 之间。
    * @param {Number} b 颜色组成的蓝色成分，介于 0 到 0xFF (255) 之间。
    * @param {Number} alpha 可选项。颜色的透明度，0 是完全透明，1 是完全不透明。
    * @return {String} 一个通过 RGB 模式指定的 CSS 颜色，如 "rgba(255,255,255)"。如果 alpha 是 null，则返回例如 “rgb(255,255,255)”。
    **/
    Graphics.getRGB = function(r, g, b, alpha) {
        if (r != null && b == null) {
            alpha = g;
            b = r & 0xFF;
            g = r >> 8 & 0xFF;
            r = r >> 16 & 0xFF;
        }
        if (alpha == null) {
            return "rgb(" + r + "," + g + "," + b + ")";
        } else {
            return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
        }
    };

    /**
     * 返回一个由 HSL 模式指定的 CSS 颜色。如：“hsla(360,100,100,1.0)”，如果 alpha 是 null，则返回例如 “hsl(360,100,100)”
     * 例如，这里会返回 “hsl(150,100,70)”。
     *      Graphics.getHSL(150, 100, 70);
     *
     * @method getHSL
     * @static
     * @param {Number} hue 颜色的色调，0 到 360 之间。
     * @param {Number} saturation 颜色的饱和度, 0 到 100 之间。
     * @param {Number} lightness 颜色的亮度, 0 到 100 之间。
     * @param {Number} alpha 可选项。颜色的透明度，0 是完全透明，1 是完全不透明。
     * @return {String} 一个由 HSL 模式指定的 CSS 颜色。如：“hsla(360,100,100,1.0)”，如果 alpha 是 null，则返回例如 “hsl(360,100,100)”。
     **/
    Graphics.getHSL = function(hue, saturation, lightness, alpha) {
        if (alpha == null) {
            return "hsl(" + (hue % 360) + "," + saturation + "%," + lightness + "%)";
        } else {
            return "hsla(" + (hue % 360) + "," + saturation + "%," + lightness + "%," + alpha + ")";
        }
    };

    /**
     * Base64 数值转换表，用于 {{#crossLink "Graphics/decodePath"}}{{/crossLink}} 方法。
     * @property BASE_64
     * @static
     * @final
     * @type {Object}
     */
    Graphics.BASE_64 = {
        "A": 0,
        "B": 1,
        "C": 2,
        "D": 3,
        "E": 4,
        "F": 5,
        "G": 6,
        "H": 7,
        "I": 8,
        "J": 9,
        "K": 10,
        "L": 11,
        "M": 12,
        "N": 13,
        "O": 14,
        "P": 15,
        "Q": 16,
        "R": 17,
        "S": 18,
        "T": 19,
        "U": 20,
        "V": 21,
        "W": 22,
        "X": 23,
        "Y": 24,
        "Z": 25,
        "a": 26,
        "b": 27,
        "c": 28,
        "d": 29,
        "e": 30,
        "f": 31,
        "g": 32,
        "h": 33,
        "i": 34,
        "j": 35,
        "k": 36,
        "l": 37,
        "m": 38,
        "n": 39,
        "o": 40,
        "p": 41,
        "q": 42,
        "r": 43,
        "s": 44,
        "t": 45,
        "u": 46,
        "v": 47,
        "w": 48,
        "x": 49,
        "y": 50,
        "z": 51,
        "0": 52,
        "1": 53,
        "2": 54,
        "3": 55,
        "4": 56,
        "5": 57,
        "6": 58,
        "7": 59,
        "8": 60,
        "9": 61,
        "+": 62,
        "/": 63
    };

    /**
     * {{#crossLink "Graphics/setStrokeStyle"}}{{/crossLink}} caps 属性的数字列表。这个仅仅是提供给短方法。
     * 0：butt，１：round，2：square
     * 例如, 把 caps 设置成 "square":
     *
     *     myGraphics.ss(16, 2);
     * @property STROKE_CAPS_MAP
     * @static
     * @final
     * @type {Array}
     */
    Graphics.STROKE_CAPS_MAP = ["butt", "round", "square"];

    /**
     * {{#crossLink "Graphics/setStrokeStyle"}}{{/crossLink}} 的 joints 属性列表。这个仅仅是提供给短方法。
     * 0：miter，１：round，2：bevel
     *
     * 例如，把 joints 属性设置为 "bevel"：
     *      myGraphics.ss(16, 0, 2);
     * @property STROKE_JOINTS_MAP
     * @static
     * @final
     * @type {Array}
     */
    Graphics.STROKE_JOINTS_MAP = ["miter", "round", "bevel"];

    /**
     * @property _ctx
     * @static
     * @protected
     * @type {CanvasRenderingContext2D}
     */
    Graphics._ctx = document.createElement("canvas").getContext("2d");

    /**
     * @property beginCmd
     * @static
     * @protected
     * @type {Command}
     */
    Graphics.beginCmd = new Command(Graphics._ctx.beginPath, [], false);

    /**
     * @property fillCmd
     * @static
     * @protected
     * @type {Command}
     */
    Graphics.fillCmd = new Command(Graphics._ctx.fill, [], false);

    /**
     * @property strokeCmd
     * @static
     * @protected
     * @type {Command}
     */
    Graphics.strokeCmd = new Command(Graphics._ctx.stroke, [], false);

    // tiny API:
    var p = Graphics.prototype;

    /**
     * <code>curveTo()</code> 方法功能类似于 {{#crossLink "Graphics/quadraticCurveTo"}}{{/crossLink}}。
     * method.
     * @method curveTo
     * @type {Function}
     */
    p.curveTo = p.quadraticCurveTo;

    /**
     * <code>drawRect()</code> 方法功能类似于 {{#crossLink "Graphics/rect"}}{{/crossLink}}。
     * method.
     * @method drawRect
     * @type {Function}
     */
    p.drawRect = p.rect;

    /**
     * Shortcut to moveTo.
     * @method mt
     * @protected
     * @type {Function}
     */
    p.mt = p.moveTo;

    /**
     * Shortcut to lineTo.
     * @method lt
     * @protected
     * @type {Function}
     */
    p.lt = p.lineTo;

    /**
     * Shortcut to arcTo.
     * @method at
     * @protected
     * @type {Function}
     */
    p.at = p.arcTo;

    /**
     * Shortcut to bezierCurveTo.
     * @method bt
     * @protected
     * @type {Function}
     */
    p.bt = p.bezierCurveTo;

    /**
     * Shortcut to quadraticCurveTo / curveTo.
     * @method qt
     * @protected
     * @type {Function}
     */
    p.qt = p.quadraticCurveTo;

    /**
     * Shortcut to arc.
     * @method a
     * @protected
     * @type {Function}
     */
    p.a = p.arc;

    /**
     * Shortcut to rect.
     * @method r
     * @protected
     * @type {Function}
     */
    p.r = p.rect;

    /**
     * Shortcut to closePath.
     * @method cp
     * @protected
     * @type {Function}
     */
    p.cp = p.closePath;

    /**
     * Shortcut to clear.
     * @method c
     * @protected
     * @type {Function}
     */
    p.c = p.clear;

    /**
     * Shortcut to beginFill.
     * @method f
     * @protected
     * @type {Function}
     */
    p.f = p.beginFill;

    /**
     * Shortcut to beginLinearGradientFill.
     * @method lf
     * @protected
     * @type {Function}
     */
    p.lf = p.beginLinearGradientFill;

    /**
     * Shortcut to beginRadialGradientFill.
     * @method rf
     * @protected
     * @type {Function}
     */
    p.rf = p.beginRadialGradientFill;

    /**
     * Shortcut to beginBitmapFill.
     * @method bf
     * @protected
     * @type {Function}
     */
    p.bf = p.beginBitmapFill;

    /**
     * Shortcut to endFill.
     * @method ef
     * @protected
     * @type {Function}
     */
    p.ef = p.endFill;

    /**
     * Shortcut to setStrokeStyle.
     * @method ss
     * @protected
     * @type {Function}
     */
    p.ss = p.setStrokeStyle;

    /**
     * Shortcut to beginStroke.
     * @method s
     * @protected
     * @type {Function}
     */
    p.s = p.beginStroke;

    /**
     * Shortcut to beginLinearGradientStroke.
     * @method ls
     * @protected
     * @type {Function}
     */
    p.ls = p.beginLinearGradientStroke;

    /**
     * Shortcut to beginRadialGradientStroke.
     * @method rs
     * @protected
     * @type {Function}
     */
    p.rs = p.beginRadialGradientStroke;

    /**
     * Shortcut to beginBitmapStroke.
     * @method bs
     * @protected
     * @type {Function}
     */
    p.bs = p.beginBitmapStroke;

    /**
     * Shortcut to endStroke.
     * @method es
     * @protected
     * @type {Function}
     */
    p.es = p.endStroke;

    /**
     * Shortcut to drawRect.
     * @method dr
     * @protected
     * @type {Function}
     */
    p.dr = p.drawRect;

    /**
     * Shortcut to drawRoundRect.
     * @method rr
     * @protected
     * @type {Function}
     */
    p.rr = p.drawRoundRect;

    /**
     * Shortcut to drawRoundRectComplex.
     * @method rc
     * @protected
     * @type {Function}
     */
    p.rc = p.drawRoundRectComplex;

    /**
     * Shortcut to drawCircle.
     * @method dc
     * @protected
     * @type {Function}
     */
    p.dc = p.drawCircle;

    /**
     * Shortcut to drawEllipse.
     * @method de
     * @protected
     * @type {Function}
     */
    p.de = p.drawEllipse;

    /**
     * Shortcut to drawPolyStar.
     * @method dp
     * @protected
     * @type {Function}
     */
    p.dp = p.drawPolyStar;

    /**
     * Shortcut to decodePath.
     * @method p
     * @protected
     * @type Function
     */
    p.p = p.decodePath;

    return Graphics;

});
