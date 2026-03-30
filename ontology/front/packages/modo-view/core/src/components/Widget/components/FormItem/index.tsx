import React from 'react';
import { connect } from 'react-redux';
import { Form, Checkbox } from "@arco-design/web-react";
import Widget from "../../";
import './style/index.less';
import CheckboxGroup from '@arco-design/web-react/es/Checkbox/group';
import isNull from 'packages/modo-view/core/src/utils/isNull';

const { Item } = Form;

const EditableContext = React.createContext({});

class FormItem extends React.Component {
    constructor(props: any) {
        super(props);
        this.widgetRef = React.createRef();
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
    };
    validate = () => {

    };
    setDefaultValue = () => {
        if (!isNull(this.props.defaultValue)) {
            if (this.widgetRef) {
                if (this.widgetRef.current) {
                    const { onChange } = this.widgetRef.current.props;
                    typeof onChange === 'function' && onChange(this.props.defaultValue);
                }
            }
        }
    };
    componentDidUpdate(prevProps) {
        if (prevProps.defaultValue !== this.props.defaultValue) {
            this.setDefaultValue();
        }
    }
    componentDidMount() {
        this.setDefaultValue();
    }
    render() {
        if (window.abc) {
            console.log(`render-form-item-${this.props.nodeKey}`);
        }
    	const {
            nodeKey,
            parentNodeKey,
            nodes,
            dispatch,
            dispatchEvent,

            cloneWidget,
            setList,

            className,
            canvasClassName,

            editable,
            inForm,
            titleVisible,
            style,
            rules,
            get$this,
            isGroup,
            groupChecked,


            ...rest
        } = this.props;

        const node = nodes.byId[nodeKey];

    	const {
    		name,
    		label,
    	} = node;

        const {
            span,
            labelFlex,
            wrapperOffset
        } = node.options;

        const itemOptions = {
            field: node.type !== 'button' ? name : null,
            label: node.type !== 'button' ? this.props.widgetLabel : '',
            hidden: node.options.hidden,
            rules: (Array.isArray(this.props.rules) && this.props.rules.length > 0) ? this.parseRules(this.props.rules) : undefined,
            onClick: this.props.onClick,
            onMouseLeave: this.props.onMouseLeave,
            onMouseOver: this.props.onMouseOver,
            css: this.props.css,
            noStyle: this.props.noStyle,
            noLabel: this.props.noLabel,
            required: this.props.required
            // requiredSymbol: this.props.requiredSymbol,
        };

        let otherRest = {};
        if (labelFlex) {
            otherRest = {
                labelCol: labelFlex
            };
        }

        const triggerPropNameMap = {
            switch: 'checked',
            upload: 'fileList'
        };

        return (
        	<Item
                key={node.options.id}
                className={className + (node.options.noLabel ? ' no-label' : ' ')}
                style={{
                    ...style,
                    gridArea: `span ${span} / span ${span || 24}`,
                    marginLeft: wrapperOffset
                }}
                wrapperCol={{
                	flex: 1
                }}
                {...otherRest}
                {...itemOptions}
                triggerPropName={triggerPropNameMap[node.type] || 'value'}
                label={(
                    <>
                        {itemOptions.label}
                        {isGroup ? <Item
                            style={{
                                display: 'inline-block',
                                width: '24px',
                                marginRight: '5px',
                                verticalAlign: 'middle',
                                marginBottom: '0px'
                            }}
                            field={`$group.${node.name}`}
                            triggerPropName="checked"
                            initialValue={groupChecked}>
                            <Checkbox>
                            </Checkbox>
                        </Item> : null }
                    </>
                )}>
                <Widget
                    ref={this.widgetRef}
                    nodeKey={nodeKey}
                    parentNodeKey={parentNodeKey}
                    editable={editable}
                    $inner={this.props.$inner}
                    get$this={this.props.get$this}/>
            </Item>
        )
    }
}

export default connect((state, ownProps) => {
    const { nodes } = state;
    const node = nodes.byId[ownProps.nodeKey.toString()];
    return {
        nodes,
        node
    }
}, null, null, {forwardRef: true})(FormItem);
