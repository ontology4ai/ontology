import React, { useState, useEffect, useMemo } from 'react';
import { Select,Tooltip,Button} from "@arco-design/web-react";
// import { IconRefresh } from '@arco-design/web-react/icon';
import { IconRefresh } from 'modo-design/icon';
import './style/index.less';
import { debounce } from 'lodash';

const Option = Select.Option;
class SelectRefresh extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            isSelect:props.defaultSelect,
            optionsNew:props.options,
        };
    }
    hadelRefresh = () => {
     let self={...this.props,...this.props.thisEvent}
     console.log('this',this,self)
    }
    componentDidMount() {
    }
    componentDidUpdate(prevProps) {
    }
    render() {
        return (
            <div className='modo-select-input'>
                     <div className='modo-select-input-box'>
                         <Select 
                            {...this.props}>
                            </Select>
                     </div>
                     <Tooltip position='bottom'  content='刷新重新获取下拉框接口'>
                     <Button type='secondary' icon={ <IconRefresh /> }  onClick={()=>{
                        typeof this.props.handelRefresh === 'function' && this.props.handelRefresh({...this.props,...this.props?.thisEvent});
                    }}/>
                          </Tooltip>
            </div>
        );
    }
}

export default SelectRefresh;
