import {Form, Input, Switch, Button, Message, Typography} from '@arco-design/web-react';
import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import CardTitle from '../components/card-title';
import ActionTypeOverviewGraph from './graph/index';
import ActionEditModal from './action-edit-modal';

import './style/index.less';
import {updateAction} from "@/pages/action-type-detail/api";
import {actionExists} from "@/pages/action-manager/api";

const FormItem = Form.Item;

interface ActionTypeOverviewProps {
  action: any;
  getData: () => void;
  ontology: any;
}
export interface ActionTypeOverviewRef {
  handleSave: (callback: (...args: any) => void) => Promise<void> | void;
}

const ActionTypeOverview = forwardRef<ActionTypeOverviewRef, ActionTypeOverviewProps>(
  ({ action, getData, ontology },ref) => {
  const { actionName,actionLabel, objectType, status, actionDesc } = action || {};
  const [form] = Form.useForm();
  const [editModalVisible, setEditModalVisible] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
      actionName,
      actionLabel,
      status: status === 1,
      actionDesc,
    });
  }, [action, form]);
    // 暴露 handleSave 方法
    useImperativeHandle(ref, () => ({
      handleSave: async (callback: (...args: any) => void) => {
        // 这里实现保存逻辑
        console.log('保存 ActionTypeOverview 的数据');
        // 实际保存逻辑
        try {
          await form.validate();
          const formData= form.getFieldsValue();
          const param = {
            ...action,
            ...formData,
            objectTypeId: action.objectType.id,
            ontologyId: action.ontology.id,
            status:formData.status?1:0
          };
          updateAction(action.id,param )
            .then((res: any) => {
              if (res.data.success) {
                Message.success('保存成功');
                typeof callback === 'function' && callback({ type:'updateTab',tabId: ontology.id,view:'action',tabName:param.actionLabel});
                getData();
              }
            }).catch(()=>{
            typeof callback === 'function' && callback(action.actionLabel);
          })
        } catch (error) {
          typeof callback === 'function' && callback(action.actionLabel);
        }
      },
    }));
  const handleEditSave = (values: any) => {
    console.log('保存的值:', values);
    // 这里可以调用API保存数据
    setEditModalVisible(false);
    getData();
  };
  return (
    <>
      <div className="action-type-overview">
        <div className="base-info">
          <div className="base-info-content">
            <CardTitle title="动作基础信息" />
            <Form form={form} layout="vertical" className="base-info-form">
              <div className="form-grid">
                <FormItem label="中文名称" field="actionLabel" rules={[{required: true, message: '请输入中文名称'},{
                  validator: async (val, callback) => {
                    const value = val?.trim();
                    if (!value|| value.length==0) {
                      callback('中文名必填');
                      return;
                    }
                    if (action.actionLabel == value) {
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
                    const res = await actionExists({
                      actionLabel: value,
                      ontologyId: ontology.id,
                    });
                    if (res.data && res.data.success) {
                      const { data } = res.data;
                      if (data && data.exists) {
                        callback(`${value}已存在`);
                      }
                    }
                    callback();
                  },
                },]}>
                  <Input placeholder="请输入中文名称" maxLength={100} showWordLimit/>
                </FormItem>
                <FormItem label="状态" field="status" triggerPropName="checked">
                  <Switch checkedText="启用" uncheckedText="禁用"/>
                </FormItem>
                <FormItem label="英文名称" field="actionName" rules={[{required: true}]}>
                  <Input placeholder="请输入英文名称" disabled maxLength={100} showWordLimit/>
                </FormItem>
                <FormItem label="执行目标" field="object">
                  <Typography.Text ellipsis={{ showTooltip: true }}>
                    {objectType.objectTypeLabel}
                  </Typography.Text>
                </FormItem>
                <FormItem label="描述" field="actionDesc">
                  <Input.TextArea
                    maxLength={200}
                    showWordLimit
                    style={{ height: '62px' }}
                    placeholder="请输入属性描述"
                  />
                </FormItem>

              </div>
            </Form>
          </div>
          {/*<div className="base-info-bottom">
            <Form form={form} layout="vertical" className="base-info-form">
              <div className="form-grid">
                <FormItem label="API" field="api">
                  <span>api_mysql_1 (api_mysql_1)</span>
                </FormItem>

              </div>
            </Form>
          </div>*/}
        </div>
        <div className="action-type-overview">
          <div className="overview-title">
            <CardTitle
              title="动作类型概览"
              actions={
                <Button
                  type="outline"
                  size="small"
                  onClick={() => {
                    setEditModalVisible(true);
                  }}
                >
                  编辑
                </Button>
              }
            />
          </div>
          <div className="overview-content">
            {action && <ActionTypeOverviewGraph action={action} />}
          </div>
        </div>
      </div>
      <ActionEditModal
        visible={editModalVisible}
        action={action}
        onCancel={() => setEditModalVisible(false)}
        onSuccess={handleEditSave}
      />
    </>
  );
});

export default ActionTypeOverview;
