(function () {
    // 一些所需的DOM对象
    var $playground = $('#playground');     // 桌
    var $paddleA = $('#paddleA'),           // 球拍A
        $paddleB = $('#paddleB');           // 球拍B
    var $ball = $('#ball');                 // 球
    var $scoreA = $('#scoreA'),             // 玩家A的记分牌
        $scoreB = $('#scoreB');             // 玩家B的记分牌
    var $round = $('#round > span');        // 当前对战局
    var $tip = $('#tip');                   // 游戏提示

    // 键值常量
    var KEY = {
        UP: 38,
        DOWN: 40,
        W: 87,
        S: 83
    };

    // 一些常量
    var PLAYGROUND_WIDTH = parseInt($playground.css('width')),        // 桌的宽
        PLAYGROUND_HEIGHT = parseInt($playground.css('height'));      // 桌的高
    var BALL_INITX = 340,   // 球的初始位置
        BALL_INITY = 250;   // 球的初始位置
    var SCORE_A = 0,        // 玩家A的初始分数
        SCORE_B = 0;        // 玩家B的初始分数

    // 定义乒乓球属性：宽高、坐标、运动速度、方向
    var oBall = {
        w: parseInt($ball.css('width')),
        h: parseInt($ball.css('height')),
        x: BALL_INITX,
        y: BALL_INITY,
        speed: 5,
        directionX: 1,
        directionY: 1
    };

    // 定义球拍的一些通用属性：宽高、运动速度
    var oPaddle = {
        w: parseInt($paddleA.css('width')),
        h: parseInt($paddleA.css('height')),
        speed: 5
    };

    var pressedKey = [];    // 存储玩家按键情况

    // 完善游戏流程：任意键开始游戏 → 五局对战 → 结束游戏
    
    /* 1. 创建游戏主循环 */
    var timer = setInterval(gameloop, 30);

    $(document).keydown(function (e) {
        pressedKey[e.which] = true;
    });
    $(document).keyup(function (e) {
        pressedKey[e.which] = false;
    });

    
    /* 2.主循环需要的一些功能块 */
    function gameloop() {
        if (pressedKey.length !== 0) {
            // 初始化
            gameInit();
            // 小球移动
            moveBall();
            // 玩家行为
            movePaddles();
        }
    }

    function moveBall() {
        // 球和球拍的碰撞检测，水平分量的改变
        collideBall();

        // 桌面边缘检测，垂直分量的改变
        collideEdge();

        // 数据上更新小球位置
        var newX = oBall.x + oBall.speed * oBall.directionX,
            newY = oBall.y + oBall.speed * oBall.directionY;

        oBall.x = newX;
        oBall.y = newY;

        // 左右边缘检测，计分
        if (oBall.x < 0) {
            // 玩家B得分 & 结束本局对战
            $scoreB.html(++SCORE_B);
            endRound();
        }   
        if (oBall.x + oBall.w > PLAYGROUND_WIDTH) {
            // 玩家A得分 & 结束本局对战
            $scoreA.html(++SCORE_A);
            endRound();
        }

        // 渲染
        $ball.css({
            "left": oBall.x,
            "top": oBall.y
        });
    }

    function movePaddles() {
        // 玩家A的行为：W、S 键
        if (pressedKey[KEY.W]) {
            var top = parseInt($paddleA.css('top'));
            var newTop = Math.max(top - oPaddle.speed, 0);                   // 顶边限制
            $paddleA.css('top', newTop);
        }
        if (pressedKey[KEY.S]) {
            var top = parseInt($paddleA.css('top'));
            var newTop = Math.min(PLAYGROUND_HEIGHT - oPaddle.h, top + oPaddle.speed);   // 底边限制
            $paddleA.css('top', newTop);
        }

        // 玩家B的行为：UP、DOWN 键
        if (pressedKey[KEY.UP]) {
            var top = parseInt($paddleB.css('top'));
            var newTop = Math.max(top - oPaddle.speed, 0);                   // 顶边限制
            $paddleB.css('top', newTop);
        }
        if (pressedKey[KEY.DOWN]) {
            var top = parseInt($paddleB.css('top'));
            var newTop = Math.min(PLAYGROUND_HEIGHT - oPaddle.h, top + oPaddle.speed);   // 底边限制
            $paddleB.css('top', newTop);
        }
    }

    // 碰撞检测
    function collideBall() {
        // 碰撞的情况：球 collide 球拍A; 球 collide 球拍B
        var oPaddleA = Object.create(oPaddle, {
            x: {
                value: parseInt($paddleA.css('left')),
                writable: true,
                configurable: true
            },
            y: {
                value: parseInt($paddleA.css('top')),
                writable: true,
                configurable: true
            }
        });
        var oPaddleB = Object.create(oPaddle, {
            x: {
                value: parseInt($paddleB.css('left')),
                writable: true,
                configurable: true
            },
            y: {
                value: parseInt($paddleB.css('top')),
                writable: true,
                configurable: true
            }
        });

        // 1. 检测与球拍A的碰撞
        if (oBall.x + oBall.speed * oBall.directionX < oPaddleA.x + oPaddleA.w) {
            var top = oBall.y + oBall.speed * oBall.directionY;
            if (top >= oPaddleA.y && top <= oPaddleA.y + oPaddleA.h) {
                oBall.directionX = -oBall.directionX;
            }
        }

        // 2. 检测与球拍B的碰撞
        if (oBall.x + oBall.w + oBall.speed * oBall.directionX > oPaddleB.x) {
            var top = oBall.y + oBall.speed * oBall.directionY;
            if (top >= oPaddleB.y && top <= oPaddleB.y + oPaddleB.h) {
                oBall.directionX = -oBall.directionX;
            }
        }
    }

    // 桌面上下边缘碰撞检测
    function collideEdge() {
        var top = oBall.y + oBall.speed * oBall.directionY;
        if (top < 0 || (top + oBall.h > PLAYGROUND_HEIGHT)) {
            oBall.directionY = -oBall.directionY;
        }
    }

    // 结束当前局
    function endRound() {
        var round = parseInt($round.html());
        if (round === 5) {
            // 结束游戏
            gameover();
        }else {
            // 游戏暂停
            gamePause();
            $round.html(++round);
        }
    }

    // 开始游戏
    function gameInit() {
        $tip.fadeOut();
    }

    // 暂停游戏
    function gamePause() {
        pressedKey = [];
        oBall.x = BALL_INITX;
        oBall.y = BALL_INITY;
        $tip.html('Game Pause').fadeIn();
    }

    // 结束游戏
    function gameover() {
        $tip.html('Game Over').fadeIn();
        // 清除定时器
        clearInterval(timer);
        timer = null;
    }
})();



