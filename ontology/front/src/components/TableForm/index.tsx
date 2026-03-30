import React, { useState, useRef, useEffect, useContext, useCallback } from 'react';
import { Button, Table, Input, Select, Form, Modal,Tooltip } from '@arco-design/web-react';
import * as ArcoComponent from  '@arco-design/web-react';
import { Tag } from 'modo-design';
import IconSelect from '@/components/IconSelect';
import { IconAdd, IconDelete, IconBrush, IconEdit ,IconImport} from 'modo-design/icon';
import Editor from '@/components/Editor';
import BindVar from 'packages/modo-view/designer/src/components/BindVar';
import Draggable from 'react-draggable';
import formItemTypes from 'packages/modo-view/core/src/components/Widget/components/Form/types';
import { IconDragDotVertical } from '@arco-design/web-react/icon';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import getVal from 'packages/modo-view/core/src/utils/getVal';
import Handsontable from 'handsontable';
import { HotTable } from '@handsontable/react';
import {  } from 'handsontable/registry';
import { registerAllModules } from 'handsontable/registry';
import { registerLanguageDictionary, zhCN } from 'handsontable/i18n';
import { cloneDeep } from 'lodash'
import './style/index.less';
import 'handsontable/dist/handsontable.full.css';
import SelectInput from "@/components/SelectInput";
registerAllModules();
registerLanguageDictionary(zhCN);
const Component = {
    ...ArcoComponent,
    ModoTag: Tag,
    IconSelect: IconSelect,
    TextArea: ArcoComponent.Input.TextArea,
    SelectInput:SelectInput,
    BindVar
};

const FormItem = Form.Item;

const EditableContext = React.createContext({});

const arrayMoveMutate = (array, from, to) => {
    const startIndex = to < 0 ? array.length + to : to;

    if (startIndex >= 0 && startIndex < array.length) {
        const item = array.splice(from, 1)[0];
        array.splice(startIndex, 0, item);
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
                value={{getForm: () => {
                    return this.refForm.current;
                }}}
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
    return <EditableRow
        ref={ref}
        {...props}/>
}), {withRef: true});

class EditableCell extends React.Component {
    constructor(props: any) {
        super(props);
        let type = props.column.type;
        if (type) {
            type = type.substring(0, 1).toLocaleUpperCase() + type.substring(1);
            this.Widget = Component[type];
        }
        this.state = {
            column: JSON.parse(JSON.stringify(this.props.column))
        }
        this.getForm = null;
    }
    parseRules = (rules) => {
        if (Array.isArray(rules)) {
            return rules.map(rule => {
                if (rule.type === 'required') {
                    return {
                        required: true,
                        message: rule.message
                    }
                }
                return rule;
            });
        }
        return [];
    }
    shouldComponentUpdate(nextProps, nextState, c) {

        const refForm= this.getForm && this.getForm();

        if (!refForm) {
            return true;
        }
        const name = this.props.column.dataIndex;
        const value = refForm.getFieldValue(name);

        if (value !== nextProps.rowData[name]) {
            refForm.setFieldValue(name, nextProps.rowData[name]);
            return true;
        }
        if (JSON.stringify(nextProps.column.options) !== JSON.stringify(this.state.column.options)) {
            this.setState({
                column: JSON.parse(JSON.stringify(this.props.column))
            });
            return true;
        }
        return false;
    }
    componentDidUpdate() {
    }
    render() {
        const {
            children,
            className,
            rowData,
            onHandleSave,
            rowKey
        } = this.props;
        const {
            Widget
        } = this;
        const {
            column
        } = this.state;

        const columnKey = column.dataIndex;

        if (formItemTypes.indexOf(column.type) > -1) {
            return (
                <EditableContext.Consumer>
                    {
                        form => {
                            this.getForm = form.getForm;
                            let rules = [];
                            if (column.options) {
                                if (Array.isArray(column.options.rules)) {
                                    rules = this.parseRules(column.options.rules)
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
                                        <Widget
                                            size='mini'
                                            {...column.options}/>
                                    </FormItem>
                                </div>
                            )
                        }
                    }
                </EditableContext.Consumer>
            );
        } else {
            return (
                <div
                    key={columnKey}>
                    { Widget? <Widget
                        size='mini'
                        {...column.options}/> : children }
                </div>
            )
        }
    }
}

const SortableTable = SortableContainer((props) => (<Table {...props} />))

const EditableTable = React.forwardRef((props, tableRef) => {
    const [data, setData] = useState(props.value);
    const [current, setCurrent] = useState(1);
    const [pageSize, setPageSize] = useState(props.pagination ? (props.pageSize || 20) : 0);
    const [text, setText] = useState(JSON.stringify(props.value));
    const [visible, setVisible] = useState(false);
    const [disabled, setDisabled] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState(['4']);
    const [handsontableVisible, setHandsontableVisible] = useState(false);
    // const tableRef = useRef(null);
    const dataRef = useRef(data);
    const sortRef = useRef(0);
    // const t = useLocale(); //使用全局语言
    // const tableT = useLocale(locale); //使用组件个性化语言


    const { model } = props;
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
    const oper = getVal(props.oper, true);
    const addOper = getVal(props.addOper, true);
    const importOper = getVal(props.importOper, true);
    const deleteOper = getVal(props.deleteOper, true);
    const editAllOper = getVal(props.editAllOper, true);

    let columns = [];
    if (sortable) {
        columns.push({
            title: "排序",
            width: props.sortWidth || 50,
            dataIndex: "sort",
            editable: false,
            className: "drag-visible",
            render: () => <DragHandle />
        })
    }
    if (hasIndex) {
        columns.push({
            title: "序号",
            width: props.indexWidth || 50,
            dataIndex: "index",
            editable: false,
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
    const filteredFields = model.fields.filter((field) => field.isShow !== false);
    columns = columns.concat([...filteredFields]);
    if (oper && (props.rowExtra || deleteOper)) {
        columns.push({
            name: 'oper',
            label: '操作',
            width: props.operWidth || 60,
            render: (col, record, index) => (
                <Button.Group>
                    {props.rowExtra && props.rowExtra(col, record, index, current, pageSize)}
                    { deleteOper && <Button
                        size="mini"
                        icon={<IconDelete />}
                        onClick={() => {
                            handleRemoveRow(index)
                        }}>
                    </Button>}
                </Button.Group>
            )
        })
    }
    function handleSave(row, index) {
        const newData = [...dataRef.current];
        newData.splice((current - 1) * pageSize + index, 1, {
            ...newData[index],
            ...row,
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

    function handleAddRow() {
        let row = new Model();
        if (typeof props.create === 'function') {
            row = props.create();
        }
        if (!Array.isArray(dataRef.current)) {
            setData([row]);
        } else {
            setData(
                dataRef.current.concat(row)
            );
        }
    }
   // 表格粘贴 start --------------------------
   const [colHeadersList, setColHeadersList] = useState([]);//显示列表头
   const [hotTableColumns, setHotTableColumns] = useState([['']]);
   const hotTableRef = useRef();
   function jsonToHotTableText(value) {
       // value = [
       //     {
       //         "ba977fdca596e32f": "A1",
       //         "59e00b844f333380": "A2"
       //     },
       //     {
       //         "ba977fdca596e32f": "B1",
       //         "59e00b844f333380": "B2"
       //     },
       //     {
       //         "ba977fdca596e32f": "C1",
       //         "59e00b844f333380": "C2"
       //     }
       // ]
       let arr = [];
       // console.log('jsonToHotTableText/model/fields', model.fields)
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
       // console.log('jsonToHotTableText', arr)
       setHotTableColumns(arr);

   }
   //点击表格粘贴按钮 弹窗
   function handlePasteData() {
       // 清空数据
       setHotTableColumns([['']]);
       // console.log('handlePasteData', model.fields);
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
       // console.log('handlePasteData', data);
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
       // value = [
       //     ['A1', 'A2'],
       //     ['B1', 'B2'],
       //     ['C1', 'C2']
       // ]
       let arr = [];
       // console.log('hotTableTextToJson/value', value)
       // console.log('hotTableTextToJson/model/fields', model.fields)
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
       // console.log('fieldsNotHidden', fieldsNotHidden);
       value.forEach((item,index) => {
           let obj = {};
           fieldsNotHidden.forEach((field,idx) => {
               obj[field.name] = item[idx]
           });
           arr.push(obj)
       });
       // console.log('hotTableTextToJson',arr)
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
       // console.log('handleSavePasteText', text, hotTableColumns)
       hotTableTextToJson(text);
       setHandsontableVisible(false);
   }

   // textarea
   const [hotTableText, setHotTableText] = useState('');
   const [hotTableTextArr, setHotTableTextArr] = useState([]);
   function hotTableTextChange(value) {
       // console.log('hotTableTextChange', value)
       setHotTableText(value)
       var rows = [];
       value.split('\n').forEach(row => {
           rows.push(row.split('\t'))
       })
       // console.log('hotTableTextChange/rows', rows);
       setHotTableTextArr(rows)
   }
   // 表格粘贴 end --------------------------


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
            const newData = arrayMove([].concat(data), oldIndex, newIndex).filter((el) => !!el);
            setData(newData);
        }
    }

    return (
        <>
            { oper && (addOper || deleteOper || editAllOper ||importOper) ? <div
                className="table-form-header">
                { addOper && <Button
                    size="mini"
                    icon={<IconAdd />}
                    onClick={handleAddRow}
                    style={{
                        marginBottom: '10px'
                    }}>
                </Button>}
                {importOper && (
                        <Tooltip
                            content="Excel导入">
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
                <Button.Group
                    style={{
                        // float: 'right'
                    }}>
                    { props.extra }
                    { editAllOper && <Button
                        size="mini"
                        icon={<IconEdit />}
                        onClick={handleEditData}
                        style={{
                            marginBottom: '10px'
                        }}>
                    </Button>}
                    { deleteOper && <><Button
                        size="mini"
                        icon={<IconDelete />}
                        onClick={handleDeleteRows}
                        style={{
                            marginBottom: '10px'
                        }}>
                    </Button><Button
                        size="mini"
                        icon={<IconBrush />}
                        onClick={handleClearRow}
                        style={{
                            marginBottom: '10px'
                        }}>
                    </Button></>}
                </Button.Group>
            </div> : null}
            <SortableTable
                className="modo-table-form"
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
                        cell: EditableCell
                    }
                }}
                columns={columns.map((column, index) => {
                    return {
                        title: column.label,
                        dataIndex: column.name,
                        width: column.options ? column.options.width : null,
                        ...column,
                        onCell: () => ({
                            onHandleSave: handleSave,
                            rowKey: props.rowKey
                        })
                    };
                })}
                onRow={(record, index) => {
                    return {
                        onHandleSave: handleSave,
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
                    onChange: (selectedRowKeys, selectedRows) => {
                    },
                    onSelect: (selected, record, selectedRows) => {
                        const index = data.indexOf(record);
                        if (selected) {
                            selectedRowKeys.push(index)
                        } else {
                            selectedRowKeys.splice(selectedRowKeys.indexOf(index), 1);
                        }
                        setSelectedRowKeys(selectedRowKeys);
                    }
                }}
                useDragHandle
                onSortEnd={handleSortEnd}
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
                title="Excel导入"
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
                        height="auto"
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
                    width: '60%',
                    cursor: 'move'
                }}
                title='全文编辑'
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
        </>
    );
})


class TableForm extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
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
     mergeAndRemoveDuplicates(arr1, arr2) {
        const set = new Set([...arr1, ...arr2]);
        return Array.from(set);
      }
       findDuplicates(arr) {
        const duplicates = [];
        const uniqueItems = new Set();
    
        for (const item of arr) {
            const itemStr = JSON.stringify(item);
            if (uniqueItems.has(itemStr)) {
                duplicates.push(item);
            } else {
                uniqueItems.add(itemStr);
            }
        }
    
        return duplicates;
    }
    render() {
        let valueNew=[];
        // if(Array.isArray(this.props.value)){
        //     valueNew=this.mergeAndRemoveDuplicates(this.props.value,this.props.initialValue);
        // }else{
        //     valueNew=[];
        // }
        // console.log('valueNew',this)
        // if (this.props?.initialValue) {
        //     if(Array.isArray(this.props.value)){
        //         const set = new Set([...this.props.value,...this.props?.initialValue]);
        //         let data_=Array.from(set);
        //         valueNew=this.findDuplicates(data_);
               
        //     }else{
        //         valueNew=this.props?.initialValue;
        //     }
        //     console.log('valueNew',valueNew);value={valueNew}
        // }
        return (
            <div className={[
                'modo-table-form',
                this.props.className,
                (Array.isArray(valueNew) && valueNew.length > 0) ? '' : 'empty'
            ].join(' ')}>
                <EditableTable
                    ref={this.editableTable}
                    {...this.props} >
                </EditableTable>
            </div>
        );
    }
}

export default TableForm;
