import React, {useState, useEffect, useMemo} from 'react';
import {
    Button,
    Spin,
    Input,
    Form,
    Message,
} from '@arco-design/web-react';
import './index.less';
import {ontologyPromptBasic} from "@/pages/ontology-manager/api";
const copyToClipboard = async (text) => {
    // 方法1: 使用现代 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            return { success: true, method: 'clipboard-api' };
        } catch (err) {
            console.warn('Clipboard API 失败:', err);
            // 继续尝试其他方法
        }
    }

    // 方法2: 使用 document.execCommand
    try {
        const textArea = document.createElement('textarea');
        textArea.value = text;

        // 使 textarea 在视口外
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);

        textArea.focus();
        textArea.select();

        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (successful) {
            return { success: true, method: 'exec-command' };
        } else {
            return { success: false, method: 'exec-command' };
        }
    } catch (err) {
        console.error('execCommand 失败:', err);
        return { success: false, method: 'exec-command', error: err };
    }
};
class TipManager extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            loading: false,
        };
        this.formRef = React.createRef();
    }

    getPrompt = async () => {
        this.setState({
            loading: true,
        });

        try {
            const res = await ontologyPromptBasic({
                id: this.props.ontology.id,
            });

            const {data, success, message} = res.data;
            if (success) {

                this.formRef.current?.setFieldValue('tip1',data.prompt||'');
            } else {
                Message.error(message || '获取提示词失败');
            }
        } finally {
            this.setState({
                loading: false,
            });
        }
    };



    handleCopy = async () => {
        const {tip1, tip2} = this.formRef.current.getFieldsValue();
        const content = `${tip1||''}\n${tip2||''}`;

        const result = await copyToClipboard(content);

        if (result.success) {
            Message.success('复制成功');
        }else{
            Message.error('复制失败');
        }
        /*navigator.clipboard.writeText(content)
          .then(() => {
              Message.success('复制成功');
          })
          .catch(err => {
              console.error('复制失败:', err);
              Message.error('复制失败');
          });*/
    };

    componentWillUnmount() {

    }

    componentDidMount() {
        this.getPrompt();
    }

    render() {
        const {loading} = this.state;
        const formItemLayout = {
            labelCol: {
                span: 3,
            },
            wrapperCol: {
                span: 21,
            },
        };
        return (
          <Spin className="tip-copy-spin" loading={loading}>
              <div className="tips-container">
                  <div className="tips-header">
                      <div className="pos-left">
                          <span className="title">提示词</span>

                      </div>
                      <div className="pos-right">
                          <Button type="primary" onClick={this.handleCopy}>
                          复制
                      </Button></div>
                  </div>
                  <Form ref={this.formRef}  layout ='horizontal' {...formItemLayout} className='tip-form'>
                      <div className='tip-content'>
                      <Form.Item label="提示词1" field="tip1">
                          <Input.TextArea
                            placeholder="请输入提示词"
                          />
                      </Form.Item>

                      <Form.Item label="提示词2" field="tip2">
                          <Input.TextArea
                            placeholder="请输入提示词"
                          />
                      </Form.Item>
                      </div>
                  </Form>
              </div>
          </Spin>
        );
    }
}

export default TipManager;
