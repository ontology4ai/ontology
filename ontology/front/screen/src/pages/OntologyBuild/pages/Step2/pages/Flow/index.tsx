import React, { useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  MarkerType,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import CustomNode from './CustomNode';
import ConnectionLine from './ConnectionLine';
import ButtonEdge from './ButtonEdge';

import './style/index.less';

const initialNodes = [
  {
    id: '1',
    type: 'custom',
    data: { label: '供应商' },
    position: { x: 119, y: 47 },
  },
  {
    id: '2',
    type: 'custom',
    data: { label: '仓库' },
    position: { x: 420, y: 471 },
  },
  {
    id: '3',
    type: 'custom',
    data: { label: '原料' },
    position: { x: 119, y: 261 },
  },
  {
    id: '4',
    type: 'custom',
    data: { label: '产品' },
    position: { x: 420, y: 261 },
  },
  {
    id: '5',
    type: 'custom',
    data: { label: '订单' },
    position: { x: 720, y: 261 },
  },
  {
    id: '6',
    type: 'custom',
    data: { label: '客户' },
    position: { x: 1028, y: 261 },
  },
  {
    id: '7',
    type: 'custom',
    data: { label: '航线' },
    position: { x: 720, y: 471 },
  },
  {
    id: '8',
    type: 'custom',
    data: { label: '公路' },
    position: { x: 1028, y: 471 },
  },
  {
    id: '9',
    type: 'custom',
    data: { label: '航班' },
    position: { x: 720, y: 681 },
  },
  {
    id: '10',
    type: 'custom',
    data: { label: '车辆' },
    position: { x: 1028, y: 681 },
  }
];

const initialEdges = [
  {
    id: 'edge-1',
    source: '1',
    target: '3',
    type: 'buttonedge',
    sourceHandle: 'bottom',
    targetHandle: 'top',
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: 'edge-2',
    source: '3',
    target: '4',
    type: 'buttonedge',
    sourceHandle: 'right',
    targetHandle: 'left',
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: 'edge-3',
    source: '3',
    target: '2',
    type: 'buttonedge',
    sourceHandle: 'right',
    targetHandle: 'left',
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: 'edge-4',
    source: '4',
    target: '2',
    type: 'buttonedge',
    sourceHandle: 'bottom',
    targetHandle: 'top',
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: 'edge-5',
    source: '4',
    target: '5',
    type: 'buttonedge',
    sourceHandle: 'right',
    targetHandle: 'left',
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: 'edge-6',
    source: '5',
    target: '6',
    type: 'buttonedge',
    sourceHandle: 'right',
    targetHandle: 'left',
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: 'edge-7',
    source: '5',
    target: '7',
    type: 'buttonedge',
    sourceHandle: 'bottom',
    targetHandle: 'top',
    markerEnd: { type: MarkerType.ArrowClosed },
  }
]

const nodeTypes = {
  custom: CustomNode,
};

const edgeTypes = {
  buttonedge: ButtonEdge,
};

const ConnectionLineFlow = () => {
  const [nodes, _, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const containerRef = useRef();
  const { setViewport } = useReactFlow();
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [],
  );

  const resize = () => {
    var el = document.body;
    var height = el.offsetHeight;
    var width = el.offsetWidth;
    var scaleX = width / 1920;
    var scaleY = height / 1080;
    containerRef.current.style.top = 187 * scaleX + 'px'
    containerRef.current.style.left = 604 * scaleX + 'px'
    containerRef.current.style.width = 1280 * scaleX + 'px'
    containerRef.current.style.height = 857 * scaleX + 'px'
    setViewport({ zoom: scaleX })
  }

  useEffect(() => {
    if (containerRef.current) {
      resize()
      window.addEventListener('resize', resize);
    }
    return () => {
      window.removeEventListener('resize', resize);
    }
  }, [])

  return (
    <div
      className="design-flow-container"
      ref={containerRef}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        // connectionLineComponent={ConnectionLine}
        onConnect={onConnect}>
        <Background />
      </ReactFlow>
    </div>
  );
};

// export default ConnectionLineFlow
export default () => {
  return (
    <ReactFlowProvider>
      <ConnectionLineFlow />
    </ReactFlowProvider>
  );
};
