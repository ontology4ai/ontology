import React, { useState } from 'react';
import { Drawer, Button } from '@arco-design/web-react';
import './index.less';
import titleIcon from './assets/title-icon.svg';

interface TitleProps {
  children?: React.ReactNode;
  className?: string;
}

const Title: React.FC<TitleProps> = ({ children, className }) => {
  return (
    <div className={`title-component ${className || ''}`}>
      <img src={titleIcon} alt="icon" />
      <span className="title-content">{children}</span>
    </div>
  );
};

export default Title;
