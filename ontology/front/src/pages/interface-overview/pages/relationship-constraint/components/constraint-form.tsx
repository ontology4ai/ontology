import ObjectIcon from '@/components/ObjectIcon';
import { getData } from '@/pages/obj-manager/api/index';
import { Form, Radio, Select, Spin, Tag } from '@arco-design/web-react';
import { IconDataResDirColor } from 'modo-design/icon';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import './style/constraint-form.less';
const FormItem = Form.Item;

const ConstraintForm = forwardRef((props, ref) => {
  const { interfaceData, initialValues } = props;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [objList, setObjList] = useState([]);
  const [objectTypeLabel, setObjectTypeLabel] = useState('对象类型名称');
  const numberValue = Form.useWatch('constraintRelation', form);
  const objectTypeId = Form.useWatch('objectTypeId', form);

  const getObjectList = () => {
    setLoading(true);
    getData({
      ontologyId: interfaceData.ontologyId,
      status: 1,
      page: 1,
      pageSize: 9999,
    })
      .then(res => {
        if (Array.isArray(res?.data?.data?.content)) {
          setObjList(res?.data?.data?.content);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [form, initialValues]);

  useEffect(() => {
    getObjectList();
  }, []);

  useEffect(() => {
    const selectedType = objList.find((type: any) => type.id === objectTypeId);
    setObjectTypeLabel(selectedType ? selectedType.objectTypeLabel : '对象类型名称');
  }, [objectTypeId, objList]);

  useImperativeHandle(ref, () => ({
    getForm: () => form,
  }));
  return (
    <Spin loading={loading} className="interface-constraint-form-spin">
      <Form
        autoComplete="off"
        layout="vertical"
        form={form}
        initialValues={{
          constraintType: 1,
          constraintRelation: '1To1',
        }}
        className="interface-constraint-form"
      >
        <FormItem
          label={
            <div className="form-label">
              <span className="label">选择关系约束类型</span>
              <span className="desc">选择将此接口与对象或者另一个接口关联</span>
            </div>
          }
          field="constraintType"
        >
          <Radio.Group onChange={() => {}}>
            <Radio disabled value={0}>
              接口
            </Radio>
            <Radio value={1}>对象</Radio>
          </Radio.Group>
        </FormItem>
        <FormItem
          label={
            <div className="form-label">
              <span className="label">选择连接目标</span>
              <span className="desc">选择一个对象或接口</span>
            </div>
          }
          field="objectTypeId"
          rules={[{ required: true, message: '请选择连接目标' }]}
        >
          <Select placeholder="请选择">
            {(objList || []).map((item: any) => (
              <Select.Option key={item.id} value={item.id}>
                {item.objectTypeLabel}
              </Select.Option>
            ))}
          </Select>
        </FormItem>
        <FormItem
          label={
            <div className="form-label">
              <span className="label">设置关系基数</span>
              <span className="desc">设置此接口与连接目标的对应基数</span>
            </div>
          }
          field="constraintRelation"
        >
          <Radio.Group onChange={() => {}}>
            <Radio value="1To1">ONE</Radio>
            <Radio value="1ToN">MANY</Radio>
          </Radio.Group>
        </FormItem>
        <FormItem
          label={
            <div className="form-label">
              <span className="label">示例</span>
            </div>
          }
        >
          <div className="example">
            <Tag>one</Tag>
            <Tag className="primary-tag">
              <div className="interface-name">
                <div className="interface-icon">
                  <ObjectIcon icon={interfaceData.icon || ''} />
                </div>
                <span className="text">{interfaceData.label}</span>
              </div>
            </Tag>
            <Tag>{numberValue === '1To1' ? 'has one' : 'has many'}</Tag>
            <Tag className="primary-tag">
              <IconDataResDirColor />
              <span className="text">{objectTypeLabel}</span>
            </Tag>
          </div>
        </FormItem>
      </Form>
    </Spin>
  );
});

export default ConstraintForm;
