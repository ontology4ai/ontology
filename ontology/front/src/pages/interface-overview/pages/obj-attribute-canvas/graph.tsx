import { Input, Modal } from '@arco-design/web-react';
import {
  IconCalendarColor,
  IconCounterColor,
  IconDataIntegrationColor,
  IconSearchColor,
  IconServerNodeColor,
  IconTextareaColor,
  IconUnitMgrColor,
} from 'modo-design/icon';
import React, { forwardRef, useCallback, useImperativeHandle, useState } from 'react';
import ReactFlow, {
  Background,
  ConnectionLineType,
  Edge, // 用于获取连接状态
  Node,
  addEdge,
  useEdgesState,
  useNodesState,
  useStore,
} from 'reactflow';
import './style/flow.less';

// 定义类型接口
interface Field {
  id: string;
  name?: string;
  label?: string;
  isTitle?: boolean;
  isPrimaryKey?: boolean;
  status?: number;
  fieldName?: string;
  operStatus?: number;
}

interface TableNodeData {
  tableName: string;
  nodeType: string;
  fields: Field[];
  num?: number;
  active?: string | null;
  createAttribute?: () => void;
  deleteAttribute?: () => void;
  editAttribute?: (attr: Field) => void;
  setAttributeActive?: (attr: Field) => void;
  deleteEdge?: (attr: Field) => void;
}

interface TableNodeProps {
  data: TableNodeData;
}

const renderIcon = option => {
  let labelIcon = '';
  const value = option?.toLowerCase() || option;
  switch (value) {
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

// 自定义表节点组件
const TableNode: React.FC<TableNodeProps> = ({ data }) => {
  const edges = useStore(store => store.edges);

  const [filterVal, setFilterVal] = useState('');
  /*// 检查字段是否被连接
  const isFieldConnected = (fieldName: string, fieldType:string, handleType: string) => {
    const handleId = `${fieldName}-${fieldType}-${handleType}`;
   // console.log(handleType,handleId,edges.map(item=>item.sourceHandle+"   "+item.targetHandle));
    return edges.some(
      edge =>
        (handleType === 'source' && edge.sourceHandle === handleId) ||
        (handleType === 'target' && edge.targetHandle === handleId),
    );
  };*/
  const canDelete = data.fields.filter(field => data.active === field.id).length > 0;

  return (
    <div
      onKeyDownCapture={(e) => {
        // React Flow 默认支持方向键移动选中节点；节点内部交互时应阻止冒泡，避免误移动
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
          e.stopPropagation();
        }
      }}
      style={{
        width: 260,
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
          <IconServerNodeColor
            style={{
              marginRight: '4px',
            }}
          />
        </span>
        <span className="label-container">
          <span className="label">{data.tableName}</span>
          {data.nodeType === 'target' ? (
            <span className="num" style={{ marginLeft: '8px' }}>
              {
                data.fields.filter(field => {
                  return (
                    field.name &&
                    field.label &&
                    field.name.indexOf(filterVal.trim()) > -1 &&
                    field.label.indexOf(filterVal.trim()) > -1 &&
                    field.operStatus !== 3
                  );
                }).length
              }
            </span>
          ) : (
            ''
          )}
        </span>
        {data.nodeType === 'target' && (
          <span className="oper-group">
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
                if (canDelete) {
                  Modal.confirm({
                    title: '移除当前属性，保存后将会与下游继承对象的属性取消映射',
                    content: '',
                    onOk: () => {
                      data.deleteAttribute && data.deleteAttribute();
                    },
                  });
                }
              }}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  if (canDelete) {
                    Modal.confirm({
                      title: '提示',
                      content: '移除当前属性，保存后将会与下游继承对象的属性取消映射',
                      onOk: () => {
                        data.deleteAttribute && data.deleteAttribute();
                      },
                    });
                  }
                }
              }}
            >
              移除
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
          onChange={val => {
            setFilterVal(val);
          }}
        />
      </div>
      <div className="field-node-list">
        {data.fields
          .filter(field => {
            return (
              field.label && field.label.indexOf(filterVal.trim()) > -1 && field.operStatus !== 3
            );
          })
          .map((field, index) => {
            /*const isConnected = isFieldConnected(
              data.nodeType === 'source' ? field.name : field.id,
              data.nodeType === 'source' ? field.type : field.type,
              data.nodeType,
            );*/
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
                onClick={() => {
                  data.nodeType === 'target' &&
                    data.setAttributeActive &&
                    data.setAttributeActive(field);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if ((e.key === 'Enter' || e.key === ' ') && data.nodeType === 'target') {
                    data.setAttributeActive && data.setAttributeActive(field);
                  }
                }}
              >
                {/*{data.nodeType === 'source' && (
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={`${field.name}-${field.type}-source`}
                    style={{
                      top: '50%',
                      right: -5,
                      width: 10,
                      height: 10,
                      background: isConnected ? 'var(--color-primary-6)' : 'var(--color-text-4)',
                    }}
                  />
                )}*/}

                {/*{data.nodeType === 'target' && (
                  <Handle
                    type="target"
                    position={Position.Left}
                    id={`${field.id}-${field.type}-target`}
                    style={{
                      top: '50%',
                      left: -5,
                      width: 10,
                      height: 10,
                      background: isConnected ? 'var(--color-primary-6)' : 'var(--color-text-4)',
                    }}
                  />
                )}*/}

                <span
                  style={{
                    display: 'flex',
                    flex: 1,
                    width: '100%'
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      display: 'flex',
                      width: '100%'
                    }}
                  >
                    {data.nodeType === 'target' && (
                      <span
                        className="icon"
                        style={{ color: 'var(--color-text-2)', marginRight: '4px' }}
                      >
                        {renderIcon(field.type)}
                      </span>
                    )}
                    <span className="name" style={{
                      color: 'var(--color-text-1)',
                      display:'inline-block',
                      overflow:'hidden',
                      whiteSpace:'nowrap',
                      textOverflow: 'ellipsis'
                    }}>
                      {field.label}
                    </span>
                  </span>
                  {/*{data.nodeType === 'target' && isConnected && (
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
                    </span>
                  )}*/}
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

// 数据库 Schema 数据
const initialNodes: Array<Node<TableNodeData>> = [
  /* {
    id: 'table',
    type: 'table',
    position: { x: 100, y: 90 },
    data: {
      tableName: '--',
      nodeType: 'source',
      fields: [],
    },
  },*/
  {
    id: 'attribute',
    type: 'table',
    position: { x: 260, y: 90 },
    // 仅允许从节点头部拖拽移动，避免输入框/内部交互导致节点跟随移动
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

  const deleteAttribute = useCallback(() => {
    setNodes(nds => {
      if (nds.length >= 1) {
        const nodeIndex = nds.length - 1;
        const node = { ...nds[nodeIndex], data: { ...nds[nodeIndex].data } };
        // 查找要删除的字段
        const fieldToDelete = node.data.fields.find(field => field.id === node.data.active);
        if (fieldToDelete) {
          // 如果是新建的字段(operStatus为0)，直接删除
          // 如果是已存在的字段(operStatus为1或未定义)，设置operStatus为3表示删除
          if (fieldToDelete.operStatus === 0) {
            // 直接删除新建的字段
            node.data.fields = node.data.fields.filter(field => field.id !== node.data.active);
          } else {
            // 标记已存在的字段为删除状态
            const updatedFields = node.data.fields.map(field => {
              if (field.id === node.data.active) {
                return {
                  ...field,
                  operStatus: 3,
                };
              }
              return field;
            });
            node.data.fields = updatedFields;
          }
        } else {
          // 如果没找到字段，直接过滤掉
          node.data.fields = node.data.fields.filter(field => field.id !== node.data.active);
        }
        node.data.active = null;
        if (nds.length === 2) {
          return [nds[0], node];
        }
        return [node];
      }
      return nds;
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

  const deleteEdge = (attr: Field) => {
    setEdges(egs => {
      return egs.filter(edge => {
        return edge.targetHandle !== `${attr.id}-${attr.type}-target`;
      });
    });
  };

  useImperativeHandle(ref, () => ({
    initData: (targetData: TableNodeData) => {
      setNodes(nds => {
        //  const source = { ...nds[0] };
        const target = { ...nds[0] };
        //   source.data = sourceData;
        target.data = targetData;

        target.data.num = targetData.fields.length;
        target.data.createAttribute = createAttribute;
        target.data.deleteAttribute = deleteAttribute;
        target.data.setAttributeActive = setAttributeActive;
        target.data.deleteEdge = deleteEdge;
        target.data.active = null;
        return [target];
      });

      //setEdges(edgesData);
    },
    getData: () => {
      const relaMap: Record<string, string> = {};
      edges.forEach(edge => {
        if (edge.targetHandle && edge.sourceHandle) {
          relaMap[edge.targetHandle.replace(/-target$/, '').split('-')[0]] =
            edge.sourceHandle.replace(/-source$/, '');
        }
      });
      if (nodes.length === 2) {
        return nodes[1].data.fields.map(field => {
          return {
            ...field,
            fieldName: relaMap[field.id]?.split('-')?.[0] || undefined,
            fieldType: relaMap[field.id]?.split('-')?.[1] || undefined,
          };
        });
      }
      return nodes[0].data.fields.map(field => {
        return {
          ...field,
          fieldName: undefined,
          fieldType: undefined,
        };
      });
    },
    createField: (field: Field) => {
      setNodes(nds => {
        if (nds.length == 1) {
          const node = { ...nds[0], data: { ...nds[0].data } };
          /*node.data.fields = node.data.fields.map(item => {
            return {
              ...item,
              isTitle: field.isTitle ? 0 : item.isTitle,
              isPrimaryKey: field.isPrimaryKey ? 0 : item.isPrimaryKey,
            };
          });*/
          const newField = {
            ...field,
            operStatus: 0, // operStatus 操作状态：0 - 新建，1 - 修改，2 - 同步，3 - 删除
          };
          node.data.fields = [...node.data.fields, newField];
          node.data.active = newField.id;
          return [node];
        }
      });
    },
    updateField: (field: Field,operStatus=1) => {
      setNodes(nds => {
        /*if(nds.length==2){
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
        }else */
        if (nds.length === 1) {
          const node = { ...nds[0], data: { ...nds[0].data } };
          // 新建字段会在 createField 中写入 operStatus=0，但表单侧 activeField 可能没带 operStatus
          // 这里按 id 定位即可，避免找不到导致 field-node 不更新
          const currentField = node.data.fields.find(f => f.id === field.id);
          if (!currentField) return [node];
          const currentFieldIndex = node.data.fields.indexOf(currentField);
          const fields = [...node.data.fields];
          const updatedField = {
            ...field,
            // 若当前字段是新建(0)，保持 0；否则按传入 operStatus 标记为修改(1)
            operStatus: currentField.operStatus === 0 ? 0 : operStatus,
          };
          fields.splice(currentFieldIndex, 1, updatedField);
          node.data.fields = fields;
          return [node];
        }
      });
    },
    deleteAttribute,
  }));

  /*useEffect(() => {
    setNodes(nds => {
      const targets = edges.map(edge => {
        return edge.targetHandle ? edge.targetHandle.replace(/-target$/, '').split('-')[0] : '';
      });
      if(nds.length==2){
           const relaMap: Record<string, string> = {};
          edges.forEach(edge => {
              if (edge.targetHandle && edge.sourceHandle) {
                  relaMap[edge.targetHandle.replace(/-target$/, '').split('-')[0]] = edge.sourceHandle.replace(
                    /-source$/,
                    '',
                  );
              }
          });
        const fields = nds[1].data.fields.map(field => {
          if (targets.indexOf(field.id) < 0 && nds[1].data.active === field.id) {
            setAttributeActive({
              ...field,
              status: 0,
              fieldName: undefined,
            });
          }
          return {
            ...field,
           // fieldName: targets.indexOf(field.id) < 0 ? undefined : field.fieldName,
            fieldName: targets.indexOf(field.id) < 0 ? undefined : relaMap[field.id]?.split('-')?.[0],
            fieldType:targets.indexOf(field.id) < 0 ? undefined : relaMap[field.id]?.split('-')?.[1],
            status: targets.indexOf(field.id) < 0 ? 0 : field.status,
          };
        });
        return [nds[0], { ...nds[1], data: { ...nds[1].data, fields } }];
      }else if(nds.length==1){
        const fields = nds[0].data.fields.map(field => {
          if (targets.indexOf(field.id) < 0 && nds[0].data.active === field.id) {
            setAttributeActive({
              ...field,
              status: 0,
              fieldName: undefined,
            });
          }
          return {
            ...field,
            fieldName: targets.indexOf(field.id) < 0 ? undefined : field.fieldName,
            status: targets.indexOf(field.id) < 0 ? 0 : field.status,
          };
        });
        return [{ ...nds[0], data: { ...nds[0].data, fields } }];
      }

    });
  }, [edges]);*/

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
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
    </div>
  );
});
