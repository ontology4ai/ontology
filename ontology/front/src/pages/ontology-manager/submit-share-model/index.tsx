import React, { useEffect, useRef, useState } from 'react';
import { Modal, Tabs, TreeSelect, Message } from '@arco-design/web-react';
import { IconInformationColor } from 'modo-design/icon';
import ObjectTypeSelectTable from '../object-type-select-table';
import type { ObjectTypeSelectTableRef } from '../object-type-select-table';
import './style/index.less';
import { centerSearch } from '@/pages/shared-center/api';
import { centerSyncObjectTypes } from '../api';

const { TabPane } = Tabs;

interface SubmitShareModelProps {
  visible: boolean;
  ontology: any;
  onClose: () => void;
}

const SubmitShareModel: React.FC<SubmitShareModelProps> = ({ visible, ontology, onClose }) => {
  const [objectNum, setObjectNum] = useState(0);
  const [treeData, setTreeData] = useState([]);
  const [centerId, setCenterId] = useState('');
  const objectTypeSelectTableRef = useRef<ObjectTypeSelectTableRef>(null);
  const handleObjectNumChange = (total: number) => {
    setObjectNum(total);
  };

  const getTreeData = async () => {
    try {
      const res = await centerSearch({ parentId: 'root' });

      setTreeData(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getTreeData();
  }, []);

  const submitShareCenter = async () => {
    const { selectedRowKeys } = objectTypeSelectTableRef.current?.getChildData() || {
      selectedRowKeys: [],
    };
    if (!selectedRowKeys.length) {
      Message.warning('请选择要分享的对象类型');
      return;
    }
    try {
      const res = await centerSyncObjectTypes({
        centerId,
        typeIdList: selectedRowKeys,
      });

      if (res.data.success) {
        Message.success('提交成功');
        onClose();
      } else {
        Message.error(res.data.message || '提交失败');
      }
    } catch (error) {
      Message.error('提交失败');
      console.error(error);
    }
  };

  return (
    <div>
      <Modal
        title="提交至共享中心"
        visible={visible}
        onOk={submitShareCenter}
        onCancel={() => {
          onClose();
        }}
        className="submit-share-model"
      >
        <div className="tips">
          <IconInformationColor className="icon" />
          <div className="text">
            您可以选择当前本体的对象类型，将其提交至共享中心，以便其他本体场景进行复用（仅共享元数据信息，不关联数据集合）。
          </div>
        </div>
        <div className="label">选择挂载目录</div>
        <TreeSelect
          onChange={setCenterId}
          treeData={treeData}
          placeholder="请选择目录"
          fieldNames={{ key: 'id', title: 'centerName' }}
        />
        <div className="label">
          选择共享内容<span className="desc">您可以共享本体下的资源，也可以共享本体场景</span>
        </div>
        <Tabs defaultActiveTab="object" className="share-model">
          <TabPane
            key="object"
            title={
              <>
                <div>对象 {objectNum}</div>
              </>
            }
          >
            <ObjectTypeSelectTable
              ref={objectTypeSelectTableRef}
              ontologyId={ontology.id}
              onTotalChange={handleObjectNumChange}
              pageSize={5}
            />
          </TabPane>
          <TabPane disabled key="attribute" title={<>属性 0</>}></TabPane>
          <TabPane disabled key="link" title={<>关系标签 0</>}></TabPane>
        </Tabs>
      </Modal>
    </div>
  );
};

export default SubmitShareModel;
