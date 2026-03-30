import manyToManyIcon from '@/pages/link-manager/images/mToM.svg';
import oneToManyIcon from '@/pages/link-manager/images/oToM.svg';
import oneToOneIcon from '@/pages/link-manager/images/oToO.svg';
import {
  Button,
  Form,
  Grid,
  Input,
  Message,
  Modal,
  Select,
  Spin,
  Space,
  Switch,
} from '@arco-design/web-react';
import { Tag } from 'modo-design';
import {
  IconAdd,
  IconCalendarColor,
  IconCounterColor,
  IconDataIntegrationColor,
  IconDataMapColor,
  IconDeleteColor,
  IconEditColor,
  IconPlateCreatedColor,
  IconTextareaColor,
  IconUnitMgrColor,
  IconUserColor,
} from 'modo-design/icon';
import React from 'react';
import { getData, updateData,removeObjData } from './api';
import ObjEmpty from './components/Empty';
import './style/index.less';

import ObjectIcon from '@/components/ObjectIcon';

import ObjOverview from '@/pages/obj-overview';
import {checkExists} from "@/pages/interface-manager/api";
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
class ObjDetail extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = {
      loading: true,
      data: {
        extendedList: [],
        attributeList: [],
        relationList: [],
      },
    };
    this.formRef = React.createRef();
    this.dataRef = React.createRef();
    this.datasetFormRef = React.createRef();
    this.viewMapRef = React.createRef();
    this.viewMapRef.current = {};
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
            name: data.name,
            label: data.label,
            description: data.description,
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
    const status = this.formRef.current.getFieldValue('status');
    if (this.state.data.status !== Number(status)) {
      this.changeStatus(status, () => {
        this.updateInterface(callback);
      });
    } else {
      this.updateInterface(callback);
    }
  };
  updateInterface = callback => {
    this.setState({
      loading: true,
    });
    const data = {
      ...this.state.data,
      ...this.formRef.current.getFieldsValue(),
    };
    data.status = Number(data.status);
    // delete data.id;
    updateData(this.state.data.id, data)
      .then(res => {
        if (res.data.success) {
          typeof callback === 'function' && callback(data.label);
          Message.success('保存成功！');
          return;
        }
        throw 'err';
      })
      .catch(err => {
        console.log(err);
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

  onFormValuesChange = (changeValue: any, values: any) => {};
  changeStatus = (value, updateInterface) => {
    if (value) {
      Modal.confirm({
        title: '提示',
        content: '启用接口时，默认同步启用继承对象。如对象原先即为禁用，则维持不变。',
        onOk: () => {
          updateInterface();
        },
        onCancel: () => {
          this.formRef.current.setFieldValue('status', false);
        },
      });
    } else {
      Modal.confirm({
        title: '提示',
        content: '禁用接口时，如继承对象为启用，则同步禁用对象。',
        onOk: () => {
          updateInterface();
        },
        onCancel: () => {
          this.formRef.current.setFieldValue('status', true);
        },
      });
    }
  };
  removeObj = (ids)=>{
    removeObjData(this.props.obj.id,ids).then(res=>{
      if(res.data.success){
        Message.success('移除成功');
        const data = this.state.data;
        const extendedList = data.extendedList.filter(item=>{
          return !ids.includes(item.id)
        });
        data.extendedList = extendedList;
        this.setState({data:data});
      }else{
        Message.error('移除失败');
      }
    })
  };
  /*updateStatus=(status)=>{
      const param = {
        interfaceId:this.props.obj.id,
        status
      }
    updateStatus(param).then(res=>{
      if(res.data.success){
        Message.success('状态更新成功');
      }
    })
  };*/

  render() {
    const { loading, data } = this.state;
    return (
      <Spin loading={loading} className="obj-detail-spin">
        <div className="obj-detail">
          <div className="base-info card">
            <div className="card-header">
              <div className="title">接口基础信息</div>
              <div className="oper-group"></div>
            </div>
            <div className="card-content">
              <Form ref={this.formRef} layout="vertical" onValuesChange={this.onFormValuesChange}>
                <Grid.Row gutter={36}>
                  <Grid.Col span={12}>
                    <FormItem label="中文名称和图标选择" required className="icon-name-form">
                      <Grid.Row gutter={8}>
                        <Grid.Col span={3}>
                          <FormItem
                            field="icon"
                            rules={[{ required: true, message: '请选择图标' }]}
                          >
                            <Select dropdownMenuClassName="icon-select-container">
                              {icons.map((option, index) => (
                                <Option key={index} value={option}>
                                  <ObjectIcon icon={option} />
                                </Option>
                              ))}
                            </Select>
                          </FormItem>
                        </Grid.Col>
                        <Grid.Col span={21}>
                          <FormItem
                            field="label"
                            rules={[
                              { required: true, message: '中文名必填' },
                               {
                                        validator: async (value, callback) => {
                                          if (this.dataRef.current?.label == value) {
                                            callback();
                                            return;
                                          }
                                          const formatRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/;
                                          // 必须包含中文或字母的校验
                                          const chineseOrLetterRegex = /[\u4e00-\u9fa5a-zA-Z]/;

                                          if (!formatRegex.test(value)) {
                                            callback('仅支持中文、字母、数字和下划线');
                                            return;
                                          } else if (!chineseOrLetterRegex.test(value)) {
                                            callback('必须包含中文或字母');
                                            return;
                                          }
                                          const res = await checkExists({
                                            ontologyId: this.dataRef?.current.ontologyId,
                                            label: value,
                                            name: '',
                                          });
                                          if (res.data.success && res.data.data.exists) {
                                            callback(`${value}已存在`);
                                          }
                                          callback();
                                        },
                                      },
                            ]}
                          >
                            <Input placeholder="请输入接口的中文名称" />
                          </FormItem>
                        </Grid.Col>
                      </Grid.Row>
                    </FormItem>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Form.Item label="状态" field="status" triggerPropName="checked">
                      <Switch
                        checkedText="启用"
                        uncheckedText="禁用"
                        onChange={val => {
                          this.formRef.current.setFieldValue('status', !val);
                          // 弹出确认框
                          if (val) {
                            Modal.confirm({
                              title: '提示',
                              content: '启用接口时，默认同步启用继承对象。如对象原先即为禁用，则维持不变。',
                              onOk: () => {
                                // 用户确认后更新状态
                                this.formRef.current.setFieldValue('status', val);
                                // 调用更新接口的方法
                                this.updateInterface();
                              },
                            });
                          } else {
                            Modal.confirm({
                              title: '提示',
                              content: '禁用接口时，如继承对象为启用，则同步禁用对象。',
                              onOk: () => {
                                // 用户确认后更新状态
                                this.formRef.current.setFieldValue('status', val);
                                // 调用更新接口的方法
                                this.updateInterface();
                              },
                            });
                          }
                        }}
                      />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row gutter={36}>
                  <Grid.Col span={12}>
                    <Form.Item
                      label="英文名"
                      field="name"
                      rules={[
                        { required: true, message: '英文名必填' },
                        {
                          validator: async (val, callback) => {
                            if (!/^(?=.*[a-zA-Z])[a-zA-Z0-9_]+$/.test(val)) {
                              callback('名称必须包含英文字母，且只能输入英文字母、数字和下划线');
                              return;
                            }
                            if (this.dataRef.current?.name == val) {
                              callback();
                              return;
                            }
                            const res = await checkExists({
                              ontologyId: this.dataRef?.current.ontologyId,
                              label: '',
                              name: val,
                            });
                            if (res.data.success && res.data.data.exists) {
                              callback(`${val}已存在`);
                            }
                            callback();
                          },
                        },
                      ]}
                    >
                      <Input placeholder="请输入接口的英文名称" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Form.Item label="对象数量">{data.extendedList?.length||0}</Form.Item>
                  </Grid.Col>
                </Grid.Row>
                <Grid.Row gutter={36}>
                  <Grid.Col span={12}>
                    <Form.Item label="描述" field="description">
                      <Input.TextArea
                        maxLength={50}
                        showWordLimit
                        style={{ height: '52px' }}
                        placeholder="请输入属性描述"
                      />
                    </Form.Item>
                  </Grid.Col>
                </Grid.Row>
              </Form>
            </div>
          </div>
          <div className="layout-5-5">
            <div className="attr card">
              <div className="card-header">
                <div className="title">
                  属性
                  <Tag size="small" style={{ marginLeft: '8px' }}>
                    {data.attributeList?.length || 0}
                  </Tag>
                </div>
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
                  {data.attributeList?.map(item => {
                    return (
                      <div className="attr-item item">
                        <div className="icon">{renderIcon(item.type)}</div>
                        <div className="label">{item.label||item.name}</div>
                        {/* <div className="tag-list">
                            {item.isRequired ? (
                              <Tag size="mini" effect="plain" color="arcoblue">
                                必选
                              </Tag>
                            ) : <Tag size="mini" effect="plain" color="cyan">
                              可选
                            </Tag>}
                          </div> */}
                      </div>
                    );
                  })}
                </div>
                {!data.attributeList || data.attributeList.length == 0 ? <ObjEmpty /> : ''}
              </div>
            </div>
            <div className="link-type card">
              <div className="card-header">
                <div className="title">
                  关系约束
                  <Tag size="small" style={{ marginLeft: '8px' }}>
                    {data.constraintList?.length || 0}
                  </Tag>
                </div>
                <div className="oper-group">
                   <Button
                    size="mini"
                    type="text"
                    onClick={() => {
                      this.props.switchMenuKey('relationConstraint', { oper: 'add' });
                    }}
                  >
                    <IconAdd />
                    新建
                  </Button>
                </div>
              </div>
              <div className="card-content">
                {data.constraintList?.length > 0 ? (
                  <div className="link-list list">
                    {data.constraintList.map(item => {
                      return (
                        <div className="link-item item" key={item.id}>
                          <div className="link-item-info">
                            <div className="source">
                              <Tag size="mini">
                                <ObjectIcon icon={item.interfaceIcon || ''} />
                                {item?.interfaceLabel}
                              </Tag>
                            </div>
                            <div className="link-icon">
                              <img
                                style={{
                                  verticalAlign: 'middle',
                                }}
                                src={
                                  item.constraintRelation === '1To1'
                                    ? oneToOneIcon
                                    :  oneToManyIcon
                                }
                              />
                            </div>
                            <div className="target">
                              <Tag size="mini">
                                <ObjectIcon icon={item.objectTypeIcon || ''} />
                                {item?.objectTypeLabel}
                              </Tag>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <ObjEmpty />
                )}
              </div>
            </div>
          </div>
          <div className="layout-5-5">
            <div className="object-type card">
              <div className="card-header">
                <div className="title">
                  继承对象
                  <Tag size="small" style={{ marginLeft: '8px' }}>
                    {data.extendedList?.length || 0}
                  </Tag>
                </div>
                <div className="oper-group">
                  <Button
                    size="mini"
                    type="text"
                    onClick={() => {
                      this.props.switchMenuKey('extendObject', { oper: 'add' });
                    }}
                  >
                    <IconAdd />
                    新建
                  </Button>
                </div>
              </div>
              <div className="card-content">
                {data.extendedList?.length > 0 ? (
                  <div className="extend-list list">
                    {data.extendedList.map(item => {
                      return (
                        <div className="extend-item item">
                          <Space size='mini' style={{cursor:'pointer'}} onClick={() => {
                            this.viewMapRef.current[item.id] = null;
                            this.props.push({
                              key: item.id,
                              ontology:this.props.ontology,
                              title: item.objectTypeLabel,
                              view: (
                                <ObjOverview
                                  onUpdateUseSaveBtn={this.props.onUpdateUseSaveBtn}
                                  ontology={this.props.ontology}
                                  ref={ref =>this.viewMapRef.current[item.id] = ref}
                                  obj={item}
                                  changeTab={(tab,oper)=>this.props.changeTab && this.props.changeTab(tab,oper)}
                                  push={this.props.push}
                                  getRef={() => this.viewMapRef.current[item.id]}/>
                              )
                            })
                          }}>
                            <div className="icon"><ObjectIcon icon={item.icon}/></div>
                            <div className="label">{item.objectTypeLabel}</div>
                          </Space>
                          <Button type='text' onClick={()=>this.removeObj([item.id])}>移除</Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <ObjEmpty />
                )}
              </div>
            </div>
          </div>
        </div>
      </Spin>
    );
  }
}

export default ObjDetail;
