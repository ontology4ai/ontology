import React, { useState,useEffect,useRef,forwardRef,useImperativeHandle } from 'react';
import { Form, Select, Button, Alert, Space, Input,Tooltip,Message as ArcoMessage, Spin, Divider, Tag } from '@arco-design/web-react';
import Markdown from 'react-markdown';

import {
   IconEdit, IconSave, IconCheck,IconDown,
    IconCheckCircle,
    IconPlusCircle
} from '@arco-design/web-react/icon';
import {IconInformationColor,IconCopy} from 'modo-design/icon';
import copy from 'copy-to-clipboard';
import './index.less';
import { getPromptDetail, getPromptList, getPromptRdf, updatePrompt } from '../../api';  
import { OagPromptDefault } from '../../index_new';

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
  const [selectedPromptVal, setSelectedPromptVal] = useState<string>('');
  // 是否编辑模式
  const [isEditMode, setIsEditMode] = useState(false);
  // 文本内容（编辑模式下可修改，用于编辑后暂存）
  const [editContent, setEditContent] = useState(props.prompt?.promptContent||'');
  const [promptContent, setPromptContent] = useState(props.prompt?.promptContent||'');
  const [rdfPrompt, setRdfPrompt] = useState('');
  const [selectedPromptObj, setSelectedPromptObj] = useState<any>(props.prompt||{});
  const [isCopied,setIsCopied] = useState(false);
  const [promptListData, setPromptListData] = useState<PromptOption[]>([]);
  // 全局 loading：promptListData + promptContent 都获取完成后才结束
  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const globalLoading = listLoading || detailLoading;
  const hasCalledOnUpdateRef = useRef(false);

  const getPromptListData = () => {
    setListLoading(true);
    getPromptList({
      ontologyId: props.ontologyId,
      page: 1,
      limit: 999,
      keyword: '',
    }).then(res => {
      if(res.data.success){
        const data = res.data.data.content;
        const options = data.filter((item:any) => item.promptType == props.prompt.promptType).map((item:any) => ({
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
    }).finally(() => {
      setListLoading(false);
    })
  }
  const getPromptDetailData = (id: string, options?: { forceRefresh?: boolean }) => {
    if(!id) return;
    setDetailLoading(true);
    getPromptDetail({
      id: id,
    }).then(res => {
      if(res.data.success){
        const content = res.data.data?.promptContent ?? '';
        // 一键同步后强制以服务端为准；否则若当前选中与 props.prompt 相同且未调用过 onUpdate 且服务端与父组件内容不同，则保留父组件内容
        const skipPreserve = options?.forceRefresh;
        if(!skipPreserve && props.prompt.id == id && !hasCalledOnUpdateRef.current && content !== props.prompt.promptContent){
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
            promptContent: content,
            initPromptContent: content
          });
        }
      }
    }).finally(() => {
      setDetailLoading(false);
    })
  }

  useEffect(()=>{
   
    // 重置标记，当 ontologyId 变化时重新初始化
    hasCalledOnUpdateRef.current = false;
    // 列表/详情分别控制 loading
    if(props.ontologyId){
      getPromptListData();
    }
  },[props.ontologyId])

  // 通用模式下：获取 RDF 提示词（用于字数统计）
  useEffect(() => {
    const isCommonMode = props?.prompt?.promptType == 0;
    if (!isCommonMode || !props.ontologyId) {
      setRdfPrompt('');
      return;
    }
    getPromptRdf({ id: props.ontologyId })
      .then((res: any) => {
        if (res?.data?.success) {
          setRdfPrompt(res?.data?.data?.prompt || '');
        } else {
          setRdfPrompt('');
        }
      })
      .catch(() => setRdfPrompt(''));
  }, [props.ontologyId, props?.prompt?.mode]);
  
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
            initPromptContent: selectedPromptObj?.promptContent||''
        });
        setIsEditMode(false);
        props.onCancel?.();
    } else {
        props.onUpdate({
            id: selectedPromptVal,
            promptContent: promptContent,
            initPromptContent: selectedPromptObj?.promptContent||''
        });
        setIsEditMode(false);
        props.onCancel?.();
    }
  };
  // 一键同步：保存当前 promptContent 到服务端，成功后拉取详情使 selectedPromptObj.promptContent 与 promptContent 一致
  const handleSync = () => {
    const promptObj = { ...selectedPromptObj, promptContent };
    updatePrompt(promptObj).then(res => {
      if (res.data.success) {
        ArcoMessage.success('提示词更新成功');
        getPromptDetailData(selectedPromptVal, { forceRefresh: true });
      }
    });
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
      <Spin loading={globalLoading} style={{ width: '100%' }}>
      <Form layout="vertical">
              <Form.Item label="当前会话提示词">
                  <Select
                      value={selectedPromptVal}
                      onChange={handleChangePrompt}
                      style={{ width: '100%' }}
                      showSearch
                      placeholder="请选择当前会话提示词"
                      filterOption={(inputValue: string, option: any) =>
                        (option?.props?.extra?.label ?? '')
                          .toLowerCase()
                          .indexOf(inputValue.toLowerCase()) >= 0
                      }
                  >
                    {promptListData.map((opt: any) => (
                      <Select.Option key={opt.value} value={opt.value} extra={{ label: opt.label }}>
                        <span>
                          {opt.label}
                          {opt.defaultType === 1 && (
                            <span style={{ marginLeft: 6 }}>
                              <Tag bordered color="arcoblue" size="small">提示词模板</Tag>
                            </span>
                          )}
                        </span>
                      </Select.Option>
                    ))}
                  </Select>
              </Form.Item>
          <Form.Item
            label={
              <span>
                当前会话提示词内容
                <span style={{ marginLeft: 8, color: 'var(--color-text-3)', fontWeight: 400,display: 'inline-flex',alignItems: 'center' }}>
                    字符数：
                    {((isEditMode ? editContent : promptContent) || '').length + 1 +
                      ((props?.prompt?.promptType == 0) ? (rdfPrompt || '').length : (OagPromptDefault+'"'+props.ontologyId+'"').length)}
                    <Tooltip content="统计当前指令框中的字符数，通用类的指令包含RDF的字符数，OAG类的包含本体ID。">
                      <IconInformationColor style={{ fontSize: 14, marginLeft: 4 }}/>
                    </Tooltip>
                </span>
              </span>
            }
          >
            <div className='prompt-content'>
              <div className="prompt-btns">
                {isEditMode ?
                  <Button type='text' onClick={handleSaveEdit} size="small" >保存</Button> :
                  <>
                    <Button
                      type='text'
                      status={isCopied ? 'success' : 'default'}
                      size="small"
                     
                      onClick={handleCopy}
                    >{isCopied ? "已复制" : "复制"}</Button>
                    <Divider type="vertical" />
                    <Button type='text'  onClick={handleEdit} size="small" >编辑</Button>

                  </>
                }


              </div>
              <Spin loading={detailLoading} style={{ width: '100%' }}>
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
                      content={<span>当前会话引用：<span className="prompt-setting-alert-name">{selectedPromptObj?.promptName}</span>。编辑内容仅在当前会话生效。如需更新本体提示词，请使用“一键同步”功能</span>}
                  />
              </Form.Item>
        </Form>
        <div className="prompt-setting-footer">
            <Space className="left-btns" size="mini">
                  <Button
                      type='text'
                     // icon={<IconCheckCircle style={{ fontSize: 14 }} />}
                      disabled={isEditMode || selectedPromptObj.defaultType==1 || (selectedPromptObj?.promptContent ?? '') === promptContent}
                      size='mini'
                      onClick={handleSync}>一键同步</Button>
                  {/*    <Divider type="vertical" />
                  <Button
                   disabled={true}
                   type='text'
                  // icon={<IconPlusCircle style={{ fontSize: 14 }} />}
                   size='mini'>一键新增</Button> */}
              </Space>
              <Space className="right-btns">
                  <Button type='secondary' onClick={handleCancel}>取消</Button>
                  <Button type='primary' disabled={isEditMode} onClick={handleSave}>确认</Button>
            </Space>
        </div>
      </Spin>
    </div>
  );
});

export default PromptSetting;