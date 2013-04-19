xc.module.define("xc.createjs.Ease", function(exports) {

    /**
     * Ease 类提供了一个用于 TweenJS 的 easing 方法集合。
     * 这里并不使用标准的4个参数。取而代之的是用单一的一个能表明进度比（0 到 1）的参数。
     * <br/>
     * <br/>
     * 很多 Ease 里面的方法都能直接作为 easing 方法使用：<br />
     *     Tween.get(target).to({x:100}, 500, Ease.linear);<br/>
     * <br/>
     * 然而，"get" 开始的方法将会基于参数值返回 easing 方法：<br /> 
     *     Tween.get(target).to({y:200}, 500, Ease.getPowIn(2.2));<br/>
     * <br/>
     *
     * 请看 <a href="http://www.createjs.com/#!/TweenJS/demos/sparkTable">spark table demo</a> 获得其他不同的 ease 类型来自
     * <a href="http://tweenjs.com">TweenJS.com</a>。
     *
     * @class Ease
     * @static
     **/
    var Ease = function() {
        throw "Ease cannot be instantiated.";
    }

    /**
     * @method linear
     * @static
     */
    Ease.linear = function(t) {
        return t;
    }

    /**
     * 与 linear 相同。
     * 
     * @method none
     * @static
     */
    Ease.none = Ease.linear;

    /**
     * 在 Flash Pro 里模仿简单的 -100 到 100 easing。
     *
     * @method get
     * @param amount 一个介乎 -1 (ease in) 到 1 (ease out) 的值，指出 ease 的方向和强度。
     * @static
     */
    Ease.get = function(amount) {
        if (amount < -1) {
            amount = -1;
        }
        if (amount > 1) {
            amount = 1;
        }
        return function(t) {
            if (amount == 0) {
                return t;
            }
            if (amount < 0) {
                return t * (t * -amount + 1 + amount);
            }
            return t * ((2 - t) * amount + (1 - amount));
        }
    };

    /** 
     * 可配置指数的 ease。
     * 
     * @method getPowIn
     * @param 要配置的指数 (ex. 3 会返回 ease 的立方)。
     * @static
     **/
    Ease.getPowIn = function(pow) {
        return function(t) {
            return Math.pow(t, pow);
        }
    };

    /** 
     * 可配置的指数的 ease。
     * 
     * @method getPowOut
     * @param pow 指数使用(ex. 3 会返回 ease 的立方)。
     * @static
     **/
    Ease.getPowOut = function(pow) {
        return function(t) {
            return 1 - Math.pow(1 - t, pow);
        }
    };

    /** 
     * 可配置指数的 ease。
     * 
     * @method getPowInOut
     * @param 要配置的指数 (ex. 3 会返回 ease 的立方)。
     * @static
     **/
    Ease.getPowInOut = function(pow) {
        return function(t) {
            if ((t *= 2) < 1) {
                return 0.5 * Math.pow(t, pow);
            }
            return 1 - 0.5 * Math.abs(Math.pow(2 - t, pow));
        }
    };

    /**
     * @method quadIn
     * @static
     */
    Ease.quadIn = Ease.getPowIn(2);

    /**
     * @method quadOut
     * @static
     */
    Ease.quadOut = Ease.getPowOut(2);

    /**
     * @method quadInOut
     * @static
     */
    Ease.quadInOut = Ease.getPowInOut(2);

    /**
     * @method cubicIn
     * @static
     */
    Ease.cubicIn = Ease.getPowIn(3);

    /**
     * @method cubicOut
     * @static
     */
    Ease.cubicOut = Ease.getPowOut(3);

    /**
     * @method cubicInOut
     * @static
     */
    Ease.cubicInOut = Ease.getPowInOut(3);

    /**
     * @method quartIn
     * @static
     */
    Ease.quartIn = Ease.getPowIn(4);

    /**
     * @method quartOut
     * @static
     */
    Ease.quartOut = Ease.getPowOut(4);

    /**
     * @method quartInOut
     * @static
     */
    Ease.quartInOut = Ease.getPowInOut(4);

    /**
     * @method quintIn
     * @static
     */
    Ease.quintIn = Ease.getPowIn(5);

    /**
     * @method quintOut
     * @static
     */
    Ease.quintOut = Ease.getPowOut(5);

    /**
     * @method quintInOut
     * @static
     */
    Ease.quintInOut = Ease.getPowInOut(5);

    /**
     * @method sineIn
     * @static
     */
    Ease.sineIn = function(t) {
        return 1 - Math.cos(t * Math.PI / 2);
    };

    /**
     * @method sineOut
     * @static
     */
    Ease.sineOut = function(t) {
        return Math.sin(t * Math.PI / 2);
    };

    /**
     * @method sineInOut
     * @static
     */
    Ease.sineInOut = function(t) {
        return -0.5 * (Math.cos(Math.PI * t) - 1)
    };

    /** 
     * 配置 "back in" ease。
     * 
     * @method getBackIn
     * @param amount ease 的强度。
     * @static
     **/
    Ease.getBackIn = function(amount) {
        return function(t) {
            return t * t * ((amount + 1) * t - amount);
        }
    };

    /**
     * @method backIn
     * @static
     */
    Ease.backIn = Ease.getBackIn(1.7);

    /** 
     * 配置 "back out" ease。
     * 
     * @method getBackOut
     * @param amount ease 的强度。
     * @static
     **/
    Ease.getBackOut = function(amount) {
        return function(t) {
            return (--t * t * ((amount + 1) * t + amount) + 1);
        }
    };

    /**
     * @method backOut
     * @static
     */
    Ease.backOut = Ease.getBackOut(1.7);

    /** 
     * 配置 "back in out" ease。
     * 
     * @method getBackInOut
     * @param amount ease 的强度。
     * @static
     **/
    Ease.getBackInOut = function(amount) {
        amount *= 1.525;
        return function(t) {
            if ((t *= 2) < 1) {
                return 0.5 * (t * t * ((amount + 1) * t - amount));
            }
            return 0.5 * ((t -= 2) * t * ((amount + 1) * t + amount) + 2);
        }
    };

    /**
     * @method backInOut
     * @static
     */
    Ease.backInOut = Ease.getBackInOut(1.7);

    /**
     * @method circIn
     * @static
     */
    Ease.circIn = function(t) {
        return -(Math.sqrt(1 - t * t) - 1);
    };

    /**
     * @method circOut
     * @static
     */
    Ease.circOut = function(t) {
        return Math.sqrt(1 - (--t) * t);
    };

    /**
     * @method circInOut
     * @static
     */
    Ease.circInOut = function(t) {
        if ((t *= 2) < 1) {
            return -0.5 * (Math.sqrt(1 - t * t) - 1);
        }
        return 0.5 * (Math.sqrt(1 - (t -= 2) * t) + 1);
    };

    /**
     * @method bounceIn
     * @static
     */
    Ease.bounceIn = function(t) {
        return 1 - Ease.bounceOut(1 - t);
    };

    /**
     * @method bounceOut
     * @static
     */
    Ease.bounceOut = function(t) {
        if (t < 1 / 2.75) {
            return (7.5625 * t * t);
        } else if (t < 2 / 2.75) {
            return (7.5625 * (t -= 1.5 / 2.75) * t + 0.75);
        } else if (t < 2.5 / 2.75) {
            return (7.5625 * (t -= 2.25 / 2.75) * t + 0.9375);
        } else {
            return (7.5625 * (t -= 2.625 / 2.75) * t + 0.984375);
        }
    };

    /**
     * @method bounceInOut
     * @static
     */
    Ease.bounceInOut = function(t) {
        if (t < 0.5) {
            return Ease.bounceIn(t * 2) * .5;
        }
        return Ease.bounceOut(t * 2 - 1) * 0.5 + 0.5;
    };

    /** 
     * 配置 elastic ease。
     * 
     * @method getElasticIn
     * @param amplitude
     * @param period
     * @static
     **/
    Ease.getElasticIn = function(amplitude, period) {
        var pi2 = Math.PI * 2;
        return function(t) {
            if (t == 0 || t == 1) {
                return t;
            }
            var s = period / pi2 * Math.asin(1 / amplitude);
            return -(amplitude * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * pi2 / period));
        }
    };

    /**
     * @method elasticIn
     * @static
     */
    Ease.elasticIn = Ease.getElasticIn(1, 0.3);

    /** 
     * 配置 elastic ease。
     * 
     * @method getElasticOut
     * @param amplitude
     * @param period
     * @static
     **/
    Ease.getElasticOut = function(amplitude, period) {
        var pi2 = Math.PI * 2;
        return function(t) {
            if (t == 0 || t == 1) {
                return t;
            }
            var s = period / pi2 * Math.asin(1 / amplitude);
            return (amplitude * Math.pow(2, -10 * t) * Math.sin((t - s) * pi2 / period) + 1);
        }
    };

    /**
     * @method elasticOut
     * @static
     */
    Ease.elasticOut = Ease.getElasticOut(1, 0.3);

    /** 
     * 配置 elastic ease。
     * 
     * @method getElasticInOut
     * @param amplitude
     * @param period
     * @static
     **/
    Ease.getElasticInOut = function(amplitude, period) {
        var pi2 = Math.PI * 2;
        return function(t) {
            var s = period / pi2 * Math.asin(1 / amplitude);
            if ((t *= 2) < 1) {
                return -0.5 * (amplitude * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * pi2 / period));
            }
            return amplitude * Math.pow(2, -10 * (t -= 1)) * Math.sin((t - s) * pi2 / period) * 0.5 + 1;
        }
    };

    /**
     * @method elasticInOut
     * @static
     */
    Ease.elasticInOut = Ease.getElasticInOut(1, 0.3 * 1.5);

    return Ease;

});
