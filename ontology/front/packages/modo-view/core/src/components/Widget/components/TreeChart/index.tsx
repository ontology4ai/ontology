import React from 'react';
import wrapHOC from '../../hoc/wrap';
import TreeChart from '@/components/TreeChart';

class ModoTreeChart extends React.Component {
    constructor(props: any) {
        super(props);
        this.treeChartRef = React.createRef();
    }
    componentDidMount() {
        this.props.dispatch({
            type: 'SETREF',
            name: this.props.name,
            ref: this
        });
    }
    componentWillUnmount() {
        this.props.dispatch({
            type: 'DELETEREF',
            name: this.props.name
        });
    }
    loadData(...args) {
        this.treeChartRef.current.loadData(...args);
    }
    zoomToFit(...args) {
        this.treeChartRef.current.zoomToFit(...args);
    }
    centerNode(...args) {
        this.treeChartRef.current.centerNode(...args);
    }
    scrollToNode(...args) {
        this.treeChartRef.current.scrollToNode(...args);
    }
    getSelection(...args) {
        this.treeChartRef.current.getSelection(...args);
    }
    getNode(...args) {
        this.treeChartRef.current.getNode(...args);
    }
    addNode(...args) {
        this.treeChartRef.current.addNode(...args);
    }
    deleteNode(...args) {
         this.treeChartRef.current.deleteNode(...args);
    }
    render() {
        if (window.abc) {
            console.log(`render-tree-chart-${this.props.nodeKey}`);
        }
        return (
            <TreeChart
                ref={this.treeChartRef}
            	readOnly={this.props.editable}
                {...this.props}
                className={[this.props.className, (this.props.editable ? 'readOnly' : '')].join(' ')}
                contextMenus={
                    this.props.contextMenus.map(menu => {
                        return {
                            ...menu,
                            event: (...args) => {
                                this.props.dispatchEvent(menu.event, ...args)
                            }
                        }
                    })
                }/>
        )
    }
}

export default wrapHOC(ModoTreeChart, 'modoTreeChart');
