import React, { useState, useEffect, useMemo } from 'react';
import {
    Form,
    Tooltip,
    Typography,
    Checkbox
} from '@arco-design/web-react';

import { IconHelp } from 'modo-design/icon';
import widgetMap from '../FormProc/widget';
import ElxDs from './components/elx-ds';
import ElxAutoButton from './components/elx-button';
import ElxDataPreview from './components/elx-data-preview';
import ElxFieldTable from './components/elx-field-table';
import ElxMapping from './components/pages/elxMapping';
import ElxFormGroup from './components/elx-form-group';
require('static/guid');
import { cloneDeep, divide } from 'lodash';
const classNames = require('classnames');
import _ from 'underscore';
import './style/index.less';
import axios from 'modo-plugin-common/src/core/src/http';
const base='/_dev-dataos';//_4.3-dataos


const FormItem = Form.Item;

class ModoForm extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            rules: [],
            fields:props.fields||[],
            group:props.group||[],
            values:{}
        }
        this.formRef = React.createRef();
        this.elxFieldTableRef = React.createRef();
        

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
        if(this.props&&this.props.fields.length >0){
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
                                    return validator(...args, this.formRef.current);
                                }
                            }
                            return currentRule;
                        });
                    } else {
                        return [];
                    }
                }),
                fields: this.props.fields,
                group:group
            })
        }
    }
    beforeRenders=()=>{
        const {
            fields,
            ...formOptions
        } = this.props;
        console.log('--form-beforeRenders', formOptions);
        if(formOptions.beforeRender){
            // debugger;
            const teamName = sessionStorage.getItem('teamName');

            formOptions.beforeRender(this,fields,teamName,axios,base);
         
        }else{
            this.setState({
                fields: fields
            })
        }
    }
    afterRenders=()=>{
        const {
            fields,
            ...formOptions
        } = this.props;
        if(formOptions.afterRenders){
            // debugger;
            const teamName = sessionStorage.getItem('teamName');
            formOptions.afterRenders(this,fields,teamName,axios,base);
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
        const  fields  = this.props.fields;
        let  fields_=[];
        fields.map(field => {
            let _field={...field};
            const fromItems=this.formRef.current.getFieldsValue()||values;
            var _relatedValue = fromItems[field.field];
            if(field.relatedItems){
                 fields_= fields.map((itm,inx)=>{
                    let itm_={...itm};
                    if (field.relatedItems.indexOf(itm.field) >= 0) {
                        if (itm.dependVal && itm.dependVal.indexOf(_relatedValue) >= 0) {
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


        })
        if(fields_.length > 0){
            this.setState({
                fields: fields_
            })
        }
    }
    setValues=(values)=>{
        this.setState({values: values});
    }
    setTableFields=(field,fieldName)=>{
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
        console.log('接口回来后-更新后的数据' ,uniqueArray,field,fields);
        if(uniqueArray.length > 0){
            this.setState({
                fields:uniqueArray
            })
        }
    }
    setStepVars=(vars)=>{
        this.setFieldValue({stepVars: [...vars]});
    }
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
        console.log('接口回来后-更新后的数据' ,uniqueArray,field,fields);
        if(uniqueArray.length > 0){
            this.setState({
                fields:uniqueArray
            })
        }
    }
    // setOptionsData=(field,fieldName, parentFieldName)=>{
    //     console.log('field', fieldName);
    //     const  fields  = [...this.props.fields];
    //     const uniqueArray = fields.reduce((unique, item) => {
    //         const existingItem = unique.find(i => i.field === item.field);
    //         if (!existingItem) {
    //             if(parentFieldName) {
    //                 if(item.field == fieldName){

    //                     unique.push({
    //                         ...field,
    //                         id:guid(),
    //                       }); 
    //                 }else{
    //                     unique.push({
    //                         ...item,
    //                         id:guid(),
    //                       }); 
    //                 }
    //             } else {
    //                 if(item.field == fieldName){

    //                     unique.push({
    //                         ...field,
    //                         id:guid(),
    //                       }); 
    //                 }else{
    //                     unique.push({
    //                         ...item,
    //                         id:guid(),
    //                       }); 
    //                 }
    //             }
    //         }
    //         return unique;
    //       }, []);
    //     console.log('接口回来后-更新后的数据' ,uniqueArray,field,fields);
    //     if(uniqueArray.length > 0){
    //         this.setState({
    //             fields:uniqueArray
    //         })
    //     }
    // }
    elxFieldTableChange(val, _val) {
        this.setFieldsValue(val);
        this.elxFieldTableRef = _val;
    }
    componentDidUpdate(prevProps,prevState) {
        if (JSON.stringify(this.props.fields) !== JSON.stringify(prevProps.fields)) {
            this.updateRules();
            this.beforeRenders();
        }
        if (JSON.stringify(prevProps.fields) == JSON.stringify(prevState.fields)) {
            return true;
        }
    }
    componentDidMount() {
        this.updateRules();
        this.beforeRenders();
    }
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
            onValuesChange,
            layoutGrid,
            apiInfo,
            identity,
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
        let isRemark=item.isRemark||'';
        let remark=item.remark||'';
        options = currentOptions;
        let itemIsShow=typeof isShow == 'boolean' ? isShow : true;
        if(type == 'elxButton' && itemIsShow){
            const param=options.param;
            return <div key={index} className="elx-button-box">
                <ElxAutoButton options={options} item={item} {...this.props} currentCell={currentCell}  thisEvent={this} />
            </div>
        }else if(type == 'elxDataPreview' && itemIsShow){//elxCollection
            return <div key={id} className="elx-data-preview">
                <ElxDataPreview options={options} item={item} {...this.props} currentCell={currentCell}  thisEvent={this} formRef={this.formRef.current} />
            </div>
        }else if(type == 'elxDs'){
            const param=options.param;
            return <div key={index} className="elx-ds">
                <ElxDs options={options} thisEvent={this} config={this.props} currentCell={currentCell} getApi={getApi} formRef={this.formRef.current} />
            </div>
        } else if(type == 'elxFormGroup') {
            const param=options.param;
            return <div key={index} className="elx-form-group">
                <ElxFormGroup options={options} item={item} {...this.props} currentCell={currentCell}  thisEvent={this} formRef={this.formRef.current} />
            </div>
        }else{
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
            const formItemClass = classNames('proc-lable',itemOptions.noLabel?'no-label':'')
            if(itemIsShow){
                return (
                <FormItem
                key={id}
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
                                        <Tooltip position='bottom' trigger='hover' content={remark}>
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
                    key={index}
                    // changeLabel={this.props.changeLabel}
                    onSearch={(value, option) => {
                        typeof options.onSearch === 'function' && options.onSearch(this,value,item,option);
                    }}
                    visibleChange={()=>{
                        typeof options.visibleChange === 'function' && options.visibleChange(this,value,item,option);
                    }}
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
            onValuesChange,
            layoutGrid,
            apiInfo,
            identity,
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
        let isRemark=item.isRemark||'';
        let remark=item.remark||'';
        options = currentOptions;
        let itemIsShow=typeof isShow == 'boolean' ? isShow : true;
        if(type == 'elxFieldTable' && itemIsShow){
            return <div key={id} className="elx-field-list">
                <ElxFieldTable   elxFieldTableRef={this.elxFieldTableRef} setStepVars={(val)=>{setStepVars(val)}} tableFormChange={(val, _val)=>{this.elxFieldTableChange(val, _val)}}  options={options} item={item} thisEvent={this} config={this.props} currentCell={currentCell} formRef={this.formRef.current} />
            </div>
        }else if(type == 'elxMapping' && itemIsShow){
            return <div key={id} className="elx-mapping">
                <ElxMapping options={options} item={item} thisEvent={this} config={this.props} currentCell={currentCell} formRef={this.formRef.current} />
            </div>
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
            identity,
            group,
            // ...formOptions
        } = this.props;
        let group_=group||[];
        let fields=this.state.fields;
        return (
            <Form
                key={currentCell ? currentCell.id : null}
                className='form-stream-proc'
                ref={this.formRef}
                layout={layout}
                onValuesChange={onValuesChange}
                // {...formOptions}
                >
                    {group && group.length > 0 ?
                        group.map((group_,groupIndex )=>{
                                    return <>
                                        <div key={groupIndex} className='group-item form-item'>
                                            {group_.groupTitle != ''? <div className='form-item-title'>
                                                <span className='space'></span>
                                                <span className='title'> {group_.groupTitle}</span>
                                             </div>:''
                                            }
                                            <>
                                                <div className={layoutGrid?'grid-two':''}>
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
                    
                   : <div className='form-item '>
                            <div className={layoutGrid?'grid-two':''}>
                                {fields.map((item, index) => {
                                        return this.renderGridFields(item,index);
                                })}
                            </div>
                            <div className={layoutGrid?'grid-one':''}>
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
