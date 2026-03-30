import React from 'react';
import { Tabs, Typography, Cascader } from '@arco-design/web-react';
import CascaderPanel from '../CascaderPanel';
import widgetMap from '../Form/widget';
import './style/index.less';

const TabPane = Tabs.TabPane;

class ModoTabsForm extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            activeTab: null,
            fields: [
            ],
            value: {}
        };
    }
    changeValue = (name, value) => {
        const obj = {};
        obj[name] = value;
        const values = {
            ...this.state.value,
            ...obj
        }
        this.setState({
            value: values
        });
        typeof this.props.onChange === 'function' && this.props.onChange(values);
    }
    setValue = (value) => {
        if (value) {
            this.setState({
                value
            })
        } else {
            this.setState({
                value: {}
            });
        }
    }
    componentDidUpdate(prevProps) {
        if (JSON.stringify(prevProps.value) !== JSON.stringify(this.props.value)) {
            this.setValue(this.props.value);
        }
        if (JSON.stringify(prevProps.fields) !== JSON.stringify(this.props.fields)) {
            this.setState({
                fields: this.props.fields,
                activeTab: this.props.fields.length > 0 ? this.props.fields[0].name : null
            });
        }
    }
    componentDidMount() {
        this.setValue(this.props.value);
        this.setState({
            fields: this.props.fields,
            activeTab: this.props.fields.length > 0 ? this.props.fields[0].name : null
        });
    }
    render() {
        const {
            activeTab,
            fields,
            value
        } = this.state;
    	return (
			<Tabs
                className="modo-tabs-form"
                activeTab={activeTab}
                onChange={(val) => {
                this.setState({
                    activeTab: val
                })}}>
                {
                    fields.map(field => {
                        const Widget = widgetMap[field.type];
                        return (
                            <TabPane
                                key={field.name}
                                title={field.label}>
                                {
                                    Widget && (
                                        <Widget
                                            {...field.options}
                                            value={value[field.name]}
                                            onChange={(value, option) => {
                                                typeof this.props.changeLabel === 'function' && this.props.changeLabel(field, value, option);
                                                this.changeValue(field.name, value);
                                                const {
                                                    onChange
                                                } = field.options;
                                                typeof onChange === 'function' && onChange(value)
                                            }}/>
                                    )
                                }
                            </TabPane>
                        )
                    })
                }
            </Tabs>
	    )
    }
};

export default ModoTabsForm;
