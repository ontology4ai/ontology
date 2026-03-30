import React, { useState, useEffect, useMemo } from 'react';
import { Grid, Button, Typography, Tooltip } from '@arco-design/web-react';
import { Tag } from 'modo-design';
import { IconFilterColor, IconBrushColor} from 'modo-design/icon';
import { findDOMNode } from 'react-dom';
import { on, off, contains } from '@arco-design/web-react/es/_util/dom';
import Form from '../Form';
import getFlatValues from 'packages/modo-view/core/src/utils/getFlatValues';
import useClassLocale from 'modo-plugin-common/src/utils/useClassLocale';
import { GlobalContext } from 'modo-plugin-common/src/utils/context';
import locale from './locale';
import './style/index.less';

const Row = Grid.Row;
const Col = Grid.Col;

class FilterForm extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            valueList: [],
            more: false,
            values: {}
        };
        this.values = {};
        this.valueList = [];
        this.valueLabelMap = {};
        this.formRef = React.createRef();
        this.triggerRef = React.createRef();
    }
    handleValuesChange = (changeValue, values) => {
        Object.keys(values).forEach(key=>{
          if(values[key]==''){
            delete values[key]
          }
        })
        this.setValueList(values);
        this.setState({
            values
        });
        this.values = values;
        const {
            onValuesChange
        } = this.props;
        setTimeout(() => {
            typeof onValuesChange === 'function' && onValuesChange(changeValue, values);
        }, 0);
    }
    getFieldsValue = () => {
        return this.values;
    }
    setFieldsValue = (values) => {
        this.formRef.current.setFieldsValue(values);
    }
    getFiltersValue = () => {
        const typeMap = {}
        this.props.fields.forEach(item => {
            typeMap[item.field] = item;
        })

        const form = this.formRef.current;
        let values = this.values;
        values = JSON.parse(JSON.stringify(values));
        delete values.$group;
        const currentValues = {};

        for (let key in values) {
            if (values[key] !== undefined && values[key] !== null) {
                if (typeMap[key].type === 'input' || typeMap[key].options.like) {
                    if (values[key] !== '') {
                        currentValues[key] = `~%${values[key]}%`;
                    }
                } else {
                    currentValues[key] = values[key];
                }
            }
        }
        return currentValues;
    }
    getReportFiltersValue = () => {
        const form = this.formRef.current;
        let values = this.values;
        let formValues = form.getFieldsValue();
        const groupPieces = [];
        for (let key in formValues.$group) {
            if (formValues.$group[key]) {
                groupPieces.push(key);
            }
        }
        let reportValue = this.getFiltersValue();
        if (groupPieces.length > 0) {
            reportValue.groupPiece = groupPieces.join(',');
        }
        delete reportValue[undefined];
        for (let key in reportValue) {
            if (Array.isArray(reportValue[key])) {
                const currentField = this.props.fields.find(field => {
                    return field.field === key
                });
                if (currentField && currentField.type === 'rangePicker') {
                    reportValue[`${key}.gte`] = reportValue[key][0];
                    reportValue[`${key}.lte`] = reportValue[key][1];
                    delete reportValue[key];
                } else {
                    reportValue[key] = reportValue[key].join(',');
                }
            }
        }
        return {
            ...reportValue
        };
    }
    getValueKey = (item) => {
        let valueKey = 'value';
        if (item.options.fieldNames && item.options.fieldNames.value) {
            valueKey = item.options.fieldNames.value;
        }
        return valueKey;
    }
    getLabelKey = (item) => {
        let labelKey = 'label';
        if (item.options.fieldNames && item.options.fieldNames.label) {
            labelKey = item.options.fieldNames.label;
        }
        return labelKey;
    }
    getCascaderValueLabel = (item, value) => {
        const valueKey = this.getValueKey(item);
        const labelKey = this.getLabelKey(item);

        const getValueLabel = (options, val) => {
            let valueLabel = val;
            const currentOption = options ? options.find(option => {
                return option[valueKey] === val;
            }) : null;
            if (currentOption) {
                valueLabel = currentOption[labelKey];
            }
            return {
                option: currentOption,
                valueLabel
            }
        }
        const getTreeLabel = (options, val) => {
            let currentOptions = options;
            let labels = [];
            val.map(v => {
                const valueObj = getValueLabel(currentOptions, v);
                currentOptions = valueObj.option ? valueObj.option.children : [];
                labels.push(valueObj.valueLabel);
            })
            if (item.options.showAllPath) {
                return labels.join(item.options.split || ' / ');
            } else {
                return labels[labels.length - 1];
            }
        }
        if (item.options.mode === 'multiple') {
            return value.map(v => {
                return getTreeLabel(item.options.options, v);
            }).join('、');
        } else {
            return getTreeLabel(item.options.options, value);
        }
    }
    getValueLabel = (item, value, splitStr) => {
        let valueLabel = value;
        let currentSplitStr = splitStr || '、';
        if (item.type === 'radioGroup' || (item.type === 'select' && item.options.mode !== 'multiple')) {
            if (item.options.options) {
                const valueKey = this.getValueKey(item);
                const labelKey = this.getLabelKey(item);
                const currentOption = item.options.options.find(option => {
                    return option[valueKey] === value;
                });
                if (currentOption) {
                    valueLabel = currentOption[labelKey];
                }
            }
            return valueLabel;
        }
        if (item.type === 'checkboxGroup' || (item.type === 'select' && item.options.mode === 'multiple')) {
            if (item.options.options) {
                const valueKey = this.getValueKey(item);
                const labelKey = this.getLabelKey(item);
                return value.map(val => {
                    const currentOption = item.options.options.find(option => {
                        return option[valueKey] === val;
                    });
                    if (currentOption) {
                        return currentOption[labelKey]
                    }
                    return val
                }).join(currentSplitStr);
            }
        }
        if (item.type === 'cascaderPanel' || item.type === 'cascader') {
            if (item.options.options) {
                return this.valueLabelMap[item.field || item.name] || this.getCascaderValueLabel(item, value);
            }
        }
        if (Array.isArray(valueLabel)) {
            return valueLabel.join(currentSplitStr);
        }
        return String(valueLabel);
    }
    parseValueList = (item, value) => {
        if (item.type === 'tabsForm') {
            return item.options.fields.filter(field => {
                return value.hasOwnProperty(field.name) && value[field.name] && value[field.name].length > 0;
            }).map(field => {
                return {
                    label: field.label,
                    field: field.name,
                    parentField: item.field,
                    value: value[field.name],
                    valueLabel: this.getValueLabel(field, value[field.name])
                }
            });
        } else if(item.type === 'rangePicker') {
            return {
                label: item.label,
                field: item.field,
                value: value,
                valueLabel: this.getValueLabel(item, value, ' 至 ')
            }
        } else {
            return {
                label: item.label,
                field: item.field,
                value: value,
                valueLabel: this.getValueLabel(item, value)
            }
        }
    }
    isRealValue = (val) => {
        if (val !== null && val !== undefined) {
            if (Array.isArray(val)) {
                return val.length > 0;
            }
            return true;
        }
        return false;
    }
    setValueList = (values) => {
        if (!values) {
            return;
        }
        let valueList = [];

        for (let field of this.props.fields) {
             const value = values[field.field];
             if (this.isRealValue(value)) {
                if (field.type === 'tabsForm') {
                    valueList = valueList.concat(this.parseValueList(field, value));
                } else if (['input', 'autoComplete'].indexOf(field.type) > -1) {
                    if (value !== '') {
                        valueList.push(this.parseValueList(field, value));
                    }
                } else {
                    valueList.push(this.parseValueList(field, value));
                }
             }
        }
        this.valueList = valueList;
        this.setState({
            valueList
        });
    }
    handleCloseValue = item => {
        if (item.parentField) {
            delete this.values[item.parentField][item.field];
            this.formRef.current.setFieldValue(item.parentField, this.values[item.parentField]);
        } else {
            this.formRef.current.setFieldValue(item.field, undefined);
        }
    }
    handleResetForm = () => {
        const initialValues = this.props.initialValues;
        if (initialValues) {
            for (let key in this.values) {
                this.values[key] = initialValues[key];
            }
            this.formRef.current.setFieldsValue(this.values);
        } else {
            this.formRef.current.resetFields();
        }
        typeof this.props.onReset === 'function' && this.props.onReset();
    }
    changeLabel = (item, value, option) => {
        if (option) {
            if (Array.isArray(option) && ['cascader', 'cascaderPanel'].indexOf(item.type) > -1) {
                const labelAlias = (item.options.fieldNames && item.options.fieldNames.label) || 'label';
                const label = option.map(o => {
                    return o[labelAlias]
                }).join(item.options.split || ' / ');

                const currentItem = this.valueList.find(v => {
                    return v.field === item.field;
                });
                if (currentItem) {
                    currentItem.valueLabel = label
                }
                this.valueLabelMap[item.field || item.name] = label;
                this.setState({
                    valueList: this.valueList
                });
            }
        }
    }
    handleMore = () => {
        this.setState({
            more: !this.state.more
        });
    }
    componentDidUpdate = (prevProps, prevState) => {
        if (JSON.stringify(this.props.initialValues) !== JSON.stringify(prevProps.initialValues)) {
            this.setValueList(this.props.initialValues);
        }
        if (JSON.stringify(this.props.fields) !== JSON.stringify(prevProps.fields)) {
            if (this.props.initialValues) {
                this.setValueList(Object.assign(this.props.initialValues, this.values));
            } else {
                this.setValueList(Object.assign({}, this.values));
            }
        }
    }
    isInTrigger = (el) => {
        if (el.className && el.className.indexOf('arco-trigger') > -1) {
            return true;
        }
        if (el.parentNode.nodeName === 'BODY') {
            return false;
        }
        return this.isInTrigger(el.parentNode);
    }
    onClickOutside = (e) => {
        if (!this.state.more) {
            return;
        }
        const triggerRef = this.triggerRef.current;
        const triggerNode = findDOMNode(triggerRef);
        const childrenDom = findDOMNode(this);

        if (
            !contains(triggerNode, e.target) &&
            !contains(childrenDom, e.target) &&
            !this.isInTrigger(e.target)) {
            this.setState({
                more: false
            });
        }
    }
    onSearch = () => {
        typeof this.props.search === 'function' && this.props.search(this.getReportFiltersValue());
    }
    componentDidMount() {
        this.setValueList(this.props.initialValues);
        on(window.document, 'mousedown', this.onClickOutside);
    }
    componentWillUnmount() {
        off(window.document, 'mousedown', this.onClickOutside);
    }
    render() {
        const fields = this.props.fields.filter(field => {
            return field.options ? !field.options.hidden : true;
        }).map(field => {
            field.options.onPressEnter = () => {
                typeof this.onSearch();
            }
            return field
        });
        const min = this.props.min || 3;
        const full = fields.length <= min;
        const t = useClassLocale(this.context);
        const userT = useClassLocale(this.context, locale);
        const {
            more
        } = this.state;
        const {
            showButtonText
        } = this.props;

        let operFlex = 0;
        if (fields.length > min) {
            operFlex = more ? (showButtonText ? 212 : 148) : (showButtonText ? 178 : 148);
        } else {
            operFlex = showButtonText ? 130 : 110;
        }
        let resultOperFlex = showButtonText ? 230 : 220;
        return (
            <div
                className={[
                    this.props.className,
                    'modo-filter-form',
                    (more ? 'more' : ''),
                    (full ? 'full': '')
                ].join(' ')}
                style={this.props.style}
                ref={this.triggerRef}>
                <div className="modo-filter-form-content">
                    <Row
                        style={{
                            flexFlow: 'nowrap'
                        }}>
                        <Col
                            flex='auto'
                            style={{
                                width: '100%'
                            }}>
                            <Form
                                {...this.props}
                                labelCol={{
                                    flex: (this.props.labelCol && this.props.labelCol.flex) || '84px'
                                }}
                                wrapperCol={{
                                    flex: '1'
                                }}
                                ref={this.formRef}
                                fields={!this.state.more ? fields.slice(0, min) : fields}
                                onValuesChange={this.handleValuesChange}
                                changeLabel={this.changeLabel}
                                defaultValueChange={(values) => {
                                    return this.onSearch()
                                }}>
                            </Form>
                        </Col>
                        <Col
                            className="oper-group"
                            flex={`${operFlex}px`}
                            style={{
                                marginLeft: '10px'
                            }}>
                            { !showButtonText ? (
                                <Tooltip
                                    content={userT("重置")}>
                                    <Button
                                        className="reset"
                                        icon={<IconBrushColor />}
                                        style={{
                                            marginRight: '10px'
                                        }}
                                        onClick={this.handleResetForm}/>
                                </Tooltip>
                                ): (
                                <Button
                                    className="reset"
                                    type="text"
                                    style={{
                                        width: '48px',
                                        marginRight: (more || full) ? '10px' : '0px',
                                        padding: '0px'
                                    }}
                                    onClick={this.handleResetForm}>
                                    {userT('重置')}
                                </Button>
                            )}
                            {(!(full || more)) &&
                                (!showButtonText ? (
                                    <Tooltip
                                        content={userT("更多筛选条件")}>
                                        <Button
                                            className="filter"
                                            icon={<IconFilterColor />}
                                            style={{
                                                marginRight: '10px'
                                            }}
                                            onClick={this.handleMore}/>
                                    </Tooltip>
                                ) : (
                                    <Button
                                        className="filter"
                                        type="text"
                                        style={{
                                            width: '48px',
                                            marginRight: '10px',
                                            padding: '0px'
                                        }}
                                        onClick={this.handleMore}>
                                        {userT('更多')}
                                    </Button>
                                ))
                            }
                            <Button
                                className="search"
                                type='primary'
                                style={{
                                    width: '72px'
                                }}
                                onClick={() => {
                                    return typeof this.props.search === 'function' && this.props.search(this.getReportFiltersValue())
                                }}>
                                {t('查询')}
                            </Button>
                            { more && <Button
                                className="collapse"
                                style={{
                                    width: '72px',
                                    marginLeft: '10px'
                                }}
                                onClick={this.handleMore}>
                                {userT('收起')}
                            </Button> }
                        </Col>
                    </Row>
                    {!full && <div
                        className="filter-form-result"
                        style={{
                            width: this.state.more ? `calc(100% - ${resultOperFlex}px)` : '100%'
                        }}>
                        <span
                            style={{
                                display: 'inline-block',
                                color: 'var(--color-gray-6)',
                                marginRight: '10px',
                                lineHeight: '20px'
                            }}>
                            {userT('已选筛选条件')}:
                        </span>
                        <div
                            className="tag-list"
                            style={{
                                lineHeight: this.state.more ? '20px' : '20px'
                            }}>

                            {this.state.valueList.length > 0 ? this.state.valueList.map(item => {
                                return (
                                    <Tag
                                        key={item.field}
                                        visible={true}
                                        style={{
                                            marginLeft: '4px',
                                            marginBottom: '6px'
                                        }}
                                        size="small"
                                        closable
                                        color="arcoblue"
                                        onClose={() => this.handleCloseValue(item)}>
                                        <span className="result">
                                            <span className="label">{item.label}: </span>
                                            <Typography.Text
                                                className="value"
                                                ellipsis={{
                                                    cssEllipsis: true,
                                                    rows: 1,
                                                    showTooltip: true
                                                }}>
                                                {item.valueLabel}
                                            </Typography.Text>
                                        </span>
                                    </Tag>
                                )
                            }) : <span>
                                {userT('全部')}
                            </span>}
                        </div>
                    </div> }
                </div>
            </div>
        )
    }
}

FilterForm.contextType = GlobalContext;

export default FilterForm;
