import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const DEFAULT_HANDLE_STYLE = {
  width: 10,
  height: 10,
  bottom: -5,
};

export default memo((props) => {
  const {
    data, isConnectable
  } = props;
  return (
    <>
      <div
        className="er-node">
        <img
          className="node-bg"
          src={new URL('./imgs/node-bg.png', import.meta.url).href}/>
        <img
          className="node-icon"
          src={new URL('./imgs/node-icon-1.png', import.meta.url).href}/>
        <div
          className="text">
          {data.label}
        </div>
        <Handle
          type="target"
          position={Position.Top}
          id="right"
          style={{ ...DEFAULT_HANDLE_STYLE, left: '50%' }}
          isConnectable={true}/>
        <Handle
          type="source"
          position={Position.Bottom}
          id="left"
          style={{ ...DEFAULT_HANDLE_STYLE, left: '50%' }}
          isConnectable={true}/>
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          style={{ ...DEFAULT_HANDLE_STYLE, top: '50%' }}
          isConnectable={true}/>
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          style={{ ...DEFAULT_HANDLE_STYLE, top: '50%' }}
          isConnectable={true}/>
        {/*<Handle
          type="target"
          id="top"
          position={Position.Top}
          style={{ ...DEFAULT_HANDLE_STYLE, left: '50%' }}
          onConnect={(params) => console.log('handle onConnect', params)}
          isConnectable={isConnectable}>
          <img
            className="node-point"
            src={new URL('./imgs/point.png', import.meta.url).href}/>
        </Handle>
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          style={{ ...DEFAULT_HANDLE_STYLE, top: '50%' }}
          isConnectable={isConnectable}>
          <img
            className="node-point"
            src={new URL('./imgs/point.png', import.meta.url).href}/>
        </Handle>
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          style={{ ...DEFAULT_HANDLE_STYLE, bottom: '0px', left: '50%' }}
          isConnectable={isConnectable}>
          <img
            className="node-point"
            src={new URL('./imgs/point.png', import.meta.url).href}/>
        </Handle>
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          style={{ ...DEFAULT_HANDLE_STYLE, top: '50%' }}
          isConnectable={isConnectable}>
          <img
            className="node-point"
            src={new URL('./imgs/point.png', import.meta.url).href}/>
        </Handle>*/}
      </div>
    </>
  );
});
