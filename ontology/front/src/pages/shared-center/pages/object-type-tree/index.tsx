import React, { useEffect, useRef, useState } from 'react';
import { Tree, Space, Input, Modal, Message } from '@arco-design/web-react';
import { IconMinus, IconPlus } from '@arco-design/web-react/icon';
import './index.less';
import {
  IconSearchColor,
  IconFolderOnColor,
  IconDocumentColor,
  IconEdit,
  IconFolderColor,
} from 'modo-design/icon';
import TreeDownIcon from '../../images/treeDownIcon.svg';
import TreeExpandIcon from '../../images/treeExpandIcon.svg';
import { centerSearch, centerSave, centerUpdate, centerDelete } from '../../api';
import type TreeInstance from '@arco-design/web-react/es/Tree';

interface TreeNode {
  centerName: string;
  id: string;
  icon?: React.ReactNode;
  children?: TreeNode[];
  isAdding?: boolean;
  isEditing?: boolean;
  parentId?: string;
}

let initTreeData: TreeNode[] = [];

const SharedObjectTypeTree = ({
  onClickTreeNode,
}: {
  onClickTreeNode: (nodeData: object) => void;
}) => {
  const [treeData, setTreeData] = useState(initTreeData);

  const [selectedKeys, setSelectedKeys] = useState(['root']);

  const [inputValue, setInputValue] = useState('');

  const treeRef = useRef<TreeInstance>(null);

  const getTreeNode = async () => {
    try {
      const res = await centerSearch({ parentId: 'root' });

      initTreeData = [
        {
          centerName: '全部',
          id: 'root',
          children: res.data.data,
        },
      ];

      setTreeData([...initTreeData]);

      treeRef.current?.handleExpand(true, 'root');
      treeRef.current?.handleSelect('root', null);
    } catch (error) {
      console.error(error);
    }
  };
  const deleteTreeNode = (node: TreeNode) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除此节点吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        const { id, parentId } = node;
        centerDelete({ centerId: id, parentId }).then(res => {
          const { success, message } = res.data;
          if (success) {
            // 用户点击确认后执行删除操作
            const updateTreeData = (list: TreeNode[]) => {
              return list.filter(item => {
                if (item.id === id) {
                  return false; // 删除当前节点
                }
                if (item.children) {
                  item.children = updateTreeData(item.children);
                }
                return true;
              });
            };

            setTreeData(updateTreeData(treeData));

            Message.success('删除成功');
          } else {
            Message.error(message || '删除失败');
          }
        });
      },
      onCancel: () => {},
    });
  };
  const addTreeNode = (nodeKey: string, parentId: string) => {
    // 创建新节点
    const newNode = {
      centerName: '新节点',
      id: `new-${Date.now()}`, // 生成唯一 key
      isAdding: true, // 标记为新增状态
      parentId,
    };

    // 更新树数据
    const updateTreeData = (list: TreeNode[]) => {
      return list.map(item => {
        if (item.id === nodeKey) {
          // 如果当前节点没有子节点，初始化 children 数组
          if (!item.children) {
            item.children = [];
          }
          // 添加新节点到子节点列表开头
          item.children.unshift(newNode);
          // 展开当前节点
          treeRef.current?.handleExpand(true, item.id);
        } else if (item.children) {
          // 递归处理子节点
          item.children = updateTreeData(item.children);
        }
        return item;
      });
    };

    setTreeData(updateTreeData(treeData));
  };
  const editTreeNode = (nodeKey: string) => {
    const updateTreeData = (list: TreeNode[]): TreeNode[] => {
      return list.map(item => {
        if (item.id === nodeKey) {
          return {
            ...item,
            isEditing: true,
          };
        }
        if (item.children) {
          return {
            ...item,
            children: updateTreeData(item.children),
          };
        }
        return item;
      });
    };

    setTreeData(updateTreeData(treeData));
  };
  const updateTreeNode = (nodeKey: string, newTitle: string, newId: string) => {
    const updateTreeData = (list: TreeNode[]): TreeNode[] => {
      return list.map(item => {
        if (item.id === nodeKey) {
          return {
            ...item,
            id: newId,
            centerName: newTitle,
            isEditing: false, // 取消编辑状态
            isAdding: false, // 取消新增状态
          };
        }
        if (item.children) {
          return {
            ...item,
            children: updateTreeData(item.children),
          };
        }
        return item;
      });
    };

    setTreeData(updateTreeData(treeData));
  };
  const cancelEditTreeNode = (nodeKey: string) => {
    const updateTreeData = (list: TreeNode[]): TreeNode[] => {
      return list
        .map(item => {
          if (item.id === nodeKey) {
            if (item.isAdding) {
              return null;
            }
            return {
              ...item,
              isEditing: false,
            };
          }
          if (item.children) {
            return {
              ...item,
              children: updateTreeData(item.children),
            };
          }
          return item;
        })
        .filter(item => item !== null);
    };

    setTreeData(updateTreeData(treeData));
  };
  const handleTreeNodeInputEnter = async (node: TreeNode, newTitle: string) => {
    try {
      let res = null;
      if (node.isEditing) {
        res = await centerUpdate({ ...node, centerName: newTitle });
      } else {
        const { centerName, parentId } = node;
        res = await centerSave({
          centerName: newTitle,
          parentId,
        });
      }

      const { success, data: newNode, message } = res.data;
      if (success) {
        Message.success('保存成功');
        updateTreeNode(node.id, newTitle, newNode.id);
      } else {
        Message.error(message || '保存失败');
        cancelEditTreeNode(node.id);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const treeNodeSelect = (selectKeys, { node }) => {
    setSelectedKeys(selectKeys);
    onClickTreeNode(node.props.dataRef);
  };

  function searchData(inputValue) {
    const loop = data => {
      const result = [];
      data.forEach(item => {
        if (item.centerName.toLowerCase().indexOf(inputValue.toLowerCase()) > -1) {
          result.push({ ...item });
        } else if (item.children) {
          const filterData = loop(item.children);

          if (filterData.length) {
            result.push({ ...item, children: filterData });
          }
        }
      });
      return result;
    };

    return loop(treeData);
  }

  useEffect(() => {
    if (!inputValue) {
      setTreeData(initTreeData);
    } else {
      const result = searchData(inputValue);
      setTreeData(result);
    }
  }, [inputValue]);

  useEffect(() => {
    getTreeNode();
  }, []);

  return (
    <>
      <Input
        style={{
          marginBottom: 10,
          maxWidth: 240,
        }}
        allowClear
        suffix={<IconSearchColor />}
        placeholder="请输入"
        onChange={setInputValue}
      />
      <Tree
        ref={treeRef}
        className="object-dir-tree"
        showLine
        selectedKeys={selectedKeys}
        onSelect={treeNodeSelect}
        icons={nodeProps => {
          if (nodeProps.childrenData?.length) {
            if (nodeProps.expanded) {
              return {
                switcherIcon: <img src={TreeDownIcon} />,
              };
            }
            return {
              switcherIcon: <img src={TreeExpandIcon} />,
            };
          }
          return {
            switcherIcon: null,
          };
        }}
        renderTitle={NodeProps => {
          const { title, expanded } = NodeProps;
          const { children, isEditing, isAdding } = NodeProps?.dataRef || {};

          if (isEditing || isAdding) {
            return (
              <div className="tree-node-content">
                <Input
                  autoFocus
                  defaultValue={String(title)}
                  onPressEnter={e => {
                    handleTreeNodeInputEnter(NodeProps.dataRef, e.currentTarget.value);
                  }}
                  onBlur={e => {
                    cancelEditTreeNode(NodeProps._key);
                  }}
                  style={{ width: '100%' }}
                  size="mini"
                />
              </div>
            );
          }

          let titleNode = title;
          if (inputValue) {
            const index = title?.toLowerCase().indexOf(inputValue.toLowerCase());

            if (index === -1) {
              //return title;
              titleNode = title;
            } else {
              const prefix = title?.substr(0, index);
              const suffix = title?.substr(index + inputValue.length);
              titleNode = (
                <span>
                  {prefix}
                  <span style={{ color: 'var(--color-primary-light-4)' }}>
                    {title?.substr(index, inputValue.length)}
                  </span>
                  {suffix}
                </span>
              );
            }
          }
          const getIcon = () => {
            if (children?.length) {
              return expanded ? <IconFolderOnColor /> : <IconFolderColor />;
            }
            return <IconDocumentColor />;
          };
          return (
            <div className="tree-node-content">
              {getIcon()}
              {titleNode}
              <Space size="mini" className="op-btns">
                <IconEdit
                  onClick={e => {
                    e.stopPropagation();
                    e.preventDefault();

                    editTreeNode(NodeProps._key);
                  }}
                />
                <IconPlus
                  onClick={e => {
                    e.stopPropagation();
                    e.preventDefault();

                    addTreeNode(NodeProps._key, NodeProps.dataRef?.id);
                  }}
                />
                <IconMinus
                  onClick={e => {
                    e.stopPropagation();
                    e.preventDefault();

                    deleteTreeNode(NodeProps.dataRef);
                  }}
                />
              </Space>
            </div>
          );
        }}
        treeData={treeData}
        fieldNames={{ key: 'id', title: 'centerName' }}
      />
    </>
  );
};
export default SharedObjectTypeTree;
