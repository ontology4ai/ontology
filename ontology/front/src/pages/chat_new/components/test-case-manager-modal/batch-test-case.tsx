import React, { useState, useEffect, useRef } from 'react';
import { 
  Modal, Button, Input, Select, Tag, Space, Divider,
  Popconfirm, Message, Typography 
} from '@arco-design/web-react';
import { 
  IconPlus, IconDelete, IconPlayArrow, IconSearch, IconEdit 
} from '@arco-design/web-react/icon';
import { TestCase, TestResultStatus } from '../../types';
import Table from '@/components/Table';
import moment from 'moment';
import './index.less';
import { IconSearchColor } from 'modo-design/icon';
const { Text } = Typography;
const { Option } = Select;

import {  getTestCaseList,editTestCase,deleteTestCase } from '@/pages/chat_new/api';
import {RESULT_MAP} from '@/pages/chat_new/components/test-case-manager-modal';
import RunDetailModal from '@/pages/chat_new/components/test-case-manager-modal/test-case-run-deatail'

interface TestCaseManagerModalProps {
  visible: boolean;
  ontology?:any;
  onClose: () => void;
  siderOntologyData?:any;
  onRunCase: (testCase: TestCase[]) => void;       // 运行单条
}


const TestCaseManagerModal: React.FC<TestCaseManagerModalProps> = ({
  visible,
  onClose,
  siderOntologyData,
  onRunCase,
  ontology
}) => {
  // --- 本地状态 ---
  const [data, setData] = useState<TestCase[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [runDetailVisible, setRunDetailVisible] = useState(false);
  const [detailInfo,setDetailInfo] = useState(null);
  const [batchNum,setBatchNum] = useState('')
  
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  //搜索文本状态
  const [searchText, setSearchText] = useState<string>('');
  

  // 初始化
  useEffect(() => {
    if (visible) {
      setSelectedRowKeys([]);
      setSelectedRows([]);
      setFilterStatus('all');
      setLoading(false);
      setTotal(0);
      getTestCaseData();
      setSearchText('');
    }
  }, [visible]); 

 
  // --- 交互逻辑 ---

  // 详情
  const handleDetail = (record: TestCase) => {
    debugger
    if(record.task && record.task.batchNum){
      setDetailInfo(record.task);
      setBatchNum(record.task.batchNum);
      setRunDetailVisible(true);
    }
    
   // onRunCase(record);
   // onClose();
  };
  const getTestCaseData =()=>{
    if (!ontology?.id) {
      return;
    }
    setLoading(true);
    setData([]);
    getTestCaseList({
      ontologyId: ontology.id,
      page: 1,
      limit: 9999,
    }).then((res: any) => {
      if (res.data?.success) {
        const pageData = res.data?.data || {};
        const list = pageData.content || [];
        list.forEach((item: any) => {
          item.lastTime = item.task?.lastExecTime || '';
          item.lastResult = item.task?.summary || '未测试';
        });
        setData(list);
        setTotal(
          pageData.totalElements ??
          pageData.total ??
          list.length
        );
      }
    }).finally(() => {
      setLoading(false);
    });
  }

 

  const filteredData = data.filter(item => {
    // 1. 状态筛选
    const matchStatus = filterStatus === 'all' || item.lastResult === filterStatus;
    
    // 2. 文本搜索
    const searchLower = searchText.toLowerCase();
    const matchSearch = !searchText || 
    (item.id || '').toLowerCase().includes(searchLower) || 
      (item.question || '').toLowerCase().includes(searchLower) || 
      (item.expectedResult || '').toLowerCase().includes(searchLower);

    return matchStatus && matchSearch;
  }); 
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 120,
     // render: (_: any, record: TestCase) => renderEditableCell(record, 'question', '请输入'),
      
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
      title: '问题',
      dataIndex: 'question',
      width: 220,
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
       width: 220,
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
    title: '最新测试时间',
    dataIndex: 'lastTime',
    width: 158,
    render: (text: string) => <Text style={{ fontSize: 12 }}>{text || '-'}</Text>
    },
    {
      title: '最新测试结果',
      dataIndex: 'lastResult',
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
      onFilter: (value, row) => row.lastResult == value,
      render: (status: TestResultStatus) => {
        const config = RESULT_MAP[status || '未测试'];
        return <Tag bordered color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '操作', 
      width: 100,
      dataIndex:'action',
      render: (_: any, record: TestCase) => (
        
        <Button 
        type="text" 
        size="mini"
        onClick={() => handleDetail(record)}
        disabled={!record?.task?.id}
      >
        详情
      </Button>
      )
    }
  ];

  return (
    <Modal
      title={
        <div style={{ textAlign: 'left',fontWeight:700 }}>
     <span style={{fontSize:'16px'}}>选择批量测试用例</span>
        </div>
    }
      visible={visible}
      onOk={onClose}
      style={{ width: 1200 }}
      onCancel={onClose}
      footer={<>
        <Button
          onClick={onClose}
        >
          取消
        </Button>
        <Button
            disabled={selectedRowKeys.length == 0}
           onClick={() => {
            onRunCase(selectedRows);
            onClose();
          }}
          type='primary'
        >
          开始测试{ selectedRowKeys.length>0 &&<span>（{selectedRowKeys.length}）</span> }
        </Button>
        </>
        } 
      unmountOnExit
      className='test-case-mgr-modal batch-test-case'
    >
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>

        <Space>
          <span style={{fontSize:'16px'}}>已选择 <span style={{fontSize:'16px', fontWeight:'700', color:'var(--color-primary-6)'}}>{selectedRowKeys.length}</span> 项</span>
          {selectedRowKeys.length > 0 && (
            <div className='header-btn'>
              <Divider
                type="vertical"
                style={{
                  borderColor: '#D3D9E0',
                  margin: '0 4px',
                }}
              />
              <Button
                type="text"
                size='mini'
                onClick={() => {
                  setSelectedRowKeys([]);
                  setSelectedRows([]);
                }}
              >
                <span style={{fontSize:'16px',lineHeight:'22px'}}>清空复选</span>
              </Button>
            </div>
          )} 
         
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
        data={filteredData}
        rowSelection={{
          type: 'checkbox',
          selectedRowKeys,
          checkCrossPage: true, 
          // ★★★ 开启跨页多选支持 ★★★
          onChange: (keys:string[],selectedRows:any[]) =>{
            setSelectedRowKeys(keys as string[]);
            setSelectedRows(selectedRows);
          }
        }}
        loading={loading}
        pagination={{ pageSize: 10 }}
        border={{ wrapper: true, cell: true }}
      />
      <RunDetailModal 
            ontology={ontology}
            visible={runDetailVisible}
            onClose={() => setRunDetailVisible(false)}
            batchNum={batchNum}
            siderOntologyData={siderOntologyData}
          />
    </Modal>
  );
};

export default TestCaseManagerModal;