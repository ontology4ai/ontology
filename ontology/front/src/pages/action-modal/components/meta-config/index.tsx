import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { connect } from 'react-redux';
import useLocale from 'modo-plugin-common/src/utils/useLocale';
import {
  Form,
  Select,
  Input,
  Tag,
  Space,
  Dropdown,
  Button,
  Menu,
  Grid,
} from '@arco-design/web-react';
import i18n from '../../locale';

import { IconDataResDirColor, IconDown } from 'modo-design/icon';
import { actionExists } from '@/pages/action-manager/api';
import './index.less';
import ObjectIcon from '@/components/ObjectIcon';
const FormItem = Form.Item;
const { Option } = Select;

const icons = [
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

const metaConfig = (props, ref) => {
  const t = useLocale();
  const loginT = useLocale(i18n);
  const [iconOptions, setIconOptions] = useState(icons);
  const formRef = useRef();
  useImperativeHandle(ref, () => ({
    getMetaData,
    validate,
  }));
  useEffect(() => {
    formRef.current.setFieldValue('icon', 'IconUserColor-primary');
  }, []);
  const getMetaData = () => {
    const formData = formRef.current.getFieldsValue();
    return {
      ...formData,
      actionLabel:formData.actionLabel.trim(),
      actionName:formData.actionName.trim(),
    };
  };
  const validate = async () => {
    let valid = true;
    try {
      await formRef.current.validate();
    } catch (e) {
      valid = false;
    }
    return valid;
  };
  // 创建组件映射关系
  const componentMapping = {
    IconDataResDirColor: <IconDataResDirColor />,
  };

  // 获取目标组件类型
  const SelectedComponent = option => componentMapping[option];
  return (
    <div className="action-metaData-container" style={{ display: props.isShow ? 'block' : 'none' }}>
      <Form ref={formRef} autoComplete="off" layout="vertical" className="metaData-form">
        <FormItem label={loginT('动作类型名称和图标选择')} className="icon-name-form">
          <Grid.Row gutter={8}>
            <Grid.Col span={3}>
              <FormItem field="icon" rules={[{ required: true, message: '请选择图标' }]}>
                <Select dropdownMenuClassName="icon-select-container">
                  {iconOptions.map((option, index) => (
                    <Option key={index} value={option}>
                      <ObjectIcon icon={option} />
                    </Option>
                  ))}
                </Select>
              </FormItem>
            </Grid.Col>
            <Grid.Col span={21}>
              <FormItem
                field="actionLabel"
                rules={[
                  { required: true, message: '中文名必填' },
                  {
                    validator: async (val, callback) => {
                      const value = val?.trim();
                      if (!value|| value.length==0) {
                        callback('中文名必填');
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
                        ontologyId: props.ontologyId,
                      });
                      if (res.data && res.data.success) {
                        const { data } = res.data;
                        if (data && data.exists) {
                          callback(`${value}已存在`);
                        }
                      }
                      callback();
                    },
                  },
                ]}
              >
                <Input placeholder={loginT('请输入中文名称')} maxLength={100} showWordLimit/>
              </FormItem>
            </Grid.Col>
          </Grid.Row>
        </FormItem>
        <FormItem
          label="英文名称"
          field="actionName"
          rules={[
            {
              required: true,
              message: '请输入英文名称',
            },
            {
              validator: async (val: any, cb: (err?: string) => void) => {
                const value = val?.trim();
                if (!value || value.length==0) {
                  cb('请输入英文名称');
                  return;
                }
                /*// 仅支持英文校验
                if (!/^[A-Za-z0-9_]+$/.test(value)) {
                  cb('仅支持英文、下划线、数字');
                  return;
                }*/
                if (!/^(?=.*[a-zA-Z])[a-zA-Z0-9_]+$/.test(val)) {
                  cb('名称必须包含英文字母，且只能输入英文字母、数字和下划线');
                  return;
                }
                await actionExists({
                  ontologyId: props.ontologyId,
                  actionName: value,
                })
                  .then(res => {
                    if (res.data.data.exists) {
                      cb(`${value}已存在`);
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
          <Input placeholder="请输入英文名称" maxLength={100} showWordLimit/>
        </FormItem>
        <FormItem label="动作类型描述" field="actionDesc">
          <Input.TextArea
            placeholder={loginT('请输入')}
            maxLength={200}
            showWordLimit
            style={{ minHeight: 62 }}
          />
        </FormItem>
      </Form>
    </div>
  );
};

export default forwardRef(metaConfig);
