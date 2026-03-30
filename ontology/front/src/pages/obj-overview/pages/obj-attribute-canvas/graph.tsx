import { Input } from '@arco-design/web-react';
import { Tag } from 'modo-design';
import {
  IconCalendarColor,
  IconCorrect,
  IconCounterColor,
  IconDataIntegrationColor,
  IconError,
  IconLink,
  IconReportDetailColor,
  IconSearchColor,
  IconTableChartColor,
  IconTextareaColor,
  IconUnitMgrColor,
} from 'modo-design/icon';
import React, { createContext, forwardRef, useCallback, useContext, useEffect, useImperativeHandle, useState } from 'react';
import ReactFlow, {
  Background,
  ConnectionLineType,
  Edge,
  Handle, // 用于获取连接状态
  Node,
  Position,
  addEdge,
  useEdgesState,
  useNodesState,
  useStore,
} from 'reactflow';
import interfaceImg from './imgs/interface.png';
import './style/flow.less';

/** 完整边列表：用于判断端点「是否已连线」状态，不受搜索筛选影响（展示仍用 visibleEdges） */
const AllEdgesContext = createContext<Edge[]>([]);

// 定义类型接口
interface Field {
  id: string;
  name: string;
  isTitle?: boolean;
  isPrimaryKey?: boolean;
  status?: number;
  fieldName?: string;
  interfaceAttrId?: string;
  type?: string;
  fieldType?: string;
}

interface TableNodeData {
  tableName: string;
  nodeType: string;
  fields: Field[];
  num?: number;
  active?: string | null;
  selectedAttrIds?:string[]|null;
  interfaceAttrId?: string;
  createAttribute?: () => void;
  deleteAttribute?: () => void;
  editAttribute?: (attr: Field) => void;
  setAttributeActive?: (attr: Field) => void;
  deleteEdge?: (attr: Field) => void;
  setSelectAttributes?: (attrs: string[]) => void;
  updateAttributes?:(data:{}) => void;
  dsType?: number;
  /** 搜索过滤时通知父组件，用于 visibleEdges 过滤边线，不写回 node.data 避免覆盖 setSelectAttributes 等 */
  onFilterChange?: (val: string) => void;
}

interface TableNodeProps {
  data: TableNodeData;
}

const renderIcon = option => {
  let labelIcon = '';
  switch (option) {
    case 'string':
      labelIcon = <IconTextareaColor />;
      break;
    case 'int':
      labelIcon = <IconCounterColor />;
      break;
    case 'decimal':
      labelIcon = <IconDataIntegrationColor />;
      break;
    case 'bool':
      labelIcon = <IconUnitMgrColor />;
      break;
    case 'date':
      labelIcon = <IconCalendarColor />;
      break;
  }
  return labelIcon;
};

const typeOptions = [
  { value: 'string', label: '字符型' },
  { value: 'int', label: '整数型' },
  { value: 'decimal', label: '浮点数型' },
  { value: 'date', label: '日期型' },
  { value: 'bool', label: '布尔型' },
];

// 自定义表节点组件
const TableNode: React.FC<TableNodeProps> = ({ data }) => {
  const storeEdges = useStore(store => store.edges);
  const allEdges = useContext(AllEdgesContext);
  // 用完整边列表判断「是否已连线」，这样右侧端点在被筛选掉连线时仍显示为已使用
  const edgesForConnectionState = allEdges.length > 0 ? allEdges : storeEdges;

  const [filterVal, setFilterVal] = useState('');
  const handleFilterChange = (val: string) => {
    setFilterVal(val);
    data.onFilterChange?.(val);
  };
  const getFieldType = (field: Field) => field.type ?? field.fieldType ?? '';
  // 检查字段是否被连接（基于完整边列表，不受搜索筛选影响）
  const isFieldConnected = (fieldName: string, fieldType: string, handleType: string) => {
    const handleId = `${fieldName}__${fieldType || ''}__${handleType}`;
    return edgesForConnectionState.some(
      edge =>
        (handleType === 'source' && edge.sourceHandle === handleId) ||
        (handleType === 'target' && edge.targetHandle === handleId),
    );
  };
  const canUpdate = data.selectedAttrIds && data.selectedAttrIds.length > 0;
  const canDelete = data.selectedAttrIds && data.selectedAttrIds.length > 0;// data.fields.filter(field => data.active === field.id).length > 0;
  // 全选状态
  const [selectAll, setSelectAll] = useState(false);
  // 选中的字段ID列表
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  // 处理全选/全不选
  const handleSelectAll = (checked: boolean) => {
    const visibleFieldIds = getVisibleFieldIds();

    if (checked) {
      // 全选：添加所有可见字段到选中列表（去重）
      setSelectedFields(prev => {
        const newSelectedFields = [...prev];
        visibleFieldIds.forEach(id => {
          if (!newSelectedFields.includes(id)) {
            newSelectedFields.push(id);
          }
        });
        return newSelectedFields;
      });
    } else {
      // 全不选：只移除当前可见的字段，保持不可见字段的选择状态
      setSelectedFields(prev => prev.filter(id => !visibleFieldIds.includes(id)));
    }

    setSelectAll(checked);
  };
  // 处理单个字段的选择
  const handleFieldSelect = (fieldId: string, checked: boolean) => {
    let newSelectedFields;

    if (checked) {
      newSelectedFields = [...selectedFields, fieldId];
    } else {
      newSelectedFields = selectedFields.filter(id => id !== fieldId);
    }

    setSelectedFields(newSelectedFields);

    // 检查是否所有可见字段都被选中
    const visibleFieldIds = getVisibleFieldIds();
    const allVisibleSelected = visibleFieldIds.length > 0 &&
      visibleFieldIds.every(id => newSelectedFields.includes(id));

    setSelectAll(allVisibleSelected);
  };
  // 获取所有可见字段的ID
  const getVisibleFieldIds = () => {
    const lower = filterVal.toLowerCase();
    return (data.fields ?? [])
      .filter(field => field.name.toLowerCase().indexOf(lower) > -1)
      .map(field => field.id);
  };

  // 监听筛选值变化，更新全选状态
  useEffect(() => {
    const visibleFieldIds = getVisibleFieldIds();

    if (visibleFieldIds.length === 0) {
      // 如果没有可见字段，取消全选
      setSelectAll(false);
    } else {
      // 检查所有可见字段是否都被选中
      const allVisibleSelected = visibleFieldIds.every(id => selectedFields.includes(id));
      setSelectAll(allVisibleSelected);
    }
  }, [filterVal, selectedFields]);
  // 监听选中状态
  useEffect(() => {
    data.setSelectAttributes && data.setSelectAttributes(selectedFields);
  }, [selectedFields]);

  // 监听 data.selectedAttrIds 变化，同步到 selectedFields
  useEffect(() => {
    if (data.selectedAttrIds) {
      setSelectedFields(data.selectedAttrIds);
    } else {
      setSelectedFields([]);
    }
  }, [data.selectedAttrIds]);

  return (
    <div
      style={{
        width: data.nodeType === 'source'?260:320,
        backgroundColor: 'white',
        borderRadius: '8px',
        // boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        border: '1px solid var(--color-border-2)',
      }}
    >
      <div
        className="node-header node-drag-handle"
        style={{
          padding: '10px',
          backgroundColor: 'var(--color-primary-6)',
          color: 'white',
          borderTopLeftRadius: '6px',
          borderTopRightRadius: '6px',
          fontWeight: 'bold',
        }}
      >
        <span className="icon">
          {data.nodeType === 'source' ? (
            <IconTableChartColor
              style={{
                marginRight: '4px',
              }}
            />
          ) : (
            <IconReportDetailColor
              style={{
                marginRight: '4px',
              }}
            />
          )}
        </span>
        <span className="label-container">
          <span className="label">{data.tableName}</span>
          {data.nodeType === 'target' ? (
            <span className="num" style={{ marginLeft: '8px' }}>
              {(data.fields ?? []).length}
            </span>
          ) : (
            ''
          )}
        </span>
        {data.nodeType === 'target' && data.dsType === 0 && (
          <span className="oper-group">
            {/* 全选复选框 */}
            <span
              className="btn select-all"
              style={{ marginRight: '8px', display: 'flex', alignItems: 'center' }}
              onClick={(e) => {
                e.stopPropagation();
                handleSelectAll(!selectAll);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelectAll(!selectAll);
                }
              }}
            >
              <input
                type="checkbox"
                checked={selectAll}
                onChange={(e) => handleSelectAll(e.target.checked)}
                style={{ marginRight: '4px' }}
              />
              <span style={{
                position: 'relative',
                top: '-1px'
              }}>全选</span>
            </span>
             <span className="btn-split"></span>
            <span
              className="btn add"
              onClick={() => data.createAttribute && data.createAttribute()}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  data.createAttribute && data.createAttribute();
                }
              }}
            >
              添加
            </span>
            <span className="btn-split"></span>
            <span
              className={`btn delete ${canDelete ? '' : 'disabled'}`}
              onClick={() => {
                canDelete && data.deleteAttribute && data.deleteAttribute();
              }}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  canDelete && data.deleteAttribute && data.deleteAttribute();
                }
              }}
            >
              移除
            </span>
            <span className="btn-split"></span>
            <span
              className={`btn delete ${canUpdate ? '' : 'disabled'}`}
              onClick={() => {
                canUpdate && data.updateAttributes && data.updateAttributes({status:1});
              }}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  canUpdate && data.updateAttributes && data.updateAttributes({status:1});
                }
              }}
            >
              启用
            </span>
            <span className="btn-split"></span>
            <span
              className={`btn delete ${canUpdate ? '' : 'disabled'}`}
              onClick={() => {
                canUpdate && data.updateAttributes && data.updateAttributes({status:0});
              }}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  canUpdate && data.updateAttributes && data.updateAttributes({status:0});
                }
              }}
            >
              禁用
            </span>
          </span>
        )}
      </div>
      <div
        className="filter-container"
        style={{
          padding: '12px',
          backgroundColor: 'var(--color-white)',
        }}
      >
        <Input
          value={filterVal}
          placeholder="请输入"
          suffix={<IconSearchColor />}
          onChange={val => handleFilterChange(val)}
        />
      </div>
      <div className="field-node-list">
        {(data.fields ?? [])
          .filter(field =>
            field.name.toLowerCase().indexOf(filterVal.toLowerCase()) > -1,
          )
          .map((field, index) => {
            const isConnected = isFieldConnected(
              data.nodeType === 'source' ? field.name : field.id,
              getFieldType(field),
              data.nodeType,
            );
            return (
              <div
                key={field.id || `field-${index}`}
                className={`field-node ${data.active && data.active === field.id ? 'active' : ''}`}
                style={{
                  height: '32px',
                  lineHeight: '20px',
                  padding: '6px 11px',
                  fontSize: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  position: 'relative',
                }}
                onClick={(e) => {
                  if (data.nodeType !== 'target') return;
                  // 点击的是 checkbox 时不再切换，由 checkbox 的 onChange 处理，避免重复切换导致选不中
                  if ((e.target as HTMLElement).closest?.('input[type="checkbox"]')) return;
                  const isCurrentlySelected = selectedFields.includes(field.id);
                  handleFieldSelect(field.id, !isCurrentlySelected);
                  data.setAttributeActive && data.setAttributeActive(field);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if ((e.key === 'Enter' || e.key === ' ') && data.nodeType === 'target') {
                    data.setAttributeActive && data.setAttributeActive(field);
                  }
                }}
              >
                {data.nodeType === 'source' && (
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={`${field.name}__${getFieldType(field)}__source`}
                    style={{
                      top: '50%',
                      right: -5,
                      width: 10,
                      height: 10,
                      background: isConnected ? 'var(--color-primary-6)' : 'var(--color-text-4)',
                    }}
                  />
                )}

                {data.nodeType === 'target' && (
                  <Handle
                    type="target"
                    position={Position.Left}
                    id={`${field.id}__${getFieldType(field)}__target`}
                    style={{
                      top: '50%',
                      left: -5,
                      width: 10,
                      height: 10,
                      background: isConnected ? 'var(--color-primary-6)' : 'var(--color-text-4)',
                    }}
                  />
                )}

                <span
                  style={{
                    display: 'flex',
                    flex: 1,
                    overflow: 'hidden',
                    alignItems: 'center',
                  }}
                >
                      {/* 目标节点的复选框 */}
                  {data.nodeType === 'target' && data.dsType != 1 && (
                    <input
                      type="checkbox"
                      checked={selectedFields.includes(field.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleFieldSelect(field.id, e.target.checked);
                      }}
                      style={{ marginRight: '8px' }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  <span
                    style={{
                      flex: 1,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {data.nodeType === 'target' && (
                      <span
                        className="icon"
                        style={{ color: 'var(--color-text-2)', marginRight: '4px' }}
                      >
                        {renderIcon(field.fieldType)}
                      </span>
                    )}
                    <span className="name" style={{ color: 'var(--color-text-1)' }}>
                      {field.name}
                    </span>
                    <span className="tag">
                      {field.isPrimaryKey ? (
                        <Tag size="small" color="arcoblue" effect="plain">
                          主键
                        </Tag>
                      ) : (
                        ''
                      )}
                      {field.isTitle ? (
                        <Tag size="small" color="cyan" effect="plain">
                          标题
                        </Tag>
                      ) : (
                        ''
                      )}
                    </span>
                  </span>
                  {data.nodeType === 'target' ? field.status ? <IconCorrect /> : <IconError /> : ''}
                  {data.nodeType === 'target' && field.interfaceAttrId ? (
                    <img src={interfaceImg} alt="" style={{ marginLeft: '8px' }} />
                  ) : null}
                  {data.nodeType === 'target' && isConnected && data.dsType != 1 && (
                    <span
                      className="field-link-tip-icon"
                      style={{
                        color: 'var(--color-primary-6)',
                      }}
                      onClick={() => {
                        data.deleteEdge && data.deleteEdge(field);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          data.deleteEdge && data.deleteEdge(field);
                        }
                      }}
                    >
                      <IconLink />
                      {/*{data.nodeType === 'source' && <IconSwapRight style={{ marginLeft: '8px'}}/>}
                                    {data.nodeType === 'target' && <IconSwapLeft style={{ marginLeft: '8px'}}/>}*/}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
};

// 节点类型配置
const nodeTypes = {
  table: TableNode,
};

// 定义组件 Props 接口
interface GraphProps {
  createAttribute: () => void;
  editAttribute: (attr: Field) => void;
}

// 暂无数据源时只显示一个 target 节点；有数据源时由 initData 注入 source 节点
// dragHandle: 仅从节点头部拖拽移动，Handle 可正常连线，checkbox/input 不受影响
const initialNodes: Array<Node<TableNodeData>> = [
  {
    id: 'attribute',
    type: 'table',
    position: { x: 560, y: 90 },
    dragHandle: '.node-drag-handle',
    data: {
      tableName: '属性',
      nodeType: 'target',
      num: 0,
      fields: [],
    },
  },
];

const initialEdges: Edge[] = [];

export default forwardRef<any, GraphProps>((props, ref) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [sourceFilterVal, setSourceFilterVal] = useState('');
  const [targetFilterVal, setTargetFilterVal] = useState('');

  // 只展示两端 handle 都未被搜索过滤掉的边，避免「仅一个 field 可见时所有线都连到这一个节点」的问题
  // 无数据源时没有 source 节点，所有边都不显示；有数据源时用 filters 过滤
  const visibleEdges = React.useMemo(() => {
    const sourceNode = nodes.find(n => n.data?.nodeType === 'source');
    const targetNode = nodes.find(n => n.data?.nodeType === 'target');
    const sourceFields = sourceNode?.data?.fields ?? [];
    const targetFields = targetNode?.data?.fields ?? [];
    const sourceLower = sourceFilterVal.toLowerCase();
    const targetLower = targetFilterVal.toLowerCase();
    const visibleSourceHandles = new Set(
      sourceFields
        .filter(f => (f.name ?? '').toLowerCase().indexOf(sourceLower) > -1)
        .map(f => `${f.name}__${(f as any).type ?? (f as any).fieldType ?? ''}__source`),
    );
    const visibleTargetHandles = new Set(
      targetFields
        .filter(f => (f.name ?? '').toLowerCase().indexOf(targetLower) > -1)
        .map(f => `${f.id}__${f.type ?? f.fieldType ?? ''}__target`),
    );
    return edges.filter(
      e =>
        visibleSourceHandles.has(e.sourceHandle ?? '') &&
        visibleTargetHandles.has(e.targetHandle ?? ''),
    );
  }, [nodes, edges, sourceFilterVal, targetFilterVal]);

  const onConnect = useCallback(
    params => {
      // 检查源端点是否已被使用
      const sourceHandleExists = edges.some(edge => edge.sourceHandle === params.sourceHandle);
      // 检查目标端点是否已被使用
      const targetHandleExists = edges.some(edge => edge.targetHandle === params.targetHandle);

      // 只有当源端点和目标端点都未被使用时才添加新连接
      if (!sourceHandleExists && !targetHandleExists) {
        const newEdge = {
          ...params,
          style: { stroke: 'var(--color-primary-6)', strokeWidth: 1 },
          markerEnd: { type: 'arrowclosed', color: 'var(--color-primary-6)' },
        };
        setEdges(eds => addEdge(newEdge, eds));
      }
    },
    [setEdges, edges],
  );

  const createAttribute = () => {
    props.createAttribute();
  };

  const deleteAttribute = useCallback((activeField) => {
    setNodes(nds => {
      if (nds.length == 2) {
        const node = { ...nds[1], data: { ...nds[1].data } };
        const selectAttrIds = activeField?[activeField.id]:node.data.selectedAttrIds;
        setEdges(egs => {
          return egs.filter(edge => {
            //return edge.targetHandle?.split('__')?.[0] !== `${node.data.active}`;
            return !selectAttrIds?.includes(edge.targetHandle?.split('__')?.[0])
          });
        });
        //node.data.fields = node.data.fields.filter(field => field.id !== node.data.active);
        node.data.fields = node.data.fields.filter(field => !selectAttrIds?.includes(field.id));
        node.data.active = null;
        node.data.selectedAttrIds = [];
        return [nds[0], node];
      }
      if (nds.length == 1) {
        const node = { ...nds[0], data: { ...nds[0].data } };

        const selectAttrIds = activeField?[activeField.id]: node.data.selectedAttrIds;
        setEdges(egs => {
          return egs.filter(edge => {
           // return edge.targetHandle?.split('__')?.[0] !== `${node.data.active}`;
            return !selectAttrIds?.includes(edge.targetHandle?.split('__')?.[0])
          });
        });
        node.data.fields = node.data.fields.filter(field => !selectAttrIds?.includes(field.id));
        node.data.active = null;
        node.data.selectedAttrIds = [];
        return [node];
      }
    });
  }, [setNodes, setEdges]);

  const setAttributeActive = (attr: Field) => {
    props.editAttribute && props.editAttribute(attr);
    setNodes(nds => {
      if (nds.length == 2) {
        const node = { ...nds[1], data: { ...nds[1].data } };
        node.data.active = attr.id;
        return [nds[0], node];
      }
      if (nds.length == 1) {
        const node = { ...nds[0], data: { ...nds[0].data } };
        node.data.active = attr.id;
        return [node];
      }
    });
  };

  const updateAttributes = (data:{})=>{
    setNodes(nds => {
      if (nds.length == 2) {
        const node = { ...nds[1], data: { ...nds[1].data } };
        const selectAttrIds = node.data.selectedAttrIds;
        const fields = [...node.data.fields];
        node.data.fields = fields.map(item => {
          if (selectAttrIds?.includes(item.id)) {
            return {
              ...item,
              ...data
            };
          }
          return item;
        });

        const activeField = node.data.fields.find(f => f.id === node.data.active);
        activeField && props.editAttribute && props.editAttribute(activeField);
        return [nds[0], node];
      }
      if (nds.length == 1) {
        const node = { ...nds[0], data: { ...nds[0].data } };
        const selectAttrIds = node.data.selectedAttrIds;
        const fields = [...node.data.fields];
        node.data.fields = fields.map(item => {
          if (selectAttrIds?.includes(item.id)) {
            return {
              ...item,
              ...data
            };
          }
          return item;
        });

        const activeField = node.data.fields.find(f => f.id === node.data.active);
        activeField && props.editAttribute && props.editAttribute(activeField);
        return [node];
      }
    });
  };

  const setSelectAttributes = (attrs:string[])=>{
    setNodes(nds => {
      if (nds.length == 2) {
        const node = { ...nds[1], data: { ...nds[1].data } };
        node.data.selectedAttrIds = attrs;
        return [nds[0], node];
      }
      if (nds.length == 1) {
        const node = { ...nds[0], data: { ...nds[0].data } };
        node.data.selectedAttrIds = attrs;
     //   node.data.active = attr.id;
        return [node];
      }
    });
  };

  const deleteEdge = (attr: Field) => {
    const fieldType = attr.type ?? attr.fieldType ?? '';
    setEdges(egs => {
      return egs.filter(edge => {
        return edge.targetHandle !== `${attr.id}__${fieldType}__target`;
      });
    });
  };

  useImperativeHandle(ref, () => ({
    initData: (sourceData: TableNodeData | null, targetData: TableNodeData, edgesData: Edge[]) => {
      setNodes(nds => {
        const hasSource = sourceData != null && sourceData.tableName && sourceData.tableName !== '--';
        const targetNode = nds.length >= 2 ? { ...nds[1] } : { ...nds[0] };
        targetNode.data = {
          ...targetData,
          num: (targetData.fields ?? []).length,
          createAttribute,
          deleteAttribute,
          setAttributeActive,
          setSelectAttributes,
          updateAttributes,
          selectedAttrIds: [],
          deleteEdge,
          active: null,
          onFilterChange: setTargetFilterVal,
        };

        if (!hasSource) {
          targetNode.dragHandle = '.node-drag-handle';
          return [targetNode];
        }

        const sourceNode = nds.length >= 2
          ? { ...nds[0], data: { ...sourceData, onFilterChange: setSourceFilterVal }, dragHandle: '.node-drag-handle' as const }
          : {
              id: 'table',
              type: 'table',
              position: { x: 100, y: 90 },
              dragHandle: '.node-drag-handle',
              data: { ...sourceData, onFilterChange: setSourceFilterVal },
            };
        targetNode.dragHandle = '.node-drag-handle';
        return [sourceNode, targetNode];
      });

      setEdges(edgesData);
    },
    getData: () => {
      const relaMap: Record<string, string> = {};
      edges.forEach(edge => {
        if (edge.targetHandle && edge.sourceHandle) {
          relaMap[edge.targetHandle.replace(/__target$/, '').split('__')[0]] =
            edge.sourceHandle.replace(/__source$/, '');
        }
      });
      if (nodes.length == 2) {
        return nodes[1].data.fields.map(field => {
          return {
            ...field,
            fieldName: relaMap[field.id]?.split('__')?.[0] || undefined,
            fieldType: relaMap[field.id]?.split('__')?.[1] || undefined,
          };
        });
      }
      return nodes[0].data.fields.map(field => {
        return {
          ...field,
          fieldName: undefined,
         // fieldType: undefined,
        };
      });
    },
    createField: (field: Field) => {
      setNodes(nds => {
        if (nds.length == 2) {
          const node = { ...nds[1], data: { ...nds[1].data } };
          node.data.fields = node.data.fields.map(item => {
            return {
              attributeLabel: '',
              ...item,
              isTitle: field.isTitle ? 0 : item.isTitle,
              isPrimaryKey: field.isPrimaryKey ? 0 : item.isPrimaryKey,
            };
          });
          node.data.fields = [...node.data.fields, field];
          node.data.active = field.id;
          return [nds[0], node];
        }
        if (nds.length == 1) {
          const node = { ...nds[0], data: { ...nds[0].data } };
          node.data.fields = node.data.fields.map(item => {
            return {
              attributeLabel: '',
              ...item,
              isTitle: field.isTitle ? 0 : item.isTitle,
              isPrimaryKey: field.isPrimaryKey ? 0 : item.isPrimaryKey,
            };
          });
          node.data.fields = [...node.data.fields, field];
          node.data.active = field.id;
          return [node];
        }
      });
    },
    updateField: (field: Field) => {
      setNodes(nds => {
        if (nds.length == 2) {
          const node = { ...nds[1], data: { ...nds[1].data } };
          const currentField = node.data.fields.find(f => f.id === field.id);
          if (!currentField) return [nds[0], node];
          const currentFieldIndex = node.data.fields.indexOf(currentField);
          const fields = [...node.data.fields];
          fields.splice(currentFieldIndex, 1, field);
          node.data.fields = fields.map(item => {
            if (item.id !== field.id) {
              return {
                ...item,
                isTitle: field.isTitle ? 0 : item.isTitle,
                isPrimaryKey: field.isPrimaryKey ? 0 : item.isPrimaryKey,
              };
            }
            return field;
          });
          return [nds[0], node];
        }
        if (nds.length == 1) {
          const node = { ...nds[0], data: { ...nds[0].data } };
          const currentField = node.data.fields.find(f => f.id === field.id);
          if (!currentField) return [node];
          const currentFieldIndex = node.data.fields.indexOf(currentField);
          const fields = [...node.data.fields];
          fields.splice(currentFieldIndex, 1, field);
          node.data.fields = fields.map(item => {
            if (item.id !== field.id) {
              return {
                ...item,
                isTitle: field.isTitle ? 0 : item.isTitle,
                isPrimaryKey: field.isPrimaryKey ? 0 : item.isPrimaryKey,
              };
            }
            return field;
          });
          return [node];
        }
      });
    },
    deleteAttribute,
  }));

  useEffect(() => {
    setNodes(nds => {
      const targets = edges.map(edge => {
        return edge.targetHandle ? edge.targetHandle.replace(/__target$/, '').split('__')[0] : '';
      });
      if (nds.length == 2) {
        const relaMap: Record<string, string> = {};
        edges.forEach(edge => {
          if (edge.targetHandle && edge.sourceHandle) {
            relaMap[edge.targetHandle.replace(/__target$/, '').split('__')[0]] =
              edge.sourceHandle.replace(/__source$/, '');
          }
        });
        const fields = nds[1].data.fields.map(field => {
          const data = {
            ...field,
            // fieldName: targets.indexOf(field.id) < 0 ? undefined : field.fieldName,
            fieldName:
              targets.indexOf(field.id) < 0 ? undefined : relaMap[field.id]?.split('__')?.[0],
            fieldType:
              targets.indexOf(field.id) < 0 ? field.fieldType : relaMap[field.id]?.split('__')?.[1],
            status: targets.indexOf(field.id) < 0 ? 0 : field.status,
          };
          if (targets.indexOf(field.id) >= 0 && nds[1].data.active === field.id) {
            setAttributeActive({
              ...data
            });
          }
          return data;
        });
        return [nds[0], { ...nds[1], data: { ...nds[1].data, fields } }];
      }
      if (nds.length == 1) {
        const fields = nds[0].data.fields.map(field => {
          if (targets.indexOf(field.id) < 0 && nds[0].data.active === field.id) {
            setAttributeActive({
              ...field,
             // status: 0,
              fieldName: undefined,
            });
          }
          return {
            ...field,
            fieldName: targets.indexOf(field.id) < 0 ? undefined : field.fieldName,
            //status: targets.indexOf(field.id) < 0 ? 0 : field.status,
          };
        });
        return [{ ...nds[0], data: { ...nds[0].data, fields } }];
      }
    });
  }, [edges]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <AllEdgesContext.Provider value={edges}>
        <ReactFlow
          nodes={nodes}
          edges={visibleEdges}
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
      </AllEdgesContext.Provider>
    </div>
  );
});
