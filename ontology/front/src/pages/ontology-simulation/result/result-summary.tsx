import React, { useState, useEffect } from 'react';
import './index.less';
import { changeLogGetAffect, changeLogGetTarget } from './api';
import { Empty, Spin } from '@arco-design/web-react';

interface OntologySimulationResultSummaryProps {
  trackId: string;
  objectName: string;
  objectLabel: string;
  params: object;
  actionName: string;
}
const OntologySimulationResultSummary: React.FC<OntologySimulationResultSummaryProps> = ({
  trackId,
  objectName,
  objectLabel,
  params,
  actionName,
}) => {
  const [inputs, setInputs] = useState([]);
  const [inputsUpdate, setInputsUpdate] = useState([]);
  const [inputsCreate, setInputsCreate] = useState([]);
  const [inputsDelete, setInputsDelete] = useState([]);

  const [outputs, setOutputs] = useState([]);

  const [loading, setLoading] = useState(false);
  const getInputsListData = async () => {
    if (!trackId) return;

    try {
      const res = await changeLogGetTarget({
        // trackId: '47af6b96-1124-41a4-a604-eb4d6091ee19',
        // objectTypeName: 'plan',
        trackId,
        objectTypeName: objectName,
      });

      const { success, data } = res.data;

      if (success) {
        setInputs(data || []);
        setInputsUpdate(data?.filter(item => item.operationType === 'UPDATE') || []);
        setInputsCreate(data?.filter(item => item.operationType === 'CREATE') || []);
        setInputsDelete(data?.filter(item => item.operationType === 'DELETE') || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getOutputsListData = async () => {
    if (!trackId) return;

    setLoading(true);
    try {
      const res = await changeLogGetAffect({
        // trackId: '47af6b96-1124-41a4-a604-eb4d6091ee19',
        // objectTypeName: 'plan',
        trackId,
        objectTypeName: objectName,
      });

      const { success, data } = res.data;

      if (success) {
        const objectMap = data.reduce((acc, item) => {
          if (acc[item.objectTypeLabel]) {
            if (item.operationType === 'CREATE') {
              acc[item.objectTypeLabel].create.push(item);
            }
            if (item.operationType === 'UPDATE') {
              acc[item.objectTypeLabel].update.push(item);
            }
            if (item.operationType === 'DELETE') {
              acc[item.objectTypeLabel].delete.push(item);
            }
          } else {
            acc[item.objectTypeLabel] = {
              label: item.objectTypeLabel,
              create: item.operationType === 'CREATE' ? [item] : [],
              update: item.operationType === 'UPDATE' ? [item] : [],
              delete: item.operationType === 'DELETE' ? [item] : [],
            };
          }

          return acc;
        }, {});

        setOutputs(Object.values(objectMap) || []);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    getInputsListData();
    getOutputsListData();
  }, []);
  return (
    <Spin loading={loading} className="ontology-simulation-result-summary">
      {trackId ? (
        <>
          <div className="ontology-simulation-result-summary-item">
            <div className="ontology-simulation-result-summary-item-title">
              <div></div>执行动作
            </div>
            <div className="ontology-simulation-result-summary-item-content">
              <div>
                执行<span className="highlight">【{actionName}】</span>的操作，将
                <span className="highlight">【{objectLabel}】</span>
                {Object.keys(params || {}).length > 0 && (
                  <span>
                    的
                    {Object.keys(params).map(
                      (key, index) =>
                        params[key] && (
                          <>
                            {index ? '，' : ''}
                            <span className="highlight">【{key}】</span>配置为
                            <span className="highlight">{JSON.stringify(params[key])}</span>
                          </>
                        ),
                    )}
                    。
                  </span>
                )}
                {/* {inputsCreate.length > 0 && (
                  <span>
                    新增数据
                    {inputsCreate.map((item, index) => (
                      <span>
                        {index ? '、' : ''}
                        <span className="highlight">【{item.title}】</span>
                      </span>
                    ))}
                    。
                  </span>
                )}
                {inputsDelete.length > 0 && (
                  <span>
                    删除数据
                    {inputsDelete.map((item, index) => (
                      <span>
                        {index ? '、' : ''}
                        <span className="highlight">【{item.title}】</span>
                      </span>
                    ))}
                    。
                  </span>
                )} */}
              </div>
              {inputs?.length && (
                <div>
                  本次针对<span className="highlight">【{objectLabel}】</span>的
                  <span className="highlight"> {inputs.length} </span>条实例数据进行分析：
                  {inputsUpdate.length ? (
                    <span>
                      修改数据<span className="highlight">{inputsUpdate.length}</span>条，包括：
                      {inputsUpdate.map((item, index) => (
                        <span>
                          {index ? '、' : ''}
                          <span className="highlight">【{item.title}】</span>
                        </span>
                      ))}
                      ；
                    </span>
                  ) : null}
                  {inputsCreate.length ? (
                    <span>
                      新增数据<span className="highlight">{inputsCreate.length}</span>条，
                      {inputsCreate.every(item => !!item.title) ? (
                        <span>
                          包括：
                          {inputsCreate.map((item, index) => (
                            <span>
                              {index ? '、' : ''}
                              <span className="highlight">【{item.title}】</span>
                            </span>
                          ))}
                        </span>
                      ) : (
                        '详见影响明细'
                      )}
                      ；
                    </span>
                  ) : null}
                  {inputsDelete.length ? (
                    <span>
                      删除数据<span className="highlight">{inputsDelete.length}</span>条，包括：
                      {inputsDelete.map((item, index) => (
                        <span>
                          {index ? '、' : ''}
                          <span className="highlight">【{item.title}】</span>
                        </span>
                      ))}
                      ；
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          </div>
          <div className="ontology-simulation-result-summary-item">
            <div className="ontology-simulation-result-summary-item-title">
              <div></div>影响范围
            </div>
            <div className="ontology-simulation-result-summary-item-content">
              {/* <div>
              执行<span className="highlight">【{actionLabel}】</span>时，同时触发了针对
              <span>【对象名称2】</span>的<span>【动作名称2】</span>
              的操作，针对<span>【对象名称3】</span>的<span>【动作名称3】</span>
              的操作，针对<span>【对象名称4】</span>的<span>【动作名称4】</span>的操作。
            </div> */}
              {outputs?.length ? (
                <>
                  <div>
                    {/* 所以， */}
                    本次模拟执行共对 <span>{outputs.length}</span> 个对象产生影响，分别是
                    {outputs.map((o, index) => (
                      <span>
                        {index ? '、' : ''}
                        <span className="highlight">【{o.label}】</span>
                      </span>
                    ))}
                    。
                  </div>
                  <div>
                    其中：
                    {outputs.map(o => (
                      <div>
                        <span>
                          变更<span className="highlight">【{o.label}】</span>中的实例数据
                          <span className="highlight">{o.update.length}</span>条
                        </span>
                        <span>
                          、新增<span className="highlight">【{o.label}】</span>中的实例数据
                          <span className="highlight">{o.create.length}</span>条
                        </span>
                        <span>
                          、删除<span className="highlight">【{o.label}】</span>中的实例数据
                          <span className="highlight">{o.delete.length}</span>条
                        </span>
                        。
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div>暂无影响数据</div>
              )}
            </div>
          </div>
          <div className="ontology-simulation-result-summary-item">
            <div className="ontology-simulation-result-summary-item-title">
              <div></div>总结
            </div>
            <div className="ontology-simulation-result-summary-item-content">
              <div>综上，总结仿真结果如下：</div>
              {outputs?.length ? (
                <div>
                  {outputs.map(o => (
                    <>
                      {o.update.map(item =>
                        item.details.map(d => (
                          <div key={item.id + d.Attribute}>
                            <span className="highlight">【{o.label}】</span>的
                            <span className="highlight">【{item.title}】</span>的
                            <span className="highlight">
                              【{item.attribute[d.Attribute] || d.Attribute}】
                            </span>
                            由<span className="highlight">【{d.Baseline || '空'}】</span>变为了
                            <span className="highlight">【{d.Simulation || '空'}】</span>。
                          </div>
                        )),
                      )}
                      {o.create.length ? (
                        <div>
                          <span className="highlight">【{o.label}】</span>新增数据
                          {o.create.every(item => !!item.title)
                            ? o.create.map((item, index) => (
                                <span key={item.id}>
                                  {index ? '、' : ''}
                                  <span className="highlight">【{item.title}】</span>
                                </span>
                              ))
                            : '详见影响明细'}
                        </div>
                      ) : null}
                      {o.delete.length ? (
                        <div>
                          <span className="highlight">【{o.label}】</span>删除数据
                          {o.delete.map((item, index) => (
                            <span key={item.id}>
                              {index ? '、' : ''}
                              <span className="highlight">【{item.title}】</span>
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </>
                  ))}
                </div>
              ) : (
                <div>暂无影响数据</div>
              )}
            </div>
          </div>
        </>
      ) : (
        <Empty />
      )}
    </Spin>
  );
};

export default OntologySimulationResultSummary;
