import { logicDetail } from '@/pages/function-manager/api/index';
import { Spin } from '@arco-design/web-react';
import { IconGrid } from 'modo-design/icon';
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import FuncDetail from './function-detail';
import './style/index.less';

interface MenuItem {
  disabled: boolean | undefined;
  name: string;
  label: string;
  icon: React.ReactNode;
  component: React.ComponentType<any>;
  props?: Record<string, any>; // 可选 props
}

interface FunctionOverviewProps {
  data: any;
  onUpdateUseSaveBtn: Function;
  ontology:any
}

const FunctionOverview = forwardRef<any, FunctionOverviewProps>(
  ({ data, onUpdateUseSaveBtn,ontology }, ref) => {
    const [loading, setLoading] = useState(false);
    const [menuKey, setMenuKey] = useState('overview');
    const detailRef = useRef();
    // 定义 memoized 组件
    const MemoizedOverview = useMemo(
      () => (data ? React.memo(() => <FuncDetail logicDataId={data.id} />) : null),
      [data],
    );

    const menuItems = useMemo<MenuItem[]>(
      () => [
        {
          name: 'overview',
          label: '概览',
          icon: <IconGrid />,
          component: MemoizedOverview || (() => null),
          props: { id: data.id },
          disabled: false,
        },
      ],
      [MemoizedOverview, data],
    );

    const activeItem = useMemo(
      () => menuItems.find(item => item.name === menuKey),
      [menuItems, menuKey],
    );

    const activeComponent = useMemo(() => {
      if (!activeItem || !activeItem.component) return null;
      const Component = activeItem.component;
      return <Component {...(activeItem.props || {})} />;
    }, [activeItem]);

    const handleSave = callback => {
      const view = detailRef.current;
      if (view && typeof view.handleSave === 'function') {
        view.handleSave((...args) => {
          callback(...args);
        });
      }
    };
    useImperativeHandle(ref, () => ({
      handleSave,
    }));
    useEffect(() => {
      onUpdateUseSaveBtn(data.logicTypeName, true);
    }, []);
    return (
      <Spin loading={loading} className="function-detail">
        <div className="function-detail-content">
          {menuKey === 'overview' ? (
            <FuncDetail
              ref={detailRef}
              data={data}
              ontology={ontology}
              onUpdateUseSaveBtn={onUpdateUseSaveBtn}
            />
          ) : null}
        </div>
      </Spin>
    );
  },
);

export default FunctionOverview;
