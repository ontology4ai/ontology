import React, { useEffect, useState, useRef } from 'react';
import {Space, Tabs, Spin, Message, Descriptions, Empty} from '@arco-design/web-react';
import {
  IconPlateCreatedColor,
  IconServiceMonitoringColor,
  IconMergeColor,
  IconUserColor,
  IconDataMapColor,
} from 'modo-design/icon';
import { getData as getObject } from '@/pages/obj-manager/api';
import { getData as getLink } from '@/pages/link-manager/api';
import { getActionList as getAction } from '@/pages/action-manager/api';
import { logicList as getLogic } from '@/pages/function-manager/api';
import CardItem from './card-item';
import oneToOneIcon from '@/pages/link-manager/images/oToO.svg';
import oneToManyIcon from '@/pages/link-manager/images/oToM.svg';
import manyToManyIcon from '@/pages/link-manager/images/mToM.svg';
import './style/index.less';
import { ontologyPrompt } from '../api';
import {getMcpServer, getMcpServerTool} from "@/pages/ontology-server/api";
import emptyIcon from "@/pages/object/images/empty.svg";

interface DataType {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  updateTime: string;
}

const { TabPane } = Tabs;

const PublishModelTabs: React.FC<{ ontologyId: string }> = ({ ontologyId }) => {
  const [objectData, setObjectData] = useState<DataType[]>([]);
  const [linkData, setLinkData] = useState<DataType[]>([]);
  const [actionData, setActionData] = useState<DataType[]>([]);
  const [logicData, setLogicData] = useState<DataType[]>([]);
  const [pagination, setPagination] = useState({
    object: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
    link: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
    action: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
    logic: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
  });
  const [loading, setLoading] = useState(false);
  const [mcpLoading, setMcpLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState('object');
  const [counts, setCounts] = useState({
    object: 0,
    link: 0,
    action: 0,
    logic: 0,
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const host = `${window.location.host}`;
  const protocol = `${window.location.protocol}`;
  const base_url = `${protocol}//${host}`;

  const [mcpServiceData, setMcpServiceData] = useState([]);
  const [mcpToolDataArray, setMcpToolDataArray] = useState([]);

  const getData = async (currentPage: number = 1) => {
    if (loading) return;

    setLoading(true);

    try {
      let res: any;
      const params = {
        ontologyId: ontologyId,
        page: currentPage,
        limit: pagination[activeTab as keyof typeof pagination].pageSize,
        published: false,
      };

      switch (activeTab) {
        case 'object':
          res = await getObject(params);
          handleResponse(res, setObjectData, 'object', currentPage);
          break;
        case 'link':
          res = await getLink(params);
          handleResponse(res, setLinkData, 'link', currentPage);
          break;
        case 'action':
          res = await getAction(params);
          handleResponse(res, setActionData, 'action', currentPage);
          break;
        case 'logic':
          res = await getLogic(params);
          handleResponse(res, setLogicData, 'logic', currentPage);
          break;
        default:
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = (
    res: any,
    setData: Function,
    dataType: 'object' | 'link' | 'action' | 'logic',
    currentPage: number,
  ) => {
    if (Array.isArray(res?.data?.data?.content)) {
      const { data } = res.data;
      setData((pre: DataType[]) => pre.concat(data.content));
      setPagination(prev => ({
        ...prev,
        [dataType]: {
          total: data.totalElements,
          current: data.pageable.pageNumber + 1,
          pageSize: data.size,
        },
      }));
      if (currentPage === data.totalPages) {
        setHasMore(false);
      }
    }
  };

  const resetAllData = () => {
    setObjectData([]);
    setLinkData([]);
    setActionData([]);
    setLogicData([]);

    setPagination({
      object: {
        current: 1,
        pageSize: 10,
        total: 0,
      },
      link: {
        current: 1,
        pageSize: 10,
        total: 0,
      },
      action: {
        current: 1,
        pageSize: 10,
        total: 0,
      },
      logic: {
        current: 1,
        pageSize: 10,
        total: 0,
      },
    });

    setHasMore(true);
  };

  const [prompt, setprompt] = useState('');

  const getMcpServerData = async () => {
    if (mcpLoading) return;
    await setMcpLoading(true);
    await getMcpServer().then(res => {
      if (res.data.success) {
        try {
          const mcpInfo = res.data?.data?.configValue;
          const data = JSON.parse(mcpInfo);
          data.forEach(item => {
            if (item.label == '地址') {
              item.value = base_url + item.value;
            }
          });
          setMcpServiceData(data);
        } catch (e) {
          console.error(e);
          Message.error('获取本体对象MCP服务失败');
        }
      } else {
        Message.error('获取本体对象MCP服务失败');
      }
    });
    await getMcpServerTool().then(res=>{
      if (res.data.success) {
        try {
          const data= res.data?.data?.configValue;
          const mcpTool = JSON.parse(data);
          setMcpToolDataArray(mcpTool);
        } catch (e) {
          console.error(e);
          Message.error('获取本体对象MCP工具失败');
        }
      } else {
        Message.error('获取本体对象MCP工具失败');
      }
    });
    await setMcpLoading(false);
  };
  const getPrompt = async () => {
    if (loading) return;

    setLoading(true);

    try {
      const res = await ontologyPrompt({
        id: ontologyId,
      });

      const { data, success, message } = res.data;
      if (success) {
        setprompt(data.prompt);
      } else {
        Message.error(message || '获取提示词失败');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ontologyId) return;

    if (activeTab === 'prompt') {
      getPrompt();
      return;
    }else if(activeTab === 'mcp'){
      getMcpServerData();
    }

    const initializeData = async () => {
      await initAllCounts();
      // 获取当前 tab 的数据
      getData();
    };

    initializeData();
  }, [ontologyId, activeTab]);

  // 处理滚动事件
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // 当滚动到底部时加载更多
    if (scrollTop + clientHeight >= scrollHeight - 10 && !loading && hasMore) {
      const current = pagination[activeTab as keyof typeof pagination]?.current;
      if (current !== undefined && !loading && hasMore) {
        getData(current + 1);
      }
    }
  };

  const getLinkIcon = (linkType: number, linkMethod: number) => {
    if (linkType === 1 && linkMethod === 1) return oneToOneIcon;
    if (linkType === 1 && linkMethod === 2) return oneToManyIcon;
    return manyToManyIcon;
  };

  const initAllCounts = async () => {
    try {
      const params = {
        ontologyId: ontologyId,
        page: 1,
        limit: 1, // 只需要获取总数，不需要具体数据
        published: false,
      };

      // 并行请求所有类型的数据来获取总数
      const [objectRes, linkRes, actionRes, logicRes] = await Promise.all([
        getObject({ ...params }),
        getLink({ ...params }),
        getAction({ ...params }),
        getLogic({ ...params }),
      ]);
      // 更新 counts 状态
      setCounts({
        object: objectRes?.data?.data?.totalElements || 0,
        link: linkRes?.data?.data?.totalElements || 0,
        action: actionRes?.data?.data?.totalElements || 0,
        logic: logicRes?.data?.data?.totalElements || 0,
      });

      // 更新 pagination 状态中的总数
      setPagination(prev => ({
        ...prev,
        object: {
          ...prev.object,
          total: objectRes?.data?.data?.totalElements || 0,
        },
        link: {
          ...prev.link,
          total: linkRes?.data?.data?.totalElements || 0,
        },
        action: {
          ...prev.action,
          total: actionRes?.data?.data?.totalElements || 0,
        },
        logic: {
          ...prev.logic,
          total: logicRes?.data?.data?.totalElements || 0,
        },
      }));
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  // 添加滚动监听
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
    return undefined;
  }, [loading, hasMore]);

  /*const mcpServiceData = [
    {
      label: '地址',
      value: 'http://localhost:5005/function{function_name},run',
    },
    {
      label: '传输类型',
      value: 'Streamable HTTP',
    },
    {
      label: '描述',
      value: '调用本体动作和全局函数的工具集合',
    },
  ];

  const mpcToolDataArray = [
    [
      {
        label: '名称',
        value: 'ontology_object_action_run',
      },
      {
        label: '功能',
        value: '在本体对象上执行动作，支持 CREATE、UPDATE、DELETE 操作',
      },
      {
        label: '参数',
        value:
          '- `action_id` (string, 必填) - 动作的唯一标识 \n - `params` (dict, 可选) - 动作的参数，例如 `{"name": "张三"}`',
      },
      {
        label: '示例',
        value: `
          \`\`\`json
          {
              "action_id": "472c3deaa079421ab51675cef54c7b",
              "params": {
                  "数量": 26,
                  "编号": 1
              }
          }
          \`\`\`
        `,
      },
    ],
    [
      {
        label: '名称',
        value: 'ontology_object_action_run',
      },
      {
        label: '功能',
        value: '在本体对象上执行动作，支持 CREATE、UPDATE、DELETE 操作',
      },
      {
        label: '参数',
        value: `
            - \`ontology_name\` (string, 必填) - 本体英文名称
            - \`object_name\` (string, 必填) - 对象英文名称
            - \`return_attrs\` (list[string], 可选) - 期望返回的属性
            - \`where_sql\` (string, 可选) - WHERE 条件的 SQL 语句，允许使用属性作为过滤条件
            - \`where_params\` (list[any], 可选) - WHERE SQL 中的变量值
            - \`order_by\` (string, 可选) - 排序规则
            - \`page_size\` (int, 可选) - 分页大小
            - \`page_token\` (string, 可选) - 翻页标识
          `,
      },
      {
        label: '示例',
        value: `
          \`\`\`json
          {
              "ontology_name": "test_ontology",
              "object_name": "DisasterEvent",
              "return_attrs": ["eventID"],
              "where_sql": "typhoonName LIKE %s",
              "where_params": ["%苏帕%"]
          }
          \`\`\`
        `,
      },
    ],
    [
      {
        label: '名称',
        value: 'ontology_object_function_run',
      },
      {
        label: '功能',
        value: '执行本体全局函数',
      },
      {
        label: '参数',
        value: `
        - \`ontology_name\` (string, 必填) - 本体英文名称
        - \`function_name\` (string, 必填) - 函数英文名
        - \`params\` (dict, 可选) - 函数入参
        `,
      },
      {
        label: '示例',
        value: `
          \`\`\`json
          {
              "ontology_name": "test_ontology",
              "function_name": "get_vip_customer",
              "params": {}
          }
          \`\`\`
        `,
      },
    ],
  ];*/

  return (
    <Tabs
      defaultActiveTab="object"
      onChange={key => {
        setActiveTab(key);
        resetAllData();
      }}
    >
      <TabPane key="object" title={<>对象类型（{counts.object}）</>}>
        <div
          ref={scrollContainerRef}
          style={{
            height: '300px',
            overflowY: 'auto',
            paddingRight: '10px',
          }}
        >
          {objectData && objectData.length>0 ? objectData.map((item: any) => (
            <CardItem
              key={item.id}
              icon={<IconPlateCreatedColor/>}
              title={item.objectTypeLabel}
              subtitle={item.objectTypeName}
              tag={item.operStatus}
              updateTime={item.createTime.replace('T', ' ')}
            />
          )) : !loading && <Empty
            icon={<img style={{height: '50px'}}
                       src={emptyIcon}/>}
            description='暂无更新内容'
          />}
          {loading && (
            <div style={{ textAlign: 'center', padding: '10px' }}>
              <Spin />
            </div>
          )}
          {!hasMore && objectData.length > 0 && (
            <div className="no-more">已加载全部对象类型数据</div>
          )}
        </div>
      </TabPane>

      <TabPane key="link" title={<>关系类型（{counts.link}）</>}>
        <div
          ref={scrollContainerRef}
          style={{
            height: '300px',
            overflowY: 'auto',
            paddingRight: '10px',
          }}
        >
          {linkData && linkData.length>0 ? linkData.map((item: any) => (
            <CardItem
              key={item.id}
              title={
                <Space className="link-type-content">
                  <div className="link-type-item">
                    <IconUserColor />
                    {item.sourceObjectType?.objectTypeLabel ?? item.sourceLabel ?? '-'}
                  </div>
                  <img src={getLinkIcon(item.linkType, item.linkMethod)} alt="" />
                  <div className="link-type-item">
                    <IconDataMapColor />
                    {item.targetObjectType?.objectTypeLabel ?? item.targetLabel ?? '-'}
                  </div>
                </Space>
              }
              tag={item.operStatus}
              updateTime={item.lastUpdate}
            />
          )): !loading && <Empty
            icon={<img style={{height: '50px'}}
                       src={emptyIcon}/>}
            description='暂无更新内容'
            />}
          {loading && (
            <div style={{ textAlign: 'center', padding: '10px' }}>
              <Spin />
            </div>
          )}
          {!hasMore && linkData.length > 0 && (
            <div className="no-more"> 已加载全部关系类型数据</div>
          )}
        </div>
      </TabPane>

      <TabPane key="action" title={<>动作类型（{counts.action}）</>}>
        <div
          ref={scrollContainerRef}
          style={{
            height: '300px',
            overflowY: 'auto',
            paddingRight: '10px',
          }}
        >
          {actionData && actionData.length>0 ? actionData.map((item: any) => (
            <CardItem
              key={item.id}
              icon={<IconServiceMonitoringColor />}
              title={item?.actionLabel}
              subtitle={item.actionName}
              tag={item.operStatus}
              updateTime={item.lastUpdate}
            />
          )): !loading && <Empty
            icon={<img style={{height: '50px'}}
                       src={emptyIcon}/>}
            description='暂无更新内容'
            />}
          {loading && (
            <div style={{ textAlign: 'center', padding: '10px' }}>
              <Spin />
            </div>
          )}
          {!hasMore && actionData.length > 0 && (
            <div className="no-more"> 已加载全部动作类型数据</div>
          )}
        </div>
      </TabPane>

      <TabPane key="logic" title={<>逻辑类型（{counts.logic}）</>}>
        <div
          ref={scrollContainerRef}
          style={{
            height: '300px',
            overflowY: 'auto',
            paddingRight: '10px',
          }}
        >
          {logicData && logicData.length>0 ? logicData.map((item: any) => (
            <CardItem
              key={item.id}
              icon={<IconMergeColor />}
              title={item.logicTypeLabel}
              subtitle={item.logicTypeName}
              tag={item.operStatus}
              updateTime={item.lastUpdate}
            />
          )): !loading && <Empty
            icon={<img style={{height: '50px'}}
                       src={emptyIcon}/>}
            description='暂无更新内容'
            />}
          {loading && (
            <div style={{ textAlign: 'center', padding: '10px' }}>
              <Spin />
            </div>
          )}
          {!hasMore && logicData.length > 0 && (
            <div className="no-more"> 已加载全部逻辑类型数据</div>
          )}
        </div>
      </TabPane>
      <TabPane key="prompt" title="提示词">
        <div
          style={{
            height: '300px',
            overflowY: 'auto',
            paddingRight: '10px',
            whiteSpace: 'pre-line',
          }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '10px' }}>
              <Spin />
            </div>
          ) : (
            prompt
          )}
        </div>
      </TabPane>
      <TabPane key="mcp" title="MCP服务">
        <div
          style={{
            height: '300px',
            overflowY: 'auto',
            paddingRight: '10px',
          }}
        >
          {mcpLoading ? (
            <div style={{ textAlign: 'center', padding: '10px' }}>
              <Spin />
            </div>
          ) : (
           <>
             <div className="mcp-title">本体对象MCP服务</div>
             <Descriptions className="mcp-descriptions" border data={mcpServiceData} column={1} />
             <div className="mcp-title">包含工具</div>
             {mcpToolDataArray.map((item, index) => {
               return (
                 <Descriptions
                   key={index}
                   className="mcp-descriptions"
                   border
                   data={item}
                   column={1}
                   valueStyle={{ whiteSpace: 'pre-line' }}
                 />
               );
             })}</>
          )}
        </div>
      </TabPane>
    </Tabs>
  );
};

export default PublishModelTabs;
