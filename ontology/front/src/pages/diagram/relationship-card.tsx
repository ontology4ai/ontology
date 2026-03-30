import React from 'react';
import { IconUserColor, IconDataMapColor, IconCounterColor } from 'modo-design/icon';
import { Tag } from '@arco-design/web-react';
import right from './icons/right.svg';
import left from './icons/left.svg';
import to2 from './icons/1to2.svg';
import './style/relationship-card.less';

import ObjectIcon from "@/components/ObjectIcon";
import oneToOneIcon from "@/pages/link-manager/images/oToO.svg";
import oneToManyIcon from "@/pages/link-manager/images/oToM.svg";
import manyToManyIcon from "@/pages/link-manager/images/mToM.svg";
const GraphRelationshipCard = (props) => {
  const {data} = props;
  const attrlist = data?[data.source_attribute,data.target_attribute]:[];
  return (
    <div className="graph-relationship-card">
      <div className="header">
        <Tag className="tag">
          <ObjectIcon icon={data.source?.icon}/>
          {data.source?.data?.label}
        </Tag>
        {/*<img src={to2} alt="" />*/}
        <img
          src={
            data.cardinality === 'onetoone'
              ? oneToOneIcon
              : data.cardinality === 'onetomany'
              ? oneToManyIcon
              : manyToManyIcon
          }
        />
        <Tag className="tag">
          <ObjectIcon icon={data.target?.icon}/>
          {data.target?.data?.label}
        </Tag>
      </div>
      <div className="main">
        <div className="label">关联属性</div>
        <div className="content attr-list">
          {attrlist?.map(item => (
            <div key={item?.id} className="attr">
              <IconCounterColor />
              {item?.label||'--'}
            </div>
          ))}
        </div>
        {data.middle_dataset ?
          <>
            <div className="label">中间数据集</div>
            <div className="content">{data.middle_dataset}</div>
          </> : ''}
        <div className="label">
          <img src={right} alt="" />
          关系标签
        </div>
        <div className="content">
          {data.link_labels?.source_labels?.map(item => (
            <Tag>{item}</Tag>
          ))}
        </div>

        <div className="label">
          <img src={left} alt="" />
          关系标签
        </div>
        <div className="content">
          {data.link_labels?.target_labels?.map(item => (
            <Tag>{item}</Tag>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GraphRelationshipCard;
