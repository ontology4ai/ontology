import React, { useState, useEffect, useMemo } from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
 
    static getDerivedStateFromError(error) {
        return { hasError: true };
    }
 
    componentDidCatch(error, errorInfo) {
        console.error(error, errorInfo);
    }
 
    render() {
        if (this.state.hasError) {
            return <span>{this.props.info || '渲染失败'}</span>;
        }
 
        return this.props.children; 
    }
}

export default ErrorBoundary