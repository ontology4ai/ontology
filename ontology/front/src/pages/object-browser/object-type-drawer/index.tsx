import { Button, Descriptions, Drawer, Empty, Spin } from '@arco-design/web-react';
import { Tag } from 'modo-design';
import { IconDataIntegrationColor, IconDataResDirColor } from 'modo-design/icon';
import React, { useEffect, useMemo, useState } from 'react';
import { getDetail } from '../api/index';
import ObjectTypeDetail from '../object-type-detail';
import { ObjectTypeItem } from '../type';
import emptyIcon from '@/pages/object/images/empty.svg';
import './style/index.less';

const ObjectTypeDrawer = ({
  visible,
  object,
  onClose,
  addTab,
}: {
  visible: boolean;
  object: ObjectTypeItem;
  onClose: () => void;
  addTab: (item: any) => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [attributes, setAttributes] = useState<any>([]);
  const [linkObjectTypes, setLinkObjectTypes] = useState<any>([]);
  const data = useMemo(
    () => [
      {
        label: '描述',
        value: object.objectTypeDesc || '暂无描述',
      },
      {
        label: '状态',
        value: (
          <div className={`status ${object.status ? 'enable' : 'disable'}`}>
            <div className="dot" />
            {object.status ? '启用' : '禁用'}
          </div>
        ),
      },
    ],
    [object],
  );
  const handleGetDetail = async () => {
    setLoading(true);
    const res = await getDetail({
      objectTypeId: object.id,
    });
    if (res.status === 200) {
      setAttributes(res.data.data.attributes);
      setLinkObjectTypes(res.data.data.linkObjectTypes);
    }
    setLoading(false);
  };
  useEffect(() => {
    if (visible) {
      handleGetDetail();
    }
  }, [visible]);
  const handleGoToDetail = () => {
    addTab({
      key: object.id,
      title: object.objectTypeLabel,
      view: <ObjectTypeDetail object={object} addTab={i => addTab(i)} />,
    });
    onClose();
  };
  return (
    <Drawer
      className="object-type-drawer"
      title={
        <div className="object-type-drawer-title">
          <IconDataResDirColor style={{ color: 'var(--color-primary-6)' }} />
          <span className="object-type-drawer-title-text">{object.objectTypeLabel}</span>
          <span className="object-type-drawer-title-desc">{object.ontology.ontologyLabel}</span>
        </div>
      }
      visible={visible}
      width={480}
      onOk={onClose}
      onCancel={onClose}
      footer={
        <Button size="mini" type="primary" onClick={() => handleGoToDetail()}>
          开始探索
        </Button>
      }
    >
      <Spin loading={loading} className="object-type-detail-spin">
        <div>
          <div className="object-type-view-title">基础信息</div>
          <Descriptions
            border
            data={data}
            size="small"
            column={1}
            labelStyle={{
              width: '88px',
            }}
          />
        </div>
        <div>
          <div className="object-type-view-title">属性</div>
          {attributes && attributes.length > 0 ? (
            attributes.map((item: any) => {
              return (
                <div className="attr-item item" key={item.id}>
                  <div className="label">
                    <IconDataIntegrationColor />
                    <span className="text">{item.attributeName}</span>
                  </div>
                  <div className="tag-group">
                    {item.isPrimaryKey ? (
                      <Tag size="small" effect="plain" color="arcoblue">
                        主键
                      </Tag>
                    ) : null}
                    {item.isTitle ? (
                      <Tag size="small" effect="plain" color="cyan">
                        标题
                      </Tag>
                    ) : null}
                  </div>
                </div>
              );
            })
          ) : (
            <Empty
              icon={
                <div
                  style={{
                    display: 'inline-flex',
                    width: 48,
                    height: 48,
                  }}
                >
                  <img src={emptyIcon} alt="暂无数据" />
                </div>
              }
            />
          )}
        </div>
        <div>
          <div className="object-type-view-title">关联对象类型</div>
          {linkObjectTypes && linkObjectTypes.length > 0 ? (
            linkObjectTypes.map((item: any) => {
              return (
                <div className="item" key={item.id}>
                  <div className="label">
                    <IconDataResDirColor />
                    <span className="text">{item.objectTypeLabel}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <Empty
              icon={
                <div
                  style={{
                    display: 'inline-flex',
                    width: 48,
                    height: 48,
                  }}
                >
                  <img src={emptyIcon} alt="暂无数据" />
                </div>
              }
            />
          )}
        </div>
      </Spin>
    </Drawer>
  );
};

export default ObjectTypeDrawer;
