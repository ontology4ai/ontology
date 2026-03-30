import { getAllObject, saveAction } from '@/pages/action-modal/api/index';
import { Button, Form, Input, Message, Modal, Select, Space } from '@arco-design/web-react';
import type { FormInstance } from '@arco-design/web-react/es/Form';
import { IconDataResDirColor } from 'modo-design/icon';
import React, { useEffect, useRef, useState } from 'react';
import { actionExists } from '../api/index';
import { searchApi } from '@/pages/api-manager/api/index';
import './style/index.less';

const FormItem = Form.Item;
const { Option } = Select;

interface ApiActionModalProps {
  visible: boolean;
  ontologyId?: string;
  ontologyName?: string;
  onClose: () => void;
  afterCreated: (row: any) => void;
}
const ApiActionModal: React.FC<ApiActionModalProps> = ({
  visible,
  ontologyId,
  ontologyName,
  onClose,
  afterCreated,
}) => {
  const formRef = useRef<FormInstance>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [apiList, setApiList] = useState<any[]>([]);

  const rules = {
    logicTypeLabel: [
      {
        required: true,
        message: '请输入中文名称',
      },
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
          } else if (!chineseOrLetterRegex.test(value)) {
            cb('必须包含中文或字母');
            return;
          }
          cb();
        },
        trigger: ['onBlur', 'onSubmit'],
      },
      {
        trigger: ['onBlur', 'onSubmit'],
        validator: async (value: any, cb: (err?: string) => void) => {
          if (!value) {
            cb();
            return;
          }
          await actionExists({
            ontologyId,
            actionLabel: value,
          })
            .then(res => {
              if (res.data.data.exists) {
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
    ],
    logicTypeName: [
      {
        required: true,
        message: '请输入英文名称',
      },
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
        trigger: ['onBlur', 'onSubmit'],
      },
      {
        trigger: ['onBlur', 'onSubmit'],
        validator: async (value: any, cb: (err?: string) => void) => {
          if (!value) {
            cb();
            return;
          }
          await actionExists({
            ontologyId,
            actionName: value,
          })
            .then(res => {
              if (res.data.data.exists) {
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
    ],
    apiId: [
      {
        required: true,
        message: '请选择API',
      },
    ],
    ontologyId: [
      {
        required: true,
        message: '请选择本体',
      },
    ],
    objectTypeId: [
      {
        required: true,
        message: '请选择对象',
      }
    ],
  };

  const handleCreate = () => {
    setCreateLoading(true);
    formRef.current
      ?.validate()
      .then(() => {
        const values = formRef.current?.getFieldsValue();
        const params = { ...values, buildType: 'api', actionType: 'create' };
        if (ontologyId) {
          params.ontologyId = ontologyId;
        }
        return saveAction(params);
      })
      .then(res => {
        if (res?.data?.data) {
          Message.success('保存成功');
          afterCreated({ id: res.data.data.id, ...formRef.current?.getFieldsValue(), buildType: 'api' });
        }
      })
      .catch(() => {})
      .finally(() => {
        setCreateLoading(false);
      });
  };

  const [objList, setObjList] = useState([]);
  const getAllObjects = () => {
    getAllObject({ ontologyId }).then(res => {
      if (res.data.success) {
        const { data } = res.data;
        setObjList(data);
      }
    });
  };

  const handleGetApiList = () => {
    searchApi({}).then(res => {
      if (res.data.data) {
        setApiList(res.data.data);
      }
    });
  };

  useEffect(() => {
    if (visible) {
      getAllObjects();
      handleGetApiList();
    }
  }, [visible]);

  useEffect(() => {
    getAllObjects();
    handleGetApiList();
  }, []);

  return (
    <div>
      <Modal
        title={<div style={{ textAlign: 'left', fontWeight: 600 }}>基于API创建动作类型</div>}
        key={visible}
        visible={visible}
        onOk={() => {
          handleCreate();
        }}
        onCancel={() => {
          onClose();
        }}
        okText="创建"
        confirmLoading={createLoading}
        className="api-action-modal"
      >
        <Form layout="vertical" ref={formRef}>
          <FormItem label="执行对象" field="objectTypeId" rules={rules.objectTypeId}>
            <Select placeholder="请选一个对象类型">
              {objList.map(item => (
                <Option value={item.id} key={item.id}>
                  <Space size="mini">
                    <IconDataResDirColor />
                    {item.objectTypeLabel}
                  </Space>
                </Option>
              ))}
            </Select>
          </FormItem>
          <FormItem label="中文名称" field="actionLabel" rules={rules.logicTypeLabel}>
            <Input placeholder="请输入中文名称" maxLength={100} showWordLimit />
          </FormItem>
          <FormItem label="英文名称" field="actionName" rules={rules.logicTypeName}>
            <Input placeholder="请输入英文名称" maxLength={100} showWordLimit />
          </FormItem>
          <FormItem label="描述" field="actionDesc">
            <Input.TextArea
              placeholder="请输入描述"
              maxLength={200}
              showWordLimit
              style={{ height: '62px' }}
            />
          </FormItem>
          <FormItem label="API选择" field="apiId" rules={rules.apiId}>
            <Select placeholder="请选择API" showSearch>
              {apiList.map(item => (
                <Select.Option key={item.id} value={item.id}>
                  <IconDataResDirColor />
                  <span style={{ marginLeft: 8 }}>{item.apiName}</span>
                </Select.Option>
              ))}
            </Select>
          </FormItem>
        </Form>
      </Modal>
    </div>
  );
};

export default ApiActionModal;
