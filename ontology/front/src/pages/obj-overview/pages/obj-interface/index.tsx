import React from 'react';
import { Alert, Button, Popconfirm, Message, Spin } from '@arco-design/web-react';
import { Tag } from 'modo-design';
import { IconFilterColor } from 'modo-design/icon';
import AttrExtendConfig from '@/pages/object/components/attrExtendConfig'
import InterfaceOverview from '@/pages/interface-overview';
import { getInterfaceData } from '@/pages/object/api';
import { removeRel, updateAttr } from './api';
import './style/index.less';

class ObjInterface extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            loading: true,
            interfaceAttr: []
        };
        this.attrExtendRef = React.createRef();
        this.viewMapRef = React.createRef();
        this.viewMapRef.current = {}
    }
    getData = () => {
    };
    handleSave = async (callback) => {
        if (!await this.attrExtendRef.current?.validate()) {
            return;
        }

        let validAttributes = this.attrExtendRef.current.getExtendAttr();
        const data = {
          ...this.props.obj,
        };
        delete data.actions;
        delete data.groups;
        delete data.id;
        data.attributes = validAttributes;

        updateAttr(this.props.obj.id, data)
          .then(async () => {
            Message.success('保存成功');
            // 保存成功后清除未保存标志
            this.setState({ hasUnsavedChanges: false });
            typeof callback === 'function' && callback(data.objectTypeLabel);
          })
          .catch(() => {
            Message.error('保存失败');
          });
    };
    getInterfaceInfo = ()=>{
        this.setState({
            loading: true,
            interfaceAttr: []
        })
        getInterfaceData(this.props.obj.interfaceId).then(res=>{
            if(res.data.success){
                this.setState({
                    interfaceAttr: res.data.data.attributeList
                })
            }
        }).finally(() => {
            this.setState({
                loading: false
            })
        })
    };
    componentDidMount() {
        this.getInterfaceInfo();
    }
    componentDidUpdate(prevProps, prevState) {
    }
    render() {
        const {
            obj
        } = this.props;
        const {
            loading,
            interfaceAttr
        } = this.state;
        return (
            <>
                <div
                    className="obj-interface">
                    <Alert content='只有满足接口声明的属性和关系约束，对象才能成功继承接口。' />
                    <div
                        className="obj-interface-panel">
                        <div
                            className="obj-interface-panel-header">
                            <div
                                className="title">
                                {obj.interfaceLabel || '--'}
                            </div>
                            <div
                                className="oper-group">
                                <Popconfirm
                                    focusLock
                                    title='确定取消继承关系？'
                                    onOk={() => {
                                        removeRel(obj.interfaceId, obj.id).then(res => {
                                            if (res.data.success) {
                                                Message.success('移除接口成功！')
                                                this.props.refresh()
                                                this.setState({
                                                    interfaceAttr: []
                                                })
                                                return;
                                            }
                                            throw 'err'
                                        }).catch(err => {
                                            Message.error('移除接口失败！')
                                        })
                                    }}
                                    onCancel={() => {
                                    }}>
                                    <Button>
                                        移除接口
                                    </Button>
                                </Popconfirm>
                                <Button
                                    onClick={() => {
                                        this.props.push({
                                            key: obj.interfaceId,
                                            ontology: this.props.ontology,
                                            title: obj.interfaceLabel,
                                            view: (
                                              <InterfaceOverview
                                                onUpdateUseSaveBtn={this.props.onUpdateUseSaveBtn}
                                                ontology={this.props.ontology}
                                                ref={ref => (this.viewMapRef.current[obj.interfaceId] = ref)}
                                                obj={{id: obj.interfaceId}}
                                                //   changeTab={(tab, oper) => props.changeTab(tab, oper)}
                                                push={this.props.push}
                                                getRef={() => this.viewMapRef.current[obj.interfaceId]}
                                              />
                                            ),
                                          });
                                    }}>
                                    查看接口
                                </Button>
                                <Button
                                    icon={<IconFilterColor/>}/>
                            </div>
                        </div>
                        <div
                            className="obj-interface-num">
                            <span className="text">继承属性</span>
                            <Tag>{interfaceAttr.length}</Tag>
                        </div>

                        <div
                            className="obj-interface-panel-content">
                            <Spin
                                className="obj-interface-panel-content-loading"
                                loading={loading}>
                                <AttrExtendConfig
                                    ref={this.attrExtendRef}
                                    hiddenAlert={true}
                                    objectData={obj}
                                    isShow={true}
                                    interfaceAttr={interfaceAttr.map(item => {
                                        const attr = obj.attributes.find(a => {
                                            return a.interfaceAttrId === item.id
                                        })
                                        return {
                                            ...item,
                                            interfaceType: attr?.interfaceType,
                                            attributeName: attr?.attributeName
                                        }
                                    })}
                                    attributes={obj.attributes}
                                    interfaceId={obj.interfaceId}/>
                            </Spin>
                        </div>
                    </div>
                </div>
            </>
        )
    }
}

export default ObjInterface;
