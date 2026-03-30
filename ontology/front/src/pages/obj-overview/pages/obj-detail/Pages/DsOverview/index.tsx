import Table from '@/components/Table';
import { Modal } from '@arco-design/web-react';
import { } from 'modo-design';
import { } from 'modo-design/icon';
import React from 'react';
import { getData } from './api';
import './style/index.less';

class DsOverview extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            modalVisible: false,
            loading: true,
            columns: [],
            data: [],
        }
    }
    getData = () => {
        this.setState({
            loading: true
        });
        getData({
            objectTypeId: this.props.object.id
        }).then(res => {
            if (Array.isArray(res.data.data.titles)) {
                const filterAttr = this.props.object.attributes.filter(item => res.data.data.titles.includes(item.fieldName))
                const cols = filterAttr.map(attribute => {
                    return {
                        dataIndex: attribute.fieldName,
                        title: (
                            <div
                                className="column-title">
                                <div
                                    className="title">
                                    {attribute.attributeName}
                                </div>
                                <div
                                    className="descr">
                                    {attribute.fieldType}
                                </div>
                            </div>
                        )
                    }
                })
                // 实现最多展示10个字段，多余的默认隐藏
                if (cols.length > 10) {
                    for(const item of cols.slice(10)) {
                        item.defaultHidden = true;
                    }
                }
                this.setState({
                    columns: cols,
                    data: res.data.data.datas
                })
            }
        }).finally(() => {
            this.setState({
                loading: false
            })
        })
    }
    componentDidMount() {
    }
    componentDidUpdate(prevProps) {
        if (prevProps.visible !== this.props.visible) {
            if (this.props.visible) {
                this.getData()
            }
            this.setState({
                modalVisible: this.props.visible
            })
        }
    }
    render() {
        const {
            modalVisible,
            loading,
            columns,
            data
        } = this.state;
        const {
            object,
            visible
        } = this.props;
        return (
            <>
                <Modal
                    wrapClassName="ds-overview-modal"
                    title={
                        <div
                            style={{
                                textAlign: 'left'
                            }}>
                            {object.tableName}
                        </div>
                    }
                    footer={null}
                    unmountOnExit={true}
                    visible={modalVisible}
                    onCancel={() => {
                        this.setState({
                            modalVisible: false,
                            columns: [],
                            data: []
                        })
                        this.props.visibleChange(false)
                    }}
                    onOk={() => {
                        this.setState({
                            modalVisible: false,
                            columns: [],
                            data: []
                        })
                        this.props.visibleChange(false)
                    }}>
                    <div
                        className="ds-overview">
                        <Table
                            scroll={{
                                y: true
                            }}
                            loading={loading}
                            hiddenFooter={false}
                            columns={[
                                {
                                    dataIndex: 'index',
                                    title: '序列',
                                    width: 60,
                                    render: (col, row, index) => {
                                        return index + 1
                                    }
                                },
                                ...columns
                            ]}
                            data={data}
                            pagination={{
                                size: 'mini',
                                pageSize: 20
                            }}/>
                    </div>
                </Modal>
                
            </>
        )
    }
}

export default DsOverview;