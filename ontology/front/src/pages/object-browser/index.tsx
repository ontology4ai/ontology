import Tabs from '@/components/Tabs';
import { Avatar, Button, Card, Input, Select, Spin } from '@arco-design/web-react';
import {
  IconArrowDown,
  IconDataQueryColor,
  IconDataResDirColor,
  IconEyeColor,
  IconSearchColor,
} from 'modo-design/icon';
import React, { useEffect, useRef, useState } from 'react';
import { getData } from './api/index';
import ObjectTypeDrawer from './object-type-drawer';
import './style/index.less';
import { ObjectTypeItem } from './type';

interface TabsRef {
  setActive: (key: string | null) => void;
  addTab: (item: { key: string; title: string; view: React.ReactNode }) => void;
  state: {
    tabs: Array<{ key: string; title: string }>;
  };
}
const ObjectTypeCard = ({
  item,
  onPreview,
}: {
  item: ObjectTypeItem;
  onPreview: (item: ObjectTypeItem) => void;
}) => {
  const handleOpenView = (object: ObjectTypeItem) => {
    onPreview(object);
  };

  return (
    <Card className="card">
      <Avatar size={34} className="card-icon">
        <IconDataResDirColor />
      </Avatar>
      <div className="card-content">
        <div className="title">
          <span className="text">{item.objectTypeLabel}</span>
         {/* <span className="tag">{item.instanceNum}</span>*/}
        </div>
        <div className="descr">【归属本体】{item.ontology.ontologyLabel}</div>
      </div>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={() => handleOpenView(item)}
        onClick={() => handleOpenView(item)}
        className="card-action"
      >
        <IconEyeColor />
        预览
      </div>
    </Card>
  );
};

const ObjectBrowserContent = ({
  data,
  total,
  onPreview,
  filterVal,
  setFilterVal,
  getMoreData,
  hasMore,
}: {
  data: ObjectTypeItem[];
  total: number;
  onPreview: (item: ObjectTypeItem) => void;
  getMoreData: () => void;
  filterVal: string;
  setFilterVal: (val: string) => void;
  hasMore: boolean
}) => {
  return (
    <div className="object-browser-content">
      <div className="object-browser-title">
        <div className="object-browser-title__desc">检索你需要的对象类型进行查看</div>
        <div className="object-browser-title__search">
          <Input.Group compact>
            <Select defaultValue="all" showSearch={false} style={{ width: '160px' }}>
              <Select.Option value="all">全部</Select.Option>
            </Select>
            <Input.Search
              placeholder="检索对象类型和属性"
              style={{ width: 'calc(100% - 160px)' }}
              value={filterVal}
              suffix={<IconSearchColor />}
              onChange={value => setFilterVal(value)}
            />
          </Input.Group>
        </div>
      </div>

      <div className="object-browser-content-main">
        <div className="object-browser-content-title">
          <span className="label">对象类型</span>
          <span className="descr">按最近新增或更新的时间倒排，默认展示前20个对象类型</span>
        </div>
        <div className="object-browser-content-total">
          已检索出<span className="number">{total}</span>个对象类型
        </div>
        <div className="object-browser-content-list">
          {data.map((item: ObjectTypeItem) => (
            <ObjectTypeCard item={item} key={item.id} onPreview={onPreview} />
          ))}
        </div>
        <div className="object-browser-content-more">
        {hasMore ? (
          <Button type="text" onClick={getMoreData}>
            查看更多
            <IconArrowDown />
          </Button>
        ) : (
          <span className="light-text">已全部加载</span>
        )}
        </div>
        {/* <div className="object-browser-content-page">
          <Pagination
            size="small"
            total={pagination.total}
            current={pagination.current}
            pageSize={pagination.pageSize}
            showTotal
            showJumper
            sizeCanChange
          />
        </div> */}
      </div>
    </div>
  );
};

const ObjectBrowser = () => {
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [data, setData] = useState<ObjectTypeItem[]>([]);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number>(0);
  const [selectedObject, setSelectedObject] = useState<ObjectTypeItem | null>(null);
  const [filterVal, setFilterVal] = useState('');
  const [activeTab, setActiveTab] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [tabs, setTabs] = useState<Array<{ key: string; title: string }>>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const tabsRef = useRef<TabsRef>(null);
  const tabViewRef = useRef<Record<string, React.ReactNode>>({});
  const handleGetData = async (currentPage: number, currentLimit: number, isLoadMore = false) => {
    setLoading(true);
    try {
      const res = await getData({
        keyword: filterVal,
        limit: currentLimit,
        page: currentPage,
      });
      
      if (res.data.code === '200' && Array.isArray(res.data.data.content)) {
        if (isLoadMore) {
          setData(prevData => [...prevData, ...res.data.data.content]);
        } else {
          setData(res.data.data.content);
        }
        setTotal(res.data.data.totalElements);
        setHasMore(res.data.data.content.length === currentLimit);
      }
    } finally {
      setLoading(false);
    }
  };
  const getMoreData = async () => {
    const newPage = page + 1;
    setPage(newPage);
    await handleGetData(newPage, limit, true);
  };
  
  // 创建防抖搜索函数
  const debounceSearch = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(async() => {
      setPage(1); // 搜索时重置页码为1
      await handleGetData(1, limit);
    }, 500);
  };
  useEffect(() => {
    debounceSearch();
  }, [filterVal]);
  const switchToHomeView = () => {
    setActiveTab('');
    if (tabsRef.current && typeof tabsRef.current?.setActive === 'function') {
      tabsRef.current.setActive(null);
    }
  };
  const handleTabChange = (key: string | null) => {
    setActiveTab(key || '');
  };
  const addTab = (item: { key: string; title: string; view: React.ReactNode }) => {
    tabViewRef.current[item.key] = item.view;

    if (tabsRef.current && typeof tabsRef.current.addTab === 'function') {
      delete item.view; //防止组件重复渲染
      tabsRef.current.addTab(item);
      setActiveTab(item.key);
      setTimeout(() => {
        if (tabsRef.current) {
          setTabs([...tabsRef.current.state.tabs]);
        }
      });
    }
  };

  const handlePreview = (object: any) => {
    setSelectedObject(object);
    setDrawerVisible(true);
  };

  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setSelectedObject(null);
  };

  return (
    <>
      <Spin loading={loading} className="object-browser-spin">
        <div className="object-browser">
          <div className={`object-browser-header ${activeTab ? 'tab-view' : 'home'}`}>
            <div
              role="button"
              tabIndex={0}
              onClick={switchToHomeView}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  switchToHomeView();
                }
              }}
            >
              <IconDataQueryColor style={{ color: 'var(--color-primary-6)', marginRight: '8px' }} />
              <span className="title">本体探索</span>
            </div>
            {/* @ts-ignore */}
            <Tabs ref={tabsRef as any} onChange={handleTabChange} />
          </div>

          {!activeTab ? (
          <ObjectBrowserContent
          data={data}
          total={data.length}
          onPreview={handlePreview}
          filterVal={filterVal}
          setFilterVal={setFilterVal}
          getMoreData={getMoreData}
          hasMore={hasMore}
        />
          ) : (
            <div className="tab-content-container">
              {tabs.map(tab => (
                <div
                  key={tab.key}
                  className="overview"
                  style={{
                    display: activeTab === tab.key ? 'block' : 'none',
                  }}
                >
                  {tabViewRef.current[tab.key]}
                </div>
              ))}
            </div>
          )}
        </div>
      </Spin>

      {drawerVisible && selectedObject && (
        <ObjectTypeDrawer
          visible={drawerVisible}
          onClose={handleCloseDrawer}
          object={selectedObject}
          addTab={addTab}
        />
      )}
    </>
  );
};

export default ObjectBrowser;
