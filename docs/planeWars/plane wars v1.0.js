/* 单例模式 */

window.onload = function(){
	Game.exe();
};

var Game = {

	// 游戏启动函数，单例与外界唯一接口
	exe : function(){
		this.init();
	},
	
	// 初始化
	init : function(){
		// 重新开始时，清除舞台
		document.body.innerHTML = "";

		// 1. 创建 stage, 舞台
		var oStage = document.createElement("div");
		oStage.className = "stage";
		document.body.appendChild(oStage);

		// 2. 创建标题
		var oTitle = document.createElement("h1");
		oTitle.className = "s-title";
		oTitle.innerHTML = "飞机大战 v1.0";
		oStage.appendChild(oTitle);

		// 3. 创建 option, 进入游戏的选项
		var aOption = [],
			  aOptText = ["简单难度", "中等难度", "困难难度", "开挂模式"];
		var fragment = document.createDocumentFragment();
		var _this = this;
		for(var i = 0; i < 4; i++){
			aOption[i] = document.createElement("p");
			aOption[i].className = "s-option";
			aOption[i].innerHTML = aOptText[i];
			fragment.appendChild(aOption[i]);

			// 4. 点击，开始对应难度的游戏
			aOption[i].index = i;
			aOption[i].onclick = function(e){
				e = e || window.event;

				// 舞台清场，开始游戏
				oStage.innerHTML = "";
				// 创建分数
				oScore = document.createElement("p");
				oScore.innerHTML = "0";
				oScore.className = "score";
				oScore.style.cssText = "position: absolute; z-index: 10; left: 0; top: 0; color: #fff; font-weight: 700; font-size: 18px; line-height: 24px; text-indent: 0.4em;";
				oStage.appendChild(oScore);
				_this.start(oStage, e, this.index);
			};
		}
		oStage.appendChild(fragment);
	},

	// 游戏开始
	start : function(stage, e, option){
		// 1. 生成战机
		var oPlane = this.plane(stage, e);

		// 2. 发射子弹
		var bullet_speed, enemy_speed;
		switch(option){
			case 0: 
				bullet_speed = 300;
				enemy_speed = 800;
				break;
			case 1:
				bullet_speed = 250;
				enemy_speed = 600;
				break;
			case 2:
				bullet_speed = 200;
				enemy_speed = 400;
				break;
			case 3:
				bullet_speed = 80;
				enemy_speed = 200;
				break;
		}

		var bullet_timer = setInterval(function(){
			this.bullet(stage, oPlane);
		}.bind(this), bullet_speed);

		// 3. 生成敌机
		var enemy_timer = setInterval(function(){
			this.enemy(stage);
		}.bind(this), enemy_speed);

		// 4. 碰撞检测
		var oScore = document.querySelector(".score");
		this.requestAnimationFrame(function(){
			var aEnemy = document.querySelectorAll(".enemy"),
				  aBullet = document.querySelectorAll(".bullet");
			
			for(var i = 0, length = aEnemy.length; i < length; i++){
				// 战机和敌机碰撞检测
				if(this.isCollide(oPlane, aEnemy[i])){
					// 战机，敌机爆炸
					this.boom(stage, oPlane, true);
					this.boom(stage, aEnemy[i], false);
					// 游戏结束，清除定时器
					clearInterval(bullet_timer);
					clearInterval(enemy_timer);
					// continue?
					this.isContinue(stage, oScore);
					return;
				}

				// 子弹和敌机碰撞检测
				for(var j = 0, length_j = aBullet.length; j < length_j; j++){
					if(this.isCollide(aBullet[j], aEnemy[i])){
						// 敌机爆炸
						this.boom(stage, aEnemy[i], false);
						// 子弹消失
						aBullet[j].parentNode.removeChild(aBullet[j]);
						// 计分
						this.score(oScore);
					}
				}
			}
			
			// 递归
			this.requestAnimationFrame(arguments.callee.bind(this));
		}.bind(this));
	},

	// 有关战机函数
	plane : function(stage, e){
		// 1. 创建 战机
		var oPlane = new Image();	// 同document.createElement("img")
		oPlane.src = "./images/plane.png";
		oPlane.width = 60;
		oPlane.height = 36;
		oPlane.style.position = "absolute";
		stage.appendChild(oPlane);

		// 2. 初始位置跟随鼠标
		var borderW = parseFloat(this.getCssJson(stage, "borderWidth"));
		var x = stage.offsetLeft + borderW + oPlane.offsetWidth / 2,
			  y = stage.offsetTop + borderW + oPlane.offsetHeight / 2;
		var left = e.clientX - x,
			  top = e.clientY - y;

		window.onresize = function(){
			x = stage.offsetLeft + borderW + oPlane.offsetWidth / 2;
		};

		oPlane.style.left = left + "px";
		oPlane.style.top = top + "px";

		// 3. 战机移动

		// 边界
		var boundaryWMax = stage.offsetWidth -  2*borderW - oPlane.offsetWidth / 2,
			  boundaryWMin = -oPlane.offsetWidth / 2;
			  boundaryH = stage.offsetHeight -  2* borderW - oPlane.offsetHeight;

		document.onmousemove = function(e){
			e = e || window.event;
			
			// 战机位置 = 鼠标位置 -  差值
			var newLP = e.clientX - x,
				  newTP = e.clientY - y;

			// 限界: 最小值控最大边界，最大值控最小边界
			newLP =  Math.min(boundaryWMax, newLP);
			newLP = Math.max(boundaryWMin, newLP);
			newTP = Math.min(boundaryH, newTP);
			newTP = Math.max(0, newTP);

			oPlane.style.left = newLP + "px";
			oPlane.style.top = newTP + "px";
		};

		return oPlane;
	},

	// 子弹相关函数
	bullet: function(stage, plane){
		// 生成子弹
		var oBullet = new Image();
		oBullet.src = "images/bullet.png";
		oBullet.width = 6;
		oBullet.height = 22;
		oBullet.className = "bullet";
		oBullet.style.left = plane.offsetLeft + plane.width / 2 - oBullet.width / 2 + "px";
		oBullet.style.top = plane.offsetTop  - oBullet.height + "px";
		stage.appendChild(oBullet);
		
		// 子弹移动
		var boundary = -oBullet.height;
		this.requestAnimationFrame(function(){
			var top = oBullet.offsetTop;
			top -= 4;
			if(top <= boundary){
				oBullet.style.top = boundary + "px";
				oBullet.parentNode.removeChild(oBullet);
				return;
			}
			oBullet.style.top = top + "px";
			this.requestAnimationFrame(arguments.callee.bind(this));
		}.bind(this));
	},

	// 敌机相关函数
	enemy: function(stage){
		// 生成敌机
		var oEnemy = new Image();
		oEnemy.src = "images/enemy.png";
		oEnemy.width = 23;
		oEnemy.height = 30;
		oEnemy.className = "enemy";
		// 随机出场
		oEnemy.style.left = Math.random() * (stage.clientWidth - oEnemy.width) + "px";
		oEnemy.style.top = -oEnemy.height;
		stage.appendChild(oEnemy);

		// 设置敌机移动速度，随机
		var speed = ~~(Math.random() * 2 + 2);

		// 敌机移动
		var boundary = stage.clientHeight;
		this.requestAnimationFrame(function(){
			var top = oEnemy.offsetTop;
			top += speed;
			// 超出边界消失
			if(top >= boundary){
				oEnemy.style.top = boundary + "px";
				oEnemy.parentNode.removeChild(oEnemy);
				return;
			}
			oEnemy.style.top = top + "px";
			// 递归
			this.requestAnimationFrame(arguments.callee.bind(this));
		}.bind(this));
	},

	// 飞机爆炸
	boom: function(stage, obj, bool){
		// 飞机爆炸
		var oBoom = new Image();
		oBoom.src = bool ? "images/boom2.png" : "images/boom.png";
		oBoom.width = bool ? 60 : 23;
		oBoom.height = bool ? 36 : 30;
		oBoom.style.position = "absolute";
		oBoom.style.left = obj.offsetLeft + "px";
		oBoom.style.top = obj.offsetTop + "px";
		stage.appendChild(oBoom);

		// 删除飞机
		obj.parentNode.removeChild(obj);

		// 延迟设置 爆炸效果消失
		setTimeout(function(){
			oBoom.parentNode.removeChild(oBoom);
		}, 500);
	},

	// 碰撞检测相关
	isCollide: function(obj1, obj2){
		// 碰撞的情况很多，但不碰撞的情况只有4种
		// 加一步判断，对象是否还存在
		if(obj1.parentNode && obj2.parentNode){
			var left1 = obj1.offsetLeft,
				  top1 = obj1.offsetTop,
				  bottom1 = obj1.offsetTop + obj1.offsetHeight,
				  right1 = obj1.offsetLeft + obj1.offsetWidth;

			var left2 = obj2.offsetLeft,
				  top2 = obj2.offsetTop,
				  bottom2 = obj2.offsetTop + obj2.offsetHeight,
				  right2 = obj2.offsetLeft + obj2.offsetWidth;

			if(left1 > right2 || right1 < left2 || top1 > bottom2 || bottom1 < top2){
				return false;
			}else{
				return true;
			}
		}
		return false;
	},

	// 计分
	score: function(oScore){
		score = parseInt(oScore.innerHTML);
		score += 10;
		oScore.innerHTML = score;
	},

	// 游戏结束，是否继续
	isContinue: function(stage, oScore){
		var _this = this;

		// 延迟清场
		setTimeout(function(){		
			stage.innerHTML = "";
			// 弹窗，提示是否继续游戏
			var oWrap = document.createElement("div"),
				  oTitle = document.createElement("h2"),
				  oTip = document.createElement("p"),
				  oBtn = document.createElement("buttom");
			oWrap.style.cssText = "overflow: hidden; width: 200px; height: 400px; margin: 50px auto; background: #fff; text-align: center;";
			oTitle.style.cssText = "margin: 80px 0 20px; font-size: 24px; line-height: 60px; text-align: center;";
			oTitle.innerHTML = "Game Over";
			oTip.innerHTML = "您的得分：" + oScore.innerHTML;
			oBtn.innerHTML = "重新开始";
			oBtn.style.cssText = "display: block; width: 100px; height: 30px; margin: 10px auto; background: #000; color: #fff; font-size: 12px; line-height: 30px; cursor: pointer;";
			oWrap.appendChild(oTitle);
			oWrap.appendChild(oTip);
			oWrap.appendChild(oBtn);
			stage.appendChild(oWrap);

			// 点击重新开始
			oBtn.onclick = function(){
				_this.init();
			};
		}, 500);
		
	},
	
	// 获取css样式函数
	getCssJson : function(obj, attr){
		return !-[-1,] ? obj.currentStyle[attr] : getComputedStyle(obj)[attr];
	},

	requestAnimationFrame : function(fn){
		return window.requestAnimationFrame ? setTimeout(fn, 1000 / 60) : window.requestAnimationFrame(fn); 
	},
	
};