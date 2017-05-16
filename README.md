# Nue.js

研究Vue原理时顺手写的一个小玩具，实现了Vue数据绑定的核心功能。
目前版本支持参数computed、methods，节点属性n-on、n-bind、n-if、n-show。

## 示例

	<div id="app">{{ text }}</div>
	
	<script src="nue.js"></script>
	<script>
		new Nue({
			el: '#app',
			data: {
				text: 'hello world'
			}			
		});
	</script>

点击 [DEMO](https://nossika.github.io/Nue.js/index.html) 可查看演示






