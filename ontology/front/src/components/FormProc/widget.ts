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

import Editor from './components/Editor';

import TableForm from '@/components/TableForm';

import CascaderPanel from '@/components/CascaderPanel';
import tabsForm from '@/components/ModoTabsForm';
import FormList from '@/components/FormList';
import SelectInput from '@/components/SelectInput';
import SelectRefresh from '@/components/SelectRefresh';
import RemoteTransfer from '@/components/RemoteTransfer';


const { RangePicker } = datePicker;
const textArea = input.TextArea;

const ItemMap = {
    autoComplete,
    input,
    radio,
    radioGroup: radio.Group,
    checkbox,
    checkboxGroup: checkbox.Group,
    select,
    selectRefresh:SelectRefresh,
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
    button,
    textArea,
    Editor,
    TableForm,
    editor: Editor,
    tableForm: TableForm,
    cascaderPanel: CascaderPanel,
    tabsForm: tabsForm,
    formList: FormList,
    SelectInput,
    selectInput:SelectInput,
    remoteTransfer:RemoteTransfer
    
};

export default ItemMap;