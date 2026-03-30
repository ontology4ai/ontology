import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Tree, Button } from '@arco-design/web-react';
import Editor from '@/components/Editor';
import { connect } from 'react-redux';
import generateView from 'packages/modo-view/designer/src/utils/generateView';
import transform from 'packages/modo-view/designer/src/utils/transform';
import { IconSetting } from 'modo-design/icon';
import EventAttr from 'packages/modo-view/designer/src/pages/attr-panel/components/Attr/components/EventSetting';
import eventMap from 'packages/modo-view/designer/src/pages/attr-panel/components/Senior/components/Event/utils/eventMap';
import './style/index.less';

class EventList extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            data: '',
            nodes: [],
            nodesById: {},
            event: null,
            eventKey: null,
            nodeKey: null,
            visible: false,
        }
    }
    handleSetting = (eventKey, event, nodeKey) => {
        this.setState({
            visible: true,
            event,
            eventKey,
            nodeKey
        });
    };
    handleOnCancel = () => {
        this.setState({
            visible: false,
            event: null,
            eventKey: null,
            nodeKey: null,
        });
    };
    handleOnOk = () => {
        const node = this.props.nodes.byId[this.state.nodeKey];
        node.options.eventMap[this.state.eventKey] = this.state.event;
        this.handleOnCancel();
    };
    componentDidUpdate(prevProps) {
        let change = false;
        const { nodes } = this.props;
        const { byId } = nodes;
        const eventNodes = [];
        const nodesById = {};
        for (let key in byId) {
            const node = byId[key];
            const { eventMap } = node.options;
            if (eventMap && Object.keys(eventMap).length > 0) {
                if (!this.state.nodesById.hasOwnProperty(key)) {
                    change = true;
                } else {
                    if (!_.isEqual(this.state.nodesById[key].options.eventMap, node.options.eventMap)) {
                        change = true;
                    }
                }
                eventNodes.push(node);
                nodesById[key] = node;
            }
        }
        if (change) {
            this.setState({
                nodes: eventNodes,
                nodesById
            });
        }
    }
    render() {
        const { visible } = this.props;
        const { nodes } = this.state;

        return (
            <div
                className="modo-design-event-list"
                style={{
                    display: visible ? 'block' : 'none'
                }}>
                <div
                    className="header">
                    事件清单
                </div>
                <ul>
                    {
                        nodes.map(node => {
                            const eventList = eventMap[node.type] || [];
                            return (
                                <li
                                    key={node.name}>
                                    <span>{node.label}</span>
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
                                                            onClick={() => this.handleSetting(event.value, node.options.eventMap[event.value], node.id)}
                                                            className="setting" />
                                                    </li>
                                                )
                                            })
                                        }
                                    </ul>
                                </li>
                            )
                        })
                    }
                </ul>
                <Modal
                    style={{
                        width: 'calc(100% - 40px)',
                        height: 'calc(100% - 40px)'
                    }}
                    title={(
                        <div
                            style={{ textAlign: 'left' }}>
                            事件处理
                        </div>
                    )}
                    visible={this.state.visible}
                    onCancel={this.handleOnCancel}
                    onOk={this.handleOnOk}>
                    { this.state.event ? <EventAttr
                        event={this.state.event}
                        onChange={(values) => {
                            this.setState({
                                event: values
                            });
                        }}/> : null }
                </Modal>
            </div>
        );
    }
}

export default connect((state, ownProps) => {
    return {
        nodes: state.nodes
    }
})(EventList);
