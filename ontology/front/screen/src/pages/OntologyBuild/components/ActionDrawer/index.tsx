import {
  Button,
  Drawer,
  Form,
  Grid,
  Input,
  Radio,
  Select,
  Spin,
  Tooltip,
} from '@arco-design/web-react';
import { IconQuestionCircle } from '@arco-design/web-react/icon';
import React, { useEffect, useState } from 'react';
import { objectTypeList } from '../ObjectDrawer/api';
import createActionIcon from '../ObjectDrawer/assets/create-action-icon.svg';
import deleteActionIcon from '../ObjectDrawer/assets/delete-action-icon.svg';
import editActionIcon from '../ObjectDrawer/assets/edit-action-icon.svg';
import nameIcon from '../ObjectDrawer/assets/name-icon.svg';
import Title from '../Title';
import { actionTypeDetail, actionTypeSave, actionTypeUpdate } from './api';
import './index.less';
import { useTranslation } from 'react-i18next';

const FormItem = Form.Item;
const Option = Select.Option;

interface ActionDrawerProps {
  visible: boolean;
  id?: string;
  onCancel: () => void;
  onOk: (data: any) => void;
}

const ActionDrawer: React.FC<ActionDrawerProps> = ({ visible, id, onCancel, onOk }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [logic, setLogic] = useState('');
  const [defaultValues, setDefaultValues] = useState({});
  const [selectedObjectType, setSelectedObjectType] = useState('');

  const handleOk = async () => {
    setLoading(true);

    try {
      let res = { data: { success: false, data: {} } };
      if (id) {
        res = await actionTypeUpdate({
          id,
          ...form.getFieldsValue(),
          logicTypeId: logic,
        });
      } else {
        res = await actionTypeSave({
          ...form.getFieldsValue(),
          logicTypeId: logic,
        });
      }

      const { success, data } = res.data;

      if (success) {
        onOk(data);
      }
    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  };

  const [objectList, setObjectList] = useState([]);
  const getObjectList = async () => {
    try {
      const res = await objectTypeList({});

      const { data, success } = res.data;
      if (success) {
        setObjectList(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getData = async () => {
    try {
      const res = await actionTypeDetail({
        id,
      });

      const { data, success } = res.data;

      if (success) {
        form.setFieldsValue(data);
        setLogic(data.logicTypeId || '');
        setSelectedObjectType(data.objectTypeId || '');
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (visible) {
      if (id) {
        getData();
      }
      getObjectList();
    } else {
      form.resetFields();
      setLogic('');
      setSelectedObjectType('');
    }
  }, [visible]);

  const getDrawerTitle = () => {
    return id ? t('edit.action') : t('new.action'); // "编辑动作" : "新建动作"
  };

  const getObjectLabel = () => {
    const object = objectList.find(item => item.id === selectedObjectType);
    return object ? object.label : t('object.type.selection'); // "对象"
  };

  return (
    <Drawer
      getPopupContainer={() => {
        return document.querySelector('.screen-content') || document.body;
      }}
      width="50%"
      title={null}
      visible={visible}
      footer={null}
      closable={false}
      onOk={() => {
        handleOk();
      }}
      onCancel={() => {
        onCancel();
      }}
      className="action-drawer"
    >
      <div className='action-drawer-bg'>
        <img src={new URL(`./assets/bg.png`, import.meta.url).href} />
      </div>
      <div className='action-drawer-main'>
        <div className='action-drawer-header'>
          {getDrawerTitle()}
          <img onClick={() => { onCancel(); }} src={new URL(`./assets/close.png`, import.meta.url).href} />
        </div>
        <Spin loading={loading} className="action-drawer-content">
          <Title className="action-drawer-title">{t('basic.info')}</Title> {/* "基本信息" */}
          <Form form={form} layout="vertical" initialValues={{ 
            icon: 'nameIcon',
            label: defaultValues.label,
            name: defaultValues.name,
            desc: defaultValues.desc,
            objectTypeId: defaultValues.objectTypeId
          }}>
            <Grid.Row gutter={24}>
              <Grid.Col span={12}>
                <FormItem 
                  label={t('chinese.name')} // "中文名称"
                  field="label" 
                  rules={[{ required: true, message: t('enter.chinese.name.required') }]} // "请输入中文名称"
                  required 
                  className="icon-name-form"
                >
                  <Input placeholder={t('enter.chinese.name')} />
                </FormItem>
              </Grid.Col>
              <Grid.Col span={11} offset={1}>
                <FormItem
                  label={t('english.name')} // "英文名称"
                  field="name"
                  rules={[{ required: true, message: t('enter.english.name.required') }]} // "请输入英文名称"
                >
                  <Input placeholder={t('enter.english.name')} />
                </FormItem>
              </Grid.Col>
            </Grid.Row>

            <FormItem label={t('description.field')} field="desc">
              <Input.TextArea 
                placeholder={t('enter.description')} // "请输入"
                maxLength={50} 
                showWordLimit 
              />
            </FormItem>
          </Form>
          <Title className="action-drawer-title">{t('object.type.selection')}</Title>
          <Form form={form} layout="vertical">
            <FormItem 
              label={t('object.type.selection')} // "对象类型"
              field="objectTypeId" 
              required
            >
              <Select
                placeholder={t('select.object.type')} // "请选择对象类型"
                getPopupContainer={node => {
                  return node;
                }}
                triggerProps={{
                  popupAlign: {
                    bottom: 20,
                  },
                }}
                onChange={(value) => {
                  setSelectedObjectType(value);
                  form.setFieldValue('objectTypeId', value);
                }}
              >
                {objectList.map(item => {
                  return <Option key={item.id} value={item.id}>{item.label}</Option>;
                })}
              </Select>
            </FormItem>
          </Form>
          <Title className="action-drawer-title">{t('configure.action')}</Title> {/* "配置动作" */}
          <div className="actionConfig-container" style={{ flex: 'none' }}>
            {/* 注释掉的逻辑选择部分
            <div className="action-setting-head">
              <div>
                <div className="dot" />
                {t('please.select.logic')}
                <Tooltip content="">
                  {' '}
                  <IconQuestionCircle />
                </Tooltip>
              </div>
            </div>
            */}
            <div className="action-list">
              <Radio.Group value={logic} onChange={setLogic}>
                <Radio value="order">
                  <div className="check-content">
                    <img src={new URL(`./assets/icon1.png`, import.meta.url).href} />
                    <div className="action-content">
                      <div className="action-title">
                        {t('create.object.instance')}
                      </div>
                    </div>
                  </div>
                </Radio>
                <Radio value="basestation">
                  <div className="check-content">
                    <img src={new URL(`./assets/icon2.png`, import.meta.url).href} />
                    <div className="action-content">
                      <div className="action-title">
                        {t('edit.object.instance')}
                      </div>
                    </div>
                  </div>
                </Radio>
                <Radio value="marketing">
                  <div className="check-content">
                    <img src={new URL(`./assets/icon3.png`, import.meta.url).href} />
                    <div className="action-content">
                      <div className="action-title">
                        {t('delete.object.instance')}
                      </div>
                    </div>
                  </div>
                </Radio>
              </Radio.Group>
            </div>
          </div>
        </Spin>
        <div className='action-drawer-footer'>
          <Button onClick={() => handleOk()} type="primary">
            {t('save')} {/* "保存" */}
          </Button>
        </div>
      </div>
    </Drawer>
  );
};

export default ActionDrawer;