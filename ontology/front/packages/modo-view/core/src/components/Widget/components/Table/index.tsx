import React , { useState, forwardRef } from 'react';
import { Grid, Table, Link, Typography, Dropdown, Menu, Button, Tooltip } from '@arco-design/web-react';
import { connect } from 'react-redux';
import wrapHOC from '../../hoc/wrap';
import execExp from 'packages/modo-view/designer/src/utils/execExpression';
import execMethod from 'packages/modo-view/designer/src/utils/execMethod';
import { Tag, Face } from 'modo-design';
import { IconTeam, IconRole, IconMoreCol, IconEdit, IconToggle } from 'modo-design/icon';
import * as Icon from 'modo-design/icon';
import cs from '@arco-design/web-react/es/_util/classNames';
import { Resizable } from 'react-resizable';
import ModoITable from '@/components/Table';
import downloadReport from '@/core/src/utils/downloadReport';
import useClassLocale from '@/utils/useClassLocale';
import { GlobalContext } from '@/utils/context';
import locale from './locale';

import './style/index.less';

const CustomResizeHandle = forwardRef((props, ref) => {
  const { handleAxis, ...restProps } = props;
  return (
    <span
      ref={ref}
      className={`react-resizable-handle react-resizable-handle-${handleAxis}`}
      {...restProps}
      onClick={(e) => {
        e.stopPropagation();
      }}
    />
  );
});

const ResizableTitle = (props) => {
  const { onResize, width, ...restProps } = props;
  const columnWidth = width ? Number(width) : null;
  if (!columnWidth) {
    return <th {...restProps} />;
  }
  return (
    <Resizable
      width={columnWidth}
      height={0}
      handle={<CustomResizeHandle />}
      onResize={onResize}
      draggableOpts={{
        enableUserSelectHack: false,
      }}
    >
      <th {...restProps} />
    </Resizable>
  );
};

class ModoTable extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            columns: [],
            data: [],
            total: 0,
            current: 1,
            pageSize: this.props.pagination.pageSize,
            selectedRowKeys: [],
            selectedRows: [],
            loading: false,
            origin: null,
            mergeCols: new Set()
        };
        this.currentRow = null;
        this.ref = React.createRef();
    }
    handleResize = (index) => {
        return (e, { size }) => {
            const prevColumns = this.state.columns;
            const nextColumns = [...prevColumns];
            nextColumns[index] = { ...nextColumns[index], width: size.width };
            this.setState({
                columns: nextColumns
            });
        };
    };
    isNull = (val) => {
        return val === null || val === undefined;
    };
    renderIndex = (value, index) => {
        return (
            <span
                className="column-index">
                {index + 1}
            </span>
        )
    };
    renderId = (value, index, column)  => {
        return (
            <Typography.Paragraph
                className="column-id"
                ellipsis={ column.noEllipsis ? false : {
                    rows: 1,
                    showTooltip: true,
                    expandable: false
                }}>
                {value}
            </Typography.Paragraph>
        )
    };
    renderPercent = (value, index, column, options) => {
        const num = this.isNull(options.percent) ? 2 : options.percent;
        return (
            <span
                className="column-percent">
                {parseFloat(value * 100).toFixed(num) + '%'}
            </span>
        )
    };
    renderLink = value => {
        const isNull = this.isNull(value);
        return (
            <Link
                disabled={isNull}>
                {!isNull ? value : '暂无数据'}
            </Link>
        );
    };
    renderUser = value => {
        return (
            <Face
                disabled={this.isNull(value)}
                text={!this.isNull(value) ? value : '未指定'}>
            </Face>
        );
    };
    renderRole = value => {
        return (
            <Tag
                effect="text"
                iconColor="arcoblue"
                disabled={this.isNull(value)}
                icon={<IconRole />}>
                {!this.isNull(value) ? value : '未指定'}
            </Tag>
        )
    };
    renderTeam = value => {
        return (
            <Tag
                effect="text"
                iconColor="arcoblue"
                disabled={this.isNull(value)}
                icon={<IconTeam />}>
                {!this.isNull(value) ? value : '暂未加入'}
            </Tag>
        )
    };
    renderTag = (value, effect, colors, icon, defaultColor) => {
        const TagIcon = Icon[icon];

        let color = defaultColor;
        if (value) {
            const colorMap = colors.find(item => {
                return item.value === value;
            });
            color = colorMap ? colorMap.color : defaultColor;
        }
        const isNull = this.isNull(value);
        return (
            <Tag
                effect={effect}
                color={!icon ? color : null}
                iconColor={icon ? color : null}
                icon={icon ? <TagIcon /> : null}
                disabled={isNull}>
                {!isNull ? value : '暂无数据'}
            </Tag>
        );
    };
    renderOperGroupColumn = (col, record, index) => {
        const actionShowNum = this.props.actionShowNumber || 1;
        const filterActions = this.props.actions.filter(action => {
            if (action.hiddenBindVar) {
                return !execExp({$this: this.props.get$this(), $row: record}, action.hiddenBindVar);
            } else {
                return !action.hidden;
            }
        });
        const actions = filterActions.slice(0, actionShowNum);
        const dropActions = filterActions.slice(actionShowNum);
        let MoreIcon;
        if (this.props.actionMoreShowType !== 'text') {
            MoreIcon = Icon[this.props.actionMoreIcon] || IconMoreCol;
        }
        return (
            <Button.Group>
                {
                    actions.map((action, index) => {
                        const BtnIcon = Icon[action.icon];
                        let disabled = action.disabled;
                        let label = action.label;
                        let tooltip = action.tooltip;
                        if (action.disabledBindVar) {
                            disabled = execExp({
                                $this: this.props.get$this(),
                                $row: record
                            }, action.disabledBindVar);
                        }
                        if (action.labelBindVar) {
                            label = execExp({
                                $this: this.props.get$this(),
                                $row: record
                            }, action.labelBindVar);
                        }
                        if (action.tooltipBindVar) {
                            tooltip = execExp({
                                $this: this.props.get$this(),
                                $row: record
                            }, action.tooltipBindVar);
                        }
                        return (
                            <Tooltip
                                content={tooltip}
                                disabled={!tooltip}>
                                <Button
                                    key={index}
                                    size="mini"
                                    type={action.type || 'secondary'}
                                    status={action.status || 'default'}
                                    disabled={disabled}
                                    icon={(action.icon && BtnIcon) ? <BtnIcon/> : null}
                                    children={!action.icon ? action.label : null}
                                    onClick={() => {
                                        this.currentRow = record;
                                        this.props.dispatchEvent(action.event, record, index)
                                    }}>
                                    {label}
                                </Button>
                            </Tooltip>
                        )
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
                                        let disabled = action.disabled;
                                        let label = action.label;
                                        let tooltip = action.tooltip;
                                        if (action.disabledBindVar) {
                                            disabled = execExp({
                                                $this: this.props.get$this(),
                                                $row: record
                                            }, action.disabledBindVar);
                                        }
                                        if (action.labelBindVar) {
                                            label = execExp({
                                                $this: this.props.get$this(),
                                                $row: record
                                            }, action.labelBindVar);
                                        }
                                        if (action.tooltipBindVar) {
                                            tooltip = execExp({
                                                $this: this.props.get$this(),
                                                $row: record
                                            }, action.tooltipBindVar);
                                        }

                                        return (
                                            <Menu.Item
                                                key={index}
                                                disabled={disabled}
                                                onClick={() => {
                                                    this.currentRow = record;
                                                    this.props.dispatchEvent(action.event, record, index);
                                                }}>
                                                {(action.icon && BtnIcon) ? <BtnIcon/> : null}
                                                {label}
                                            </Menu.Item>
                                        );
                                    })
                                }
                            </Menu>
                        }>
                        <Button
                            size="mini"
                            type='secondary'
                            icon={this.props.actionMoreShowType !== 'text' ? <MoreIcon /> : null}
                            children={this.props.actionMoreShowType === 'text' ? this.props.actionMoreText : null}/>
                    </Dropdown>
                    ) : null
                }
            </Button.Group>
        )
    };
    getMerge = (column) => {
        let rowSpanMap = {};
        let dataMap = {};
        let spanMap = {
            0: [],
            1: []
        };
        const {
            dataIndex
        } = column;
        const data = this.state.data || [];
        data.forEach((row, index) => {
            rowSpanMap[index] = 1;
            spanMap[1].push(index);
            if (index > 0) {
                if (row[dataIndex] === data[index - 1][dataIndex]) {
                    spanMap[1].pop();
                    spanMap[0].push(index);
                    rowSpanMap[index] = 0;
                    const lastIndex = spanMap[1][spanMap[1].length - 1];
                    if (data[lastIndex][dataIndex] === row[dataIndex]) {
                        dataMap[lastIndex] = dataMap[lastIndex] ? dataMap[lastIndex] + 1 : 2;
                    } else {
                        dataMap[index - 1] = 2;
                    }
                }
            }
        });
        return {
            rowSpanMap,
            dataMap
        }
    };
    getColumnObj = (merge, col, record, index, rowSpanMap, dataMap) => {
        const obj = {
            children: col,
            props: {},
        };
        if (merge) {
            if (rowSpanMap[index] === 1) {
                obj.props.rowSpan = dataMap[index] || 1;
            } else {
                obj.props.rowSpan = 0;
            }
        }
        return obj;
    };
    getColumns = (xcolumns) => {
        let dataColumns = xcolumns.filter((col) => {
            return this.isNull(col.hidden) ? true : !col.hidden;
        });
        if (this.props.showReport) {
            if (this.state.data && this.state.data.length > 0) {
                dataColumns = dataColumns.filter(column => {
                    return Object.keys(this.state.data[0]).indexOf(column.dataIndex) > -1;
                });
            }
        }
        const columns = dataColumns.map((column, index) => {
            let rest = {};
            if (this.props.resizable) {
                rest = {
                    onHeaderCell: (col) => ({
                        width: col.width,
                        onResize: this.handleResize(index)
                    })
                };
            }
            const {
                key,
                ...columnProps
            } = column;
            const children = this.getColumns(columnProps.children || []);
            const currentColumn = {
                ...columnProps,
                children: children.length === 0 ? undefined : children,
                width: column.width ? Number(column.width) : null,
                ellipsis: (
                    (!column.renderType && !column.render && !column.renderBindVar && !column.showAsTag)
                    || (column.renderType && column.renderType === 'id')
                ) ? false : !column.noEllipsis,
                ...rest,
                className: column.dataIndex,
                onCell: (record, index) => {
                    return {
                        onClick: (e) => {
                            this.currentRow = record;
                            column.event && this.props.dispatchEvent(column.event, record, index)
                        }
                    }
                },
                sorter: column.sorter,
                align: columnProps.align || this.props.align
            };
            let rowSpanMap = {};
            let dataMap = {};
            if (column.merge) {
                const merge = this.getMerge(column);
                rowSpanMap = merge.rowSpanMap;
                dataMap = merge.dataMap;

                this.state.mergeCols.add(column.title);
                this.setState({
                    mergeCols: this.state.mergeCols
                })
            }
            if (currentColumn.renderType) {
                let { renderType } = currentColumn;
                renderType = renderType.substring(0, 1).toLocaleUpperCase() + renderType.substring(1);
                currentColumn.render = (col, record, index) => {
                    const obj = this.getColumnObj(column.merge, col, record, index, rowSpanMap, dataMap);
                    const columnEl = this[`render${renderType}`](col, index, currentColumn, column);
                    obj.children = !this.isNull(columnEl) ? columnEl : '暂无数据';
                    return obj;
                }
            }
            if (currentColumn.renderBindVar) {
                currentColumn.render = (col, record, index) => {
                    const obj = this.getColumnObj(column.merge, col, record, index, rowSpanMap, dataMap);
                    let renderObj = {};
                    try {
                        const columnEl = execMethod({$this: this.props.get$this()}, currentColumn.renderBindVar, col, record, index);
                        renderObj = !this.isNull(columnEl) ? columnEl : '暂无数据';
                    } catch(e) {
                        renderObj = !this.isNull(col) ? col : '暂无数据'
                    }
                    if (typeof renderObj === 'object' && renderObj && Object.keys(renderObj).length < 3) {
                        obj.children = renderObj.children;
                        obj.props = renderObj.props;
                    } else {
                        obj.children = renderObj
                    }
                    return obj;
                }
            }
            if (currentColumn.showAsTag) {
                currentColumn.render = (col, record, index) => {
                    const obj = this.getColumnObj(column.merge, col, record, index, rowSpanMap, dataMap);
                    obj.children = this.renderTag(col, currentColumn.tagEffect, currentColumn.tagColors, currentColumn.tagIcon, currentColumn.tagColor);
                    return obj;
                }
            }


            if (!currentColumn.renderType && !currentColumn.render && !currentColumn.renderBindVar && !currentColumn.showAsTag) {
                currentColumn.render = (col, record, index) => {
                    const obj = this.getColumnObj(column.merge, col, record, index, rowSpanMap, dataMap);
                    obj.children = (
                        <Typography.Paragraph
                            ellipsis={column.noEllipsis ? false : {
                                rows: 1,
                                showTooltip: true,
                                expandable: false,
                                cssEllipsis: true
                            }}>
                            {col}
                        </Typography.Paragraph>
                    );
                    return obj;
                }
            }
            return currentColumn;
        });
        return columns;
    };
    parseColumns = () => {
        const columns = this.getColumns(this.props.columns);
        if (this.props.actions.length > 0) {
            columns.push({
                dataIndex: 'oper',
                title: this.tableT('操作'),
                width: this.props.actionWidth || 80,
                fixed: 'right',
                render: (col, record, index) => {
                    return this.renderOperGroupColumn(col, record, index)
                }
            })
        }

        this.setState({
            columns
        });
    };
    setLoading = (loading) => {
        if (!loading) {
            setTimeout(() => {
                this.setState({
                    loading
                })
            }, 500)
        } else {
            this.setState({
                loading
            })
        }
    };
    parseStoreData = () => {
        const tableStore = this.props.stores.find(store => {
            return store.id === this.props.store;
        });
        if (tableStore) {
            const tableData = this.props.get$this()[tableStore.name + 'Store'];
            if (tableData) {
                if (this.props.pagination.show) {
                    if (!Array.isArray(tableData) && tableData) {
                        this.setSelectedRows(tableData.root);
                        let current = this.state.current;
                        if (tableData.count === tableData.root.length) {
                            current = 1;
                        }
                        this.setState({
                            total: tableData.count,
                            data: tableData.root,
                            origin: tableData,
                            current
                        });
                        this.setLoading(tableData.loading);
                        return;
                    }
                }
                this.setSelectedRows(tableData.root);
                this.setState({
                    total: 0,
                    data: tableData.root,
                    origin: tableData,
                    current: 1
                });
                this.setLoading(tableData.loading);
            }
        }
    };
    parseData = () => {
        if (this.props.store) {
            this.parseStoreData();
            return;
        }
        if (this.props.pagination.show) {
            if (!Array.isArray(this.props.data) && this.props.data) {
                this.setSelectedRows(this.props.data.content);
                this.setState({
                    total: this.props.data.totalElements,
                    data: this.props.data.content,
                    current: this.props.data.pageable.pageNumber + 1,
                    pageSize: this.props.data.pageable.pageSize
                });
                return;
            }
        }
        this.setSelectedRows(this.props.data);
        this.setState({
            total: 0,
            data: this.props.data
        });
    };
    setSelectedRows = (data) => {
        const currentData = data || this.state.data;
        if (currentData && Array.isArray(this.selectedRowKeys) && this.props.rowKey) {
            this.selectedRows = currentData.filter(row => {
                return this.selectedRowKeys.indexOf(row[this.props.rowKey]) > -1
            });
            this.setState({
                selectedRows: this.selectedRows
            });
        }
    };
    diffStoreData = (prevProps, prevState) => {
        if (this.props.store && prevProps.store && this.props.store === prevProps.store) {
            const tableStore = this.props.stores.find(store => {
                return store.id === this.props.store;
            });
            if (tableStore) {
                const tableData = this.props.get$this()[tableStore.name + 'Store'];
                const prevTableData = this.state.origin;
                if (tableData) {
                    if (prevTableData) {
                        if (!_.isEqual(tableData, prevTableData)) {
                            this.parseData();
                        }
                    } else {
                        this.parseData();
                    }
                }
            }

        }
        if (this.props.store !== prevProps.store) {
            this.parseData();
        }
    };
    getInstColumns = () => {
        let cols = [];
        this.ref.current.ref.current.getRootDomElement().querySelector('thead').querySelectorAll('tr').forEach((el, i) => {
            const ths = el.querySelectorAll('th');
            if (!cols[i]) {
                cols.push([]);
            }
            let index = 0;
            ths.forEach((th, j) => {
                const rowspan = th.getAttribute('rowspan');
                const colspan = th.getAttribute('colspan');
                const text = th.querySelector('.arco-table-th-item-title').innerText;
                while(cols[i][index]) {
                    index += 1;
                }
                if (rowspan || colspan) {
                    if (rowspan) {
                        new Array(Number(rowspan)).fill(null).forEach((c, z) => {
                            if (cols[i+z]) {
                                cols[i+z][index] = text;
                            } else {
                                const arr = [];
                                arr[index] = text;
                                cols[i+z] = arr;
                            }
                        });
                        index+=1;
                    }
                    if (colspan) {
                        new Array(Number(colspan)).fill(null).forEach(z => {
                            cols[i][index] = text;
                            index+=1;
                        })
                    }
                } else {
                    cols[i][index] = text;
                    index+=1;
                }
            });
        });
        return cols;
    };
    getStoreColumns = () => {
        const {
            columns
        } = this.state;
        const storeColumns = JSON.parse(JSON.stringify(columns));
        const attrs = ['dataIndex', 'title', 'children'];
        function deleteAttr(node) {
            for (let key in node) {
                if (attrs.indexOf(key) < 0) {
                    delete node[key];
                }
            }
            if (Array.isArray(node.children)) {
                for (let child of node.children) {
                    deleteAttr(child);
                }
            }
        }
        for (let column of storeColumns) {
            deleteAttr(column);
        }
        return storeColumns;
    };
    getDownloadData = () => {
         const {
            data,
            columns,
            current,
            pageSize
        } = this.state;

        const {
            store,
            stores,
            nodes,
            pagination
        } = this.props;

        const headers = this.getInstColumns();

        let start = 0;
        let limit = 0;
        if (pagination.show) {
            // start = (current - 1) * pageSize;
            // limit = pageSize;
        }

        let colMergeIndex = [];

        Array.from(this.state.mergeCols).forEach(title => {
            let index = -1;
            for (let cols of headers) {
                const i = cols.indexOf(title);
                if (i > -1) {
                    index = i;
                }
            }
            colMergeIndex.push(index);
        });

        let params = {};

        const currentStore = stores.find(s => {
            return s.id === store;
        });
        if (currentStore.filterFormId) {
            const filterForm = this.props.get$this().$refs[nodes.byId[currentStore.filterFormId].name];
            params = filterForm.getReportFiltersValue();
        }
        const {
            node
        } = this.props;
        return {
            command: "download",
            dataSource: "",
            downloadConfig: [
                {
                    title: node.label,
                    showTitle: node.options.showTitle || false,
                    start,
                    limit,
                    // withPagination: pagination.show,
                    storeId: this.props.store,
                    headers,
                    colMergeIndex,
                    dataIndex: this.getStoreColumns(),
                    ...params
                }
            ]
        };
    };
    download = () => {
        const data = this.getDownloadData();
        const downloadConfig = {};
        downloadConfig[data.downloadConfig[0].title] = data.downloadConfig;
        data.downloadConfig = downloadConfig;
        downloadReport(data, `${this.props.node.label}.xls`);
    };
    componentDidUpdate = (prevProps, prevState) => {
        if (!_.isEqual(prevProps.data, this.props.data)) {
            this.parseData();
        }
        this.diffStoreData(prevProps, prevState);

        if ((!_.isEqual(prevProps.columns, this.props.columns)) ||
            (!_.isEqual(prevState.data, this.state.data)) ||
            (!_.isEqual(prevProps.actions, this.props.actions)) ||
            (prevProps.actionWidth !== this.props.actionWidth) ||
            (this.props.align !== prevProps.align)) {
            this.parseColumns();
        }
        if (this.props.rowSelection) {
            const {
                selectedRowKeys
            } = this.props.rowSelection;
            if (Array.isArray(selectedRowKeys) &&
                !_.isEqual(selectedRowKeys, this.selectedRowKeys) &&
                !_.isEqual(selectedRowKeys, prevProps.rowSelection.selectedRowKeys)
            ) {
                this.selectedRowKeys = selectedRowKeys || [];
                this.setSelectedRows();
                this.setState({
                    selectedRowKeys: this.selectedRowKeys || []
                });
            }
        }

    };
    componentDidMount() {
        this.parseData();
        this.parseColumns();
        this.props.dispatch({
            type: 'SETREF',
            name: this.props.name,
            ref: this
        });
        if (this.props.rowSelection) {
            const {
                selectedRowKeys
            } = this.props.rowSelection;
            if (Array.isArray(selectedRowKeys)) {
                this.selectedRowKeys = selectedRowKeys || [];
                this.setSelectedRows();
                this.setState({
                    selectedRowKeys: this.selectedRowKeys
                });
            }
        }

    }
    componentWillUnmount() {
        this.props.dispatch({
            type: 'DELETEREF',
            name: this.props.name
        });
    }
    render() {
        if (window.abc) {
            console.log(`render-table-${this.props.nodeKey}`);
        }
        const tableT = useClassLocale(this.context, locale);
        this.tableT = tableT;

        const {
            onMouseLeave,
            onMouseOver,
            onClick
        } = this.props;

        const {
            style,
            className,
            ...tableProps
        } = this.props;

        const rowKey = (record, x) => {
            return this.state.data.indexOf(record);
        };

        let resizableRest = {};

        if (this.props.resizable) {
            resizableRest = {
                border: true,
                borderCell: true,
                components: {
                    header: {
                        th: ResizableTitle,
                    }
                }
            }
        }

        let {
            loading,
            loadingTip
        } = tableProps;
        if (this.props.store) {
            loading = this.state.loading;
            loadingTip = undefined;
        }

        return (
            <div
                className={className}
                style={{
                    ...style
                }}
                onMouseLeave={onMouseLeave}
                onMouseOver={onMouseOver}
                onClick={onClick}>
                {(tableProps.showTitle || tableProps.showDownload) && (
                    <div
                        className="table-header"
                        style={{
                            paddingBottom: '10px'
                        }}>
                        {tableProps.showTitle && (
                            <span
                                className="table-title"
                                style={{
                                    textAlign: tableProps.titleAlign
                                }}>
                                {this.props.node.label}
                            </span>
                        )}
                        {tableProps.showDownload && (
                            <Button
                                className="download-btn"
                                onClick={this.download}>
                                {tableProps.downloadText || '报表下载'}
                            </Button>
                        )}
                    </div>
                )}
                <ModoITable
                    ref={this.ref}
                    {...tableProps}
                    className={cs(
                        tableProps.className,
                        {
                            [`mini`]: tableProps.cellPadding === 'mini',
                            ['header-wrap']: tableProps.headerWrap,
                            ['automatic']: tableProps.automatic
                        }
                    )}
                    loading={{
                        loading,
                        tip: loadingTip
                    }}
                    rowKey={this.props.rowKey || rowKey}
                    columns={this.state.columns}
                    {...resizableRest}
                    pagePosition="bl"
                    pagination={this.props.pagination.show ? {
                        ...this.props.pagination,
                        total: this.state.total,
                        current: this.state.current,
                        pageSize: this.state.pageSize,
                        sizeOptions: [5, 10, 15, 20, 25, 30, 40, 50]
                    } : false}
                    data={this.state.data}
                    onRow={(record, index) => {
                        return {
                            ...tableProps.onRow,
                            onClick: (event) => {
                                this.currentRow = record;
                                tableProps.onRow && typeof tableProps.onRow.onClick === 'function' && tableProps.onRow.onClick(record, index);
                            }
                        }
                    }}
                    rowSelection={this.props.rowSelect ? {
                        type: 'checkbox',
                        selectedRowKeys: this.state.selectedRowKeys,
                        checkboxProps: tableProps.rowSelection && tableProps.rowSelection.checkboxProps,
                        onChange: (selectedRowKeys, selectedRows) => {
                            this.setState({
                                selectedRows,
                                selectedRowKeys
                            });
                            this.selectedRows = selectedRows;
                            this.selectedRowKeys = selectedRowKeys;
                            tableProps.rowSelection && typeof tableProps.rowSelection.onChange === 'function' && tableProps.rowSelection.onChange(selectedRowKeys, selectedRows)
                        }
                    } : undefined}
                    onChange={(...args) => {
                        if (typeof tableProps.onChange === 'function') {
                            tableProps.onChange(...args);
                        } else {
                            const relaStore = this.props.stores.find(store => {
                                return store.id === this.props.store
                            });
                            if (relaStore) {
                                const sortObj = {};
                                if (args[1].field) {
                                    sortObj.sort = args[1].direction == 'ascend' ? args[1].field : `-${args[1].field}`
                                }
                                this.props.get$this().datasourceMap[relaStore.name]({
                                    start: (args[0].current - 1) * args[0].pageSize,
                                    limit: args[0].pageSize,
                                    ...sortObj
                                }).then(res => {
                                    if (res && typeof res === 'object' && res.data && res.data.success) {
                                        this.setState({
                                            current: args[0].current,
                                            pageSize: args[0].pageSize
                                        });
                                    }
                                });
                            }
                        }
                    }}/>
            </div>
        )
    }
}

ModoTable.contextType = GlobalContext;

export default wrapHOC(ModoTable, 'table');
