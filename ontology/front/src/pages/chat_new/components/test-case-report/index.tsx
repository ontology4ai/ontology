import React, { useState, useEffect } from 'react';
import { 
  Button, Input, Tag, Space,
  Typography,
  Tooltip
} from '@arco-design/web-react';
import { TestCase, TestResultStatus } from '../../types';
import Table from '@/components/Table';
import './index.less';
import { IconSearchColor } from 'modo-design/icon';
const { Text } = Typography;
import { batchTestCaseList, reStartTestCaseTask } from '@/pages/chat_new/api';
import {formatTimestamp} from '@/pages/chat'
import RunDetailModal from '@/pages/chat_new/components/test-case-manager-modal/test-case-run-deatail'
import {RESULT_MAP} from '@/pages/chat_new/components/case-manager';

interface TestCaseReportPageProps {
  siderOntologyData?:any; 
  ontology?:any; 
  batchNum?:string,
  total?:number;
  onRunCase: (testCase: TestCase[]) => void;
  afterReRunTestCase?:()=>void;
}

const TestCaseReportPage: React.FC<TestCaseReportPageProps> = ({
  onRunCase,
  batchNum,
  total,
  siderOntologyData,
  ontology,
  afterReRunTestCase
}) => {
  // --- 本地状态 ---
  const [data, setData] = useState<TestCase[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [runDetailVisible, setRunDetailVisible] = useState(false);
  const [detailInfo,setDetailInfo] = useState(null);
  const [loading,setLoading]=useState(false);

  //搜索文本状态
  const [searchText, setSearchText] = useState<string>('');
  /** 重新测试后强制开启定时刷新（因接口可能尚未返回排队中/执行中状态） */
  const [startPollingTrigger, setStartPollingTrigger] = useState(false);

  // 初始化：拉取一次列表
  useEffect(() => {
    if (batchNum) {
      getBatchTaskList();
    }
  }, [batchNum]);

  // 根据列表执行状态决定是否定时刷新：存在「排队中(0)」或「执行中(1)」则定时刷新；重新测试后也强制开启直到无进行中
  const pollingTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const hasPendingOrRunning = (list: any[]) =>
    list.some(
      (item: any) =>
        item?.status == '0' || item?.status == '1' 
    );
  useEffect(() => {
    if (!batchNum) return;
    const clearTimer = () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
    const hasPending = hasPendingOrRunning(data);
    // 有进行中 或 刚点重新测试（需等接口返回状态）：启动/保持轮询
    if (hasPending || startPollingTrigger) {
      if (!pollingTimerRef.current) {
        pollingTimerRef.current = setInterval(() => getBatchTaskList(false), 3000);
      }
    }
    // 只要当前列表已无进行中，就停止轮询并重置 trigger，避免一直刷新
    if (!hasPending) {
      clearTimer();
      setStartPollingTrigger(false);
    }
    return clearTimer;
  }, [batchNum, data, startPollingTrigger]); 

  // --- 交互逻辑 ---

  // 详情
  const handleDetail = (record:any) => {
    setDetailInfo(record);
    setRunDetailVisible(true);
  };
  
  const reStart = (id)=>{
    setLoading(true);
    reStartTestCaseTask({batchIdList:[id]}).then(res=>{
      if(res.data.success){
        getBatchTaskList();
        afterReRunTestCase && afterReRunTestCase();
        setStartPollingTrigger(true);
      }
    }).finally(()=>{
      setLoading(false);
    })
  }

  const getBatchTaskList = (setLoadingState: boolean = true)=>{
    if (setLoadingState) {
      setLoading(true);
    }
    const param = {
      batchNum,
      page:1,
      limit:total||10,
    }
    batchTestCaseList(param).then(res=>{
      if(res.data.success){
        const pageData = res.data.data || {};
        const list = pageData.content || [];
        list.forEach(item=>{
          item.lastResult = item?.lastTask?.lastExecResult
        })
        setData(list); 
      }
    }).finally(()=>{
      if (setLoadingState) {
        setLoading(false);
      }
    })
  }

  const filteredData = data.filter(item => {
    // 1. 状态筛选
    const matchStatus = filterStatus === 'all' || item.lastResult === filterStatus;
    
    // 2. 文本搜索
    const searchLower = searchText.toLowerCase();
    const matchSearch = !searchText || 
      (item.question || '').toLowerCase().includes(searchLower) || 
      (item.expectedResult || '').toLowerCase().includes(searchLower)|| 
      (item.lastResult || '').toLowerCase().includes(searchLower)|| 
      (item.lastExecResult || '').toLowerCase().includes(searchLower);

    return matchStatus && matchSearch;
  }); 
  
  const columns = [
    {
      title: '用例ID',
      dataIndex: 'caseId',
      width: 100,
      ellipsis: true,
      render: (col: any) => <Typography.Text ellipsis={{ showTooltip: true }}>{col}</Typography.Text>,
    },
    {
      title: '问题',
      dataIndex: 'question',
      width: 180,
      ellipsis: true,
       render: (col, record) => {
           return (
             <Typography.Text ellipsis={{ showTooltip: true }}>
                 {col}
             </Typography.Text>
           );
       },
    },
    {
      title: '预期结果',
      dataIndex: 'expectedResult',
       width: 180,
       ellipsis: true,
       render: (col, record) => {
           return (
             <Typography.Text ellipsis={{ showTooltip: true }}>
                 {col}
             </Typography.Text>
           );
       },
    }, 
    {
      title: '提示词',
      dataIndex: 'promptName',
       width: 220,
        render: (col: any, row: any) => {
          return (
            col && (
            <Tooltip content={col} position="top">
              {row?.promptType == 0 ?
                <Tag bordered className="prompt-tag normal-prompt" size="small">{col}</Tag>
                :
                <Tag bordered className="prompt-tag oag-prompt" color="arcoblue" size="small">{col}</Tag>}
            </Tooltip>
            )
          );
        }
    },
    // {
    //   title: '上次执行结果',
    //   dataIndex: 'lastResult',
    //    width: 180,
    //    ellipsis: true,
    //    render: (col, record) => {
    //        return (
    //          <Typography.Text ellipsis={{ showTooltip: true }}>
    //              {col}
    //          </Typography.Text>
    //        );
    //    },
    // }, 
    // {
    //   title: '最新执行结果',
    //   dataIndex: 'lastExecResult',
    //   width: 180,
    //   ellipsis: true,
    //   render: (col, record) => {
    //       return (
    //         <Typography.Text ellipsis={{ showTooltip: true }}>
    //             {col}
    //         </Typography.Text>
    //       );
    //   },
    // },
    {
      title: '执行状态',
      dataIndex: 'status',
      width: 100,
      filters: [
        {
          text: '未执行',
          value: '-1',
        },
        {
          text: '排队中',
          value: '0',
        },
        {
          text: '执行中',
          value: '1',
        },
        {
          text: '正常结束',
          value: '2',
        },
        {
          text: '异常退出',
          value: '3',
        },
        {
          text: '任务中止',
          value: '4',
        },
      ],
      defaultFilters: [],
      onFilter: (value: any, row: any) => row.status == value,  
      render: (_: any, record: any) => {
        const config = RESULT_MAP[record?.status || '-1'];
        return (
          <div className="test-status">
            <div className="dot" style={{ backgroundColor: config.color }} />
            {config.text}
          </div>
        );
      },
    },
    {
      title: '最新测试结果',
      dataIndex: 'summary',
      width: 120,
      filters: [
        {
          text: '通过',
          value: '通过',
        },
        {
          text: '未通过',
          value: '未通过',
        },
        {
          text: '部分通过',
          value: '部分通过',
        },
        {
          text: '未测试',
          value: '未测试',
        },
        {
          text: '测试中',
          value: '测试中',
        },
      ],
      defaultFilters: [],
      onFilter: (value, row) => row.summary == value,
      render: (status: TestResultStatus) => {
        const config = RESULT_MAP[status || '未测试'];
        return <Tag bordered color={config.color}>{config.text}</Tag>;
      }
    },
    {
    title: '最新测试时间',
    dataIndex: 'lastExecTime',
    width: 160,
    sortable: true,
    sorter: (a: any, b: any) =>
      new Date(a?.lastExecTime || 0).getTime() - new Date(b?.lastExecTime || 0).getTime(),
    render: (text: string) => <Text style={{ fontSize: 12 }}>{text || '-'}</Text>
    },
    {
      title: '操作', 
      width: 160,
      dataIndex:'action',
      fixed: "right",
      render: (_: any, record: TestCase) => (
        <>
          <Button 
            type="text" 
            size="mini"
            style={{marginRight:3}}
            disabled={record.summary=='未测试'}
            onClick={() => handleDetail(record)}
          >
            详情
          </Button>
          <Button 
            type="text" 
            size="mini"
            disabled={record.summary=='未测试'||record.summary=='测试中'}
            onClick={() =>{
              reStart(record.id);
            } }
          >
            重新测试
          </Button>
        </>
      )
    }
  ];

  return (
    <div className='test-case-report-page'>
      <div className="test-case-report-header">
        <div style={{ textAlign: 'left',fontWeight:700}}>
          <span style={{fontSize:'16px'}}>CQ测试用例批量执行报告</span>
        </div>
        <div style={{  display: 'flex', justifyContent: 'space-between' }}> 
          <Space size='medium'>
            <Input  
              suffix={<IconSearchColor />}
              placeholder="请输入" 
              style={{ width: 220 }}
              value={searchText}
              onChange={setSearchText}
              allowClear
            />
          </Space>
        </div>
      </div>

      <Table
        rowKey="id"
        style={{ height: 'calc(100% - 46px)' }}
        columns={columns}
        scroll={{ x: 1000,y:true }}
        loading={loading}
        data={filteredData}
        pagination={{ pageSize: 10 }}
        border={{ wrapper: true, cell: true }}
      />
      <RunDetailModal 
        ontology={ontology}
        visible={runDetailVisible}
        onClose={() => setRunDetailVisible(false)}
        detailInfo ={detailInfo}
        siderOntologyData={siderOntologyData}
      />
    </div>
  );
};

export default TestCaseReportPage;
