import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { Dropdown, Menu } from '@arco-design/web-react';
import eventMap from './utils/eventMap';
import Action from 'packages/modo-view/core/src/components/Widget/utils/Action';
import { IconSetting, IconDelete } from 'modo-design/icon';
import Setting from './components/Setting';

import './style/index.less';

class Event extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
        };
    }
    handleClickMenuItem = (key) => {
        const { node } = this.props;
        node.options.eventMap[key] = new Action();

        this.props.dispatch({
            type: 'SETNODE',
            nodeKey: node.id,
            currentNode: node
        })
    };
    handleSetting = (key) => {
        this.props.dispatch({
            type: 'SETACTIVEEVENT',
            nodeKey: this.props.activeNodeKey,
            eventType: key
        })
    };
    handleDelete = (key) => {
        const { node } = this.props;
        delete node.options.eventMap[key];
        this.props.dispatch({
            type: 'SETNODE',
            nodeKey: node.id,
            currentNode: node
        })
    };
    render() {
        const {
            node
        } = this.props;

        const eventList = eventMap[node.type] || [];

        const dropList = (
            <Menu
                 onClickMenuItem={this.handleClickMenuItem}>
                {
                    eventList.filter(event => {
                        return !node.options.eventMap[event.value]
                    }).map(event => {
                        return (
                            <Menu.Item
                                key={event.value}>
                                {event.label}
                            </Menu.Item>
                        )
                    })
                }
            </Menu>
        );
        return (
            <div className="modo-designer-event">
                <ul className="event-list">
                    {
                        eventList.filter(event => {
                            return node.options.eventMap[event.value]
                        }).map(event => {
                            return (
                                <li
                                    key={event.value}>
                                    <span
                                        className="label">
                                        {event.label}
                                    </span>
                                    <IconSetting
                                        onClick={() => this.handleSetting(event.value)}
                                        className="setting" />
                                    <IconDelete
                                        onClick={() => this.handleDelete(event.value)}
                                        className="delete"/>
                                </li>
                            )
                        })
                    }
                </ul>
                <Dropdown.Button
                    type='secondary'
                    droplist={dropList}>
                    新建动作
                </Dropdown.Button>
                <Setting />
            </div>
        );
    }
}

export default connect((state, ownProps) => {
    const node = state.nodes.byId[state.activeNodeKey];
    return {
        nodes: state.nodes,
        activeNodeKey: state.activeNodeKey,
        node,
        event
    }
})(Event);
