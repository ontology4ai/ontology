import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@arco-design/web-react';
import './style/index.less';
import { IconPlus, IconMinus } from 'modo-design/icon';

import DoubleTreeLayout from './extensions/DoubleTreeLayout';

const global = require('global');
if (!global.go) {
  const go = require('../../../public/static/gojs/go.js');
} else {
  const { go } = global;
}


const icons = {
    minus: `M6,11.25 C3.1125,11.25 0.75,8.8875 0.75,6 C0.75,3.1125 3.1125,0.75 6,0.75 C8.8875,0.75 11.25,3.1125 11.25,6 C11.25,8.8875 8.8875,11.25 6,11.25 Z M6,10.2 C8.31,10.2 10.2,8.31 10.2,6 C10.2,3.69 8.31,1.8 6,1.8 C3.69,1.8 1.8,3.69 1.8,6 C1.8,8.31 3.69,10.2 6,10.2 Z M3.375,5.475 L8.625,5.475 L8.625,6.525 L3.375,6.525 L3.375,5.475 Z`,
    plus: `M5.46428571,5.46428571 L5.46428571,3.375 L6.53571429,3.375 L6.53571429,5.46428571 L8.625,5.46428571 L8.625,6.53571429 L6.53571429,6.53571429 L6.53571429,8.625 L5.46428571,8.625 L5.46428571,6.53571429 L3.375,6.53571429 L3.375,5.46428571 L5.46428571,5.46428571 Z M6,11.25 C3.10714286,11.25 0.75,8.89285714 0.75,6 C0.75,3.10714286 3.10714286,0.75 6,0.75 C8.89285714,0.75 11.25,3.10714286 11.25,6 C11.25,8.89285714 8.89285714,11.25 6,11.25 Z M6,10.1785714 C8.30357143,10.1785714 10.1785714,8.30357143 10.1785714,6 C10.1785714,3.69642857 8.30357143,1.82142857 6,1.82142857 C3.69642857,1.82142857 1.82142857,3.69642857 1.82142857,6 C1.82142857,8.30357143 3.69642857,10.1785714 6,10.1785714 Z`
}

class TreeChart extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            visible: true,
            data: {
                "class": "go.TreeModel",
                "nodeDataArray": this.parseData()
            }
        }
        this.diagramRef = React.createRef();
        this.contextMenuRef = React.createRef();
        this.diagram = null;


        const $ = go.GraphObject.make;
        this.layout = {
            'TreeLayout': $(go.TreeLayout, {
                treeStyle: this.props.treeLayoutType ? go.TreeLayout[this.props.treeLayoutType] : go.TreeLayout.StyleRootOnly,
                arrangement: go.TreeLayout.ArrangementHorizontal,
                angle: 90,
                layerSpacing: 50,
                nodeSpacing: 20,
                nodeIndentPastParent: 0.0,
                alternateAngle: 0,
                alternateAlignment: go.TreeLayout.AlignmentStart,
                alternateNodeIndent: 20,
                alternateNodeIndentPastParent: 1.0,
                alternateNodeSpacing: 20,
                alternateLayerSpacing: 30,
                alternateLayerSpacingParentOverlap: 1.0,
                alternatePortSpot: new go.Spot(0.01, 1, 10, 0),
                alternateChildPortSpot: go.Spot.Left,
                layerStyle: go.TreeLayout.LayerSiblings,
                assignTreeVertexValues: (v) => {
                    if (typeof this.props.nodeSpacingFormatter === 'function') {
                        v.nodeSpacing = this.props.nodeSpacingFormatter(v.node.part.data) || 20
                    }
                }
            }),
            'DoubleTreeLayout': $(
                DoubleTreeLayout, {
                directionFunction: function(n) {
                    return n.data && n.data.dir !== "left";
                }
            })
        }
    }
    defineFigure = () => {
        const $ = go.GraphObject.make;

        go.Shape.defineFigureGenerator('ModoRoundedRectangle', (shape, w, h) => {
            let p1 = 4; // default corner size
            if (shape !== null) {
                const param1 = shape.parameter1;
                if (!isNaN(param1) && param1 >= 0) p1 = param1; // can't be negative or NaN
            }
            p1 = Math.min(p1, w / 2);
            p1 = Math.min(p1, h / 2); // limit by whole height or by half height?
            const geo = new go.Geometry();
            // a single figure consisting of straight lines and quarter-circle arcs
            geo.add(new go.PathFigure(0, p1)
                .add(new go.PathSegment(go.PathSegment.Arc, 180, 90, p1, p1, p1, p1))
                .add(new go.PathSegment(go.PathSegment.Line, w - p1, 0))
                .add(new go.PathSegment(go.PathSegment.Arc, 280, 90, w - p1, p1, p1, p1))
                .add(new go.PathSegment(go.PathSegment.Line, w, h))
                .add(new go.PathSegment(go.PathSegment.Arc, 0, 90, w - p1, h - p1, p1, p1))
                .add(new go.PathSegment(go.PathSegment.Line, p1, h))
                .add(new go.PathSegment(go.PathSegment.Arc, 90, 90, p1, h - p1, p1, p1).close()));
            // don't intersect with two top corners when used in an "Auto" Panel
            geo.spot1 = new go.Spot(0, 0, 0.3 * p1, 0.3 * p1);
            geo.spot2 = new go.Spot(1, 1, -0.3 * p1, 0);
            return geo;
        });

        go.Shape.defineFigureGenerator("RoundedRectangle", function(shape, w, h) {
            // this figure takes one parameter, the size of the corner
            var p1 = 4; // default corner size
            if (shape !== null) {
                var param1 = shape.parameter1;
                if (!isNaN(param1) && param1 >= 0) p1 = param1; // can't be negative or NaN
            }
            p1 = Math.min(p1, w / 2);
            p1 = Math.min(p1, h / 2); // limit by whole height or by half height?
            var geo = new go.Geometry();
            // a single figure consisting of straight lines and quarter-circle arcs
            geo.add(new go.PathFigure(0, p1)
                .add(new go.PathSegment(go.PathSegment.Arc, 180, 90, p1, p1, p1, p1))
                .add(new go.PathSegment(go.PathSegment.Line, w - p1, 0))
                .add(new go.PathSegment(go.PathSegment.Arc, 270, 90, w - p1, p1, p1, p1))
                .add(new go.PathSegment(go.PathSegment.Arc, 0, 90, w - p1, h - p1, p1, p1))
                .add(new go.PathSegment(go.PathSegment.Arc, 90, 90, p1, h - p1, p1, p1).close()));
            // don't intersect with two top corners when used in an "Auto" Panel
            geo.spot1 = new go.Spot(0, 0, 0.3 * p1, 0.3 * p1);
            geo.spot2 = new go.Spot(1, 1, -0.3 * p1, 0);
            return geo;
        });
    }
    init = () => {
        const $ = go.GraphObject.make;

        this.defineFigure();

        const layoutType = this.props.layoutType || 'TreeLayout';
        const expand = (this.props.expand !== null || this.props.expand !== undefined) ? this.props.expand : true;

        this.diagram = $(
            go.Diagram,
            this.diagramRef.current,
            {
                allowCopy: false,
                allowDelete: false,
                maxSelectionCount: 1,
                validCycle: go.Diagram.CycleDestinationTree,
                "clickCreatingTool.archetypeNodeData": {
                    name: "(new person)",
                    title: "",
                    comments: ""
                },
                "clickCreatingTool.insertPart": function(loc) {
                    const node = go.ClickCreatingTool.prototype.insertPart.call(this, loc);
                    if (node !== null) {
                        this.diagram.select(node);
                        this.diagram.commandHandler.scrollToPart(node);
                        // this.diagram.commandHandler.editTextBlock(node.findObject("NAMETB"));
                    }
                    return node;
                },
                layout: this.layout[layoutType],
                "undoManager.isEnabled": true // enable undo & redo
            }
        );
        const diagram = this.diagram;

        const levelColors = ["#165DFF", "#4E5969", "#E5E6EB"];

        function mayWorkFor(node1, node2) {
            if (!(node1 instanceof go.Node)) return false;
            if (node1 === node2) return false;
            if (node2.isInTreeOf(node1)) return false;
            return true;
        }

        function textStyle() {
            return { font: "9pt  Segoe UI,sans-serif", stroke: "white" };
        }

        function findHeadShot(pic) {
            if (!pic) return "images/HSnopic.png";
            return "images/HS" + pic;
        }

        function tooltipTextConverter(person) {
            var str = "";
            str += "描述: " + person.descr;
            return str;
        }

        var tooltiptemplate = $(
            "ToolTip", {
                "Border.fill": "whitesmoke",
                "Border.stroke": "black"
            },
            $(
                go.TextBlock,
                {
                    font: "bold 8pt Helvetica, bold Arial, sans-serif",
                    wrap: go.TextBlock.WrapFit,
                    margin: 5
                },
                new go.Binding("text", "", tooltipTextConverter)
            )
        );

        function hideCX() {
            if (diagram.currentTool instanceof go.ContextMenuTool) {
                diagram.currentTool.doCancel();
            }
        }
        const showContextMenu = (obj, diagram, tool) => {
            var cxElement = this.contextMenuRef.current;
            cxElement.classList.add("show-menu");
            var mousePt = diagram.lastInput.viewPoint;
            cxElement.style.left = mousePt.x + 5 + "px";
            cxElement.style.top = mousePt.y + "px";
            window.addEventListener("pointerdown", hideCX, true);
        }

        const hideContextMenu = () => {
            var cxElement = this.contextMenuRef.current;
            cxElement.classList.remove("show-menu");
            window.removeEventListener("pointerdown", hideCX, true);
        }

        const myContextMenu = $(go.HTMLInfo, {
            show: showContextMenu,
            hide: hideContextMenu
        });

        this.diagram.nodeTemplate = $(
            go.Node,
            "Spot",
            {
                selectionObjectName: "BODY",
                mouseDragEnter: (e, node, prev) => {
                    const diagram = node.diagram;
                    const selnode = diagram.selection.first();
                    if (!mayWorkFor(selnode, node)) return;
                    const shape = node.findObject("SHAPE");
                    if (shape) {
                        shape._prevFill = shape.fill;
                        shape.fill = "darkred";
                    }
                },
                mouseDragLeave: (e, node, next) => {
                    const shape = node.findObject("SHAPE");
                    if (shape && shape._prevFill) {
                        shape.fill = shape._prevFill;
                    }
                },
                mouseDrop: (e, node) => {
                    const diagram = node.diagram;
                    const selnode = diagram.selection.first();
                    if (mayWorkFor(selnode, node)) {
                        const link = selnode.findTreeParentLink();
                        if (link !== null) {
                            link.fromNode = node;
                        } else {
                            diagram.toolManager.linkingTool.insertLink(node, node.port, selnode, selnode.port);
                        }
                    }
                },
                click: (e, node) => {
                    typeof this.props.click === 'function' && this.props.click(e, node);
                },
                doubleClick: (e, node) => {
                    typeof this.props.dblclick === 'function' && this.props.dblclick(e, node);
                },
                deletable: false,
                toolTip: tooltiptemplate
            },
            new go.Binding("text", "name"),
            new go.Binding("layerName", "isSelected", sel => sel ? "Foreground" : "").ofObject(),
            $(
                go.Panel,
                "Auto",
                {
                    name: "BODY",
                },
                $(
                    go.Shape,
                    // "ModoRoundedRectangle",
                    "RoundedRectangle",
                    {
                        name: "SHAPE",
                        height: 28,
                        fill: "#94BFFF",
                        stroke: 'transparent',
                        strokeWidth: 1,
                        portId: ""
                    },
                    new go.Binding("fill", "name", (text, node) => {
                        const { data } = node.part;
                        if (typeof this.props.bgFormatter === 'function') {
                            return this.props.bgFormatter(data);
                        }
                        if (levelColors[data.lvl]) {
                            return levelColors[data.lvl]
                        } else {
                            return '#f2f3f5'
                        }
                    }),
                    new go.Binding("height", "name", (text, node) => {
                        if (typeof this.props.heightFormatter === 'function') {
                            return this.props.heightFormatter(node.part.data);
                        }
                        return 28
                    }),
                    new go.Binding("stroke", "name", (text, node) => {
                        if (typeof this.props.strokeFormatter === 'function') {
                            return this.props.strokeFormatter(node.part.data);
                        }
                        return '#fff'
                    }),
                    new go.Binding("margin", "name", (text, node) => {
                        if (layoutType === 'TreeLayout') {
                            const { data } = node.part;
                            const level = data.lvl;
                            if (level < 2) {
                                if (!data.hasChildren) {
                                    if (expand) {
                                        return new go.Margin(12, 0, 0, 0);
                                    } else {
                                        return new go.Margin(6, 0, 0, 0);
                                    }

                                }
                                return new go.Margin(6, 0, 0, 0);
                            } else {
                                if (data.hasChildren) {
                                    return new go.Margin(0, 0, 0, 6);
                                } else {
                                   return new go.Margin(0, 0, 0, 6);
                                }
                            }
                        }
                    })
                ),
                $(
                    go.Panel,
                    "Horizontal",
                    $(
                        go.Panel,
                        "Table",
                        {
                            name: "TABLE",
                            // minSize: new go.Size(130, NaN),
                            // maxSize: new go.Size(150, NaN),
                            defaultAlignment: go.Spot.Left
                        },
                        new go.Binding("margin", "name", (text, node) => {
                            const { data } = node.part;
                            if (layoutType === 'TreeLayout') {

                                const level = data.lvl;
                                if (level < 2) {
                                    return new go.Margin(4, 10, 4, 10);
                                } else {
                                    if (data.hasChildren) {
                                        return new go.Margin(4, 10, 4, 10)
                                    } else {
                                        return new go.Margin(4, 10, 4, 10)
                                    }
                                }
                            }

                            if (!data.hasChildren) {
                                return new go.Margin(0, 8, 0, 8)
                            } else {
                                if (expand) {
                                    return new go.Margin(0, 8, 0, 20)
                                }
                                return new go.Margin(0, 8, 0, 8)
                            }

                        }),
                        $(go.RowColumnDefinition, { column: 1, width: 4 }),
                        $(
                            go.Picture,
                            {
                                name: "Picture",
                                desiredSize: new go.Size(14, 14),
                                margin: new go.Margin(-2, 8, 0, 0),
                            },
                            new go.Binding("source", null, (text, node) => {
                                if (typeof this.props.iconFormatter === 'function') {
                                    return this.props.iconFormatter(node.part.data);
                                }
                                return null;
                            })
                        ),
                        $(
                            go.TextBlock,
                            {
                                name: "TITLELABEL",
                                font: "9pt  Segoe UI,sans-serif",
                                stroke: "white"
                            },  // the name
                            /* new go.Binding("stroke", "name", (data, node) => {
                                const name = node.part.data.name;
                                if (['root', 'topic', 'lvl', 'sys', 'db'].indexOf(name) > -1) {
                                    return '#FFFFFF'
                                }
                                return '#4E5969'
                            }), */
                            {
                                name: "NAMETB",
                                row: 0,
                                column: 0,
                                columnSpan: 5,
                                font: "12px SourceHanSansCN-Regular, SourceHanSansCN",
                                editable: false,
                                isMultiline: false,
                                minSize: new go.Size(50, 16),
                                stroke: 'red'
                            },
                            new go.Binding("text", "label").makeTwoWay(),
                            new go.Binding("stroke", null, (text, node) => {
                                const { data } = node.part;
                                if (typeof this.props.colorFormatter === 'function') {
                                    return this.props.colorFormatter(data);
                                }
                                const level = data.lvl;
                                if (level < 2) {
                                    return '#FFFFFF';
                                } else {
                                    return '#4E5969'
                                }
                            }),
                            new go.Binding("margin", null, (text, node) => {
                                let icon;
                                if (typeof this.props.iconFormatter === 'function') {
                                    icon = this.props.iconFormatter(node.part.data);
                                }
                                if (icon) {
                                    return new go.Margin(0, 0, 0, 16);
                                } else {
                                    return new go.Margin(0, 0, 0, 0);
                                }
                            })
                        )
                    ))
                ),
                new go.Binding("isTreeExpanded").makeTwoWay(),
                $(
                    "TreeExpanderButton",
                    {
                        name: "EXPANDBUTTON",
                        "width": expand ? 12 : 0,
                        "height": expand ? 12 : 0,
                        "ButtonIcon.fill": "#FFFFFF",
                        "ButtonIcon.stroke": "#4E5969",
                        "ButtonIcon.strokeWidth": 1,
                        "ButtonBorder.stroke": "#4E5969",
                        "ButtonBorder.fill": "#FFFFFF",
                        "_buttonStrokeOver": "#4E5969",
                        "ButtonBorder.figure": "Circle",
                        "_treeExpandedFigure": "MinusLine",
                        "_treeCollapsedFigure": "PlusLine"
                    },
                    new go.Binding("alignment", "name", (text, node) => {
                        const { data } = node.part;
                        if (layoutType === 'TreeLayout') {
                            const { data } = node.part;
                            const level = data.lvl;
                            if (level < 2) {
                                return go.Spot.Top;
                            } else {
                                return go.Spot.Left;
                            }
                        }
                        return new go.Spot(0, 0.5, 12, 0);
                    }),
                    /* new go.Binding("width", null, (text, node) => {
                        if (layoutType === 'TreeLayout') {
                            return 12
                        } else {
                            return 0;
                        }
                    }),
                    new go.Binding("height", null, (text, node) => {
                        if (layoutType === 'TreeLayout') {
                            return 12
                        } else {
                            return 0;
                        }
                    }) */
                )
            );

        this.diagram.nodeTemplate.contextMenu = myContextMenu;

        this.diagram.linkTemplate = $(
            go.Link,
            go.Link.Orthogonal,
            { layerName: "Background", corner: 5 },
            $(go.Shape, { strokeWidth: 1, stroke: "#C9CDD4" })
        );

        this.load();

        if (window.Inspector) myInspector = new Inspector(
            "myInspector",
            this.diagram,
            {
                properties: {
                    "key": { readOnly: true },
                    "comments": {}
                }
            }
        );

    }
    zoomToFit = () => {
        this.diagram.commandHandler.zoomToFit()
    }
    centerNode = (key) => {
        this.diagram.scale = 1;
        this.diagram.commandHandler.scrollToPart(this.diagram.findNodeForKey(key));
    }
    scrollToNode = (key) => {
        this.diagram.commandHandler.scrollToPart(this.diagram.findNodeForKey(key));
    }
    load = () => {
        const data = JSON.parse(JSON.stringify(this.parseData()));
        this.diagram.model = go.Model.fromJson({
            "class": "go.TreeModel",
            "nodeDataArray": data
        });
        let lastkey = 1;
        this.diagram.model.makeUniqueKeyFunction = (model, data) => {
            let k = data.key || lastkey;
            while (model.findNodeDataForKey(k)) k++;
            data.key = lastkey = k;
            return k;
        };
    }
    loadData = (data) => {
        this.diagram.startTransaction("refresh");
        this.diagram.model.nodeDataArray = JSON.parse(JSON.stringify(data));
        this.diagram.commitTransaction("refresh");
        const root = data.find(item => {
            return !item.parent;
        });
    }
    cxcommand = (event) => {
        if (val === undefined) val = event.currentTarget.id;
        var diagram = this.diagram;
        switch (val) {
            case "cut": diagram.commandHandler.cutSelection(); break;
            case "copy": diagram.commandHandler.copySelection(); break;
            case "paste": diagram.commandHandler.pasteSelection(diagram.toolManager.contextMenuTool.mouseDownPoint); break;
            case "delete": diagram.commandHandler.deleteSelection(); break;
        }
        diagram.currentTool.stopTool();
    }
    dispatchEvent = (menu) => {
        let node = null;
        this.diagram.selection.each(function(part) {
            node = part;
        });
        typeof menu.event === 'function' && menu.event(node);
    }
    getSelection = () => {
        let node = null;
        this.diagram.selection.each(function(part) {
            node = part;
        })
        return node;
    }
    getNode = key => {
        return this.diagram.findNodeForKey(key);
    }
    addNode = (data, key) => {
        let node = this.getNode(data.parent || key);
        this.diagram.selection.each(function(part) {
            node = part;
        })
        if (!node) return;
        const thisemp = node.data;
        this.diagram.startTransaction("添加子节点");
        const newemp = {
            ...data
        };
        this.diagram.model.addNodeData(newemp);
        // const newnode = this.diagram.findNodeForData(newemp);
        // if (newnode) newnode.location = node.location;
        this.diagram.commitTransaction("添加子节点");
        // this.diagram.commandHandler.scrollToPart(newnode);
    }
    deleteNode = (key) => {
        let node = this.getNode(key);
        if (node !== null) {
            this.diagram.startTransaction("remove dept");
            this.diagram.removeParts(node.findTreeParts());
            this.diagram.commitTransaction("remove dept");
        }
    }
    parseLvl(data, lvl, lvlObj) {
        const parentField = (this.props.fieldNames && this.props.fieldNames.parent) || 'parent';
        const keyField = (this.props.fieldNames && this.props.fieldNames.key) || 'key';
        let keys = [];
        for (let index = 0; index < data.length; index++) {
            const node = data[index];
            if (lvl > 0 ) {
                if (lvlObj[lvl - 1].indexOf(node[parentField]) > -1) {
                    this.nodeMap[node[parentField]].hasChildren = true;
                    node.lvl = lvl;
                    keys.push(node[keyField]);
                    data.splice(index, 1);
                    index -= 1;
                }
            } else {
                if (node[parentField] === null || node[parentField] === undefined) {
                    node.lvl = lvl;
                    keys.push(node[keyField]);
                    data.splice(index, 1);
                    index -= 1;
                }
            }
        }
        lvlObj[lvl] = keys;
        lvl += 1;
        if (keys.length > 0 && data.length > 0) {
            this.parseLvl(data, lvl, lvlObj);
        }
    }
    parseDirData(data) {
        const parentField = (this.props.fieldNames && this.props.fieldNames.parent) || 'parent';
        const keyField = (this.props.fieldNames && this.props.fieldNames.key) || 'key';
        this.nodeMap = {};
        for (let node of data) {
            this.nodeMap[node[keyField]] = node;
        }
        const lvlObj = {};
        this.parseLvl([].concat(data), 0, lvlObj);

        const lvl2Node = data.filter(node => {
            return node.lvl === 1;
        }).forEach((node, index) => {
            node.dir = index % 2 === 1 ? 'left' : 'right';
            node.color = 'yellow'
        });

        return data;
    }
    parseData() {
        if (!Array.isArray(this.props.data)) {
            return this.parseDirData([]);
        }
        if (this.props.fieldNames) {
            return this.parseDirData(this.props.data.map(node => {
                return {
                    key: node[this.props.fieldNames.key || 'key'],
                    parent: node[this.props.fieldNames.parent || 'parent'],
                    label: node[this.props.fieldNames.label || 'label'],

                    ...node
                }
            }))
        }
        return this.parseDirData([...this.props.data]);
    }
    componentDidMount() {
        this.init()
    }
    componentDidUpdate(prevProps) {
        let change = false;
        [
            'fieldNames',
            'layoutType',
            'contextMenus',
            'heightFormatter',
            'bgFormatter',
            'strokeFormatter',
            'colorFormatter',
            'iconFormatter',
            'nodeSpacingFormatter'
        ].forEach(key => {
            let val = this.props[key];
            let prevVal = prevProps[key];
            val = typeof val === 'function' ? val.toString() : val;
            prevVal = typeof prevVal === 'function' ? prevVal.toString() : prevVal;
            if (!_.isEqual(val, prevVal)) {
                change = true;
            }
        });

        if (change) {
            if (this.diagram) {
                this.setState({
                    visible: false
                })
                setTimeout(() => {
                    this.setState({
                        visible: true
                    });
                    setTimeout(() => {
                        this.diagram.div = null
                        this.init();
                    })
                });
            }
        }
        if (JSON.stringify(this.props.data) !== JSON.stringify(prevProps.data)) {
            this.loadData(this.parseData());
        }
    }
    render() {
        const {
            data,
            contextMenus,
            ...props
        } = this.props;
        return (
            <div
                {...props}
                className={['modo-tree-chart', this.props.className].join(' ')}>
                {
                    this.state.visible &&  <div
                        className="diagram"
                        ref={this.diagramRef}>
                    </div>
                }
                <ul
                    id="contextMenu"
                    className="menu"
                    ref={this.contextMenuRef}>
                    {
                        this.props.contextMenus.map((menu, index) => {
                            return (
                                 <li
                                    key={index}
                                    className="menu-item"
                                    onPointerDown={() => {
                                        this.dispatchEvent(menu);
                                    }}>
                                    {menu.label}
                                </li>
                            )
                        })
                    }
                </ul>
            </div>
        )
    }
}

export default TreeChart;
