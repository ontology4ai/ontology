import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Typography ,Link} from '@arco-design/web-react';

import remarkGfm from 'remark-gfm';
import rehypeRaw from "rehype-raw";

//const { Link } = Typography;

interface MarkdownRenderProps {
    content: string;
}

const MarkdownRender: React.FC<MarkdownRenderProps> = ({ content }) => {
    return (
        <div className="markdown-body">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                    code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                            <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                            >
                                {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                        ) : (
                            <code className="inline-code" {...props}>
                                {children}
                            </code>
                        );
                    },
                    // --- 修复重点 ---
                    a: ({ node, className, href, children, ...rest }) => {
                        // 1. 显式解构 href 和 children，避免传入无关 props (如 node)
                        // 2. 检查 href 是否存在，rehype-raw 可能会产生只有锚点没有 href 的情况
                        if (!href) return <span>{children}</span>;

                        return (
                            <Link 
                                href={href} 
                                target="_blank" 
                                // status="success" // 可选：Arco Link 的样式属性
                            >
                                {children}
                            </Link>
                        );
                    },
                    blockquote: ({ node, children, ...props }) => (
                         // 显式解构 children，丢弃 node 属性
                        <blockquote {...props}>
                            {children}
                        </blockquote>
                    )
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownRender;