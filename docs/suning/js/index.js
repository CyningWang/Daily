/* 动态适配html font-size基准值 */
	
// alert(window.orientation);

(function(win, doc){
	var docEle = doc.documentElement || document.body;		// 获取HTML标签
	
	var container = doc.getElementById("container");

	/* 判断设备类型：移动端 || PC端
		移动端	横竖屏事件		orientationchange
		PC端		窗口改变事件	resize
	*/
	var resize = "onorientationchange" in win ? "orientationchange" : "resize";

	// 适配 rem, rem 的比例关系是100 : 1
	function remAdaptation(){
		docEle.style.fontSize = 100 * (container.clientWidth / 750) + "px";
	}
	
	// 添加监听，DOM加载完成，执行remAdaptation函数
	doc.addEventListener("DOMContentLoaded", remAdaptation, false);
	
	// 监听宽度变化，宽度改变，执行remAdaption函数
	win.addEventListener(resize, remAdaptation, false);
})(window, document);

/* 掌上抢 - 倒计时 */

var oPEle = document.querySelector(".rush-label"),
	  oLabel = oPEle.querySelector(".rush-label > span"),
	  oSpan = document.querySelectorAll(".rush-count > span");
	  
var date = new Date();		// 获取当前本地时间

var endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), oLabel.innerHTML);

var aCount = countdown( date, endDate);	

// 专场还未开始，才启动倒计时，否则提示专场已结束
if(aCount != 0){
	for(var i = 0, length = oSpan.length; i < length; i++){
		oSpan[i].innerHTML = aCount[i];
	}

	// 启动倒计时
	var timer = setInterval(function(){
		var startDate = new Date();
		var aCount = countdown(startDate, endDate);
		if(aCount == 0){
			clearInterval(timer);
			oPEle.innerHTML = "<span>" + oLabel.innerHTML + "</span>点场 已结束";
			for(var i = 0, length = oSpan.length; i < length; i++){
				oSpan[i].innerHTML = "00";
			}	
			return;
		}
		for(var i = 0, length = oSpan.length; i < length; i++){
			oSpan[i].innerHTML = aCount[i];
		}		
	}, 1000);
}else{
	oPEle.innerHTML = "<span>" + oLabel.innerHTML + "</span>点场 已结束";
}



// 一天以内的倒计时
// 倒数毫秒数 <= 0, 返回0，否则返回时分秒的数组
function countdown(start, end){
	var count = end - start;			// Date对象运算返回毫秒数

	var hh = Math.floor(count / (1000 * 60 * 60)) % 24;	// 毫秒数 -> 小时数，模余， 得到不满一天的小时数

	var mm = Math.floor(count / (1000 * 60)) % 60;			// 毫秒数 -> 分钟数， 模余，得到不满一小时的分钟数

	var ss = Math.floor(count / 1000) % 60;						// 毫秒数 -> 秒数， 模余，得到不满一分钟的秒数

	var ret = count > 0 ? [formatTime(hh), formatTime(mm), formatTime(ss)] : 0;

	return ret;
}

function formatTime(time){
	if(time < 10){
		time = "0" + time;
	}
	return time;
}


/* 返回顶部 */
var toTop = document.getElementById("top"),
	  oSearchbox = document.querySelector(".s-searchbox");

toTop.onclick = function(){
	window.scrollTo(0, 0);
};

window.onscroll = function(){
	var yPos = document.documentElement.scrollTop || document.body.scrollTop;		// 写两个是为了兼容
	if(yPos < 900){
		toTop.className = "hide";
	}else{
		toTop.className = "";
	}

	/* yPos == 0 时透明搜索框 */
	if(yPos == 0){
		oSearchbox.className += " top";
	}else{
		oSearchbox.className = "s-searchbox";
	}
};