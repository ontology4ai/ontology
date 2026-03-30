import { Tooltip } from '@arco-design/web-react';
import { IconQuestionCircleFill } from '@arco-design/web-react/icon';
import React from 'react';

export default (props: any) => (
  <div style={{ display: 'inline-flex', alignItems: 'center' }}>
    {props.children}
    <Tooltip mini content={props.titleTips}>
      <IconQuestionCircleFill
        style={{
          marginLeft: '-5px',
          fontSize: '14px',
          position: 'relative',
          cursor: 'pointer',
          ...(props.cunstomStyle ? props.cunstomStyle : {}),
        }}
      />
    </Tooltip>
  </div>
);