import React, { useState, useEffect, useMemo } from 'react';
import useClassLocale from 'modo-plugin-common/src/utils/useClassLocale';
import { GlobalContext } from 'modo-plugin-common/src/utils/context';
import locale from './locale';

export let testData = (t, testT) => {
    return t('查询');
}
let t;
let testT;
class TestClass extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
        };
        //this.tRef = React.createRef();
        //this.testTRef = React.createRef();
    }
    getData = () => {
        //const t = this.tRef.current;
        //const testT = this.testTRef.current;
        console.log(t('查询'));
    }
    componentDidMount() {
    }
    render() {
        t = useClassLocale(this.context); //使用全局语言
        testT = useClassLocale(this.context, locale); //使用组件个性化语言
        // const testT = useClassLocale(this.context, locale); //使用组件个性化语言
        // const t = useClassLocale(this.context); //使用全局语言
        // const testT = useClassLocale(this.context, locale); //使用组件个性化语言
        // this.tRef.current = t;
        // this.testTRef.current = testT;
        console.log(testData(t, testT));
        return (
            <div>
                <div>{t('查询')}</div>
                <div>{testT(' 查询')}</div>
                <div>{testT('测试第三方页面')}</div>
                <div>{testData(t, testT)}</div>
                <button onClick={this.getData}>{t('查询')}</button>
            </div>
        )
    }
}

TestClass.contextType = GlobalContext;

export default TestClass;