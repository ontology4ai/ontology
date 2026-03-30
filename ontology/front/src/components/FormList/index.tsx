import React from 'react';
import widgetMap from '../Form/widget';
import { Button } from '@arco-design/web-react';
import { IconPlus, IconDelete, IconArrowRise, IconArrowFall } from '@arco-design/web-react/icon';
import './style/index.less';

class ModoFormList extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            fields: [],
            value: [
                {}
            ]
        };
    }
    remove = (index) => {
        this.state.value.splice(index, 1);
        this.setState({
            value: [...this.state.value]
        })
        this.handleChange()
    }
    move = (index, dir) => {
        var current = this.state.value.splice(index, 1);
        this.state.value.splice((dir ? index + 1 : index - 1), 0, current[0]);
        this.setState({
            value: [...this.state.value]
        })
        this.handleChange()
    }
    add = () => {
        this.state.value = [
            ...this.state.value,
            {}
        ]
        this.setState({
            value: [...this.state.value]
        })
        this.handleChange()
    }
    changeValue = (name, value, index) => {
        this.state.value[index][name] = value;
        this.setState({
            value: [...this.state.value]
        })
        this.handleChange()
    }
    getClassName(classNames) {
        return classNames.filter(name => {
            return name;
        }).join(' ');
    }
    handleChange = () => {
        typeof this.props.onChange === 'function' && this.props.onChange(this.state.value);
    }
    setValue = (value) => {
        if (Array.isArray(value)) {
            this.setState({
                value: value.map(val => {
                    if (val && typeof val === 'object') {
                        return val;
                    }
                    return {};
                })
            })
        } else {
            this.setState({
                value: []
            });
        }
    }
    componentDidUpdate(prevProps) {
        if (JSON.stringify(prevProps.value) !== JSON.stringify(this.props.value)) {
            this.setValue(this.props.value);
        }
        if (JSON.stringify(prevProps.fields) !== JSON.stringify(this.props.fields)) {
            this.setState({
                fields: this.props.fields
            });
        }
    }
    componentDidMount() {
        this.setValue(this.props.value);
        this.setState({
            fields: this.props.fields
        });
    }
    render() {
        const {
            fields,
            value
        } = this.state
    	return (
			<div
				className="modo-form-list">
                <div className="modo-form-list-container">
                    {
                        value.map((rowValue, index) => {
                            return (
                                <div
                                    className="row"
                                    key={index}>
                                    <div className="form-row">
                                        {
                                            fields.map(field => {
                                                const Widget = widgetMap[field.type];
                                                if (Widget) {
                                                    return (
                                                        <Widget
                                                            key={field.name}
                                                            {...field.options}
                                                            value={rowValue[field.name]}
                                                            className={
                                                                this.getClassName([
                                                                    field.options.className,
                                                                    'form-col'
                                                                ])
                                                            }
                                                            onChange={value => {
                                                                this.changeValue(field.name, value, index);
                                                                const {
                                                                    onChange
                                                                } = field.options;
                                                                typeof onChange === 'function' && onChange(value)
                                                            }}/>
                                                    )
                                                }
                                                return (
                                                    <>
                                                        未成功渲染
                                                    </>
                                                )
                                            })
                                        }
                                    </div>
                                    <Button
                                        icon={<IconDelete />}
                                        shape='circle'
                                        status='danger'
                                        style={{
                                            marginRight: '10px',
                                        }}
                                        onClick={() => this.remove(index)}>
                                    </Button>
                                    <Button
                                        shape='circle'
                                        onClick={() => this.move(index, index > 0 ? index - 1 : index + 1)}>
                                        {index > 0 ? <IconArrowRise /> : <IconArrowFall />}
                                    </Button>
                                </div>
                            )
                        })
                    }
                </div>
                <Button
                    icon={<IconPlus />}
                    shape='circle'
                    status='info'
                    onClick={() => {
                        this.add();
                    }}>
                </Button>
			</div>
	    )
    }
};

export default ModoFormList;
