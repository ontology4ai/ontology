import React, { useState, useEffect, useMemo } from 'react';
import { Select,Input,Button,Form,Grid} from "@arco-design/web-react";
import { IconEdit } from '@arco-design/web-react/icon';
import { IconBack} from 'modo-design/icon';
import * as iconMap from 'modo-design/icon';
import ElxDataPreview from '../../elx-data-preview';
import './style/index.less';
import { debounce } from 'lodash';

const widgetMap = {
    'elxDataPreview': ElxDataPreview
}

const Option = Select.Option;
// const FormItem = Form.Item;
class ElxSelectInput extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            isSelect:this.props.options.defaultSelect,
            inputVal:'',
            blurInputVal:'',
            optionsNew:[],
            inputBlurChange:false,
        };
        this.doSearchAjax = debounce(this.doSearchAjax, 500);
    }
    handleInputSearch = e => {
        this.doSearchAjax(e)
    }
    doSearchAjax = value => {
        if(typeof this.props.options.onSearch === 'function'){
            this.props.options.onSearch(this.props.thisEvent,this,value,this.props.item);
        }
    }
    onInputChange = (val) => {
        let field = this.props.item.field;
        let obj = {};
        obj[field] = val;
        this.setState({
            inputVal: val,
            blurInputVal: val
        });
        this.props.formRef ? this.props.formRef.setFieldsValue(obj) : '';
        if (this.state.isSelect) {
            if (typeof this.props.options.onChange === 'function') {
                this.props.options.onChange(
                    this.props.thisEvent,
                    val,
                    this.props.item,
                    this.props.option
                )
            }
        }
    }
    onBlurInputChange=(val)=>{
        this.setState({
            blurInputVal:val,
        });
    }
    chageType = () => {
        let field = this.props.item.field;
        let value = this.props.formRef ? this.props.formRef.getFieldValue(field) : '';
        this.setState({
            isSelect: !this.state.isSelect,
            inputVal: value,
            blurInputVal: value
        });
    }
    initFun =()=>{
        let { options } = this.props;
        let value = this.props.formRef ? this.props.formRef.getFieldValue(this.props.item.field) : '';
        this.setState({
            isSelect: options.defaultSelect,
            inputVal: value,
            optionsNew: options.options,
            inputBlurChange: this.props.options?.inputBlurChange||false,
            blurInputVal: value
        });
    }
    componentDidMount() {
        this.initFun()
    }
    componentDidUpdate(prevProps,prevState) {
        if (JSON.stringify(this.props.options) !== JSON.stringify(prevProps.options)) {
            let value= this.props.formRef ? this.props.formRef.getFieldValue(this.props.item.field) : '';
            this.setState({
                    optionsNew: this.props.options.options,
                    inputVal: value,
                    isSelect: true,
                    blurInputVal: value
                });
        }
        if (JSON.stringify(prevProps.options) == JSON.stringify(prevState.options)) {
            return true;
        }
    }
    update = () => {
        // this.forceUpdate();
    }
    render() {
        const {
            isSelect,
            // inputVal,
            inputBlurChange,
            optionsNew
        } = this.state;
        const {
            item
        } = this.props;
        const { field,label }=this.props.item;
        //可以不要inputVal了
        let value= this.props.formRef?this.props.formRef.getFieldValue(this.props.item.field):'';

        const LabelSuffixWidget = widgetMap[item.labelSuffixWidget];
        return (
            <Form.Item 
                label={(
                    <>
                        {label}
                        {item.labelSuffixVisible && LabelSuffixWidget && (
                            <span style={{float: 'right'}}>
                                {<LabelSuffixWidget {...this.props} options={this.props.item.labelSuffixOptions} item={{...item, label: ''}}/>}
                            </span>
                        )}
                    </>
                )}
                field={field}>
                <div className='modo-select-input'>
                    <div className='modo-select-input-box'>
                        { !isSelect && (
                            <div  className="search-item">
                                {inputBlurChange ? (
                                    <Input
                                        // value={inputVal}
                                        value={this.state.blurInputVal}
                                        onBlur={(e) => {
                                            this.onInputChange(e.target.value)
                                        }}
                                        onChange={(value) => {
                                            this.onBlurInputChange(value)
                                        }}/>
                                    ) : (
                                        <Input
                                            // value={inputVal}
                                            value={value}
                                            onChange={(value) => {
                                                this.onInputChange(value)
                                            }}
                                            allowClear/>
                                    )
                                }
                            </div>
                        )}
                        {isSelect && (
                            <div  className="search-item">
                                <Select
                                    {...this.props.options}
                                    allowClear
                                    value={value}
                                    // value={inputVal}
                                    options={optionsNew}
                                    onChange={(value)=>{this.onInputChange(value)}}
                                    className = 'select'
                                    onSearch={(value)=>this.handleInputSearch(value)}
                                    >
                                </Select>
                            </div>
                        )}
                    </div>
                    <Button
                        type='secondary'
                        icon={ isSelect ? <IconEdit /> : <IconBack /> }
                        onClick={() => this.chageType() }/>
                </div>
             </Form.Item>
        );
    }
}

export default ElxSelectInput;
