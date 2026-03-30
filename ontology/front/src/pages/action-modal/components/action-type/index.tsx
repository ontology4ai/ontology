import React, { useEffect, useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { connect } from 'react-redux';
import useLocale from 'modo-plugin-common/src/utils/useLocale';
import {
  Form,
  Select,
  Input,
  Message,
  Tabs,
  Tag,
  Tooltip,
  Spin,
  Radio,
  Typography,
  Space,
} from '@arco-design/web-react';
import i18n from '../../locale';

import './index.less';
import {
  IconPlateCreatedColor,
  IconEditColor,
  IconDeleteColor,
  IconDataResDirColor,
} from 'modo-design/icon';

import ObjectIcon from '@/components/ObjectIcon';
import { getAllObject } from '@/pages/action-modal/api';

const { TabPane } = Tabs;
const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const { Option } = Select;

const actionTypeMap = {
  create: {
    icon: <IconPlateCreatedColor />,
    name: '创建对象',
    label: '设置动作类型可新建对象实例',
  },
  update: {
    icon: <IconEditColor />,
    name: '修改对象（可批量）',
    label: '设置动作类型可编辑对象实例',
  },
  delete: {
    icon: <IconDeleteColor />,
    name: '删除对象（可批量）',
    label: '设置动作类型可删除对象实例',
  },
};

const source = forwardRef((props, ref) => {
  const t = useLocale();
  const loginT = useLocale(i18n);
  const [objectTypeId, setObjectTypeId] = useState('');
  const [objList, setObjList] = useState([]);
  const [activeTab, setActiveTab] = useState('1');
  const formRef = useRef();

  useEffect(() => {
    formRef.current.setFieldValue('actionType', 'create');
    getAllObjects();
  }, []);

  useImperativeHandle(ref, () => ({
    validate,
    getActionTypeData,
  }));
  const validate = async () => {
    let valid = true;
    try {
      await formRef.current.validate();
    } catch (e) {
      valid = false;
    }
    return valid;
  };
  const getActionTypeData = () => {
    const formData = formRef.current.getFieldsValue();
    return {
      type: activeTab,
      objData: objList.find(item => item.id == objectTypeId),
      objectTypeId,
      ...formData,
    };
  };
  const onObjValuesChange = (changeValue: any, values: any) => {
    if (changeValue.hasOwnProperty('object')) {
      setObjectTypeId(changeValue.object);
    }
  };
  const getAllObjects = () => {
    getAllObject({ ontologyId: props.ontologyId }).then(res => {
      if (res.data.success) {
        const { data } = res.data;
        setObjList(data);
        console.log(data.map(item=>item.objectTypeLabel));
      }
    });
  };
  return (
    <div className="action-type-container" style={{ display: props.isShow ? 'flex' : 'none' }}>
      <Tabs activeTab={activeTab} onChange={setActiveTab}>
        <TabPane key="1" title="对象">
          <Form
            ref={formRef}
            autoComplete="off"
            layout="vertical"
            className="obj-form"
            onValuesChange={onObjValuesChange}
          >
            <FormItem
              label="对象类型"
              field="object"
              rules={[
                {
                  required: true,
                  message: '请选择对象类型',
                },
              ]}
            >
              <Select placeholder="请选择对象类型" showSearch
                filterOption={(inputValue, option) => option.props.extra.objectTypeName.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0 ||
                  option.props.extra.objectTypeLabel.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0
                }>
                {objList.map(item => (
                  <Option value={item.id} key={item.id} extra={item}>
                    {/* <Space size="mini">
                      <IconDataResDirColor />
                      <Typography.Text ellipsis={{ showTooltip: true }}>
                        {item.objectTypeLabel}
                      </Typography.Text>
                    </Space> */}
                    <ObjectIcon icon={item.icon} />  {item.objectTypeLabel}
                  </Option>
                ))}
              </Select>
            </FormItem>
            <FormItem
              label="对象动作"
              field="actionType"
              rules={[
                {
                  required: true,
                  message: '请选择对象动作',
                },
              ]}
            >
              <RadioGroup name="card-radio-group">
                {['create', 'update', 'delete'].map(item => {
                  return (
                    <Radio key={item} value={item}>
                      {({ checked }) => {
                        return (
                          <Space
                            align="start"
                            className={`custom-radio-card ${
                              checked ? 'custom-radio-card-checked' : ''
                            }`}
                          >
                            <div className="custom-radio-card-mask">
                              <div className="custom-radio-card-mask-dot"></div>
                            </div>
                            <div className="radio-content">
                              <div className="action-icon">{actionTypeMap[item].icon}</div>
                              <div>
                                <div className="custom-radio-card-title">
                                  {actionTypeMap[item].name}
                                </div>
                                <Typography.Text type="secondary">
                                  {actionTypeMap[item].label}
                                </Typography.Text>
                              </div>
                            </div>
                          </Space>
                        );
                      }}
                    </Radio>
                  );
                })}
              </RadioGroup>
            </FormItem>
          </Form>
        </TabPane>
        <TabPane key="2" title="函数" disabled>
          <Typography.Paragraph>Content of Tab Panel 2</Typography.Paragraph>
        </TabPane>
        <TabPane key="3" title="关系" disabled>
          <Typography.Paragraph>Content of Tab Panel 2</Typography.Paragraph>
        </TabPane>
        <TabPane key="4" title="接口" disabled>
          <Typography.Paragraph>Content of Tab Panel 2</Typography.Paragraph>
        </TabPane>
        <TabPane key="5" title="通知" disabled>
          <Typography.Paragraph>Content of Tab Panel 2</Typography.Paragraph>
        </TabPane>
      </Tabs>
    </div>
  );
});

export default source;
