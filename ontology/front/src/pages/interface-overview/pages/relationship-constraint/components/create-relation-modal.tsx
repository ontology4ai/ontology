import { Message, Modal } from '@arco-design/web-react';
import React, { useRef } from 'react';
import { createConstraint } from '../../../api/index';
import './style/create-relation-modal.less';
import ConstraintForm from './constraint-form';
const CreateRelationModal = ({ interfaceData, onCancel, onSuccess }) => {
  const formRef = useRef();
  const handleSave = () => {
    const form = formRef.current.getForm();
    form.validate().then(values => {
      createConstraint({
        interfaceId: interfaceData.id,
        ...values,
      }).then(res => {
        Message.success('保存成功');
        onSuccess();
      });
    });
  };

  return (
    <div>
      <Modal
        title="创建一个接口关系约束"
        visible
        okText="创建"
        onOk={() => handleSave()}
        onCancel={() => onCancel()}
        className="create-relation-modal"
      >
        <ConstraintForm ref={formRef} interfaceData={interfaceData} />
      </Modal>
    </div>
  );
};

export default CreateRelationModal;
