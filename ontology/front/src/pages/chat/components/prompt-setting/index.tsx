import React, { useState,useEffect,useRef,forwardRef,useImperativeHandle } from 'react';
import { Form, Select, Button, Alert, Space, Input,Tooltip,Message as ArcoMessage, Spin } from '@arco-design/web-react';
import Markdown from 'react-markdown';

import {
    IconCopy, IconEdit, IconSave, IconCheck,IconDown,
    IconCheckCircle,
    IconPlusCircle
} from '@arco-design/web-react/icon';
import {IconInformationColor} from 'modo-design/icon';
import copy from 'copy-to-clipboard';
import './index.less';
import { getPromptDetail, getPromptList, updatePrompt } from '../../api';  

interface PromptOption {
  id: string;
  label: string;
  value: string;
  promptName: string;
  promptType: number;
  content?: string;
  [key: string]: any;
}

export interface PromptSettingRef {
  handleCancel: () => void;
}

const PromptSetting = forwardRef<PromptSettingRef, any>((props:any, ref) => {
  // 当前下拉框选中的提示词
  const [selectedPromptVal, setSelectedPromptVal] = useState<string>(props.prompt?.id||'');
  // 是否编辑模式
  const [isEditMode, setIsEditMode] = useState(false);
  // 文本内容（编辑模式下可修改，用于编辑后暂存）
  const [editContent, setEditContent] = useState(props.prompt?.promptContent||'');
  const [promptContent, setPromptContent] = useState(props.prompt?.promptContent||'');
  const [selectedPromptObj, setSelectedPromptObj] = useState<any>(props.prompt||{});
  const [isCopied,setIsCopied] = useState(false);
  const [promptListData, setPromptListData] = useState<PromptOption[]>([]);
  const [loading, setLoading] = useState(false);
  const hasCalledOnUpdateRef = useRef(false);

  const getPromptListData = () => {
    getPromptList({
      ontologyId: props.ontologyId,
      page: 1,
      limit: 999,
      keyword: '',
    }).then(res => {
      if(res.data.success){
        const data = res.data.data.content;
        const options = data.filter((item:any) => item.promptType == 0).map((item:any) => ({
          label: item.promptName,
          value: item.id,
          ...item,
        }));
        setPromptListData(options);
        // 如果 props.prompt.id 为空，使用第一个选项
        if(!props.prompt?.id && options.length > 0){
          setSelectedPromptVal(options[0].value);
        } else if(props.prompt?.id){
          setSelectedPromptVal(props.prompt.id);
        }
      }
    })
  }
  const getPromptDetailData = (id:string) => {
    if(!id) return;
    setLoading(true);
    getPromptDetail({
      id: id,
    }).then(res => {
      if(res.data.success){
        const content = res.data.data?.promptContent ?? '';
        // 如果当前选中的提示词与 props.prompt.id 一样，且没有调用过 onUpdate，且 content 与 props.prompt.promptContent 不一样，则不更新内容
        if(props.prompt.id == id && !hasCalledOnUpdateRef.current && content !== props.prompt.promptContent){
            setPromptContent(props.prompt.promptContent);
            setEditContent(props.prompt.promptContent);
            setSelectedPromptObj(res.data.data);
            hasCalledOnUpdateRef.current = true;
          return;
        }
        setPromptContent(content);
        setEditContent(content);
        setSelectedPromptObj(res.data.data);
        // 如果是初始化且 props.prompt 为空，调用 onUpdate
        const isEmpty = !props.prompt?.id && !props.prompt?.promptContent;
        if(isEmpty && !hasCalledOnUpdateRef.current && props.onUpdate){
          hasCalledOnUpdateRef.current = true;
          props.onUpdate({
            id: id,
            promptContent: content
          });
        }
      }
    }).finally(() => {
      setLoading(false);
    })
  }

  useEffect(()=>{
    // 重置标记，当 ontologyId 变化时重新初始化
    hasCalledOnUpdateRef.current = false;
    setLoading(true);
    if(props.ontologyId){
      getPromptListData();
    }
  },[props.ontologyId])
  
  useEffect(()=>{
    if(selectedPromptVal){
      getPromptDetailData(selectedPromptVal);
    }
  },[selectedPromptVal])
  
  // 当 props.prompt.id 变化时，更新选中值
//   useEffect(()=>{
//     if(props.prompt?.id && props.prompt.id !== selectedPromptVal){
//       setSelectedPromptVal(props.prompt.id);
//       // 如果 props.prompt 有值，重置标记
//       hasCalledOnUpdateRef.current = true;
//     }
//   },[props.prompt?.id])

  // 根据选中项动态切换
 // const selectedPromptObj = promptListData.find(opt => opt.id === selectedPromptVal);

  // 下拉变化时也同步内容区
  const handleChangePrompt = (val: string) => {
    setSelectedPromptVal(val);
    setIsEditMode(false);
  };

  const handleEdit = () => setIsEditMode(true);
  
  const handleSaveEdit = () => {
    setPromptContent(editContent);
    setIsEditMode(false);
  };
  const handleCancel = () => {
    setPromptContent(props.prompt?.promptContent||'');
    setEditContent(props.prompt?.promptContent||'');
    setIsEditMode(false);
    props.onCancel?.();
  };

  // 暴露 handleCancel 方法给父组件
  useImperativeHandle(ref, () => ({
    handleCancel,
  }));
  const handleSave = () => {
    if (isEditMode) {
        // 先保存编辑内容，再调用 onUpdate
        handleSaveEdit();
        // 此处需要确保更新后的 promptContent 已被 set
        // 因为 setPromptContent 是异步的，为了保证 onUpdate 拿到最新值，建议直接传递 editContent
        props.onUpdate({
            id: selectedPromptVal,
            promptContent: editContent,
        });
        setIsEditMode(false);
    } else {
        props.onUpdate({
            id: selectedPromptVal,
            promptContent: promptContent,
        });
        setIsEditMode(false);
    }
  };
  // 一键同步的函数
  const handleSync = () => {
    const promptObj = {...selectedPromptObj,promptContent:promptContent};
    updatePrompt(promptObj).then(res => {  
      if(res.data.success){
        ArcoMessage.success('提示词更新成功');
        getPromptDetailData(selectedPromptVal);
      }
    })
  };    
 
  const handleCopy = () => {
    if (copy(promptContent ?? '')) {
        ArcoMessage.success('已复制到剪贴板');
    } else {
        ArcoMessage.error('复制失败，请手动复制');
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
};

  return (
    <div className="prompt-setting">
      <Form layout="vertical">
              <Form.Item label="当前会话提示词">
                  <Select
                      value={selectedPromptVal}
                      onChange={handleChangePrompt}
                      style={{ width: '100%' }}
                      showSearch
                      placeholder="请选择当前会话提示词"
                      options={promptListData.map(opt => ({ label: opt.label, value: opt.value }))}
                  />
              </Form.Item>
              <Form.Item label="当前会话提示词内容">
                  <div className='prompt-content'>
                      <div className="prompt-btns">
                          {isEditMode ?
                              <Tooltip content="保存">
                                  <Button shape='circle' icon={<IconSave />} onClick={handleSaveEdit} size="small" />
                              </Tooltip> :
                              <Space>
                                  <Tooltip content={isCopied ? "已复制" : "复制提示词"}>
                                      <Button
                                          shape="circle"
                                          status={isCopied ? 'success' : 'default'}
                                          size="small"
                                          icon={isCopied ? <IconCheck /> : <IconCopy />}
                                          onClick={handleCopy}
                                      />
                                  </Tooltip>
                                  <Tooltip content="编辑">
                                      <Button shape='circle' icon={<IconEdit />} onClick={handleEdit} size="small" />
                                  </Tooltip>

                              </Space>
                          }


                      </div>
                      <Spin loading={loading} style={{ width: '100%' }}>
                          {!isEditMode ?
                              <div className="prompt-setting-markdown">
                                  <Markdown>{promptContent}</Markdown>
                              </div>
                              :
                              <Input.TextArea
                                  autoSize={{ minRows: 8, maxRows: 20 }}
                                  value={editContent}
                                  onChange={setEditContent}
                                  placeholder="请输入提示词内容"
                              />
                          }
                      </Spin>
                  </div>
              </Form.Item>
              <Form.Item>
                  <Alert
                      type="info"
                      icon={<IconInformationColor />}
                      content={<span>当前会话引用：<span>{selectedPromptObj?.promptName}</span>。编辑内容仅在当前会话生效。如需更新本体提示词，请使用“一键同步”功能</span>}
                  />
              </Form.Item>
        </Form>
        <div className="prompt-setting-footer">
            <Space className="left-btns">
                  <Button
                      type='text'
                   
                      icon={<IconCheckCircle style={{ fontSize: 14 }} />}
                      disabled={(selectedPromptObj?.promptContent ?? '') == promptContent}
                      size='mini'
                      onClick={handleSync}>一键同步</Button>
                  <Button
                   disabled={true}
                   type='text'
                   icon={<IconPlusCircle style={{ fontSize: 14 }} />} size='mini'>一键新增</Button>
              </Space>
              <Space className="right-btns">
                  <Button type='secondary' onClick={handleCancel}>取消</Button>
                  <Button type='primary' onClick={handleSave}>保存</Button>
            </Space>
        </div>
    </div>
  );
});

export default PromptSetting;