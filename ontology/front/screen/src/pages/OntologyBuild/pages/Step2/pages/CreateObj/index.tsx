import React, { useState, useEffect, useMemo } from 'react'
import { Drawer }  from '@arco-design/web-react';

class CreateObj extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        };
    }
    render() {
        const {
        } = this.state;
        return (
            <>
                <Drawer
                    visible={true}
                    className="create-obj-drawer"
                    title={<span>新建对象</span>}
                    getPopupContainer={() => {
                        return document.querySelector('.screen-content')
                    }}>
                    xxx
                </Drawer>
            </>
        )
    }
}

export default CreateObj;
