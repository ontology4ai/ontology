import React, { useState, useEffect, useRef } from 'react';
import { 
  Modal, 
  Spin, Message as ArcoMessage, Typography ,Divider
} from '@arco-design/web-react';
import {  
} from '@arco-design/web-react/icon';
import { TestCase, Message } from '../../types'; 
import './index.less'; 
import GraphPanel from '@/pages/chat_new/components/GraphPanel';
import AIMessage from '@/pages/chat_new/components/AIMessage'; 
import {IconDataDirColor} from 'modo-design/icon';
import {compareResult,batchTestCaseList,getSessionHistory,getGraph} from '@/pages/chat_new/api'

interface TestCaseDetailModalProps {
  visible: boolean;
  onClose: () => void; 
  siderOntologyData?:any;
  detailInfo?:any;
  batchNum?:string;
  ontology?:any;
}
 

const TestCaseRunDetailModal: React.FC<TestCaseDetailModalProps> = ({
  visible,
  onClose, 
  detailInfo,
  batchNum,
  siderOntologyData,
  ontology
}) => {
  // --- 本地状态 ---
  const [msg, setMsg] = useState<Message>({}); 
  const [loading,setLoading] = useState(false);
  //const [lastExecDetail,setLastExecDetail] = useState('');
  const [compareDetail,setCompareDetail] = useState(null);
    // Ref
    const graphRef = useRef<any>(null);

  // 初始化
  useEffect(() => {
    if (visible) {
        if(batchNum && !detailInfo){
            getBatchTaskList()
        } else if(detailInfo){
          setCompareDetail(detailInfo);
        }
    }
  }, [visible,batchNum,detailInfo]); 
  useEffect(()=>{
    if(visible && compareDetail){
      compareDetail.conversationId && getHisChatAndGraphData(compareDetail.conversationId)
    }
  },[visible,compareDetail])
 

  const getBatchTaskList =()=>{
    batchTestCaseList({
        batchNum,
        page:1,
        limit:1
    }).then(res=>{
        if(res.data.success){
            if( res.data.data && res.data.data.content){
                const data = res.data.data.content;
                data.length==1 && setCompareDetail(data[0]);
            }
        }
    })
  } 
  //  const getCompareResult = ()=>{
  //   compareResult({id:detailInfoId}).then(res=>{
  //       if(res.data.success){
  //           debugger
  //           setLastExecDetail(res.data.data?.lastExecDetail||'');
  //       }
  //   })
  //  }
   

  const getHisChatAndGraphData = async (conversationId) => {
    setLoading(true);
    const messages = await getSessionHis(conversationId);
    const taskGraphData = await getSessionGraphData(conversationId);
    messages && messages.length > 0 && setMsg(messages[0]);
    if (taskGraphData && taskGraphData.length > 0 ) {
        taskGraphData[0].graph && graphRef.current && graphRef.current.updateGraph(taskGraphData[0].graph);
    }
    setLoading(false);
  };

const getSessionHis = (conversationId)=>{
  return new Promise((resolve)=>{ 
      getSessionHistory({
          ontologyName:ontology.ontologyName,
          conversationId: conversationId,
          limit: 100
      }).then(res=>{
          if(res.data.status == 'success'){
              const data = res.data?.data?.data||[];//mockHistory;
              const messages:Message[]  = [];
              data.forEach(item=>{
                  if(item.answer){
                      const content:any=[];
                      item.agent_thoughts.forEach(a=>{
                          if(a.thought && a.thought.length>0){
                              content.push({
                                  id:`answer-${a.id}`,
                                  type:'answer',
                                  data:a.thought
                              })
                          }
                          if(a.tool){
                              const input = a.tool_input;//JSON.parse(a.tool_input)[a.tool];
                              const output = a.observation;//JSON.parse(a.observation)[a.tool];
                              content.push({
                                  id:`mcp-${a.id}`,
                                  type:'mcp',
                                  data:{
                                      tool:a.tool,
                                      input:input||'',
                                      output:output||'',
                                      runningType:a.running_type,
                                      runningLabel:a.running_label,
                                      status:'end'
                                  }
                              })
                          }
                      });
                      messages.push({
                          id:item.id,
                          content:content,
                          role:'ai',
                          status:'completed'
                      })
                  }
              });
              resolve(messages);

              
          }else{
              resolve([])
          }
      }).catch(err=>{
          resolve([])
      })
  })
};
 
const getSessionGraphData = (conversationId: string) => {
  return new Promise((resolve)=>{
      getGraph({conversationId: conversationId}).then(res=>{
          if(res.data.success){
              resolve(res.data.data);
          }else{
              resolve([])
          }
      }).catch(err=>{
          resolve([])
      })
  })
};

  return (
    <Modal
      title={
        <div style={{ textAlign: 'left',fontWeight:700 }}>
     <span style={{fontSize:'16px'}}>用例执行详情</span>
        </div>
    }
      visible={visible}
      onOk={onClose}
      style={{ width: 1200 }}
      onCancel={onClose}
      footer={null } 
      unmountOnExit
      className='test-case-mgr-modal test-case-run-detail'
    >
          <Spin className="test-chat-spin" loading={loading}>
              <div className='test-res-container'>
                  <div className="left-card">
                       {msg && msg.content && msg.content.length>0 && 
                       <>
                        <span className="ai-title">CQ测试用例执行结果</span>  
                        <AIMessage message={msg} ontology={ontology} siderOntologyData={siderOntologyData} />
                        <Divider/>
                      </> }
                      <div className="test-report">
                        <span>CQ测试用例校验</span>
                        <div className="test-report-container">
                            <div className="report-header">
                                <IconDataDirColor style={{fontSize:'16px',position:'relative',top:'2px'}}/> 校验报告
                            </div>  
                            <div className="content-header">
                                <span className="dot"></span>
                                <span className="text">请求</span>
                                <Divider/>
                            </div>
                            <div className="content-body">
                                <div className="content-title">预期结果内容</div>
                                <div className="content-text">{compareDetail?.expectedResult}</div>
                            </div>
                            <div className="content-header">
                                <span className="dot"></span>
                                <span className="text">对比分析</span>
                                <Divider/>
                            </div>
                            <div className="content-body">
                              
                            <div className="content-text">{compareDetail?.lastExecDetail}</div>
                                {/* <div className="content-title">对象识别一致性</div>
                                <div className="content-text">智能体准确地将输入手机号映射到了预期的对象主键user 00129，此项匹配成功。</div>
                                <div className="content-title">指标数值准确性</div>
                                <div className="content-text">指标数值准确性 00129，此项匹配成功。指标数值准确性指标数值准确性指标数值准确性指标数值准确性指标数值准确性指标数值准确性</div> */}
                            </div>
                            <div className="content-header">
                                <span className="dot"></span>
                                <span className="text">测试结果</span>
                                <Divider/>
                            </div>
                            <div className="content-body content-result">
                            <div className="result-left">结果状态</div>
                            <div className="result-right">
                                <div className={`dot  ${compareDetail?.summary=='通过'?'success':compareDetail?.summary=='未通过'?'error':'warning'}`} ></div>
                                <span>{compareDetail?.summary}</span>
                            </div>
                            </div>
                        </div>
                      </div>
                  </div>
                  <div className="right-graph">
                      <GraphPanel ref={graphRef} siderOntologyData={siderOntologyData} ontology={ontology}/>
                  </div>
              </div>
          </Spin>
    </Modal>
  );
};

export default TestCaseRunDetailModal;