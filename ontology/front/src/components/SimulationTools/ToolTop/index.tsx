import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  Space,
  Message,
  Dropdown,
  Menu,
  Drawer,
  Select,
  Checkbox,
  Radio,
  Modal,
  Form,
} from '@arco-design/web-react';
import {
  IconSearch,
  IconDelete,
  IconImport,
  IconDatabase,
  IconRefresh,
  IconArrowDown,
  IconPlus,
} from 'modo-design/icon';
import ImportIcon from './img/import-icon.svg';
import AddIcon from './img/add-icon.svg';

import type { ToolMenuProps } from '../toolProps';
import AutoToolTip from '../AutoToolTip';
import './style/index.less';
const RadioGroup = Radio.Group;

import draClose from '../ToolRight/img/dra-close.svg';
import ObjectIcon from '../ToolRight/img/obj-title.png';
import FunctionIcon from '../ToolRight/img/func-title.png';
import ActionIcon from '../ToolRight/img/action-title.png';
import { IconExclamationCircleFill } from '@arco-design/web-react/icon';

const { Option } = Select;
const { Group: CheckboxGroup } = Checkbox;

// 自定义Radio按钮组件
const CustomRadioButtons = (props: {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}) => {
  const { value = 'full', onChange, disabled = false } = props;

  return (
    <div className="data-initialization-modal-custom-radio">
      <div
        className={`custom-radio-button ${value === 'full' ? 'active' : ''} ${
          disabled ? 'disabled' : ''
        }`}
        onClick={() => !disabled && onChange && onChange('full')}
        style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        全量
      </div>
      <div
        className={`custom-radio-button ${value === 'incremental' ? 'active' : ''} ${
          disabled ? 'disabled' : ''
        }`}
        onClick={() => !disabled && onChange && onChange('incremental')}
        style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        增量
      </div>
    </div>
  );
};

// 定义组件暴露的API接口
export interface ToolMenuRef {
  openDataInitializationModal: () => void;
}

const ToolMenu = React.forwardRef<ToolMenuRef, ToolMenuProps>(
  ({ selectData, onMenuClick, getPopupContainer, ontologyGraph, nodes }, ref) => {
    // 处理selectData，如果是数组则取第一个值
    const processedSelectData =
      Array.isArray(selectData) && selectData.length > 0 ? selectData[0] : selectData;

    // 检查selectData是否为空
    const isDisabled = !processedSelectData || Object.keys(processedSelectData).length === 0;

    // 工具菜单事件处理函数

    // 移除节点确认弹窗状态
    const [removeConfirmVisible, setRemoveConfirmVisible] = useState(false);

    const handleRemoveNode = () => {
      if (isDisabled) {
        Message.info('请先选择一个节点');
        return;
      }
      setRemoveConfirmVisible(true);
    };

    const handleRemoveConfirm = () => {
      onMenuClick && onMenuClick('removeNode', processedSelectData);
      setRemoveConfirmVisible(false);
    };

    const handleRemoveCancel = () => {
      setRemoveConfirmVisible(false);
    };

    const handleQuery = () => {
      Message.info('查询功能被点击');
      onMenuClick && onMenuClick('query', processedSelectData);
    };

    // 刷新功能处理函数
    const handleRefresh = () => {
      Message.info('刷新功能被点击');
      onMenuClick && onMenuClick('refresh', processedSelectData);
    };

    // 下拉菜单项点击处理
    const handleMenuItemClick = (key: string, data?: any) => {
      let eventName = '';
      switch (key) {
        case '1':
          eventName = 'fullImport';
          break;
        case '2':
          eventName = 'partialImport';
          break;
        case '3':
          if (isDisabled) {
            Message.info('请先选择一个节点');
            return;
          }
          eventName = 'addRelated';
          break;
        default:
          break;
      }
      console.log('eventName', eventName, data);
      onMenuClick && onMenuClick(eventName, data);
    };

    // 搜索状态
    const [searchText, setSearchText] = useState('');
    // 分类展开状态
    const [expandedCategories, setExpandedCategories] = useState(['object']);
    // 分类半选状态
    const [categoryIndeterminate, setCategoryIndeterminate] = useState({});
    // 项选中状态 - 使用数组存储选中的item id
    const [itemChecked, setItemChecked] = useState([]);
    // 导入节点下拉菜单状态
    const [dropdownVisible, setDropdownVisible] = useState(false);
    // 数据初始化弹窗状态
    const [modalVisible, setModalVisible] = useState(false);
    // 表单实例
    const [form] = Form.useForm();

    // DOM引用
    const dropdownContentRef = useRef<HTMLDivElement>(null);

    // 使用useImperativeHandle暴露API给父组件
    React.useImperativeHandle(ref, () => ({
      openDataInitializationModal: () => {
        setModalVisible(true);
      },
    }));

    // 设置下拉内容高度
    const setDropdownHeight = () => {
      if (!dropdownContentRef.current) return;

      // 获取.simulation-flow .simulation-flow-content元素
      const flowContentElement = document.querySelector(
        '.simulation-flow .simulation-flow-content',
      );
      if (flowContentElement) {
        const flowHeight = flowContentElement.offsetHeight;
        // 设置下拉内容高度
        dropdownContentRef.current.style.height = `${flowHeight - 70}px`;
      }
    };

    // 监听dropdownVisible变化，当展开时设置高度
    useEffect(() => {
      if (dropdownVisible) {
        // 延迟设置高度，确保DOM已渲染
        const timer = setTimeout(() => {
          setDropdownHeight();
        }, 100);

        // 添加resize事件监听
        window.addEventListener('resize', setDropdownHeight);

        return () => {
          clearTimeout(timer);
          window.removeEventListener('resize', setDropdownHeight);
        };
      }
    }, [dropdownVisible]);
    // 动态分类数据
    const [categories, setCategories] = useState([
      { id: 'object', name: '对象', checked: true, expanded: true, items: [], disabled: false },
      { id: 'logic', name: '逻辑', checked: false, expanded: false, items: [], disabled: false },
      { id: 'action', name: '动作', checked: false, expanded: false, items: [], disabled: false },
    ]);

    // 使用props传递的ontologyGraph数据
    useEffect(() => {
      if (ontologyGraph && ontologyGraph.length > 0) {
        // 获取所有nodes的id集合，用于判断项是否应该被禁用
        const nodeIds = new Set(nodes && Array.isArray(nodes) ? nodes.map(node => node.id) : []);

        // 处理接口返回的数据，转换为分类结构
        const objectItems = ontologyGraph
          .filter(item => item.nodeType === 'object')
          .map(item => ({
            id: item.elementId,
            name: `${item.label} ${item.name}`,
            checked: false,
            disabled: nodeIds.has(item.elementId),
            icon: 'database',
          }));

        const logicItems = ontologyGraph
          .filter(item => item.nodeType === 'logic')
          .map(item => ({
            id: item.elementId,
            name: `${item.label} ${item.name}`,
            checked: false,
            disabled: nodeIds.has(item.elementId),
            icon: 'logic',
          }));

        const actionItems = ontologyGraph
          .filter(item => item.nodeType === 'action')
          .map(item => ({
            id: item.elementId,
            name: `${item.label} ${item.name}`,
            checked: false,
            disabled: nodeIds.has(item.elementId),
            icon: 'interface',
          }));

        // 检查每个分类下是否有可勾选的项
        const objectDisabled = !objectItems.some(item => !item.disabled);
        const logicDisabled = !logicItems.some(item => !item.disabled);
        const actionDisabled = !actionItems.some(item => !item.disabled);

        // 更新分类数据
        setCategories([
          {
            id: 'object',
            name: '对象',
            checked: true,
            expanded: true,
            items: objectItems,
            disabled: objectDisabled,
          },
          {
            id: 'logic',
            name: '逻辑',
            checked: false,
            expanded: false,
            items: logicItems,
            disabled: logicDisabled,
          },
          {
            id: 'action',
            name: '动作',
            checked: false,
            expanded: false,
            items: actionItems,
            disabled: actionDisabled,
          },
        ]);
      }
    }, [ontologyGraph, nodes]);

    // 当categories变化时，重置itemChecked状态
    useEffect(() => {
      setItemChecked([]);
    }, [categories]);

    // 当itemChecked变化时，更新categoryIndeterminate状态
    useEffect(() => {
      const newIndeterminate = {};

      categories.forEach(category => {
        const categoryItemIds = category.items.map(item => item.id);
        const checkedItemCount = categoryItemIds.filter(id => itemChecked.includes(id)).length;

        // 设置分类的半选状态
        newIndeterminate[category.id] =
          checkedItemCount > 0 && checkedItemCount < categoryItemIds.length;
      });

      setCategoryIndeterminate(newIndeterminate);
    }, [itemChecked]);

    // 监听nodes变化，将已存在于nodes中的categories项设置为不可勾选
    useEffect(() => {
      if (nodes && Array.isArray(nodes)) {
        // 获取所有nodes的id集合
        const nodeIds = new Set(nodes.map(node => node.id));

        // 更新categories，将匹配的项设置为disabled
        setCategories(prevCategories => {
          return prevCategories.map(category => {
            // 更新items的disabled状态
            const updatedItems = category.items.map(item => ({
              ...item,
              disabled: nodeIds.has(item.id),
            }));

            // 检查分类下是否有可勾选的项
            const hasEnabledItems = updatedItems.some(item => !item.disabled);

            return {
              ...category,
              items: updatedItems,
              disabled: !hasEnabledItems,
            };
          });
        });
      }
    }, [nodes]);

    // 分类全选/取消全选处理
    const handleCategoryCheck = (categoryId: string, checked: boolean) => {
      const category = categories.find(c => c.id === categoryId);
      if (!category) return;

      // 只处理未被禁用的项
      const categoryItemIds = category.items.filter(item => !item.disabled).map(item => item.id);

      setItemChecked(prev => {
        if (checked) {
          // 全选：将该分类下所有未选中且未禁用的项添加到选中列表
          const newChecked = [...prev];
          categoryItemIds.forEach(id => {
            if (!newChecked.includes(id)) {
              newChecked.push(id);
            }
          });
          return newChecked;
        } else {
          // 取消全选：从选中列表中移除该分类下所有未禁用的项
          return prev.filter(id => !categoryItemIds.includes(id));
        }
      });
    };

    // 子项选中状态变化处理
    const handleItemCheck = (checkedIds: string[]) => {
      setItemChecked(checkedIds);
    };

    // 确认并加载
    const handleConfirmLoad = () => {
      setModalVisible(false);
      // 获取表单数据
      const formData = form.getFieldsValue();
      onMenuClick && onMenuClick('initData', formData);
    };

    return (
      <div className="simulation-tool-menu-container">
        <Dropdown
          trigger="click"
          popupVisible={dropdownVisible}
          onVisibleChange={visible => {
            setDropdownVisible(visible);
          }}
          droplist={
            <div className="custom-dropdown-content" ref={dropdownContentRef}>
              {/* 一键全量导入 */}
              <button
                onClick={() => {
                  handleMenuItemClick('1');
                  setDropdownVisible(false);
                }}
                className="full-import-btn"
              >
                一键全量导入
              </button>

              {/* 搜索框 */}
              <div className="search-container">
                <input
                  type="text"
                  placeholder="搜索节点名称"
                  className="search-input"
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                />
                <IconSearch className="search-icon" />
              </div>

              {/* 分类列表 */}
              <div className="category-list">
                {categories.map(category => {
                  // 根据搜索文本过滤分类下的items
                  const filteredItems = category.items.filter(item =>
                    item.name.toLowerCase().includes(searchText.toLowerCase()),
                  );

                  return (
                    <div key={category.id} className="category-item">
                      {/* 分类标题 */}
                      <div className="category-header">
                        <Checkbox
                          checked={
                            filteredItems.length > 0 &&
                            filteredItems.every(item => itemChecked.includes(item.id))
                          }
                          indeterminate={
                            filteredItems.length > 0 &&
                            filteredItems.some(item => itemChecked.includes(item.id)) &&
                            !filteredItems.every(item => itemChecked.includes(item.id))
                          }
                          onChange={checked => handleCategoryCheck(category.id, checked)}
                          disabled={category.disabled}
                        />
                        <span
                          className="category-name"
                          onClick={() => {
                            if (expandedCategories.includes(category.id)) {
                              setExpandedCategories(
                                expandedCategories.filter(id => id !== category.id),
                              );
                            } else {
                              setExpandedCategories([...expandedCategories, category.id]);
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                          }}
                        >
                          {category.name}
                          <IconArrowDown
                            className={`category-arrow ${
                              expandedCategories.includes(category.id) ? 'expanded' : ''
                            }`}
                          />
                        </span>
                      </div>

                      {/* 分类内容 */}
                      {expandedCategories.includes(category.id) && (
                        <div className="category-content">
                          <CheckboxGroup
                            value={itemChecked.filter(id =>
                              filteredItems.map(item => item.id).includes(id),
                            )}
                            onChange={checkedIds => {
                              // 获取当前分类下所有item的id
                              const currentCategoryItemIds = filteredItems.map(item => item.id);
                              // 过滤掉当前分类下的所有item，保留其他分类的选中状态
                              const otherCheckedIds = itemChecked.filter(
                                id => !currentCategoryItemIds.includes(id),
                              );
                              // 合并当前分类的选中状态和其他分类的选中状态
                              const newCheckedIds = [...otherCheckedIds, ...checkedIds];
                              setItemChecked(newCheckedIds);
                            }}
                          >
                            {filteredItems.map(item => (
                              <div key={item.id} className="category-item-row">
                                <Checkbox value={item.id} disabled={item.disabled} />
                                <div className="item-icon">
                                  {/* 根据icon类型显示不同图标 */}
                                  {item.icon === 'database' && (
                                    <img
                                      src={ObjectIcon}
                                      alt="对象"
                                      style={{ width: 24, height: 24 }}
                                    />
                                  )}
                                  {item.icon === 'logic' && (
                                    <img
                                      src={FunctionIcon}
                                      alt="逻辑"
                                      style={{ width: 24, height: 24 }}
                                    />
                                  )}
                                  {item.icon === 'interface' && (
                                    <img
                                      src={ActionIcon}
                                      alt="动作"
                                      style={{ width: 24, height: 24 }}
                                    />
                                  )}
                                </div>
                                <AutoToolTip className="item-name">{item.name}</AutoToolTip>
                              </div>
                            ))}
                          </CheckboxGroup>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* 部分导入 */}
              <button
                onClick={() => {
                  setDropdownVisible(false);
                  // 触发部分导入事件，并传递勾选的数据
                  handleMenuItemClick('2', itemChecked);
                  setItemChecked([]);
                }}
                className="full-import-btn full-import-btn-primary"
              >
                导入
              </button>
            </div>
          }
        >
          <div className="import-node-btn">
            <div className="menu-item">
              <img src={ImportIcon} alt="导入节点" />
              <span>导入节点</span>
            </div>
            <IconArrowDown className={`import-arrow ${dropdownVisible ? 'expanded' : ''}`} />
          </div>
        </Dropdown>

        <div className="tool-menu-box">
          <div className="menu-item" onClick={() => handleMenuItemClick('3')}>
            <img src={AddIcon} alt="添加相关资源" />
            <span>添加相关资源</span>
          </div>
          <div className="menu-item" onClick={handleRemoveNode}>
            <IconDelete />
            <span>移除节点</span>
          </div>
          <div className="line"></div>
          <div className="menu-item has-border" onClick={() => setModalVisible(true)}>
            <IconDatabase />
            <span>数据初始化</span>
          </div>
        </div>

        {/* 数据初始化弹窗 */}
        <Modal
          title="数据初始化"
          visible={modalVisible}
          onCancel={() => setModalVisible(false)}
          className="data-initialization-modal"
          getPopupContainer={() => getPopupContainer?.current}
          closeIcon={<img src={draClose} alt="close" />}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" onClick={handleConfirmLoad}>
                立即载入
              </Button>
            </div>
          }
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              timeWindow: 'full',
              updateFrequency: 'noUpdate',
              sourceOntology: 'full',
            }}
          >
            <div className="data-initialization-modal-content">
              {/* 顶部提示信息 */}
              <div className="data-initialization-modal-tip">
                <span className="data-initialization-modal-tip-icon">
                  <IconExclamationCircleFill />
                </span>
                <span className="data-initialization-modal-tip-text" style={{ fontSize: 14 }}>
                  针对画面对象节点进行全局数据初始化，系统将抽取真实数据，部分节点若未同步数据可下节点进行补充。
                </span>
              </div>

              {/* 时间窗口 */}
              {/* <div className="data-initialization-modal-item">
              <Form.Item
                label="时间窗口"
                field="timeWindow"
                rules={[{ required: true, message: '请选择时间窗口' }]}
              >
                <Select style={{ width: '100%' }}>
                  <Option value="full">全量</Option>
                  <Option value="yesterday">昨日</Option>
                  <Option value="recent7">最近7天</Option>
                  <Option value="recent30">最近30天</Option>
                </Select>
              </Form.Item>
            </div> */}

              {/* 数据更新频率 */}
              <div className="data-initialization-modal-item">
                <Form.Item
                  label="数据更新频率"
                  field="updateFrequency"
                  rules={[{ required: true, message: '请选择数据更新频率' }]}
                >
                  <Select style={{ width: '100%' }} disabled>
                    <Option value="noUpdate">不更新</Option>
                    <Option value="daily">每天更新</Option>
                    <Option value="weekly">每7天更新</Option>
                    <Option value="monthly">每30天更新</Option>
                  </Select>
                </Form.Item>
              </div>

              {/* 来源本体 */}
              <div className="data-initialization-modal-item">
                <Form.Item
                  label="来源本体"
                  field="sourceOntology"
                  rules={[{ required: true, message: '请选择来源本体' }]}
                >
                  <CustomRadioButtons disabled />
                </Form.Item>
              </div>
            </div>
          </Form>
        </Modal>

        {/* 移除节点确认弹窗 */}
        <Modal
          className="remove-node-modal"
          visible={removeConfirmVisible}
          onCancel={handleRemoveCancel}
          getPopupContainer={() => getPopupContainer?.current}
          closeIcon={<img src={draClose} alt="close" />}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={handleRemoveCancel}>取消</Button>
              <Button type="primary" onClick={handleRemoveConfirm}>
                确定
              </Button>
            </div>
          }
          title={
            <div>
              <IconExclamationCircleFill />
              <span>移除节点</span>
            </div>
          }
        >
          <div>
            <p>您可以移除画布上的节点，会同步移除节点上的配置，以及相关的其他节点。</p>
          </div>
        </Modal>
      </div>
    );
  },
);

export default ToolMenu;