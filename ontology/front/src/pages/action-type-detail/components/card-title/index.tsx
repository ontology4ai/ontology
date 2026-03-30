import React from 'react';
import './style/index.less';

interface CardTitleProps {
  title: string;
  actions?: React.ReactNode;
}
const CardTitle: React.FC<CardTitleProps> = ({ title, actions }) => {
  return (
    <div className="card-title">
      <div className="card-title-left">
        <div className="card-title-line" />
        {title}
      </div>
      {actions && <div className="card-title-right">{actions}</div>}
    </div>
  );
};

export default CardTitle;
