xc.module.define("xc.createjs.Container", function(exports) {

    var DisplayObject = xc.module.require("xc.createjs.DisplayObject");

    /**
     * Container 是一个嵌套展示列表，能将多个显示元素进行组合展示。
     * 例如可以用手臂，腿，躯干和头等Bitmap实例一起组合成一个 Person Container，Person Container 作为一个整体进行动作变换，
     * 同时各Bitmap实例仍然可以相对于各自的相对位置进行移动。
     * Container 中子元素的 <code>transform</code> 和 <code>alpha</code> 属性 将关系到他们的父 Container的对应属性。
     * 例如，一个 {{#crossLink "Shape"}}{{/crossLink}}，x=100, alpha=0.5, 在 Container 的 x=50 的位置和 alpha=0.7 相当于 canvas 的 <code>x=50</code> 和 <code>alpha=0.7</code>。
     * 容器需要有一定的冗余，通常不会创建只能容纳一个子元素的 Container。
     *
     * <h4>例子</h4>
     *      var container = new createjs.Container();
     *      container.addChild(bitmapInstance, shapeInstance);
     *      container.x = 100;
     *
     * @class Container
     * @extends DisplayObject
     * @constructor
     */
    var Container = DisplayObject.extend({
        initialize: function() {
            this._super();
            this.children = [];
        },

        /**
         * 在展示列表中的子对象数组，将经常用到管理这些子对象的方法。
         * 例如 {{#crossLink "Container/addChild"}}{{/crossLink}},
         * {{#crossLink "Container/removeChild"}}{{/crossLink}}, {{#crossLink "Container/swapChildren"}}{{/crossLink}}等等,
         * 比起直接操作它，利用一些高级的方法去操作它会更好。
         *
         * @property children
         * @type Array
         * @default null
         */
        children: null,

        /**
         * 通过返回 true 或 false 去表示该显示对象画在 Canvas 上时，是否被显示。
         * 并不是通过该显示对象是否在 Stage 可视范围内进行判断的。
         * 注：这种方法主要是供内部使用，即使它可能有高级用法。
         *
         * @method isVisible
         * @return {Boolean} Boolean 表示该显示对象画在 Canvas 上时，是否被显示。
         */
        isVisible: function() {
            var hasContent = this.cacheCanvas || this.children.length;
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
            // this ensures we don't have issues with display list changes that occur during a draw:
            var list = this.children.slice(0);
            for ( var i = 0, l = list.length; i < l; i++) {
                var child = list[i];
                if (!child.isVisible()) {
                    continue;
                }
                // draw the child:
                ctx.save();
                child.updateContext(ctx);
                child.draw(ctx);
                ctx.restore();
            }
            return true;
        },

        /**
         * 往展示列表的最上方添加子对象。当然也可以添加多个子对象。比如 "addChild(child1, child2, ...);"。
         * 返回被添加的子对象，当添加多个子对象时将返回最后一个。
         *
         * <h4>例子</h4>
         *      container.addChild(bitmapInstance, shapeInstance);
         *
         * @method addChild
         * @param {DisplayObject} child 要添加的显示对象。
         * @return {DisplayObject} 被添加的子对象，当添加多个子对象时将返回最后一个。
         */
        addChild: function(child) {
            if (child == null) {
                return child;
            }
            var l = arguments.length;
            if (l > 1) {
                for ( var i = 0; i < l; i++) {
                    this.addChild(arguments[i]);
                }
                return arguments[l - 1];
            }
            if (child.parent) {
                child.parent.removeChild(child);
            }
            child.parent = this;
            this.children.push(child);
            return child;
        },

        /**
         * 往指定下标号处添加子对象，大于等于该下标号的子对象的下标号都加 1，同时设置它的父对象为 Container。
         * 可以同时添加多个子对象，比如 "addChildAt(child1, child2, ..., index);"。
         * 下标号必须在 0 到 numChildren 之间。
         * 例如，在展示列表中，将 myShape 添加到 otherShape 下，可以这样做，container.addChildAt(myShape, container.getChildIndex(otherShape))。
         * 这样也会使得 otherShape 的索引号加 1。
         * 返回被添加的子对象，当添加多个子对象时将返回最上方的子对象。
         * 当指定的索引号超出子对象下标总数范围，会添加失败。
         * @method addChildAt
         * @param {DisplayObject} child 要添加的显示对象。
         * @param {Number} index 子对象将要添加到的下标号。
         * @return {DisplayObject} 被添加的子对象，当添加多个子对象时将返回最上方的子对象。
         */
        addChildAt: function(child, index) {
            var l = arguments.length;
            var idx = arguments[l - 1]; // can't use the same name as the index param or it replaces arguments[1]
            if (idx < 0 || idx > this.children.length) {
                return arguments[l - 2];
            }
            if (l > 2) {
                for ( var i = 0; i < l - 1; i++) {
                    this.addChildAt(arguments[i], idx + i);
                }
                return arguments[l - 2];
            }
            if (child.parent) {
                child.parent.removeChild(child);
            }
            child.parent = this;
            this.children.splice(index, 0, child);
            return child;
        },

        /**
         * 在展示列表里删除指定的子对象。注：当知道子对象对应的下标号时，使用 removeChildAt() 会更快。
         * 可以同时删除多个子对象，比如 "removeChild(child1, child2, ...);"。
         * 当成功删除，返回 true，如果子对象不在展示列表内，将返回 false。
         * @method removeChild
         * @param {DisplayObject} child 要删除的子对象。
         * @return {Boolean} 当删除成功，返回 true，如果子对象不在展示列表内，将返回 false。
         **/
        removeChild: function(child) {
            var l = arguments.length;
            if (l > 1) {
                var good = true;
                for ( var i = 0; i < l; i++) {
                    good = good && this.removeChild(arguments[i]);
                }
                return good;
            }
            return this.removeChildAt(this.children.indexOf(child));
        },

        /**
         * 在展示列表里删除在特定下标号的子对象，同时设置他的父对象为 null。
         * 可以同时删除多个子对象，例如 "removeChildAt(2, 7, ...);"。
         * 当删除成功时，会返回 true，当任意一个下标号越界时，返回 false。 
         * @param {Number} index 将要被移除的子对象对应的下标号。
         * @return {Boolean} 如果成功移除子对象，则返回 true，任意一个下标号越界时，则返回 false。
         **/
        removeChildAt: function(index) {
            var l = arguments.length;
            if (l > 1) {
                var a = [];
                for ( var i = 0; i < l; i++) {
                    a[i] = arguments[i];
                }
                a.sort(function(a, b) {
                    return b - a;
                });
                var good = true;
                for ( var i = 0; i < l; i++) {
                    good = good && this.removeChildAt(a[i]);
                }
                return good;
            }
            if (index < 0 || index > this.children.length - 1) {
                return false;
            }
            var child = this.children[index];
            if (child) {
                child.parent = null;
            }
            
            this.children.splice(index, 1);
            return true;
        },

        /**
         * 删除展示列表的所有子对象。
         *
         * @method removeAllChildren
         */
        removeAllChildren: function() {
            var kids = this.children;
            while (kids.length) {
                kids.pop().parent = null;
            }
        },

        /**
         * 返回指定下标的子对象。
         *
         * @method getChildAt
         * @param {Number} index 将返回该下标的子对象。
         * @return {DisplayObject} 指定下标的子对象。
         */
        getChildAt: function(index) {
            return this.children[index];
        },

        /**
         * 返回指定名称的子对象。
         *
         * @method getChildByName
         * @param {String} name 将返回该名称的子对象。
         * @return {DisplayObject} 指定名称的子对象。
         */
        getChildByName: function(name) {
            var kids = this.children;
            for ( var i = 0, l = kids.length; i < l; i++) {
                if (kids[i].name == name) {
                    return kids[i];
                }
            }
            return null;
        },

        /**
         * 在展示列表里对子对象进行重新排序。
         *
         * @method sortChildren
         * @param {Function} sortFunction 用于排序的方法。看 javascript 的 Array.sort 文档获取更多信息。
         */
        sortChildren: function(sortFunction) {
            this.children.sort(sortFunction);
        },

        /**
         * 返回指定子对象的下标，当子对象不存在于展示列表的时候，返回 -1。
         *
         * @method getChildIndex
         * @param {DisplayObject} child 返回该子对象的下标。
         * @return {Number} 指定子对象的下标，当子对象不存在于展示列表的时候，返回 -1。
         */
        getChildIndex: function(child) {
            return this.children.indexOf(child);
        },

        /**
         * 返回展示列表中子对象数量。
         *
         * @method getNumChildren
         * @return {Number} 展示列表中子对象数量。
         */
        getNumChildren: function() {
            return this.children.length;
        },

        /**
         * 在特定的下标处交换子对象。当任意一个下标越界的时候，就会失败。
         *
         * @param {Number} index1
         * @param {Number} index2
         * @method swapChildrenAt
         */
        swapChildrenAt: function(index1, index2) {
            var kids = this.children;
            var o1 = kids[index1];
            var o2 = kids[index2];
            if (!o1 || !o2) {
                return;
            }
            kids[index1] = o2;
            kids[index2] = o1;
        },

        /**
         * 交换 2 个指定的子对象。当任何一个子对象不在 Container 时，交换失败。
         *
         * @param {DisplayObject} child1
         * @param {DisplayObject} child2
         * @method swapChildren
         */
        swapChildren: function(child1, child2) {
            var kids = this.children;
            var index1, index2;
            for ( var i = 0, l = kids.length; i < l; i++) {
                if (kids[i] == child1) {
                    index1 = i;
                }
                if (kids[i] == child2) {
                    index2 = i;
                }
                if (index1 != null && index2 != null) {
                    break;
                }
            }
            if (i == l) {
                return;
            } // TODO: throw error?
            kids[index1] = child2;
            kids[index2] = child1;
        },

        /**
         * 改变指定子对象的深度。
         * 当子对象不在 Container 内，或下标越界，该方法会失败。
         *
         * @param {DisplayObject} child
         * @param {Number} index
         * @method setChildIndex
         */
        setChildIndex: function(child, index) {
            var kids = this.children, l = kids.length;
            if (child.parent != this || index < 0 || index >= l) {
                return "1";
            }
            for ( var i = 0; i < l; i++) {
                if (kids[i] == child) {
                    break;
                }
            }
            if (i == l || i == index) {
                return "2";
            }
            kids.splice(i, 1);
            if (index < i) {
                index--;
            }
            kids.splice(index, 0, child);
            return true;
        },

        /**
         * 当子对象是当前 Container 或其后代(子, 孙子等等)，则返回 true。
         *
         * @method contains
         * @param {DisplayObject} child 要检查的显示对象。
         * @return {Boolean} 当子对象是当前 Container 或其后代，则返回 true。
         */
        contains: function(child) {
            while (child) {
                if (child == this) {
                    return true;
                }
                child = child.parent;
            }
            return false;
        },

        /**
         * 测试显示对象是否与本地特定的位置相交（ie. 在特定的位置绘制一个 alpha > 0 的像素）。
         * 该方法执行时不受显示对象的 alpha, shadow 和 compositeOperation, 和所有的转换属性，包括 regX/Y 影响。
         *
         * @method hitTest
         * @param {Number} x 显示对象 坐标系的 x 坐标，将用于检测。
         * @param {Number} y 显示对象 坐标系的 y 坐标，将用于检测。
         * @return {Boolean} 一个指出显示对象是否相交于本地某个特定位置的布尔值。
         */
        hitTest: function(x, y) {
            // TODO: optimize to use the fast cache check where possible.
            return (this.getObjectUnderPoint(x, y) != null);
        },

        /**
         * 返回包含指定坐标下所有属于展示列表的显示对象数组。
         * 这个方法将忽略所有 mouseEnabled = false 的显示对象。
         * 数组会根据显示对象的深度排序，最高的显示对象的下标为 0。
         * 这里使用以形状为基础的命中检测，消耗比较高，要慎用。比如，如果要测试对象是否在鼠标下面，
         * 只要鼠标的位置一变化，每个 tick 都需要检测（代替 onMouseMove），
         *
         * @method getObjectsUnderPoint
         * @param {Number} x 用作测试的 container 的 x 坐标。
         * @param {Number} y 用作测试的 container 的 y 坐标。
         * @return {Array} 包含指定坐标下所有属于展示列表的显示对象数组。
         */
        getObjectsUnderPoint: function(x, y) {
            var arr = [];
            var pt = this.localToGlobal(x, y);
            this._getObjectsUnderPoint(pt.x, pt.y, arr);
            return arr;
        },

        /**
         * 类似 getObjectsUnderPoint(), 但这里只返回展示列表中最高的一个显示对象。 
         * 这里比 getObjectsUnderPoint() 运行要快，但仍然是高消耗的。
         * 看 getObjectsUnderPoint() 获取更多信息。
         *
         * @method getObjectUnderPoint
         * @param {Number} x 用作测试的 container 的 x 坐标。
         * @param {Number} y 用作测试的 container 的 y 坐标。
         * @return {DisplayObject} 展示列表中最高的一个 显示对象。
         */
        getObjectUnderPoint: function(x, y) {
            var pt = this.localToGlobal(x, y);
            return this._getObjectsUnderPoint(pt.x, pt.y);
        },

        /**
         * 返回克隆后的 Container。一些在当前背景下的特定属性值将还原为默认值（例如 .parent）
         *
         * @param {Boolean} recursive 当 recursive 为 true 时候，container 所有的子对象会递归克隆，
         *     当 recursive 为 false 时，仅仅会克隆所有的属性，不会克隆任何子对象。
         * @return {Container} 当前 Container 克隆后的 Container 对象。
         */
        clone: function(recursive) {
            var o = new Container();
            this.cloneProps(o);
            if (recursive) {
                var arr = o.children = [];
                for ( var i = 0, l = this.children.length; i < l; i++) {
                    var clone = this.children[i].clone(recursive);
                    clone.parent = o;
                    arr.push(clone);
                }
            }
            return o;
        },

        /**
         * 返回该对象的字符串表示形式。
         *
         * @method toString
         * @return {String} 该对象的字符串表示形式。
         */
        toString: function() {
            return "[Container (name=" + this.name + ")]";
        },

        /**
         * @method _tick
         * @protected
         */
        _tick: function(params) {
            for ( var i = this.children.length - 1; i >= 0; i--) {
                var child = this.children[i];
                if (undefined !== child && child._tick) {
                    child._tick(params);
                }
            }
            this._super(params);
        },

        /**
         * @method _getObjectsUnderPoint
         * @param {Number} x
         * @param {Number} y
         * @param {Array} arr
         * @param {Number} mouseEvents 一个位掩码，表示事件类型来。第 1 位指定 press 和 click 和 double click，第2位，指定它应该是 mouse over 和 mouse out。此实现可能会改变。
         * @return {Array}
         * @protected
         */
        _getObjectsUnderPoint: function(x, y, arr, mouseEvents) {
            var ctx = DisplayObject._hitTestContext;
            var canvas = DisplayObject._hitTestCanvas;
            var mtx = this._matrix;
            var hasHandler = this._hasMouseHandler(mouseEvents);
            // 如果有一个便利的 cache 和一个处理程序，使用它们来提升效率。
            // 不能通过 cache 来筛选子对象，因为他们呢可能设置了 hitArea。
            if (!this.hitArea && this.cacheCanvas && hasHandler) {
                this.getConcatenatedMatrix(mtx);
                ctx.setTransform(mtx.a, mtx.b, mtx.c, mtx.d, mtx.tx - x, mtx.ty - y);
                ctx.globalAlpha = mtx.alpha;
                this.draw(ctx);
                if (this._testHit(ctx)) {
                    canvas.width = 0;
                    canvas.width = 1;
                    return this;
                }
            }
            // 每画一次子对象列表，就检查一次它是否命中。
            var l = this.children.length;
            for ( var i = l - 1; i >= 0; i--) {
                var child = this.children[i];
                var hitArea = child.hitArea;
                if (!child.visible || (!hitArea && !child.isVisible()) || (mouseEvents && !child.mouseEnabled)) {
                    continue;
                }
                var childHasHandler = mouseEvents && child._hasMouseHandler(mouseEvents);
                // 如果子对象 container 有一个处理程序和一个 hitArea，那只需要检查它对应 hitArea 就可以了，所以可以像平常一样处理就可以了
                if (child instanceof Container && !(hitArea && childHasHandler)) {
                    var result;
                    if (hasHandler) {
                        // 只需要考虑第一次命中，因为这样这个 container 讲无论如何都要声明
                        result = child._getObjectsUnderPoint(x, y);
                        if (result) {
                            return this;
                        }
                    } else {
                        result = child._getObjectsUnderPoint(x, y, arr, mouseEvents);
                        if (!arr && result) {
                            return result;
                        }
                    }
                } else if (!mouseEvents || hasHandler || childHasHandler) {
                    child.getConcatenatedMatrix(mtx);
                    if (hitArea) {
                        mtx.appendTransform(hitArea.x, hitArea.y, hitArea.scaleX, hitArea.scaleY, hitArea.rotation,
                                hitArea.skewX, hitArea.skewY, hitArea.regX, hitArea.regY);
                        mtx.alpha = hitArea.alpha;
                    }
                    ctx.globalAlpha = mtx.alpha;
                    ctx.setTransform(mtx.a, mtx.b, mtx.c, mtx.d, mtx.tx - x, mtx.ty - y);
                    (hitArea || child).draw(ctx);
                    if (!this._testHit(ctx)) {
                        continue;
                    }
                    canvas.width = 0;
                    canvas.width = 1;
                    if (hasHandler) {
                        return this;
                    } else if (arr) {
                        arr.push(child);
                    } else {
                        return child;
                    }
                }
            }
            return null;
        }
    });

    return Container;

});