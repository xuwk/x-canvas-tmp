xc.module.define("xc.createjs.SpriteSheetUtils", function(exports) {

    /**
     * SpriteSheetUtils 是一个与{{#crossLink "SpriteSheet"}}{{/crossLink}}并用的静态方法的工具集合类。一个图片精灵是在一个整齐的网格上把一系列的图片（通常是动画的那些帧）合并成一张图片。
     * 例如，一个拥有8张100×100图片的动画可以合并成一张400×200的图片精灵里面（4×2）。SpriteSheetUtils类使用静态接口，不能被实例化。
     *
     * @class SpriteSheetUtils
     * @static
     */
    var SpriteSheetUtils = function() {
        throw "SpriteSheetUtils不能被实例化。";
    };

    /**
     * @property _workingCanvas
     * @static
     * @type HTMLCanvasElement | Object
     * @protected
     */
    SpriteSheetUtils._workingCanvas = document.createElement("canvas");

    /**
     * @property _workingContext
     * @static
     * @type CanvasRenderingContext2D
     * @protected
     */
    SpriteSheetUtils._workingContext = SpriteSheetUtils._workingCanvas.getContext("2d");

    /**
     * <b>这是一个实验性质的方法，可能会有bug。敬请报告问题。</b><br/><br/>
     * 通过对原始的帧进行水平、垂直翻转（或者两者皆有），和添加适当的动画与帧数据对已存在的图片精灵进行扩展。翻转动作会在它们的名字上加上前缀(_h, _v, _hv)。
     * 在调用这个方法前确保图片精灵的所有图片已经完全加载完毕。
     * <br/><br/>
     * 例如：<br/>
     * SpriteSheetUtils.addFlippedFrames(mySpriteSheet, true, true);
     * 以上会向mySpriteSheet添加同时经过水平翻转和垂直翻转的帧。
     * <br/><br/>
     * 注：你也可以对通过设置scaleX或者scaleY为负数来对任意显示对象进行翻转。在一些浏览器上（特别是那些不支持硬件加速canvas的），这个可能导致性能的轻微下降，这就是为什么addFlippedFrames是可用的原因。
     *
     * @method addFlippedFrames
     * @static
     * @param {SpriteSheet} spriteSheet
     * @param {Boolean} horizontal 如果为true，则添加水平翻转帧。
     * @param {Boolean} vertical 如果为true，则添加垂直翻转帧。
     * @param {Boolean} both 如果为true，则同时添加水平和垂直翻转帧。
     */
    SpriteSheetUtils.addFlippedFrames = function(spriteSheet, horizontal, vertical, both) {
        if (!horizontal && !vertical && !both) {
            return;
        }
        var count = 0;
        if (horizontal) {
            SpriteSheetUtils._flip(spriteSheet, ++count, true, false);
        }
        if (vertical) {
            SpriteSheetUtils._flip(spriteSheet, ++count, false, true);
        }
        if (both) {
            SpriteSheetUtils._flip(spriteSheet, ++count, true, true);
        }
    }

    /**
     * 作为一张新的PNG图片返回指定图片精灵的单独帧。注：在大多数情况下，相比起使用这个方法来切割出一帧并通过Bitmap实例来展示的方案，使用BitmapAnimation的暂停实例来展示一个单独帧是较优的。
     *
     * @method extractFrame
     * @static
     * @param {Image} spriteSheet 用来提取帧的SpriteSheet实例。
     * @param {Number} frame 需要提取的帧号或者动画名称。如果指定了动画名称，则该动画的第一帧会被提取出来。
     * @return {Image} 作为一张新PNG图片返回的指定表单的那个帧。
     */
    SpriteSheetUtils.extractFrame = function(spriteSheet, frame) {
        if (isNaN(frame)) {
            frame = spriteSheet.getAnimation(frame).frames[0];
        }
        var data = spriteSheet.getFrame(frame);
        if (!data) {
            return null;
        }
        var r = data.rect;
        var canvas = SpriteSheetUtils._workingCanvas;
        canvas.width = r.width;
        canvas.height = r.height;
        SpriteSheetUtils._workingContext.drawImage(data.image, r.x, r.y, r.width, r.height, 0, 0, r.width, r.height);
        var img = new Image();
        img.src = canvas.toDataURL("image/png");
        return img;
    };

    /**
     * 把一张图片的rgb通道与另一张图片的alpha通道进行合并。这个可以用来合并一张带有颜色数据的压缩过的JPEG图片和一张透明的单色PNG32图片。对那些类型的图片（那些压缩成JPEG的带细节的图片），
     * 对比起RGBA PNG32图片，这个方法可以保存为更小尺寸的图片。
     *
     * @method mergeAlpha
     * @static
     * @param {Image} rgbImage 包含了RGB通道的图片或canvas。
     * @param {Image} alphaImage 包含了alpha通道的图片或canvas。
     * @param {canvas} canvas 可选。如果指定了，这个canvas会被使用并返回。如果没有，则会创建一个新的canvas。
     * @return {canvas} 返回带有合并图片信息的canvas。这个可以用作BitMap和SpriteSheet的资源。
     */
    SpriteSheetUtils.mergeAlpha = function(rgbImage, alphaImage, canvas) {
        if (!canvas) {
            canvas = document.createElement("canvas");
        }
        canvas.width = Math.max(alphaImage.width, rgbImage.width);
        canvas.height = Math.max(alphaImage.height, rgbImage.height);
        var ctx = canvas.getContext("2d");
        ctx.save();
        ctx.drawImage(rgbImage, 0, 0);
        ctx.globalCompositeOperation = "destination-in";
        ctx.drawImage(alphaImage, 0, 0);
        ctx.restore();
        return canvas;
    };

    SpriteSheetUtils._flip = function(spriteSheet, count, h, v) {
        var imgs = spriteSheet._images;
        var canvas = SpriteSheetUtils._workingCanvas;
        var ctx = SpriteSheetUtils._workingContext;
        var il = imgs.length / count;
        for ( var i = 0; i < il; i++) {
            var src = imgs[i];
            src.__tmp = i; // 有一点hack的感觉，不过比在下面使用indexOf快。
            canvas.width = 0; // 确认它已经清空了。
            canvas.width = src.width;
            canvas.height = src.height;
            ctx.setTransform(h ? -1 : 1, 0, 0, v ? -1 : 1, h ? src.width : 0, v ? src.height : 0);
            ctx.drawImage(src, 0, 0);
            var img = new Image();
            img.src = canvas.toDataURL("image/png");
            // 处理一个在Safari下的怪异问题。
            img.width = src.width;
            img.height = src.height;
            imgs.push(img);
        }
        var frames = spriteSheet._frames;
        var fl = frames.length / count;
        for (i = 0; i < fl; i++) {
            src = frames[i];
            var rect = src.rect.clone();
            img = imgs[src.image.__tmp + il * count];
            var frame = {
                image: img,
                rect: rect,
                regX: src.regX,
                regY: src.regY
            };
            if (h) {
                rect.x = img.width - rect.x - rect.width; // 更新矩形
                frame.regX = rect.width - src.regX; // 更新登记的点
            }
            if (v) {
                rect.y = img.height - rect.y - rect.height; // 更新矩形
                frame.regY = rect.height - src.regY; // 更新登记的点
            }
            frames.push(frame);
        }
        var sfx = "_" + (h ? "h" : "") + (v ? "v" : "");
        var names = spriteSheet._animations;
        var data = spriteSheet._data;
        var al = names.length / count;
        for (i = 0; i < al; i++) {
            var name = names[i];
            src = data[name];
            var anim = {
                name: name + sfx,
                frequency: src.frequency,
                next: src.next,
                frames: []
            };
            if (src.next) {
                anim.next += sfx;
            }
            frames = src.frames;
            for ( var j = 0, l = frames.length; j < l; j++) {
                anim.frames.push(frames[j] + fl * count);
            }
            data[anim.name] = anim;
            names.push(anim.name);
        }
    }

    return SpriteSheetUtils;

});