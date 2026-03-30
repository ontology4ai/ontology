import React, { useEffect, useRef, useState } from 'react';
import './index.less';
import { Button, Progress, Tag } from '@arco-design/web-react';
import Icon from './icon.svg';
import { IconExclamationCircle, IconSync } from '@arco-design/web-react/icon';

interface ProgressModalProps {
  fileName: string;
  onBack: () => void;
  statusLabel: string;
  progressPercent: number;
}
const ProgressModal: React.FC<ProgressModalProps> = ({
  fileName,
  onBack,
  statusLabel,
  progressPercent,
}) => {
  const [percent, setPercent] = useState(0);

  return (
    <div className="progress-modal-wrapper">
      <div className="progress-modal">
        <div className="progress-modal-header">
          <div className="progress-modal-header__top">
            <img className="progress-modal-icon" src={Icon} alt="" width={136} />
            <div className="progress-modal-title">正在构建本体</div>
            <Tag
              color={statusLabel === '排队中' ? 'orange' : 'arcoblue'}
              bordered
              icon={statusLabel === '排队中' ? <IconExclamationCircle /> : <IconSync />}
            >
              {statusLabel}
            </Tag>
          </div>
          <div className="progress-modal-header__bottom">
            <div className="progress-modal-file">
              <div className="progress-modal-file-label">正在解析：</div>
              <div className="progress-modal-file-name" title={fileName}>
                {fileName}
              </div>
            </div>
            <div className="progress-modal-remark">
              正在解析并生成本体关系。当前本体已锁定，您可以返回本体列表处理其他任务。
            </div>
          </div>
        </div>
        <div className="progress-modal-main">
          <Progress percent={progressPercent} />
        </div>
        <div className="progress-modal-footer">
          <Button type="primary" onClick={onBack}>
            返回本体列表
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProgressModal;
