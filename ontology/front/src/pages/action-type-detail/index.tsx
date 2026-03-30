import { Menu, Spin } from '@arco-design/web-react';
import { IconGrid, IconPlateCreatedColor, IconProgramMgrColor } from 'modo-design/icon';
import React, { useEffect, useMemo, useState,useRef, useImperativeHandle, forwardRef  } from 'react';
import ActionTypeOverview from './action-type-overview';
import ActionTypeRule from './action-type-rule';
import ActionTypeSubmit from './action-type-submit';
import { getActionDetail } from './api';

import './style/index.less';

interface MenuItem {
  name: string;
  label: string;
  icon: React.ReactNode;
  // 修改 component 类型为 ComponentType
  component: React.ComponentType<any>;
  props?: Record<string, any>; // 可选 props
}

interface ActionTypeDetailProps {
  action: any;
  onUpdateUseSaveBtn: Function;
  ontology:any;
}

export interface ActionTypeDetailRef {
  handleSave: (callback?: (...args: any) => void) => Promise<void> | void;
}

const ActionTypeDetail = forwardRef<ActionTypeDetailRef, ActionTypeDetailProps>(
  ({ action, onUpdateUseSaveBtn, ontology },ref) => {
  const [loading, setLoading] = useState(false);
  const [menuKey, setMenuKey] = useState('overview');
  const [actionData, setActionData] = useState<any>(null);
  const activeComponentRef = useRef<any>(null);
  const getData = async () => {
    try {
      setLoading(true);
      const { data } = await getActionDetail(action.id);
      setActionData(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, [action]);
    useImperativeHandle(ref, () => ({
      handleSave: async (callback: (...args: any) => void) => {
        if (activeComponentRef.current && typeof activeComponentRef.current.handleSave === 'function') {
          return await activeComponentRef.current.handleSave((...args:any)=>{ callback(...args);});
        }
      },
    }));
  useEffect(() => {
    onUpdateUseSaveBtn(action.id, true);
  }, []);
  // 定义 memoized 组件
  const MemoizedOverview = useMemo(
    () =>
      actionData
        ? React.memo(forwardRef((props, ref) => <ActionTypeOverview ontology={ontology} ref={ref} action={actionData} getData={getData} />))
        : null,
    [actionData],
  );

  const menuItems = useMemo<MenuItem[]>(
    () => [
      {
        name: 'overview',
        label: '概览',
        icon: <IconGrid />,
        component: MemoizedOverview || (() => null),
        props: { action: actionData },
      },
      {
        name: 'rule',
        label: '规则',
        disabled: true,
        icon: <IconProgramMgrColor />,
        component: React.memo(ActionTypeRule),
      },
      {
        name: 'submit',
        label: '提交标准',
        disabled: true,
        icon: <IconPlateCreatedColor />,
        component: React.memo(ActionTypeSubmit),
      },
    ],
    [MemoizedOverview, actionData],
  );

  const activeItem = useMemo(
    () => menuItems.find(item => item.name === menuKey),
    [menuItems, menuKey],
  );

  const activeComponent = useMemo(() => {
    if (!activeItem || !activeItem.component) return null;
    const Component = activeItem.component;
    // 为组件添加 ref，只有 overview 组件会接收到 ref
    return <Component
      ref={menuKey === 'overview' ? activeComponentRef : null}
      {...(activeItem.props || {})}
    />;
  }, [activeItem]);

  return (
    <Spin loading={loading} className="action-type-detail">
      {/* <div className="action-type-detail-menu">
        <div className="action-type-detail-menu__label">{action.actionName}</div>
        <div className="action-type-detail-menu__list">
          <Menu selectedKeys={[menuKey]} onClickMenuItem={setMenuKey}>
            {menuItems.map(item => (
              <Menu.Item key={item.name} disabled={item.disabled}>
                <span className="icon">{item.icon}</span>
                <span>{item.label}</span>
              </Menu.Item>
            ))}
          </Menu>
        </div>
      </div> */}
      <div className="action-type-detail-content">{actionData ? activeComponent : null}</div>
    </Spin>
  );
});

export default ActionTypeDetail;
