import React , { useState} from 'react';
import { Button, Popconfirm, Message, Input } from '@arco-design/web-react';
import { connect } from 'react-redux';
import wrapHOC from '../../hoc/wrap';
import downloadReport from '@/core/src/utils/downloadReport';
import * as Icon from 'modo-design/icon';
import CascaderPanel from '@/components/CascaderPanel';
import './style/index.less';

class ModoDownload extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            value: [],
            options: [],
            num: 0,
            fileName: ''
        };
    }
    getData = () => {
        const {
            tree,
            byId
        } = this.props.nodes;

        const value = [];
        const options = [];
        let num = 0;
        const parseNode = (node, sheet, parent) => {
            if (byId[node.id].type === 'table') {
                if (sheet) {
                    value.push([sheet, node.id]);
                    parent.children.push({
                        value: node.id,
                        label: node.label
                    });
                    num += 1;
                } else {
                    value.push([node.id]);
                    options.push({
                        value: node.id,
                        label: node.label
                    });
                    num += 1;
                }
            }
            if (byId[node.id].type === 'vTabs') {
                if (Array.isArray(node.children)) {
                    for (let n of node.children) {
                        const option = {
                            value: n.label,
                            label: n.label,
                            children: []
                        };
                        options.push(option);
                        parseNode(n, n.label, option);
                    }
                    return;
                }
            }
            if (Array.isArray(node.children)) {
                for (let n of node.children) {
                    parseNode(n, sheet, parent);
                }
            }
        };
        for (let node of tree) {
            parseNode(node, null, null);
        }
        return {
            value,
            options,
            num
        };
    };
    onVisibleChange = visible => {
        if (visible) {
            const data = this.getData();
            if (JSON.stringify(this.state.options !== data.options)) {
                this.setState({
                    options: data.options
                });
            }
            if (JSON.stringify(this.state.value !== data.value)) {
                this.setState({
                    value: data.value
                });
            }
            this.setState({
                num: data.num
            });
        }
    };
    download = (...args) => {
        if (!this.props.editable) {
            if (this.state.value.length === 0) {
                Message.warning('请选择至少一个报表！');
                return;
            }
            let downloadConfig = {};
            const {
                byId
            } = this.props.nodes;
            this.state.value.forEach(value => {
                if (value.length === 1) {
                    const tableRef = this.props.get$this().$refs[byId[value[0]].name];
                    if (tableRef) {
                        const data = tableRef.getDownloadData();
                        const tables = data.downloadConfig;
                        downloadConfig[tables[0].title] =  tables;
                    }
                } else {
                    const tableRef = this.props.get$this().$refs[byId[value[1]].name];
                    if (tableRef) {
                        const data = tableRef.getDownloadData();
                        const tables = data.downloadConfig;
                        const sheet =  downloadConfig[value[0]];
                        downloadConfig[value[0]] =  sheet ? sheet.concat(tables) : tables;
                    }
                }
            });
            downloadReport({
                command: "download",
                dataSource: "",
                downloadConfig
            }, (this.props.fileName || '汇总') + '.xls')
        }
    };
    componentDidMount() {
        this.onVisibleChange(true);
    }
    render() {
        if (window.abc) {
            console.log(`render-v-tabs-${this.props.nodeKey}`);
        }
        const {
            icon,
            nodeKey,
            ...rest
        } = this.props;

        const ButtonIcon = Icon[icon];

        const className = rest.iconOnly ? [rest.className, 'arco-btn-icon-only'].join(' ') : rest.className;

        return (
            <Popconfirm
                icon={null}
                disabled={this.props.editable || this.state.num < 2}
                focusLock
                style={{
                    maxWidth: 'auto'
                }}
                title={(
                    <CascaderPanel
                        mode='multiple'
                        value={this.state.value}
                        options={this.state.options}
                        onChange={value => {
                            this.setState({
                                value
                            });
                        }}>
                    </CascaderPanel>
                )}
                onOk={() => {
                    this.download();
                }}
                onCancel={() => {
                }}
                onVisibleChange={this.onVisibleChange}>
                <Button
                    {...rest}
                    className={className}
                    icon={ButtonIcon ? <ButtonIcon/> : null}
                    onClick={(...args) => {
                        if (this.props.editable) {
                            typeof this.props.onClick === 'function' && this.props.onClick(...args);
                        }
                        if (this.state.num < 2) {
                            this.download();
                        }
                    }}
                    />
            </Popconfirm>
        )
    }
}

export default wrapHOC(ModoDownload, 'download');
