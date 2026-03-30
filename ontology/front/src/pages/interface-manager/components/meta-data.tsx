import ObjectIcon from '@/components/ObjectIcon';
import { Form, Grid, Input, Select, Switch } from '@arco-design/web-react';
import { IconInformationColor } from 'modo-design/icon';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import mapImg from './img/map.png';
import './style/meta-data.less';
import { checkExists } from '../api/index';
const FormItem = Form.Item;

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

const MetaData = (props, ref) => {
  const formRef = useRef();
  const [iconOptions, setIconOptions] = useState(icons);
  const [form] = Form.useForm();
  const rules = {
    label: [
      { required: true, message: '请输入中文名称' },
      {
        validator: async (value: any, cb: (err?: string) => void) => {
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
          const res = await checkExists({
            ontologyId: props.ontologyId,
            label: value,
            name: '',
          });
          if (res.data.success && res.data.data.exists) {
            cb('中文名称已存在');
          }
          cb();
        },
      },
    ],
    name: [
      { required: true, message: '请输入英文名称' },
      {
        validator: async (val, callback) => {
          if (!/^(?=.*[a-zA-Z])[a-zA-Z0-9_]+$/.test(val)) {
            callback('名称必须包含英文字母，且只能输入英文字母、数字和下划线');
            return;
          }
          callback();
        },
      },
      {
        validator: async (val, cb) => {
          if (!val) {
            cb();
            return;
          }
          const res = await checkExists({
            ontologyId: props.ontologyId,
            name: val,
            label: '',
          });
          if (res.data.success && res.data.data.exists) {
            cb('英文名称已存在');
          }
          cb();
        },
      },
    ],
  };
  useEffect(() => {
    if (props.initialData) {
      form.setFieldsValue(props.initialData);
    } else {
      form.resetFields();
    }
  }, [props.initialData, form]);
  useImperativeHandle(ref, () => ({
    getFormData: () => {
      const formData = formRef.current.getFieldsValue();
      return {
        ...formData,
        status: formData.status ? 1 : 0,
      };
    },
    validate: async () => {
      return await formRef.current.validate();
    },
  }));

  return (
    <div className="meta-data" style={{ display: props.isShow ? 'block' : 'none' }}>
      <Form
        form={form}
        ref={formRef}
        autoComplete="off"
        layout="vertical"
        className="meta-data-form"
      >
        <FormItem label="中文名称和图标选择" required className="icon-name-form">
          <Grid.Row gutter={8}>
            <Grid.Col span={5}>
              <FormItem
                field="icon"
                initialValue={iconOptions[0]}
                rules={[{ required: true, message: '请选择图标' }]}
              >
                <Select dropdownMenuClassName="icon-select-container">
                  {iconOptions.map((option, index) => (
                    <Select.Option key={index} value={option}>
                      <ObjectIcon icon={option} />
                    </Select.Option>
                  ))}
                </Select>
              </FormItem>
            </Grid.Col>
            <Grid.Col span={19}>
              <FormItem field="label" rules={rules.label} validateTrigger={['onBlur']}>
                <Input placeholder="请输入中文名称" maxLength={100} showWordLimit/>
              </FormItem>
            </Grid.Col>
          </Grid.Row>
        </FormItem>

        <FormItem label="英文名称" field="name" rules={rules.name} validateTrigger={['onBlur']}>
          <Input placeholder="请输入英文名称" maxLength={100} showWordLimit/>
        </FormItem>

        <FormItem label="描述" field="description">
          <Input.TextArea
            placeholder="请输入描述"
            maxLength={200}
            showWordLimit
            style={{ minHeight: 62 }}
          />
        </FormItem>

        <FormItem label="状态" field="status" initialValue triggerPropName="checked">
          <Switch />
        </FormItem>
      </Form>
      <div className="tips">
        <IconInformationColor className="icon" />
        <div className="text">
          接口是一种特殊的对象，仅定义语义概念，不依赖于数据源，不能直接实例化，必须通过继承接口的对象进行实例化。您可以基于抽象的接口进行对象开发，一旦某个对象继承了某个接口，它就会继承该接口的属性、关系、逻辑、动作。{' '}
        </div>
      </div>
      <img src={mapImg} alt="" style={{ width: '100%', height: '220px' }} />
    </div>
  );
};

export default forwardRef(MetaData);
