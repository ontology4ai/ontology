import React, { useState, useEffect } from 'react';
import { Input, Dropdown, Button, Menu, Tree } from '@arco-design/web-react';

import './style/index.less';
import {
  IconArrowDown,
  IconRight,
  IconSearch,
  IconMenuCardFill,
  IconMenuMat,
  IconDataPlatformReg,
  IconAdd,
  IconEdit,
  IconDelete,
  IconPlus,
  IconArchi,
  IconCaretBottom
} from 'modo-design/icon';

import * as icons from 'modo-design/icon';
import useLocale from '@/utils/useLocale';
import locale from './locale';
// import IconAggregateroot from './icon/icon-aggregateroot.svg';
// import IconDimensionTable from './icon/icon-dimension-table.svg';
// import IconFactTable from './icon/icon-fact-table.svg';
// import IconMonitorFill from './icon/icon-monitor-fill.svg';
// import IconNtityFill from './icon/icon-ntity-fill.svg';
// import IconSummaryTable from './icon/icon-summary-table.svg';
const TreeNode = Tree.Node;
function SearchTree({
  treeTitle,
  treeData = [],
  changeTreeType,
  treeType,
  selectTreeNode,
  fieldNames = {
    key: 'key',
    title: 'title',
    children: 'children',
    nodeType: 'nodeType',
    cantRightMenu: '',
  },
  iconEnum,
  clickTreeMenu,
  treeMenu = [
    {
      key: 'add',
      label: '新增节点',
      icon: 'IconAdd',
      color: '#4E5969',
    },
    {
      key: 'edit',
      label: '编辑节点',
      icon: 'IconEdit',
      color: '#4E5969',
    },
    {
      key: 'delete',
      label: '删除',
      icon: 'IconDelete',
      color: '#4E5969',
    },
  ], renderClass
}: Props) {
  const t = useLocale(); // 使用全局语言
  const userT = useLocale(locale); // 使用组件个性化语言
  const [treeDataCopy, setTreeData] = useState(treeData);
  const [expandedKeys, setExpandedKeys] = useState(['43035327568515072']);
  const [inputValue, setInputValue] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const searchData = value => {
    const loop = data => {
      const result = [];
      data.forEach(item => {
        if (item[fieldNames.title].toLowerCase().indexOf(value.toLowerCase()) > -1) {
          result.push({ ...item });
        } else if (item.children) {
          const filterData = loop(item.children);
          if (filterData.length) {
            result.push({
              ...item,
              children: filterData,
            });
          }
        }
      });
      return result;
    };
    return loop(treeData);
  };
  const selectNode = (value, info) => {
    // info.e.stopPropagation();
    selectTreeNode(value, info);
  };
  const changeType = key => {
    if (typeof changeTreeType === 'function') {
      changeTreeType(key);
    }
  };
  const toggleSearch = () => {
    setShowSearch(!showSearch);
  };
  const getExpandedKeys = (data = [], arr = []) => {
    // 遍历树
    data.forEach(item => {
      if (item.children) {
        arr.push(item.key);
        getExpandedKeys(item.children, arr);
      }
    });
    return arr;
  };
  useEffect(() => {
    if (!inputValue) {
      const keys = getExpandedKeys(treeData, []);
      // setExpandedKeys(keys);
      setTreeData(treeData);
    } else {
      const result = searchData(inputValue);
      const keys = getExpandedKeys(result, []);
      // setExpandedKeys(keys);
      setTreeData(result);
    }
    if (treeData && treeData.length > 0) {
      if (treeData[0].children && treeData[0].children.length > 0) {
        const key = treeData[0].id;
        setExpandedKeys(key);
      }
    }
  }, [inputValue, treeData]);
  useEffect(() => {
    if (treeMenu && treeMenu.length > 0) {
      treeMenu.forEach(item => {
        item.label = userT(item.label);
      });
    }
  }, [treeMenu]);
  return (
    <div className={treeType === 'dir' ? 'searchTree space' : 'searchTree'}>
      <div className="head">
        <div className="title">
          {' '}
          <IconMenuCardFill style={{ fontSize: 14, color: '#4E5969' }} />
          {/* <IconAggregateroot className="arco-icon" style={{ fontSize: '50px' }} /> */}
          <span className="text">{treeTitle}</span>
        </div>
        {showSearch ? (
          <Input
            className="fade-in"
            size="mini"
            style={{ marginBottom: 8, maxWidth: 240, flex: 1, marginLeft: 10 }}
            onChange={setInputValue}
            placeholder="请输入"
          />
        ) : null}

        <div className="oper">
          <Button type="text" size="mini" onClick={toggleSearch}>
            <IconSearch style={{ fontSize: 12, color: '#4E5969' }} />
          </Button>
          <Dropdown
            droplist={
              <Menu onClickMenuItem={changeType}>
                <Menu.Item key="obj">
                  <IconDataPlatformReg style={{ fontSize: 12, color: '#4E5969' }} /> 显示对象
                </Menu.Item>
                <Menu.Item key="dir">
                  {/* <IconMenuMat style={{ fontSize: 12, color: '#4E5969' }} /> 显示目录 */}
                  <IconArchi style={{ fontSize: 12, color: '#4E5969' }} /> 显示目录
                </Menu.Item>
              </Menu>
            }
            trigger="click"
            position="br"
          >
            <Button type="text" size="mini">
              {treeType !== 'dir' ? (
                <IconDataPlatformReg style={{ fontSize: 12, color: '#4E5969' }} />
              ) : (
                <IconArchi style={{ fontSize: 12, color: '#4E5969' }} />
              )}
            </Button>
          </Dropdown>
        </div>
      </div>
      {!showSearch && (!treeDataCopy || treeDataCopy.length) <= 0 ? (
        <Button
          type="secondary"
          size="large"
          onClick={e => clickTreeMenu('addRoot', e, '')}
          className="addRoot"
        >
          <IconPlus style={{ fontSize: 12, color: '#165DFF' }} />
          {userT('新建节点')}
        </Button>
      ) : null}
      {treeDataCopy && treeDataCopy.length > 0 ? (
        <Tree
          // autoExpandParent
          // expandedKeys={expandedKeys}
          defaultExpandedKeys={[expandedKeys]}
          showLine
          icons={{
            switcherIcon: <IconCaretBottom />,
            dragIcon: <IconRight />,
          }}
          onExpand={(keys, extra) => {
            setExpandedKeys(keys, extra);
          }}
          onSelect={selectNode}
          // fieldNames={{
          //   key: 'id',
          //   title: 'label',
          //   children: 'children',
          // }}
          renderTitle={props => {
            // if (inputValue) {
            // console.log('renderTitle', props);
            const nodeId = props._key;
            const str = props.title.props.children;
            const index = str.toLowerCase().indexOf(inputValue.toLowerCase());
            if (index === -1) {
              return str;
            }
            const prefix = str.substr(0, index);
            const suffix = str.substr(index + inputValue.length);

            return clickTreeMenu && props.nodeType !== fieldNames.cantRightMenu ? (
              <Dropdown
                className="treeMenu"
                trigger="contextMenu"
                position="bl"
                droplist={
                  <Menu onClickMenuItem={(key, e) => clickTreeMenu(key, e, nodeId)}>
                    {/* <Menu.Item key="add">
                    <IconAdd style={{ fontSize: 12, color: '#4E5969' }} /> 新增节点
                  </Menu.Item>
                  <Menu.Item key="edit">
                    <IconEdit style={{ fontSize: 12, color: '#4E5969' }} /> 编辑节点
                  </Menu.Item>
                  <Menu.Item key="delete">
                    <IconDelete style={{ fontSize: 12, color: '#4E5969' }} /> 删除
                  </Menu.Item> */}
                    {treeMenu.map(element => {
                      let Tag = null;
                      if (element.icon) {
                        // console.log('icons',icons)
                        Tag = icons[element.icon];
                      }
                      return (
                        <Menu.Item key={element.key}>
                          {Tag ? (
                            <Tag
                              style={{
                                color: element.color ? element.color : '#4E5969',
                                marginRight: '5px',
                              }}
                            ></Tag>
                          ) : null}
                          {element.label}
                        </Menu.Item>
                      );
                    })}
                  </Menu>
                }
              >
                <span className={renderClass(props)} >
                  {prefix}
                  <span style={{ color: 'var(--color-primary-light-4)' }}>
                    {str.substr(index, inputValue.length)}
                  </span>
                  {suffix}
                </span>
              </Dropdown>
            ) : (
              <span className={renderClass(props)} >
                {prefix}
                <span style={{ color: 'var(--color-primary-light-4)' }}>
                  {str.substr(index, inputValue.length)}
                </span>
                {suffix}
              </span>
            );
            // }
            return str;
          }}
        >
          {treeDataCopy && treeDataCopy.length > 0
            ? treeDataCopy.map(element => {
                const renderTreeNode = data => {
                  let Tag = null;
                  let nodeType = null;
                  nodeType = data[fieldNames.nodeType];
                  if (data.icon) {
                  Tag = icons[data.icon];
                } else if (iconEnum) {
                  if (nodeType) {
                    Tag = icons[iconEnum[nodeType].icon];
                    }
                }
                  // console.log('renderTreeNode', data, nodeType);
                  return (
                  <TreeNode
                    nodeType={nodeType || ''}
                      key={data[fieldNames.key]}
                      className={data[fieldNames.title]}
                      title={
                        <span>
                        {`${data[fieldNames.title]} ${
                            data.objCount >= 0 ? `[${data.objCount}]` : ''
                        }`}
                      </span>
                      }
                    disableState={data[fieldNames.disableState]}
                    icon={
                        Tag ? (
                          <Tag
                            style={{ color: nodeType ? iconEnum[nodeType].color : data.color }}
                        ></Tag>
                        ) : null
                      }
                    >
                      {data[fieldNames.children] && data[fieldNames.children].length > 0
                        ? data[fieldNames.children].map(item => renderTreeNode(item))
                        : null}
                  </TreeNode>
                  );
                };
              return renderTreeNode(element);
              })
            : null}
        </Tree>
      ) : null}
    </div>
  );
}
export default SearchTree;
