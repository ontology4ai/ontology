import React, { useEffect, useState, useRef } from 'react';
import { Form, Drawer, Modal, Radio, Select, Tag, Spin } from '@arco-design/web-react';
import { IconDataResDirColor } from 'modo-design/icon';
import ObjectIcon from '@/components/ObjectIcon';
import ConstraintForm from './constraint-form';
import { overviewConstraint } from '@/pages/interface-overview/api';
const FormItem = Form.Item;

const ConstraintDetailDrawer = ({
  visible,
  onCancel,
  onSuccess,
  interfaceData,
  constraintData,
}) => {
  const [loading, setLoading] = useState(false);
  const [linkData, setLinkData] = useState([]);
  const formRef = useRef();
  const handleSave = () => {
    onSuccess();
  };
  const getData = () => {
    setLoading(true);
    overviewConstraint({
      constraintId: constraintData.id,
    })
      .then(res => {
        if (Array.isArray(res?.data?.data?.extendedLinkList)) {
          setLinkData(res?.data?.data?.extendedLinkList);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };
  useEffect(() => {
    if (constraintData && constraintData.id) {
      getData();
    }
  }, [constraintData]);
  return (
    <Drawer
      width={480}
      title={<span>接口关系约束详情</span>}
      visible={visible}
      okText="保存"
      onOk={() => {
        handleSave();
      }}
      onCancel={() => {
        onCancel();
      }}
      className="interface-constraint-detail-drawer"
    >
      <div className="label">基础信息</div>
      <ConstraintForm
        ref={formRef}
        initialValues={
          constraintData
            ? {
                constraintRelation: constraintData.constraintRelation,
                constraintType: constraintData.constraintType,
                objectTypeId: constraintData.objectTypeId,
              }
            : undefined
        }
        interfaceData={interfaceData}
      />
      <div className="label">继承关系</div>
      <Spin loading={loading} className="link-data">
        <div>
          {linkData.map(item => (
            <div>{/* <ObjectIcon icon={item.} /> */}</div>
          ))}
        </div>
      </Spin>
    </Drawer>
  );
};

export default ConstraintDetailDrawer;
