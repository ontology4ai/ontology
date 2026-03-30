import React , { useState} from 'react';
import { Steps } from '@arco-design/web-react';
import wrapHOC from '../../hoc/wrap';
import Renderer from 'packages/modo-view/renderer';
import execExp from 'packages/modo-view/designer/src/utils/execExpression';
import execMethod from 'packages/modo-view/designer/src/utils/execMethod';
import './style/index.less';

const { Step } = Steps;

class ModoSteps extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            current: this.props.defaultCurrent || 2
        }
    }
    setActive = (id) => {
        const index = this.props.steps.filter(step => !step.hidden).findIndex(step => {
            return step.id === id;
        });
        if (index > -1) {
            this.setCurrent(index + 1, id);
        }
    };
    setCurrent = (current, id) => {
        this.setState({
            current
        });
    };
    componentDidMount() {
        this.props.dispatch({
            type: 'SETREF',
            name: this.props.name,
            ref: this
        });
    }
    componentWillUnmount() {
        this.props.dispatch({
            type: 'DELETEREF',
            name: this.props.name
        });
    }
    render() {
        if (window.abc) {
            console.log(`render-steps-${this.props.nodeKey}`);
        }
        const {
            className,
            style,
            onMouseLeave,
            onMouseOver,
            onClick
        } = this.props;

        const {
            nodeKey,
            parentNodeKey,
            editable,
            inForm,
            steps,
            ...rest
        } = this.props;

        return (
            <div
                className={className}
                style={{
                    ...style
                }}
                onMouseLeave={onMouseLeave}
                onMouseOver={onMouseOver}
                onClick={onClick}>
                <Steps
                    {...rest}
                    current={this.state.current}
                    onChange={!rest.disabledChange? this.setCurrent : () => {}}>
                    {
                        steps.filter(step => !step.hidden).map((step, index) => {
                            return (
                                <Step
                                    key={step.id}
                                    {...step}>
                                </Step>
                            );
                        })
                    }
                </Steps>
                <div className="modo-step-list">
                    {steps.filter(step => !step.hidden).map((step, index) => {
                        const params = execExp({$this: this.props.get$this()}, step.params);
                        return step.viewName && <Renderer
                                key={step.id}
                                appName={this.props.app.name}
                                fileName={step.viewName + '.fragment'}
                                params={params}
                                parentViewKey={this.props.viewKey}
                                renderKey={step.id}
                                close={() => {
                                }}
                                style={{
                                    opacity: this.state.current === index + 1 ? 1 : 0,
                                    height: this.state.current === index + 1 ? 'auto' : '0px'
                                }}
                            />
                    })}
                </div>
            </div>
        )
    }
}

export default wrapHOC(ModoSteps, 'steps');
