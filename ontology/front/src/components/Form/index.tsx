import React, { useState, useEffect, useMemo } from 'react';
import {
    Form,
    Typography,
    Checkbox, Button, Message, Tooltip
} from '@arco-design/web-react';
import widgetMap from '../Form/widget';
import isNull from 'packages/modo-view/core/src/utils/isNull';
import cs from '@arco-design/web-react/es/_util/classNames';
import './style/index.less';
import {IconDown, IconUp} from "@arco-design/web-react/icon";
import axios from "modo-plugin-common/src/core/src/http/index";
import ElxSelectInput from "@/components/FormProc/components/pages/ElxSelectInput";
import {IconHelp} from "modo-design/icon";

require('static/guid');

const FormItem = Form.Item;

class ModoForm extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            rules: [],
            defaultValue: {},
            isMoreConfigShow:false
        }
        this.formRef = React.createRef();
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
            })
        })
    }
    setFieldsDefaultValue = (init, prevProps) => {
        let defaultValue = this.formRef.current.getFieldsValue();
        let change = false;
        this.props.fields.forEach(field => {
            if (field.field && field.options && !isNull(field.options.defaultValue)) {
                if (init) {
                    defaultValue[field.field] = field.options.defaultValue;
                    change = true
                } else {
                    const prevField = prevProps.fields.find(f => {
                        return f.id === field.id
                    });
                    if (prevField) {
                        if (field.options.defaultValue !== prevField.options.defaultValue) {
                            defaultValue[field.field] = field.options.defaultValue;
                            change = true
                        }
                    }
                }

            }
        });
        if (change && !_.isEqual(defaultValue, this.state.defaultValue)) {
            this.setState({
                defaultValue
            });
            this.formRef.current.setFieldsValue({
                ...defaultValue
            });
            if (!init) {
                setTimeout(() => {
                    typeof this.props.defaultValueChange === 'function' && this.props.defaultValueChange(defaultValue);
                });
            }
        }
    }
    componentDidUpdate(prevProps,prevState) {
        if (!_.isEqual(this.props.fields, prevProps.fields)) {
            this.updateRules();
            this.setFieldsDefaultValue(false, prevProps);
            this.setRelation();
            this.beforeRenders();
        }else if(!_.isEqual(this.props.modelData, prevProps.modelData)){
            this.beforeRenders();
        }

        if (JSON.stringify(prevProps.fields) == JSON.stringify(prevState.fields)) {
            return true;
        }
    }
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
    beforeRenders=()=>{
        const {
            fields,
            ...formOptions
        } = this.props;
        if(formOptions.beforeRender){
            const teamName = sessionStorage.getItem('teamName');
            this.Message=Message;
            formOptions.beforeRender(this,fields,teamName,axios);

        }else{
            this.setState({
                fields: fields
            })
        }
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
    componentDidMount() {
        this.updateRules();
        this.setRelation();
        // this.beforeRenders();
        setTimeout(()=>{
            this.beforeRenders();
        },10)
        this.setFieldsDefaultValue(true);
    }

    onValuesChangeFun=(changeValue,values)=>{

        this.setRelation(values);
        const viewFields = [];
        this.props.fields.forEach(item=>{
          let itemIsShow=typeof item.isShow == 'boolean' ? item.isShow : true;
          if(itemIsShow&&!item.relatedItems) {
            viewFields.push(item.field);
          }
        });
        const result = {};
        for(var k in values) {
          if(viewFields.indexOf(k)>-1) {
            result[k] = values[k];
          }
        }
        this.props.onValuesChange(changeValue,result);
    };
    render() {
        const {
            fields,
            valueList,
            more,
            search,
            ...formOptions
        } = this.props;

        const { isMoreConfigShow }=this.state;

        const triggerPropNameMap = {
            switch: 'checked',
            upload: 'fileList'
        }
        //将fields中的每个field根据其isAdvancedConfig值（是否为高级属性），区分普通配置和高级配置
        const normalFields:any = []; //普通配置
        const advancedFields:any=[]; //高级配置
        fields.forEach(item=>{
            if(item.isAdvancedConfig){
                advancedFields.push(item);
            }else{
                normalFields.push(item)
            }
        })
        const labelEllipsis:any={};
        if(formOptions.layout!='vertical'){
            labelEllipsis.ellipsis={showTooltip: true}
        }

        return (
            <Form
                ref={this.formRef}
                {...formOptions}
                onValuesChange={this.onValuesChangeFun}>
                {normalFields.map((item, index) => {
                    let  {
                        options,
                        type,
                      isShow,
                        ...itemOptions
                    } = item;
                    options=options?options:{};
                  let itemIsShow=typeof isShow == 'boolean' ? isShow : true;
                    if(type == 'searchSelectInput' && itemIsShow){
                        let key_=Array.isArray(options.options) && options.options.length>0?options.options.length:guid();

                        return <div  key={key_}   className="select-input-box select-div">
                            <ElxSelectInput  options={options} item={item} {...this.props}   thisEvent={this} formRef={this.formRef.current} />
                        </div>
                    }
                    let Widget = widgetMap[type];

                    if (type === 'datePicker') {
                        if (options.mode) {
                            Widget = widgetMap[options.mode];
                        }
                    }

                    if (!Widget) {
                        if(!(item.label==='_'&&normalFields[index+1]&&!normalFields[index+1].itemIsShow)){
                          return <span
                            className="placeholder-label"
                            key={index}>
                            {item.label}
                        </span>
                        }else{
                          return;
                        }
                    }

                    const {
                        isGroup,
                        groupChecked,
                        ...currentOptions
                    } = options;
                    options = currentOptions;
                    let isRemark=item.isRemark||!!item.remark||'';
                    let remark=item.remark||'';

                    let labelFlex = undefined;
                    if (formOptions.labelCol) {
                        labelFlex = formOptions.labelCol.flex;
                    }
                    if (itemOptions.labelCol) {
                        labelFlex = itemOptions.labelCol.flex || labelFlex;
                    }
                    if(itemIsShow){
                      return (
                        <FormItem
                          key={index}
                          {...itemOptions}
                          labelCol={{
                            flex: labelFlex || '84px'
                          }}
                          style={{
                            // width: itemOptions.span ? `calc((100% / 24) * ${itemOptions.span})` : null
                          }}
                          className={
                            cs(
                              options.className,
                              {
                                ['no-label']: itemOptions.noLabel
                              }
                            )
                          }
                          rules={this.state.rules[index]}
                          triggerPropName={triggerPropNameMap[type] || 'value'}
                          label={(
                            <>
                              <Typography.Text
                                className="label"
                                {...labelEllipsis}>
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
                            changeLabel={this.props.changeLabel}
                            onChange={(value, option, arg3) => {
                              typeof this.props.changeLabel === 'function' && this.props.changeLabel(item, value, option);
                              typeof options.onChange === 'function' && options.onChange(this, value, option, arg3);
                            }}>
                          </Widget>
                        </FormItem>
                      )
                    }
                })}

                {advancedFields.map((item, index) => {
                    let  {
                        options,
                        type,
                      isShow,
                        ...itemOptions
                    } = item;
                    options=options?options:{};
                  let itemIsShow=typeof isShow == 'boolean' ? isShow : true;
                    if(type == 'searchSelectInput' && isShow){
                        let key_=Array.isArray(options.options) && options.options.length>0?options.options.length:guid();
                        return <div  key={index}   className="select-input-box select-div">
                            <ElxSelectInput  options={options} item={item} {...this.props}   thisEvent={this} formRef={this.formRef.current} />
                        </div>
                    }
                    let Widget = widgetMap[type];

                    if (type === 'datePicker') {
                        if (options.mode) {
                            Widget = widgetMap[options.mode];
                        }
                    }

                    if (!Widget) {
                        return <span
                          className="placeholder-label"
                          key={index}>
                            {item.label}
                        </span>
                    }

                    const {
                        isGroup,
                        groupChecked,
                        ...currentOptions
                    } = options;
                    options = currentOptions;
                    let isRemark=item.isRemark||!!item.remark||'';
                    let remark=item.remark||'';
                    let labelFlex = undefined;
                    if (formOptions.labelCol) {
                        labelFlex = formOptions.labelCol.flex;
                    }
                    if (itemOptions.labelCol) {
                        labelFlex = itemOptions.labelCol.flex || labelFlex;
                    }
                  if (itemIsShow) {
                    return (
                      <FormItem
                        key={index}
                        {...itemOptions}
                        labelCol={{
                          flex: labelFlex || '84px'
                        }}
                        style={{
                          display: isMoreConfigShow ? 'block' : 'none'
                          // width: itemOptions.span ? `calc((100% / 24) * ${itemOptions.span})` : null
                        }}
                        className={
                          cs(
                            options.className,
                            {
                              ['no-label']: itemOptions.noLabel
                            }
                          )
                        }
                        rules={this.state.rules[index]}
                        triggerPropName={triggerPropNameMap[type] || 'value'}
                        label={(
                          <>
                            <Typography.Text
                              className="label"
                              {...labelEllipsis}>
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
                            </FormItem> : null}
                          </>
                        )}>
                        <Widget
                          {...options}
                          changeLabel={this.props.changeLabel}
                          onChange={(value, option, arg3) => {
                            typeof this.props.changeLabel === 'function' && this.props.changeLabel(item, value, option);
                            typeof options.onChange === 'function' && options.onChange(this, value, option, arg3);
                          }}>
                        </Widget>
                      </FormItem>
                    )
                  }

                })}
                {advancedFields.length>0?
                  <div className='advanced-config-container'>
                      <div className='split'></div>
                      <Button type='text' className='more-config-btn' onClick={()=>{this.setState({isMoreConfigShow:!isMoreConfigShow})}}>
                          {isMoreConfigShow?<span>收起更多 <IconUp /></span>:<span>更多配置 <IconDown /></span>}
                      </Button>
                  </div>:''}
            </Form>
        )
    }
}

export default ModoForm;
