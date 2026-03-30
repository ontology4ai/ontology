import React, { useState, useEffect, useMemo } from 'react';
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
    Button as button
} from '@arco-design/web-react';
import './style/index.less';

const FormItem = Form.Item;

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
    button
};

class ModoForm extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            rules: []
        };
        this.formRef = React.createRef();
    }
    getFieldValue(...args) {
        this.formRef.current.getFieldValue(...args);
    }
    getFieldsValue(...args) {
        this.formRef.current.getFieldsValue(...args);
    }
    setFieldValue(...args) {
        this.formRef.current.setFieldValue(...args);
    }
    setFieldsValue(...args) {
        this.formRef.current.setFieldsValue(...args);
    }
    resetFields(...args) {
        this.formRef.current.resetFields(...args);
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
    };
    componentDidUpdate(prevProps) {
        if (!_.isEqual(this.props.fields, prevProps.fields)) {
            this.updateRules();
        }
    }
    componentDidMount() {
        this.updateRules();
    }
    render() {
        const {
            fields,
            valueList,
            more,
            ...formOptions
        } = this.props;
        return (
            <Form
                ref={this.formRef}
                {...formOptions}>
                {fields.map((item, index) => {
                    const  {
                        options,
                        type,
                        ...itemOptions
                    } = item;
                    const Widget = ItemMap[type];
                    if (!Widget) {
                        return <span
                            key={index}>
                        </span>
                    }

                    return (
                        <FormItem
                            key={index}
                            {...itemOptions}
                            rules={this.state.rules[index]}>
                            <Widget
                                {...options}>
                            </Widget>
                        </FormItem>
                    )
                })}
            </Form>
        )
    }
}

export default ModoForm;
