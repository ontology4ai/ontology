import { Button, Descriptions, Drawer, Empty, Spin } from '@arco-design/web-react';
import { Tag } from 'modo-design';
import { IconDataIntegrationColor, IconDataResDirColor } from 'modo-design/icon';
import React, { useEffect, useMemo, useState } from 'react';
import { centerTypeExplorDetail } from '../../api';
import { ObjectTypeItem } from '@/pages/object-browser/type';
import emptyIcon from '@/pages/object/images/empty.svg';
import './style/index.less';

const ObjectTypeDrawer = ({
  visible,
  object,
  onClose,
}: {
  visible: boolean;
  object: ObjectTypeItem;
  onClose: () => void;
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
    ],
    [object],
  );
  const handleGetDetail = async () => {
    setLoading(true);

    try {
      const res = await centerTypeExplorDetail({
        objectTypeId: object.id,
      });
      if (res.status === 200) {
        setAttributes(res.data.data.attributeList);
        setLinkObjectTypes(res.data.data.linkObjectTypes);
      }
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };
  useEffect(() => {
    if (visible) {
      handleGetDetail();
    }
  }, [visible]);

  return (
    <Drawer
      className="object-type-drawer"
      title={
        <div className="object-type-drawer-title">
          <IconDataResDirColor style={{ color: 'var(--color-primary-6)' }} />
          <span className="object-type-drawer-title-text">{object.objectTypeLabel}</span>
        </div>
      }
      visible={visible}
      width={480}
      footer={null}
      onCancel={onClose}
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
      </Spin>
    </Drawer>
  );
};

export default ObjectTypeDrawer;
