(function(window) {

//
function Ship() {
  this.initialize();
}
var p = Ship.prototype = new createjs.Container();

// 静态属性:
	Ship.TOGGLE = 60;
	Ship.MAX_THRUST = 2;
	Ship.MAX_VELOCITY = 5;

// 公有属性:
	p.shipFlame;
	p.shipBody;
	
	p.timeout;
	p.thrust;
	
	p.vX;
	p.vY;
	
	p.bounds;
	p.hit;
	
// 构造方法:
	p.Container_initialize = p.initialize;	//避免覆盖原生的方法
	
	p.initialize = function() {
		this.Container_initialize();
		
		this.shipFlame = new createjs.Shape();
		this.shipBody = new createjs.Shape();
		
		this.addChild(this.shipFlame);
		this.addChild(this.shipBody);
		
		this.makeShape();
		this.timeout = 0;
		this.thrust = 0;
		this.vX = 0;
		this.vY = 0;
	}
	
// 公有方法:
	p.makeShape = function() {
		//绘制飞船的身体
		var g = this.shipBody.graphics;
		g.clear();
		g.beginStroke("#FFFFFF");
		
		g.moveTo(0, 10);	//船尖
		g.lineTo(5, -6);	//右翼
		g.lineTo(0, -2);	//凹槽
		g.lineTo(-5, -6);	//左翼
		g.closePath(); // 封闭
		
		
		//绘制飞船的火焰
		var o = this.shipFlame;
		o.scaleX = 0.5;
		o.scaleY = 0.5;
		o.y = -5;
		
		g = o.graphics;
		g.clear();
		g.beginStroke("#FFFFFF");
		
		
		g.moveTo(2, 0);		//船身
		g.lineTo(4, -3);	//右点
		g.lineTo(2, -2);	//右凹槽
		g.lineTo(0, -5);	//顶点
		g.lineTo(-2, -2);	//左凹槽
		g.lineTo(-4, -3);	//左点
		g.lineTo(-2, -0);	//封闭
		
		//最大的可视元素
		this.bounds = 10; 
		this.hit = this.bounds;
	}
	
	p.tick = function() {
		//根据速率移动
		this.x += this.vX;
		this.y += this.vY;
		
		//伴随推动力，会显示一个闪烁的火焰，根据推力大小变化
		if(this.thrust > 0) {
			this.timeout++;
			this.shipFlame.alpha = 1;
			
			if(this.timeout > Ship.TOGGLE) {
				this.timeout = 0;
				if(this.shipFlame.scaleX == 1) {
					this.shipFlame.scaleX = 0.5;
					this.shipFlame.scaleY = 0.5;
				} else {
					this.shipFlame.scaleX = 1;
					this.shipFlame.scaleY = 1;
				}
			}
			this.thrust -= 0.5;
		} else {
			this.shipFlame.alpha = 0;
			this.thrust = 0;
		}
	}
	
	p.accelerate = function() {
		//增加推动力，加速使用
		this.thrust += this.thrust + 0.6;
		if(this.thrust >= Ship.MAX_THRUST) {
			this.thrust = Ship.MAX_THRUST;
		}
		
		//加速
		this.vX += Math.sin(this.rotation*(Math.PI/-180))*this.thrust;
		this.vY += Math.cos(this.rotation*(Math.PI/-180))*this.thrust;
		
		//控制最大速度
		this.vX = Math.min(Ship.MAX_VELOCITY, Math.max(-Ship.MAX_VELOCITY, this.vX));
		this.vY = Math.min(Ship.MAX_VELOCITY, Math.max(-Ship.MAX_VELOCITY, this.vY));
	}

window.Ship = Ship;
}(window));