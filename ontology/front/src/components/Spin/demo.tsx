import React from 'react';
import loadingGif from './imgs/loading.gif';
import loadingGif1 from './imgs/loading-1.gif';
import loadingGif2 from './imgs/loading-2.gif';
import loadingGif3 from './imgs/loading-3.gif';
import loadingSvg from './imgs/loading.svg';
import Spin from '@/components/Spin';
import { Spin as Loading } from '@arco-design/web-react';
import './style/index.less';

class Demo extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
        };
    }
    render() {
        // return 'xxxx';
    	return (
            <>
            <Loading
                loading={true}
                tip="加载中...">
                <div
                    style={{
                        width: '200px',
                        height: '200px',
                        marginRight: '10px',
                        background: 'var(--color-gray-2)'
                    }}>
                    哈哈
                </div>
            </Loading>
            <Spin
                loading={true}
                tip="加载中...">
                <div
                    style={{
                        width: '200px',
                        height: '200px',
                        marginRight: '10px',
                        background: 'var(--color-gray-2)'
                    }}>
                    哈哈
                </div>
            </Spin>
            <Spin
                loading={true}
                res={loadingGif1}
                tip="加载中...">
                <div
                    style={{
                        width: '200px',
                        height: '200px',
                        marginRight: '10px',
                        background: 'var(--color-gray-2)'
                    }}>
                    哈哈
                </div>
            </Spin>
            <Spin
                loading={true}
                res={loadingGif2}
                tip="加载中...">
                <div
                    style={{
                        width: '200px',
                        height: '200px',
                        marginRight: '10px',
                        background: 'var(--color-gray-2)'
                    }}>
                    哈哈
                </div>
            </Spin>
            <Spin
                loading={true}
                res={loadingGif3}
                tip="加载中...">
                <div
                    style={{
                        width: '200px',
                        height: '200px',
                        marginRight: '10px',
                        background: 'var(--color-gray-2)'
                    }}>
                    哈哈
                </div>
            </Spin>
            <Spin
                loading={true}
                res={loadingSvg}
                tip="加载中...">
                <div
                    style={{
                        width: '200px',
                        height: '200px',
                        background: 'var(--color-gray-2)'
                    }}>
                    哈哈
                </div>
            </Spin>
            </>
	    )
    }
};

export default Demo;
