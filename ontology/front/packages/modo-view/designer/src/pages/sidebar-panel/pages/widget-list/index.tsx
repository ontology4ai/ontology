import React, { useState, useEffect, useMemo } from 'react';
import widgetList from './list';
import iconMap from './icon';
import { Typography } from '@arco-design/web-react';
import { ReactSortable } from "react-sortablejs";
import './style/index.less';

require('static/guid.js');

class WidgetList extends React.Component {
    constructor(props: any) {
        super(props);
        const listMap = new Map();
        widgetList.forEach(list => {
            listMap.set(list.type, list);
        });
        this.state = {
            dragWidget: null,
            widgetList,
            listMap
        };
    }
    setList = (list, parent) => {
    };
    cloneWidget(item) {
        const id = guid();
        return {
            id,
            children: [],
            ...item
        };
    }
    render() {
        const { widgetList } = this.state;
        const { visible } = this.props;
        return (
            <div
                className="modo-design-widget-list"
                style={{
                    display: visible ? 'block' : 'none'
                }}>
                {widgetList.map((item : any) => {
                    return (
                        <div
                            key={item.type}
                            className="list-container">
                            <Typography.Text className="list-title">
                                {item.label}
                            </Typography.Text>
                            <ul
                                className="list-container">
                                <ReactSortable
                                    list={item.children}
                                    setList={(list) => {this.setList(list, item)}}
                                    animation={150}
                                    group={{ name: "cloning-group-name", pull: "clone", put: false }}

                                    sort={false}>
                                    {item.children.map((widget: any, index: number) => {
                                        return (
                                            <li
                                                key={widget.type}
                                                className="widget">
                                                {iconMap[widget.type]}
                                                <span>{widget.label}</span>
                                            </li>
                                        );
                                    })}
                                </ReactSortable>
                            </ul>
                        </div>
                    )
                })}
            </div>
        );
    }
}

export default WidgetList;
