import React, { useState, useEffect, useMemo } from 'react';
import View from 'packages/modo-view/core/src/components/View';
import { Layout, Spin, Modal, Steps, Divider, Button, Grid, Typography, Radio } from '@arco-design/web-react';
import { connect } from 'react-redux';
import { IconLoading } from '@arco-design/web-react/icon';
import { IconLayout1Fill, IconLayout2Fill, IconLayout3Fill, IconLayout4Fill, IconLayout5Fill} from 'modo-design/icon';
import HeaderPanel from './src/pages/header-panel';
import SidebarPanel from './src/pages/sidebar-panel';
import ViewPanel from './src/pages/view-panel';
import AttrPanel from './src/pages/attr-panel';
import ModelList from 'packages/modo-view/designer/src/pages/sidebar-panel/pages/model-list';
import DsList from 'packages/modo-view/designer/src/pages/sidebar-panel/pages/ds-list';
import ViewWidget from 'packages/modo-view/core/src/components/Widget/utils/View';
import format from './src/utils/format';
import transform from './src/utils/transform';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import rootReducer from './src/store';
require('static/guid');
import { normalize, schema } from 'normalizr';
import layout1Img from './src/images/layout1.png';
import layout2Img from './src/images/layout2.png';
import layout3Img from './src/images/layout3.png';
import layout4Img from './src/images/layout4.png';
import layout5Img from './src/images/layout5.png';
import './src/style/index.less';

const layout1 = require('./src/mock/layout1.json');
const layout2 = require('./src/mock/layout2.json');
const layout3 = require('./src/mock/layout3.json');
const layout4 = require('./src/mock/layout4.json');

const Sider = Layout.Sider;
const Header = Layout.Header;
const Footer = Layout.Footer;
const Content = Layout.Content;
const Step = Steps.Step;
const Row = Grid.Row;
const Col = Grid.Col;

class ViewDesigner extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            sideWidth: 300,
            modalVisible: false,
            stepActive: 1,
            templateList: [
                { name: 'layout1', title: '空白模板', content: (<img src={layout1Img}/>), data: [new ViewWidget('0', '0', '页面')]},
                { name: 'layout2', title: '表单+操作栏+表格（布局模板）', content: (<img src={layout2Img}/>), data: layout1},
                { name: 'layout3', title: '树+表格（布局模板）', content: (<img src={layout3Img}/>), data: layout2},
                { name: 'layout4', title: '树+筛选表单+操作栏+表格', content: (<img src={layout4Img}/>), data: layout3},
                { name: 'layout5', title: '对话框布局', content: (<img src={layout5Img}/>), data: layout4},
                // { name: 'template1', title: '模板1', content: <IconLayout1Fill/>},
                // { name: 'template5', title: '模板5', content: <IconLayout4Fill/>}
                // Tab模板
                // 主内容+操作栏 （对话框模板）
                // 主内容+操作栏 （抽屉模板）
            ]
        };
        const viewKey = guid();
        this.props.dispatch({
            type: 'SETVIEWKEY',
            data: viewKey
        });
        window.nodeVarMap[viewKey] = {};
        window.nodeRenderer[viewKey] = {};
        window.stateChange[viewKey] = {};
    }
    setNode = (data, node) => {

    };
    handleChangeLayout = (layout) => {
        setTimeout(() => {
            const template = this.state.templateList.find(template => {
                return template.name === layout;
            });
            this.props.dispatch({
                type: 'SETNODES',
                data: transform(template.data)
            });
        });
    };
    closePanel = () => {
        this.props.dispatch({
            type: 'SETVIEWSTATE',
            data:  'update'
        });
        this.setState({modalVisible: false});
    };
    componentDidUpdate() {
        if (this.props.viewState === 'new' && !this.state.modalVisible) {
            this.setState({
                modalVisible: true
            });
        }
    }
    componentDidMount() {

    }
    render() {
        const prefix = 'modo-designer';
        const {
            app,
            view
        } = this.props;

        if (app && view) {
            return (
                <>
                <div
                    className={prefix}>
                    <Layout>
                        <Header
                            className={prefix + "-header-container"}
                            style={{
                                height: 'var(--larger-height)'
                            }}>
                            <HeaderPanel></HeaderPanel>
                        </Header>
                        <Layout>
                            <Sider
                                className={prefix + "-sidebar-container"}
                                resizeDirections={['right']}
                                style={{
                                    width: `${this.state.sideWidth}px`,
                                    minWidth: 50,
                                    maxWidth: 500
                                }}>
                                <SidebarPanel
                                    setWidth={width => {
                                        this.setState({
                                            sideWidth: width
                                        });
                                    }}>
                                </SidebarPanel>
                            </Sider>
                            <Content
                                className={prefix + "-view-container"}>
                                <ViewPanel
                                    editable={true}>
                                </ViewPanel>
                            </Content>
                            <Sider
                                className={prefix + "-attr-container"}
                                style={{
                                    width: '300px'
                                }}>
                                <AttrPanel></AttrPanel>
                            </Sider>
                        </Layout>
                    </Layout>
                </div>
                <Modal
                    style={{
                        width: 'calc(100% - 60px)',
                        height: 'calc(100% - 40px)'
                    }}
                    title={
                        <div
                            style={{
                                textAlign: 'left'
                            }}>
                            自定义视图
                        </div>
                    }
                    visible={this.state.modalVisible}
                    onOk={() => this.closePanel()}
                    onCancel={() => this.closePanel()}
                    footer={
                       <>
                            {this.state.stepActive > 1 ? (
                                <Button
                                    onClick={() => {
                                        this.state.stepActive--;
                                        this.setState({
                                            stepActive: this.state.stepActive
                                        })
                                    }}>
                                    上一步
                                </Button>)
                                : null
                            }
                            {this.state.stepActive < 3 ? (
                                <Button
                                    onClick={() => {
                                        this.state.stepActive++;
                                        this.setState({
                                            stepActive: this.state.stepActive
                                        })
                                    }}
                                    type='primary'>
                                    下一步
                                </Button>)
                                : null
                            }
                            {this.state.stepActive == 3 ? (
                                <Button
                                    onClick={() => {
                                        this.closePanel();
                                    }}
                                    type='primary'>
                                    进入视图
                                </Button>)
                                : null
                            }
                       </>
                    }>
                    <div
                        style={{ padding: '16px 0' }}>
                        <Steps
                            size='small'
                            labelPlacement='vertical'
                            current={this.state.stepActive}
                            onChange={value => {
                                this.setState({
                                    stepActive: value
                                })
                            }}
                            style={{
                                minWidth: '440px',
                                maxWidth: '75%',
                                margin: '0 auto'
                            }}>
                            <Step title='选择布局或模板' />
                            <Step title='添加模型' />
                            <Step title='添加数据源' />
                        </Steps>
                    </div>
                    <Divider style={{ margin: 0 }} />
                    <div
                        className="template-list"
                        style={{
                            display: this.state.stepActive === 1 ? 'block' : 'none'
                        }}>
                        <Radio.Group
                            onChange={this.handleChangeLayout}>
                            <Row
                                gutter={20}
                                style={{ marginBottom: 20 }}>
                                {this.state.templateList.map(template => {
                                    return (
                                        <Col
                                            key={template.name}
                                            span={4}>
                                            <div
                                                className="template">
                                                <div className="content">
                                                    {template.content}
                                                </div>
                                                <div className="title">
                                                    <Radio
                                                        value={template.name}>
                                                        <span>
                                                            {template.title}
                                                        </span>
                                                    </Radio>
                                                </div>
                                            </div>
                                        </Col>
                                    );
                                })}
                            </Row>
                        </Radio.Group>
                    </div>
                    <div
                        className="model-list"
                        style={{
                            display: this.state.stepActive == 2 ? 'block' : 'none'
                        }}>
                        <ModelList
                            style={{
                                width: '100%',
                                borderLeft: '0px'
                            }}
                            modelMask={true}
                            modelStyle={{
                                width: '80%',
                                left: '10%'
                            }}
                            visible={this.state.stepActive == 2}/>
                    </div>
                    <div
                         className="ds-list"
                        style={{
                            display: this.state.stepActive == 3 ? 'block' : 'none'
                        }}>
                        <DsList
                            style={{
                                width: '100%',
                                borderLeft: '0px'
                            }}
                            panelMask={true}
                            panelStyle={{
                                width: '80%',
                                left: '10%'
                            }}
                            visible={this.state.stepActive == 3}/>
                    </div>
                </Modal>
                </>
            );
        } else {
            return (
                <Spin
                    loading={true}
                    size={30}
                    block
                    style={{
                        width: '100%',
                        height: '100%'
                    }}
                    icon={<IconLoading />}>
                    <div
                        style={{
                            width: '100%',
                            height: '100%'
                        }}>
                    </div>
                </Spin>
            );
        }
    }
}

export default connect((state, props) => {
    return {
        app: state.app,
        view: state.view,
        nodes: state.nodes,
        viewState: state.viewState
    }
})(ViewDesigner);
