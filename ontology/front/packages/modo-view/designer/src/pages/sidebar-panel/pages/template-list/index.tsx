import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Form, Input, Upload, Tooltip, Tree, Button, Notification } from '@arco-design/web-react';
import { IconDelete, IconEdit } from 'modo-design/icon';
import { connect } from 'react-redux';
import { ReactSortable } from "react-sortablejs";
import './style/index.less';
import { deleteTemplate, updateTemplate } from './api';

class TemplateList extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            templateModalVisible: false,
            currentIndex: -1
        };
        this.templateFormRef = React.createRef();
    }
    setList = (list, parent) => {
    };
    cloneWidget(item) {
    }
    openTemplateModal = (template, index) => {
        this.setState({
            templateModalVisible: true,
            currentIndex: index
        });
        setTimeout(() => {
            if (this.templateFormRef.current) {
                this.templateFormRef.current.setFieldsValue(template);
            }
        })

    };
    handleTemplateSuccessNotify = () => {
        Notification.success({
            title: '成功',
            content: '创建模板成功!',
        })
    };
    handleTemplateFailNotify = () => {
        Notification.error({
            title: '失败',
            content: '创建模板失败!',
        })
    };
    handleUpdateTemplate = (template) => {
        delete template.image;
        updateTemplate({
            createDt: null,
            createUser: null,
            descr: null,
            id: null,
            inputVars: null,
            label: null,
            lastupd: null,
            name: null,
            parameters: JSON.stringify(this.props.node),
            state: "1",
            updateUser: null,
            version: 0,
            viewPlugins: null,
            imagePath: null,
            ...template
        }).then(res => {
            if (res.data.success) {
                const {
                    templates
                } = this.props.app;
                templates[this.state.currentIndex] = {
                    ...res.data.data
                };
                this.props.dispatch({
                    type: 'SETTEMPLATES',
                    data: templates
                });
                this.handleTemplateSuccessNotify();
            } else {
                this.handleTemplateFailNotify();
            }
        }).catch(e => {
            this.handleTemplateFailNotify();
        })
    };
    handleSuccessNotify = () => {
        Notification.success({
            title: '成功',
            content: '删除模板成功!',
        })
    };
    handleFailNotify = () => {
        Notification.error({
            title: '失败',
            content: '删除模板失败!',
        })
    };
    handleDeleteTemplate = (template) => {
        deleteTemplate(template.id).then(res => {
            if (res.data.success) {
                const {
                    templates
                } = this.props.app;
                const index = templates.indexOf(template);
                templates.splice(index, 1);
                this.props.dispatch({
                    type: 'SETTEMPLATES',
                    data: templates
                });
                this.handleSuccessNotify();
            } else {
                this.handleFailNotify();
            }
        }).catch(err => {
            console.log(err);
            this.handleFailNotify();
        })
    };
    componentDidUpdate(prevProps) {
    }
    render() {
        const {
            templates
        } = this.props.app;

        const env = process.env.NODE_ENV;
        const rootPath = env === 'production' ? '' : '/__modo';

        return (
            <div
                className="modo-template-list"
                style={{
                    display: this.props.visible ? 'block' : 'none'
                }}>
                <div
                    className="list-title">
                    模板列表
                </div>
                <div className="list-container">
                    <ul>
                        <ReactSortable
                            list={templates}
                            animation={150}
                            group={{ name: "cloning-group-name", pull: "clone", put: false }}
                            setList={(list) => {this.setList(list)}}
                            sort={false}>
                            {
                                templates.map((template, index) => {
                                    return (
                                        <Tooltip
                                            disabled={!template.imagePath}
                                            key={index}
                                            position="right"
                                            trigger="hover"
                                            color="#fff"
                                            content={(
                                                <img src={template.imagePath}/>
                                            )}>
                                            <li>
                                                <span className="label">
                                                    {template.label}
                                                </span>
                                                <span
                                                    className="oper-group">
                                                    <IconEdit
                                                        onClick={() => this.openTemplateModal(template, index)}/>
                                                    <IconDelete
                                                        onClick={() => this.handleDeleteTemplate(template)}/>
                                                </span>
                                            </li>
                                        </Tooltip>
                                    )
                                })
                            }
                        </ReactSortable>
                    </ul>
                </div>
                <Modal
                    title="创建模板"
                    visible={this.state.templateModalVisible}
                    onOk={() => {
                        this.templateFormRef.current.validate().then(() => {
                            this.handleUpdateTemplate(this.templateFormRef.current.getFieldsValue());
                            this.setState({
                                templateModalVisible: false
                            });
                        }).catch((err) => {
                            console.log(err);
                        })
                    }}
                    onCancel={() => {
                        this.setState({
                            templateModalVisible: false
                        });
                    }}
                    autoFocus={false}
                    focusLock={true}>
                    <Form
                        ref={this.templateFormRef}
                        labelCol={{
                            flex: '80px'
                        }}
                        wrapperCol={{
                            flex: 1
                        }}>
                        <Form.Item
                            label="英文名"
                            field="name"
                            rules={[{ required: true }]}>
                            <Input placeholder="请输入英文名" />
                        </Form.Item>
                        <Form.Item
                            label="中文名"
                            field="label"
                            rules={[{ required: true }]}>
                            <Input placeholder="请输入中文名" />
                        </Form.Item>
                        <Form.Item
                            label="描述"
                            field="descr">
                            <Input.TextArea placeholder="请输入描述" />
                        </Form.Item>
                        <Form.Item
                            label="上传图片"
                            field="image">
                            <Upload
                                action={ rootPath + "/_api/minio/singleFileUpload" }
                                headers={{
                                    'X-Modo-Bucket': this.props.app.name
                                }}
                                onChange={(files, file) => {
                                    if (file.status === 'done') {
                                        this.templateFormRef.current.setFieldValue('imagePath', file.response.data);
                                    }
                                }}/>
                        </Form.Item>
                        <Form.Item
                            label="图片地址"
                            field="imagePath"
                            rules={[{ required: true }]}>
                            <Input/>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        );
    }
}

export default connect((state, ownProps) => {
    return {
        app: state.app
    }
})(TemplateList);
