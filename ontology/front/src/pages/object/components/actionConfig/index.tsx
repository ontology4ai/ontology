import React, {forwardRef, useEffect, useState,useImperativeHandle} from 'react';
import { connect } from 'react-redux';
import useLocale from 'modo-plugin-common/src/utils/useLocale';
import {Form, Tooltip, Select, Input, Typography, Checkbox, TableColumnProps, Message} from '@arco-design/web-react';
import i18n from '../../locale';

import {
    IconHelpColor
} from "modo-design/icon";

import createIcon from '../../images/created-color.svg';
import deleteIcon from '../../images/delete-color.svg';
import editIcon from '../../images/edit-color.svg';
import DropdownMultiSelect from '@/components/dropdownMultiSelect';

import './index.less';
const actionConfig = (props,ref) => {
    const t = useLocale();
    const loginT = useLocale(i18n);
    const [actions,setActions]=useState(['create','update','delete']);
    const [actionUsers,setActionUsers]=useState([]);
    const [userOptions,setUserOptions]=useState([  {id:'hulin',  value: 'hulin', label: '胡林' }]);
    useEffect(() => {

    }, []);
    const getActionData =()=>{
        return {
            actions,
            actionUsers
        }
    }

    const validate = async ()=>{
        let valid = true;

        return valid;
    }
    useImperativeHandle(ref,()=>({
        getActionData,
        validate
    }))
    return (
      <div className='actionConfig-container' style={{display: props.isShow? 'flex' : 'none'}}>
          <div className="action-setting-head">
              <div>
                  <div className="dot"/>
                  选择动作类型
                  <Tooltip content=''> <IconHelpColor style={{marginLeft: 3}}/></Tooltip>
              </div>
          </div>
          <div className="action-list">
              <Checkbox.Group value={actions} onChange={setActions}>
                  <Checkbox value='create'>
                      <div className="check-content">
                          <div className="action-icon"><img src={createIcon} alt=""/></div>
                          <div className="action-content">
                              <div className="action-title">创建[{props.objectData?.objectTypeLabel}]对象实例</div>
                              <div className="action-detail">
                                  <Typography.Text type='secondary'>新增对象实例，维护各属性信息</Typography.Text>
                              </div>
                          </div>
                      </div>
                  </Checkbox>
                  <Checkbox value='update'>
                      <div className="check-content">
                          <div className="action-icon"><img src={editIcon} alt=""/></div>
                          <div className="action-content">
                              <div className="action-title">编辑[{props.objectData?.objectTypeLabel}]对象实例</div>
                              <div className="action-detail">
                                  <Typography.Text type='secondary'>编辑已有实例的属性信息</Typography.Text>
                              </div>
                          </div>
                      </div>
                  </Checkbox>
                  <Checkbox value='delete'>
                      <div className="check-content">
                          <div className="action-icon"><img src={deleteIcon} alt=""/></div>
                          <div className="action-content">
                              <div className="action-title">删除[{props.objectData?.objectTypeLabel}]对象实例</div>
                              <div className="action-detail">
                                  <Typography.Text type='secondary'>删除已有实例</Typography.Text>
                              </div>
                          </div>
                      </div>
                  </Checkbox>
              </Checkbox.Group>
          </div>
          <div className="action-object">
              <div className="action-title">
                  <Typography.Text type='secondary'>选择可以执行这些活动类型的用户或团队</Typography.Text>
              </div>
             {/* <Select
                allowClear
                placeholder='Search users or groups'
                mode={'multiple'}
                value={actionUsers} onChange={setActionUsers}
                options={userOptions}
                showSearch
              />*/}
              <DropdownMultiSelect
                options={userOptions}
                selectedValues={actionUsers}
                onChange={setActionUsers}
                placeholder="Search users or groups"
                searchPlaceholder="请输入"
              />
          </div>

      </div>
    )
};

export default forwardRef(actionConfig);
