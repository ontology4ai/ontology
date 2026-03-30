import React from 'react';
import { Result, Button } from '@arco-design/web-react';

const NotFound = () => (
  <div
    className="unauthorized"
    style={{
      width: '100%',
      height: '100%',
      position: 'relative'
    }}>
    <Result
      style={{
        position: 'absolute',
        top: 'calc(50% - 70px)'
      }}
      status='404'
      subTitle='抱歉，未找到页面！'>
    </Result>
  </div>
);

export default NotFound;
