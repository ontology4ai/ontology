import React, { useState, useEffect, useMemo } from 'react';
import { Select,Input,Button} from "@arco-design/web-react";
import { IconEdit } from '@arco-design/web-react/icon';
import { IconBack} from 'modo-design/icon';
import './style/index.less';
import { debounce } from 'lodash';

const Option = Select.Option;
class SelectInput extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            isSelect:props.defaultSelect,
            inputVal:'',
            optionsNew:props.options,
        };
        this.doSearchAjax = debounce(this.doSearchAjax, 500)
    }
    handleInputSearch = e => {
        this.doSearchAjax(e)
    }
    doSearchAjax = value => {
        if(typeof this.props.onSearch === 'function'){
            this.props.onSearch(this,value)
        }
    }
    chageType = () => {
        this.setState({
            isSelect:!this.state.isSelect,
        })
    }
    // debouncedFetchUser = (value)=> {
    //     console.log('1333',value)
    //     setTimeout(()=>{
    //         this.setState({
    //             inputVal:value,
    //         });
    //     },100)
       
    //     if(!this.mydebounce){
    //         this.mydebounce=debounce(() => {this.handlerClick(value)},500)
    //       }
    //       this.mydebounce()
    //   }
    // handlerClick = (value)=>{
    // console.log('1',this.props,value)
    // if(typeof this.props.onSearch === 'function'){
    //     this.props.onSearch(this,value)
    // }
    // }
    componentDidMount() {
    }
    componentDidUpdate(prevProps) {
    }
    render() {
        const {
            isSelect,
            inputVal,
            optionsNew
        } = this.state
        return (
            <div className='modo-select-input'>
                     <div className='modo-select-input-box'>
                        { !isSelect &&   <Input   {...this.props}  allowClear  /> }
                        {
                            isSelect &&   <Select 
                            {...this.props}
                            allowClear
                            options={optionsNew}
                            className = 'select'
                            onSearch={(value)=>this.handleInputSearch(value)}
                            >
                            {/* {optionsNew.map((option) => (
                                <Option key={option.value} value={option.value}>
                                {option.label}
                                </Option>
                            ))} */}
                            </Select>
                        }
                     </div>
                     <Button type='secondary' icon={isSelect? <IconEdit /> : <IconBack /> }  onClick={() => this.chageType() }/>
            </div>
        );
    }
}

export default SelectInput;
