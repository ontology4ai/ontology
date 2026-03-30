import React from 'react'
import { Spin, Input, Table } from "@arco-design/web-react";
import axios from 'axios';
import { withTranslation } from 'react-i18next';
import Step1 from './pages/Step1';
import Step2 from './pages/Step2';
import Step3 from './pages/Step3';
import Step4 from './pages/Step4';
import OntologyVisualize from './pages/visualize';
import OntologySimulate from './pages/simulate';
import './style/index.less'

class OntologyBuild extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            menuActive: '1',
            active: null,
            tableDetailLoading: true,
            tableDetail: {
                tableColumn: [],
                tableData: [],
                tableInfo: {}
            }
        };
    }
    selectNode = key => {
        this.setState({
            active: key
        });
        this.getData(key)
    };
    selectMenu = key => {
        this.setState({
            menuActive: key
        })
    };
    getData = (tableName) => {
        this.setState({
            tableDetailLoading: true
        });
        axios.get(
            '/ontology_show/_api/object/type/table/detail',
            {
                params: {
                    tableName
                }
            }
        ).then(res => {
            if (res.data.data && Array.isArray(res.data.data.tableColumn)) {
                this.setState({
                    tableDetail: res.data.data
                })
            }
        }).catch(err => {

        }).finally(() => {
            this.setState({
                tableDetailLoading: false
            })
        })
    };
    componentDidMount() {
        // this.getData('ods_customer_info')
    }
    render() {
        const {
            active,
            menuActive,
            tableDetail,
            tableDetailLoading
        } = this.state;
        const { t, i18n } = this.props;
        const isEn = i18n?.language === 'en-US';
        return (
            <div
                className="ontology-build-main">
                {/* <img className="bg" src={new URL('./imgs/bg.png', import.meta.url).href}/> */}
                <div
                    className={`menu-container ${isEn ? 'is-en' : ''}`.trim()}>
                    <div
                        className={`menu-title ${isEn ? 'is-en' : ''}`.trim()}>
                        <img className="left" src={new URL('./imgs/menu-main-title-arrow.svg', import.meta.url).href}/>
                        <div
                            className="text">
                        <pre>
                            {t('rapid.ontology.app')}
                        </pre>
                        </div>
                        <img className="right" src={new URL('./imgs/menu-main-title-arrow.svg', import.meta.url).href}/>
                    </div>
                    <div
                        className={`menu-item menu-item-1 ${menuActive >= 1 ? 'light' : ''}`}
                        onClick={() => this.selectMenu('1')}>
                        {/* <img src={new URL('./imgs/menu-bg.png', import.meta.url).href}/> */}
                        <img className="light" src={new URL('./imgs/light-btn.png', import.meta.url).href}/>
                        <div className="text"><img src={new URL('./imgs/create-icon.svg', import.meta.url).href}/>{t('build')}</div>
                    </div>
                    <img className="menu-line-arrow menu-line-arrow-1" src={new URL('./imgs/line-arrow.png', import.meta.url).href}/>
                    <div
                        className={`menu-item menu-item-2 ${menuActive >= 2 ? 'light' : ''}`}
                        onClick={() => this.selectMenu('2')}>
                        {/* <img src={new URL('./imgs/menu-bg.png', import.meta.url).href}/> */}
                        <img className="light" src={new URL('./imgs/light-btn.png', import.meta.url).href}/>
                        <div className="text"><img src={new URL('./imgs/view-icon.svg', import.meta.url).href}/>{t('visualize')}</div>
                    </div>
                    <img className="menu-line-arrow menu-line-arrow-2" src={new URL('./imgs/line-arrow.png', import.meta.url).href}/>
                    <div
                        className={`menu-item menu-item-3 ${menuActive >= 3 ? 'light' : ''}`}
                        onClick={() => this.selectMenu('3')}>
                        {/* <img src={new URL('./imgs/menu-bg.png', import.meta.url).href}/> */}
                        <img className="light" src={new URL('./imgs/light-btn.png', import.meta.url).href}/>
                        <div className="text"><img src={new URL('./imgs/play-icon.svg', import.meta.url).href}/>{t('simulate')}</div>
                    </div>
                    <img className="menu-line-arrow menu-line-arrow-3" src={new URL('./imgs/line-arrow.png', import.meta.url).href}/>
                    <div
                        className={`menu-item menu-item-3 ${menuActive >= 4 ? 'light' : ''}`}
                        onClick={() => this.selectMenu('4')}>
                        {/* <img src={new URL('./imgs/menu-bg.png', import.meta.url).href}/> */}
                        <img className="light" src={new URL('./imgs/light-btn.png', import.meta.url).href}/>
                        <div className="text"><img src={new URL('./imgs/use-icon.svg', import.meta.url).href}/>{t('apply')}</div>
                    </div>
                </div>
                <div
                    className="ontology-build-content">
                    {menuActive === '4' && <Step4/>}
                    {/* {menuActive === '3' && <Step3 push={this.props.push}/>} */}
                    {/* {menuActive === '2' && <Step2/>} */}
                    {menuActive === '3' && <OntologySimulate />}
                    {menuActive === '2' && <OntologyVisualize />}
                    {menuActive === '1' && <Step1 push={this.props.push} />}

                </div>
            </div>
        )
    }
}

export default withTranslation()(OntologyBuild);
