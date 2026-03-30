import React, { useState, useEffect, useMemo, forwardRef, useRef } from 'react';
import { Table, Drawer, Switch } from "@arco-design/web-react";
import { IconTick } from 'modo-design/icon';
import { Resizable } from 'react-resizable';
import { IconSetting } from 'modo-design/icon';
import TableSize1 from './imgs/TableSize1.svg';
import TableSize2 from './imgs/TableSize2.svg';
import './style/index.less';
import TitleTips from './titleTips';

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
    const {
        onResize,
        onResizeStart,
        onResizeStop,
        width,
        extendClassName,
        tableProps: outerProps,
        borderCell,
        ...restProps
    } = props;
    let columnWidth = width ? Number(width) : 0;
    /* if (!columnWidth) {
        return <th {...restProps} />;
    } */
  const titleTips = outerProps?.columns.find((i) => i.dataIndex === extendClassName)?.titleTips;
  if (titleTips) {
    restProps.children = <TitleTips titleTips={titleTips}>{restProps.children}</TitleTips>;
  }
    const thRef = useRef();
    if (thRef.current && !columnWidth) {
        columnWidth = thRef.current.offsetWidth;
    }
    return borderCell ? (
        <Resizable
            width={columnWidth}
            height={0}
            handle={<CustomResizeHandle />}
            onResize={onResize}
            onResizeStart={onResizeStart}
            onResizeStop={onResizeStop}
            draggableOpts={{
                enableUserSelectHack: false,
            }}>
            <th
                ref={thRef}
                {...restProps}
                className={[restProps.className, extendClassName].join(' ')} />
        </Resizable>
    ): <th
    ref={thRef}
    {...restProps}
    className={[restProps.className, extendClassName].join(' ')} />
};

class ModoTable extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            widthMap: {},
            settingVisible: false,
            dragging: false,
            originColumnVisibleMap: {},
            columnVisibleMap: {},
            size: 'default',
            hiddenFooter: false,
            form: {
                size: 'default',
                columnVisibleMap: {}
            }
        };
        this.ref = React.createRef();
        this.line = null;
    }
    handleResize = (index, column) => {
        return (e, { size }) => {
            const root = this.ref.current.getRootDomElement().querySelector('.arco-table-container');;
            const rect = root.getBoundingClientRect();
            this.line.style.left = (e.clientX - rect.x) + 'px';
            /* const column = this.props.columns[index];
            let widthMap = {};
            widthMap[column.dataIndex] = size.width;
            this.setState(prevState => {
                return {
                    widthMap: {
                        ...this.state.widthMap,
                        ...widthMap
                    }
                };
            })*/
        };
    }
    handleResizeStart = (index, column) => {
        return (e, data) => {
            const root = this.ref.current.getRootDomElement().querySelector('.arco-table-container');;
            const rect = root.getBoundingClientRect();
            this.setState(prevState => {
                return {
                    originX: e.clientX,
                    dragging: true
                }
            })
            const line = document.createElement('div');
            line.className = 'line';
            line.style.position = 'absolute';
            line.style.top = '0px';
            line.style.left = `${e.clientX - rect.x}px`;
            line.style.width = '0.5px';
            line.style.height = '100%';
            line.style.background = 'var(--color-neutral-3)';
            this.line && this.line.remove();
            root.appendChild(line);
            this.line = line;
        }
    }
    handleResizeStop = (index, column) => {
        return (e, data) => {
            const gap = e.clientX - this.state.originX;
            const root = this.ref.current.getRootDomElement().querySelector('.arco-table-container');
            let widthMap = {};
            const th = root.querySelector(`th.${column.dataIndex}`);
            try {
                const { offsetWidth } = th;
                widthMap[column.dataIndex] = offsetWidth + gap;
                this.setState(prevState => {
                    return {
                        widthMap: {
                            ...this.state.widthMap,
                            ...widthMap
                        },
                        originX: 0,
                        dragging: false
                    };
                });
            } catch(e) {
                this.setState(prevState => {
                    return {
                        originX: 0,
                        dragging: false
                    };
                })
            }
            this.line.remove();
            this.line = null;
        }
    }
    getScrollVal = (val) => {
        if (val === 'true') {
            return true;
        } else if (val === 'false') {
            return false;
        } else {
            return val;
        }
    }
    getScroll = () => {
        if (this.props.scroll) {
            const {
                x,
                y
            } = this.props.scroll;
            return {
                x: this.getScrollVal(x),
                y: this.getScrollVal(y)
            }
        }
        return undefined
    }
    initColumnVisibleMap = () => {
        let obj = {};
        const {
            columnVisibleMap,
            originColumnVisibleMap
        } = this.state;
        this.props.columns.forEach(column => {
            originColumnVisibleMap[column.dataIndex] = column.defaultHidden ? false : true;
            if (!(column.dataIndex in columnVisibleMap)) {
                obj[column.dataIndex] = originColumnVisibleMap[column.dataIndex];
            }
        })
        this.setState({
            originColumnVisibleMap: {
                ...originColumnVisibleMap
            },
            columnVisibleMap: {
                ...columnVisibleMap,
                ...obj
            }
        })
    }
    backDefault = () => {
        let obj = {};
        const {
            originColumnVisibleMap
        } = this.state;
        this.props.columns.forEach(column => {
            obj[column.dataIndex] = originColumnVisibleMap[column.dataIndex];
        })
        this.setState({
            columnVisibleMap: obj
        })
    }
    componentDidMount() {
        this.initColumnVisibleMap();
        this.setState({hiddenFooter: this.props.hiddenFooter});
    }
    componentDidUpdate(prevProps) {
        const columns = this.props.columns.map(col => {
            return {
                dataIndex: col.dataIndex,
                defaultHidden: col.defaultHidden
            }
        })
        const prevColumns = prevProps.columns.map(col => {
            return {
                dataIndex: col.dataIndex,
                defaultHidden: col.defaultHidden
            }
        })
        if (JSON.stringify(columns) !== JSON.stringify(prevColumns)) {
            this.initColumnVisibleMap();
        }
    }
    render() {
        let scroll = this.getScroll();
        let {
            border,
            borderCell
        } = this.props;
        const {
            size,
            columnVisibleMap,
            form,
            hiddenFooter
        } = this.state;
        border = (border !== null && border !== undefined) ? border : true;
        borderCell = (borderCell !== null && borderCell !== undefined) ? borderCell : true;
        let header = {};

        header = {
            th: ResizableTitle
        };

        return (
            <>
            <Table
                ref={this.ref}
                {...this.props}
                border={border}
                rowKey={this.props?.rowKey || '_id_'}
                borderCell={borderCell}
                scroll={scroll}
                className={[
                    this.state.dragging ? 'disable-select' : '',
                    this.props.className,
                    size === 'large' ? 'table-size-large' : '',
                    (scroll && scroll.y === true ? 'modo-table-scroll' : '')
                ].join(' ')}
                components={
                    this.props?.components
                    ? this.props?.components
                    : {
                        header: {
                            ...header
                        }
                    } 
             }
                columns={this.props.columns.filter(column => {
                    if (column.dataIndex in columnVisibleMap) {
                        return columnVisibleMap[column.dataIndex]
                    }
                    return true
                }).map(column => {
                    return {
                        ...column,
                        key:column.dataIndex,
                        width: this.state.widthMap[column.dataIndex] || column.width,
                        onHeaderCell: (col, index) => ({
                            width: col.width,
                            extendClassName: column.dataIndex,
                            tableProps: this.props,
                            borderCell,
                            onResize: this.handleResize(index, column),
                            onResizeStart: this.handleResizeStart(index, column),
                            onResizeStop: this.handleResizeStop(index, column)
                        })
                    }
                })}
                footer={() => {
                    return (!hiddenFooter)&&<div
                        className="modo-table-column-setting">
                        <IconSetting
                            onClick={() => {
                                this.setState({
                                    settingVisible: true,
                                    form: {
                                        size,
                                        columnVisibleMap: {
                                            ...columnVisibleMap
                                        }
                                    }
                                })
                            }}/>
                    </div>
                }}
                />
                <Drawer
                    className="modo-table-column-setting-drawer"
                    width={350}
                    title={(
                        <span>表格配置</span>
                    )}
                    visible={this.state.settingVisible}
                    onOk={() => {
                        this.setState(() => {
                            return {
                                settingVisible: false,
                                size: form.size,
                                columnVisibleMap: {
                                    ...form.columnVisibleMap
                                }
                            }
                        }, () => {
                            this.ref.current.getRootDomElement().style.paddingTop = '0.5px';
                            this.ref.current.getRootDomElement().style.opacity = 0.5;
                            setTimeout(() => {
                                this.ref.current.getRootDomElement().style.paddingTop = '0px';
                                this.ref.current.getRootDomElement().style.opacity = 1;
                            }, 300);
                        })
                    }}
                    onCancel={() => {
                        this.setState({
                            settingVisible: false
                        })
                    }}>
                    <div
                        className="table-size-container">
                        <div
                            className="table-size-title">
                            <span className="title">
                                显示密度
                            </span>
                        </div>
                        <div
                            className="table-size-content">
                            <div
                                className="group">
                                <div
                                    className={[
                                        'item',
                                        form.size === 'large' ? 'checked' : ''
                                    ].join(' ')}
                                    onClick={() => {
                                        this.setState({
                                            form: {
                                                ...form,
                                                size: 'large'
                                            }
                                        })
                                    }}>
                                    <img src={TableSize1}/>
                                    <div
                                        className="check-icon">
                                        <IconTick />
                                    </div>
                                </div>
                                <div
                                    className={[
                                        'item',
                                        form.size === 'default' ? 'checked' : ''
                                    ].join(' ')}
                                    onClick={() => {
                                        this.setState({
                                            form: {
                                                ...form,
                                                size: 'default'
                                            }
                                        })
                                    }}>
                                    <img src={TableSize2}/>
                                    <div
                                        className="check-icon">
                                        <IconTick />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div
                        className="column-list-title">
                        <span
                            className="title">
                            表头设置
                        </span>
                        <span
                            className="back-default"
                            onClick={() => {
                                this.backDefault()
                            }}>
                            恢复默认
                        </span>
                    </div>
                    <div
                        className="column-list">
                        {
                            this.props.columns.map(column => {
                                return (
                                    <div className="column-item" key={column.dataIndex}>
                                        <span
                                            className="column-title">
                                            {column.title}
                                        </span>
                                        <Switch
                                            checked={form.columnVisibleMap[column.dataIndex]}
                                            size="small"
                                            onChange={val => {
                                                let obj = {};
                                                obj[column.dataIndex] = val;
                                                this.setState({
                                                    form: {
                                                        ...form,
                                                        columnVisibleMap: {
                                                            ...form.columnVisibleMap,
                                                            ...obj
                                                        }
                                                    }
                                                })
                                            }}/>
                                    </div>
                                )
                            })
                        }
                    </div>
              </Drawer>
            </>
        );
    }
}

export default ModoTable;
