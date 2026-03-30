import React, { useRef, useState } from 'react';
import './index.less';
import CardIcon from '../images/card-icon.png';
import { Button, Tag, Badge, Dropdown, Menu, Checkbox } from '@arco-design/web-react';
import { IconMoreRow, IconTime } from 'modo-design/icon';
import UserIcon from '../images/user-icon.png';
import type { ItemProps } from '../index';

interface OntologySimulationCardProps {
  data: ItemProps; // 定义接收的数据类型
  selected: boolean;
  onSelectedChange: (id: string, checked: boolean) => void; // 选中状态改变时调用的回调函数
  onDelete: (id: string) => void;
}

const OntologySimulationCard: React.FC<OntologySimulationCardProps> = ({
  data,
  selected,
  onSelectedChange,
  onDelete,
}) => {
  const handleClickMenuItem = (key: string) => {
    switch (key) {
      case 'history':
        console.log('查看历史');
        break;
      case 'delete':
        onDelete(data.id);
        break;
      default:
        break;
    }
  };

  return (
    <div className="ontology-simulation-card">
      <div className="ontology-simulation-card-body">
        <div className="ontology-simulation-card-body__left">
          <Checkbox checked={selected} onChange={checked => onSelectedChange(data.id, checked)} />
        </div>
        <div className="ontology-simulation-card-body__right">
          <div className="ontology-simulation-card-body__right-top">
            <img src={CardIcon} alt="card-icon" height={44} width={44} />
            <div className="ontology-simulation-card-body__right-top-center">
              <div className="ontology-simulation-card-title" title={data.sceneLabel}>
                {data.sceneLabel}
              </div>
              <div className="ontology-simulation-card-subtitle" title={data.sceneName}>
                {data.sceneName}
              </div>
            </div>
            <Dropdown
              droplist={
                <Menu onClickMenuItem={handleClickMenuItem}>
                  <Menu.Item key="history" disabled>
                    历史
                  </Menu.Item>
                  <Menu.Item key="delete">删除</Menu.Item>
                </Menu>
              }
            >
              <Button type="outline">
                <IconMoreRow />
              </Button>
            </Dropdown>
          </div>
          <div className="ontology-simulation-card-body__right-center">
            {data.description || '--'}
          </div>
          <div className="ontology-simulation-card-body__right-bottom">
            <div className="ontology-simulation-card-body__right-bottom-item">
              <div className="ontology-simulation-card-body__right-bottom-item-label">来源本体</div>
              <div
                className="ontology-simulation-card-body__right-bottom-item-value"
                title={data.ontologyLabel}
              >
                {data.ontologyLabel || '--'}
              </div>
            </div>
            <div className="ontology-simulation-card-body__right-bottom-item">
              <div className="ontology-simulation-card-body__right-bottom-item-label">配置</div>
              <div className="ontology-simulation-card-body__right-bottom-item-value">
                {data.canvasId ? (
                  <Tag color="arcoblue" bordered>
                    已配置
                  </Tag>
                ) : (
                  <Tag bordered>未配置</Tag>
                )}
              </div>
            </div>
            <div className="ontology-simulation-card-body__right-bottom-item">
              <div className="ontology-simulation-card-body__right-bottom-item-label">状态</div>
              <div className="ontology-simulation-card-body__right-bottom-item-value">
                <Badge
                  status={data.status === 0 ? 'default' : 'success'}
                  text={data.status === 0 ? '禁用' : ' 启用'}
                ></Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="ontology-simulation-card-footer">
        <div className="ontology-simulation-card-footer__left">
          <img src={UserIcon} alt="user-icon" height={24} width={24} /> {data.ownerId || '--'}
        </div>
        <div className="ontology-simulation-card-footer__right">
          <IconTime /> {data.lastUpdate || '--'}
        </div>
      </div>
    </div>
  );
};

export default OntologySimulationCard;
