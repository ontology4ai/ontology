import React, {useEffect, useRef, useState} from 'react';
import {connect} from 'react-redux';
import useLocale from 'modo-plugin-common/src/utils/useLocale';
import {Modal, Button, Radio, Steps, Typography, Message} from '@arco-design/web-react';
import i18n from './locale';

import ObjChoose from './components/objectChoose';
import AttrExtendConfig from './components/attrExtendConfig';

import './style/index.less';
import {saveObjectType, getInterfaceData} from './api';
import DataSource from "@/pages/object/index";
import {getObjectDetail} from "@/pages/relationModal/api";

const {Step} = Steps;
const Object = props => {
    const t = useLocale();
    const loginT = useLocale(i18n);
    const [loading, setLoading] = useState(false);
    const [objStepModalVisible, setObjStepModalVisible] = useState(true);
    const [step, setStep] = useState(1);
    const [objectId, setObjectType] = useState();
    const [attributesList, setAttributesList] = useState([]);
    const [objectData, setObjectData] = useState(null);
    const [attributes, setAttributes] = useState([]);
    const [attrType, setAttrType] = useState('1');
    const [interfaceId, setInterfaceId] = useState(props.interfaceId);
    const [interfaceAttr, setInterfaceAttr] = useState([]);
    const objRef = useRef();
    const metaDataRef = useRef();
    const attrRef = useRef();
    const attrExtendRef = useRef();
    const actionRef = useRef();
    const initStepsDetail = [
        {
            index: 1,
            stepName: '选择对象',
            stepLabel: '选择对象'
        },
        {
            index: 2,
            stepName: '属性映射',
            stepLabel: '属性映射',
        },
        {
            index: 3,
            stepName: '关系映射',
            stepLabel: '关系映射',

        },
    ];

    const [stepsDetail, setStepsDetail] = useState(initStepsDetail);

    useEffect(() => {
        getInterfaceInfo()
    }, [interfaceId]);
    //创建的数据
    const createObject = async () => {
        await setLoading(true);

        let valid = true;
        /*if (interfaceId && attrType == '1') {
            valid = await attrExtendRef?.current?.validate();
        }else{
            valid = await attrRef?.current?.validate();
        }*/
        if (!valid) {
            await setLoading(false);
            return;
        }

        /*  const dataSrcData = attrType == '1' ? dataSrcRef.current.getDataSrcData() : {};
          const metaData = metaDataRef.current.getMetaData();
          let attributes = attrRef.current.getAttrData();
          if(interfaceId && attrType == '1') {
            attributes = attrExtendRef.current.getExtendAttr();
          }
          const param = {
            ontologyId: props.ontology.id,
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
            });*/
    };

    const getInterfaceInfo = () => {
        setInterfaceAttr([]);
        getInterfaceData(interfaceId).then(res => {
            if (res.data.success) {
                setInterfaceAttr(res.data.data.attributeList);
            }
        })
    };
    const getObjectAttr = (id) => {
        return new Promise((resolve, reject) => {
            getObjectDetail({id}).then(res => {
                if (res.data.success) {
                    resolve(res.data.data.attributes)
                } else {
                    Message.error('获取属性失败');
                    resolve([])
                }
            })
        })

    };
    //下一步
    const next = async () => {
        let stepRef = null;
        let metaData = null;

        switch (step) {
            case 1:
                if (objRef.current.objId) {
                    const attrList = await getObjectAttr(objRef.current.objId);
                    setAttributes(attrList);
                } else {
                    Message.error('请选择一个对象');
                    return;
                }
                break;
            case 2:
                stepRef = attrExtendRef;
                break;
        }
        let val = true;
        if (stepRef) {
            val = await stepRef?.current?.validate();
        }
        if (val) {
            setStep(step + 1);
        }
    };

    return (
      <div>
          <Modal
            title={<div style={{textAlign: 'left', fontWeight: 600}}>为接口添加继承对象</div>}
            unmountOnExit
            style={{width: '1000px'}}
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
                      <Steps direction="vertical" current={step} style={{width: 170}}>
                          {stepsDetail.map((item: any) => (
                            <Step key={item.index} title={item.stepName}/>
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
                          <ObjChoose ontologyId={props.ontology?.id} ref={objRef} isShow={step == 1}/>
                          <AttrExtendConfig ref={attrExtendRef} objectData={objectData} isShow={step == 2}
                                            interfaceAttr={interfaceAttr} attributes={attributes}
                                            interfaceId={interfaceId}/>

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
