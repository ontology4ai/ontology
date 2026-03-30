// CardItem.tsx
import React from 'react';
import { Tag } from '@arco-design/web-react';
import './style/card.less';
import { color } from 'd3';

interface CardItemProps {
  icon?: React.ReactNode; // 左侧图标，可选
  title?: React.ReactNode; // 中文名
  subtitle?: string; // 英文名
  tag?: number; // 标签类型
  updateTime?: string; // 更新时间
  className?: string;
}

const CardItem: React.FC<CardItemProps> = ({
  icon,
  title,
  subtitle,
  tag,
  updateTime,
  className = '',
}) => {
  const tagMap = {
    0: {
      text: '新增',
      color: 'green',
    },
    1: {
      text: '修改',
      color: 'blue',
    },
    2: {
      text: '发布',
      color: 'orange',
    },
    3: {
      text: '删除',
      color: 'red',
    },
  };

  return (
    <div className={`card-item ${className}`}>
      {icon && (
        <div className="card-item-left">
          <div className="card-icon">{icon}</div>
        </div>
      )}

      <div className="card-item-center">
        {title && <div className="card-title">{title}</div>}
        {subtitle && <div className="card-subtitle">{subtitle}</div>}
      </div>

      <div className="card-item-right">
        {tag !== undefined && tag !== null && (
          <div className="card-tag">
            <Tag color={tagMap[tag as keyof typeof tagMap].color}>
              {tagMap[tag as keyof typeof tagMap].text}
            </Tag>
          </div>
        )}
        {updateTime && <div className="card-update-time">更新时间：{updateTime}</div>}
      </div>
    </div>
  );
};

export default CardItem;
