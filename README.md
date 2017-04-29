# Nue.js

研究Vue数据视图绑定原理时顺手写的一个小玩具，实现了MVVM的核心功能。
目前支持参数computed、methods，节点属性on、bind、if、show。

## 示例

	<div id="app">{{ text }}</cdiv>
	<script src="DotText.min.js"></script>
	<script>
		new Nue({
			el: '#app',
			data: {
				text: 'hello'
			}			
		});
	</script>

点击 [DEMO](https://nossika.github.io/Nue.js/index.html) 可查看演示






