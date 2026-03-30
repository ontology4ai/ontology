import React, { useState, useRef, useEffect } from 'react';
import { Message } from '@arco-design/web-react';
import { IconSearch, IconDelete, IconImport, IconDatabase, IconRefresh } from 'modo-design/icon';
import type { ToolMenuProps } from '../toolProps';
import NodeDetailDrawer from './NodeDetailDrawer';
import RuleSimulationDrawer from './RuleSimulationDrawer';
import './style/index.less';

// 定义组件暴露的API接口
export interface ToolRightMenuRef {
  openRuleSimulationDrawer: () => void;
}

const ToolRightMenu = React.forwardRef<ToolRightMenuRef, ToolMenuProps>(
  ({ selectData, onMenuClick, getPopupContainer, ontologyGraph }, ref) => {
    // 处理selectData，如果是数组则取第一个值
    const processedSelectData =
      Array.isArray(selectData) && selectData.length > 0 ? selectData[0] : selectData;

    // 检查selectData是否为空
    const isDisabled = !processedSelectData || Object.keys(processedSelectData).length === 0;

    // 节点详情抽屉状态
    const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
    // 规则仿真抽屉状态
    const [ruleSimulationDrawerVisible, setRuleSimulationDrawerVisible] = useState(false);
    // 节点类型，默认为对象类型，可切换为函数类型或动作类型
    const [nodeType, setNodeType] = useState<'object' | 'logic' | 'action'>('object');
    // 对象详情数据，用于在组件间共享
    const [objDetail, setObjDetail] = useState<any>({});
    // 为不同processedSelectData.id缓存objDetail数据
    const [objDetailCache, setObjDetailCache] = useState<Record<string, any>>({});

    // 当processedSelectData变化时，更新nodeType为processedSelectData.type
    useEffect(() => {
      if (processedSelectData && processedSelectData.type) {
        // 确保type是有效的节点类型
        if (['object', 'logic', 'action'].includes(processedSelectData.type)) {
          setNodeType(processedSelectData.type as 'object' | 'logic' | 'action');
          // 如果type不为object，且当前展示的是规则仿真抽屉，则切换到节点详情抽屉
          if (processedSelectData.type !== 'object' && ruleSimulationDrawerVisible) {
            setRuleSimulationDrawerVisible(false);
            setDetailDrawerVisible(true);
            setActiveMenu('nodeDetail');
          }
        }
      } else {
        // 当processedSelectData为空时，收起所有抽屉
        setDetailDrawerVisible(false);
        setRuleSimulationDrawerVisible(false);
        setActiveMenu('');
      }
    }, [processedSelectData]);

    // 激活的菜单选项
    const [activeMenu, setActiveMenu] = useState<string>('');

    // 菜单列表ref
  const menuListRef = useRef<HTMLDivElement>(null);
  // 抽屉DOM ref
  const drawerRef = useRef<HTMLDivElement>(null);
  // IntersectionObserver ref
  const observerRef = useRef<IntersectionObserver | null>(null);

    // 使用useImperativeHandle暴露API给父组件
    React.useImperativeHandle(ref, () => ({
      openRuleSimulationDrawer: () => {
        // 检查是否有选中数据
        if (!processedSelectData || Object.keys(processedSelectData).length === 0) {
          Message.info('请先选择一个节点');
          return;
        }

        // 检查节点类型是否为object
        if (processedSelectData.type !== 'object') {
          Message.info('只有对象类型节点可以进行规则仿真');
          return;
        }

        // 打开规则仿真抽屉
        setActiveMenu('ruleSimulation');
        setDetailDrawerVisible(false);
        setRuleSimulationDrawerVisible(true);
        onMenuClick && onMenuClick('ruleSimulation', processedSelectData);
      },
    }));

    // 工具菜单事件处理函数
    const handleNodeDetail = () => {
      setActiveMenu('nodeDetail');
      setDetailDrawerVisible(true);
      setRuleSimulationDrawerVisible(false);
      onMenuClick && onMenuClick('nodeDetail', processedSelectData);
    };

    const handleRuleSimulation = () => {
      setActiveMenu('ruleSimulation');
      setDetailDrawerVisible(false);
      setRuleSimulationDrawerVisible(true);
      onMenuClick && onMenuClick('ruleSimulation', processedSelectData);
    };

    // 执行规则仿真
    const handleRuleSimulationExecute = (data: any) => {
      onMenuClick && onMenuClick('executeRuleSimulation', data);
    };

    // 抽屉打开后的回调函数
    const handleDrawerAfterOpen = () => {
      setTimeout(() => {
        // 获取当前可见的抽屉DOM元素
        let drawerElement;
        if (detailDrawerVisible) {
          drawerElement = document.querySelector('.detail-simulation-drawer.arco-drawer');
        } else if (ruleSimulationDrawerVisible) {
          drawerElement = document.querySelector('.rule-simulation-drawer.arco-drawer');
        }
        if (drawerElement && menuListRef.current) {
          // 获取抽屉的位置信息
          const drawerRect = drawerElement.getBoundingClientRect();
          // 设置菜单列表的位置，将其挂载到抽屉的最右边
          menuListRef.current.style.position = 'fixed';
          menuListRef.current.style.top = `${drawerRect.top + 40}px`;
          menuListRef.current.style.left = `${drawerRect.x - (31 - 8)}px`;
          menuListRef.current.style.zIndex = '1000';
          
          // 创建IntersectionObserver来监听抽屉是否在屏幕上可见
          if (observerRef.current) {
            observerRef.current.disconnect();
          }
          
          observerRef.current = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (menuListRef.current) {
                  if (entry.isIntersecting) {
                    // 抽屉可见时显示菜单列表
                    menuListRef.current.style.display = 'block';
                  } else {
                    // 抽屉不可见时隐藏菜单列表
                    menuListRef.current.style.display = 'none';
                  }
                }
              });
            },
            {
              root: null, // 使用视口作为根元素
              rootMargin: '0px',
              threshold: 0.1 // 当抽屉有10%可见时触发
            }
          );
          
          // 观察抽屉元素
          observerRef.current.observe(drawerElement);
        }
      }, 0);
    };

    // 抽屉关闭时恢复菜单列表的位置
    useEffect(() => {
      // 当两个抽屉都关闭时，恢复菜单列表的位置
      if (!detailDrawerVisible && !ruleSimulationDrawerVisible && menuListRef.current) {
        menuListRef.current.style.position = '';
        menuListRef.current.style.top = '';
        menuListRef.current.style.left = '';
        menuListRef.current.style.zIndex = '';
        menuListRef.current.style.display = '';
      }
      
      // 当抽屉关闭时，断开IntersectionObserver的连接
      if (!detailDrawerVisible && !ruleSimulationDrawerVisible && observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    }, [detailDrawerVisible, ruleSimulationDrawerVisible]);

    return (
      <div className="simulation-tool-right-container" ref={menuListRef}>
        <div className="simulation-tool-right-menu-list" >
          <div
            className={`simulation-tool-right-menu-item ${
              activeMenu === 'nodeDetail' ? 'active' : ''
            } ${isDisabled ? 'disabled' : ''}`}
            onClick={isDisabled ? undefined : handleNodeDetail}
            style={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}
          >
            节点详情
          </div>
          <div className="simulation-tool-right-menu-line"></div>
          <div
            className={`simulation-tool-right-menu-item ${
              activeMenu === 'ruleSimulation' && nodeType === 'object' && !isDisabled
                ? 'active'
                : ''
            } ${nodeType !== 'object' || isDisabled ? 'disabled' : ''}`}
            onClick={nodeType === 'object' && !isDisabled ? handleRuleSimulation : undefined}
            style={{ cursor: nodeType !== 'object' || isDisabled ? 'not-allowed' : 'pointer' }}
          >
            规则仿真
          </div>
          <div className="simulation-tool-right-menu-line"></div>
          <div
            className="simulation-tool-right-menu-item disabled"
            style={{ cursor: 'not-allowed' }}
          >
            问答仿真
          </div>
        </div>

        {/* 节点详情抽屉组件 */}
        <NodeDetailDrawer
          visible={detailDrawerVisible}
          onCancel={() => {
            setDetailDrawerVisible(false);
            setActiveMenu('');
          }}
          getPopupContainer={getPopupContainer}
          nodeType={nodeType}
          afterOpen={handleDrawerAfterOpen}
          selectData={processedSelectData}
          onObjDetailChange={detail => {
            setObjDetail(detail);
            // 缓存objDetail数据到对应processedSelectData.id下
            if (processedSelectData?.id) {
              setObjDetailCache(prev => ({
                ...prev,
                [processedSelectData.id]: detail,
              }));
            }
          }}
        />

        {/* 规则仿真抽屉组件 */}
        <RuleSimulationDrawer
          visible={ruleSimulationDrawerVisible}
          onCancel={() => {
            setRuleSimulationDrawerVisible(false);
            setActiveMenu('');
          }}
          onExecute={data => handleRuleSimulationExecute(data)}
          getPopupContainer={getPopupContainer}
          afterOpen={handleDrawerAfterOpen}
          ontologyGraph={ontologyGraph}
          selectData={processedSelectData}
          objDetail={
            processedSelectData?.id
              ? objDetailCache[processedSelectData.id] || objDetail
              : objDetail
          }
        />
      </div>
    );
  },
);

export default ToolRightMenu;
