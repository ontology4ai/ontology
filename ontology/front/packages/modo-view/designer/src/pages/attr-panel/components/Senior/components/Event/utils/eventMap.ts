export default {
	view: [
		{
			"value": "onMount",
			"label": "页面挂载后回调",
			"defaultCallback": `function callback() {

			}`
		},
		{
			"value": "onUnMount",
			"label": "页面卸载后回调",
			"defaultCallback": `function callback() {

			}`
		}
	],
	container: [
		{
			"value": "onClick",
			"label": "当单击时回调",
			"defaultCallback": `function callback() {

			}`
		},
		{
			"value": "onMouseEnter",
			"label": "光标从元素外部移到元素内部时触发",
			"defaultCallback": `function callback() {

			}`
		},
		{
			"value": "onMouseLeave",
			"label": "光标从元素内部移到元素外部时触发",
			"defaultCallback": `function callback() {

			}`
		},
        {
        	"value": "onDoubleClick",
        	"label": "当双击时回调",
        	"defaultCallback": `function callback() {

			}`
        },
        {
        	"value": "onMovingStart",
        	"label": "开始拖拽之前的回调",
        	"defaultCallback": `function callback() {

			}`
        },
        {
        	"value": "onMoving",
        	"label": "拖拽中的回调",
        	"defaultCallback": `function callback() {

			}`
        },
        {
        	"value": "onMovingEnd",
        	"label": "拖拽结束之后的回调",
        	"defaultCallback": `function callback() {

			}`
        }
	],
	button: [
		{
			"value": "onClick",
			"label": "当单击时回调",
			"defaultCallback": `function callback() {

			}`
		}
	],
	table: [
		{
			"value": "onChange",
			"label": "分页、排序、筛选时的回调",
			"defaultCallback": `function callback(pagination, sorter) {

			}`
		}, {
			"value": "onRow-onClick",
			"label": "设置表格行的单击事件回调",
		}, {
			"value": "onRow-onDoubleClick",
			"label": "设置表格行的双击事件回调",
		}, /*{
			"value": "onCell-onClick",
			"label": "设置表身单元格的单击事件回调",
		}, {
			"value": "onCell-onDoubleClick",
			"label": "设置表身单元格的双击事件回调",
		}, */ {
			"value": "onHeaderRow-onClick",
			"label": "设置表头行单元格的单击事件回调"
		}, {
			"value": "onHeaderRow-onDoubleClick",
			"label": "设置表头行单元格的双击击事件回调"
		}, /* {
			"value": "onHeaderCell-onClick",
			"label": "设置头部单元格的单击事件回调"
		}, {
			"value": "onHeaderCell-onDoubleClick",
			"label": "设置头部单元格的双击事件回调"
		} */, {
			"value": "rowSelection-onChange",
			"label": "单选或多选的选中项发生改变时的回调"
		}, {
			"value": "rowSelection-onSelect",
			"label": "用户手动选择/取消选择的回调"
		}, {
			"value": "rowSelection-onSelectAll",
			"label": "用户手动选择/取消选择所有行的回调"
		}, {
			"value": "onExpand",
			"label": "点击展开的回调"
		}, {
			"value": "onExpandedRowsChange",
			"label": "点击展开时触发，参数为展开行数组"
		}
	],
	tree: [
		{ "value": "onExpand", "label": "点击展开/关闭的回调" },
		{ "value": "onSelect", "label": "点击树节点的回调" }
	],
	autoComplete: [
		{ "value": "onBlur", "label": "失去焦点的回调" },
		{ "value": "onChange", "label": "value 改变时的回调" },
		{ "value": "onFocus", "label": "聚焦时的回调" },
		{ "value": "onPressEnter", "label": "按下回车键的回调" },
		{ "value": "onSearch", "label": "搜索补全时的回调" },
		{ "value": "onSelect", "label": "点击补全项时的回调" }
	],
	cascader: [
		{ "value": "onChange", "label": "点击选择框的回调" },
		{ "value": "onClear", "label": "点击清除时触发，参数是当前下拉框的展开状态" },
		{ "value": "onClick", "label": "鼠标点击下拉框时的回调" },
		{ "value": "onInputValueChange", "label": "inputValue改变时的回调" },
		{ "value": "onSearch", "label": "搜索时的回调" },
		{ "value": "onVisibleChange", "label": "下拉框收起展开时触发" }
	],
	checkboxGroup: [
		{ "value": "onChange", "label": "当值发生改变时回调" }
	],
	textEditor: [
		{ "value": "onChange", "label": "当值发生改变时回调" }
	],
	datePicker: [
		{ "value": "onChange", "label": "日历组件值发生改变时的回调" },
		{ "value": "onClear", "label": "点击清除按钮后的回调" },
		{ "value": "onOk", "label": "点击确认按钮的回调" },
		{ "value": "onPickerValueChange", "label": "面板日期改变的回调" },
		{ "value": "onSelect", "label": "选中日期发生改变但组件值未改变时的回调" },
		{ "value": "onVisibleChange", "label": "打开或关闭时的回调" }
	],
	form: [
		{ "value": "search", "label": "查询时触发" },
		{ "value": "onChange", "label": "用户操作表单项时触发" },
		{ "value": "onValuesChange", "label": "任意表单项值改变时候触发" }
	],
	input: [
		{ "value": "onChange", "label": "当值发生改变时回调" },
		{ "value": "onFocus", "label": "当元素获得焦点时回调" },
		{ "value": "onBlur", "label": "当元素失去焦点时回调" },
		{ "value": "onClear", "label": "当点击清除按钮的回调" },
		{ "value": "onPressEnter", "label": "当按下回车键的回调" }
	],
	inputNumber: [
		{ "value": "onChange", "label": "当值发生改变时回调" },
		{ "value": "onFocus", "label": "当元素获得焦点时回调" },
		{ "value": "onBlur", "label": "当元素失去焦点时回调" },
		{ "value": "onKeyDown", "label": "键盘事件回调" },
	],
	inputTag: [
		{ "value": "onChange", "label": "控件值改变时触发" },
		{ "value": "onBlur", "label": "失去焦点时触发" },
		{ "value": "onClear", "label": "点击清除按钮的回调" },
		{ "value": "onClick", "label": "单击组件的回调" },
		{ "value": "onFocus", "label": "聚焦时触发" },
		{ "value": "onInputChange", "label": "输入框文本改变的回调" },
		{ "value": "onKeyDown", "label": "键盘事件回调" },
		{ "value": "onPaste", "label": "输入框文本粘贴的回调" },
		{ "value": "onPressEnter", "label": "按enter键触发" },
		{ "value": "onRemove", "label": "移除某一个标签时改变时触发" },
	],
	textarea: [
		{ "value": "onChange", "label": "当值发生改变时回调" },
		{ "value": "onClear", "label": "当点击清除按钮的回调" },
		{ "value": "onPressEnter", "label": "当按下回车键的回调" }
	],
	radioGroup: [
		{ "value": "onChange", "label": "当值发生改变时回调" }
	],
	rate: [
		{ "value": "onChange", "label": "选择时的回调" },
		{ "value": "onHoverChange", "label": "鼠标经过时数值变化的回调" }
	],
	select: [
		{ "value": "onChange", "label": "当值发生改变时回调" },
		{ "value": "onFocus", "label": "当元素获得焦点时回调" },
		{ "value": "onBlur", "label": "当元素失去焦点时回调" },
		{ "value": "onClear", "label": "当点击清除按钮的回调" },
		{ "value": "onVisibleChange", "label": "下拉框收起展开时触发" },
		{ "value": "onSearch", "label": "搜索时的回调" }
	],
	slider: [
		{ "value": "onChange", "label": "选择值变化时触发"}
	],
	switch: [
		{ "value": "onChange", "label": "点击开关的回调"}
	],
	rangePicker: [
		{ "value": "onChange", "label": "日历组件值发生改变时的回调" },
		{ "value": "onOk", "label": "点击确认按钮的回调" },
		{ "value": "onPickerValueChange", "label": "面板日期改变的回调" }
	],
	transfer: [
	    { "value": "onChange", "label": "选中项在两栏之间转移时的回调" },
	    { "value": "onSearch", "label": "搜索框输入进行搜索时回调函数" },
	],
	treeSelect: [
		{ "value": "onChange", "label": "选中值改变的回调" },
		{ "value": "onClear", "label": "点击清除时触发，参数是当前下拉框的展开状态" },
		{ "value": "onClick", "label": "鼠标点击下拉框时的回调" },
		{ "value": "onSearch", "label": "自定义搜索方法" },
		{ "value": "onVisibleChange", "label": "下拉框收起展开时触发" },
	],
	upload: [
		{ "value": "beforeUnload", "label": "上传文件之前的回调" },
		{ "value": "onChange", "label": "上传文件改变时的回调" },
		{ "value": "onDrop", "label": "拖拽上传文件时执行的回调" },
		{ "value": "onExceedLimit", "label": "超出上传数量限制时触发" },
		{ "value": "onPreview", "label": "点击预览时候的回调" },
		{ "value": "onProgress", "label": "文件上传进度的回调" },
		{ "value": "onRemove", "label": "点击删除文件时的回调" },
		{ "value": "onReupload", "label": "文件重新上传时触发的回调" }
	],
	formGroup: [
		{ "value": "onChange", "label": "值变化时触发"}
	],
	treeChart: [
		{ "value": "click", "label": "单击节点事件的回调" },
		{ "value": "dblclick", "label": "双击节点事件的回调" },
	],
	carousel: [
		{ "value": "onChange", "label": "幻灯片发生切换时的回调函数" },
	],
	text: [
		{ "value": "onClick", "label": "单击事件的回调" }
	],
	tabs: [
		// { "value": "onChange", "label": "activeTab 改变的回调" },
		{ "value": "onClickTab", "label": "点击选项卡的回调" },
		{ "value": "onBeforeDeleteTab", "label": "删除选项卡前的回调" },
		{ "value": "onDeleteTab", "label": "删除选项卡的回调" }
	]
}