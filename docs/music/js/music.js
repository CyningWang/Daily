(function(window, undefined){
	/* 所有需要用到的变量 */
	var audio = document.querySelector('audio.player-audio'); // 音频播放器

	var songSrc = [], 
		  lrcSrc = [];

	var songid; // 歌曲id

	var tip = document.getElementById('tip');

	/* 搜索框 */
	var search = document.querySelector('#top input[type="text"]');
	var inSearch = false; // 指示当前请求是否由搜索框发出
	var searchlist = document.querySelector('#searchlist'),
		  ul_content = searchlist.querySelector('ul'),
		  aP; // 歌词项
	searchlist.isHidden = true;

	/* 歌词区域 */
	var lrcArea = document.querySelector('#middle .m-lrc'),
		  lrc_content = lrcArea.querySelector('.lrc-content');

	/* 进度条 */
	var process = document.querySelector('#bottom .pro-bar'),
		  pro_bar = process.querySelector('.bar'),
		  pro_btn = process.querySelector('.btn'),
		  cur_time = document.querySelector('#bottom .curTime'),
		  all_time = document.querySelector('#bottom .allTime');

	/* 按键 */
	var btns = document.querySelectorAll('.b-button > a'),
		  btn_style = btns[0], // 播放方式键（默认随机）
		  btn_prev = btns[1],  // 上一首
		  btn_play = btns[2],  // 播放键、暂停键
		  btn_next = btns[3];  // 下一首 

	var mark = true, // 播放 or 暂停
		  first = 0;      // 从头播放，还是继续播放

	var playStyle = 2; // 默认随机

	/* 历史 */
	var his_list = document.getElementById('history'),
		  btn_his = document.querySelectorAll('#top a')[1];
	his_list.isHidden = true;
	var bound = btn_his.getBoundingClientRect();
	btn_his.left = bound.left,
	btn_his.right = bound.right,
	btn_his.top = bound.top,
	btn_his.bottom = bound.bottom;

	/* 歌单 */
	var playlist = document.getElementById('playlist'),   // 歌单
		  btn_list = document.querySelectorAll('#top a')[0];  // 歌单按钮
	playlist.isHidden = true; // 默认隐藏
	// 获取所有歌单内部的歌曲span
	playlist.songs = playlist.querySelectorAll('span.songname');
	// 歌单中当前正在播放的歌曲序号
	var index = 0; // 默认第一首

	// 获取歌曲位置 & 歌手位置
	var title = document.querySelector('#middle p.m-title'),
		  singer = document.querySelector('#middle p.m-singer');

	// 图片位置
	var cd = document.querySelector('#middle .m-cd');

	// 歌单显示隐藏
	// 获取边界，判断是否在按钮范围内触发事件
	var bound = btn_list.getBoundingClientRect();
	btn_list.left = bound.left,
	btn_list.right = bound.right,
	btn_list.top = bound.top,
	btn_list.bottom = bound.bottom;
	
	btn_list.addEventListener('touchend', function(e){
		var x = e.changedTouches[0].clientX,
			  y = e.changedTouches[0].clientY;
		if(x > this.left && x < this.right && y > this.top && y < this.bottom){
			if(playlist.isHidden){
				playlist.style.display = 'block';

				// 更新歌单列表的边界值
				var bound = playlist.getBoundingClientRect();
				playlist.left = bound.left;
				playlist.top = bound.top;
				playlist.right = bound.right;
				playlist.bottom = bound.bottom;

				// 获取所有歌单内部的歌曲span
				playlist.songs = playlist.querySelectorAll('span.songname');
			}else{
				playlist.style.display = 'none';
			}
			playlist.isHidden = !playlist.isHidden;
		}
	}, false);

	// 空白处点击隐藏
	// 同样获取歌单的边界，在歌单之外的点击都有效，获取在显示的时候获取
	document.addEventListener('touchstart', function(e){
		var oTouch = e.changedTouches[0];
		var x = oTouch.clientX,
			  y = oTouch.clientY; 

		// 空白处：不包括列表区域和歌单按钮区域
		if(oTouch.target === btn_list){
			return;
		}
		if(!(x > playlist.left && x < playlist.right && y > playlist.top && y < playlist.bottom)){
			playlist.style.display = 'none';
			playlist.isHidden = true;
		}
	}, false);

	// 事件委托，歌单播放
	playlist.addEventListener('touchstart', function(e){
		// 点击歌曲，播放
		var oTarget = e.changedTouches[0].target;

		songid = oTarget.parentNode.children[0].id;

		if(oTarget.className === 'songname'){
			var songname = oTarget.innerHTML;
			playmusic(songname);

			// 变更当前正在播放的歌单索引 
			/*for(i in playlist.songs){
				if(playlist.songs[i] === oTarget){
					index = i;
				}
			}*/
			index = oTarget.parentNode.indexOf();

			// 隐藏歌单, 点击播放后，并不立刻隐藏，这种效果挺好的
			// playlist.style.display = 'none';
			// playlist.isHidden = true;
		}else if(oTarget.className === 'remove'){
			// 删除节点 & 重新获取歌曲列表
			var tarIndex = oTarget.parentNode.indexOf();
			playlist.removeChild(oTarget.parentNode);
			playlist.songs = playlist.querySelectorAll('span.songname');
			if(tarIndex === index){
				// 自动播放歌单下一曲, 删除当前项后，更新的index就是原来的下一曲
				playmusic(playlist.songs[index]);
			}
			tarIndex < index && (--index < 0) && (index = playlist.songs.length - 1);
		}
	}, false);

	// 播放音乐
	function playmusic(songname){
		if(songname !== undefined){
			// ①，请求资源
			createSongSrc(songname);
		}

		// ②，等待资源加载完成，canplay事件触发时，资源加载完成
		audio.addEventListener('canplay', function(){
			// ③，加载完成，延迟执行(保险一些)
			setTimeout(function(){
				audio.play();
				// 状态变更
				mark = false; 
				first = 1;
				// UI变更
				btn_play.style.backgroundImage = 'url("./images/pause.png")';
				cd.className = 'm-cd rotate';
				all_time.innerHTML = formatTime(audio.duration);
			}, 100);
		}, false);
	}

	// 播放、暂停键
	btn_play.addEventListener('touchstart', function(e){
		// 播放
		var img = '',
			  className = '';
		if(mark){
			if(first === 0){
				// 首次播放，默认播放歌单第一首
				if(playlist.songs[0] === undefined){
					// 提示，歌单为空
					alert('歌单为空');
				}else{
					var songname = playlist.songs[0].innerHTML;
					playmusic(songname);
					return; // 状态变更都在playmusic中处理过了，因此直接返回
				}
			}else{
				// 继续播放
				audio.play();
				first++;
				img = 'pause.png';
				className = 'm-cd rotate';
			}
		}else{ // 暂停
			audio.pause();
			img = 'play.png';
			className = 'm-cd rotate pause';
		}
		mark = !mark;
		this.style.backgroundImage = 'url("./images/' + img + '")';
		cd.className = className;
	}, false);

	// 上一首, 下一首设定如下，默认与播放方式无关
	// 播放方式只与正常播放有关
	btn_prev.addEventListener('touchstart', function(e){
		// 选取歌单中上一首，当前项为index的值
		index --;
		if(index < 0) index = playlist.songs.length - 1;
		playmusic(playlist.songs[index].innerHTML);
	}, false);

	btn_next.addEventListener('touchstart', function(e){
		nextSong();
	}, false);

	// 下一首歌曲
	function nextSong(){
		index ++;
		index %= playlist.songs.length;
		playmusic(playlist.songs[index].innerHTML);
	}

	// 进度条
	audio.addEventListener('timeupdate', function(){
		// 获取当前时间, 并转换成相应格式（默认是带小数的秒数）
		cur_time.innerHTML = formatTime(this.currentTime);
		
		// 计算比例，时间占比 = 宽度占比
		var prop = this.currentTime / this.duration,
			  val = prop * (process.offsetWidth - pro_btn.offsetWidth);
		pro_bar.style.width = val + 'px';
	}, false);

	// 播放方式
	btn_style.addEventListener('touchstart', function(e){
		playStyle ++;
		playStyle %= 3;
		this.style.backgroundImage = 'url("./images/rand' + playStyle + '.png")';
	}, false);

	// 一首歌播放结束后的行为
	audio.addEventListener('ended', function(){
		switch(playStyle){
			case 0: // 单曲循环
				this.play();
				break;
			case 1: // 列表循环
				nextSong();
				break;
			case 2: // 随机播放
				var len = playlist.songs.length;
				do{
					var rand = ~~(Math.random() * len);
				}while(rand === index);
				index = rand;
				playmusic(playlist.songs[index].innerHTML);
				break;
		}
	}, false);

	// 搜索框功能实现
	search.addEventListener('keyup', debounce(function(e){
		var val = search.value.trim();

		// 非空下才请求
		if(val !== ''){
			// ①，请求资源
			createSongSrc(val);
			
			// ②，更改状态
			inSearch = true;

			// ③，显示列表，在getmusic函数中处理
		}
	}, 500), false);

	// 搜索框失去焦点时，设置inSearch, 解决点击歌单列表项时，弹出搜索框下拉列表
	search.addEventListener('blur', function(e){
		inSearch = false;
		this.value = '';
	}, false);

	// 点击空白处，搜索框下拉列表隐藏
	document.addEventListener('touchstart', function(e){
		var oTouch = e.changedTouches[0],
			  x = oTouch.clientX,
			  y = oTouch.clientY;
			
		if(oTouch.target === search){
			return;
		}

		if(!(x > searchlist.left && x < searchlist.right && y > searchlist.top && y < searchlist.bottom)){
			searchlist.style.display = 'none';
			searchlist.isHidden = true;
		}
	}, false);

	// 挂载到全局下，否则是局部的，无法处理jsonP
	window.getmusic = function(data){
		var contentList = data.showapi_res_body.pagebean.contentlist,
			  length = contentList.length;

		var index = 0;
		if(songid){
			for(var i = 0; i < length; i++){
				if(contentList[i].songid == songid){
					index = i;
					break;
				}
			}
		}
		
		if(length !== 0){
			// 请求由搜索框发送
			if(inSearch){
				var html = '';
				// 处理返回的数据目录，显示在下拉列表位置
				searchlist.style.display = 'block'; // 显示
				searchlist.isHidden = false;

				// 更新下拉列表的边界值
				var bound = searchlist.getBoundingClientRect();
				searchlist.left = bound.left;
				searchlist.top = bound.top;
				searchlist.right = bound.right;
				searchlist.bottom = bound.bottom;

				// 将返回数据拼接到列表中显示
				for(var i = 0; i < length; i++){
					var item = contentList[i];
					html += '<li><span>' + item.songname + '</span><span>' + item.singername + '</span></li>';
				}
				ul_content.innerHTML = html;

				// 添加事件委托，点击列表项时播放对应歌曲
				ul_content.ontouchstart = function(e){
					// 点击歌曲，播放
					var oTarget = e.changedTouches[0].target;
					if(oTarget.parentNode.nodeName === 'LI'){
						// 直接选择对应的m4a路径，而不走playmusic(songname)这条路
						var ali = this.children;

						// 判断当前点击的是哪一个li项
						/*for(i in ali){
							if(ali[i] === oTarget.parentNode){
								index = i; 
							}
						}*/
						index = oTarget.parentNode.indexOf();
						audio.src = contentList[index].m4a;
						playmusic();

						// 状态变更
						inSearch = false;

						// UI变更
						title.innerHTML = contentList[index].songname;
						singer.innerHTML = contentList[index].singername;
						search.value = '';

						// 添加到历史记录中
						his_list.innerHTML = '<p><span class="songname" id="' + contentList[index].songid + '">' + contentList[index].songname + '</span><span class="remove">删除</span><span class="append">添加</span></p>' + his_list.innerHTML;

						// 请求歌词资源
						createLrcSrc(contentList[index].songmid);

						// 然后隐藏下拉列表 & 清空ul_content
						searchlist.style.display = 'none';
						searchlist.isHidden = true;
						/*while(ul_content.children.length !== 0){
							ul_content.removeChild(ul_content.children[0]);
						}*/
						ul_content.removeAll();
					}
				};
			}else{ // 以播放为目的请求发送
				// m4a: 流媒体资源
				audio.src = contentList[index].m4a;

				// UI变更
				title.innerHTML = contentList[index].songname;
				singer.innerHTML = contentList[index].singername;

				// 请求歌词资源
				createLrcSrc(contentList[index].songmid);
			}
		}
	}

	// 歌词同步
	// 同样挂载到全局下，处理返回的数据
	window.getLrc = function(data){
		var lyric = data.showapi_res_body.lyric.fromUnicode();

		// 切割歌词
		var arrLrc = formatLyric(lyric);

		// 一首歌曲播放结束，需要回滚，重新从头开始
		lrc_content.style.top = '0px';

		// 歌词显示
		var html = '';
		for(var i = 0, len = arrLrc.time.length; i < len; i++){
			// 时间1s以内的，以及歌词为空字符串的不处理
			if(arrLrc.time[i] && arrLrc.text[i]){
				html += '<p id="' + arrLrc.time[i] + '">' + arrLrc.text[i] + '</p>';
			}
		}
		lrc_content.innerHTML = html;

		// 歌词同步
		aP = lrc_content.querySelectorAll('p');
		aP.lastIndex = -1; // 上一次同步的歌词行
		aP.offset = 0; // 上移行数
	}

	audio.addEventListener('timeupdate', function(e){
		// 获取当前时间坐标
		var cur_time = ~~this.currentTime;

		// 利用时间坐标，获取对应歌词行
		var oline = document.getElementById(cur_time);
		// 歌词行存在且没有二刷的前提下（二刷的原因是每首歌曲的音质有好有坏，越好的音质，每次timeupdate触发越频繁，相当于帧数越多），进行同步
		if(oline && oline.indexOf() !== aP.lastIndex){
			// 前一条清除同步效果
			aP[aP.lastIndex] && (aP[aP.lastIndex].style.cssText = '');

			// 当前同步
			oline.style.cssText = 'color:#F26E6F;font-size:16px';

			if(oline.indexOf() >= 5){ // 到达歌词区域中部时, 上滚,歌词区域, 总共能容纳10行
				aP.offset++;
				lrc_content.style.top = - 20 * aP.offset + 'px'; // 行间距20
			}

			aP.lastIndex ++;
		}
	}, false);

	// 切割歌词函数
	// @param: lrc是字符串
	function formatLyric(lrc){
		// 一重处理，去掉没有时间轴的部分
		// 时间轴的特点是能匹配到小数点
		var temp1 = lrc.split('[').filter(item => /\./.test(item));

		var temp2 = [],
			  temp3 = [],
			  time = [],
			  text = [];
		for(var i = 0, len = temp1.length; i < len; i++){
			// 二重处理，去掉多余的']'符号
			temp2[i] = temp1[i].split(']');

			// 三重处理，分离时间部分和歌词部分
			temp3[i] = temp2[i][0].split('.')[0].split(':');
			time[i] = ~~temp3[i][0] * 60 + ~~temp3[i][1];
			text[i] = temp2[i][1].trim(); // 去除回车符
		}

		return {
			time: time,
			text: text
		};
	}

	/* 历史 */
	btn_his.addEventListener('touchend', function(e){
		var x = e.changedTouches[0].clientX,
			  y = e.changedTouches[0].clientY;

		if(his_list.children.length === 0) return;

		if(x > this.left && x < this.right && y > this.top && y < this.bottom){
			if(his_list.isHidden){
				his_list.style.display = 'block';

				var bound = his_list.getBoundingClientRect();
				his_list.left = bound.left;
				his_list.top = bound.top;
				his_list.right = bound.right;
				his_list.bottom = bound.bottom;
			}else{
				his_list.style.display = 'none';
			}
			his_list.isHidden = !his_list.isHidden;
		}
	}, false);

	// 点击空白处，隐藏历史
	document.addEventListener('touchstart', function(e){
		var oTouch = e.changedTouches[0],
			  x = oTouch.clientX,
			  y = oTouch.clientY;
			
		if(oTouch.target === btn_his){
			return;
		}

		if(!(x > his_list.left && x < his_list.right && y > his_list.top && y < his_list.bottom)){
			his_list.style.display = 'none';
			his_list.isHidden = true;
		}
	}, false);

	his_list.addEventListener('touchstart', function(e){
		// 点击歌曲，播放
		var oTarget = e.changedTouches[0].target,
			  songname = oTarget.parentNode.children[0].innerHTML;

		songid = oTarget.parentNode.children[0].id;

		if(oTarget.className === 'songname'){
			playmusic(songname);
		}else if(oTarget.className === 'remove'){
			his_list.removeChild(oTarget.parentNode);
			his_list.children.length || (his_list.style.display = 'none') && (his_list.isHidden = true);
		}else if(oTarget.className === 'append'){
			playlist.innerHTML += '<p><span class="songname" id="' + songid + '">' + songname + '</span><span class="remove">删除</span></p>';
			playlist.songs = playlist.querySelectorAll('span.songname');
		}
	}, false);
	

	/* 一些工具方法 */
	// ①，jsonP获取音乐
	// function createSongSrc(keyword){
	// 	songSrc.length !== 0 && (document.body.removeChild(songSrc[0])) && (songSrc.pop());
	// 	var oScript = document.createElement('script');
	// 	oScript.src = 'http://route.showapi.com/213-1?&showapi_appid=49669&showapi_sign=895109e200ec4ca9a8df27bbf3ea27dd&showapi_timestamp=' + formatDateTime() + '&keyword=' + keyword + '&jsonpcallback=getmusic';
	// 	document.body.appendChild(oScript);
	// 	songSrc.push(oScript);
	// }

	// ②，时间戳转换方法
	function formatDateTime(){
		var date = new Date(),
			yy = date.getFullYear(),
			month = (date.getMonth() + 1).zeroP(),
			dd = date.getDate().zeroP(),
			hh = date.getHours().zeroP(),
			mm = date.getMinutes().zeroP(),
			ss = date.getSeconds().zeroP();
			
		return yy + month + dd + hh + mm + ss;
	}

	// ③，时间补零函数，挂载到数字包装对象的原型上
	Number.prototype.zeroP = function(){
		return this < 10 ? '0' + this : '' + this;
	}

	// ④，jsonP获取歌词（利用歌曲id查询歌词）
	// function createLrcSrc(id){
	// 	lrcSrc.length !== 0 && (document.body.removeChild(lrcSrc[0])) && (lrcSrc.pop());
	// 	oScript = document.createElement('script');
	// 	oScript.src = 'http://route.showapi.com/213-2?&showapi_appid=49669&showapi_sign=895109e200ec4ca9a8df27bbf3ea27dd&showapi_timestamp=' + formatDateTime() + '&musicid=' + id + '&jsonpcallback=getLrc';
	// 	document.body.appendChild(oScript);
	// 	lrcSrc.push(oScript);
	// }

	// ⑤，show '00:00' 格式时间
	function formatTime(time){
		time = parseInt(time);
		var hh = Math.floor(time % 3600).zeroP(),
			mm = Math.floor(time % 3600 / 60).zeroP(),
			ss = Math.floor(time % 60).zeroP();

		return mm + ':' + ss;
	}

	//	⑥，获取目标在父级下的索引
	Object.prototype.indexOf = function(){
		var children = this.parentNode.children,
			length = children.length;
		for(var i = 0; i < length; i++){
			if(this === children[i]){
				return i;
			}
		}
	}

	// ⑦，清空所有子元素
	Object.prototype.removeAll = function(){
		while(this.children.length){
			this.removeChild(this.children[0]);
		}
	}

	// ⑧，Unicode编码的字符串解码成正常字符串
	String.prototype.fromUnicode = function(){
		return this.replace(/&#((x[0-9A-Fa-f]+)|([0-9]+));/g, function(pattern){
			var code = pattern.split('#')[1].split(';')[0]; // 获取&#和;号直接的Unicode编码
			return String.fromCharCode('0' + code);
		});
	}

	// ⑨，函数去抖
	function debounce(fn, delay){
		var timer; 

		delay || (delay = 250);

		return function(){
			var context = this;
			var args = arguments;

			clearTimeout(timer);

			timer = setTimeout(function(){
				fn.apply(context, args);
			}, delay);
		};
	}


	// 原生js实现 CORS 请求
	function createCORSRequest(options) {
		options = options || {};
		options.type = (options.type || 'GET').toUpperCase();
		var params = formatParams(options.data);

		var xhr = new XMLHttpRequest();
		if ('withCredentials' in xhr) {
			// chrome/safari/ff
			xhr.open(options.type, options.url, true);
		} else if (typeof XDomainRequest !== 'undefined') {
			// ie
			xhr = new XDomainRequest();
			xhr.open(options.type, options.url);
		} else {
			// 浏览器不支持CORS
			xhr = null;
		}
		if (!xhr) {
			alert('浏览器不支持CORS');
			return;
		}

		// CORS请求的处理事件：onload & onerror
		xhr.onload = function () {
			var result = JSON.parse(xhr.responseText);
			options.success && options.success(result);
		}

		if (options.type === 'GET') {
			xhr.send();
		} else if (options.type === 'POST') {
			xhr.setRequestHeader('Content-Type', 'application/json');
			xhr.send(params);
		}
	}

	// CORS 获取音乐
	function createSongSrc(keyword) {
		// 发送CORS请求
		createCORSRequest({
			url: 'http://route.showapi.com/213-1',
			type: 'POST',
			data: {
				"showapi_timestamp": formatDateTime(),
				"showapi_appid": "49669",
				"showapi_sign": "895109e200ec4ca9a8df27bbf3ea27dd",
				"keyword": keyword,
				"page": "1"
			},
			success: function (data) {
				window.getmusic(data);
			}
		});
	}

	// CORS 获取歌词
	function createLrcSrc(id){
		createCORSRequest({
			url: 'http://route.showapi.com/213-2',
			type: 'POST',
			data: {
				"showapi_timestamp": formatDateTime(),
				"showapi_appid": "49669",
				"showapi_sign": "895109e200ec4ca9a8df27bbf3ea27dd",
				"musicid": id
			},
			success: function (data) {
				window.getLrc(data);
			}
		});
	}

	// 处理请求传参
	function formatParams(data) {
		var arr = [];
		for (var name in data) {
			if (data.hasOwnProperty(name)) {
				var addValue = encodeURIComponent(name) + '=' + encodeURIComponent(data[name]);
				arr.push(addValue);
			}
		}
		return arr.join('&');
	}

})(window);