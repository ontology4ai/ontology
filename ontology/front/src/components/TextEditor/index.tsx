import React, { useState, useEffect, useMemo } from 'react';
import { Select, Typography } from "@arco-design/web-react";
import * as iconMap from 'modo-design/icon';
import './style/index.less';

class TextEditor extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
        };
    }
    componentDidMount() {
    }
    componentDidUpdate(prevProps) {
    }
    render() {
        return (
            <Typography.Text
                editable={{
                  onChange: this.props.onChange
                }}>
                {this.props.value}
            </Typography.Text>
        );
    }
}

export default TextEditor;
