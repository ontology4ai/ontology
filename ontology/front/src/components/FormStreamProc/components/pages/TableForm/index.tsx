import React, { useState,useRef, useEffect, useContext, useCallback } from 'react';
import { Button, Table, Input, Select, Form, Grid,Modal ,Spin,Tooltip,Message } from '@arco-design/web-react';
import * as ArcoComponent from  '@arco-design/web-react';
import { Tag } from 'modo-design';
import IconSelect from '@/components/IconSelect';
import SelectInput from '@/components/SelectInput';
import { IconAdd, IconDelete, IconBrush, IconEdit ,IconImport,IconDataMining,IconSearch} from 'modo-design/icon';
import Editor from '@/components/Editor';
import CodeEditor from '../../../../../pages/flink-sql/views/streamMxgraph/streamFlinkSQL/code-editor';
// import {ddlResolveFields4tableName,getDsByCategory,getSqlFieldList} from '../../../../../pages/flink-sql/api/api';
import {getSqlFieldList} from '../../../../../pages/flink-sql/api/api';
import BindVar from 'packages/modo-view/designer/src/components/BindVar';
import Draggable from 'react-draggable';
import formItemTypes from 'packages/modo-view/core/src/components/Widget/components/Form/types';
import { IconDragDotVertical ,IconFindReplace} from '@arco-design/web-react/icon';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import getVal from 'packages/modo-view/core/src/utils/getVal';
import { HotTable } from '@handsontable/react';
import { registerLanguageDictionary, zhCN } from 'handsontable/i18n';
import useLocale from 'modo-plugin-common/src/utils/useLocale';
import locale from '../../../../../pages/flink-sql/locale';
registerLanguageDictionary(zhCN);
const codemirrorRef = React.createRef();
import { cloneDeep } from 'lodash';
import './style/index.less';
import _ from 'lodash';
import { options } from 'yargs';
require('static/guid');
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
let sqlDataList = [];//记录存量表数据

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
                            refForm.current.validate((errors, values) => {
                                if (!errors) {
                                    let change = false;
                                    for (let key in _) {
                                       if (_[key] !== record[key]) {
                                           change = true;
                                       }
                                    }
                                    if (change) {
                                        onHandleSave && onHandleSave({ ...record, ...values }, rowIndex);
                                    }
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
// function EditableCells (props, ref){
//     return  <EditableCell {...props}/> 
// }


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
        let {column,rowData}=this.props;
        let props_={
            config:column.config,
            formRef:column.formRef,
            model:column.model,
            thisEvent:column.thisEvent,
            rowData
            };
        if(column.options && typeof column.options.onChange === 'function'){
            column.options.onChange(props_,value,column,rowData,this)
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
        // console.log('this.state',columnKey,rowData,rowData[columnKey],this.state)
        if (formItemTypes.indexOf(column.type) > -1 || column.type == 'SelectInput') {
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
                                        triggerPropName={column.triggerPropName || 'value'}>
                                          
                                        {column.isLinkage ? <Select
                                                    // value={rowData[columnKey]}
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
                                            // onVisibleChange={(newValue)=>{this.handelOnFocus(newValue)}}
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
    const publicT = useLocale();
    const userT = useLocale(locale);
    const [data, setData] = useState(props.value);
    const [current, setCurrent] = useState(1);
    const [pageSize, setPageSize] = useState(props.pagination ? (props.pageSize || 20) : 0);
    const [text, setText] = useState(JSON.stringify(props.value));
    const [visible, setVisible] = useState(false);
    const [disabled, setDisabled] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [cellRowData, setCellRowData] = useState({});
    const [cellRowVisible, setCellRowVisible] = useState(false);
    const [joinFieldOption, setJoinFieldOption] = useState([]);
    const [handsontableVisible, setHandsontableVisible] = useState(false);
    const [handsonPastetableVisible, setHandsonPastetableVisible] = useState(false);//表格粘贴
    const [sqlText, setSqlText] = useState('');//sql文本
    const [dsTypeOptions, setDsTypeOptions] = useState('');//数据源类型列表
    const [currentDsType, setCurrentDsType] = useState('');//数据源类型
    const [sqlVisible, setSqlVisible] = useState(false);//sql文本编辑窗口 
    const formRef1 = useRef();
    const formItemLayout = {//参数列表布局
        labelCol: {
          span: 10,
        },
        wrapperCol: {
          span: 14,
        },
      };
    const [cellOption, setCellOption] = useState({
        options:[]
    });
    // const { isEditingRow, getCurrentRowIndex } = useEditableContext();
    
    // const tableRef = useRef(null);
    const dataRef = useRef(data);
    const sortRef = useRef(0);
    const formCellModalRef = useRef();


    const { model,config,formRef,thisEvent} = props;
    const { value } = props;

    const optionInterface:any = {};
    model.fields.forEach(field => {
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
    const importOper = getVal(props.importOper, false);
    const editSqlOper = getVal(props.editSqlOper, false);
    const deleteOper = getVal(props.deleteOper, true);
    const editAllOper = getVal(props.editAllOper, true);
    let columns = [];
 
    if (hasIndex) {
        columns.push({
            title: userT('编号'),
            width: props.indexWidth || 50,
            dataIndex: "index",
            editable: false,
            type: 'string',
            className: "table-index",
            render: (col, record, index) => {
                return (
                    <span>
                        {index + 1}
                    </span>
                )
            }
        })
    }
    if (hasIndexString) {
        columns.push({
            title: userT('编号'),
            width: props.indexWidth || 50,
            key:'string',
            type: 'string',
            align:'center',
            editable: false,
            className: "table-index",
        })
    }
    const filteredFields = model.fields.filter((field) => field.isShow !== false);
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
            label: userT('操作'),
            width: props.operWidth || 90,
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
            title: userT('排序'),
            width: props.sortWidth || 50,
            dataIndex: "sort",
            editable: false,
            className: "drag-visible",
            render: () => <DragHandle />
        })
    }
    
    function handleSaves(row, index,event) {
    }
    
    function handleSave(row, index,event) {
        //根据row.name过滤出row.label;
        // let newDataArr=[];
        let  rowObj={};
            model.fields.forEach((item)=> {
                if(item.isFilter && item.options && typeof item.options.onChange === 'function'){
                    // newDataArr=  item.options.onChange(row, index,model.fields);
                    rowObj=  item.options.onChange(props,row, index,model.fields);
                }
            });
        if(JSON.stringify(rowObj) !== "{}"){
            const newData = [...dataRef.current];
            newData.splice((current - 1) * pageSize + index, 1, {
                ...newData[index],
                index:index,
                ...rowObj,
               
            });
            // console.log('改变后的newData',newData)
            setData([...newData]);
        
        } else{
            const newData = [...dataRef.current];
            newData.splice((current - 1) * pageSize + index, 1, {
                ...newData[index],
                index:index,
                ...row,
            });
            setData([...newData]);
          }
    }

    function handleRemoveRow(key) {
        setData(dataRef.current.filter((row, index) => {
            return ((current - 1) * pageSize + key) !== index;
        }));
    }

    function handleDeleteRows() {
        if(data.length ===0){
            Message.warning(userT('表格无数据'));
            return;
        }
        if(selectedRowKeys.length === 0){
            Message.warning(userT('未选中删除行'));
            return;
        }
        setData(dataRef.current.filter((row, index) => {
            return selectedRowKeys.indexOf(index) < 0;
        }));
        setSelectedRowKeys([]);
    }

    function handleClearRow() {
        setData([]);
    }

    function handleAddRow() {
        let row = new Model();
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

    // 表格粘贴 start --------------------------
   const [pastColHeadersList, setPastColHeadersList] = useState([]);//显示列表头
   const [hotPasteTableColumns, setHotPasteTableColumns] = useState([['']]);
   const hotPasteTableRef = useRef();
   let mappingTypeLabels = [];//参数-映射关系列表中文名称
   let mappingTypeValues = [];//参数-映射关系列表英文名称
   const [mappingLabels, setMappingLabels] = useState([]);//参数-映射关系列表中文名称
   const [mappingValues, setMappingValues] = useState([]);//参数-映射关系列表英文名称
   //点击导入按钮，弹窗窗口
   function handlePasteTableData() {
    if (data && data.length>0){
    }else{
        Message.warning(userT('表内初始模型数据不能为空，请先选择模型'));
        return;
    }
    // console.log('表头数据1', model.fields);
    ////字段(映射关系)特殊处理,设定初始值
    let headerDataList = model.fields;
    // console.log('表头数据1', headerDataList);
    for(let i=0;i<headerDataList.length;i++){
        if('mappingType' === headerDataList[i].name){
            let mappingTypeOps = headerDataList[i].options.options;
            if(mappingTypeOps.length>0){
                mappingTypeOps.forEach((field) => {
                    mappingTypeLabels.push(field.label);
                    mappingTypeValues.push(field.value);
                });
            }
        }
    }
    setMappingLabels(mappingTypeLabels);
    setMappingValues(mappingTypeValues);
    // console.log('映射关系列表中文名称',mappingTypeLabels);
    // console.log('映射关系列表英文名称',mappingTypeValues);
    // console.log('原始表数据',data);
        // console.log('初始化表头数据0');
       setHotPasteTableColumns([['']]);
       
        // console.log('入参集合2', props);
       // 渲染表头
       let headArr = []
       model.fields.forEach((field, idx) => {
           let hidden = field.options ? field.options.hidden : false;
           if (field.options && field.options.hiddenBindVar) {
               hidden = props.getOptions({
                   hiddenBindVar: field.options.hiddenBindVar
               }).hidden;
           }
           if(field.hidden === true){
                hidden = true;
           }
           if (hidden !== true){
               headArr.push(field.label);
           }
       });
       setPastColHeadersList(headArr);
       // console.log('设定可显示表头数据3', headArr);
       // console.log('获取表数据4', data);
       if (data && data.length>0){
           let formatData = cloneDeep(data);
           if (props.pasteBefore) { // 存在粘贴弹窗挂载前的格式化函数
               formatData = props.pasteBefore(formatData)
           }
           // console.log('格式化后的表数据5', formatData);
           jsonToHotPastTableText(formatData);
           
       }
       setHandsonPastetableVisible(true);
   }
   //抽取数据到弹窗表格中展示
   function jsonToHotPastTableText(value) {
       let arr = [];
       // console.log('格式化后的表数据6', value);
       value.forEach((item, index) => {
           let arrItem = [];
           model.fields.forEach((field, idx) => {
               let hidden = field.options ? field.options.hidden : false;
               if (field.options && field.options.hiddenBindVar) {
                   hidden = props.getOptions({
                       hiddenBindVar: field.options.hiddenBindVar
                   }).hidden;
               }
               if(field.hidden === true){
                hidden = true;
               }
               //字段(映射关系)特殊处理,英文转中文
               if (hidden !== true) {
                let dataOne = item[field.name];
                if(field.name === 'mappingType'){
                    let mappingTypeValue = dataOne;
                    let newMappingTypeValue = dataOne;
                    if(mappingTypeValue === mappingTypeValues[0]){
                        newMappingTypeValue = mappingTypeLabels[0];
                    }else if(mappingTypeValue === mappingTypeValues[1]){
                        newMappingTypeValue = mappingTypeLabels[1];
                    }
                    dataOne = newMappingTypeValue;
                }
                arrItem.push(dataOne);
                   
               }
           });
           // console.log('可显示表头数据对应字段7', arrItem);
           arr.push(arrItem)
       });
       setHotPasteTableColumns(arr);
       // console.log('设定表格内可显示表头对应数据8', arr);

   }
   // 点击表格下方确定按钮，保存数据到组件表格中
   function handleSavePasteTableText() {
    // console.log('映射关系列表中文名称',mappingLabels);
    // console.log('映射关系列表英文名称',mappingValues);
       const text = hotPasteTableRef.current.__hotInstance.getData();
       // console.log('获取表格内数据9', text)
       // console.log('获取表格内数据9', hotPasteTableColumns)
       hotPasteTableTextToJson(text);
       
   }
   //将弹窗表格内数据导入组件表格中
   function hotPasteTableTextToJson(textDataList) {
       // 获取非隐藏的字段列表
       let fieldsNotHidden = [];
       model.fields.forEach((field, idx) => {
           let hidden = field.options ? field.options.hidden : false;
           if (field.options && field.options.hiddenBindVar) {
               hidden = props.getOptions({
                   hiddenBindVar: field.options.hiddenBindVar
               }).hidden;
           }
           if(field.hidden === true){
                hidden = true;
           }
           if (hidden !== true) {
               fieldsNotHidden.push(field);
           }
       });
       // console.log('获取可显示表头数据10', fieldsNotHidden);
       let formatData = [];
       if (data && data.length>0){
           formatData = cloneDeep(data);
           if (props.pasteBefore) { // 存在粘贴弹窗挂载前的格式化函数
               formatData = props.pasteBefore(formatData)
           }
           
       }
        // console.log('开始将表内字段表数据替换原表数据字段');
       // console.log('格式化后的原表数据11', formatData);
       // console.log('新表数据12', textDataList);
       let newFormatData = [].concat(formatData);
        let headerDataList = model.fields;
        let emptRow = {};
        if(newFormatData.length>0){
            let keys = Object.keys(newFormatData[0]);
            keys.forEach((item) => {
                emptRow[item] = null;
            })
        }else{
            headerDataList.forEach((item) => {
                emptRow[item.name] = null;
            })
        }
        let num = newFormatData.length;
        let indexAdd = 0;
        // console.log('新建的一行空数据1',emptRow);
        let keyList = Object.keys(emptRow);
       let arr = [];
       textDataList.forEach((item,index) => {
           // console.log('原表第'+index+'行数据', item);
           let newTextData = textDataList[index];
           // console.log('新表第'+index+'行数据', newTextData);
           let tmpRow = {};//记录表格单行数据
           fieldsNotHidden.forEach((headerData,idx) => {
               // console.log('字段名称', headerData.name);
               // console.log('字段值旧', newTextData[idx]);
               //字段(映射关系)特殊处理,中文转英文
               let dataOne = newTextData[idx];
               let dataName = headerData.name;
               if(dataName === 'mappingType'){
                    let mappingTypeValue = dataOne.trim();
                    let newMappingTypeValue = dataOne.trim();
                    if(mappingTypeValue === mappingLabels[0]){
                        newMappingTypeValue = mappingValues[0];
                    }else if(mappingTypeValue === mappingLabels[1]){
                        newMappingTypeValue = mappingValues[1];
                    }
                    // console.log('字段值新', newMappingTypeValue);
                    dataOne = newMappingTypeValue;
                }
               
               tmpRow[headerData.name] = dataOne;
               // console.log('字段值新', tmpRow[headerData.name]);
           });
            console.log(tmpRow); 
                            let newRow = {};
                            keyList.forEach((key)=>{
                                newRow[key] = null;
                                if(key === 'index'){
                                    newRow[key] = indexAdd;
                                }
                                if(key === 'id'){
                                    newRow[key] = guid();
                                }
                                if(key === 'name'){
                                    newRow[key] = '';
                                }
                                if(key === 'label'){
                                    newRow[key] = '';
                                }
                                if(key === 'dataType'){
                                    newRow[key] = 'string';
                                }
                                if(key === 'fieldLabel'){
                                    newRow[key] = newRow['label'];
                                }
                                if(key === 'fieldName'){
                                    newRow[key] = newRow['name'];
                                }
                                if(key === 'mappingType'){
                                    newRow[key] = mappingValues[0];
                                }
                                if(key === 'mappingRule'){
                                    newRow[key] = '';
                                }
                                if(key === 'value'){
                                    newRow[key] = newRow['name'];
                                }
                            })
                            indexAdd = indexAdd+1;
                            console.log(indexAdd); 
                            let addOneRow = {...newRow,...tmpRow};
                            addOneRow.fieldLabel = addOneRow.label;
                            addOneRow.fieldName = addOneRow.name;
                            addOneRow.value = addOneRow.name;
                            arr.push(addOneRow);
       });
       // console.log('组装表内字段完毕', arr);
       


       let formatArr = arr;
       if (arr && arr.length > 0 && props.pasteAfter) { // 存在粘贴数据保存前的格式化函数
           formatArr = props.pasteAfter(arr)
       }
       // console.log('格式化数据为json', formatArr);
       setData(formatArr);
       setHandsonPastetableVisible(false);
       // sortRef.current++;
   }
   

   // textarea
   // const [hotTableText, setHotTableText] = useState('');
   // const [hotTableTextArr, setHotTableTextArr] = useState([]);
   // function hotTableTextChange(value) {
   //  console.log('修改数据', value)
   //     console.log('setHotTableText', value)
   //     setHotTableText(value)
   //     var rows = [];
   //     value.split('\n').forEach(row => {
   //         rows.push(row.split('\t'))
   //     })
   //     // console.log('hotTableTextChange/rows', rows);
   //     setHotTableTextArr(rows)
   //     console.log('setHotTableTextArr', rows)
   // }
   // 表格粘贴 end --------------------------
   // SQL导入 start --------------------------
    // const formValuesChange = (changeValue,values)=>{
    //     if(Object.keys(changeValue).length == 1 && changeValue.hasOwnProperty('dsType')){
    //         var dsType = values.dsType;
    //         if('' === dsType || null === dsType || undefined === dsType){
    //             setCurrentDsType('');
    //         }else{
    //             setCurrentDsType(dsType);
    //         }
    //     }
    // }
    function handleEditSqlData() {
        sqlDataList = [].concat(data);
        if (data && data.length>0){
        }else{
            Message.warning(userT('表内初始模型数据不能为空，请先选择模型'));
            return;
        }
        setSqlVisible(true);
    }
    // function sqlFormatter(){//ctrl+3
    //     codemirrorRef.current.formatCode();
    // }
    // function searchCode(){//ctrl+H
    //     codemirrorRef.current?.openSearch();
    //   }
    // function replace(){//ctrl+F
    //     codemirrorRef.current?.handleReplace();
    // }
    function handleChangeSqlData(value) {
        setSqlText(value);
        console.log(value);
    }
    function handleSaveSqlData() {
        if(undefined === sqlText || null === sqlText || '' === sqlText){
            Message.warning(userT('请输入文本内容'));
            return;
        }
        let newFormatData = [].concat(sqlDataList);
        let headerDataList = model.fields;
        let emptRow = {};
        if(newFormatData.length>0){
            let keys = Object.keys(newFormatData[0]);
            keys.forEach((item) => {
                emptRow[item] = null;
            })
        }else{
            headerDataList.forEach((item) => {
                emptRow[item.name] = null;
            })
        }
        let num = newFormatData.length;
        let indexAdd = 0;
        // console.log('新建的一行空数据1',emptRow);
        let keyList = Object.keys(emptRow);
        let lineFeed = '';
        if(sqlText.indexOf('\r\n')>-1){
            lineFeed = '\r\n';
        }else if(sqlText.indexOf('\n')>-1){
            lineFeed = '\n';
        }else if(sqlText.indexOf('\r')>-1){
            lineFeed = '\r';
        }
        getSqlFieldList({sql:sqlText,lineFeed:lineFeed}).then((res)=>{
            if(res.data && res.data.success){
                let dataList = [];
                if(res.data.data.length>0){
                    dataList = res.data.data;
                }
                var toAddDataList = [];
                if (dataList.length>0) {
                    for(let i=0;i<dataList.length;i++){
                        let item = dataList[i];
                        let itemData = {};
                        itemData.name = '';//字段名
                        itemData.expression = '';//表达式
                        if(item.indexOf(',')>-1){
                            itemData.name = item.substring(0,item.indexOf(','));
                            itemData.expression = item.substring(item.indexOf(',')+1);
                        }else{
                            itemData.name = item;
                            itemData.expression = '';
                        }
                        console.log(itemData.name); 
                            let newRow = {};
                            keyList.forEach((key)=>{
                                newRow[key] = null;
                                if(key === 'index'){
                                    newRow[key] = indexAdd;
                                }
                                if(key === 'id'){
                                    newRow[key] = guid();
                                }
                                if(key === 'name'){
                                    newRow[key] = itemData.name;
                                }
                                if(key === 'label'){
                                    newRow[key] = itemData.name;
                                }
                                if(key === 'dataType'){
                                    newRow[key] = 'string';
                                }
                                if(key === 'fieldLabel'){
                                    newRow[key] = itemData.name;
                                }
                                if(key === 'fieldName'){
                                    newRow[key] = itemData.name;
                                }
                                if(key === 'mappingType'){
                                    newRow[key] = 'expression';
                                }
                                if(key === 'mappingRule'){
                                    newRow[key] = itemData.expression;
                                }
                                if(key === 'value'){
                                    newRow[key] = itemData.name;
                                }
                            })
                            indexAdd = indexAdd+1;
                            console.log(indexAdd); 
                            toAddDataList.push(newRow); 
                    };
                }
                console.log(toAddDataList); 
                // let newDataList = newFormatData.concat(toAddDataList);
                let newDataList = [].concat(toAddDataList);
                // console.log('组装后数据为json', newDataList);
                setData(newDataList);
                setSqlVisible(false);
              }else{
                Message.error({ title: userT('失败'), content: userT('转换失败') })
                console.log(userT('转换失败'),res.data.msg)
              }
            // setSqlVisible(false);
        }).catch(()=>{
            console.log(userT('查询数据源类型失败'));
        });
    }
   // SQL导入 end --------------------------
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
    // handleCellChange=(value)=> {
    //     console.log('handleCellChange',value,this.props)
    // }
  
    function onCellClick(event,row, index) {
        event.preventDefault();
        event.stopPropagation();
        if(row.isCellClick){
            setCellRowData(row);
            setCellRowVisible(true);
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

    // ThemeContext.data=data;
    useEffect(() => {
        dataRef.current = data;
        if (JSON.stringify(data) !== JSON.stringify(value)) {
            props.onChange && props.onChange(data);
        }
    }, [data])

    useEffect(() => {
        if (JSON.stringify(data) !== JSON.stringify(value)) {
            setData(value);
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
            { oper && (addOper || deleteOper || editAllOper ||importOper || editSqlOper) ? <div
                className="table-form-header ">
                    {/* table-form-header-text */}
                    {/* <div className="source-table-title">
                        <h3> 
                            <span className='space'></span>
                            <span >输入字段</span>
                        </h3>
                    </div> */}
                    <div className="table-form-btn">
                    { addOper && <Button
                        size="mini"
                        icon={<IconAdd />}
                        onClick={handleAddRow}
                        >
                    </Button>}
                    {importOper && (
                        <Tooltip
                            content={userT('表格粘贴')}>
                            <Button
                                size="mini"
                                icon={<IconImport />}
                                onClick={handlePasteTableData}
                                style={{
                                    marginBottom: '10px'
                                }}>
                            </Button>
                        </Tooltip>
                    )}
                    {editSqlOper && (
                        <Tooltip
                            content={userT('表达式导入')}>
                            <Button
                                size="mini"
                                icon={<IconImport />}
                                onClick={handleEditSqlData}
                                style={{
                                    marginBottom: '10px'
                                }}>
                            </Button>
                        </Tooltip>
                    )}
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
                        // cell: <EditableCell extraParam="这是额外的参数" />,
                        // cell: (props) => EditableCells({ ...props,config,model,formRef,thisEvent})
                    }
                }}
                columns={columns.map((column, index) => {
                    return {
                        title: column.label,
                        dataIndex: column.name,
                        width: column.options ? column.options.width : null,
                            ...column,
                        className:column.isCellClick?"cell-div":'',
                        index:index,
                        config,model,formRef,thisEvent,
                        onCell: () => ({
                            onHandleSave: handleSaves,
                            rowKey: props.rowKey,
                            onClick:(event)=>onCellClick(event,column,index),
                        }),
                        };
                })}
                onRow={(record, index) => {
                    return {
                        onHandleSave:(record, index)=> handleSave(record, index,event),
                        rowKey: props.rowKey,
                        rowIndex: index
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
                        if (selected) {
                            selectedRowKeys.push(index)
                        } else {
                            if(selectedRowKeys.length>0){
                                for(let i=0;i<selectedRowKeys.length;i++){
                                    if(index === selectedRowKeys[i]){
                                        selectedRowKeys.splice(i,1);
                                        break;
                                    }
                                }
                            }
                            
                            // selectedRowKeys.splice(selectedRowKeys.indexOf(index), 1);
                        }
                        console.log(selectedRowKeys);
                        setSelectedRowKeys(selectedRowKeys);
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
                    // cursor: 'move'
                }}
                title={userT('表格粘贴')}
                visible={handsonPastetableVisible}
                onOk={handleSavePasteTableText}
                onCancel={() => setHandsonPastetableVisible(false)}
                autoFocus={false}
                // modalRender={(modal) => <Draggable
                //     disabled={disabled}>
                //     {modal}
                // </Draggable>}
            >
                <div className="card-list-title">
                    <span style={{color:'red'}}>{userT('提示：字段中文名和字段名需保持不变')}</span>
                </div>
                <div className="pasteHotTableOpen">
                    <HotTable
                        data={hotPasteTableColumns}
                        ref={hotPasteTableRef}
                        height="auto"
                        colHeaders={pastColHeadersList}
                        rowHeaders={true}
                        contextMenu={true}
                        language={zhCN.languageCode}
                        stretchH="all"
                        licenseKey="non-commercial-and-evaluation"></HotTable>
                </div>
            </Modal>
            <Modal
                style={{
                    width: '60%',
                    cursor: 'move'
                }}
                title={userT('表达式导入')}
                visible={sqlVisible}
                onOk={handleSaveSqlData}
                onCancel={() => setSqlVisible(false)}
                autoFocus={false}
                modalRender={(modal) => <Draggable
                    disabled={true}>
                    {modal}
                </Draggable>}>
                {/*<div>
                <div className='db-code-toolbar-left'>
                    <Tooltip position='bottom'  className="button" trigger='hover' content='格式化 ctrl+3'>
                        <IconDataMining className='action-icons-item' onClick={sqlFormatter}/>
                    </Tooltip>
                    <Tooltip position='bottom'  className="button" trigger='hover' content='搜索 ctrl+F'>
                        <IconSearch className='action-icons-item' onClick={searchCode}/>
                    </Tooltip>
                    <Tooltip position='bottom'  className="button" trigger='hover' content='替换 ctrl+H'>
                        <IconFindReplace className='action-icons-item' onClick={replace}/>
                    </Tooltip>
                </div>
                <div className='db-code-toolbar-right'>
                    <Form ref={formRef1} size='mini'
                        // initialValues={testInitialValues}
                        autoComplete='off' {...formItemLayout}
                        // validateMessages={validateMessage}
                        onValuesChange={formValuesChange}
                        layout = 'inline'
                        labelCol={{
                            flex: '170px'
                            }}
                        wrapperCol={{
                            flex: 1
                        }}>
                        <Grid.Row gutter={24}>
                          <Grid.Col span={24}>
                            <Form.Item className='form-half-item' label='数据源类型'  field='dsType'>
                              <Select
                                placeholder='请选择数据源类型'
                                options={dsTypeOptions}
                                size='mini'
                                allowClear={true}
                              />
                            </Form.Item>
                          </Grid.Col>
                        </Grid.Row>
                    </Form>
                </div>
                </div>*/}
                <div className='scrollContent'>
                    <CodeEditor 
                        ref={codemirrorRef} 
                        // codeHeight={codeHeight} 
                        runSql={sqlText}
                        changeSql={handleChangeSqlData}>
                    </CodeEditor>
                </div>
                {/*<Editor
                    value={sqlText}
                    onChange={handleChangeSqlData}
                    language="json"/>*/}
            </Modal>
            <Modal
                style={{
                    width: '60%',
                    cursor: 'move'
                }}
                title={userT('全文编辑')}
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
                <FormItem label={userT('规则')} field='rule'>
                    <Input placeholder={userT('请输入规则')} />
                </FormItem>
            </Form> 
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
