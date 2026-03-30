import { Button, Message, Modal, Steps } from '@arco-design/web-react';
import useLocale from 'modo-plugin-common/src/utils/useLocale';
import React, { useEffect, useRef, useState } from 'react';
import AttrConfig from './components/attr-config';
import MetaData from './components/meta-data';
import { createInterface } from './api/index';
import './style/interface-modal.less';

const { Step } = Steps;
export const InterfaceModal = props => {
  const t = useLocale();
  const [loading, setLoading] = useState(false);
  const [objStepModalVisible, setObjStepModalVisible] = useState(true);
  const [step, setStep] = useState(1);
  const [attributesList, setAttributesList] = useState([]);
  const [objectData, setObjectData] = useState(null);
  const [attrType, setAttrType] = useState('1');
  const [tableName, setTableName] = useState('');
  const metaDataRef = useRef();
  const attrRef = useRef();
  const stepsDetail = [
    {
      index: 1,
      stepName: '配置接口元数据',
      stepLabel: '设置接口元数据',
    },
    {
      index: 2,
      stepName: '配置接口属性',
      stepLabel: '配置接口属性',
    },
    // {
    //   index: 4,
    //   stepName: '配置动作',
    //   stepLabel: '创建动作类型',
    // },
  ];
  useEffect(() => {}, []);
  //创建的数据
  const createObject = async () => {
    setLoading(true);
    const valid = await attrRef?.current?.validate();
    if (!valid) {
      setLoading(false);
      return;
    }
    if (!objectData) {
      Message.error('缺少元数据信息');
      setLoading(false);
      return;
    }

    const attributeList = attrRef.current.getAttrData();
    const param = {
      ontologyId: props.ontology.id,
      attributeList,
      ...objectData, // 使用 state 中存储的数据
    };
    console.log(param);
    createInterface(param)
      .then(res => {
        if (res.data.success) {
          Message.success('创建成功');
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
        setObjStepModalVisible(false);
        props.close && props.close();
        setTimeout(() => {
          props.afterCreated && props.afterCreated(props.ontology.id);
        });
      });
  };
  //下一步
  const next = async () => {
    let stepRef = null;
    let metaData = null;
    switch (step) {
      case 1:
        stepRef = metaDataRef;
        if (metaDataRef.current) {
          metaData = metaDataRef.current.getFormData();
          setObjectData(metaData);
        }
        break;
      case 2:
        stepRef = attrRef;
        break;
      default:
        console.warn(`Unexpected step: ${step}`);
        return;
    }
    const val = await stepRef?.current?.validate();
    if (val) {
      setStep(step + 1);
    }
  };

  return (
    <div>
      <Modal
        title={<div style={{ textAlign: 'left', fontWeight: 600 }}>新建一个接口</div>}
        unmountOnExit
        style={{ width: '1000px', height: '704px' }}
        visible={objStepModalVisible}
        footer={null}
        onCancel={() => {
          setObjStepModalVisible(false);
          props.close && props.close();
        }}
        autoFocus={false}
        focusLock
        className="interface-modal"
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
            </div>
            <div className="step-config">
              {step === 1 && (
                <MetaData
                  ref={metaDataRef}
                  isShow={step === 1}
                  ontologyId={props.ontology?.id}
                  tableName={tableName}
                  initialData={objectData}
                />
              )}
              {step === 2 && (
                <AttrConfig
                  ref={attrRef}
                  isShow={step === 2}
                  attributesList={attributesList}
                  attrType={attrType}
                />
              )}
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
              {step === stepsDetail.length ? (
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
