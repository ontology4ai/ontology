import React, { useState, useRef } from 'react';
import { Button, Card, Space, Typography, Message } from '@arco-design/web-react';
import { IconAdd, IconEditColor, IconDeleteColor } from 'modo-design/icon';
import ToolMenu, { ToolMenuRef } from '@/components/SimulationTools/ToolTop';
import ToolRightMenu, { ToolRightMenuRef } from '@/components/SimulationTools/ToolRight';

const { Title, Text } = Typography;

const TestComponentDev: React.FC = () => {
  // 状态管理：存储选中的数据
  const [selectData, setSelectData] = useState<any[]>([]);

  // 创建ref对象，用于指定Drawer挂载的节点
  const popupRef = useRef<HTMLElement>(null);

  // 创建ref对象，用于调用ToolMenu组件的暴露方法
  const toolMenuRef = useRef<ToolMenuRef>(null);

  // 创建ref对象，用于调用ToolRightMenu组件的暴露方法
  const toolRightMenuRef = useRef<ToolRightMenuRef>(null);

  // 点击按钮处理函数
  const handleButtonClick = (type: 'object' | 'function' | 'action') => {
    // 根据类型创建不同的数据
    const dataMap = {
      object: [{ id: 1, name: '对象1', type: 'object' }],
      function: [{ id: 2, name: '函数1', type: 'function' }],
      action: [{ id: 3, name: '动作1', type: 'action' }],
    };
    setSelectData(dataMap[type]);
  };

  // 菜单点击事件处理函数
  const handleMenuClick = (event: string, data?: any) => {
    console.log(event, data);
  };

  return (
    <div
      style={{
        margin: '40px',
        padding: '20px',
        position: 'relative',
        backgroundColor: '#f8fafc',
        height: '800px',
      }}
    >
      <ToolMenu
        ref={toolMenuRef}
        selectData={selectData}
        getPopupContainer={popupRef}
        onMenuClick={handleMenuClick}
      />
      <div className="test" style={{ position: 'absolute', top: '50px', right: '20px' }}>
        <ToolRightMenu
          ref={toolRightMenuRef}
          selectData={selectData}
          getPopupContainer={popupRef}
          onMenuClick={handleMenuClick}
        />
      </div>

      <div
        ref={popupRef}
        style={{
          padding: '20px',
          backgroundColor: '#f9fbfd',
          borderRadius: '4px',
          height: '400px',
        }}
      >
        <Space style={{ marginBottom: '20px' }}>
          <button onClick={() => handleButtonClick('object')}>对象1</button>
          <button onClick={() => handleButtonClick('function')}>函数1</button>
          <button onClick={() => handleButtonClick('action')}>动作1</button>
        </Space>

        <div style={{ marginTop: '20px' }}>
          <Title heading={6} style={{ marginBottom: '10px' }}>
            测试暴露接口
          </Title>
          <Space>
            <Button onClick={() => toolMenuRef.current?.openDataInitializationModal()}>
              测试打开数据初始化弹窗
            </Button>
            <Button onClick={() => toolRightMenuRef.current?.openRuleSimulationDrawer()}>
              测试打开规则仿真抽屉
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
};

export default TestComponentDev;
