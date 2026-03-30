import React, { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import useLocale from 'modo-plugin-common/src/utils/useLocale';
import { Modal, Button, Radio, Steps, Typography, Message } from '@arco-design/web-react';
import i18n from './locale';

import RelationType from './components/relationType';
import RelationSource from './components/relationSource';
import RelationName from './components/relationName';

import './style/index.less';
import { saveRelation } from './api';

const { Step } = Steps;
const Object = props => {
  const t = useLocale();
  const loginT = useLocale(i18n);
  const [stepModalVisible, setStepModalVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [linkType, setLinkType] = useState(1);
  const [relationObjs, setRelationObjs] = useState(null);
  const relationTypeRef = useRef();
  const relationSrcRef = useRef();
  const relationNameRef = useRef();
  const stepsDetail = [
    {
      index: 1,
      stepName: '链接关联方式',
      stepLabel: '关联方式',
      stepDesc: '选择定义对象类型间关系类型的方式',
    },
    {
      index: 2,
      stepName: '选择链接资源',
      stepLabel: '选择链接资源',
    },
    {
      index: 3,
      stepName: '关系类型命名',
      stepLabel: '关系类型命名',
      stepDesc: '为关系类型的每一侧输入一个名称，即指向当前对象类型的关系展示的语义描述。',
    },
  ];
  useEffect(() => {}, []);
  const isArraySameIgnoreOrder = (leftTags, rightTags) => {
    if (leftTags.length !== rightTags.length) return false;

    // 复制数组并升序排序
    const sortedArr1 = [...leftTags].sort();
    const sortedArr2 = [...rightTags].sort();

    //逐项对比排序后的数组
    for (let i = 0; i < sortedArr1.length; i++) {
      if (sortedArr1[i] !== sortedArr2[i]) return false;
    }
    return true;
  };
  //创建的数据
  const createRelation = () => {
    const data = relationSrcRef.current.getRelationSourceConfig();
    const tags = relationNameRef.current.getRelationTags();
    if (tags.sourceTag.length == 0 || tags.targetTag.length == 0) {
      Message.error('请选择关系标签');
      return;
    }
    if (isArraySameIgnoreOrder(tags.sourceTag, tags.targetTag)) {
      Message.error('正向标签和反向标签不可完全一致');
      return;
    }

    const param = {
      ontologyId: props.ontology.id,
      ...data,
      ...tags,
      status: 1,
      sourceAttributeId: data.linkType === 4 ? null : data.sourceAttributeId,
    };

    setLoading(true);
    saveRelation(param)
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
        setStepModalVisible(false);
        props.close && props.close();
        setTimeout(() => {
          props.afterCreated && props.afterCreated(props.ontology.id);
        });
      });
  };
  //下一步
  const next = async () => {
    let val = true;
    if (step == 2) {
      val = await relationSrcRef?.current?.validate();
    }
    if (val) {
      if (step == 1) {
        setLinkType(relationTypeRef.current.linkType);
      }
      if (step == 2) {
        const data = relationSrcRef.current.getRelationSourceConfig();
        setRelationObjs({
          sourceObject: data.sourceObject?.objectTypeLabel,
          targetObject: data.targetObject?.objectTypeLabel,
        });
      }
      setStep(step + 1);
    }
  };

  return (
    <div>
      <Modal
        unmountOnExit
        title={<div style={{ textAlign: 'left', fontWeight: 600 }}>创建一个关系</div>}
        style={{ width: '1000px' }}
        visible={stepModalVisible}
        footer={null}
        onCancel={() => {
          setStepModalVisible(false);
          props.close && props.close();
        }}
        autoFocus={false}
        focusLock
        className="relation-step-modal"
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
              <RelationType
                ref={relationTypeRef}
                isShow={step == 1}
                ontologyId={props.ontology?.id}
              />
              <RelationSource
                ref={relationSrcRef}
                isShow={step == 2}
                linkType={linkType}
                ontologyId={props.ontology?.id}
              />
              <RelationName ref={relationNameRef} isShow={step == 3} relationObjs={relationObjs} />
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
                <Button type="primary" onClick={createRelation} loading={loading}>
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
