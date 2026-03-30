import '@wangeditor/editor/dist/css/style.css' // 引入 css

import React, { useState, useEffect } from 'react';
import cs from '@arco-design/web-react/lib/_util/classNames';
import { Editor, Toolbar } from '@wangeditor/editor-for-react'
import { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'
import './style/index.less';

function RichEditor(props) {
    const [editor, setEditor] = useState<IDomEditor | null>(null)   // TS 语法

    const [html, setHtml] = useState('')

    useEffect(() => {
        setHtml(props.value);
    }, [props.value])

    const toolbarConfig: Partial<IToolbarConfig> = {
        /* toolbarKeys: [
            'headerSelect',
        ] */
    }

    const editorConfig: Partial<IEditorConfig> = {
        placeholder: '请输入内容...',
    }

    useEffect(() => {
        return () => {
            if (editor == null) return
            editor.destroy()
            setEditor(null)
        }
    }, [editor])

    const classNames = cs(
        'modo-rich',
        {
            ['rich-preview']: props.preview,
            ['rich-editor']: !props.preview,
        },
        props.className
    );

    const {
        value,
        ...rest
    } = props;

    return (
        <>
            {
                props.preview ? 
                <div
                    {...rest}
                    className={classNames}
                    style={props.style}>
                    {rest.children}
                    <span
                        dangerouslySetInnerHTML={{
                            __html: html
                        }}>
                    </span>
                </div>
                :
                <div
                    {...rest}
                    className={classNames}
                    style={props.style}>
                    {rest.children}
                    <Toolbar
                        className="rich-editor-toobar"
                        editor={editor}
                        defaultConfig={toolbarConfig}
                        mode="default"
                    />
                    <Editor
                        className="rich-editor-content"
                        defaultConfig={editorConfig}
                        value={html}
                        onCreated={setEditor}
                        onChange={editor => {
                            const html = editor.getHtml();
                            setHtml(html)
                            const {
                                onChange
                            } = props;
                            typeof onChange === 'function' && onChange(html);
                        }}
                        mode="default"
                    />
                </div>
            }
        </>
    )
}

export default RichEditor;
