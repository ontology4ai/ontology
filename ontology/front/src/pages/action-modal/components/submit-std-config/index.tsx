import React, {forwardRef, useEffect, useState,useImperativeHandle} from 'react';
import { connect } from 'react-redux';
import useLocale from 'modo-plugin-common/src/utils/useLocale';
import {Form, Tooltip, Select, Input, Typography, Tabs, TableColumnProps, Message, Alert} from '@arco-design/web-react';
import i18n from '../../locale';
import DropdownMultiSelect from '@/components/dropdownMultiSelect';

import './index.less';
import {IconInformationColor} from "modo-design/icon";
const TabPane = Tabs.TabPane;
const actionConfig = (props,ref) => {
    const t = useLocale();
    const loginT = useLocale(i18n);
    const [actionUsers,setActionUsers]=useState([]);
    const [actionTeams,setActionTeams]=useState([]);
    const [userOptions,setUserOptions]=useState([  {id:'hulin', value: 'hulin', label: '胡林' },]);
    const [teamOptions,setTeamOptions]=useState([  {id:'1', value: 'team1', label: '团队1' },]);
    const [activeTab, setActiveTab] = useState('user');
    useEffect(() => {

    }, []);
    const getActionStdData =()=>{
        return {
            activeTab,
            actionUsers,
            actionTeams
        }
    }

    const validate = async ()=>{
        let valid = true;

        return valid;
    }
    useImperativeHandle(ref,()=>({
        getActionStdData,
        validate
    }))
    return (
      <div className='action-std-container' style={{display: props.isShow? 'flex' : 'none'}}>
          <Tabs activeTab={activeTab} onChange={setActiveTab}>
              <TabPane key='user' title='用户'>
                  <div className="action-tab">
                      <div className="action-title">
                          用户
                      </div>
                      <DropdownMultiSelect
                        options={userOptions}
                        selectedValues={actionUsers}
                        onChange={setActionUsers}
                        placeholder="请选择"
                        searchPlaceholder="请输入"
                      />
                      <Alert className='action-alert' icon={<IconInformationColor/>} content='保存后您可以在动作类型详情中，通过【提交标准】设置更复杂的动作类型执行的条件。' />
                  </div>
              </TabPane>
              <TabPane key='team' title='团队' disabled={true}>
                  <div className="action-tab">
                      <div className="action-title">
                          团队
                      </div>
                      <DropdownMultiSelect
                        options={teamOptions}
                        selectedValues={actionTeams}
                        onChange={setActionTeams}
                        placeholder="请选择"
                        searchPlaceholder="请输入"
                      />
                  </div>
              </TabPane>
          </Tabs>

      </div>
    )
};

export default forwardRef(actionConfig);
