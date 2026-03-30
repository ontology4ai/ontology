import React, { useEffect, useState } from 'react';
import { Drawer, Button, Form, Select, Input, Radio, Message } from '@arco-design/web-react';
import './index.less';
import nameIcon from '../ObjectDrawer/assets/name-icon.svg';
import { objectTypeDetail } from '../ObjectDrawer/api';
import { linkTypeDetail, linkTypeSave } from './api';
import useForm from '@arco-design/web-react/es/Form/useForm';

const FormItem = Form.Item;
const Option = Select.Option;

interface RelationDrawerProps {
  visible: boolean;
  sourceId?: string;
  targetId?: string;
  sourceText?: string;
  onCancel: () => void;
  onOk: (data: any) => void;
}
const RelationDrawer: React.FC<RelationDrawerProps> = ({
  visible,
  sourceText,
  sourceId,
  targetId,
  onCancel,
  onOk,
}) => {
  const handleOk = async () => {
    try {
      const res = await linkTypeSave({
        ...form.getFieldsValue(),
        id: `${sourceId}_${targetId}`,
      });

      if (res.data.success) {
        onOk({
          text: form.getFieldValue('sourceTag'),
        });
        Message.success('保存成功');
      } else {
        Message.error('保存失败');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const [form] = useForm();

  const [formData, setFormData] = useState({});

  const [sourceObjectLabel, setSourceObjectLabel] = useState();
  const [targetObjectLabel, setTargetObjectLabel] = useState();

  const [sourceFields, setSourceFields] = useState([]);
  const [targetFields, setTargetFields] = useState([]);
  const getObjectDetail = async (id, setFields, setObjectLabel) => {
    try {
      const res = await objectTypeDetail({ id });

      const { success, data } = res.data;

      if (success) {
        setFields(data.column);
        setObjectLabel(data.info.label);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getData = async () => {
    try {
      const res = await linkTypeDetail({
        sourceId,
        targetId,
      });

      const { success, data } = res.data;
      if (success) {
        form.setFieldsValue({
          ...form.getFieldsValue(),
          ...(data || {}),
          sourceTag: sourceText,
          sourceType: data?.sourceType || 'One',
          targetType: data?.targetType || 'One',
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (visible) {
      getObjectDetail(sourceId, setSourceFields, setSourceObjectLabel);
      getObjectDetail(targetId, setTargetFields, setTargetObjectLabel);

      if (sourceId && targetId) {
        getData();
      }
    } else {
      form.resetFields();
    }
  }, [visible]);

  // useEffect(() => {
  //   setFormData({
  //     ...formData,
  //     ...form.getFieldsValue(),
  //   });
  // }, [form.getFieldsValue()]);

  return (
    <Drawer
      getPopupContainer={() => {
        return document.querySelector('.screen-content') || document.body;
      }}
      width="50%"
      title="编辑关系"
      visible={visible}
      footer={
        <Button className="object-drawer-footer-ok" onClick={() => handleOk()} type="primary">
          保存
        </Button>
      }
      onOk={() => {
        handleOk();
      }}
      onCancel={() => {
        onCancel();
      }}
      className="relation-drawer"
    >
      <div className="relation-drawer-content">
        <div className="relation-drawer-content__left">
          <div className="relation-drawer-content-title">
            <img src={nameIcon} />
            {sourceObjectLabel || ''}
          </div>
          <Form layout="vertical" form={form} onValuesChange={(v, vs) => {
            console.log(vs)
            setFormData({
              ...formData,
              ...vs
            })
          }}>
            <FormItem field="sourceTag" label="关系标签">
              <Input placeholder="请输入" />
            </FormItem>
            <FormItem field="sourceType" label="关系标签">
              <Radio.Group>
                <Radio value="One">One</Radio>
                <Radio value="Many">Many</Radio>
              </Radio.Group>
            </FormItem>
            <FormItem field="sourceAttrId" label="主键">
              <Select
                getPopupContainer={node => {
                  return node;
                }}
                triggerProps={{
                  popupAlign: {
                    bottom: 20,
                  },
                }}
                placeholder="请选择"
              >
                {sourceFields?.map(item => {
                  return (
                    <Option key={item.id} value={item.id}>
                      {item.label}
                    </Option>
                  );
                })}
              </Select>
            </FormItem>
            <FormItem label="示例">
              <div className="relation-examplate">
                <div
                  className="relation-examplate-tag"
                  style={{
                    color: '#5A7CFF',
                    backgroundColor: '#5A7CFF' + '2A',
                    borderColor: '#5A7CFF',
                  }}
                >
                  {formData.sourceType === 'Many' ? '多个' : '一个'}
                </div>
                <div
                  className="relation-examplate-tag"
                  style={{
                    color: '#9E63FF',
                    backgroundColor: '#9E63FF' + '2A',
                    borderColor: '#9E63FF',
                  }}
                >
                  {sourceObjectLabel}
                </div>
                <div
                  className="relation-examplate-tag"
                  style={{
                    color: '#FBB571',
                    backgroundColor: '#FBB571' + '2A',
                    borderColor: '#FBB571',
                  }}
                >
                  {formData.sourceTag}
                </div>
                <div
                  className="relation-examplate-tag"
                  style={{
                    color: '#5A7CFF',
                    backgroundColor: '#5A7CFF' + '2A',
                    borderColor: '#5A7CFF',
                  }}
                >
                  {formData.targetType === 'Many' ? '多个' : '一个'}
                </div>
                <div
                  className="relation-examplate-tag"
                  style={{
                    color: '#9E63FF',
                    backgroundColor: '#9E63FF' + '2A',
                    borderColor: '#9E63FF',
                  }}
                >
                  {targetObjectLabel}
                </div>
              </div>
            </FormItem>
          </Form>
        </div>
        <div className="relation-drawer-content__right">
          <div className="relation-drawer-content-title">
            <img src={nameIcon} />
            {targetObjectLabel || ''}
          </div>
          <Form layout="vertical" form={form} onValuesChange={(v, vs) => {
            console.log(vs)
            setFormData({
              ...formData,
              ...vs
            })
          }}>
            <FormItem field="targetTag" label="关系标签">
              <Input placeholder="请输入" />
            </FormItem>
            <FormItem field="targetType" label="关系标签">
              <Radio.Group>
                <Radio value="One">One</Radio>
                <Radio value="Many">Many</Radio>
              </Radio.Group>
            </FormItem>
            <FormItem field="targetAttrId" label="外键">
              <Select
                getPopupContainer={node => {
                  return node;
                }}
                triggerProps={{
                  popupAlign: {
                    bottom: 20,
                  },
                }}
                placeholder="请选择"
              >
                {targetFields?.map(item => {
                  return (
                    <Option key={item.id} value={item.id}>
                      {item.label}
                    </Option>
                  );
                })}
              </Select>
            </FormItem>
            <FormItem label="示例">
              <div className="relation-examplate">
                <div className="relation-examplate">
                  <div
                    className="relation-examplate-tag"
                    style={{
                      color: '#5A7CFF',
                      backgroundColor: '#5A7CFF' + '2A',
                      borderColor: '#5A7CFF',
                    }}
                  >
                    {formData.targetType === 'Many' ? '多个' : '一个'}
                  </div>
                  <div
                    className="relation-examplate-tag"
                    style={{
                      color: '#9E63FF',
                      backgroundColor: '#9E63FF' + '2A',
                      borderColor: '#9E63FF',
                    }}
                  >
                    {targetObjectLabel}
                  </div>
                  <div
                    className="relation-examplate-tag"
                    style={{
                      color: '#FBB571',
                      backgroundColor: '#FBB571' + '2A',
                      borderColor: '#FBB571',
                    }}
                  >
                    {formData.targetTag}
                  </div>
                  <div
                    className="relation-examplate-tag"
                    style={{
                      color: '#5A7CFF',
                      backgroundColor: '#5A7CFF' + '2A',
                      borderColor: '#5A7CFF',
                    }}
                  >
                    {formData.sourceType === 'Many' ? '多个' : '一个'}
                  </div>
                  <div
                    className="relation-examplate-tag"
                    style={{
                      color: '#9E63FF',
                      backgroundColor: '#9E63FF' + '2A',
                      borderColor: '#9E63FF',
                    }}
                  >
                    {sourceObjectLabel}
                  </div>
                </div>
              </div>
            </FormItem>
          </Form>
        </div>
      </div>
    </Drawer>
  );
};

export default RelationDrawer;
