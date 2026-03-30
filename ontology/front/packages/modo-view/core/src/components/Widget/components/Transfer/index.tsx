import React , { useState} from 'react';
import { Transfer, Table, Typography } from '@arco-design/web-react';
import './style/index.less';
import RemoteTransfer from '@/components/Transfer';

const TableTransfer = ({ sourceColumns, targetColumns, ...restProps }) => (
    <RemoteTransfer {...restProps}>
        {({
            listType,
            filteredItems,
            onItemSelect,
            onItemRemove,
            onItemSelectPart,
            onItemSelectAll,
            selectedKeys: listSelectedKeys,
            disabled: listDisabled,
        }) => {
            const columns = listType === 'source' ? sourceColumns : targetColumns;
            return (
                <Table
                    style={{
                        pointerEvents: listDisabled ? 'none' : null,
                        borderRadius: 0,
                    }}
                    checkCrossPage
                    pagination={{
                        size: 'mini',
                        pageSize: restProps.pageSize,
                        simple: true
                    }}
                    data={filteredItems}
                    columns={columns}
                    scroll={{
                        x: '100%',
                        y: restProps.height - 148
                    }}
                    border={{
                        // wrapper: true,
                        // cell: true,
                    }}
                    rowSelection={{
                        columnWidth: 36,
                        selectedRowKeys: listSelectedKeys,
                        checkboxProps: (item) => {
                            return {
                                disabled: listDisabled || item.disabled,
                                // Avoid triggering onRow.onClick
                                onClick: (e) => e.stopPropagation(),
                            };
                        },

                        onChange(selectedRowKeys) {
                        },
                        onSelect: (selected, record, selectedRows) => {
                            onItemSelect(record[restProps.rowKey], selected);
                        },
                        onSelectAll: (selected, selectedRows) => {
                            onItemSelectPart(selectedRows.map(r => {return r[restProps.rowKey]}), selected);
                        }
                    }}
                    onRow={({ key, disabled: itemDisabled }) => ({
                        onClick: (e) => {
                            !itemDisabled && !listDisabled && onItemSelect(key, !listSelectedKeys.includes(key));
                        },
                    })}
                />
            );
        }}
    </RemoteTransfer>
);


class ModoTransfer extends React.Component {
    constructor(props: any) {
            super(props);
            this.state = {
                targetKeys: [],
                columns: [],
                dataIndexs: [],
                searchIndexs: [],
                data: [],
                source: '',
                target: '',
                loading: false
                /* dataSource: new Array(30).fill(null).map((_, index) => ({
                    key: `${index + 1}`,
                    name: 'Bytedance Technology Co., Ltd.',
                    label: 'Technology'
                })),
                tableColumns: [
                    {
                        dataIndex: 'name',
                        title: '英文名',
                        render: (col, record, index) => (
                            <Typography.Paragraph
                                ellipsis={{
                                    rows: 1,
                                    showTooltip: true,
                                    wrapper: 'span'
                                }}>
                                {col}
                            </Typography.Paragraph>
                         )
                    },
                    {
                        dataIndex: 'label',
                        title: '中文名',
                        render: (col, record, index) => (
                            <Typography.Paragraph
                                ellipsis={{
                                    rows: 1,
                                    showTooltip: true,
                                    wrapper: 'span'
                                }}>
                                {col}
                            </Typography.Paragraph>
                         )
                    }
                ] */
            }
    }
    setTargetKeys = (keys) => {
        this.setState({
            targetKeys: keys
        });
        typeof this.props.onChange === 'function' && this.props.onChange(keys);
    };
    setColumns = (columns) => {
        const {
            search
        } = this.props.fieldNames;
        this.setState({
            columns: columns.map((column) => {
                return {
                    ...column,
                    render: (col, record, index) => (
                        <Typography.Paragraph
                            ellipsis={{
                                rows: 1,
                                showTooltip: true,
                                wrapper: 'span'
                            }}>
                            {col}
                        </Typography.Paragraph>
                    )
                }
            }),
            dataIndexs: columns.map((column) => {
                return column.dataIndex;
            }),
            searchIndexs: search && search.length > 0 ? search.split(',') : []
        });
    };
    setData = (data) => {
        if (Array.isArray(data) && data.length > 0) {
            if (Object.keys(data).indexOf('key') < 0) {
                if (this.props.fieldNames) {
                    this.setState({
                        data: data.map(item => {
                            return {
                                key: item[this.props.fieldNames.key],
                                ...item
                            }
                        })
                    })
                }
            }
        }
    };
    componentDidUpdate(prevProps) {
        if (!_.isEqual(prevProps.columns, this.props.columns)) {
            this.setColumns(this.props.columns);
        }
        if (!_.isEqual(prevProps.data, this.props.data)) {
            this.setData(this.props.data);
        }
        if (!_.isEqual(this.props.value, this.state.targetKeys)) {
            this.setState({
                targetKeys: this.props.value
            })
        }
    }
    componentDidMount() {
        this.setColumns(this.props.columns);
        this.setData(this.props.data);
        this.setState({
            targetKeys: this.props.value
        })
    }
    render() {
        if (window.abc) {
            console.log(`render-transfer-${this.props.nodeKey}`);
        }
        const {
            targetKeys
        } = this.state;
        return (
            <TableTransfer
                className="modo-transfer"
                rowKey={this.props.fieldNames.key}
                showFooter
                showSearch
                searchPlaceholder={this.props.searchPlaceholder || "请输入关键字"}
                pageSize={this.props.pageSize}
                listStyle={{
                    height: this.props.height,
                }}
                height={this.props.height}
                titleTexts={this.props.titleTexts}
                dataSource={this.state.data || []}
                targetKeys={targetKeys}
                sourceColumns={this.state.columns}
                targetColumns={this.state.columns}
                onChange={this.setTargetKeys}
                onSearch={(value, type) => {
                    const obj = {};
                    obj[type] = value.toLocaleLowerCase();
                    obj.currentType = type;
                    obj.loading = true;
                    this.setState(obj);
                }}
                filterOption={(inputValue, item) => {
                    let visible = false;
                    const input = this.state[this.state.currentType];
                    if (this.state.searchIndexs.length > 0) {
                        this.state.searchIndexs.forEach(dataIndex => {
                            const col = item[dataIndex];
                            if(col && col.toLocaleLowerCase().indexOf(input) > -1) {
                                visible = true;
                            }
                        })
                    } else {
                        const col = item[this.state.dataIndexs[0]] || '';
                        if(col && col.toLocaleLowerCase().indexOf(input) > -1) {
                            visible = true;
                        }
                    }
                    return visible;
                }}
            />
        )
    }
}

export default ModoTransfer;
