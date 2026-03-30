import React, { useEffect, useRef, useState } from 'react';
import './index.less';
import ModoTabs from '@/components/Tabs';
import {
  Button,
  Input,
  Table,
  TableColumnProps,
  Space,
  Link,
  Pagination,
  Tag,
  Badge,
  Modal,
  Message,
  Form,
  FormInstance,
  Select,
  Spin,
  Popconfirm
} from '@arco-design/web-react';
import { IconArrowDown, IconArrowUp, IconMenuList, IconAdd, IconMenuCard } from 'modo-design/icon';
import HeaderListItemIcon from './images/header-list-item-icon.svg';
import HeaderListItemArrow from './images/header-list-item-arrow.svg';
import CardIcon from './images/card-icon.png';
import UserIcon from './images/user-icon.png';

import OntologySimulationCard from './card';
import SimulationGraph from '@/pages/simulation-graph';

import {
  sceneList,
  sceneDelete,
  sceneSave,
  sceneIsLabelExists,
  sceneIsNameExists,
  ontologyFindAll,
} from './api';

const InputSearch = Input.Search;
const FormItem = Form.Item;

export interface ItemProps {
  id: string;
  sceneLabel?: string;
  sceneName?: string;
  ontologyLabel?: string;
  ontologyName?: string;
  status?: number;
  ownerId?: string;
  lastUpdate?: string;
  description?: string;
  canvasId?: string;
}

const OntologySimulation = () => {
  const modoTabsRef = useRef(null);
  const tabViewRef = useRef({});
  const headerCardList = [
    {
      title: '创建仿真场景',
      subtitle: '基于某个本体创建业务仿真场景',
    },
    {
      title: '设计仿真模型',
      subtitle: '在画布中添加与场景相关的本体资源',
    },
    {
      title: '数据初始化',
      subtitle: '为仿真模型导入模拟数据集',
    },
    {
      title: '开始仿真执行',
      subtitle: '在对象节点执行动作，触发仿真流程',
    },
    {
      title: '查看仿真结果',
      subtitle: '查看仿真执行结果，进行对比分析',
    },
  ];

  const [isShow, setIsShow] = useState(false);
  const [deletePopconfirmVisible, setDeletePopconfirmVisible] = useState(false);
  const tabDeleteKeyRef = useRef();

  const columns: TableColumnProps[] = [
    {
      title: '中文名称',
      dataIndex: 'name',
      render: (col, row, index) => (
        <div
          style={{ display: 'flex', gap: '16px', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => {
            modoTabsRef.current.addTab({
              id: row.id,
              key: row.id,
              title: row.sceneLabel,
              icon: null,
              view: (
                <SimulationGraph
                  sceneId={row.id}
                  updateTabLabel={label => {
                    modoTabsRef.current.updateTabLabel(row.id, label);
                  }}
                  setRef={ref => {
                    tabViewRef.current[row.id] = ref;
                  }}
                />
              ),
            });
          }}
        >
          <img src={CardIcon} alt="card-icon" height={24} width={24} />
          {row.sceneLabel}
        </div>
      ),
    },
    {
      title: '英文名称',
      dataIndex: 'sceneName',
    },
    {
      title: '来源本体',
      dataIndex: 'ontologyLabel',
    },
    {
      title: '配置',
      dataIndex: 'config',
      width: 80,
      render: (col, row, index) =>
        row.canvasId ? (
          <Tag color="arcoblue" bordered>
            已配置
          </Tag>
        ) : (
          <Tag bordered>未配置</Tag>
        ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      filters: [
        {
          text: '启用',
          value: 1,
        },
        {
          text: '禁用',
          value: 0,
        },
      ],
      onFilter: (value, row) => row.status === value,
      render: (col, row, index) => (
        <Badge
          status={row.status === 0 ? 'default' : 'success'}
          text={row.status === 0 ? '禁用' : ' 启用'}
        ></Badge>
      ),
    },
    {
      title: '创建人',
      dataIndex: 'ownerId',
      render: (col, row, index) => (
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <img src={UserIcon} alt="user-icon" height={24} width={24} /> {row.ownerId}
        </div>
      ),
      width: 120,
    },
    {
      title: '更新时间',
      dataIndex: 'lastUpdate',
      width: 120,
    },
    {
      title: '操作',
      dataIndex: 'operation',
      width: 120,
      render: (col, row, index) => (
        <Space>
          <Link hoverable={false} disabled>
            历史
          </Link>
          <Link hoverable={false} onClick={() => handleDelete([row?.id])}>
            删除
          </Link>
        </Space>
      ),
    },
  ];
  const [listData, setListData] = useState([
    // {
    //   id: '1',
    //   name: 'Jane Doe',
    //   salary: 23000,
    //   address: '32 Park Road, London',
    //   email: 'jane.doe@example.com',
    // },
    // {
    //   id: '2',
    //   name: 'Alisa Ross',
    //   salary: 25000,
    //   address: '35 Park Road, London',
    //   email: 'alisa.ross@example.com',
    // },
    // {
    //   id: '3',
    //   name: 'Kevin Sandra',
    //   salary: 22000,
    //   address: '31 Park Road, London',
    //   email: 'kevin.sandra@example.com',
    // },
    // {
    //   id: '4',
    //   name: 'Ed Hellen',
    //   salary: 17000,
    //   address: '42 Park Road, London',
    //   email: 'ed.hellen@example.com',
    // },
    // {
    //   id: '5',
    //   name: 'William Smith',
    //   salary: 27000,
    //   address: '62 Park Road, London',
    //   email: 'william.smith@example.com',
    // },
  ]);

  const [selectedRowKeys, setSelectedRowKeys] = useState<(string | number)[]>([]);

  const [showCard, setShowCard] = useState(false);

  const [total, setTotal] = useState(5);

  const handleCardSelectChange = (id: string | number, checked: boolean) => {
    if (checked) {
      setSelectedRowKeys(selectedRowKeys.concat(id));
    } else {
      setSelectedRowKeys(selectedRowKeys.filter((_id: string | number) => _id !== id));
    }
  };

  const [loading, setLoading] = useState(false);

  const [searchKeywords, setSearchKeywords] = useState('');

  const [currentPage, setCurrentPage] = useState(1);

  const getListData = async (pageNumber = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await sceneList({
        keyword: searchKeywords,
        page: pageNumber,
        limit: pageSize,
      });

      const { data, success } = res.data;

      if (success) {
        setListData(data.content);
        setTotal(data.totalElements);
      }

      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handleDelete = (ids: Array<string | number>) => {
    Modal.confirm({
      title: '是否确认删除？',
      okButtonProps: {
        status: 'danger',
      },
      onOk: () => {
        sceneDelete(ids).then(res => {
          const { success } = res.data;
          if (success) {
            Message.success({
              content: '删除成功！',
            });

            setCurrentPage(1);
            getListData(1);
          } else {
            Message.error({
              content: '删除失败！',
            });
          }
        });
      },
    });
  };

  useEffect(() => {
    getListData();

    ontologyFindAll({}).then(res => {
      console.log(res, 'ontologyFindAll');
      const { data } = res.data;
      setOntolotyOptions(
        data.map((item: { ontologyLabel: string; ontologyName: string; id: string }) => ({
          label: item.ontologyLabel || item.ontologyName,
          value: item.id,
        })),
      );
    });
  }, []);

  const [visible, setVisible] = useState(false);

  const formRef = useRef<FormInstance<any, any, string | number | symbol>>(null);
  const [formData, setFormData] = useState({});

  const handleAdd = () => {
    setVisible(true);
    setTimeout(() => {
      formRef.current?.clearFields();
    }, 0);
  };

  const [ontolotyOptions, setOntolotyOptions] = useState([]);

  const handleSave = async () => {
    try {
      await formRef.current?.validate();

      const res = await sceneSave(formData);

      const { success } = res.data;

      if (success) {
        Message.success({
          content: '保存成功！',
        });

        setCurrentPage(1);
        getListData(1);
        setVisible(false);
      } else {
        Message.error({
          content: '保存失败！',
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handlePaginationChange = (newPageNumber: number, newPageSize: number) => {
    setCurrentPage(newPageNumber);
    getListData(newPageNumber, newPageSize);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    getListData(1);
  };

  return (
    <div className="ontology-simulation">
      <div className="ontology-simulation-container">
        <ModoTabs
          title="本体仿真"
          ref={modoTabsRef}
          beforeDeteleTab={(key, callback) => {
            tabDeleteKeyRef.current = key;
            if (!tabViewRef.current[key].getCanvasStatus()) {
              setDeletePopconfirmVisible(true);
              return;
            }
            callback();
          }}
          deleteButton={(
            <Popconfirm
              popupVisible={deletePopconfirmVisible}
              focusLock
              title='是否保存画布更新？'
              onOk={(e) => {
                e.stopPropagation();
                e.preventDefault();
                tabViewRef.current[tabDeleteKeyRef.current].handleSave(() => {
                  setDeletePopconfirmVisible(false);
                  modoTabsRef.current.handleDeleteTab(tabDeleteKeyRef.current)
                })
              }}
              onCancel={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setDeletePopconfirmVisible(false);
                modoTabsRef.current.handleDeleteTab(tabDeleteKeyRef.current)
              }}>
              <span
                role="button"
                aria-label="remove tab"
                tabindex="0"
                class="arco-tabs-close-icon">
                <span class="arco-icon-hover arco-tabs-icon-hover">
                  <svg
                    fill="none"
                    stroke="currentColor"
                    stroke-width="4"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                    focusable="false"
                    class="arco-icon arco-icon-close">
                    <path d="M9.857 9.858 24 24m0 0 14.142 14.142M24 24 38.142 9.858M24 24 9.857 38.142"></path>
                  </svg>
                </span>
              </span>
            </Popconfirm>
          )}>
          <div className="ontology-simulation-content">
            <div className="ontology-simulation-content-header">
              <div className="ontology-simulation-content-header-title">
                <h1>本体仿真管理</h1>
                <Button type="outline" onClick={() => setIsShow(!isShow)}>
                  {isShow ? (
                    <>
                      收起教程 <IconArrowUp />
                    </>
                  ) : (
                    <>
                      查看教程 <IconArrowDown />
                    </>
                  )}
                </Button>
              </div>
              <div className="ontology-simulation-content-header-subtitle">
                管理和运行基于本体的业务仿真实验,推演决策影响。
              </div>
              {isShow ? (
                <div className="ontology-simulation-content-header-list">
                  {headerCardList.map(item => (
                    <React.Fragment key={item.title}>
                      <div className="ontology-simulation-content-header-list-item">
                        <img src={HeaderListItemIcon} alt="" />
                        <div className="ontology-simulation-content-header-list-item-title">
                          {item.title}
                        </div>
                        <div className="ontology-simulation-content-header-list-item-subtitle">
                          {item.subtitle}
                        </div>
                      </div>
                      <img src={HeaderListItemArrow} alt="" />
                    </React.Fragment>
                  ))}
                </div>
              ) : null}
            </div>

            {selectedRowKeys?.length ? (
              <div className="ontology-simulation-content-batch">
                <div className="ontology-simulation-content-batch-left">
                  <div className="ontology-simulation-content-batch-title">
                    已选择 <span>{selectedRowKeys.length}</span> 仿真场景
                  </div>
                  <Button type="outline" onClick={() => handleDelete(selectedRowKeys)}>
                    批量删除
                  </Button>
                </div>

                <div className="ontology-simulation-content-batch-right">
                  <Button type="outline" status="danger" onClick={() => setSelectedRowKeys([])}>
                    退出批量操作
                  </Button>
                </div>
              </div>
            ) : (
              <div className="ontology-simulation-content-filter">
                <div className="ontology-simulation-content-filter-title">仿真场景列表</div>
                <div className="ontology-simulation-content-filter-right">
                  <InputSearch
                    allowClear
                    placeholder="搜索本体仿真场景"
                    style={{ width: 262 }}
                    searchButton
                    onChange={value => setSearchKeywords(value)}
                    onSearch={() => handleSearch()}
                  />
                  <Button type="primary" onClick={handleAdd}>
                    <IconAdd /> 新建场景
                  </Button>
                  <Button type="outline" onClick={() => setShowCard(!showCard)}>
                    {showCard ? <IconMenuCard /> : <IconMenuList />}
                  </Button>
                </div>
              </div>
            )}

            <Spin loading={loading} className="ontology-simulation-content-main">
              {showCard ? (
                <div className="ontology-simulation-card-list">
                  {listData.map(item => (
                    <OntologySimulationCard
                      key={item.id}
                      data={item}
                      selected={selectedRowKeys.includes(item.id)}
                      onSelectedChange={handleCardSelectChange}
                      onDelete={(id: string) => handleDelete([id])}
                    />
                  ))}
                </div>
              ) : (
                <Table
                  rowKey="id"
                  pagination={false}
                  border={false}
                  columns={columns}
                  data={listData}
                  rowSelection={{
                    type: 'checkbox',
                    selectedRowKeys,
                    onChange: (keys, rows) => {
                      console.log('onChange:', keys, rows);
                      setSelectedRowKeys(keys);
                    },
                    checkCrossPage: true,
                    preserveSelectedRowKeys: true,
                  }}
                />
              )}

              <Pagination
                total={total}
                showTotal
                showJumper
                sizeCanChange
                onChange={handlePaginationChange}
                current={currentPage}
              />
            </Spin>
          </div>

          <Modal
            title={<div style={{ textAlign: 'left' }}>新建场景</div>}
            visible={visible}
            okText="保存"
            onOk={handleSave}
            onCancel={() => setVisible(false)}
            autoFocus={false}
            focusLock
          >
            <Form
              ref={formRef}
              autoComplete="off"
              initialValues={formData}
              onValuesChange={(v, vs) => {
                setFormData(vs);
              }}
              layout="vertical"
            >
              <FormItem
                label="中文名称"
                field="sceneLabel"
                rules={[
                  { required: true, message: '请输入中文名称' },
                  {
                    validator: (value: any, cb: (err?: string) => void) => {
                      if (!value) {
                        cb();
                        return;
                      }
                      const formatRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/;
                      // 必须包含中文或字母的校验
                      const chineseOrLetterRegex = /[\u4e00-\u9fa5a-zA-Z]/;

                      if (!formatRegex.test(value)) {
                        cb('仅支持中文、字母、数字和下划线');
                        return;
                      }
                      if (!chineseOrLetterRegex.test(value)) {
                        cb('必须包含中文或字母');
                        return;
                      }
                      cb();
                    },
                  },
                  {
                    validator: async (value: any, cb: (err?: string) => void) => {
                      if (!value) {
                        cb();
                        return;
                      }
                      await sceneIsLabelExists({
                        sceneLabel: value,
                      })
                        .then(res => {
                          if (res.data.data) {
                            cb('中文名称已存在');
                          } else {
                            cb();
                          }
                        })
                        .catch(err => {
                          cb(err);
                        });
                    },
                  },
                ]}
              >
                <Input placeholder="请输入" maxLength={50} />
              </FormItem>
              <FormItem
                label="英文名称"
                field="sceneName"
                rules={[
                  { required: true, message: '请输入英文名称' },
                  {
                    validator: (value: any, cb: (err?: string) => void) => {
                      if (!value) {
                        cb();
                        return;
                      }
                      if (!/^(?=.*[a-zA-Z])[a-zA-Z0-9_]+$/.test(value)) {
                        cb('名称必须包含英文字母，且只能输入英文字母、数字和下划线');
                        return;
                      }
                      cb();
                    },
                  },
                  {
                    validator: async (value: any, cb: (err?: string) => void) => {
                      if (!value) {
                        cb();
                        return;
                      }
                      await sceneIsNameExists({
                        sceneName: value,
                      })
                        .then(res => {
                          if (res.data.data) {
                            cb('英文名称已存在');
                          } else {
                            cb();
                          }
                        })
                        .catch(err => {
                          cb(err);
                        });
                    },
                  },
                ]}
              >
                <Input placeholder="请输入" maxLength={50} />
              </FormItem>
              <FormItem label="描述" field="description">
                <Input.TextArea placeholder="请输入" maxLength={500} />
              </FormItem>
              <FormItem
                label="来源本体"
                field="ontologyId"
                rules={[{ required: true, message: '请选择来源本体' }]}
              >
                <Select
                  placeholder="请选择"
                  options={ontolotyOptions}
                  showSearch
                  filterOption={(inputValue, option) =>
                    option.props.value.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0 ||
                    option.props.children.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0
                  }
                ></Select>
              </FormItem>
            </Form>
          </Modal>
        </ModoTabs>
      </div>
    </div>
  );
};

export default OntologySimulation;
