import { Modal, Tabs, Tag } from '@arco-design/web-react';
import { IconInformationColor, IconCounterColor } from 'modo-design/icon';
import React, { useState } from 'react';
import './style/attr-impact-analysis-modal.less';

const { TabPane } = Tabs;
const AttrImpactAnalysisModal = ({ title, onCancel, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('object');
  const [counts, setCounts] = useState({
    object: 0,
    content: 0,
  });
  const tagMap = {
    0: {
      text: '新增',
      color: 'blue',
    },
    1: {
      text: '修改',
      color: 'cyan',
    },
    2: {
      text: '删除',
      color: 'gold',
    },
  };
  const resetAllData = () => {};
  return (
    <div>
      <Modal
        title={title || '属性变更'}
        visible
        onOk={() => onSuccess()}
        onCancel={() => onCancel()}
        className="impact-analysis-modal"
      >
        <div className="tips">
          <IconInformationColor className="icon" />
          <div className="text">
            保存后属性的变更后将同步为下游对象进行属性的增、删、改，其中新增属性时，将自动为继承对象创建一个同名属性，删除的属性在下游对象中将转变为自定义扩展属性，避免直接删除导致业务报错。
          </div>
        </div>
        <Tabs
          defaultActiveTab="content"
          onChange={key => {
            setActiveTab(key);
            resetAllData();
          }}
        >
          <TabPane key="content" title={<>变更内容（{counts.content}）</>}>
            <div
              style={{
                height: '300px',
                overflowY: 'auto',
                paddingRight: '10px',
              }}
            >
              <div className="attr-card card">
                <div className="title">
                  <div className="icon">
                    <IconCounterColor />
                  </div>
                  <div className="label">属性中文名</div>
                  <div className="name">属性英文名</div>
                  <div className="tag">
                    <Tag color={tagMap[0].color}>{tagMap[0].text}</Tag>
                    {/* <Tag color={tagMap[tag as keyof typeof tagMap].color}>
                      {tagMap[tag as keyof typeof tagMap].text}
                    </Tag> */}
                  </div>
                </div>
              </div>
              <div className="bottom">
                <span className="label">修改前</span>
                <span className="text">中文名 英文名</span>
              </div>
            </div>
          </TabPane>
          <TabPane key="object" title={<>影响对象（{counts.object}）</>}>
            <div
              style={{
                height: '300px',
                overflowY: 'auto',
                paddingRight: '10px',
              }}
            >
              <div className="card">
                <div className="icon">
                  <IconCounterColor />
                </div>
                <div className="label">对象中文名</div>
              </div>
            </div>
          </TabPane>
        </Tabs>
      </Modal>
    </div>
  );
};

export default AttrImpactAnalysisModal;
