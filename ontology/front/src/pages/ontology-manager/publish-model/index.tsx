import React, { useState } from 'react';
import { Modal, Tabs } from '@arco-design/web-react';
import { IconDown, IconUp } from '@arco-design/web-react/icon';
import { IconInformationColor } from 'modo-design/icon';
import './style/index.less';
import PublishModelTabs from './publish-model-Tabs';

interface PublishModelProps {
  visible: boolean;
  ontologyList: Array<Object>;
  onClose: () => void;
  handlePublish?: () => void;
}

const PublishModel: React.FC<PublishModelProps> = ({
  visible,
  ontologyList,
  onClose,
  handlePublish,
}) => {
  const [collapseIds, setCollapseIds] = useState(
    ontologyList.filter((item, index) => index).map(item => item.id),
  );

  const onOk = () => {
    Modal.confirm({
      title: '发布本体',
      content:
        '您将对当前本体已启用资源进行统一发布，发布成功后将生成新的版本且不可回退，是否确认发布？',
      onOk: () => {
        handlePublish && handlePublish();
      },
    });
  };

  const collapse = ontology => {
    if (collapseIds.includes(ontology.id)) {
      setCollapseIds(collapseIds.filter(item => item !== ontology.id));
    } else {
      setCollapseIds([...collapseIds, ontology.id]);
    }
  };

  return (
    <div>
      <Modal
        title="本体发布"
        visible={visible}
        onOk={() => {
          onOk();
        }}
        onCancel={() => {
          onClose();
        }}
        className="publish-model"
      >
        <div className="tips">
          <IconInformationColor className="icon" />
          <div className="text">以下仅展示基于上一版本变更的内容，如首次发布则展示全量新增内容</div>
        </div>
        <div className="collapse">
          {ontologyList.map(item => {
            return (
              <div className="collapse-item" key={item.id}>
                <div className="collapse-item-header" onClick={() => collapse(item)}>
                  <div className="collapse-item-header-front">
                    <div className="collapse-item-header-front-mark"></div>
                    {item.ontologyLabel}
                    {/* <span className="collapse-item-header-front-subtitle">{item.ontologyName}</span> */}
                  </div>
                  <div>{collapseIds.includes(item.id) ? <IconDown /> : <IconUp />}</div>
                </div>

                {collapseIds.includes(item.id) ? null : (
                  <div className="collapse-item-content">
                    <PublishModelTabs ontologyId={item.id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
};

export default PublishModel;
