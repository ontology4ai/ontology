import React, { useState, useRef } from 'react';
import { Modal, Checkbox } from '@arco-design/web-react';
import { IconInformationColor } from 'modo-design/icon';
import ObjectTypeSelectTable from '../object-type-select-table';
import type { ObjectTypeSelectTableRef } from '../object-type-select-table';
import './style/index.less';
import { exportOntology } from '@/pages/ontology-manager/api';

const CheckboxGroup = Checkbox.Group;

interface ShareServiceModelProps {
  visible: boolean;
  ontology: any;
  onClose: () => void;
}

const ShareServiceModel: React.FC<ShareServiceModelProps> = ({ visible, ontology, onClose }) => {
  const objectTypeSelectTableRef = useRef<ObjectTypeSelectTableRef>(null);
  const exportOntologyFile = () => {
    const ontologyId = ontology.id;

    const { selectedRowKeys } = objectTypeSelectTableRef.current?.getChildData() || {
      selectedRowKeys: [],
    };

    exportOntology({
      ontologyId,
      objectTypeIdList: selectedRowKeys,
    }).then(res => {
      if (res.data) {
        const filename =
          res.headers['content-disposition']?.match(/filename="?(.+?)"?$/)?.[1] ||
          `${ontology.ontologyLabel}.ttl`;
        const blob = new Blob([res.data]);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    });
    onClose();
  };
  return (
    <div>
      <Modal
        title="导出RDF"
        visible={visible}
        onOk={() => {
          exportOntologyFile();
        }}
        onCancel={() => {
          onClose();
        }}
        className="share-service-model"
      >
        <div className="tips">
          <IconInformationColor className="icon" />
          <div className="text">
            您可以选择已启用的对象类型，系统会将与选中对象类型相关联的所有本体资源进行打包并导出为RDF文件。
          </div>
        </div>
        <ObjectTypeSelectTable ontologyId={ontology.id} ref={objectTypeSelectTableRef} />
      </Modal>
    </div>
  );
};

export default ShareServiceModel;
