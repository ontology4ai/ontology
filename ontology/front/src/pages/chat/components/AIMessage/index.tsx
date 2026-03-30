import React, { useState, useEffect, useRef } from 'react';
import { Button, Collapse, Typography, Space, Spin, Progress } from '@arco-design/web-react';
import { IconDown, IconRight, IconBulb } from '@arco-design/web-react/icon';
import MarkdownRender from '../MarkdownRender';
import ResultModal, { TestCaseManagerModalRef } from '../test-case-manager-modal/test-case-result';
import RunDetailModal from '../test-case-manager-modal/test-case-run-deatail';
import McpPanel from '../mcp-panel';
import { Message, TestCase } from '../../types';
import './index.less';

const { Text } = Typography;

interface AIMessageProps {
  message?: Message;
  onRunCase?: (testCase: TestCase[]) => void;
  siderOntologyData?: any;
  ontology?: any;
  afterReRunTestCase?:()=>void;
}
const AITestCaseResultCard = (props:any) => {
  const testCaseStatus = props.content;
 // const testCases = props.testCases;
  const sessionId = props.sessionId;
  const isBatch = testCaseStatus &&  testCaseStatus.total > 1;
  const { onRunCase } = props;
  const total = testCaseStatus.total;
  const isFinished = testCaseStatus.isFinished;
  const finished = testCaseStatus.finished||0;//testCases?.filter(testCase => testCase.status == 'completes') || [];
  const progress = isFinished? 100 : finished > 0 ? Math.floor(finished / total  * 100 ): 0;
  const [resultTableVisible, setResultTableVisible] = useState(false);
  const [runDetailVisible, setRunDetailVisible] = useState(false);
  const resultModalRef = useRef<TestCaseManagerModalRef>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const viewResutTable = () => {
    if (isBatch) {
      setResultTableVisible(true);
    } else {
      setRunDetailVisible(true);
    }
  }

  // 监听 isFinished 和 resultTableVisible，定时刷新
  useEffect(() => {
    // 清除之前的定时器
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    // 当 isFinished 为 false 且 resultTableVisible 为 true 时，开始定时刷新
    if (!isFinished && resultTableVisible && resultModalRef.current) {
      // 立即执行一次刷新
      resultModalRef.current.refresh();
      
      // 设置定时器，每3秒刷新一次（可根据需要调整间隔）
      refreshTimerRef.current = setInterval(() => {
        if (resultModalRef.current) {
          resultModalRef.current.refresh();
        }
      }, 3000);
    }

    // 组件卸载时清除定时器
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [isFinished, resultTableVisible]);

  return (
    <>
      <div className='test-res-card'>
        {isBatch ?
        <div className="res-text">
          正在进行批量CQ用例测试，已完成{finished}/{total}个。您可以点击测试报告查看本次批量测试详情与结果
        </div>:
        <div className="res-text">
          正在进行CQ用例测试，您可以点击详情按钮查看本次测试结果
        </div>}
        <div className="res-progress">
          <div className="progress-head">
            {
              isBatch ?
                <><div>批量测试执行中</div>
                  <Button type='outline' onClick={viewResutTable}>测试报告</Button>
                </>
                : <><div>测试执行中</div>
                  <Button type='outline' disabled={!isFinished} onClick={viewResutTable}>详情</Button>
                </>
            }
          </div>
          <div className="progress-content">

            <Typography.Text type="secondary" style={{ fontSize: '14px' }}>测试进度</Typography.Text>
            <Progress percent={progress} animation={progress!=100}/>


          </div>
        </div>
      </div>
      { isBatch &&
        <ResultModal
          ref={resultModalRef}
          visible={resultTableVisible}
          total={total}
          onClose={() => setResultTableVisible(false)}
          batchNum={sessionId}
          onRunCase={onRunCase}
          ontology={props.ontology}
          siderOntologyData={props.siderOntologyData}
          afterReRunTestCase={props.afterReRunTestCase}
        />}
      { 
        !isBatch && (
          <RunDetailModal 
            visible={runDetailVisible}
            onClose={() => setRunDetailVisible(false)}
            batchNum={sessionId}
            ontology={props.ontology}
            siderOntologyData={props.siderOntologyData}
          />
        )
      }

    </>)
}
const AIMessage: React.FC<AIMessageProps> = ({ message, onRunCase, siderOntologyData,ontology,afterReRunTestCase }) => {
  // 判断是否正在流式传输（用于显示光标）

  return (
    <div className="ai-message-container">
      {/* 1. 思考过程 (如果有内容) */}


      {/* 2. 正文回复 */}
      <div className="ai-content-body">
        {message && message.content ? message.content?.map((content: any) => {
          return content.type == 'answer' ? <MarkdownRender key={content.id} content={content.data} /> : content.type == 'mcp' ?
            <McpPanel key={content.id} data={content.data} /> : content.type == 'test-case-result' ? <AITestCaseResultCard key={content.id} sessionId={content.id} content={content} testCases={content.data} onRunCase={onRunCase} ontology={ontology} siderOntologyData={siderOntologyData} afterReRunTestCase={afterReRunTestCase}/> : ''
        }) : (
          /* 如果思考完了，正文还没开始（content为空），显示占位符 */
          message && message.status === 'streaming' && (
            <div style={{ color: '#86909c', fontStyle: 'italic', fontSize: 12 }}>正在生成回复...</div>
          )
        )}
      </div>
    </div>
  );
};

export default AIMessage;
