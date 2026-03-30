import { lazy } from 'react';
import * as Icon from 'modo-design/icon';
import { DatePicker, AutoComplete, Alert, InputTag, InputNumber } from '@arco-design/web-react';
import view from './components/View';
import container from './components/Container';
import flexLayout from './components/FlexLayout';
import tabs from './components/Tabs';
import vTabs from './components/VTabs';
import vTab from './components/VTab';
import iframe from './components/Iframe';
import form from './components/Form';
import formItem from './components/FormItem';
import download from './components/Download';
import button from './components/Button';
import buttonGroup from './components/ButtonGroup';
import dropdown from './components/Dropdown';
import input from '@arco-design/web-react/es/Input';
import select from './components/Select';
import radioGroup from './components/RadioGroup';
import checkboxGroup from './components/CheckboxGroup';
import timePicker from '@arco-design/web-react/es/TimePicker';
import upload from './components/Upload';
import tableForm from './components/TableForm';
import transfer from './components/Transfer';
import editor from '@/components/Editor';
import formGroup from '@/components/FormGroup';
import formList from './components/FormList';
import cascaderPanel from './components/CascaderPanel';
import tabsForm from './components/TabsForm';
import datePicker from './components/DatePicker';
import cron from 'modo-design/lib/Cron';

import { Switch, Slider, Rate, Divider } from '@arco-design/web-react';
import table from './components/Table';
import text  from '@arco-design/web-react/es/Typography/text';
import richText from './components/RichText';
import image from './components/Image';
import tag from './components/Tag';
import Face from './components/Face';
import progress from './components/Progress';
import tree from './components/Tree';
import steps from './components/Steps';
import alert from './components/Alert';
import carousel from './components/Carousel';

import treeSelect from './components/TreeSelect';
import cascader from './components/Cascader';
import column from './components/Chart/Column';
import line from './components/Chart/Line';
import pie  from './components/Chart/Pie';
import treeChart from './components/TreeChart';
import wordCloud from '@/components/WordCloud';

const widgetMap = {
	view,
	container,
	flexLayout,
	tabs,
	vTabs,
	vTab,
	iframe,
	form,
	formItem,
	button,
	download,
	buttonGroup, 
	dropdown, 
	input,
	inputNumber: InputNumber, 
	inputTag: InputTag,
	textarea: input.TextArea,
	select, 
	radioGroup, 
	checkboxGroup, 
	datePicker,
	rangePicker: DatePicker.RangePicker,
	timePicker, 
	upload, 
	switch: Switch,
	slider: Slider,
	tableForm,
	editor,
	rate: Rate,
	transfer,
	formList,
	cascaderPanel,
	tabsForm,
	autoComplete: AutoComplete,
	formGroup,
	cron,
	

	table, 
	icon: Icon,
	text,
	richText, 
	image, 
	tag,
	face: Face,
	progress,
	steps,
	divider: Divider,
	alert,
	carousel,
	// alert: Alert,

	tree, 
	treeSelect, 
	cascader, 

	column, 
    line, 
    pie,
    treeChart,
    wordCloud
};

export {
	widgetMap
};
