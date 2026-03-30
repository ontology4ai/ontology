import React, { useState, useEffect, useMemo } from 'react';
import { Spin, Tree } from '@arco-design/web-react';
import axios from 'modo-plugin-common/src/core/src/http';

import * as pdfjsLib from "pdfjs-dist/build/pdf.js";
import { PDFViewer, PDFLinkService, EventBus } from "pdfjs-dist/web/pdf_viewer.js";
import "pdfjs-dist/web/pdf_viewer.css";
import './style/index.less';

require('static/guid.js');

const env = process.env.NODE_ENV;
const rootPath = env === 'production' ? '/ontology/_file/ext/ontology/dist/_resource_' : '/static';
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `${rootPath}/lib/pdf-reader/js/pdf.worker.js`;

const host=`${window.location.host}`;
const protocol=`${window.location.protocol}`;

class Document extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            loading: true,
            outline: [],
            expandedKeys: []
        };
        this.pdfRef = React.createRef();
        this.linkServiceRef = React.createRef();
        this.pdfDocRef = React.createRef();
    }
    getData = () => {
    }
    previewPdf = async() => {
        let {
            file
        } = this.state;

        let container = this.pdfRef.current;
        const eventBus = new EventBus();

        const linkService = new PDFLinkService({
            container: container,
            eventBus, // 事件总线，用于传递页面跳转事件
        });

        this.linkServiceRef.current = linkService;

        let pdfViewer = new PDFViewer({
            container,
            eventBus,
            linkService: linkService,
            pageMode: 'outline', // 可选：默认显示大纲
            scale: 1.0 * (window.devicePixelRatio || 1), // 基础缩放 × 像素比（提升物理像素）
            renderInteractiveForms: true, // 优化表单/文字渲染清晰度
            disableAutoFetch: false,
            maxCanvasPixels: Infinity, // 取消 Canvas 像素限制（避免高清渲染被截断）
        });

        linkService.setViewer(pdfViewer);

        const pdf = await pdfjsLib.getDocument(`${rootPath}/lib/pdf-reader/data/数智本体平台应用指南.pdf`).promise;

        this.pdfDocRef.current = pdf;

        const outline = await pdf.getOutline();

        this.parseOutline(outline);
        pdfViewer.setDocument(pdf);
        linkService.setDocument(pdf);
    }
    parseOutline = (data) => {
        let expandedKeys = [];
        const genId = (node => {
            node.id = guid();
            expandedKeys.push(node.id);
            if (Array.isArray(node.items)) {
                node.items.forEach(n => {
                    genId(n);
                })
            }
        })
        data.forEach(node => {
            genId(node);
        })
        this.setState({
            outline: data,
            expandedKeys,
            loading: false
        })
    }
    init = () => {
        this.previewPdf();
    }
    componentDidUpdate(prevProps, prevState) {
    }
    componentDidMount() {
        this.init();
    }
    render() {
        const {
            loading,
            outline,
            expandedKeys
        } = this.state;
        return (
            <Spin
                className="ontology-document-spin"
                loading={loading}
                tip='正在载入，请稍后...' >
                <div
                    className="ontology-document">
                    <div
                        className="pdf-outline">
                        <Tree
                            treeData={outline}
                            fieldNames={{
                                key: 'id',
                                title: 'title',
                                children: 'items',
                            }}
                            expandedKeys={expandedKeys}
                            onExpand={(keys) => {
                                this.setState({
                                    expandedKeys: keys
                                })
                            }}
                            onSelect={async (selectedKeys, extra) => {
                                const item = extra.node.props;
                                if (item.dest) {
                                    this.linkServiceRef.current.goToDestination(item.dest);
                                } else if (item.action) {
                                    this.linkServiceRef.current.executeAction(item.action);
                                }
                            }}/>
                    </div>
                     <div
                        className="pdf-viewer-container">
                        <div
                            className="pdf-viewer"
                            ref={this.pdfRef}>
                            <div
                                className="pdfViewer">
                            </div>
                        </div>
                    </div>
                </div>
            </Spin>
        )
    }
}


export default Document;