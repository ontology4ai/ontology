import { Spin, Tabs } from '@arco-design/web-react';
import { IconDataResDirColor } from 'modo-design/icon';
import React, { useEffect, useRef, useState } from 'react';
import ObjectTypePreview from '../object-type-preview';
import { ObjectTypeItem } from '../type';
import Summary from './pages/summary';
import './style/index.less';
import './index.less';
const { TabPane } = Tabs;

interface ObjectTypeDetailProps {
  object: ObjectTypeItem;
  addTab?: (data: any) => void;
}

const ObjectTypeDetail: React.FC<ObjectTypeDetailProps> = ({ object,addTab }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('abstract');
  const tabRef = useRef();
  return (
    <>
      <Spin loading={loading} className="object-type-detail-spin">
        <div className="object-type-detail">
          <div className="object-type-detail-header">
            <IconDataResDirColor />
            <div className="name">{object.objectTypeLabel}</div>
            <div className="descr">{object.ontology?.ontologyLabel}</div>
          </div>
          <div className="object-type-detail-content">
            <Tabs ref={tabRef} activeTab={activeTab} onChange={setActiveTab}>
              <TabPane title="摘要" key="abstract">
                {activeTab === 'abstract' && <Summary object={object} setActiveTab={(tab)=>setActiveTab(tab)} addTab={addTab}/>}
              </TabPane>
              <TabPane title="数据预览" key="preview">
                {activeTab === 'preview' && <ObjectTypePreview object={object} />}
              </TabPane>
              <TabPane title="图谱查阅" key="graph" disabled>
                图谱查阅
              </TabPane>
            </Tabs>
          </div>
        </div>
      </Spin>
    </>
  );
};

export default ObjectTypeDetail;
