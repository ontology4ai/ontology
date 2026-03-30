import React, { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import useLocale from 'modo-plugin-common/src/utils/useLocale';
import { Modal, Button, Radio, Steps, Typography, Message } from '@arco-design/web-react';
import i18n from './locale';

import srcIcon from './images/srcIcon.svg';
import noSrcIcon from './images/noSrcIcon.svg';
import DataSource from './components/sourceChoose';
import MetaData from './components/metaDataSet';
import AttrConfig from './components/attrConfig';
import ActionConfig from './components/actionConfig';
import AttrExtendConfig from './components/attrExtendConfig';

import './style/index.less';
import { saveObjectType,getInterfaceData } from './api';

const { Step } = Steps;
const Object = props => {
  const t = useLocale();
  const loginT = useLocale(i18n);
  const [loading, setLoading] = useState(false);
  const [objectModalVisible, setObjectModalVisible] = useState(false);
  const [objStepModalVisible, setObjStepModalVisible] = useState(true);
  const [step, setStep] = useState(1);
  const [objectType, setObjectType] = useState('1');
  const [attributesList, setAttributesList] = useState([]);
  const [objectData, setObjectData] = useState(null);
  const [attributes, setAttributes] = useState(null);
  const [attrType, setAttrType] = useState('1');
  const [interfaceId, setInterfaceId] = useState(props.interfaceId);
  const [interfaceAttr, setInterfaceAttr] = useState([]);
  const [tableName, setTableName] = useState('');
  const [viewType, setViewType] = useState('common');
  const dataSrcRef = useRef();
  const metaDataRef = useRef();
  const attrRef = useRef();
  const attrExtendRef = useRef();
  const actionRef = useRef();
  const preInterfaceId = useRef('');
  const initStepsDetail = [
    {
      index: 1,
      stepName: '配置元数据',
      stepLabel: '设置对象类型元数据',
    },{
      index: 2,
      stepName: '选择数据源',
      stepLabel: '对象类型支撑',
      stepDesc: '选择一个数据源映射上对象类型',
    },
    {
      index: 3,
      stepName: '配置属性',
      stepLabel: '创建属性',

    },
    // {
    //   index: 4,
    //   stepName: '配置动作',
    //   stepLabel: '创建动作类型',
    // },
  ];

  const [stepsDetail, setStepsDetail] = useState(initStepsDetail);
  useEffect(() => {
    const stepsDetailData = [...initStepsDetail];
    if(attrType == '1'){
      stepsDetailData[2].stepDesc = '属性信息默认使用数据源中已有的标注，如您需要重新生成，可点击【智能生成属性】，将为您重新推荐属性信息。'
    }else{
      stepsDetailData[2].stepDesc=''
    }
    if(interfaceId && attrType == '1') {
      setStepsDetail([
        ...stepsDetailData,
        {
          index: 4,
          stepName: '配置属性继承',
          stepLabel: '配置属性继承',
        }])
    } else {
      setStepsDetail(stepsDetailData)
    }
  }, [interfaceId,attrType]);
  const handleDatasrcChoose = (data, objectType,tableName,viewType) => {
    setAttributesList(data);
    if (objectType == 'noDatasource') {
      setAttrType('2');
    } else {
      setAttrType('1');
      setTableName(tableName)
      setViewType(viewType || 'common');
    }
  };

  //创建的数据
  const createObject = async () => {
    await setLoading(true);

      let valid = true;
      if (interfaceId && attrType == '1') {
          valid = await attrExtendRef?.current?.validate();
      }else{
          valid = await attrRef?.current?.validate();
      }
      if (!valid) {
          await setLoading(false);
          return;
      }

    const dataSrcData = attrType == '1' ? dataSrcRef.current.getDataSrcData() : {};
    const metaData = metaDataRef.current.getMetaData();
    let attributes = attrRef.current.getAttrData();
    // const actionData = actionRef.current.getActionData();
    // const actions = actionData.actions.map(item => {
    //   return { actionType: item };
    // });
    if(interfaceId && attrType == '1') {
      attributes = attrExtendRef.current.getExtendAttr();
    }
    const param = {
      ontologyId: props.ontology.id,
      // actions,
      // actionUsers: actionData.actionUsers,
      attributes,
      ...dataSrcData,
      ...metaData,
    };
    if(interfaceId){
      param.interfaceId = interfaceId;
    }
    //console.log(param);
    //debugger
    saveObjectType(param)
      .then(res => {
        if (res.data.success) {
          Message.success('创建对象类型成功');
        } else {
          Message.error('创建对象类型失败');
        }
      })
      .catch(err => {
        console.log(err);
        Message.error('创建失败！');
      })
      .finally(() => {
        setLoading(false);
        setObjStepModalVisible(false);
        props.close && props.close();
        setTimeout(() => {
          props.afterCreated && props.afterCreated(props.ontology.id);
        });
      });
  };

  const getInterfaceInfo = ()=>{
    setInterfaceAttr([]);
    interfaceId && getInterfaceData(interfaceId).then(res=>{
      if(res.data.success){
        setInterfaceAttr(res.data.data.attributeList);
        preInterfaceId.current = interfaceId;
      }
    })
  };
  //下一步
  const next = async () => {
    let stepRef = null;
    let metaData = null;

    switch (step) {
        case 1:
            stepRef = metaDataRef;
            metaData = metaDataRef.current.getMetaData();
            setObjectData(metaData);
            break;
        case 2:
            stepRef = dataSrcRef;
            if (interfaceId && interfaceId!==preInterfaceId.current) {
              getInterfaceInfo();
            }else if(!interfaceId){
                setInterfaceAttr([]);
            }
            break;
        case 3:
            stepRef = attrRef;
            const attributes = attrRef.current.getAttrData();
            setAttributes(attributes);
            break;
    }
    const val = await stepRef?.current?.validate();
    if (val) {
      setStep(step + 1);
    }
  };

  return (
    <div>
      <Modal
        title={<div style={{ textAlign: 'left', fontWeight: 600 }}>新建对象类型</div>}
        visible={objectModalVisible}
        okText="保存"
        onOk={() => {
          setObjectModalVisible(false);
          setObjStepModalVisible(true);
        }}
        onCancel={() => {
          setObjectModalVisible(false);
          props.close && props.close();
        }}
        autoFocus={false}
        focusLock
        className="new-object-modal"
      >
        <Radio.Group name="card-radio-group" value={objectType} onChange={setObjectType}>
          {['1', '2'].map(item => {
            return (
              <Radio key={item} value={item}>
                {({ checked }) => {
                  return (
                    <div
                      className={`custom-radio-card ${checked ? 'custom-radio-card-checked' : ''}`}
                    >
                      {item == 1 ? (
                        <div className="custom-radio-card-content">
                          <div className="custom-radio-card-icon">
                            <img src={srcIcon} />
                          </div>
                          <div className="custom-radio-card-title">使用已有数据源</div>
                          <Typography.Text type="secondary">选择一个已有的数据源</Typography.Text>
                        </div>
                      ) : (
                        <div className="custom-radio-card-content">
                          <div className="custom-radio-card-icon">
                            <img src={noSrcIcon} />
                          </div>
                          <div className="custom-radio-card-title">不使用数据源</div>
                          <Typography.Text type="secondary">
                            您可以先选择不关联数据源，仅配置对象类型的基础信息，待对象类型创建完成后再进行数据源配置
                          </Typography.Text>
                        </div>
                      )}
                      <div className="custom-radio-card-mask"></div>
                    </div>
                  );
                }}
              </Radio>
            );
          })}
        </Radio.Group>
      </Modal>

      <Modal
        title={<div style={{ textAlign: 'left', fontWeight: 600 }}>创建一个对象</div>}
        unmountOnExit
        style={{ width: '1000px' }}
        visible={objStepModalVisible}
        footer={null}
        onCancel={() => {
          setObjStepModalVisible(false);
          props.close && props.close();
        }}
        autoFocus={false}
        focusLock
        className="object-step-modal"
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
                <Typography.Text type="secondary" style={{lineHeight: '22px'}}>{stepsDetail[step - 1].stepDesc}</Typography.Text>
              ) : (
                ''
              )}
            </div>
            <div className="step-config">
              <MetaData ref={metaDataRef} isShow={step == 1} ontologyId={props.ontology?.id}/>
              <DataSource ref={dataSrcRef} isShow={step == 2} dataChoosed={handleDatasrcChoose} ontologyId={props.ontology?.id} interfaceId={props.interfaceId} interfaceChoosed={(id)=>setInterfaceId(id)}/>
              
              <AttrConfig
                ref={attrRef}
                isShow={step == 3}
                attributesList={attributesList}
                interfaceAttr={interfaceAttr}
                interfaceId={interfaceId}
                attrType={attrType}
                viewType={viewType}
                ontology={props.ontology}
                objectData={objectData}
              />
             {/* <ActionConfig ref={actionRef} objectData={objectData} isShow={step == 4} />*/}
              <AttrExtendConfig ref={attrExtendRef} objectData={objectData} isShow={step == 4}   viewType={viewType} interfaceAttr={interfaceAttr} attributes={attributes} interfaceId={interfaceId}/>

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
                <Button type="primary" onClick={createObject} loading={loading}>
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
