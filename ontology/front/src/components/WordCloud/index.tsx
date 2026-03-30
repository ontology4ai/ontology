import React, { useState, useEffect, useMemo } from 'react';
import ResizeObserver from '@arco-design/web-react/es/_util/resizeObserver';

const d3 = require('d3');
const cloud = require('d3-cloud');

class WordCloud extends React.Component {
    constructor(props: any) {
        super(props);
        this.cloud = React.createRef();
        this.state={
        	wordList: []
        }
    }
    renderCloud = (option) => {
    	let theSize = option.size;
        let theWordList = option.wordList;
        let theSvgElement = option.svgElement;

        let layout = cloud()
            .size(theSize)
            .words(this.state.wordList)
            .padding(0)
            // .rotate(function () {return 0})
            // .rotate(function() { return Math.round(Math.random()) * 90 })
            // .rotate(function() { return Math.random() * 90 })
            .font(`'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', SimSun, sans-serif`)
            .fontSize(function (d) {return d.size;})
            .on('end', draw);

        layout.start();

        function draw(words) {
            d3.select(theSvgElement).select('svg').remove();
            let color = d3.scaleOrdinal(d3.schemePaired);
            d3.select(theSvgElement)
                .append('svg')
                .attr('width', layout.size()[0])
                .attr('height', layout.size()[1])
                .append('g')
                .attr('transform', 'translate(' + layout.size()[0] / 2 + ',' + layout.size()[1] / 2 + ')')
                .selectAll('text')
                .data(words)
                .enter().append('text')
                .style('font-size', function (d) {
                    return d.size + 'px';
                })
                .style('font-family', `'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', SimSun, sans-serif`)
                .style('cursor', 'pointer')
                .style('fill', function (d, i) {
                    return color(i);
                })
                .attr('text-anchor', 'middle')
                .attr('transform', function (d) {
                    return 'translate(' + [d.x, d.y] + ') rotate(' + d.rotate + ')';
                })
                .text(function (d) {
                    return d.text;
                })
                // 添加点击的回调方法
                .on("click", function(e, node) {
                    
                })
        }
    }
    initCloud = () => {
    	this.initData();
        this.renderCloud({
            wordList: this.state.wordList,
            size: [
                this.cloud.current.offsetWidth,
                this.cloud.current.offsetHeight
            ],
            svgElement: this.cloud.current
        })
    }
    initData = () => {
        this.refreshData();
    }
    refreshData = () => {
        this.data = Array.isArray(this.props.data) ? [].concat(this.props.data) : [];

        this.state.wordList.splice(0, this.state.wordList.length, ...this.data.map(word => {
            return Object.assign({}, word, {
                text: this.props.text ? word[this.props.text] : word.text,
                size: this.props.weight ? word[this.props.text] : word.weight || (12 + Math.random() * 6)
            })
        }));
        this.setState({
            wordList: this.state.wordList
        });
    }
    componentDidMount() {
        setTimeout(this.initCloud);
    }
    componentDidUpdate(prevProps) {
        if (JSON.stringify(this.props.data) !== JSON.stringify(this.data)) {
            this.refreshData();
            this.initCloud();
        }
    }
    render() {
    	const {
            data,
            ...props
        } = this.props;
    	return (
    		<div
                {...props}
                className={[
                    'modo-word-cloud',
                    this.props.className
                ].join(' ')}>
                <ResizeObserver
                    onResize={(e) => {
                        this.initCloud();
                    }}>
        			<div
                        ref={this.cloud}
                        style={{
                            width: '100%',
                            height: '100%'
                        }}>
                    </div>
                </ResizeObserver>
    	    </div>
    	)
    }
}

export default WordCloud;