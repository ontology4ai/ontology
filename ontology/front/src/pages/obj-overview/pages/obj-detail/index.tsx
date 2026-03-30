import Table from '@/components/Table';
import manyToManyIcon from '@/pages/link-manager/images/mToM.svg';
import oneToManyIcon from '@/pages/link-manager/images/oToM.svg';
import oneToOneIcon from '@/pages/link-manager/images/oToO.svg';
import { getDataSourceList, getDataTableInfo, getDataTables } from "@/pages/link-overview/api";
import emptyIcon from "@/pages/object/images/empty.svg";
import rightIcon from "@/pages/object/images/rightIcon.svg";
import {
  Alert,
  Button,
  Empty,
  Form,
  Grid,
  Input,
  List,
  Message,
  Modal,
  Select,
  Spin,
  Switch,
  Tooltip
} from '@arco-design/web-react';
import { Tag } from 'modo-design';
import {
  IconAdd,
  IconDataCatalogMgrColor,
  IconDataIntegrationColor,
  IconDataMapColor,
  IconDeleteColor,
  IconEditColor,
  IconEyeColor,
  IconCodeColor,
  IconPlateCreatedColor,
  IconUserColor
} from 'modo-design/icon';
import React from 'react';
import * as sqlFormatter from 'sql-formatter';
import MonacoEditor from 'react-monaco-editor';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
// 导入 SQL 语言支持
import 'monaco-editor/esm/vs/basic-languages/sql/sql.contribution';
import { checkObjectTypeExist, getData, updateData } from './api';
import ObjEmpty from './components/Empty';
import DsOverview from './Pages/DsOverview';
import './style/index.less';
import ObjectIcon from '@/components/ObjectIcon';

const FormItem = Form.Item;
const InputSearch = Input.Search;

const { Option } = Select;

const icons = [
  'IconDataResDirColor-primary',
  'IconDataResDirColor-orangered',
  'IconDataResDirColor-cyan',
  'IconDataResDirColor-purple',
  'IconUserColor-primary',
  'IconUserColor-orangered',
  'IconUserColor-cyan',
  'IconUserColor-purple',
  'IconFunctionColor-primary',
  'IconFunctionColor-orangered',
  'IconFunctionColor-cyan',
  'IconFunctionColor-purple',
  'IconStorageColor-primary',
  'IconStorageColor-orangered',
  'IconStorageColor-cyan',
  'IconStorageColor-purple',
  'IconDockerHubColor-primary',
  'IconDockerHubColor-orangered',
  'IconDockerHubColor-cyan',
  'IconDockerHubColor-purple',
  'IconDocumentDetailColor-primary',
  'IconDocumentDetailColor-orangered',
  'IconDocumentDetailColor-cyan',
  'IconDocumentDetailColor-purple',
];
class ObjDetail extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = {
      loading: true,
      data: {
        linkTypes: [],
        attributes: [],
        actions: [],
      },
      dataset:[],
      modelOptions: [],
      datasetAll: [],
      listLoading: false,
      tableLoading: false,
      datasetList: [],
      tableData: [],
      dsOptions: [],
      keySearchValue: '',
      columns: [
        {
          title: '字段英文名',
          dataIndex: 'COLUMN_NAME',
        },
        {
          title: '字段说明',
          dataIndex: 'COMMENTS',
        },
        {
          title: '数据类型',
          dataIndex: 'DATA_TYPE',
          render: (col, record, index) => <Tag>{col}</Tag>,
        },
        {
          title: '长度',
          dataIndex: 'DATA_LENGTH',
        },
      ],
      current: 1,
      pageSize:20,
      datasetList: [],
      stepModalVisible:false,
      dsOverviewVisible: false,
      sqlModalVisible: false,
    };
    this.formRef = React.createRef();
    this.dataRef = React.createRef();
    this.datasetFormRef = React.createRef();
  }
  getData = () => {
    this.setState({
      loading: true,
    });
    getData(this.props.obj.id)
      .then(res => {
        if (res.data.data) {
          const { data } = res.data;
          this.setState({
            data,
          });
          this.dataRef.current = data;
          this.formRef.current.setFieldsValue({
            objectTypeName: data.objectTypeName,
            objectTypeLabel: data.objectTypeLabel,
            objectTypeDesc: data.objectTypeDesc,
            status: Boolean(data.status),
            icon: data.icon,
          });
        }
      })
      .catch(err => {})
      .finally(() => {
        this.setState({
          loading: false,
        });
      });
  };
  handleSave = async callback => {
    let valid = true;
    try {
      await this.formRef.current.validate();
    } catch (e) {
      valid = false;
    }
    if (!valid) {
      return;
    }
    this.setState({
      loading: true,
    });
    const initData = this.state.data;
    let data = {
      ...this.state.data,
      ...this.formRef.current.getFieldsValue(),
    };
    data.status = Number(data.status);
    delete data.id;
    updateData(this.state.data.id, data)
      .then(res => {
        if (res.data.success) {
          typeof callback === 'function' && callback({ type:'updateTab',tabId: this.props.ontology.id,view:'object',tabName:data.objectTypeLabel});
          Message.success('保存成功！');
          this.getData();
          return;
        }
        throw 'err';
      })
      .catch(err => {
        console.log(err);
        typeof callback === 'function' && callback(initData.objectTypeLabel);
        Message.error('保存失败！');
      })
      .finally(() => {
        this.setState({
          loading: false,
        });
      });
  };
  componentDidMount() {
    this.getData();
    this.getDataSources();
  }
  renderActionIcon = item => {
    if (!item) return null;
    let icon = <IconPlateCreatedColor />;
    switch (item.toLowerCase()) {
      case 'create':
        icon = <IconPlateCreatedColor />;
        break;
      case 'update':
        icon = <IconEditColor />;
        break;
      case 'delete':
        icon = <IconDeleteColor />;
        break;
    }
    return icon;
  };
  getDataSet = (param: any) => {
    this.setState({
      listLoading: true,
      datasetList: [],
    });
    getDataTables(param)
      .then(res => {
        if (res.data.success) {
          const data = res.data.data;
          this.setState({
            current: 1,
            keySearchValue:'',
            datasetAll: data,
          },()=>{
            this.updateDataset();
          });
        } else {
          Message.error('查询数据集失败');
        }
      })
      .finally(() => {
        this.setState({
          listLoading: false,
        });
      });
  };

  getDataSources = () => {
    this.setState({
      dsOptions: [],
      modelOptions: [],
    });
    getDataSourceList().then(res => {
      if (res.data.success) {
        this.setState({
          dsOptions: res.data.data,
        });
        const dsOptions = res.data.data;
        if (this.state.data.dsId) {
          const schema =
            dsOptions.find((item: { id: any }) => item.id === this.state.data.dsId)
              ?.schemas || [];
          this.setState({
            modelOptions: schema,
          });
        }
      } else {
        Message.error('查询数据源失败');
      }
    });
  };
  //获取字段信息
  getDatasetFields = (init=false) => {
    const dsData = this.datasetFormRef.current?.getFieldsValue();
    const data = this.state.dataset;
    if (data.middleTableName) {
      const param = {
        id: dsData?.middleDsId||data.middleDsId,
        schema: dsData?.middleDsSchema||data.middleDsSchema,
        tableName: data.middleTableName,
      };
      this.setState({
        tableLoading: true,
      });
      getDataTableInfo(param)
        .then(res => {
          if (res.data.success) {
            const { data } = res.data;
            this.setState({
              tableData: data.columns.datas,
            });
            /*if(init){
              this.setState({
                sourceFields:data.columns.datas,
                targetFields:data.columns.datas,
              })
            }*/
          } else {
            this.setState({
              tableData: [],
            });
            Message.error('查询字段信息失败');
          }
        })
        .finally(() => {
          this.setState({
            tableLoading: false,
          });
        });
    }
  };
  handleDatasetModelOk = async() => {
    const valid = await this.datasetValidate();
    if(valid){
      const formData = this.datasetFormRef.current.getFieldsValue();
     // const data = this.state.data;
      const data = {
        dsId:formData.middleDsId,
        dsSchema:formData.middleDsSchema,
        tableName:this.state.dataset.middleTableName,
        dsType: 0,
        customSql: '',
      };
      const {attributes,tableName} = this.state.data;
      if(tableName!==data.tableName){
          attributes.forEach(item=>{
              item.fieldName = null
          })
      }
      console.log(this.state.data);
      this.setState({
        data:{
          ...this.state.data,
          ...data,
            attributes,
        },
        stepModalVisible:false,
      });

    }

    //
  };
  datasetValidate = async ()=>{
    let flag = true;
    try {
      await this.datasetFormRef.current.validate();
      if (!this.state.dataset.middleTableName) {
        flag = false;
        Message.error('未选择数据集')
      }
      if (this.state.tableData.length==0) {
        flag = false;
        Message.error('未获取到字段')
      }
    } catch (e) {
      flag = false;
    }
    return flag;
  };
  onFormValuesChange = (changeValue: any, values: any) => {
    //本期放开数据源限制：
    //未关联数据源的对象也可以启用
    /*if(Object.keys(changeValue).length==1 && changeValue.status && !this.state.data.dsId){
      Message.error('未绑定数据源禁止启用');
      this.formRef.current.setFieldValue('status',false)
    }*/
  };
  onValuesChange = (changeValue: any, values: any) => {
    this.setState({
      tableData:[],
      datasetAll:[],
      datasetList:[],
    });
    if (changeValue.middleDsId) {
      this.setState({
        modelOptions: this.state.dsOptions.find(item => item.id == changeValue.middleDsId)?.schemas || [],
      })
    }
    if(changeValue.middleDsId && !changeValue.middleDsSchema){
      this.datasetFormRef.current?.setFieldValue('middleDsSchema', null);
      this.setState({
        dataset:{...this.state.dataset,middleTableName: ''}
      })
    }
    if(changeValue.middleDsSchema && !changeValue.middleDsId){
      this.setState({
        dataset:{...this.state.dataset,middleTableName: ''}
      })
    }
    if (changeValue.middleDsSchema) {
      this.getDataSet({id: values.middleDsId, schema: values.middleDsSchema})
    }
  };
  updateDataset = () => {
    const { keySearchValue, datasetAll, current, pageSize } = this.state;
    let filterDataset = [...datasetAll];

    if (keySearchValue.length > 0) {
      filterDataset = filterDataset.filter(item =>
        item.TABLE_NAME.toLowerCase().includes(keySearchValue.toLowerCase())
      );
    }

    this.setState({
      total: filterDataset.length,
      datasetList: filterDataset.slice(0, pageSize * current)
    });
  };
  keySearch = (val) => {
    //
    this.setState({
      keySearchValue:val,
      current:1
    },()=>{
      this.updateDataset();
    })
  };
  handleStatusChange = (checked: boolean) => {
    this.formRef.current?.setFieldValue('status', !checked);
    const statusText = checked ? '启用' : '禁用';
    Modal.confirm({
      title: '提示',
      content: `确认要${statusText}该对象吗？`,
      onOk: () => {
        this.formRef.current?.setFieldValue('status', checked);
        // 如果需要调用更新API，可以在这里添加
      },
      onCancel: () => {
        // 恢复原来的状态
        this.formRef.current?.setFieldValue('status', !checked);
      }
    });
  };
  // SQL 语句
  formatCustomSql = () => {
    const { data } = this.state;
    if (!data.dsId || !data.dsSchema || !data.tableName || !data.customSql) {
      return '';
    }
    // 格式化 SQL
    try {
      return sqlFormatter.format(data.customSql, {
        language: 'sql',
        tabWidth: 2,
      });
    } catch (error) {
      return data.customSql;
    }
  };


  render() {
    const { loading, data, dsOverviewVisible, sqlModalVisible,
      dsOptions,
      modelOptions,
      datasetAll,
      listLoading,
      tableLoading,
      keySearchValue,
      datasetList,
      tableData,columns,
      current, dataset,
    } = this.state;
    return (
      <Spin loading={loading} className="obj-detail-spin">
        <div className="obj-detail">
          <div className="base-info card">
            <div className="card-header">
              <div className="title">对象基础信息</div>
              <div className="oper-group"></div>
            </div>
            <div className="card-content">
              <Form ref={this.formRef} layout="vertical" onValuesChange={this.onFormValuesChange}>
                <Grid.Row gutter={36}>
                  <Grid.Col span={12}>
                    <Form.Item
                      label="中文名"
                      style={{ marginBottom: 0 }}>
                      <Grid.Row gutter={8}>
                        <Grid.Col flex='50px'>
                          <Form.Item
                            field='icon'
                            rules={[{required: true, message: '请选择图标'}]}>
                            <Select dropdownMenuClassName='icon-select-container'>
                              {icons.map((option, index) => (
                                <Option key={index}  value={option}>
                                    <ObjectIcon icon={option}/>
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Grid.Col>
                        <Grid.Col flex='auto'>
                          <Form.Item
                            field="objectTypeLabel"
                            rules={[
                              { required: true, message: '中文名必填' },
                              {
                                validator: async (val, callback) => {
                                  const value = val.trim();

                                  console.log(this.dataRef.current?.objectTypeLabel,value);

                                  if (this.dataRef.current?.objectTypeLabel == value) {
                                    callback();
                                    return;
                                  }
                                  const formatRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/;
                                  // 必须包含中文或字母的校验
                                  const chineseOrLetterRegex = /[\u4e00-\u9fa5a-zA-Z]/;

                                  if (!formatRegex.test(val)) {
                                    callback('仅支持中文、字母、数字和下划线');
                                    return;
                                  } else if (!chineseOrLetterRegex.test(val)) {
                                    callback('必须包含中文或字母');
                                    return;
                                  }
                                  const res = await checkObjectTypeExist({
                                    objectTypeLabel: value,
                                    ontologyId: this.dataRef.current.ontologyId,
                                  });
                                  if (res.data && res.data.success) {
                                    const data = res.data.data;
                                    if (data && data.exists) {
                                      callback(`${value}已存在`);
                                    }
                                  }
                                  callback();
                                },
                              },
                            ]}
                          >
                            <Input placeholder="请输入对象的中文名称" maxLength={100} showWordLimit/>
                          </Form.Item>
                        </Grid.Col>
                      </Grid.Row>
                    </Form.Item>
                    <Form.Item
                      label="英文名"
                      field="objectTypeName"
                      rules={[
                        { required: true, message: '英文名必填' },
                        {
                          validator: async (val, callback) => {
                            if (!/^(?=.*[a-zA-Z])[a-zA-Z0-9_]+$/.test(val)) {
                              callback('名称必须包含英文字母，且只能输入英文字母、数字和下划线');
                              return;
                            }
                            const value = val.trim();
                            if (this.dataRef.current?.objectTypeName == value) {
                              callback();
                              return;
                            }
                            const res = await checkObjectTypeExist({
                              objectTypeName: value,
                              ontologyId: this.dataRef.current.ontologyId,
                            });
                            if (res.data && res.data.success) {
                              const data = res.data.data;
                              if (data && data.exists) {
                                callback(`${value}已存在`);
                              }
                            }
                            callback();
                          },
                        },
                      ]}
                    >
                      <Input placeholder="请输入对象的英文名称" maxLength={100} showWordLimit/>
                    </Form.Item>
                    <Form.Item label="描述" field="objectTypeDesc">
                      <Input.TextArea
                        maxLength={200}
                        showWordLimit
                        style={{ height: '52px' }}
                        placeholder="请输入属性描述"
                      />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Form.Item style={{marginBottom: '16px'}} label="状态" field="status" triggerPropName="checked">
                      <Switch checkedText="启用" uncheckedText="禁用" onChange={this.handleStatusChange} />
                    </Form.Item>
                    <div
                      className="interface-info">
                      <div
                        className="list">
                        <div
                          className="label">
                          是否继承
                        </div>
                        <div
                          className="value">
                          {data.interfaceId ? '是' : '否'}
                        </div>
                        <div
                          className="label">
                          继承接口
                        </div>
                        <div
                          className="value">
                          {data.interfaceId ? data.interfaceLabel : '无'}
                        </div>
                        <div
                          className="label">
                          是否生效
                        </div>
                        <div
                          className="value">
                          {data.interface ? '--' : '--'}
                        </div>
                      </div>
                    </div>
                  </Grid.Col>
                </Grid.Row>
              </Form>
            </div>
          </div>
          <div className="layout-5-5">
            <div className="attr card">
              <div className="card-header">
                <div className="title">属性</div>
                <div className="oper-group">
                  <Button
                    size="mini"
                    type="text"
                    onClick={() => {
                      this.props.switchMenuKey('attr', { oper: 'add' });
                    }}
                  >
                    <IconAdd />
                    新建
                  </Button>
                </div>
              </div>
              <div className="card-content">
                <div className="attr-list list">
                  {
                    /*[
                                        {
                                            icon: <IconCounterColor/>,
                                            label: '属性名称',
                                            tags: ['Primary Key', 'Title']
                                        },
                                        {
                                            icon: <IconDataIntegrationColor/>,
                                            label: '属性名称',
                                            tags: ['Primary Key']
                                        },
                                        {
                                            icon: <IconCalendarColor/>,
                                            label: '属性名称',
                                            tags: []
                                        },
                                        {
                                            icon: <IconTextareaColor/>,
                                            label: '属性名称',
                                            tags: []
                                        },
                                        {
                                            icon: <IconUnitMgrColor/>,
                                            label: '属性名称',
                                            tags: []
                                        }
                                    ]*/
                    data.attributes.map(item => {
                      return (
                        <div className="attr-item item">
                          <div className="icon">
                            {/*item.icon*/}
                            <IconDataIntegrationColor />
                          </div>
                          <div className="label">{item.attributeName}</div>
                          <div className="tag-list">
                            {item.isPrimaryKey ? (
                              <Tag size="mini" effect="plain" color="arcoblue">
                                主键
                              </Tag>
                            ) : null}
                            {item.isTitle ? (
                              <Tag size="mini" effect="plain" color="cyan">
                                标题
                              </Tag>
                            ) : null}
                            {item.interfaceAttrId ? (
                              <Tag size="mini" effect="plain" color="purple">
                                继承
                              </Tag>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            </div>
            <div className="action-type card">
              <div className="card-header">
                <div className="title">动作</div>
                <div className="oper-group">
                  <Button
                    size="mini"
                    type="text"
                   // disabled={!data.dsId}
                    onClick={() => {
                      this.props.switchMenuKey('action', { oper: 'add' });
                    }}
                  >
                    <IconAdd />
                    新建
                  </Button>
                </div>
              </div>
              <div className="card-content">
                <div className="action-list list">
                  {
                    /*[
                                        {
                                            icon: <IconPlateCreatedColor/>,
                                            label: '创建 [这里是对象类型中文名称] 对象实例'
                                        },
                                        {
                                            icon: <IconEditColor/>,
                                            label: '编辑 [这里是对象类型中文名称] 对象实例'
                                        },
                                        {
                                            icon: <IconDeleteColor/>,
                                            label: '删除 [这里是对象类型中文名称] 对象实例'
                                        }
                                    ]*/ data.actions.map(item => {
                      return (
                        <div className="action-item item">
                          <div className="icon">{this.renderActionIcon(item.actionType)}</div>
                          <div className="label">
                            {item.actionLabel
                              ? item.actionLabel.replace('%s', data.objectTypeLabel)
                              : item.actionName}
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
                {data.actions ? '' : <ObjEmpty />}
              </div>
            </div>
          </div>
          <div className="layout-5-5">
            <div className="link-type card">
              <div className="card-header">
                <div className="title">关系</div>
                <div className="oper-group" style={{display: 'flex', alignItems: 'center'}}>
                  <Button
                    size="mini"
                    type="text"
                 //   disabled={!data.dsId}
                    onClick={() => {
                      this.props.switchMenuKey('link', { oper: 'add' });
                    }}
                  >
                    <IconAdd />
                    新建
                  </Button>
                  <Switch disabled={!data.dsId} checkedText="画布视图" uncheckedText="列表视图" />
                </div>
              </div>
              <div className="card-content">
                {data.linkTypes.length > 0 ? (
                  <div className="link-list list">
                    {
                      /*[
                                        {
                                            source: 'Customer',
                                            sourceIcon: <IconUserColor/>,
                                            target: 'Location',
                                            targetIcon: <IconDataMapColor/>,
                                            date: '2024-12-27'
                                        },
                                        {
                                            source: 'Customer',
                                            sourceIcon: <IconUserColor/>,
                                            target: 'Location',
                                            targetIcon: <IconDataMapColor/>,
                                            date: '2024-12-27'
                                        },
                                        {
                                            source: 'Customer',
                                            sourceIcon: <IconUserColor/>,
                                            target: 'Location',
                                            targetIcon: <IconDataMapColor/>,
                                            date: '2024-12-27'
                                        },
                                        {
                                            source: 'Customer',
                                            sourceIcon: <IconUserColor/>,
                                            target: 'Location',
                                            targetIcon: <IconDataMapColor/>,
                                            date: '2024-12-27'
                                        },
                                        {
                                            source: 'Customer',
                                            sourceIcon: <IconUserColor/>,
                                            target: 'Location',
                                            targetIcon: <IconDataMapColor/>,
                                            date: '2024-12-27'
                                        }
                                    ]*/ data.linkTypes.map(item => {
                        return (
                          <div className="link-item item">
                            <div className="link-item-info">
                              <div className="source">
                                <Tag size="mini">
                                  <IconUserColor />
                                  {item?.sourceObjectType?.objectTypeLabel}
                                </Tag>
                              </div>
                              <div className="link-icon">
                                <img
                                  style={{
                                    verticalAlign: 'middle',
                                  }}
                                  src={
                                    item.linkType === 1 && item.linkMethod === 1
                                      ? oneToOneIcon
                                      : item.linkType === 1 && item.linkMethod === 2
                                      ? oneToManyIcon
                                      : manyToManyIcon
                                  }
                                />
                              </div>
                              <div className="target">
                                <Tag size="mini">
                                  <IconDataMapColor />
                                  {item?.targetObjectType?.objectTypeLabel}
                                </Tag>
                              </div>
                            </div>
                            <div className="date">{item.date}</div>
                          </div>
                        );
                      })
                    }
                  </div>
                ) : (
                  <ObjEmpty />
                )}
              </div>
            </div>
            <div className="ds card">
              <div className="card-header">
                <div className="title">数据源</div>
                <div className="oper-group">
                  {data.dsId ? (
                    <>
                      <Button
                        size="mini"
                        type="text"
                        onClick={() => {
                          this.setState({
                            dsOverviewVisible: true,
                          });
                        }}
                      >
                        <IconEyeColor />
                        预览
                      </Button>
                      <span className="split"></span>
                      {data.dsType == 1 && (
                        <>
                          <Button
                            size="mini"
                            type="text"
                            onClick={() => {
                              this.setState({
                                sqlModalVisible: true,
                              });
                            }}
                          >
                            <IconCodeColor />
                            sql语句
                          </Button>
                          <span className="split"></span>
                        </>
                      )}
                    </>
                  ) : null}

                  <Button size="mini" type="text" onClick={()=>{
                    this.setState({
                      stepModalVisible: true,
                      dataset: {
                        middleDsId: data.dsId,
                        middleDsSchema: data.dsSchema,
                        middleTableName: data.tableName
                      },
                    });
                    setTimeout(()=>{
                      debugger;
                      this.datasetFormRef.current?.setFieldsValue({middleDsId:data.dsId||undefined,middleDsSchema:data.dsSchema||undefined});

                      this.getDatasetFields();
                    })
                  }}>
                    <IconEditColor />
                    替换数据源
                  </Button>
                </div>
              </div>
              <div className="card-content">
                {data.dsId ? (
                  <>
                    <Alert content="更改数据源时，已配置的属性映射信息将全部丢失" />
                    <div className="ds-list">
                      {[
                        {
                          label: data.tableName,
                          dsLabel: data.dsId,
                          schemaLabel: data.dsSchema,
                        },
                      ].map(item => {
                        return (
                          <div className="ds-item">
                            <div className="pos-left">
                              <div className="icon-container">
                                <IconDataCatalogMgrColor />
                              </div>
                            </div>
                            <div className="pos-right">
                              <div className="label">{item.label}</div>
                              <div className="text">{`${item.dsLabel}/${item.schemaLabel}`}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <ObjEmpty text="未添加数据源" />
                )}
              </div>
            </div>
          </div>
        </div>
        {data.id ? (
          <DsOverview
            object={data}
            visible={dsOverviewVisible}
            visibleChange={visible => {
              this.setState({
                dsOverviewVisible: visible,
              });
            }}
          />
        ) : null}
        {/* SQL 语句弹窗 */}
        <Modal
          title={<div style={{ textAlign: 'left', fontWeight: 600 }}>SQL 语句</div>}
          visible={sqlModalVisible}
          onCancel={() => {
            this.setState({
              sqlModalVisible: false,
            });
          }}
          footer={null}
          style={{ width: 800 }}
          autoFocus={false}
          focusLock
        >
          <div
            style={{
              height: '400px',
              border: '1px solid #e5e6eb',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <MonacoEditor
              width="100%"
              height="100%"
              language="sql"
              value={this.formatCustomSql()}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                lineNumbers: 'on',
                wordWrap: 'on',
                automaticLayout: true,
                theme: 'vs',
              }}
              editorDidMount={(editor, monaco) => {
                // Editor mounted
              }}
            />
          </div>
        </Modal>
        <Modal
          title={<div style={{ textAlign: 'left', fontWeight: 600 }}>选择数据集</div>}
          style={{ width: '1000px' }}
          visible={this.state.stepModalVisible}
          onOk={this.handleDatasetModelOk}
          onCancel={() => {
            this.setState({
              stepModalVisible: false,
            });
          }}
          autoFocus={false}
          focusLock
          className="relation-step-modal"
        >
          <div className="relation-dataset-container">
            <Form
              ref={this.datasetFormRef}
              autoComplete="off"
              layout="vertical"
              className="dataset-form"
              onValuesChange={this.onValuesChange}
            >
              <FormItem
                label="数据源"
                field="middleDsId"
                rules={[{ required: true, message: '请选择数据源' }]}
              >
                <Select placeholder={'请选择数据源'} showSearch
                        filterOption={(inputValue, option) => option.props.extra.name.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0}>
                  {dsOptions.map((option, index) => (
                    <Option key={option.id} value={option.id} extra={option}>
                      {option.name}
                    </Option>
                  ))}
                </Select>
              </FormItem>
              <FormItem
                label="模式"
                field="middleDsSchema"
                rules={[{ required: true, message: '请选择模式' }]}
              >
                <Select placeholder={'请选择模式'} showSearch>
                  {modelOptions.map((option, index) => (
                    <Option key={option} value={option}>
                      {option}
                    </Option>
                  ))}
                </Select>
              </FormItem>
            </Form>
            <div className="dataset-container">
              <div className="dataset-left">
                <div className="dataset-head">
                  <span>数据集</span>
                </div>
                <Spin style={{ display: 'block', width: '100%' }} loading={listLoading}>
                  {datasetAll.length > 0 ? (
                    <InputSearch
                      allowClear
                      placeholder={'请输入'}
                      value={keySearchValue}
                      className="search-input"
                      onChange={this.keySearch}
                    />
                  ) : (
                    ''
                  )}
                  {datasetList.length > 0 ? (
                    <List
                      className="dataset-list"
                      onReachBottom={currentPage => this.setState({ current: current + 1 },()=>{ this.updateDataset();})}
                      dataSource={datasetList}
                      render={(item, index) => (
                        <List.Item
                          key={item.TABLE_NAME}
                          className={`list-item ${
                            item.TABLE_NAME === dataset.middleTableName ? 'active' : ''
                            }`}
                          onClick={() =>
                            this.setState({
                              dataset: { ...dataset, middleTableName: item.TABLE_NAME },
                            },()=>{
                              this.getDatasetFields()
                            })
                          }
                        >
                          <Tooltip content={item.TABLE_NAME}> {item.TABLE_NAME}</Tooltip>
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Empty
                      icon={
                        <div
                          style={{
                            display: 'inline-flex',
                            width: 48,
                            height: 48,
                          }}
                        >
                          <img src={emptyIcon} alt="暂无数据" />
                        </div>
                      }
                      description={'未选择数据集'}
                    />
                  )}
                </Spin>
              </div>
              <div className="dataset-arrow">
                <div className={`right-icon ${data.middleTableName ? '' : 'empty'}`}>
                  <img className="gt" src={rightIcon} alt="暂无数据" />
                </div>
              </div>
              <div className="dataset-right">
                <div className="dataset-head">
                  <span>字段</span>
                </div>
                <div className="dataset-content">
                  <Spin
                    style={{ display: 'block', width: '100%', height: '100%' }}
                    loading={tableLoading}
                  >
                    {tableData.length > 0 ? (
                      <Table
                        columns={columns}
                        data={tableData}
                        scroll={{
                          x: false,
                          y: 440,
                        }}
                        style={{
                          minHeight: '200px',
                        }}
                        rowKey="COLUMN_NAME"
                        pagination={false}
                      />
                    ) : (
                      <Empty
                        icon={
                          <div
                            style={{
                              display: 'inline-flex',
                              width: 48,
                              height: 48,
                            }}
                          >
                            <img src={emptyIcon} alt="暂无数据" />
                          </div>
                        }
                        description={'未选择字段'}
                      />
                    )}
                  </Spin>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </Spin>
    );
  }
}

export default ObjDetail;
