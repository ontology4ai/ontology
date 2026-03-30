import {
  IconCounterColor,
  IconDataResDirColor,
  IconDocumentEditColor,
  IconProgramMgrColor,
  IconReportColor,
  IconDataCatalogMgrColor,
} from 'modo-design/icon';
import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  ConnectionLineType,
  Handle,
  Position,
  addEdge,
  useEdgesState,
  useNodesState,
} from 'reactflow';
import './style/index.less';
import {Typography} from "@arco-design/web-react";
const RuleNode = ({ data }: any) => {
  return (
    <div className="action-node">
      <div className="action-node-title">
        <IconProgramMgrColor />
        {data.nodeLabel}
        <Handle type="target" position={Position.Left} id="source" className="action-handel" />
      </div>
      <div className="action-node-content">
        <div className="row rule">
          <IconDocumentEditColor />
          {data.ruleName}
        </div>
        <div className="title">
          <div className="icon">
            <IconDataCatalogMgrColor />
          </div>
          <Typography.Text ellipsis={{ showTooltip: true }}>
            {data.objectName}
          </Typography.Text>
        </div>
        {data.attributesList.map((item: any) => {
          return (
            <div className="row" key={item.id}>
              <IconCounterColor />
              <Typography.Text ellipsis={{ showTooltip: true }}>
                {item.name}
              </Typography.Text>
            </div>
          );
        })}
      </div>
    </div>
  );
};
const InputParamsNode = ({ data }: any) => {
  return (
    <div className="action-node">
      <div className="action-node-title">
        <IconReportColor />
        {data.nodeLabel}
        <Handle type="source" position={Position.Right} id="source" className="action-handel" />
      </div>
      <div className="action-node-content">
        <div className="title">
          <div className="icon">
            <IconDataCatalogMgrColor />
          </div>
          <Typography.Text ellipsis={{ showTooltip: true }}>
            {data.objectName}
          </Typography.Text>

        </div>
        {data.paramsList.map((item: any) => {
          return (
            <div className="row" key={item.id}>
              <IconCounterColor />
              <Typography.Text ellipsis={{ showTooltip: true }}>
                {item.name}
              </Typography.Text>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const nodeTypes = {
  rule: RuleNode,
  inputParams: InputParamsNode,
};

const initialEdges = [
  {
    id: 'e1-2',
    source: '2',
    target: '1',
    sourceHandle: 'source',
    targetHandle: 'target',
    style: { stroke: 'var(--color-primary-6)', strokeWidth: 1 },
  },
];
const ActionTypeMap = {
  create: '创建对象',
  update: '更新对象',
  delete: '删除对象',
};
type ActionTypeKey = keyof typeof ActionTypeMap;
interface ActionTypeOverviewGraphProps {
  action: {
    objectType: any;
    actionType: ActionTypeKey;
    params: Array<any>;
  };
}
const ActionTypeOverviewGraph: React.FC<ActionTypeOverviewGraphProps> = ({ action }) => {
  const initialNodes = useMemo(
    () => [
      {
        id: '1',
        position: { x: 540, y: 50 },
        type: 'rule',
        data: {
          nodeLabel: '规则',
          ruleName: ActionTypeMap[action.actionType as ActionTypeKey],
          objectName: action.objectType.objectTypeLabel,
          nodeType: 'target',
          attributesList: (action.params || []).map(
            (item: { attributeId: string; attributeName: string; attributeLabel: string }) => {
              return {
                id: item.attributeId,
                name: item.attributeName,
              };
            },
          ),
        },
      },
      {
        id: '2',
        position: { x: 100, y: 50 },
        type: 'inputParams',
        data: {
          nodeLabel: '输入参数',
          objectName: action.objectType.objectTypeLabel,
          paramsList: (action.params || []).map((item: { id: string; paramName: string }) => {
            return {
              id: item.id,
              name: item.paramName,
            };
          }),
        },
      },
    ],
    [action],
  );
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes as any);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const onConnect = useCallback(params => setEdges(eds => addEdge(params, eds)), [setEdges]);
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      connectionLineType={ConnectionLineType.SmoothStep}
      attributionPosition="bottom-left"
      defaultViewport={{ x: 0, y: 0, zoom: 1 }}
    >
      <Background />
    </ReactFlow>
  );
};

export default ActionTypeOverviewGraph;
