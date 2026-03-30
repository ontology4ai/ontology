import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { 
  Modal, Button, Input, Select, Tag, Space, Divider,
  Popconfirm, Message, Typography ,Tooltip
} from '@arco-design/web-react';
import { 
   
} from '@arco-design/web-react/icon';
import { TestCase, TestResultStatus } from '../../types';
import Table from '@/components/Table';
import moment from 'moment';
import './index.less';
import { IconSearchColor } from 'modo-design/icon';
const { Text } = Typography;
const { Option } = Select;
import {batchTestCaseList,reStartTestCaseTask}  from '@/pages/chat/api';
import {formatTimestamp} from '@/pages/chat'
import RunDetailModal from '@/pages/chat/components/test-case-manager-modal/test-case-run-deatail'

import {RESULT_MAP} from '@/pages/chat/components/test-case-manager-modal';

export interface TestCaseManagerModalRef {
  refresh: () => void;
}

interface TestCaseManagerModalProps {
  visible: boolean;
  onClose: () => void;
  siderOntologyData?:any; 
  ontology?:any; 
  batchNum?:string,
  total?:number;
  onRunCase: (testCase: TestCase[]) => void;       // 运行单条
  afterReRunTestCase?:()=>void;
}

 
const TestCaseManagerModal = forwardRef<TestCaseManagerModalRef, TestCaseManagerModalProps>(({
  visible,
  onClose, 
  onRunCase,
  batchNum,
  total,
  siderOntologyData,
  ontology,
  afterReRunTestCase
}, ref) => {
  // --- 本地状态 ---
  const [data, setData] = useState<TestCase[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [runDetailVisible, setRunDetailVisible] = useState(false);
  const [detailInfo,setDetailInfo] = useState(null);
  const [loading,setLoading]=useState(false);

  //搜索文本状态
  const [searchText, setSearchText] = useState<string>('');
  

  // 初始化
  useEffect(() => {
  if (visible && batchNum) {
    getBatchTaskList();
  }
}, [visible,batchNum]); 

  // --- 交互逻辑 ---

  // 详情
  const handleDetail = (record:any) => {
    setDetailInfo(record);
    setRunDetailVisible(true);
    //onRunCase([record]);
    //onClose();
  };
  const reStart = (id)=>{
    setLoading(true);
    reStartTestCaseTask({batchIdList:[id]}).then(res=>{
      if(res.data.success){
        getBatchTaskList();
        afterReRunTestCase && afterReRunTestCase();
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

  // 刷新方法，不改变loading状态
  const refresh = () => {
    getBatchTaskList(false);
  }

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    refresh
  }));
 

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
      title: '数据问题',
      dataIndex: 'question',
      width: 170,
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
       width: 170,
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
      title: '上次执行结果',
      dataIndex: 'lastResult',
       width: 170,
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
      title: '最新执行结果',
      dataIndex: 'lastExecResult',
      width: 120,
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
      title:'执行状态',
      dataIndex:'status',
      width: 100,
      render: (status: TestResultStatus) => {
        const config = RESULT_MAP[status || '0'];
        return <Tag bordered color={config.color}>{config.text}</Tag>;
      }
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
    width: 130,
    render: (text: string) => <Text style={{ fontSize: 12 }}>{formatTimestamp(text) || '-'}</Text>
    },
    {
      title: '操作', 
      width: 130,
      dataIndex:'action',
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
              // onRunCase([
              //   {
              //     id:record.caseId,
              //     question:record.question,
              //     expectedResult:record.expectedResult
              //   }])
            } }
          >
            重新测试
          </Button>
        </>
      )
    }
  ];

  return (
    <Modal
      title={
        <div style={{ textAlign: 'left',fontWeight:700 }}>
     <span style={{fontSize:'16px'}}>CQ测试用例批量执行报告</span>
        </div>
    }
      visible={visible}
      onOk={onClose}
      style={{ width: 1350 }}
      onCancel={onClose}
      footer={null} 
      unmountOnExit
      className='test-case-mgr-modal test-case-result'
    >
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>

        <Space>
          <span style={{fontSize:'16px', color:'var(--color-text-3)'}}>总执行次数 <span style={{fontSize:'16px', fontWeight:'700', color:'var(--color-text-1)'}}>{data.length}</span></span>
          {/* <Divider
                type="vertical"
                style={{
                  borderColor: '#D3D9E0',
                  margin: '0 4px',
                }}
              />
          <span style={{fontSize:'16px', color:'var(--color-text-3)'}}>通过率 <span style={{fontSize:'16px', fontWeight:'700', color:'var(--color-success-6)'}}>40%</span></span> */}
        </Space>
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

      <Table
        rowKey="id"
        columns={columns}
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
    </Modal>
  );
});

TestCaseManagerModal.displayName = 'TestCaseManagerModal';

export default TestCaseManagerModal;