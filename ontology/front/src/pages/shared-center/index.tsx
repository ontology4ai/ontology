import React, { useEffect, useRef, useState } from 'react';
import { Tabs, Typography } from '@arco-design/web-react';
import SharedObjectType from './pages/object-type';
import {
  IconDataResDirColor,
  IconBackupsShareColor,
  IconDataGovernanceColor,
  IconNetworkRouterColor,
  IconMgmtNodeColor,
} from 'modo-design/icon';
import './index.less';

const { TabPane } = Tabs;
const SharedCenter = () => {
  return (
    <div className="shared-center-container">
      <div className="shared-center-manager">
        <div className="shared-center-head">
          <div className="title-container">
            <span className="icon">
              <IconBackupsShareColor />
            </span>
            <span className="title">共享中心</span>
          </div>
        </div>
        <div className="shared-center-tab">
          <SharedObjectType />
        </div>
      </div>
    </div>
  );
};
export default SharedCenter;
