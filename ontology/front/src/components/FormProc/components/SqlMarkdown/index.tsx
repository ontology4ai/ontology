import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Button, Message } from '@arco-design/web-react';
import {IconCopyColor} from 'modo-design/icon';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coldarkDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import eventBus from 'modo-plugin-common/src/core/src/utils/modoEventBus';
import 'highlight.js/styles/atom-one-dark.css';

import 'github-markdown-css/github-markdown-light.css'

import copy from 'copy-to-clipboard'

import './style/index.less';

const global = require('global');
let Arco = global.Arco;
if (global !== global.parent && global.parent.Arco) {
    Arco = global.parent.Arco
}

class Code extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            currentContent: ''
        };
        this.markdownRef = React.createRef();
    }
    componentDidUpdate(prevProps) {
    }
    componentDidMount() {
    }
    render() {
        let {
            lang,
            headerHidden,
            className,
            content,
            editorKey,
            originText,
            range,
            insertVisible,
            onDiff,
            onInsert
        } = this.props;
        const customKeywords = [
            {
                pattern: /\*cursor\*/g,
                type: 'keyword'
            },
        ];
        return (
            <pre
                className="modo-markdown"
                // contenteditable="true"
                ref={this.markdownRef}>
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                        code(props) {
                            const {children, className, node, ...rest} = props
                            const match = /language-(\w+)/.exec(className || '');
                            // console.log(children[children.length - 1]);
                            const lastStr = children[children.length - 1];
                            if (!Array.isArray(match) && typeof lastStr === 'string' && lastStr.indexOf('*cursor*') > -1) {
                                children[children.length - 1] = lastStr.replace('*cursor*', '');
                                children.push(<span className="text-with-cursor"></span>)
                            }
                            return !Array.isArray(match) ? (
                                <code
                                    {...rest}
                                    className={className}>
                                    {children}
                                </code>
                            ) : (
                                <pre className="code">
                                    <div
                                        className={'language-code ' + match[1]}>
                                        <pre className="content">
                                            <SyntaxHighlighter
                                                {...rest}
                                                PreTag="div"
                                                children={String(children).replace(/\n$/, '')}
                                                language={match[1]}
                                              />
                                        </pre>
                                        <div
                                            className="footer">
                                            <span
                                                className="language">
                                                {match[1]}
                                            </span>
                                            <Arco.Button
                                                size="mini"
                                                type="text"
                                                onClick={() => {
                                                    copy(children[0]);
                                                    Message.info('复制成功')
                                                }}>
                                                复制
                                            </Arco.Button>
                                            <Arco.Button
                                                size="mini"
                                                type="text"
                                                onClick={() => {
                                                    if (typeof onInsert === 'function') {
                                                        onInsert(children[0], range)
                                                    }
                                                }}>
                                                插入
                                            </Arco.Button>
                                            <Arco.Button
                                                size="mini"
                                                type="text"
                                                onClick={() => {
                                                    if (typeof onDiff === 'function') {
                                                        onDiff(children[0], originText, range)
                                                    }
                                                }}>
                                                对比
                                            </Arco.Button>
                                        </div>
                                    </div>
                                </pre>
                            )
                        }
                    }}>
                    { content }
                </ReactMarkdown>
            </pre>
        )
    }
};

export default Code;
