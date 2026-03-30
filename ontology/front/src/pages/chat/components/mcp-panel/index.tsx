import React, { useState } from 'react';
import {Card, Space, Spin, Typography,Divider,Tag} from '@arco-design/web-react';
import {  } from '@arco-design/web-react/icon';

import {IconDockerHubColor,IconArrowDown,IconArrowUp} from "modo-design/icon";
import './index.less';
// 格式化解析后的JSON对象为字符串
function formatJson(jsonString:string) {
   // return jsonString;
    try {
        const parsed = JSON.parse(jsonString);
        return JSON.stringify(parsed, null, 2); // 第三个参数"2"指两个空格缩进
    } catch (e) {
        return jsonString; // 解析失败则返回原始内容
    }
}
const CustomCollapsePanel = (props) => {
    const data = props.data;
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    const renderHeader = (data) => (
      <div className="panel-header" onClick={toggleExpand}>
          <div className='tool-name'>
              {data.status=='end'?<IconDockerHubColor size={16} className="header-icon" />:<Spin size={16} className="header-icon" />}
              <Typography.Text>{data.status == 'end'?'已使用 ':'正在使用 '}{data.tool}</Typography.Text>
          </div>
          <div className="header-extra">
              {data.runningLabel && data.runningType && <Tag bordered  className={`mcp-tag ${data.runningType}`}>{data.runningLabel||'NULL'}</Tag>}
              {isExpanded ? <IconArrowUp /> : <IconArrowDown />}
          </div>
      </div>
    );

    const renderContent = (data) => (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {data.input && <div className="content-section">
              <div className="content-header">
                  <span className="dot"/>
                  <span className="text">请求</span>
                  <Divider/>
              </div>

              <pre className="sql-code">{formatJson(data.input)}</pre>
          </div>}
          {data.output && <div className="content-section">
              <div className="content-header">
                  <span className="dot"/>
                  <span className="text">响应</span>
                  <Divider/>
              </div>
              <pre className="sql-code">{formatJson(data.output)}</pre>
          </div>}
      </Space>
    );

    return (
      <div className="custom-collapse-panel">
          <Card
            bordered={false}
            className={`collapse-card ${isExpanded ? 'expanded' : 'collapsed'}`}
            bodyStyle={{
                padding: 0,
                overflow: 'hidden'
            }}
          >
              {renderHeader(data)}

              {/* 不使用 Collapsible 组件，通过 CSS 控制显示/隐藏和动画 */}
              <div className={`content-wrapper ${isExpanded ? 'expanded' : 'collapsed'}`}>
                  <div className="content-inner">
                      {renderContent(data)}
                  </div>
              </div>
          </Card>
      </div>
    );
};

export default CustomCollapsePanel;
