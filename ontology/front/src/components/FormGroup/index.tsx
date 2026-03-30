import React from 'react';
import widgetMap from '../Form/widget';
import { Button } from '@arco-design/web-react';
import { IconPlus, IconDelete, IconArrowRise, IconArrowFall, IconHeart } from '@arco-design/web-react/icon';
import Form from '../Form';
import './style/index.less';

class ModoFormGroup extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            values: {},
            config: {
                layout: 'inline',
                fields: [
                ]
            }
        };
        this.values = {};
        this.formRef = React.createRef();
    }
    changeValue = (name, value, index) => {
    }
    getClassName(classNames) {
    }
    handleChange = () => {
        typeof this.props.onChange === 'function' && this.props.onChange(this.values);
    }
    setValues = (values) => {
        this.formRef.current && this.formRef.current.setFieldsValue({
            ...this.values,
            ...values
        });
    }
    componentDidUpdate(prevProps) {
        if (JSON.stringify(this.values) !== JSON.stringify(this.props.value)) {
            this.setValues(this.props.value);
        }
    }
    componentDidMount() {
        if (this.props.value) {
           this.setValues(this.props.value);
        }
    }
    render() {
        const {
            fields
        } = this.state;
        const config = this.props.config || {};
        const {
            onChange,
            ...props
        } = this.props;
    	return (
			<div
                {...props}
                className={['modo-form-group', (this.props.className || '')].join(' ')}>
                {this.props.children}
                <Form
                    ref={this.formRef}
                    {...config}
                    layout="inline"
                    onValuesChange={(_, values) => {
                        if (JSON.stringify(this.props.value) !== JSON.stringify(values)) {
                            typeof this.props.onChange === 'function' && this.props.onChange(values);
                            this.values = values;
                        }
                    }}/>
			</div>
	    )
    }
};

export default ModoFormGroup;
