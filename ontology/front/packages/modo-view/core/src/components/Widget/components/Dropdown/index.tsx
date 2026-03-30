import React , { useState, forwardRef } from 'react';
import { Dropdown, Menu, Button } from '@arco-design/web-react';
import { connect } from 'react-redux';
import wrapHOC from '../../hoc/wrap';
import { IconMoreCol } from 'modo-design/icon';
import execExp from 'packages/modo-view/designer/src/utils/execExpression';
import execMethod from 'packages/modo-view/designer/src/utils/execMethod';
import * as Icon from 'modo-design/icon';

import './style/index.less';

class ModoDropdown extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
        };
    }

    componentDidUpdate = (prevProps) => {
    };
    componentDidMount() {
    }
    componentWillUnmount() {
    }
    render() {
        if (window.abc) {
            console.log(`render-dropdown-${this.props.nodeKey}`);
        }
        const {
            onMouseLeave,
            onMouseOver,
            onClick,
        } = this.props;

        const {
            style,
            className,
            buttons,
            children,
            size,
            ...props
        } = this.props;

        const currentButtons = this.props.buttons.filter(button => {
            return !button.hidden;
        });

        const actions = currentButtons.slice(0, 1);
        const dropActions = currentButtons.slice(1);

        return (
            <span
                className={className}
                style={{
                    ...style,
                    display: 'inline-block'
                }}
                onMouseLeave={onMouseLeave}
                onMouseOver={onMouseOver}
                onClick={onClick}>
                {children}
                <Button.Group>
                    {
                        actions.map((action, index) => {
                            const BtnIcon = Icon[action.icon];
                            return  <Button
                                key={index}
                                size={size}
                                type='secondary'
                                icon={action.icon && BtnIcon ? <BtnIcon/> : null}
                                children={(!action.icon || !BtnIcon) ? action.label : null}
                                onClick={() => {
                                    this.props.dispatchEvent(action.event)
                                }}></Button>
                        })
                    }
                    { dropActions.length > 0 ? (
                        <Dropdown
                            position='br'
                            droplist={
                                <Menu>
                                    {
                                        dropActions.map((action, index) => {
                                            const BtnIcon = Icon[action.icon];
                                            return (
                                                <Menu.Item
                                                    key={index}
                                                    onClick={() =>this.props.dispatchEvent(action.event)}>
                                                    {action.icon && BtnIcon ? <BtnIcon/> : null}
                                                    {action.label}
                                                </Menu.Item>
                                            );
                                        })
                                    }
                                </Menu>
                            }>
                            <Button
                                size={size}
                                type='secondary'
                                icon={<IconMoreCol />}/>
                        </Dropdown>
                        ) : null
                    }
                </Button.Group>
            </span>
        )
    }
}

export default connect((state, ownProps) => {
    const { nodes } = state;
    const node = nodes.byId[ownProps.nodeKey];
    return {
        nodes,
        node,
        name: node.name
    }
})(ModoDropdown, 'drop-down', true);
