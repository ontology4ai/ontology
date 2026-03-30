import React, { useEffect, useRef, useState } from 'react';
import './index.less';
import { Tabs, Tag } from '@arco-design/web-react';
import Object from './object';
import Relation from './relation';
import Logic from './logic';
import Action from './action';
import Interface from './interface';

const { TabPane } = Tabs;

interface TaskRecordDetailProps {
  taskId: string;
  resourceInfo: {
    object?: number;
    link?: number;
    logic?: number;
    action?: number;
    interface?: number;
  };
}
const TaskRecordDetail: React.FC<TaskRecordDetailProps> = ({ taskId, resourceInfo }) => {
  return (
    <div className="task-record-detail">
      <Tabs defaultActiveTab="1">
        <TabPane
          key="1"
          title={
            <div>
              对象{' '}
              <Tag size="small" style={{ marginLeft: '4px' }}>
                {resourceInfo.object}
              </Tag>
            </div>
          }
        >
          <Object taskId={taskId} />
        </TabPane>
        <TabPane
          key="2"
          title={
            <div>
              关系{' '}
              <Tag size="small" style={{ marginLeft: '4px' }}>
                {resourceInfo.link}
              </Tag>
            </div>
          }
        >
          <Relation taskId={taskId} />
        </TabPane>
        <TabPane
          key="3"
          title={
            <div>
              逻辑{' '}
              <Tag size="small" style={{ marginLeft: '4px' }}>
                {resourceInfo.logic}
              </Tag>
            </div>
          }
        >
          <Logic taskId={taskId} />
        </TabPane>
        <TabPane
          key="4"
          title={
            <div>
              动作{' '}
              <Tag size="small" style={{ marginLeft: '4px' }}>
                {resourceInfo.action}
              </Tag>
            </div>
          }
        >
          <Action taskId={taskId} />
        </TabPane>
        <TabPane
          key="5"
          title={
            <div>
              接口{' '}
              <Tag size="small" style={{ marginLeft: '4px' }}>
                {resourceInfo.interface}
              </Tag>
            </div>
          }
        >
          <Interface taskId={taskId} />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default TaskRecordDetail;
