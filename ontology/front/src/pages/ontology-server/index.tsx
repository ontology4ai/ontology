import emptyIcon from '@/pages/object/images/empty.svg';
import {
  Button,
  Descriptions,
  Empty,
  Input,
  Message,
  Modal,
  Space,
  Spin,
  Tabs,
  Tooltip,
  Typography,
} from '@arco-design/web-react';
import React, { useEffect, useRef, useState } from 'react';

import Table from '@/components/Table';
import { ontologyPrompt } from '@/pages/ontology-manager/api';
import {
  IconArchiColor,
  IconBackupsShareColor,
  IconCalendarColor,
  IconCounterColor,
  IconDataIntegrationColor,
  IconDataResDirColor,
  IconInferenceEngineColor,
  IconSearchColor,
  IconTextareaColor,
  IconUnitMgrColor,
  IconKeyColor,
} from 'modo-design/icon';
import 'monaco-editor/esm/vs/editor/contrib/find/findController.js';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { getMcpServer, getOntologyApiData, getOntologyList,getMcpServerTool,getServerTool, getToken} from './api';
import './index.less';

const { TabPane } = Tabs;

const copyToClipboard = async (text) => {
  // 方法1: 使用现代 Clipboard API
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true, method: 'clipboard-api' };
    } catch (err) {
      console.warn('Clipboard API 失败:', err);
      // 继续尝试其他方法
    }
  }

  // 方法2: 使用 document.execCommand
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;

    // 使 textarea 在视口外
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);

    textArea.focus();
    textArea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);

    if (successful) {
      console.log(successful);
      return { success: true, method: 'exec-command' };
    } else {
      return { success: false, method: 'exec-command' };
    }
  } catch (err) {
    console.error('execCommand 失败:', err);
    return { success: false, method: 'exec-command', error: err };
  }
};
const renderIcon = option => {
  let labelIcon = '';
  switch (option) {
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
const defaultPagination = {
  total: 0,
  pageSize: 20,
  current: 1,
};
const editorLogOptions: any = {
  selectOnLineNumbers: true,
  readOnly: true,
  lineNumbers: 'off',
  renderLineHighlight: 'none',
  wordWrap: 'on',
  automaticLayout: true, // 自动调整高度
  minimap: {
    enabled: false,
  },
};
const OntologyServerList = () => {
  const tabsRef = useRef();
  const [loading, setLoading] = useState(false);
  const [previewloading, setPreviewloading] = useState(false);
  const [codeVisible, setCodeVisible] = useState(false);
  const [tokenVisible, setTokenVisible] = useState(false);
  const [tokenValue, setTokenValue] = useState('');
  const [modalCode, setModalCode] = useState('');
  const [logicLoading, setLogicLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [logicData, setLogicData] = useState([]);
  const [actionData, setActionData] = useState([]);
  const [activeOntology, setActiveOntology] = useState(null);
  const [activeTab, setActiveTab] = useState('preview');
  const [logicPagination, setLogicPagination] = useState(defaultPagination);
  const [actionPagination, setActionPagination] = useState(defaultPagination);
  const [filterListData, setFilterListData] = useState([]);
  const [filterVal, setFilterVal] = useState('');
  const [allListData, setAllListData] = useState([]);
  const [mcpServiceData, setMcpServiceData] = useState([]);
  const [mcpToolDataArray, setMcpToolDataArray] = useState([]);
  const [mcpServiceData1, setMcpServiceData1] = useState([]);
  const [mcpToolDataArray1, setMcpToolDataArray1] = useState([]);

  const textAreaRef = useRef(null);

  const host = `${window.location.host}`;
  const protocol = `${window.location.protocol}`;
  const base_url = `${protocol}//${host}`;
  const [prompt, setprompt] = useState('');
  const logicColumns = [
    {
      title: '逻辑中文名',
      dataIndex: 'label',
      ellipsis: true,
      render: (col, record) => (
        <span className="key-item">
          <IconBackupsShareColor style={{ marginRight: '3px' }} />
          <Tooltip content={col}>{col}</Tooltip>
        </span>
      ),
    },
    {
      title: '逻辑英文名',
      dataIndex: 'name',
      ellipsis: true,
      render: (col, record) => <Tooltip content={col}>{col}</Tooltip>,
    },
    {
      title: '逻辑描述',
      dataIndex: 'comment',
      ellipsis: true,
      width: 380,
      render: (col, record) => (
        <Tooltip className="comment" content={record.comment}>
          {record.comment}
        </Tooltip>
      ),
    },
  ];
  const actionColumns = [
    {
      title: '动作中文名',
      dataIndex: 'label',
      ellipsis: true,
      render: (col, record) => (
        <span>
          <IconBackupsShareColor style={{ marginRight: '3px' }} />
          <Tooltip content={col}>{col}</Tooltip>
        </span>
      ),
    },
    {
      title: '动作英文名',
      dataIndex: 'name',
      ellipsis: true,
      render: (col, record) => <Tooltip content={col}>{col}</Tooltip>,
    },
    {
      title: '动作描述',
      dataIndex: 'comment',
      width: 380,
      ellipsis: true,
      render: (col, record) => (
        <Tooltip className="comment" content={record.comment}>
          {' '}
          {record.comment}
        </Tooltip>
      ),
    },
  ];

  /*const mcpServiceData = [
        {
            label: '地址',
            value: 'ttp://localhost:5005/function{function_name},run',
        },
        {
            label: '传输类型',
            value: 'Streamable HTTP',
        },
        {
            label: '描述',
            value: '调用本体动作和全局函数的工具集合',
        },
    ];*/
  const mcpCOdeService = [
    {
      label: '地址',
      value: '/llm/mcp',
    },
    {
      label: '名称',
      value: 'Ontology Service Tools',
    },
    {
      label: '描述',
      value: '使用代码调用本体动作和逻辑，以及对象查询能力。大模型基于本体定义推理并生成代码作为mcp入参',
    },
  ];
  const mpcToolDataArray = [
    [
      {
        label: '名称',
        value: 'ontology_service_execute',
      },
      {
        label: '功能',
        value: 'ontology_service可以将你的入参代码转换为相应的函数或行动调用，或者查询对象实例数据',
      },
      {
        label: '参数',
        value: `
            - \`ontology_name\` (string, 必填) - 本体的英文名称
            - \`code\` (string, 必填) - 需要执行的代码
            `
      },
      {
        label: '示例',
        value: `
          \`\`\`json
          {
              "ontology_name": "test_ontology",
              "code": "Customer.find()"
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
    [
      {
        label: '名称',
        value: 'ontology_service_execute',
      },
      {
        label: '功能',
        value: 'ontology_service可以将你的入参代码转换为相应的函数或行动调用，或者查询对象的实例数据。',
      },
      {
        label: '参数',
        value:
          '- `ontology_name` (string, 必填) - 本体的英文名 \n - `code` (str, 必填) - 执行的代码',
      },
      {
        label: '示例',
        value: `
          \`\`\`json
          {
              "ontology_name": "test_ontology",
              "code": "Order.find({'where_sql':'priority = %s','where_params':['VIP'],'return_attrs':['orderID','orderValue'],'page_size':50,'page_token':0})"
          }
          \`\`\`
        `,
      },
    ],

  ];
  const viewOntologyPanel = ontology => {
    setActiveOntology({ ...ontology });
    setActiveTab('preview');
    setLogicPagination(defaultPagination);
    setActionPagination(defaultPagination);
  };
  function onChangeLogicTable(pagination) {
    const { current, pageSize } = pagination;
    setLogicPagination(pagination => ({ ...pagination, current, pageSize }));
    const param = {
      ontologyId: activeOntology.id,
      serviceType: 'logic',
      limit: pageSize,
      page: current,
    };

    getOntologyApiInfo(param);
  }
  function onChangeActionTable(pagination) {
    const { current, pageSize } = pagination;
    setActionPagination(pagination => ({ ...pagination, current, pageSize }));
    const param = {
      ontologyId: activeOntology.id,
      serviceType: 'action',
      limit: pageSize,
      page: current,
    };
    getOntologyApiInfo(param);
  }
  const getData = () => {
    const param = { status: 1, published: 1 };
    setLoading(true);
    getOntologyList(param)
      .then(res => {
        if (res.data.success) {
          setAllListData(res.data.data);
          if(res.data.data.length>0){
            setActiveOntology(res.data.data[0]);
          }
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };
  const openModal = record => {
    let demoCode = record.rquestDemo || '';
    // 将相对路径替换为完整路径
    if (demoCode) {
      // 匹配 "开头后跟/的路径，替换成完整的base_url路径
      demoCode = demoCode.replace(/"\s*(\/[^"]*)"/g, `"${base_url}$1"`);
    }
    setModalCode(demoCode);
    setCodeVisible(true);
  };
  const expandedRowRender = (record, index) => {
    // 格式化解析后的JSON对象为字符串
    function formatJson(jsonString) {
      try {
        const parsed = JSON.parse(jsonString);
        return JSON.stringify(parsed, null, 2); // 第三个参数"2"指两个空格缩进
      } catch (e) {
        return jsonString; // 解析失败则返回原始内容
      }
    }
    const inputParamsString = formatJson(record.inputParams) || '';
    const outputParamsString = formatJson(record.outputParams) || '';
    console.log(record, inputParamsString);

    return (
      <div className="expanded" key={index}>
        <div className="expand-container api">
          <div>API</div>
          <Button type="outline" onClick={() => openModal(record)}>
            请求示例
          </Button>
          <div className="expand-content">
            <div className="expand-content-head">
              <div>
                <Typography.Text type="secondary">地址</Typography.Text>
                <Typography.Text>
                  <Tooltip content={`${base_url}${record.apiPath}`}>
                    {`${base_url}${record.apiPath}`}
                  </Tooltip>
                </Typography.Text>
              </div>
              <div>
                <Typography.Text type="secondary">请求方式</Typography.Text>
                <Typography.Text>{record.method}</Typography.Text>
              </div>
            </div>
            <div className="expand-content-body">
              <div className="expand-content-item">
                <Typography.Text type="secondary">入参</Typography.Text>
                <div className="content-item">
                  <pre className="pretty-json">{inputParamsString}</pre>
                </div>
              </div>
              <div className="expand-content-item">
                <Typography.Text type="secondary">出参</Typography.Text>
                <div className="content-item">
                  <pre className="pretty-json">{outputParamsString}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="expand-container mcp">
          <div>MCP</div>
          {/*<Button type='outline' onClick={()=>openModal(record)}>请求示例</Button>*/}
          <div className="expand-content">
            <div className="expand-content-head">
              <div>
                <Typography.Text type="secondary">地址</Typography.Text>
                <Typography.Text>
                  <Tooltip content={`${base_url}${record.mcpServerPath}`}>
                    {`${base_url}${record.mcpServerPath}`}
                  </Tooltip>
                </Typography.Text>
              </div>
              <div>
                <Typography.Text type="secondary">工具</Typography.Text>
                <Typography.Text>{record.mcpToolName}</Typography.Text>
              </div>
            </div>
            <div className="expand-content-body">
              <div className="expand-content-item">
                <Typography.Text type="secondary">入参</Typography.Text>
                <div className="content-item">
                  <pre className="pretty-json">{inputParamsString}</pre>
                </div>
              </div>
              <div className="expand-content-item">
                <Typography.Text type="secondary">出参</Typography.Text>
                <div className="content-item">
                  <pre className="pretty-json">{outputParamsString}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const container = useRef<HTMLDivElement>(null);
  const initMonaco = () => {
    if (container) {
      const option = {
        language: 'mySpecialLanguage',
        readOnly: true,
        lineNumbers: 'off',
        theme: 'myCoolTheme',
        renderLineHighlight: 'none',
        wordWrap: 'on',
        automaticLayout: true, //自动调整高度
        minimap: {
          enabled: false,
        },
      };
      // Register a new language
      monaco.languages.register({ id: 'mySpecialLanguage' });

      // Register a tokens provider for the language
      monaco.languages.setMonarchTokensProvider('mySpecialLanguage', {
        tokenizer: {
          root: [
            // string
            [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],

            // numbers
            [/\d*\.\d+([eE][-+]?\d+)?/, 'number.float'],
            [/0[xX][0-9a-fA-F]+/, 'number.hex'],
            [/\d+/, 'number'],

            // boolean
            [/false|true/, 'keyword'],

            // chinese character
            [/[\u4e00-\u9fa5]+/, 'keyword'],

            [/\[error]+/, 'custom-error'],
            [/\[log]+/, 'keyword'],
            [/\[info]+/, 'custom-info'],
            [/\[success]+/, 'custom-success'],
          ],
          string: [
            [/[^\\"]+/, 'string'],
            [/\\./, 'string.escape.invalid'],
            [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
          ],
        },
      });

      // Define a new theme that contains only rules that match this language
      monaco.editor.defineTheme('myCoolTheme', {
        base: 'vs',
        inherit: true,
        rules: [
          { token: 'custom-info', foreground: '808080' },
          { token: 'custom-error', foreground: 'ff0000', fontStyle: 'bold' },
          { token: 'custom-notice', foreground: 'FFA500' },
          { token: 'custom-success', foreground: '008800' },
        ],
        colors: {
          //     'editor.foreground': '#000000'
        },
      });
      const editor = monaco.editor.create(container.current, option);
      editor.setValue(modalCode);
    }
  };
  useEffect(() => {
    if (codeVisible) {
      setTimeout(() => {
        initMonaco();
      });
    }
  }, [codeVisible]);

  useEffect(() => {
    getData();
    getMcpServerData();
    getTokenData();
  }, []);
  const getMcpServerData = () => {
    getMcpServer().then(res => {
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
          console.log(e);
          Message.error('获取本体对象MCP服务失败');
        }
      } else {
        Message.error('获取本体对象MCP服务失败');
      }
    });
    getMcpServerTool().then(res=>{
      if (res.data.success) {
        try {
          const data= res.data?.data?.configValue;
          const mcpTool = JSON.parse(data);
          setMcpToolDataArray(mcpTool);
        } catch (e) {
          console.log(e);
          Message.error('获取本体对象MCP工具失败');
        }
      } else {
        Message.error('获取本体对象MCP工具失败');
      }
    });
      getServerTool('llm_mcp_info').then(res => {
          if (res.data.success) {
              try {
                  const mcpInfo = res.data?.data?.configValue;
                //  console.log(mcpInfo);
                  const data = JSON.parse(mcpInfo);
                  data.forEach(item => {
                      if (item.label == '地址') {
                          item.value = base_url + item.value;
                      }
                  });
                  setMcpServiceData1(data);
              } catch (e) {
                  console.log(e);
                 // Message.error('获取基于代码调用的本体服务失败');
              }
          } else {
              Message.error('获取基于代码调用的本体服务失败');
          }
      });
      getServerTool('llm_mcp_tool').then(res=>{
      if (res.data.success) {
        try {
          const data= res.data?.data?.configValue;
        //  console.log(data);
          const mcpTool = JSON.parse(data);
          setMcpToolDataArray1(mcpTool);
        } catch (e) {
          console.log(e);
         // Message.error('获取工具失败');
        }
      } else {
        Message.error('获取工具失败');
      }
    })
  };
  const getOntologyApiInfo = param => {
    const type = param.serviceType;
    if (type == 'logic') {
      setLogicLoading(true);
    } else if (type == 'action') {
      setActionLoading(true);
    }
    getOntologyApiData(param)
      .then(res => {
        if (res.data) {
          const data = res.data.content;
          if (type == 'logic') {
            setLogicData(data);
            setLogicPagination({ ...logicPagination, total: res.data.totalElements });
          } else {
            setActionData(data);
            setActionPagination({ ...actionPagination, total: res.data.totalElements });
          }
        } else {
          Message.error('数据查询失败');
        }
      })
      .catch(err => {
        console.log(err);
      })
      .finally(() => {
        if (type == 'logic') {
          setLogicLoading(false);
        } else if (type == 'action') {
          setActionLoading(false);
        }
      });
  };
  const getPrompt = async () => {
    if (previewloading) return;

    setPreviewloading(true);

    try {
      const res = await ontologyPrompt({
        id: activeOntology.id,
      });

      const { data, success, message } = res.data;
      if (success) {
        setprompt(data.prompt);
      } else {
        Message.error(message || '获取提示词失败');
      }
    } finally {
      setPreviewloading(false);
    }
  };
  const getTokenData = ()=>{
    getToken().then(res=>{
      if(res.data.success){
        setTokenValue(res.data.data||'');
      }else{
        Message.error('获取token失败')
      }
    }).catch(e=>{

    })
  };
  const handleCopy =  async()=>{
    const result = await copyToClipboard(tokenValue);

    if (result.success) {
      Message.success('复制成功');
    }else{
      Message.error('复制失败');
    }
   // setTokenVisible(false);
  };
  useEffect(() => {
    if (activeOntology?.id) {
      if (activeTab == 'preview') {
        getPrompt();
        return;
      }
      const pagination = activeTab == 'logic' ? logicPagination : actionPagination;
      const param = {
        ontologyId: activeOntology.id, //'1975b8568cd94988b73d4fadfb72f8b3'
        serviceType: activeTab,
        limit: pagination.pageSize,
        page: pagination.current,
      };

      getOntologyApiInfo(param);
    }
  }, [activeOntology, activeTab]);

  useEffect(() => {
    const data = allListData.filter(item => {
      return (
        item.ontologyLabel.toLowerCase().includes(filterVal.toLowerCase()) ||
        item.ontologyName.toLowerCase().includes(filterVal.toLowerCase())
      );
    });
    // setFilterListData([]);
    setFilterListData(data);
  }, [allListData, filterVal]);
  return (
    <div className="ontology-list-container">
      <div className="container-header">
        <Space className='server-title'>
          <IconInferenceEngineColor />
          <span>本体服务</span>
        </Space>
        <Button size='small' onClick={() => setTokenVisible(true)} type='primary' icon={<IconKeyColor/>}>
          获取token
        </Button>
      </div>
      <Spin style={{ display: 'block', width: '100%', height: '100%' }} loading={loading}>
        <div className="ontology-server-container">
          <div className="left-content">
            <div className="list-header">
              <Input
                placeholder="请输入"
                value={filterVal}
                suffix={<IconSearchColor />}
                onChange={value => setFilterVal(value)}
              />
            </div>
            <div className="list-body">
              {filterListData.map(item => (
                <div
                  className={`ontology-card ${item.id == activeOntology?.id ? 'active' : ''}`}
                  key={item.id}
                  onClick={() => viewOntologyPanel(item)}
                >
                  <IconDataResDirColor style={{ color: 'var(--color-primary-6)' }} />
                  <div className="ontology-content">
                    <Tooltip content={item.ontologyLabel}>
                      <span>{item.ontologyLabel}</span>
                    </Tooltip>
                    <Tooltip content={item.ontologyName}>
                      <span>{item.ontologyName}</span>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="right-content">
            {!activeOntology ? (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                }}
              >
                <Empty
                  icon={
                    <div
                      style={{
                        display: 'inline-flex',
                        width: 48,
                        height: 48,
                        justifyContent: 'center',
                      }}
                    >
                      <img src={emptyIcon} alt="暂无数据" />
                    </div>
                  }
                  description="暂无数据"
                />
              </div>
            ) : (
              <div className="ontology-info-panel">
                <div className="panel-head">
                  <div className="head-title">
                    <Space>
                      <IconArchiColor />
                      <span className="title-label">{activeOntology?.ontologyLabel}</span>
                      <span className="title-name">{activeOntology?.ontologyName}</span>
                    </Space>
                  </div>
                  <div className="head-detail">
                    <Space direction="vertical">
                      <Typography.Text type="secondary" style={{ fontSize: '14px' }}>
                        描述：{activeOntology?.ontologyDesc}
                      </Typography.Text>
                      <Space size="large">
                        <Typography.Text type="secondary">
                          拥有者： {activeOntology?.owner}
                        </Typography.Text>
                        <Typography.Text type="secondary">
                          更新时间： {activeOntology?.lastUpdate}
                        </Typography.Text>
                        <Typography.Text type="secondary">
                          版本： {activeOntology?.versionName}
                        </Typography.Text>
                      </Space>
                    </Space>
                  </div>
                </div>
                <div className="panel-content">
                  <Tabs
                    defaultActiveTab="preview"
                    type="line"
                    activeTab={activeTab}
                    onChange={setActiveTab}
                  >
                    <TabPane key="preview" title="总览">
                      <div className="preview-container">
                        <div className="preview-content">
                          <div className="content-title">
                            <div className="dot"></div>
                            提示词
                          </div>
                          <div className="content-body" style={{ whiteSpace: 'pre-line' }}>
                            {previewloading ? (
                              <div style={{ textAlign: 'center', padding: '10px' }}>
                                <Spin />
                              </div>
                            ) : (
                              prompt
                            )}
                          </div>
                        </div>
                        <div className="preview-content">
                          <div className="content-title">
                            <div className="dot"></div>
                            MCP服务
                          </div>
                          <div className="content-body">
                            <div className="mcp-title">本体对象MCP服务</div>
                            <Descriptions
                              className="mcp-descriptions"
                              border
                              data={mcpServiceData}
                              column={1}
                            />
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
                            })}
                            {mcpServiceData1 && mcpServiceData1.length > 0 ?
                              <>
                                <div className="mcp-title">基于代码调用的本体服务</div>
                                <Descriptions
                                  className="mcp-descriptions"
                                  border
                                  data={mcpServiceData1}
                                  column={1}
                                />
                              </> : ''}
                            {mcpToolDataArray1 && mcpToolDataArray1.length > 0 ?
                              <>
                                <div className="mcp-title">包含工具</div>

                                <Descriptions

                                  className="mcp-descriptions"
                                  border
                                  data={mcpToolDataArray1}
                                  column={1}
                                  valueStyle={{whiteSpace: 'pre-line'}}
                                />
                              </> : ''}
                          </div>
                        </div>
                      </div>
                    </TabPane>
                    <TabPane key="logic" title="逻辑">
                      <Table
                        className="ontology-logic-action-table"
                        columns={logicColumns}
                        data={logicData}
                        scroll={{
                          x: false,
                          y: 'calc(100vh - 370px)',
                        }}
                        rowKey="id"
                        loading={logicLoading}
                        onChange={onChangeLogicTable}
                        expandedRowRender={expandedRowRender}
                        onExpand={(detail, expanded) => {
                          console.log(detail, expanded);
                        }}
                        onExpandedRowsChange={expandedRows => {
                          console.log(expandedRows);
                        }}
                        expandProps={{
                          expandRowByClick: true,
                          rowExpandable: record => record.key !== '4',
                        }}
                        pagination={logicPagination}
                      />
                    </TabPane>
                    <TabPane key="action" title="动作">
                      <Table
                        className="ontology-logic-action-table"
                        columns={actionColumns}
                        data={actionData}
                        scroll={{
                          x: false,
                          y: 'calc(100vh - 256px)',
                        }}
                        rowKey="id"
                        loading={actionLoading}
                        onChange={onChangeActionTable}
                        expandedRowRender={expandedRowRender}
                        onExpand={(detail, expanded) => {
                          console.log(detail, expanded);
                        }}
                        onExpandedRowsChange={expandedRows => {
                          console.log(expandedRows);
                        }}
                        expandProps={{
                          expandRowByClick: true,
                          rowExpandable: record => record.key !== '4',
                        }}
                        pagination={actionPagination}
                      />
                    </TabPane>
                  </Tabs>
                </div>
              </div>
            )}
          </div>
        </div>
      </Spin>
      <Modal
        title={<div style={{ textAlign: 'left', fontWeight: 600 }}>请求示例</div>}
        visible={codeVisible}
        footer={null}
        onCancel={() => {
          setCodeVisible(false);
        }}
        key={codeVisible}
        autoFocus={false}
        focusLock
        className="instance-modal"
      >
        <div style={{ height: '200px' }}>
          <div className="code-editor" style={{ height: '100%', width: '100%' }} ref={container} />
        </div>
      </Modal>
      <Modal
        title={<div style={{ textAlign: 'left', fontWeight: 600 }}>Token 详情</div>}
        visible={tokenVisible}
        onCancel={() => {
          setTokenVisible(false);
        }}
        focusLock={false}
        onOk={() => handleCopy()}
        okText='复制'
        cancelText='关闭'
        className="token-modal"
      >
        <div className='token-container'>
          <Input.TextArea  ref={textAreaRef}
            readOnly
            value={tokenValue}
          />
          <div className="desc-info">
            <div className="title">使用说明</div>
            <div className="desc-detail">
              <span>1. 请将Token放置在HTTP请求头中。</span>
              <span>2. 请求头Key为Authorization，Value为[Your Token]。</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default OntologyServerList;
