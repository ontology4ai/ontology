import React, { useState,useRef, useEffect, useContext, useCallback } from 'react';
import { Button, Table, Message,Input, Select, Form, Modal ,Spin,Tooltip} from '@arco-design/web-react';
import * as ArcoComponent from  '@arco-design/web-react';
import { Tag } from 'modo-design';
import IconSelect from '@/components/IconSelect';
import SelectInput from '@/components/SelectInput';
import { IconAdd, IconDelete, IconBrush, IconEdit ,IconImport,IconDataModel,IconDropdown ,IconRefresh} from 'modo-design/icon';
import Editor from '@/components/Editor';
import BindVar from 'packages/modo-view/designer/src/components/BindVar';
import Draggable from 'react-draggable';
import formItemTypes from 'packages/modo-view/core/src/components/Widget/components/Form/types';
import { IconDragDotVertical } from '@arco-design/web-react/icon';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import getVal from 'packages/modo-view/core/src/utils/getVal';
import Handsontable from 'handsontable';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import { registerLanguageDictionary, zhCN } from 'handsontable/i18n';
import { cloneDeep } from 'lodash';
import './style/index.less';
import 'handsontable/dist/handsontable.full.css';
import _ from 'lodash';
import useLocale from 'modo-plugin-common/src/utils/useLocale';
import i18n from '../../../locale';
require('static/guid');
registerAllModules();
registerLanguageDictionary(zhCN);
const Component = {
    ...ArcoComponent,
    ModoTag: Tag,
    IconSelect: IconSelect,
    SelectInput:SelectInput,
    TextArea: ArcoComponent.Input.TextArea,
    BindVar
};

const FormItem = Form.Item;
const Option = Select.Option;


const EditableContext = React.createContext({});
const ThemeContext = React.createContext({});
const statusContext = React.createContext("good");
let dataArr=[];


const arrayMoveMutate = (array, from, to) => {
    const startIndex = to < 0 ? array.length + to : to;
    //from 0：要改变的位置 to：1 到的位置
    if (startIndex >= 0 && startIndex < array.length) {
        array[from].isLine=true;
        array[to].isLine=true;
        array[from] = array.splice(to, 1, array[from])[0];
        return array;
    }
};

const arrayMove = (array, from, to) => {
    array = [...array];
    arrayMoveMutate(array, from, to);
    return array;
};

const SortableWrapper = SortableContainer((props) => {
    return <tbody {...props} />;
});



const DragHandle = SortableHandle(() => (
    <IconDragDotVertical
        style={{
            cursor: 'move',
            color: '#555',
        }}
    />
));

class EditableRow extends React.Component {
    constructor(props: any) {
        super(props);
        this.refForm = React.createRef();
    }
    shouldComponentUpdate(nextProps, nextState) {
        if (this.props.children[0].key === 'table_internal_selection_key') {
            if (nextProps.children[0].props.children.props.checked !== this.props.children[0].props.children.props.checked) {
                return true;
            }
        }

        if (JSON.stringify(this.props.record) === JSON.stringify(nextProps.record)) {
            return false;
        }
        return true;
    }
    validate = () => {
        this.refForm.validate()
    }
    render() {
        const {
            children,
            record,
            className,
            onHandleSave,
            rowKey,
            rowIndex,
            ...rest
        } = this.props;

        const {
            refForm
        } = this;

        return (
            <EditableContext.Provider
                value={{
                    getForm: () => {
                        return this.refForm.current;
                    },
            }}
                key={rowKey}>
                <Form
                    key={rowKey}
                    style={{ display: 'table-row' }}
                    children={children}
                    ref={this.refForm}
                    wrapper='tr'
                    wrapperProps={{
                        ...rest,
                        ref: refForm
                    }}
                    getRef={() => {
                        return this.refForm.current;
                    }}
                    className={`${className} editable-row`}
                    onValuesChange={(_, v) => {
                        try {
                            this.props.props.elxFieldTableRefFrom.current=refForm.current;
                            refForm.current.validate((errors, values) => {
                                // if (!errors) {
                                    let change = false;
                                    for (let key in _) {
                                       if (_[key] !== record[key]) {
                                           change = true;
                                       }
                                    }
                                    // this.props.props.elxFieldTableRefFrom.current=change;
                                    if (change) {
                                        onHandleSave && onHandleSave({ ...record, ...values }, rowIndex);
                                    }
                            })
                        } catch (e) {
                            console.log(e);
                        }
                    }}
                />
            </EditableContext.Provider>
        );
    }
}
const SortableRow = SortableElement(React.forwardRef((props, ref) => {
    return   <EditableRow
        ref={ref}
        {...props}/>
}), {withRef: true});

const SortableTable = SortableContainer((props) => {
    return <Table {...props} />
})
const EditableCells: React.FC = ({...props }) => {
    return ( <EditableCell {...props}/>  );
    };
class EditableCell extends React.Component {
    constructor(props: any) {
        super(props);
        let type = props.column.type;
        if (type) {
            type = type.substring(0, 1).toLocaleUpperCase() + type.substring(1);
            this.Widget = Component[type];
        }
        this.state = {
            column: this.props.column,
            optionsNew:[],
            // data: ThemeContext.data,
            // cloneDeep(this.props.colum)
            // JSON.parse(JSON.stringify(this.props.column))
        }
        this.getForm = null;


    }
    handleCellChange=(value)=> {
        let {column,rowData,rowDataFun }=this.props;
        let props_={
            config:column.config,
            formRef:column.formRef,
            model:column.model,
            thisEvent:column.thisEvent,
            rowData,
            rowDataFun,
            };
            const refForm= this.getForm && this.getForm();

            if (!refForm) {
                return true;
            }
        if(column.options && typeof column.options.onChange === 'function'){
                column.options.onChange(props_,value,column,rowData,this);
        }
    }
    handelOnFocus=(value)=>{
            let {column,rowData}=this.props;
            let props_={
                config:column.config,
                formRef:column.formRef,
                model:column.model,
                thisEvent:column.thisEvent,
                rowData};
            if(column.options && typeof column.options.onFocus === 'function'){
                let column_= column.options.onFocus(props_,value,column,rowData,this);
                if(column_){
                    this.setState({
                        optionsNew:column_.options.options
                    })
                }
            }

    }
    // "validator": "(value,cb, ref) => {if (!value) {return cb('必须填写字段名');}else {return cb();}}"
    parseRules = (rules,) => {
        if (Array.isArray(rules)) {
            return rules.map(rule => {
                const currentRule = {
                    ...rule
                };
                if (rule.type === 'required') {
                    currentRule.required= true;
                    currentRule.message= rule.message;
                }
                if (rule.validator) {
                    const validator = currentRule.validator;
                    currentRule.validator = (...args) => {
                        return validator(...args);
                    }
                }
                return currentRule;
            });
        }
    }

    shouldComponentUpdate(nextProps, nextState, c) {

        const refForm= this.getForm && this.getForm();

        if (!refForm) {
            return true;
        }
        const name = this.props.column.dataIndex;
        const value = refForm.getFieldValue(name);
        // optionsNew

        if (value !== nextProps.rowData[name]) {
            refForm.setFieldValue(name, nextProps.rowData[name]);
            return true;
        }
        if (JSON.stringify(nextProps.optionsNew) !== JSON.stringify(this.state.optionsNew)) {
            return true;
        }
        if (JSON.stringify(nextProps.column.options) !== JSON.stringify(this.state.column.options)) {
            this.setState({
                column: JSON.parse(JSON.stringify(this.props.column))
            });
            return true;
        }
        // if (editing && column.editable ){
            // cellValueChangeHandler(nextProps.rowData[name]);
        // }
        return false;
    }
    componentDidUpdate() {
    }
    componentDidMount(){
        // document.addEventListener('click', this.handleClick, true);
    }
    componentWillUnmount(){
        // document.removeEventListener('click', this.handleClick, true);
    }


    render() {
        const {
            children,
            className,
            rowData,
            onHandleSave,
            rowKey,
        } = this.props;
        const {
            Widget
        } = this;
        const {
            column,
            data,
            optionsNew,
        } = this.state;

        const columnKey = column.dataIndex;
        if (formItemTypes.indexOf(column.type) > -1 || column?.type?.toLowerCase() == 'selectInput'.toLowerCase()) {
            return (
                <EditableContext.Consumer>
                    {
                        form => {
                            this.getForm = form.getForm;
                            let rules = [];
                            if (column.options) {
                                if(column.options.rules){
                                    if (Array.isArray(column.options.rules)) {
                                        rules = this.parseRules(column.options.rules)
                                    }
                                }
                            }
                            return (
                                <div
                                    key={columnKey}>
                                    <FormItem
                                        style={{ marginBottom: 0 }}
                                        labelCol={{
                                            span: 0,
                                        }}
                                        wrapperCol={{
                                            span: 24,
                                        }}
                                        initialValue={rowData[columnKey]}
                                        field={columnKey}
                                        rules={rules}
                                        disabled={rowData.columnAddOrEditType === 'add' ? false: column.disabled ? column.disabled : false}
                                        triggerPropName={column.triggerPropName || 'value'}>

                                        {column.isLinkage ? <Select
                                                    // value={rowData[columnKey]}
                                                    mode={column.options?.mode}
                                                    onFocus={(newValue)=>{this.handelOnFocus(newValue)}}
                                                    onChange={(value)=>{
                                                    this.handleCellChange(value);}}
                                                >
                                                    {optionsNew?.map((option:any) => (
                                                    <Option key={`${option?.name}`} value={option?.value}>
                                                        <Tooltip content={option?.label} className='custom-toolbox-icon' position='bottom'>{option?.label}</Tooltip>
                                                    </Option>
                                                    ))}
                                                </Select>
                                           :  <Widget
                                            size='mini'
                                            {...column.options}
                                            onChange={(newValue) => this.handleCellChange(newValue)}
                                            /> }
                                    </FormItem>
                                </div>
                            )
                        }
                    }
                    </EditableContext.Consumer>
                );
        }else {
            return (
                <div
                    key={columnKey} className='cell-string'>
                    { Widget? <Widget
                        size='mini'
                        // onFocus={(newValue)=>{this.handelOnFocus(newValue)}}
                        // onChange={(newValue) => this.handleCellChange(newValue)}
                        {...column.options}/> : (
                            <div className='cell-string-text'  >{children}</div>
                         )
                         }
                </div>
            )
        }
    }
}

const EditableTable = React.forwardRef((props, tableRef) => {
    const t = useLocale();
    const loginT = useLocale(i18n);
    const [data, setData] = useState(props.value);
    const [current, setCurrent] = useState(1);
    const [pageSize, setPageSize] = useState(props.pagination ? (props.pageSize || 20) : 0);
    const [text, setText] = useState(JSON.stringify(props.value));
    const [visible, setVisible] = useState(false);
    const [disabled, setDisabled] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState(['4']);
    const [cellRowData, setCellRowData] = useState({});
    const [cellRowVisible, setCellRowVisible] = useState(false);
    const [joinFieldOption, setJoinFieldOption] = useState([]);
    const [handsontableVisible, setHandsontableVisible] = useState(false);
    const [cellOption, setCellOption] = useState({
        options:[]
    });
    const [modelDataVisible, setModelDataVisible] = useState(false);
    const [metaTableLoading, setMetaTableLoading] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);

    const [metaTableNameOptions, setMetaTableNameOptions] = useState([]);
    const [metaTableName, setMetaTableName] = useState({});
    const [changeRowData, setChangeRowData] = useState([]);
    //批量选择的参数
    const [batchVisible, setBatchVisible] = useState(false);
    const [batchLoading, setBatchLoading] = useState(false);
    const [batchColumns, setBatchColumns] = useState([]);
    const [batchData, setBatchData] = useState([]);
    const [selectedBatchRowKeys, setSelectedBatchRowKeys] = useState([]);
    const [selectedBatchRows, setSelectedBatchRows] = useState([]);



   const { getTableByTeamAndDsNameSchema} =props.config.getApi;

    // const { isEditingRow, getCurrentRowIndex } = useEditableContext();

    // const tableRef = useRef(null);
    const dataRef = useRef(data);
    const formCellModalRef = useRef();
    const sortRef = useRef(0);
    const modelDataForm = useRef();
    // const t = useLocale(); //使用全局语言
    // const tableT = useLocale(locale); //使用组件个性化语言



    const { model,config,formRef,thisEvent} = props;
    const { value } = props;

    const optionInterface:any = {};
    let defaultValueObj={};
    model.fields.forEach(field => {
        defaultValueObj[field.name]=field?.defaultValue || ''
        optionInterface[field.name] = field.valueType;
    });
    let Model;

    if (props.model.class) {
        Model = props.model.class;
    } else {
        Model = class {
            constructor() {
                model.fields.forEach(field => {
                    this[field.name] = field.defaultValue;
                })
            }
        }
    }

    const sortable = getVal(props.sortable, true);
    const hasIndex = getVal(props.index, false);
    const hasIndexString = getVal(props.hasIndexString, false);
    const oper = getVal(props.oper, true);
    const addOper = getVal(props.addOper, true);
    const importOper = getVal(props.importOper, true);
    const batchSelection = getVal(props.batchSelection, false);

    const importMetaModelOper = getVal(props.importMetaModelOper, false);
    const isInterfaceInitialData = getVal(props.isInterfaceInitialData, false);
    
    const deleteOper = getVal(props.deleteOper, true);
    const editAllOper = getVal(props.editAllOper, true);
    let columns = [];

    if (hasIndex) {
        columns.push({
            title: loginT("编号"),
            width: props.indexWidth || 50,
            dataIndex: "index",
            editable: false,
            type: 'string',
            className: "table-index",
            render: (col, record, index) => {
                return (
                    <span>
                        {/* {index + 1} */ record.index}
                    </span>
                )
            }
        })
    }
    if (hasIndexString) {
        columns.push({
            title: loginT("编号"),
            width: props.indexWidth || 50,
            key:'string',
            type: 'string',
            align:'center',
            editable: false,
            className: "table-index",
        })
    }
    const filteredFields = model.fields.filter((field) => field.isShow !== false );
    // const filteredFieldsNew=filteredFields.map((field) =>({...field, disabled:true}));
    columns = columns.concat([...filteredFields]);
    columns.filter(itm=>{
        let obj={
            ...itm,
            id:itm.id?itm.id:guid(),
        };
        return obj;
    })
    if (oper && (props.rowExtra || deleteOper)) {
        columns.push({
            name: 'oper',
            label: loginT('操作'),
            width: props.operWidth || 60,
            render: (col, record, index) => (
                <Button.Group>
                    {props.rowExtra && props.rowExtra(col, record, index, current, pageSize)}
                    { deleteOper && <Button
                        size="mini"
                        type='text'
                        status='danger'
                        icon={<IconDelete />}
                        onClick={() => {
                            handleRemoveRow(index)
                        }}>
                    </Button>}
                </Button.Group>
            )
        })
    }
    if (sortable) {
        columns.push({
            title: loginT("排序"),
            width: props.sortWidth || 50,
            dataIndex: "sort",
            editable: false,
            className: "drag-visible",
            render: () => <DragHandle />
        })
    }
    function cleanRowData(row) {
        const cleanedRow = { ...row };
        delete cleanedRow.__ORIGIN_DATA; // 移除 __ORIGIN_DATA 属性
        return cleanedRow;
    }
    function handleSave(row, index,event) {
            const newData = cloneDeep([...dataRef.current]);
            newData.splice((current - 1) * pageSize + index, 1, {
                ...newData[index],
                // ...row,
                ...cleanRowData(row)
            });
            setData([...newData]);
    }

    function handleRemoveRow(key) {
        setData(dataRef.current.filter((row, index) => {
            return ((current - 1) * pageSize + key) !== index;
        }));
    }

    function handleDeleteRows() {
        setData(dataRef.current.filter((row, index) => {
            return selectedRowKeys.indexOf(index) < 0;
        }));
        setSelectedRowKeys([]);
    }

    function handleClearRow() {
        setData([]);
    }
       // 表格粘贴 start --------------------------
   const [colHeadersList, setColHeadersList] = useState([]);//显示列表头
   const [hotTableColumns, setHotTableColumns] = useState([['']]);
   const hotTableRef = useRef();
   function jsonToHotTableText(value) {
       let arr = [];
       value.forEach((item, index) => {
           let arrItem = [];
           model.fields.forEach((field, idx) => {
               let hidden = field.options ? field.options.hidden : false;
               if (field.options && field.options.hiddenBindVar) {
                   hidden = props.getOptions({
                       hiddenBindVar: field.options.hiddenBindVar
                   }).hidden;
               }
               if (hidden !== true) {
                   arrItem.push(item[field.name])
               }
           });
           arr.push(arrItem)
       });
       setHotTableColumns(arr);

   }
   //点击表格粘贴按钮 弹窗
   function handlePasteData() {
       // 清空数据
       setHotTableColumns([['']]);
       // 渲染表头
       let headArr = []
       model.fields.forEach((field, idx) => {
           let hidden = field.options ? field.options.hidden : false;
           if (field.options && field.options.hiddenBindVar) {
               hidden = props.getOptions({
                   hiddenBindVar: field.options.hiddenBindVar
               }).hidden;
           }
           if (hidden !== true){
               headArr.push(field.label);
           }
       });
       setColHeadersList(headArr);
       let hotTableColumns_=[]
       headArr.forEach(item=>{
            hotTableColumns_.push('');
       });
       setHotTableColumns([hotTableColumns_]);
       if (data && data.length>0){
           let formatData = cloneDeep(data);
           if (props.pasteBefore) { // 存在粘贴弹窗挂载前的格式化函数
               formatData = props.pasteBefore(formatData)
           }
           jsonToHotTableText(formatData);
       }
       setHandsontableVisible(true);
   }
   function hotTableTextToJson(value) {
       let arr = [];
       // 获取非隐藏的字段列表
       let fieldsNotHidden = [];
       model.fields.forEach((field, idx) => {
           let hidden = field.options ? field.options.hidden : false;
           if (field.options && field.options.hiddenBindVar) {
               hidden = props.getOptions({
                   hiddenBindVar: field.options.hiddenBindVar
               }).hidden;
           }
           if (hidden !== true) {
               fieldsNotHidden.push(field);
           }
       });
       value.forEach((item,index) => {
           let obj = {};
           fieldsNotHidden.forEach((field,idx) => {
               obj[field.name] = item[idx]
           });
           arr.push(obj)
       });
       let formatArr = arr;
       if (arr && arr.length > 0 && props.pasteAfter) { // 存在粘贴数据保存前的格式化函数
           formatArr = props.pasteAfter(arr)
       }
       setData(formatArr);
       sortRef.current++;
   }
   // 点击表格粘贴弹窗 保存按钮
   function handleSavePasteText() {
       const text = hotTableRef.current.__hotInstance.getData();
       hotTableTextToJson(text);
       setHandsontableVisible(false);
   }

   // textarea
   const [hotTableText, setHotTableText] = useState('');
   const [hotTableTextArr, setHotTableTextArr] = useState([]);
   function hotTableTextChange(value) {
       setHotTableText(value)
       var rows = [];
       value.split('\n').forEach(row => {
           rows.push(row.split('\t'))
       })
       setHotTableTextArr(rows)
   }
   // 表格粘贴 end --------------------------
    function changeMetaTableName(val){
        let arr= metaTableNameOptions.filter(item=>{
                if(item.modelName == val){
                    return item;
                }
            });
            if(arr.length>0){
                setMetaTableName(arr[0]);
            }
    }
    function getMetaTableNameOptions(inputValue,dsName_){
            const teamName = sessionStorage.getItem('teamName');
            const param={
                limit:20,
                offset:0,
                teamName,
                dsName:dsName_,
                keyWord:inputValue||'',
                dataSrc:'draft',
            };
            setMetaTableLoading(true);
            getTableByTeamAndDsNameSchema(param).then(res => {
                setMetaTableLoading(false);
                const { data } = res;
                if (data.data?.content) {
                const options = [];
                data.data.content.forEach(item => {
                    options.push({
                    value: item.modelName,
                    label: item.modelLabel,
                    ...item,
                    });
                });
                setMetaTableNameOptions(options);
                }
            }).catch(err => {
                setMetaTableLoading(false);
                console.log(err);
            });

    }

   function handleDataModelData(){
    let dsName_= formRef?formRef.getFieldValue('dsName'):'';
    if(dsName_){
        getMetaTableNameOptions('',dsName_);
        setModelDataVisible(true);
    }else{
        Message.warning(loginT('请选择数据源'))
    }
   }
   function handleSaveModelData(){
    if(props.options.importMetaModelOper==true && props.options.hasOwnProperty('metaModelParam') ){
        if(typeof props.options.metaModelParam.getMetaTableNameDetail === 'function'){
            const teamName = sessionStorage.getItem('teamName');
            setConfirmLoading(true);
          let resFields =  props.options.metaModelParam.getMetaTableNameDetail(props,teamName, metaTableName);
          setTimeout(()=>{
            let fields = [];
            model.fields.forEach((field, idx) => {
                fields.push(field);
            });
            if(Array.isArray(resFields)){
                setConfirmLoading(false);
                let arr=[];
                resFields.forEach(item => {
                    let obj = {};
                    fields.forEach((field,idx) => {
                        obj[field.name] = item[field.name];
                    });
                    arr.push(obj);
                });
                setData(arr);
                setModelDataVisible(false);
            }
          },2000)

        }
    }

   }

    function handleAddRow() {
        let row = new Model();
        row.columnAddOrEditType='add';
        if (typeof props.create === 'function') {
            row = props.create();
        }
        if(hasIndexString){
            let arr=[
                {
                    ...row,
                    isLine:false,
                    key: dataRef.current.length+1,
                    id:  dataRef.current.length+1,
                    index: dataRef.current.length+1,
                }
            ];
            setData(
                dataRef.current.concat(arr)
            );
        } else{
            if (!Array.isArray(dataRef.current)) {
                setData([row,]);

            } else {
                setData(
                    dataRef.current.concat(row)
                );
            }
        }

    }

    function handleEditData() {
        setVisible(true);
        setText(JSON.stringify(dataRef.current, null, 4));
    }

    function handleChangeData(value) {
        setText(value);
    }

    function handleSaveText() {
        setVisible(false);
        setData(JSON.parse(text));
    }
    function onCellClick(event,row, index) {
        if(row.isCellClick){
            event.preventDefault();
            event.stopPropagation();
            setCellRowData(row);
            setCellRowVisible(true);
        }

    }
    function rowDataFun(rowData,inx){
        if(JSON.stringify(rowData) !== "{}"){
            const newData = [...dataRef.current];
            let updatedData = [];
            if(newData.length == 0){
                updatedData.push({...rowData,index:inx ? inx:0})
            }else{
                 updatedData = newData.map(item => {
                    if (item.index == rowData.index) {
                      return rowData;
                    } else {
                      return item;
                    }
                  });
            }

              setChangeRowData([...updatedData]);

        }
    }
    function cellRowOk() {
        // cellRowData
        const newData = [...dataRef.current];
        let name=cellRowData.name;
        formCellModalRef.current.validate((errors, values) => {
            if(values){
                const {rule}=values;
                newData.filter(item=>{
                    let obj=item;
                    for (const key in obj){
                        if( key == name){
                            obj[key]=rule||'';
                        }
                    };
                    return item;
                })
                setData([...newData]);
            }

        })
        setCellRowVisible(false);
    }
      const [height, setHeight] = useState(0);
      const resizeUpdate = e => {
        const ht = e.target.innerHeight - 270;
        setHeight(ht);
      };
    useEffect(() => {
        dataRef.current = data;
        if (JSON.stringify(data) !== JSON.stringify(value)) {
            props.onChange && props.onChange(data);
        }
    }, [data])
    useEffect(() => {
        const h = document.body.scrollHeight - 270;
        setHeight(h);
        window.addEventListener('resize', resizeUpdate);
        // 初始加载页面
        return () => {
          window.removeEventListener('resize', resizeUpdate);
        };
    }, [])
 

    useEffect(() => {
        if(Array.isArray(changeRowData) && changeRowData.length>0){
            if (JSON.stringify(data) !== JSON.stringify(changeRowData)) {
                setData(changeRowData);
            }
        }
    }, [changeRowData])

    useEffect(() => {
        if (JSON.stringify(data) !== JSON.stringify(value)) {
            let value_= value.map(item=>{
                return {...defaultValueObj, ...item};
            })
            setData(value_);
        }
    }, [value])
    function handleSortEnd({ oldIndex, newIndex }) {
        if (oldIndex !== newIndex) {
            const newData = arrayMove([].concat(data), oldIndex, newIndex).filter((el) => {
                return !!el;
            });
            setData(newData);
        }
    }
    return (
        <>
            { oper && (addOper || deleteOper || editAllOper || importOper || importMetaModelOper || batchSelection) ? <div
                className="table-form-header ">
                    <div className="table-form-btn">
                    { addOper && <Button
                        size="mini"
                        icon={<IconAdd />}
                        onClick={handleAddRow}
                        >
                    </Button>}
                    {importOper && (
                        <Tooltip
                            content={loginT("Excel导入")}>
                            <Button
                                size="mini"
                                icon={<IconImport />}
                                onClick={handlePasteData}
                                style={{
                                    marginBottom: '10px'
                                }}>
                            </Button>
                        </Tooltip>
                    )}
                     {importMetaModelOper && (
                        <Tooltip
                            content={loginT("元模型导入")}>
                            <Button
                                size="mini"
                                icon={<IconDataModel />}
                                onClick={handleDataModelData}
                                style={{
                                    marginBottom: '10px'
                                }}>
                            </Button>
                        </Tooltip>
                    )}
                    {
                        isInterfaceInitialData &&(
                            <Tooltip
                            content={props?.interfaceInitialOption?.tooltipTitle ? props?.interfaceInitialOption?.tooltipTitle : loginT('根据接口初始化')}>
                            <Button
                                size="mini"
                                icon={<IconRefresh />}
                                onClick={()=>{
                                    if (isInterfaceInitialData && props.interfaceInitialOption && typeof props?.interfaceInitialOption.handleBtnClick === 'function') {
                                        props.interfaceInitialOption.handleBtnClick(props)
                                    }
                                    }}
                                style={{
                                    marginBottom: '10px'
                                }}>
                            </Button>
                        </Tooltip>
                        )
                    }
                    
                
                    {
                        batchSelection && (
                            <Tooltip
                            content={props.batchTitle ? props.batchTitle : loginT('批量选择')}>
                            <Button
                                size="mini"
                                icon={<IconDropdown />}
                                onClick={()=>{
                                        if (props.batchSelection && typeof props.handleBatchModalSelection === 'function') {
                                            props.handleBatchModalSelection({
                                                ...props,
                                                setSelectedBatchRowKeys,selectedBatchRowKeys,
                                                setSelectedBatchRows,selectedBatchRows,
                                                setBatchColumns,batchColumns,
                                                setBatchData,batchData,
                                                setBatchVisible,batchVisible,
                                                setBatchLoading,batchLoading,
                                                });
                                        }
                                    }}
                                style={{
                                    marginBottom: '10px'
                                }}>
                            </Button>
                        </Tooltip>
                        )
                    }
                    <Button.Group
                        style={{
                            // float: 'right'
                        }}>
                        { props.extra }
                        { editAllOper && <Button
                            size="mini"
                            icon={<IconEdit />}
                            onClick={handleEditData}
                          >
                        </Button>}
                        { deleteOper && <><Button
                            size="mini"
                            icon={<IconDelete />}
                            onClick={handleDeleteRows}
                           >
                        </Button></>}
                    </Button.Group>
                </div>
            </div> : null}
            <SortableTable
                className="modo-table-form-box"
                border={props.border}
                data={data}
                ref={tableRef}
                childrenColumnName={props.childrenColumnName}
                pagination={props.pagination ? {
                    pageSize,
                    hideOnSinglePage: true,
                    total: data ? data.length : 0,
                    showTotal: true,
                } : false}
                rowKey={(record, x) => {
                    // return record[props.rowKey];
                    return data.indexOf(record);
                }}
                scroll={{
                    x: true,
                    y: true
                }}
                components={{
                    body: {
                        row: SortableRow,
                        cell: EditableCell,
                    }
                }}
                columns={columns.map((column, index) => {
                    return {
                        title: column.label,
                        dataIndex: column.name,
                        width: column.options ? column.options.width : null,
                            ...column,
                        className:column.isCellClick ?  "cell-div" : column.isHidden ? 'isHidden': '' ,
                        index:index,
                        config,model,formRef,thisEvent,
                        onCell: () => ({
                            rowKey: props.rowKey,
                            rowDataFun:(data,inx)=>{rowDataFun(data,inx)},
                            onClick:(event)=>onCellClick(event,column,index),
                        }),
                        };
                })}
                onRow={(record, index) => {
                    return {
                        onHandleSave:(record, index)=> handleSave(record, index,event),
                        rowKey: props.rowKey,
                        rowIndex: index,
                        props,
                    };
                }}
                rowSelection={deleteOper && {
                    type: 'checkbox',
                    selectedRowKeys,
                    columnWidth: props.selectWidth || undefined,
                    checkCrossPage: true,
                    preserveSelectedRowKeys: true,
                    // onChange: (selectedRowKeys, selectedRows) => {
                    //     setSelectedRowKeys(selectedRowKeys);
                    // },
                    onSelectAll:(selected,selectedRows)=>{
                       let arr= selectedRows.map(r => {return data.indexOf(r)});
                        if(selected){
                            setSelectedRowKeys(arr);
                        }else{
                            setSelectedRowKeys([]);
                        }
                    },
                    onSelect: (selected, record, selectedRows) => {
                        const index = data.indexOf(record);
                        if(selected){
                            selectedRowKeys.push(index)
                        }else{
                            selectedRowKeys.splice(selectedRowKeys.indexOf(index), 1);
                        }
                        // const index = data.indexOf(record);
                        // if (selected) {
                        //     selectedRowKeys.push(index)
                        // } else {
                        //     selectedRowKeys.splice(selectedRowKeys.indexOf(index), 1);
                        // }
                        // setSelectedRowKeys(selectedRowKeys);
                    }
                }}
                useDragHandle
                onSortEnd={handleSortEnd}
                helperContainer={() => document.querySelector('.arco-drag-table-container table tbody')}
                updateBeforeSortStart={({ node }) => {
                    const tds = node.querySelectorAll('td');
                    tds.forEach((td) => {
                        td.style.width = td.clientWidth + 'px';
                    });
                    node.style.zIndex = '1000'
                }}
                onChange={pagination => {
                    setCurrent(pagination.current);
                    setPageSize(pagination.pageSize);
                }}/>

            <Modal
                style={{
                    width: '60%',
                    cursor: 'move'
                }}
                title={loginT('全文编辑')}
                visible={visible}
                onOk={handleSaveText}
                onCancel={() => setVisible(false)}
                autoFocus={false}
                modalRender={(modal) => <Draggable
                    disabled={disabled}>
                    {modal}
                </Draggable>}>
                <Editor
                    value={text}
                    onChange={handleChangeData}
                    language="json"/>
            </Modal>
            <Modal
            style={{
                width: '60%',
                cursor: 'move'
            }}
            title={cellRowData.label||''}
            visible={cellRowVisible}
            onOk={() =>cellRowOk() }
            onCancel={() => setCellRowVisible(false)}
            autoFocus={false}
            focusLock={true}>
            <div>
           <Form ref={formCellModalRef} style={{ width: 600 }} autoComplete='off'>
                <FormItem label={loginT('规则')} field='rule'>
                    <Input placeholder={loginT('请输入规则')} />
                </FormItem>
            </Form>
           </div>
            </Modal>
            <Modal
                style={{
                    width: '65%',
                    // cursor: 'move'
                }}
                className='excel-modal'
                title={loginT("Excel导入")}
                visible={handsontableVisible}
                onOk={handleSavePasteText}
                onCancel={() => setHandsontableVisible(false)}
                autoFocus={false}
                // modalRender={(modal) => <Draggable
                //     disabled={disabled}>
                //     {modal}
                // </Draggable>}
            >
                <div className="pasteHotTable">
                    <HotTable
                        data={hotTableColumns}
                        ref={hotTableRef}
                        height={height}
                        colHeaders={colHeadersList}
                        rowHeaders={true}
                        contextMenu={true}
                        language={zhCN.languageCode}
                        stretchH="all"
                        licenseKey="non-commercial-and-evaluation"></HotTable>
                </div>
            </Modal>
            <Modal
                style={{
                    width: '30%',
                }}
                title={loginT("模型导入")}
                visible={modelDataVisible}
                onOk={handleSaveModelData}
                confirmLoading={confirmLoading}
                onCancel={() => setModelDataVisible(false)}
                autoFocus={false}
            >
                <div className="model-data-content">
                <Form
                       ref={modelDataForm}
                        labelCol={{
                            style: { flexBasis: 90 },
                        }}
                        wrapperCol={{
                            style: { flexBasis: 'calc(100% - 90px)' },
                        }}
                        >
                        <FormItem label={loginT('元模型')}  field='metaTableName' >
                        <Select
                            // {...optionsParam}
                            loading={metaTableLoading}
                            showSearch={true}
                            filterOption={false}
                            filterOption={(inputValue, option) =>
                                option.props.value.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0 ||
                                option.props.children.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0
                            }
                                    onChange={(v) => {changeMetaTableName(v)}}
                                    // onSearch={(inputValue)=>{searchMetaTableName(inputValue,'')}}
                                    >
                                {metaTableNameOptions.map((option) => (
                                <Option key={option.value} value={option.value}>
                                    {`${option.label} (${option.value})`}
                                </Option>
                                ))}
                        </Select>
                        </FormItem>
                        </Form>
                </div>
            </Modal>
            <Modal
                style={{
                    width: '50%',
                }}
                title={props.batchTitle ? props.batchTitle : loginT('批量选择')}
                visible={batchVisible}
                onOk={()=>{
                        if (props.batchSelection && typeof props.handleBatchModalSaveBtn === 'function') {
                            props.handleBatchModalSaveBtn({
                                ...props,
                                setSelectedBatchRowKeys,selectedBatchRowKeys,
                                setSelectedBatchRows,selectedBatchRows,
                                setBatchColumns,batchColumns,
                                setBatchData,batchData,
                                setBatchVisible,batchVisible,
                                setBatchLoading,batchLoading,
                            });
                        }
                    }}
                key={batchVisible}
                confirmLoading={batchLoading}
                onCancel={() => setBatchVisible(false)}
                autoFocus={false}
            >
                <div className="batch-selection-content">
                <Table
                    // rowKey='index'
                    rowKey={(record, x) => {
                        return record?.index ? record?.index : batchData.indexOf(record);
                    }}
                    columns={batchColumns}
                    data={batchData}
                    rowSelection={{
                    selectedBatchRowKeys,
                    onChange: (selectedRowKeys, selectedRows) => {
                        setSelectedBatchRowKeys(selectedRowKeys);
                        setSelectedBatchRows(selectedRows);
                    },
                    }}
                />

                </div>
            </Modal>
        </>
    );
})


class TableForm extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            loading:props.loading||false,
            // loading:false,
        };
        this.editableTable = React.createRef();

    }
    async validate(callback) {
        let valid = true;
        for (let m of this.editableTable.current.manager.refs[0]) {
            const key = Object.keys(m.node).find(attr => {
                return attr.indexOf('__reactInternalInstance') > -1
            });
            try {
                const values = await m.node[key].ref.current.validate();
            } catch (error) {
                valid = false;
            }
        }
        typeof callback === 'function' && callback(valid);
        return valid;
    }

    render() {
        return (
            <div className={[
                'modo-table-form-box',
                this.props.className,
                (Array.isArray(this.props.value) && this.props.value.length > 0) ? '' : 'empty'
            ].join(' ')}>
                    <Spin loading={this.props.loading?this.props.loading:false}>
                        <EditableTable
                            ref={this.editableTable}
                            {...this.props}>
                        </EditableTable>
                    </Spin>
            </div>
        );
    }
}

export default TableForm;
