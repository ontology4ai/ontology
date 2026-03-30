import React, { useState, useEffect, useRef } from 'react';
import { 
  Modal, Button, Input, Select, Tag, Space, 
  Popconfirm, Message, Typography, Form 
} from '@arco-design/web-react';
import { 
  IconPlus, IconDelete, IconPlayArrow, IconSearch, IconEdit 
} from '@arco-design/web-react/icon';
import { TestCase, TestResultStatus } from '../../types';
import Table from '@/components/Table';
import moment from 'moment';
import './index.less';
import { addTestCase, getTestCaseList,editTestCase,deleteTestCase } from '@/pages/chat_new/api';
import { IconCaretRight, IconSearchColor } from 'modo-design/icon';
import {formatTimestamp} from '@/pages/chat';
const { Text } = Typography;
const { Option } = Select;
const FormItem = Form.Item;

interface TestCaseManagerModalProps {
  visible: boolean;
  onClose: () => void;
  dataSource: TestCase[]; 
  onRunCase: (testCase: TestCase[]) => void;       // 运行单条
  ontology?:any;
}

export const RESULT_MAP: Record<string, { text: string; color: string }> = {
  '通过': { text: '通过', color: 'green' },
  '未通过': { text: '未通过', color: 'red' },
  '未测试': { text: '未测试', color: 'gray' },
  '部分通过': { text: '部分通过', color: 'orange' },
  '测试中': { text: '测试中', color: 'blue' },
  '0':{text:'排队中',color:'gray'},
  '1':{text:'执行中',color:'blue'},
  '2':{text:'正常结束',color:'green'},
  '3':{text:'异常退出',color:'red'},
};

const TestCaseManagerModal: React.FC<TestCaseManagerModalProps> = ({
  visible,
  onClose,
  dataSource, 
  onRunCase,
  ontology
}) => {
  // --- 本地状态 ---
  const [data, setData] = useState<TestCase[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<TestCase[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  //搜索文本状态
  const [searchText, setSearchText] = useState<string>('');
  // 焦点状态 (Editing)
  const [editingCell, setEditingCell] = useState<{ id: string, field: string } | null>(null);
  
  // 悬浮状态 (Hovering)
  const [hoveringCell, setHoveringCell] = useState<{ id: string, field: string } | null>(null);

  // 新增行的 ID (用于初始自动聚焦)
  const [newRowId, setNewRowId] = useState<string | null>(null);
  
  // 分页 & 加载状态（前端分页，total 不再需要单独维护）
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(3);
  const [loading, setLoading] = useState<boolean>(false);

  // 表单弹窗状态
  const [formModalVisible, setFormModalVisible] = useState<boolean>(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [editingRecord, setEditingRecord] = useState<TestCase | null>(null);
  const [form] = Form.useForm();
  
  const inputRef = useRef<HTMLInputElement>(null);

  // 请求表格数据 - 前端分页，获取所有数据
  const fetchTestCases = () => {
    if (!ontology?.id) {
      return;
    }
    setLoading(true);
    // 获取所有数据，不传分页参数或传入很大的 limit
    getTestCaseList({
      ontologyId: ontology.id,
      page: 1,
      limit: 10000, // 获取所有数据
    }).then((res: any) => {
      if (res.data?.success) {
        const pageData = res.data?.data || {};
        const list = pageData.content || [];
        list.forEach((item: any) => {
          item.lastTime = item.task?.lastExecTime || '';
          item.lastResult = item.task?.summary || '未测试';
        });
        setData(list);
        // 不再设置 total，使用过滤后的数据长度
      }
    }).finally(() => {
      setLoading(false);
    });
  };

  // 初始化
  useEffect(() => {
    if (visible) {
      setData([]);
      setSearchText('');
      setSelectedRowKeys([]);
      setSelectedRows([]);
      setFilterStatus('all');
      setNewRowId(null);
      setEditingCell(null);
      setHoveringCell(null);
      setFormModalVisible(false);
      setEditingRecord(null);
      setPage(1);
    }
  }, [visible]);

  // visible 为 true 时，请求表格数据（前端分页，不再依赖 page 和 pageSize）
  useEffect(() => {
    if (visible) {
      fetchTestCases();
    }
  }, [visible, ontology?.id]);

  // 自动聚焦编辑框 (仅针对新增行或主动点击聚焦的情况)
  useEffect(() => {
    if (editingCell && inputRef.current) {
      // 只有当 editingCell 变化时才聚焦，避免 hover 导致的频繁聚焦抢夺
      // 但这里配合 render 里的 autoFocus 和 onFocus 逻辑，ref 主要用于命令式聚焦
      if (document.activeElement !== inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [editingCell]);

  // --- 交互逻辑 ---

  // 1. 新增用例
  const handleAdd = () => {
    setFormMode('add');
    setEditingRecord(null);
    form.setFieldsValue({
      id: '',
      question: '',
      expectedResult: ''
    });
    setFormModalVisible(true);
  };

  // 2. 单元格保存
  /*
  const handleSaveCell = (id: string, field: keyof TestCase, value: string, shouldBlur: boolean = true) => {
     // 使用函数式更新，防止闭包过时问题
     setData(prevData => {
        // 性能优化：如果数据未变更，直接返回旧状态，避免触发重新渲染导致焦点丢失
        const currentItem = prevData.find(item => item.id === id);
        if (currentItem && currentItem[field] === value) {
            // 即便数据未变，仍需确保父组件数据一致（视业务需求而定，通常可选）
            return prevData;
        }

        const newData = prevData.map(item => {
            if (item.id === id) {
              return { ...item, [field]: value };
            }
            return item;
          });
          // 异步同步到父组件，避免渲染冲突
         // setTimeout(() => onUpdateCases(), 0);
          return newData;
    });
    
    
    // 保存后清理焦点状态，如果不为空，视图会自动切回文本；如果为空，视图保持输入框
    if (shouldBlur) {
        setEditingCell(null);
    }
    
    // 保存后清理焦点状态，如果不为空，视图会自动切回文本；如果为空，视图保持输入框
    // if (shouldBlur) {
    //     setEditingCell(null);
    //   }
  };
  */

  // 3. 删除
  const handleDelete = (ids: string[]) => {
    Modal.confirm({
      title:  ids.length>1?`确认删除选中的${selectedRowKeys.length} 条测试用例?`:'确认删除该测试用例?' ,
      content: '',
      onOk: () => {
        deleteTestCase({caseIdList:ids}).then(res=>{
          if(res.data.success){
            Message.success('删除成功'); 
            setSelectedRowKeys([]);
            setSelectedRows([]);
            fetchTestCases(); // 重新获取数据
          }else{
            Message.error('删除失败');
          }
        })
      },
    });
    const newData = data.filter(item => !ids.includes(item.id));
    
  };

  // 4. 运行
  const handleRun = (records: TestCase[]) => {
    onRunCase(records);
    onClose();
  };
  // 编辑或新增
  const handleEdit = (record: TestCase) => {
    setFormMode('edit');
    setEditingRecord(record);
    form.setFieldsValue({
      id: record.id,
      question: record.question,
      expectedResult: record.expectedResult
    });
    setFormModalVisible(true);
  };

  // 表单提交
  const handleFormSubmit = async () => {
    try {
      const values = await form.validate();
      if (formMode === 'add') {
        // 新增用例
        addTestCase({
          ontologyId:ontology.id, 
          question: values.question,
          expectedResult: values.expectedResult,
        }).then(res=>{
          if(res.data.success){
            fetchTestCases(); // 重新获取数据
          
            Message.success('新增用例成功');
          }else{
            Message.error('新增用例失败');
          }
        }).catch(err=>{
          Message.error('新增用例失败');
        })

        // const newData = [newCase, ...data];
        // setData(newData);
        // Message.success('新增用例成功');
      } else {
        // 编辑用例
        editTestCase({
          id:values.id||editingRecord?.id,
          ontologyId:ontology.id, 
          question: values.question,
          expectedResult: values.expectedResult,
        }).then(res=>{
          if(res.data.success){
            fetchTestCases();
            Message.success('更新用例成功');
          }else{
            Message.error('更新用例失败');
          }
        }).catch(err=>{
          Message.error('更新用例失败');
        })
      }
      setFormModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 关闭表单弹窗
  const handleFormCancel = () => {
    setFormModalVisible(false);
    form.resetFields();
    setEditingRecord(null);
  };

  // --- 渲染逻辑 ---

  /*
  const renderEditableCell = (record: TestCase, field: 'question' | 'expectedResult', placeholder: string) => {
    const value = record[field];
    const isEmpty = !value || value.trim() === '';
    
    // 状态判断
    const isEditing = editingCell?.id === record.id && editingCell?.field === field; // 是否获取焦点
    const isHovering = hoveringCell?.id === record.id && hoveringCell?.field === field; // 是否鼠标悬停
    
    // ★★★ 
    // 1. 值为空 (包含新建行) -> 始终显示输入框
    // 2. 正在编辑 (获取焦点) -> 显示输入框
    // 3. 鼠标悬停 -> 显示输入框
    const showInput = isEmpty || isEditing || isHovering;

    return (
      <div 
        className="edit-cell-item"
        onMouseEnter={() => setHoveringCell({ id: record.id, field })}
        onMouseLeave={() => setHoveringCell(null)}
      >
        {showInput ? (
          <Input
            ref={isEditing ? inputRef : null} // 只有编辑状态才绑定 Ref 以便聚焦
            value={value} // 使用受控组件模式，保证切换显示时内容一致
            placeholder={placeholder}
            
            // 聚焦时记录状态
            onClick={() => {
                console.log('record',record.id);
                setEditingCell({ id: record.id, field })
             }}
            
            // 实时更新本地数据 (为了受控组件正常输入)
            onChange={(val) => {
                const newData = data.map(item => item.id === record.id ? { ...item, [field]: val } : item);
                setData(newData);
            }}
            
            // 失焦保存
            onBlur={(e) => {
                // 判断焦点是否转移到了另一个输入框 (通过 tagName 判断)
                const relatedTarget = e.relatedTarget as HTMLElement;
                const isSwitchingToInput = relatedTarget && (relatedTarget.tagName === 'INPUT' || relatedTarget.tagName === 'TEXTAREA');
                 
                // 如果是切换到另一个输入框，不要立即清除 editingCell，否则会导致那一个输入框无法获得焦点
                handleSaveCell(record.id, field, e.target.value.trim(), !isSwitchingToInput);
            }}
            
            // 回车保存
            onPressEnter={(e) => {
              handleSaveCell(record.id, field, (e.target as any).value.trim());
              // e.target.blur(); // 可选：回车后是否失去焦点
            }}
            
            style={{ width: '100%' }}
          />
        ) : (
          // 非编辑、非悬停、且有值时 -> 显示纯文本
          <div 
          className='text-cell'
            onClick={() => setEditingCell({ id: record.id, field })} // 点击直接进入编辑
          >
            <span> 
                {value}
                </span>
           
          </div>
        )}
      </div>
    );
  };
  */
 

  // 过滤数据
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

  // 前端分页：根据当前页和页大小切片数据
  const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize); 
  const columns = [
    {
      title: '用例ID',
      dataIndex: 'id',
      width: 100,
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
      width: 180,
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
      title: '预期结果',
      dataIndex: 'expectedResult',
       width: 180,
     // render: (_: any, record: TestCase) => renderEditableCell(record, 'expectedResult', '请输入'),
      
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
      render: (col, record) => {
        const config = RESULT_MAP[record.task?.status || '0'];
        return  <div className='test-status'><div className="dot" style={{backgroundColor:config.color}}/>{config.text}</div>;
      }
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
      title: '最新测试时间',
      dataIndex: 'lastTime',
      width: 156,
      render: (text: string) => <Text style={{ fontSize: 12 }}>{text || '-'}</Text>
    },
    {
        title: '创建人',
        dataIndex: 'ownerId',
        width: 100,
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
        title: '创建时间',
        dataIndex: 'createTime',
        width: 156,
        render: (text: string) => <Text style={{ fontSize: 12 }}>{formatTimestamp(text) || '-'}</Text>
      },
    {
      title: '操作', 
      width: 150,
      dataIndex:'action',
      render: (_: any, record: TestCase) => (
        <Space size='mini'>
          <Button 
            type="text" 
            size="mini"
            onClick={() => handleRun([record])}
          >
            测试
          </Button>
          <Button 
            type="text" 
            size="mini"
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button 
              type="text" 
              status="danger" 
              size="mini" 
              onClick={() => handleDelete([record.id])}
            >
              删除
            </Button>
        </Space>
      )
    }
  ];

  return (
    <Modal
      title={
        <div style={{ textAlign: 'left',fontWeight:700 }}>
     <span style={{fontSize:'16px'}}>CQ测试用例库管理</span>
        </div>
    }
      visible={visible}
      onOk={onClose}
      style={{ width: 1350 }}
      onCancel={onClose}
      footer={null} 
      unmountOnExit
      className='test-case-mgr-modal'
    >
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
      <Space>
          <span style={{fontSize:'16px'}}>用例库列表</span>
          <Tag bordered size="small">{data.length}</Tag>
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
          <Button type="secondary" icon={<IconDelete />} disabled={selectedRowKeys.length == 0} onClick={() => handleDelete(selectedRowKeys)}>
            批量删除
          </Button>

          <Button type="primary" icon={<IconCaretRight />} disabled={selectedRowKeys.length == 0} onClick={() => handleRun(selectedRows)}>
            批量测试
          </Button>
          
          <Button type="primary" icon={<IconPlus />} onClick={handleAdd}>
            新增用例
          </Button>
        </Space>

       
      </div>

      <Table
        rowKey="id"
        columns={columns}
        data={filteredData}
        loading={loading}
        rowSelection={{
          type: 'checkbox',
          selectedRowKeys,
          checkCrossPage: true, // ★★★ 开启跨页多选支持 ★★★
          onChange: (keys:any,rows:TestCase[]) =>{
             setSelectedRowKeys(keys as string[]);
             setSelectedRows(rows);
          }
        }}
        pagination={{ pageSize: 10 }}
        border={{ wrapper: true, cell: true }}
      />

      {/* 新增/编辑表单弹窗 */}
      <Modal
        title={
          <div style={{ textAlign: 'left', fontWeight: 700 }}>
            <span style={{ fontSize: '16px' }}>{formMode === 'add' ? '新增用例' : '编辑用例'}</span>
          </div>}
        visible={formModalVisible}
        onOk={handleFormSubmit}
        onCancel={handleFormCancel}
        style={{ width: 460 }}
        unmountOnExit
      >
        <Form
          form={form}
          labelCol={{ span: 5 }}
          wrapperCol={{ span: 19 }}
        >
          {/* {formMode === 'edit' && (
            <FormItem label="ID" field="id">
              <Input disabled />
            </FormItem>
          )} */}
          <FormItem 
            label="问题" 
            field="question"
            rules={[{ required: true, message: '请输入问题' }]}
          >
            <Input.TextArea 
              placeholder="请输入问题" 
              style={{height:'100px'}}
              maxLength={500}
              showWordLimit
            />
          </FormItem>
          <FormItem 
            label="预期结果" 
            field="expectedResult"
            rules={[{ required: true, message: '请输入预期结果' }]}
          >
            <Input.TextArea 
              placeholder="请输入预期结果" 
              style={{height:'100px'}}
            />
          </FormItem>
        </Form>
      </Modal>
    </Modal>
  );
};

export default TestCaseManagerModal;