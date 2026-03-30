import React, { memo, FC, CSSProperties, useCallback } from 'react';
import { Handle, Position, NodeProps, Connection, Edge, useOnViewportChange, Viewport } from 'reactflow';
import {
    IconDataServiceColor,
    IconMpcShiticaozuo
} from 'modo-design/icon';
import ObjectNode from './components/Object';
import ActionNode from './components/Action';
import LogicNode from './components/Logic';
import "./style/index.less";

const targetHandleStyle: CSSProperties = {
    background: '#fff',
    borderColor: 'var(--color-text-4)'
};
const sourceHandleStyleA: CSSProperties = { ...targetHandleStyle, top: 10 };
const sourceHandleStyleB: CSSProperties = {
    ...targetHandleStyle,
    bottom: 10,
    top: 'auto',
};

const onConnect = (params: Connection | Edge) => console.log('handle onConnect', params);

const ColorSelectorNode: FC<NodeProps> = ({ data, isConnectable, ...props }) => {
    const onStart = useCallback((viewport: Viewport) => {}, []);
    const onChange = useCallback((viewport: Viewport) => {}, []);
    const onEnd = useCallback((viewport: Viewport) => {}, []);

    useOnViewportChange({
        onStart,
        onChange,
        onEnd,
    });

    const relPorts = data.relPorts || [];

    return (
        <div
            className={`simulation-graph-node ${data.type}${data.faded ? ' faded' : ''}`}>
            <Handle
                type="target"
                position={Position.Left}
                id="port-1"
                style={{
                    ...targetHandleStyle,
                    background: relPorts.indexOf('port-1') > -1 ? '#FBA839' : '#fff',
                    borderColor: relPorts.indexOf('port-1') > -1 ? '#FBA839' : 'var(--color-text-4)',
                    // left: '-6px'
                }}
                onConnect={onConnect} />
            <Handle
                type="target"
                position={Position.Top}
                id="port-2"
                style={{
                    ...targetHandleStyle,
                    background: relPorts.indexOf('port-2') > -1 ? '#FBA839' : '#fff',
                    borderColor: relPorts.indexOf('port-2') > -1 ? '#FBA839' : 'var(--color-text-4)',
                    // top: '-6px'
                }}
                onConnect={onConnect} />
            <Handle
                type="source"
                position={Position.Right}
                id="port-3"
                style={{
                    ...targetHandleStyle,
                    background: relPorts.indexOf('port-3') > -1 ? '#FBA839' : '#fff',
                    borderColor: relPorts.indexOf('port-3') > -1 ? '#FBA839' : 'var(--color-text-4)',
                    // right: '-6px'
                }}
                onConnect={onConnect} />
            <Handle
                type="source"
                position={Position.Bottom}
                id="port-4"
                style={{
                    ...targetHandleStyle,
                    background: relPorts.indexOf('port-4') > -1 ? '#FBA839' : '#fff',
                    borderColor: relPorts.indexOf('port-4') > -1 ? '#FBA839' : 'var(--color-text-4)',
                    // bottom: '-6px'
                }}
                onConnect={onConnect} />
            {data.type === 'object' && <ObjectNode data={data} selected={props.selected}/>}
            {data.type === 'action' && <ActionNode data={data} selected={props.selected}/>}
            {data.type === 'logic' && <LogicNode data={data} selected={props.selected}/>}
        </div>
    );
};

export default memo(ColorSelectorNode);