import React, { useState, useEffect, useMemo } from 'react';
import {
    Form,
    Tooltip,
    Typography,
    Checkbox,
    Message,
    Button,
} from '@arco-design/web-react';
import molecule from '@dtinsight/molecule';
import {IconHelp } from 'modo-design/icon';
import widgetMap from '../FormProc/widget';
import ElxDs from './components/elx-ds';
import ElxAutoButton from './components/elx-button';
import ElxDataPreview from './components/elx-data-preview';
import ElxAddDataSourceBtn from './components/elx-add-data-source-btn';
import ElxFieldTable from './components/elx-field-table';
import ElxMapping from './components/pages/elxMapping';
import ElxSelectInput from './components/pages/ElxSelectInput';
import CardForm from './components/pages/cardForm';
require('static/guid');
import { cloneDeep, divide} from 'lodash';
const classNames = require('classnames');
import _ from 'underscore';
import './style/index.less';
import { debounce } from 'lodash';
import axios from 'modo-plugin-common/src/core/src/http';
import { isEnName, validateEnName, validateZhName, isZhName } from 'modo-plugin-common/src/utils/validate';
import modelIcon from '@/pages/flink-sql/images/procTypeIcons/model.svg';
import ModelDesign from '@/pages/model-design';
const base='/_dev-dataos';//_4.3-dataos


const FormItem = Form.Item;

class ModoForm extends React.Component {
    constructor(props: any) {
        super(props);

        this.state = {
            rules: [],
            fields:props.fields||[],
            group:props.group||[],
            sourceCellModelData:{}
        }
        this.Message=Message;
        this.formRef = React.createRef();
        this.cardFormRef = React.createRef();
        this.elxFieldTableRef = React.createRef();
        this.elxFieldTableRefFrom = React.createRef();
        this.doSearchAjax = debounce(this.doSearchAjax, 500);

    }


    getFieldValue(...args) {
        return this.formRef.current.getFieldValue(...args);
    }
    getFieldsValue(...args) {
        return this.formRef.current.getFieldsValue(...args);
    }
    setFieldValue(...args) {
        return this.formRef.current.setFieldValue(...args);
    }
    setFieldsValue(...args) {
        return this.formRef.current.setFieldsValue(...args);
    }
    resetFields(...args) {
        return this.formRef.current.resetFields(...args);
    }
    updateRules = () => {
        const { group }= this.props;
        let group_=[];
        if (Array.isArray(group)) {
            const extractedGroups = group.reduce((result, item) => {
                return result.concat(item.groups);
              }, []);
                this.props.fields.map(field => {
                    if(extractedGroups.indexOf(field.field) < 0){
                        group_.push(field.field);
                    }
                })
        }
        if(group_.length>0){
            group.unshift({
                groupTitle:'',
                groups:group_
            })
        };
         //上一个组件的modelData
        let sourceCellModelData={};
        let cell=this.props?.currentCell;
        if(cell && cell.edges && cell.edges.length>0){//只有成功时
            let edgeCell=cell.edges[0];
            let source=edgeCell.source;
            if(source.modelData && source.modelData !== null && source.modelData !== "{}"){
                sourceCellModelData=JSON.parse(source.getModelData());
            }
        }
        if(this.props &&  Array.isArray(this.props.fields)){
            this.setState({
                rules: this.props.fields.map(field => {
                    if (Array.isArray(field.rules)) {

                        return field.rules.map(rule => {
                            const currentRule = {
                                ...rule
                            };
                            if (rule.validator) {
                                const validator = currentRule.validator;
                                currentRule.validator = (...args) => {
                                    return validator(...args, this.formRef.current,{isEnName, validateEnName, validateZhName, isZhName});
                                }
                            }
                            return currentRule;
                        });
                    } else {
                        return [];
                    }
                }),
                fields: this.props.fields,
                group:group,
                sourceCellModelData,
            })
        }


    }
    beforeRenders=()=>{
        const {
            fields,
            ...formOptions
        } = this.props;
        if(formOptions.beforeRender){
            setTimeout(()=>{
                // const dsName = this.formRef.current.getFieldsValue();
                // console.log('formOptions',dsName,formOptions, this.props);
                const teamName = sessionStorage.getItem('teamName');
                this.Message=Message;
                formOptions.beforeRender(this,fields,teamName,axios,base,);
            },10)


        }else{
            this.setState({
                fields: fields
            })
        }
    }
    // setRelations=(values,fieldsItem)=>{
    //     const propFields = this.props.fields;
    //     let  fields_=[];
    //     let isShowItm=true;
    //     var _relatedValue = values[fieldsItem.field];
    //     if (fieldsItem.relatedItems && fieldsItem.dependVal && (fieldsItem.dependVal.indexOf(_relatedValue) >= 0)) {
    //         if (!fieldsItem.isShow) {
    //             fieldsItem.isShow=true;
    //             return isShowItm=true;
    //         }
    //     }else{
    //         fieldsItem.isShow=false;
    //         return isShowItm = false;
    //     }
    //     return isShowItm;
    // }
    //外部组件会调用
     setRelation=(values)=>{
        const fields  =Array.isArray(this.props.fields)?this.props.fields:[];
        let obj={};
        let  fields_=[];
        let fromItem={};
        fields.forEach(field => {
            fromItem[field.field] = field.initialValue || '';
        });
        let fromItems=Object.assign({},fromItem,this.formRef.current.getFieldsValue(),values);
        var _relatedValue={};
        fields.map(field => {
            let _field={...field};
            // obj[field.field]='';
             _relatedValue = fromItems[field.field];
            if(field.relatedItems){
                 fields_= fields.map((itm,inx)=>{
                    let itm_={...itm};
                    if (field.relatedItems.indexOf(itm.field) >= 0) {
                        if (itm.hasOwnProperty('dependVal') && itm.dependVal && itm.dependVal.indexOf(_relatedValue) >= 0) {
                            if (!itm.isShow) {
                                itm.isShow = true;
                                return itm;
                            }
                            return itm;
                        }else{
                            itm.isShow = false;
                            return itm;
                        }

                    }else{
                        return itm_;
                    }
                })

            }else{
                return _field;
            }
        });
        if(fields_.length > 0){
            this.setState({
                fields: fields_,//fields_
            })
        };
        // this.formRef.current.setFieldsValue(obj);//设置默认值
    }
     //外部组件会调用
    setOptionsData=(field,fieldName)=>{
        const  fields  = [...this.props.fields];
        const uniqueArray = fields.reduce((unique, item) => {
            const existingItem = unique.find(i => i.field === item.field);
            if (!existingItem) {
                if(item.field == fieldName){
                    unique.push({
                        ...field,
                        id:guid(),
                        });
                }else{
                    unique.push({
                        ...item,
                        id:guid(),
                      });
                }

            }
            return unique;
          }, []);
            if(uniqueArray.length > 0){
                this.setState({
                    fields:uniqueArray,
                });
            }
    }
    handleInputSearch = (self,value, option,item) => {
        this.doSearchAjax(self,value, option,item)
    }
    doSearchAjax = (self,value, option,item) => {
        if(typeof item.options.onSearch === 'function'){
            item.options.onSearch(self,value, option,item)
        }
    }
    initialValuesFun=()=>{
        let initialValue={};
        let fields=Array.isArray(this.props.fields)?this.props.fields:[];
        fields.forEach(item => {
                if (item.hasOwnProperty("initialValue")) {
                    initialValue[item.field] = item.initialValue;
                }
          });
        return initialValue;

    }
    onValuesChangeFun=(changeValue,values)=>{
        this.setRelation(values);
        this.props.onValuesChange(changeValue,values);
    }


    //初始加载第一次的时候节点保存有问题
    //它在组件被插入到 DOM 树后立即执行。在这个方法中，通常可以进行一些副作用的操作，例如设置订阅、发起网络请求等
    componentDidMount() {
        this.updateRules();
        this.setRelation();
        this.beforeRenders();//初始加载的时候，侧边栏的时候去请求下拉框的数据
    }
    //它在组件更新后会被立即调用。这个方法允许我们在组件更新时执行一些额外的操作，例如根据新的属性或状态进行网络请求
    componentDidUpdate(prevProps,prevState) {
        if (!_.isEqual(this.props.fields, prevProps.fields) ) {//组件不一样的时候
            this.updateRules();
            this.setRelation();
            this.beforeRenders();
        }else if(!_.isEqual(this.props.modelData, prevProps.modelData)){
            this.beforeRenders();
        }
        if (JSON.stringify(prevProps.fields) == JSON.stringify(prevState.fields)) {
            return true;
        }

    }
    //方法是在组件即将卸载时被调用
    // componentWillUnmount(){

    // }
     //方法不会阻止组件的更新，只是提供了一种机会来执行一些操作。如果需要在更新前执行一些操作
    //  componentWillUpdate(nextProps, nextState, nextContext) {

    // }
    //方法用于判断组件是否应该被更新
    // shouldComponentUpdate(nextProps, nextState) {

    // }
    renderGridFields=(item,index)=>{
        const {
            // fields,
            layout,
            valueList,
            more,
            search,
            getApi,
            currentCell,
            labelCol,
            // onValuesChange,
            layoutGrid,
            apiInfo,
            group,
            // ...formOptions
        } = this.props;
        let  {
            options,
            type,
            relatedItems,
            isShow,
            dependVal,
            // remark,
            // isRemark,
            id,
            ...itemOptions
        } = item;
        const {
            isGroup,
            groupChecked,
            optionsFun,

            ...currentOptions
        } = options;
        // let optionsArr=options.options;
        // let optionsNew={...options,options:optionsArr}
        let isRemark=item.hasOwnProperty('isRemark')?item.isRemark:'';
        let remark=item.hasOwnProperty('remark')?item.remark:'';
        options = currentOptions;
        let itemIsShow=typeof isShow == 'boolean' ? isShow : true;
        let id_=currentCell?currentCell.id:'';



        if(type == 'elxButton' && itemIsShow){
            const param=options.param;
            return <div key={index} className="elx-button-box">
                <ElxAutoButton options={options} item={item} {...this.props} currentCell={currentCell}  thisEvent={this} />
            </div>
        }else if(type == 'elxDataPreview' && itemIsShow){ //elxCollection id+index 有问题，会出现多个
            return <div key={index} className="elx-data-preview"
                style={{
                    right:options?.right?options.right:'20px'
                }}>
                <ElxDataPreview options={options} item={item} {...this.props} currentCell={currentCell}  thisEvent={this} formRef={this.formRef.current} />
            </div>
        }else if(type == 'elxAddDataSourceBtn' && itemIsShow){ //elxCollection
            return <div key={index} className="elx-data-soure"
                style={{
                    right:options?.right?options.right:'20px'
                }}>
                <ElxAddDataSourceBtn options={options} item={item} {...this.props} currentCell={currentCell}  thisEvent={this} formRef={this.formRef.current} />
            </div>
        }else if(type == 'elxDs'){
            const param=options.param;
            return <ElxDs key={index+param.dsCategory} options={options} thisEvent={this} config={this.props} currentCell={currentCell} getApi={getApi} formRef={this.formRef.current} />
            // <div key={index+param.dsCategory} className="elx-ds">
            //     <ElxDs options={options} thisEvent={this} config={this.props} currentCell={currentCell} getApi={getApi} formRef={this.formRef.current} />
            // </div>
        }else if(type == 'searchSelectInput' && itemIsShow){
            let key_=Array.isArray(options.options) && options.options.length>0?options.options.length:guid();
            return <div  key={index}   className="select-input-box select-div">
            <ElxSelectInput  options={options} item={item} {...this.props} currentCell={currentCell}  thisEvent={this} formRef={this.formRef.current} />
        </div>

        } else if(type === 'atuoAddModelBtn' && itemIsShow){
              return (
                <>
                  <div key={index}  className="elx-data-soure"  style={{
                    right:options?.right?options.right:'20px'
                  }}>
           <FormItem>
             <Button
               type="text"
               onClick={() => {
                 molecule.editor.open({
                   id: 'addLogicModel',
                   name: '新建模型',
                   type: 'model',
                   fileType: 'model',
                   icon: modelIcon,
                   renderPane: () => {
                     return <ModelDesign key="addLogicModel"
                                         workspaceId='cb6bd4757a09bd67'
                                         dirId={null}
                                         modelId={null}
                                         useArchAsTag={null}
                                         disable={false}
                                         reloadNodeModelData={null}
                                         modelCfgs={{}}
                                         modelCustomCfgs={[]}
                                         refreshModelCfgs={{}}/>;
                   },
                 });}}>{options.title || '一键建模' }</Button>
           </FormItem>
                  </div>

                </>
              )
        }else {
            const Widget = widgetMap[type];
            if (!Widget) {
                return;
            }
            let labelFlex = null;
            if (this.props.labelCol) {
                labelFlex = this.props.labelCol.flex;
            }
            if (itemOptions.labelCol) {
                labelFlex = itemOptions.labelCol.flex || labelFlex;
            }
            let initialValue_=itemOptions?.initialValue;
            if(type=='TableForm'){
                options.initialValue=initialValue_;
            }
            const formItemClass = classNames('proc-lable', itemOptions.noLabel ? 'no-label':'',item?.isHidden ? 'isHidden' : '');
            let remoteTransferProps_={};
            if(type == 'remoteTransfer'){
                 remoteTransferProps_={...this.props,options,item,thisEvent:this,currentCell,formRef:this.formRef.current}
             }
            if(itemIsShow && !item?.grid){
                return (
                <FormItem
                getValueFromEvent={(e, option) => {
                    if(typeof options.getValueFromEvent === 'function'){
                        return options.getValueFromEvent(this,e);
                    }else{
                        return e;
                    }
                }}
                key={index}
                {...itemOptions}
                labelCol={{
                    flex: labelFlex||'84px'
                }}
                style={{
                    // width: itemOptions.span ? `calc((100% / 24) * ${itemOptions.span})` : null
                }}
                className={formItemClass}
                shouldUpdate
                // className={[{itemOptions.noLabel ? 'no-label': !isShow ? 'hidden-item':'' }]}
                // className={itemOptions.noLabel ? 'no-label' : 'proc-lable'}
                rules={this.state.rules[index]}
                label={(
                    <>
                        <Typography.Text
                            style={{width: '150px'}}
                            className="label"
                            ellipsis={{
                                showTooltip: true
                            }}>
                                {itemOptions.label}
                                {
                                    isRemark? (
                                        <Tooltip position='bottom' trigger='hover' content={<div dangerouslySetInnerHTML={{ __html: remark }}></div>}>

                                            <IconHelp className='help'/>
                                        </Tooltip>
                                    ):''
                                }
                        </Typography.Text>
                        {isGroup ? <FormItem
                            className="group-check"
                            style={{
                                display: 'inline-block',
                                width: '14px',
                                marginRight: '0px',
                                verticalAlign: 'middle',
                                marginBottom: '0px'
                            }}
                            field={`$group.${itemOptions.field}`}
                            triggerPropName="checked"
                            initialValue={groupChecked}>
                            <Checkbox>
                            </Checkbox>
                        </FormItem> : null }
                    </>
                )}>
                  <Widget
                    {...options}
                    {...remoteTransferProps_}
                    thisEvent={this}
                    onSearch={(value, option)=>this.handleInputSearch(this,value, option,item)}
                    visibleChange={()=>{
                        typeof options.visibleChange === 'function' && options.visibleChange(this,value,item,option);
                    }}
                    // onFocus={(e) => {
                    //     // optionsArr=[{label:'d',value:'fd'}];
                    //     typeof optionsNew.onFocus === 'function' && optionsNew.onFocus(this,e,item,optionsNew);
                    // }}
                    onChange={(value, option) => {
                        typeof this.props.changeLabel === 'function' && this.props.changeLabel(item, value, option);
                        typeof options.onChange === 'function' && options.onChange(this,value,item,option);
                    }}>
                </Widget>


            </FormItem>
                )
            }
        }
    }
    cardFormRefClick=()=>{

    }
     renderFields=(item,index)=>{
        const {
            // fields,
            layout,
            valueList,
            more,
            search,
            getApi,
            currentCell,
            labelCol,
            // onValuesChange,
            layoutGrid,
            apiInfo,
            group,
            // ...formOptions
        } = this.props;
        let  {
            options,
            type,
            relatedItems,
            isShow,
            dependVal,
            // remark,
            // isRemark,
            id,
            ...itemOptions
        } = item;
        const {
            isGroup,
            groupChecked,
            optionsFun,

            ...currentOptions
        } = options;
        // let isGroup_=options?.isGroup;
        let isRemark=item.hasOwnProperty('isRemark')?item.isRemark:'';
        let remark=item.hasOwnProperty('remark')?item.remark:'';
        options = currentOptions;
        let id_=currentCell?currentCell.id:'';
        let itemIsShow=typeof isShow == 'boolean' ? isShow : true;
        if(type == 'elxFieldTable'){
                if(itemIsShow == false){
                    this.elxFieldTableRef.current=null;
                }
            return (itemIsShow && <div key={id} className="elx-field-list">
                <ElxFieldTable  isShow={itemIsShow} elxFieldTableRef={this.elxFieldTableRef}  elxFieldTableRefFrom={this.elxFieldTableRefFrom} options={options} item={item} thisEvent={this} config={this.props} currentCell={currentCell} formRef={this.formRef.current} />
            </div>)
        }else if(type == 'elxMapping' && itemIsShow){
            return <div key={id} className="elx-mapping">
                <ElxMapping options={options} item={item} thisEvent={this} config={this.props} currentCell={currentCell} formRef={this.formRef.current} />
            </div>
        }else if(type == 'cardForm' && itemIsShow){
            let key_=Array.isArray(options.options) && options.options.length>0?options.options.length:guid();
            return <div  key={index}   className="card-form-box">
                <CardForm  ref={this.cardFormRef}  options={options} item={item} {...this.props} currentCell={currentCell}  thisEvent={this} formRef={this.formRef.current} />
        </div>
        } else {
            const Widget = widgetMap[type];
            if (!Widget) {
                return;
            }
            let labelFlex = null;
            if (this.props.labelCol) {
                labelFlex = this.props.labelCol.flex;
            }
            if (itemOptions.labelCol) {
                labelFlex = itemOptions.labelCol.flex || labelFlex;
            }
            let initialValue_=itemOptions?.initialValue;
            if(type=='TableForm'){
                options.initialValue=initialValue_;
            }
            const formItemClass = classNames('proc-lable',itemOptions.noLabel?'no-label':'');
            let remoteTransferProps_={};
            if(type == 'remoteTransfer'){
                 remoteTransferProps_={...this.props,options,item,thisEvent:this,currentCell,formRef:this.formRef.current}
             }
            if(itemIsShow && item?.grid){
                return (
                <FormItem
                getValueFromEvent={(e, option) => {
                    if(typeof options.getValueFromEvent === 'function'){
                        return options.getValueFromEvent(this,e);
                    }else{
                        return e;
                    }
                }}
                key={index}
                {...itemOptions}
                labelCol={{
                    flex: labelFlex||'84px'
                }}
                style={{
                    // width: itemOptions.span ? `calc((100% / 24) * ${itemOptions.span})` : null
                }}
                className={classNames(formItemClass, item.field, item.type)}
                shouldUpdate
                rules={this.state.rules[index]}
                label={(
                    <>
                        <Typography.Text
                            style={{width: '150px'}}
                            className="label"
                            ellipsis={{
                                showTooltip: true
                            }}>
                                {itemOptions.label}
                                {
                                    isRemark? (
                                        <Tooltip position='bottom' trigger='hover' content={<div dangerouslySetInnerHTML={{ __html: remark }}></div>}>

                                            <IconHelp className='help'/>
                                        </Tooltip>
                                    ):''
                                }
                        </Typography.Text>
                        {isGroup ? <FormItem
                            className="group-check"
                            style={{
                                display: 'inline-block',
                                width: '14px',
                                marginRight: '0px',
                                verticalAlign: 'middle',
                                marginBottom: '0px'
                            }}
                            field={`$group.${itemOptions.field}`}
                            triggerPropName="checked"
                            initialValue={groupChecked}>
                            <Checkbox>
                            </Checkbox>
                        </FormItem> : null }
                    </>
                )}>
               <Widget
                    {...options}
                    thisEvent={this}
                     {...remoteTransferProps_}
                    onSearch={(value, option)=>this.handleInputSearch(this,value, option,item)}
                    visibleChange={()=>{
                        typeof options.visibleChange === 'function' && options.visibleChange(this,value,item,option);
                    }}
                    // onFocus={(e) => {
                    //     // optionsArr=[{label:'d',value:'fd'}];
                    //     typeof optionsNew.onFocus === 'function' && optionsNew.onFocus(this,e,item,optionsNew);
                    // }}
                    onChange={(value, option) => {
                        typeof this.props.changeLabel === 'function' && this.props.changeLabel(item, value, option);
                        typeof options.onChange === 'function' && options.onChange(this,value,item,option);
                    }}>
                </Widget>


            </FormItem>
                )
            }
        }

    }

    render() {
        const {
            // fields,
            layout,
            valueList,
            more,
            search,
            getApi,
            currentCell,
            labelCol,
            onValuesChange,
            layoutGrid,
            apiInfo,
            group,
            // ...formOptions
        } = this.props;
        let fields=Array.isArray(this.state.fields)?this.state.fields:[];
        let fieldsNew=Array.isArray(this.state.fieldsNew)?this.state.fieldsNew:{};
         return (
            <Form
                ref={this.formRef}
                layout={layout}
                onValuesChange={this.onValuesChangeFun}
                // {...formOptions}
                >
                    {group && Array.isArray(group) && group.length > 0 ?
                        group.map((group_,groupIndex )=>{
                                    return <>
                                        <div key={groupIndex} className='group-item form-item'>
                                            {group_.groupTitle != ''? <div className='form-item-title'>
                                                <span className='space'></span>
                                                <span className='title'> {group_.groupTitle}</span>
                                             </div>:''
                                            }
                                            <>
                                                <div className={layoutGrid?'grid-two group':''}>
                                                    {fields.map((item, index) => {
                                                         if (group_.groups.indexOf(item.field) >= 0) {
                                                            return this.renderGridFields(item,index);
                                                         }
                                                    })}
                                                </div>
                                                <div className={layoutGrid?'grid-one':''}>
                                                    {fields.map((item, index) => {
                                                          if (group_.groups.indexOf(item.field) >= 0) {
                                                            return this.renderFields(item,index);
                                                          }
                                                    })}
                                                </div>
                                            </>
                                            </div>
                                        </>
                         })
                   : <div className='form-item single' >
                            <div className={layoutGrid?'grid-two':''}>
                                {fields.map((item, index) => {
                                        return this.renderGridFields(item,index);
                                })}
                            </div>
                            <div className={classNames(layoutGrid?'grid-one':'', fields.map(field => {return field.field}).join(' '))}>
                                {fields.map((item, index) => {
                                        return this.renderFields(item,index);
                                })}
                            </div>
                            </div>
               }

            </Form>
        )
    }
}


export default ModoForm;
