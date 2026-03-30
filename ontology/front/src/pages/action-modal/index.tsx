import React, { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import useLocale from 'modo-plugin-common/src/utils/useLocale';
import { Modal, Button, Radio, Steps, Typography, Message } from '@arco-design/web-react';
import i18n from './locale';

import ActionType from './components/action-type';
import ParamMapping from './components/param-mapping';
import MetaConfig from './components/meta-config';
import SubmitStdConfig from './components/submit-std-config';

import './style/index.less';
import { saveAction } from './api';

const { Step } = Steps;
const Object = props => {
  const t = useLocale();
  const loginT = useLocale(i18n);
  const [stepModalVisible, setStepModalVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [actionType, setActionType] = useState(null);
  const actionTypeRef = useRef();
  const paramMappingRef = useRef();
  const metaConfigRef = useRef();
  const submitStdRef = useRef();
  const stepsDetail = [
    {
      index: 1,
      stepName: '动作类型选择',
      stepLabel: '选择动作类型执行的主体和范围',
      stepDesc: '允许用户通过执行动作类型实现针对本体资源的修改',
    },
    {
      index: 2,
      stepName: '参数映射',
      stepLabel: '映射动作参数',
      stepDesc: '这些参数将作为执行当前动作的输入',
    },
    {
      index: 3,
      stepName: '元数据配置',
      stepLabel: '配置动作类型的元数据',
      stepDesc: '设置动作类型的标题和描述',
    },
   /* {
      index: 4,
      stepName: '提交标准配置',
      stepLabel: '配置可执行当前动作类型的用户',
      stepDesc: '选择用户或团队分配允许执行此动作类型的权限',
    },*/
  ];
  useEffect(() => {}, []);

  //创建的数据
  const createAction = async() => {
    setLoading(true);
    let valid = await metaConfigRef?.current?.validate();
    if (!valid) {
      await setLoading(false);
      return;
    }
    const objActionType = actionType?.actionType||'';
    const param = {
      ontologyId: props.ontology.id,
      ...actionType,
      ...metaConfigRef.current?.getMetaData(),
      params: objActionType == 'delete'?[]:paramMappingRef.current?.getParamMapingData(),
      buildType: 'object',
      actionUsers:[]
    };
   /* const actionStd = submitStdRef.current.getActionStdData();
    if (actionStd.activeTab == 'user') {
      param.actionUsers = actionStd.actionUsers;
    }*/

    saveAction(param)
      .then(res => {
        if (res.data.success) {
          Message.success('创建成功');
          setStepModalVisible(false);
          props.close && props.close();
          setTimeout(() => {
            props.afterCreated && props.afterCreated(props.ontology.id, res.data.data);
          });
        } else {
          Message.error('创建失败');
        }
      })
      .catch(err => {
        console.log(err);
        Message.error('创建失败！');
      })
      .finally(() => {
        setLoading(false);
      });
  };
  //下一步
  const next = async () => {
    let val = true;
    if (step == 1) {
      val = await actionTypeRef?.current?.validate();
    } else if (step == 2) {
      val = await paramMappingRef?.current?.validate();
    } else if (step == 3) {
      val = await metaConfigRef?.current?.validate();
    }
    if (val) {
      if (step == 1) {
        const data = actionTypeRef.current.getActionTypeData();
        setActionType(data);
      }
      setStep(step + 1);
    }
  };

  return (
    <div>
      <Modal
        title={<div style={{ textAlign: 'left', fontWeight: 600 }}>创建一个动作</div>}
        unmountOnExit
        style={{ width: '960px' }}
        visible={stepModalVisible}
        footer={null}
        onCancel={() => {
          setStepModalVisible(false);
          props.close && props.close();
        }}
        autoFocus={false}
        focusLock
        className="action-step-modal"
      >
        <div className="create-step-container">
          <div className="step-left">
            <Steps direction="vertical" current={step} style={{ width: 170 }}>
              {stepsDetail.map((item: any) => (
                <Step key={item.index} title={item.stepName} />
              ))}
            </Steps>
          </div>
          <div className="step-right">
            <div className="step-desc">
              <div className="step-index">{step}</div>
              <div className="step-text">{stepsDetail[step - 1].stepLabel}</div>
              {stepsDetail[step - 1].stepDesc ? (
                <Typography.Text type="secondary">{stepsDetail[step - 1].stepDesc}</Typography.Text>
              ) : (
                ''
              )}
            </div>
            <div className="step-config">
              <ActionType ref={actionTypeRef} isShow={step == 1} ontologyId={props.ontology?.id} />
              <ParamMapping
                ref={paramMappingRef}
                isShow={step == 2}
                ontologyId={props.ontology?.id}
                actionType={actionType}
              />
              <MetaConfig ref={metaConfigRef} isShow={step == 3} ontologyId={props.ontology?.id} />
              <SubmitStdConfig ref={submitStdRef} isShow={step == 4} />
            </div>
            <div className="step-footer-btn">
              {step > 1 ? (
                <Button
                  onClick={() => {
                    setStep(step - 1);
                  }}
                >
                  上一步
                </Button>
              ) : (
                ''
              )}
              {step == stepsDetail.length ? (
                <Button type="primary" onClick={createAction} loading={loading}>
                  创建
                </Button>
              ) : (
                <Button type="primary" onClick={next}>
                  下一步
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default connect(state => ({
  identity: state.identity,
}))(Object);
