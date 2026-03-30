import React, { useState, useEffect, useMemo } from 'react';
import { Tree, Dropdown, Menu } from '@arco-design/web-react';
import { connect } from 'react-redux';
import './style/index.less';

class Outline extends React.Component {
    constructor(props: any) {
        super(props);

        this.state = {
        }
    }
    handleFormatNode = node => {
        const id = guid();
        node.id = id;
        node.name = id;
        if (Array.isArray(node.children)) {
            node.children = node.children.map(childId => {
                return this.handleFormatNode(JSON.parse(JSON.stringify(this.props.nodes.byId[childId])));
            });
        }
        return node;
    };
    handleCopyNode = (node, props) => {
        if (props.parentKey) {
            this.props.dispatch({
                type: 'ADDNODE',
                node: this.handleFormatNode(JSON.parse(JSON.stringify(node))),
                parentNodeKey: props.parentKey
            });
        }
    };
    render() {
        const treeData = this.props.tree;
        const { visible } = this.props;

        return (
            <div
                className="modo-design-outline"
                style={{
                    display: visible ? 'block' : 'none'
                }}>
                <Tree
                    draggable
                    blockNode
                    showLine={true}
                    fieldNames={{
                        key: 'id',
                        title: 'label'
                    }}
                    onSelect={(selectedKeys) => {
                        this.props.dispatch({
                            type: 'SETACTIVENODEKEY',
                            nodeKey: selectedKeys[0]
                        });
                    }}
                    onDrop={({ dragNode, dropNode, dropPosition }) => {
                        const loop = (data, key, callback) => {
                            data.some((item, index, arr) => {
                                if (item.id === key) {
                                    callback(item, index, arr);
                                    return true
                                }
                                if (item.children) {
                                    return loop(item.children, key, callback)
                                }
                            })
                        };
                        const data = [...treeData];
                        let dragItem;
                        loop(data, dragNode.props._key, (item, index, arr) => {
                            arr.splice(index, 1);
                            dragItem = item;
                            dragItem.className = 'tree-node-dropover';
                        });
                        if (dropPosition === 0) {
                            loop(data, dropNode.props._key, (item, index, arr) => {
                                item.children = item.children || [];
                                item.children.push(dragItem)
                            })
                        } else {
                            loop(data, dropNode.props._key, (item, index, arr) => {
                                arr.splice(dropPosition < 0 ? index : index + 1, 0, dragItem)
                            })
                        }
                        this.props.dispatch({
                            type: 'SETTREE',
                            data: [...data]
                        });
                        this.props.dispatch({
                            type: 'SETNORMALIZETREE',
                            data: [...data]
                        });
                    }}
                    treeData={treeData}
                    renderTitle={props => {
                        return (
                            <Dropdown
                                trigger='contextMenu'
                                position='bl'
                                droplist={
                                    <Menu>
                                        <Menu.Item
                                            key='delete'
                                            onClick={() => {
                                                const node = this.props.nodes.byId[props.id];
                                                this.props.dispatch({
                                                    type: 'DELETENODE',
                                                    parentNodeKey: props.parentKey,
                                                    node
                                                });
                                                setTimeout(() => {
                                                    this.props.dispatch({
                                                        type: 'SETACTIVENODEKEY',
                                                        nodeKey: '0'
                                                    })
                                                });
                                            }}>
                                            删除
                                        </Menu.Item>
                                        <Menu.Item
                                            key='copy'
                                            onClick={() => {
                                                const node = this.props.nodes.byId[props.id];
                                                this.handleCopyNode(node, props);
                                            }}>
                                            复制
                                        </Menu.Item>
                                    </Menu>
                                }>
                                {props.title}
                            </Dropdown>
                        )
                    }}>
                </Tree>
            </div>
        );
    }
}

export default connect((state, ownProps) => {
    return {
        nodes: state.nodes,
        tree: state.nodes.tree
    }
})(Outline);
