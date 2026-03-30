import React, { useState, useEffect } from 'react';
import { Drawer, Button, Form, Grid, Select, Input, Spin, Message } from '@arco-design/web-react';
import './index.less';
import codeViewTitleIcon from '../ObjectDetailDrawer/assets/code-view-title-icon.svg';
import { logicCreate, logicTypeDetail, logicUpdate } from './api';
import { useTranslation } from 'react-i18next';

const FormItem = Form.Item;

interface LogicDrawerProps {
  visible: boolean;
  id?: string;
  onCancel: () => void;
  onOk: (data: any) => void;
}

const LogicDrawer: React.FC<LogicDrawerProps> = ({ visible, id, onCancel, onOk }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState('');

  const handleOk = async () => {
    setLoading(true);

    try {
      let res = { data: { success: false, data: {} } };
      if (id) {
        res = await logicUpdate({
          id,
          ...form.getFieldsValue(),
          code,
        });
      } else {
        res = await logicCreate({
          ...form.getFieldsValue(),
          code,
        });
      }

      const { success, data } = res.data;

      if (success) {
        onOk(data);
        Message.success(t('save.success')); // "保存成功"
      } else {
        Message.error(t('save.failed')); // "保存失败"
      }
    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  };

  const getData = async () => {
    try {
      const res = await logicTypeDetail({
        id,
      });

      const { data, success } = res.data;
      if (success) {
        form.setFieldsValue(data);
        setCode(data.code);
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
    } else {
      form.resetFields();
      setCode('');
    }
  }, [visible]);

  const getDrawerTitle = () => {
    return id ? t('edit.logic') : t('new.logic'); // "编辑逻辑" : "新建逻辑"
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
      className="logic-drawer"
    >
      <div className='logic-drawer-bg'>
        <img src={new URL(`../PublishDrawer/imgs/bg.png`, import.meta.url).href} />
      </div>
      <div className='logic-drawer-wrap'>
        <div className='logic-drawer-title'>
          {getDrawerTitle()}
          <img onClick={() => { onCancel(); }} src={new URL(`../PublishDrawer/imgs/close.png`, import.meta.url).href} />
        </div>
        <Spin loading={loading} className="logic-drawer-content">
          <Form form={form} layout="vertical">
            <Grid.Row gutter={24}>
              <Grid.Col span={12}>
              <FormItem
                label={t('chinese.name')}
                field="label"
                rules={[{ required: true, message: t('enter.chinese.name.required') }]}
                required
                className="icon-name-form"
              >
                <Input placeholder={t('enter.chinese.name')} />
              </FormItem>
              </Grid.Col>
              <Grid.Col span={11} offset={1}>
              <FormItem
                label={t('english.name')}
                field="name"
                rules={[{ required: true, message: t('enter.english.name.required') }]}
              >
                <Input placeholder={t('enter.english.name')} />
              </FormItem>
              </Grid.Col>
            </Grid.Row>

            <FormItem label={t('description.field')} field="desc">
              <Input.TextArea
                placeholder={t('enter.description')}
                maxLength={50}
                showWordLimit
              />
            </FormItem>
          </Form>

          <div className="logic-code-edit">
            <div className="logic-code-edit-header">
              <img src={codeViewTitleIcon} alt="icon" />
              {t('code.editor')} {/* "代码编辑" */}
            </div>
            <div className="logic-code-edit-content">
              <Input.TextArea
                placeholder={t('enter.code')} // "请输入代码"
                value={code}
                onChange={setCode}
                style={{ height: '100%' }}
              />
            </div>
          </div>
        </Spin>
        <div className='logic-drawer-footer'>
          <Button onClick={() => handleOk()} type="primary">
            {t('save')} {/* "保存" */}
          </Button>
        </div>
      </div>
    </Drawer>
  );
};

export default LogicDrawer;