export default [
	{
		type: 'layout',
		label: '布局',
		children: [
			{
        		type: 'flexLayout',
        		label: 'flex布局'
			},
			{
        		type: 'gridLayout',
        		label: '栅格布局'
			}
		]
	},
	{
		type: 'widget',
		label: '组件',
		children: [
			{
        		type: 'container',
        		label: '容器'
			},
			{
        		type: 'tabs',
        		label: '选项卡'
			},
			{
        		type: 'iframe',
        		label: 'Iframe'
			},
			{
        		type: 'table',
        		label: '表格'
			},
			{
        		type: 'form',
        		label: '表单'
			},
			{
        		type: 'resizeBox',
        		label: '伸缩框'
			}
		]
	},
	{
		type: 'formItem',
		label: '表单元素',
		children: [
			{
        		type: 'button',
        		label: '按钮'
			},
			{
        		type: 'buttonGroup',
        		label: '按钮组'
			},
			{
        		type: 'dropdown',
        		label: '下拉按钮组'
			},
			{
        		type: 'input',
        		label: '输入框'
			},
			{
				type: 'inputNumber',
				label: '数字输入框'
			},
			{
        		type: 'inputTag',
        		label: '标签输入框'
			},
			{
        		type: 'textarea',
        		label: '多行输入框'
			},
			{
        		type: 'autoComplete',
        		label: '自动补全'
			},
			{
        		type: 'select',
        		label: '选择器'
			},
			{
        		type: 'radioGroup',
        		label: '单选框'
			},
			{
        		type: 'checkboxGroup',
        		label: '多选框'
			},
			{
        		type: 'datePicker',
        		label: '日期选择器'
			},
			{
        		type: 'rangePicker',
        		label: '日期区间'
			},
			{
        		type: 'treeSelect',
        		label: '树形选择器'
			},
			{
        		type: 'cascader',
        		label: '级联选择器'
            },
            {
        		type: 'upload',
        		label: '上传'
			},
			{
        		type: 'switch',
        		label: '开关'
			},
			{
        		type: 'slider',
        		label: '滑动输入条'
			},
			{
        		type: 'editor',
        		label: '代码编辑器'
			},
			{
        		type: 'tableForm',
        		label: '表格编辑器'
			},
			{
        		type: 'rate',
        		label: '评分'
			},
			{
        		type: 'transfer',
        		label: '穿梭框'
			},
			{
        		type: 'formList',
        		label: '动态表单组合'
			},
			{
        		type: 'tabsForm',
        		label: '标签式表单组合'
			},
			{
        		type: 'cascaderPanel',
        		label: '级联面板'
			},
			{
        		type: 'formGroup',
        		label: '配置化组合'
			},
			{
        		type: 'cron',
        		label: 'CRON'
			}
		]
	},
	{
		type: 'showWidget',
		label: '展示元素',
		children: [
			{
        		type: 'text',
        		label: '文字'
			},
			{
        		type: 'tag',
        		label: '标签'
			},
			{
        		type: 'face',
        		label: '头像'
			},
			{
        		type: 'image',
        		label: '图片'
			},
			{
        		type: 'icon',
        		label: '图标'
			},
			{
        		type: 'progress',
        		label: '进度条'
			},
			{
        		type: 'tree',
        		label: '树形控件'
			},
			{
        		type: 'steps',
        		label: '步骤条'
			},
			{
				type: 'divider',
				label: '分割线'
			},
			{
				type: 'alert',
				label: '警告'
			},
			{
				type: 'carousel',
				label: '轮播组件'
			}
		]
	},
	{
		type: 'graph',
		label: '图表',
		children: [
			{
        		type: 'line',
        		label: '折线图'
			},
			{
        		type: 'column',
        		label: '柱状图'
			},
			{
        		type: 'pie',
        		label: '饼图'
			},
			{
        		type: 'treeChart',
        		label: '树状图'
			},
			{
        		type: 'pieDonut',
        		label: '环形图'
			},
			{
        		type: 'radar',
        		label: '雷达图'
			},
			{
        		type: 'wordCloud',
        		label: '词云图'
			}
		]
	}
]