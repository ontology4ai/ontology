import {
    Form,
    AutoComplete as autoComplete,
    Input as input,
    Radio as radio,
    Checkbox as checkbox,
    Select as select,
    Cascader as cascader,
    Switch as ModoSwitch,
    TimePicker as timePicker,
    Transfer as transfer,
    TreeSelect as treeSelect,
    Upload as upload,
    Slider as slider,
    InputNumber as inputNumber,
    InputTag as inputTag,
    DatePicker as datePicker,
    Button as button,
    Checkbox,
    Typography
} from '@arco-design/web-react';

import Editor from '@/components/Editor';

import TableForm from '@/components/TableForm';

import CascaderPanel from '@/components/CascaderPanel';
// import tabsForm from '@/components/ModoTabsForm';
import FormList from '@/components/FormList';
import Cron from 'modo-design/lib/Cron';
import SelectInput from "@/components/SelectInput";

const {
    RangePicker,
    WeekPicker,
    MonthPicker,
    YearPicker,
    QuarterPicker
} = datePicker;
const textArea = input.TextArea;

const ItemMap = {
    autoComplete,
    input,
    radio,
    radioGroup: radio.Group,
    checkbox,
    checkboxGroup: checkbox.Group,
    select,
    cascader,
    switch: ModoSwitch,
    timePicker,
    treeSelect,
    upload,
    slider,
    inputNumber,
    inputTag,
    datePicker,
    rangePicker: RangePicker,
    date: datePicker,
    week: WeekPicker,
    month: MonthPicker,
    year: YearPicker,
    quarter: QuarterPicker,
    cron: Cron,
    button,
    textArea,
    Editor,
    TableForm,
    editor: Editor,
    tableForm: TableForm,
    cascaderPanel: CascaderPanel,
    // tabsForm: tabsForm,
    formList: FormList,
    selectInput:SelectInput
};

export default ItemMap;
