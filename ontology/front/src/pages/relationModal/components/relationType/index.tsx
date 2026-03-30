import React, { useEffect, useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { connect } from 'react-redux';
import useLocale from 'modo-plugin-common/src/utils/useLocale';
import {
  Form,
  Select,
  Input,
  Message,
  Empty,
  Pagination,
  Table,
  Tag,
  TableColumnProps,
  Tooltip,
  Spin,
  Radio,
  Typography,
  List,
  Space,
} from '@arco-design/web-react';
import i18n from '../../locale';

import linkImg1 from '@/pages/relationModal/images/linkImg1.svg';
import linkImg2 from '@/pages/relationModal/images/linkImg2.svg';
import linkImg3 from '@/pages/relationModal/images/linkImg3.svg';
import linkImg4 from '@/pages/relationModal/images/linkImg4.svg';

import './index.less';
import { IconKeyColor, IconDataDirColor, IconDataResDirColor } from 'modo-design/icon';

const source = forwardRef((props, ref) => {
  const t = useLocale();
  const loginT = useLocale(i18n);
  const [linkType, setLinkType] = useState(1);

  useEffect(() => {}, []);

  useImperativeHandle(ref, () => ({
    linkType,
  }));

  // 定义单项配置
  const getCardConfig = (item: number) => {
    switch (item) {
      case 1:
        return {
          icon: <IconKeyColor />,
          title: '对象类型外键关联',
          description: '使用外键方式链接对象类型的属性，适用"一对一"和"一对多"的关系类型',
          image: linkImg1,
        };
      case 2:
        return {
          icon: <IconDataDirColor />,
          title: '中间数据集关联',
          description: '使用字段包含对象类型主键列的数据集来链接对象类型，适用"多对多"的关系类型',
          image: linkImg2,
        };
      case 3:
        return {
          icon: <IconDataResDirColor />,
          title: '中间对象类型关联',
          description:
            '使用第三个对象类型的属性来描述两个对象类型链接的元数据，适用"一对一"和"一对多"的关系类型',
          image: linkImg3,
        };
      case 4:
        return {
          icon: <IconDataResDirColor />,
          title: '语义关联',
          description: '仅是使用纯语义描述来链接对象类型，适用于无明确数据可关联场景',
          image: linkImg4,
        };
      default:
        return {
          icon: <IconKeyColor />,
          title: '对象类型外键关联',
          description: '使用外键方式链接对象类型的属性，适用"一对一"和"一对多"的关系类型',
          image: linkImg1,
        };
    }
  };

  // 渲染单个卡片组件
  const renderCardContent = (item: number) => {
    const config = getCardConfig(item);

    return (
      <div className="custom-radio-card-content">
        <div className="custom-radio-card-icon">{config.icon}</div>
        <div className="custom-radio-card-title">{config.title}</div>
        <Typography.Text type="secondary">{config.description}</Typography.Text>
        <img src={config.image} alt="" />
      </div>
    );
  };

  return (
    <div className="relation-type-container" style={{ display: props.isShow ? 'flex' : 'none' }}>
      <Radio.Group name="card-radio-group" value={linkType} onChange={setLinkType}>
        {[1, 2].map(item => {
          return (
            <Radio key={item} value={item}>
              {({ checked }) => {
                return (
                  <div
                    className={`custom-radio-card ${checked ? 'custom-radio-card-checked' : ''}`}
                  >
                    <div className="custom-radio-card-mask"></div>
                    {renderCardContent(item)}
                  </div>
                );
              }}
            </Radio>
          );
        })}
      </Radio.Group>
    </div>
  );
});

export default source;
