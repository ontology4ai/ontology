import {
  Input,
  Tag,
  Table,
  Divider,
  Descriptions,
  Pagination,
  Empty,
  Spin,
} from '@arco-design/web-react';
import React, { useState, useEffect } from 'react';
import './index.less';
import { IconArrowDown, IconArrowUp, IconCaretBottom, IconCaretTop } from 'modo-design/icon';
import { changeLogListAffect, changeLogListTarget } from './api';

const InputSearch = Input.Search;

interface OntologySimulationResultEffectProps {
  trackId: string;
  objectName: string;
  ontologyId: string;
}

// interface TreeNodeProps {
//   id: string;
//   label: string;
//   type: 'add' | 'modify' | 'delete';
// }

const OntologySimulationResultEffect: React.FC<OntologySimulationResultEffectProps> = ({
  trackId,
  objectName,
  ontologyId,
}) => {
  // const [searchTreeKeywords, setTreeSearchKeywords] = useState('');

  // const [treeData, setTreeData] = useState<TreeNodeProps[]>([
  //   {
  //     id: '1',
  //     label: '对象实例标题1',
  //     type: 'modify',
  //   },
  //   {
  //     id: '2',
  //     label: '对象实例标题1',
  //     type: 'add',
  //   },
  //   {
  //     id: '3',
  //     label: '对象实例标题1',
  //     type: 'delete',
  //   },
  //   {
  //     id: '4',
  //     label: '对象实例标题1',
  //     type: 'add',
  //   },
  // ]);
  const tagMap = {
    新增: 'cyan',
    修改: 'arcoblue',
    删除: 'orangered',
  };

  // const handleTreeSearch = () => {};

  // const [selectedNodeId, setSelectedNodeId] = useState('');
  // const [selectedNode, setSelectedNode] = useState<TreeNodeProps | null>(null);

  // const handleTreeNodeClick = (id: string, item: any) => {
  //   setSelectedNodeId(id);
  //   setSelectedNode(item);
  // };

  const inputColumns = [
    {
      title: '属性名',
      dataIndex: 'AttributeLabel',
    },
    {
      title: '基准值',
      dataIndex: 'Baseline',
    },
    {
      title: '仿真值',
      dataIndex: 'Simulation',
    },
    {
      title: '变化量',
      dataIndex: 'change',
      render: (text, record) => (
        <div>
          {record.Delta === '--' ? null : record.Delta < 0 ? (
            <IconCaretBottom style={{ color: '#FF5F5F' }} />
          ) : (
            <IconCaretTop style={{ color: '#31CF9A' }} />
          )}
          <span style={{ marginLeft: '4px' }}>{record.Delta}</span>
        </div>
      ),
    },
  ];
  const outputColumns = inputColumns.map(item => {
    return {
      ...item,
      title: item.title === '仿真值' ? '影响值' : item.title,
    };
  });

  const [searchKeywords, setSearchKeywords] = useState('');

  const handleSearch = () => {
    setOutputsCurrentPage(1);
    setInputsCurrentPage(1);
    getInputsListData(1);
    getOutputsListData(1);
  };

  const [inputsDataShowIds, setInputsDataShowIds] = useState<string[]>([]);
  const [inputs, setInputs] = useState([]);

  const [outputsDataShowIds, setOutputsDataShowIds] = useState<string[]>([]);
  const [outputs, setOutputs] = useState([]);

  const [inputsTotal, setInputsTotal] = useState(2);
  // const [inputsPageNumber, setInputsPageNumber] = useState(1);
  // const [inputsPageSize, setInputsPageSize] = useState(10);

  const [outputsTotal, setOutputsTotal] = useState(2);
  // const [outputsPageNumber, setOutputsPageNumber] = useState(1);
  // const [outputsPageSize, setOutputsPageSize] = useState(10);

  const [inputsCurrentPage, setInputsCurrentPage] = useState(1);
  const [outputsCurrentPage, setOutputsCurrentPage] = useState(1);

  const handleInputsPaginationChange = (pageNumber: number, pageSize: number) => {
    setInputsCurrentPage(pageNumber);
    getInputsListData(pageNumber, pageSize);
  };

  const handleOutputsPaginationChange = (pageNumber: number, pageSize: number) => {
    setOutputsCurrentPage(pageNumber);
    getOutputsListData(pageNumber, pageSize);
  };

  const [loadingInputs, setLoadingInputs] = useState(false);
  const [loadingOutputs, setLoadingOutputs] = useState(false);

  const getInputsListData = async (pageNumber = 1, pageSize = 10) => {
    if (!trackId) return;

    setLoadingInputs(true);
    try {
      const res = await changeLogListTarget({
        // trackId: '47af6b96-1124-41a4-a604-eb4d6091ee19',
        // objectTypeName: 'plan',
        trackId,
        objectTypeName: objectName,
        page: pageNumber,
        limit: pageSize,
        keyword: searchKeywords,
        ontologyId,
      });

      const { success, data } = res.data;

      if (success) {
        setInputsTotal(data?.totalElements || 0);
        setInputs(data?.content || []);
      }
    } catch (error) {
      console.error(error);
    }
    setLoadingInputs(false);
  };

  const getOutputsListData = async (pageNumber = 1, pageSize = 10) => {
    if (!trackId) return;

    setLoadingOutputs(true);
    try {
      const res = await changeLogListAffect({
        // trackId: '47af6b96-1124-41a4-a604-eb4d6091ee19',
        // objectTypeName: 'plan',
        trackId,
        objectTypeName: objectName,
        page: pageNumber,
        limit: pageSize,
        keyword: searchKeywords,
        ontologyId,
      });

      const { success, data } = res.data;

      if (success) {
        setOutputsTotal(data?.totalElements || 0);
        setOutputs(data?.content || []);
      }
    } catch (error) {
      console.error(error);
    }
    setLoadingOutputs(false);
  };

  useEffect(() => {
    // handleTreeNodeClick(treeData[0].id, treeData[0]);
    getInputsListData();
    getOutputsListData();
  }, []);
  return (
    <div className="ontology-simulation-result-effect">
      {/* <div className="ontology-simulation-result-effect-left">
        <InputSearch
          allowClear
          placeholder="搜索节点名称"
          searchButton
          onChange={value => setTreeSearchKeywords(value)}
          onSearch={() => handleTreeSearch()}
        />
        <div className="ontology-simulation-result-effect-tree">
          {treeData.map(item => (
            <div
              className={
                selectedNodeId === item.id
                  ? 'active ontology-simulation-result-effect-tree-item'
                  : 'ontology-simulation-result-effect-tree-item'
              }
              onClick={() => handleTreeNodeClick(item.id, item)}
            >
              <div className="ontology-simulation-result-effect-tree-item-title">{item.label}</div>
              <Tag color={tagMap[item.type]?.color} bordered>
                {tagMap[item.type]?.label}
              </Tag>
            </div>
          ))}
        </div>
      </div> */}
      <div className="ontology-simulation-result-effect-right">
        <div className="ontology-simulation-result-effect-title">
          仿真结果差异分析
          <InputSearch
            allowClear
            style={{ width: 260 }}
            placeholder="请输入"
            searchButton
            onChange={value => setSearchKeywords(value)}
            onSearch={() => handleSearch()}
          />
        </div>
        <div className="ontology-simulation-result-effect-right-center">
          <Spin loading={loadingInputs} className="ontology-simulation-result-effect-inputs">
            <div className="ontology-simulation-result-effect-inputs-title">
              <div></div>目标修改数据 (Inputs)
            </div>
            <div className="ontology-simulation-result-effect-inputs-content">
              {inputs.length ? (
                inputs.map(item => (
                  <div
                    className="ontology-simulation-result-effect-inputs-content-item"
                    key={item.id}
                  >
                    <div className="ontology-simulation-result-effect-inputs-content-item__left"></div>

                    <div className="ontology-simulation-result-effect-inputs-content-item__right">
                      <div
                        className="ontology-simulation-result-effect-inputs-content-item-header"
                        onClick={() =>
                          setInputsDataShowIds(
                            inputsDataShowIds.includes(item.id)
                              ? inputsDataShowIds.filter(id => id !== item.id)
                              : [...inputsDataShowIds, item.id],
                          )
                        }
                      >
                        <div className="ontology-simulation-result-effect-inputs-content-item-header-left">
                          <span>{item.objectTypeLabel}</span>

                          {item.operationType === 'UPDATE' ? (
                            <>
                              <Divider type="vertical" style={{ margin: 0 }} />
                              <span>{item.title}</span>
                            </>
                          ) : null}

                          <Tag color={tagMap[item.operationTypeLabel]} bordered>
                            {item.operationTypeLabel}
                          </Tag>
                        </div>
                        <div className="ontology-simulation-result-effect-inputs-content-item-header-right">
                          <div className="ontology-simulation-result-effect-inputs-content-item-header-right-title">
                            {item.operationTypeLabel}属性数：
                            <span>{item.details?.length || 0}项</span>
                          </div>
                          {inputsDataShowIds.includes(item.id) ? (
                            <IconArrowUp />
                          ) : (
                            <IconArrowDown />
                          )}
                        </div>
                      </div>

                      {inputsDataShowIds.includes(item.id) ? (
                        <Table
                          pagination={false}
                          columns={
                            item.operationType === 'UPDATE'
                              ? inputColumns
                              : Object.keys(item.details[0]).map(key => ({
                                  title: item.attribute[key] || key,
                                  dataIndex: key,
                                  width: (item.attribute[key] || key).length * 12 + 32,
                                }))
                          }
                          data={
                            item.operationType === 'UPDATE'
                              ? item.details.map(d => ({
                                  ...d,
                                  AttributeLabel: item.attribute[d.Attribute] || d.Attribute,
                                }))
                              : item.details
                          }
                          border={false}
                          scroll={{
                            x: '100%',
                          }}
                        />
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <Empty />
              )}
            </div>
            <Pagination
              total={inputsTotal}
              current={inputsCurrentPage}
              showTotal
              showJumper
              sizeCanChange
              onChange={handleInputsPaginationChange}
            />
          </Spin>

          <Spin loading={loadingOutputs} className="ontology-simulation-result-effect-outputs">
            <div className="ontology-simulation-result-effect-outputs-title">
              <div></div>受影响数据 (Outputs)
            </div>
            <div className="ontology-simulation-result-effect-outputs-content">
              {outputs.length ? (
                outputs.map(item => (
                  <div
                    className="ontology-simulation-result-effect-outputs-content-item"
                    key={item.id}
                  >
                    <div className="ontology-simulation-result-effect-outputs-content-item__left"></div>

                    <div className="ontology-simulation-result-effect-outputs-content-item__right">
                      <div
                        className="ontology-simulation-result-effect-outputs-content-item-header"
                        onClick={() =>
                          setOutputsDataShowIds(
                            outputsDataShowIds.includes(item.id)
                              ? outputsDataShowIds.filter(id => id !== item.id)
                              : [...outputsDataShowIds, item.id],
                          )
                        }
                      >
                        <div className="ontology-simulation-result-effect-outputs-content-item-header-left">
                          <span>{item.objectTypeLabel}</span>

                          {item.operationType === 'UPDATE' ? (
                            <>
                              <Divider type="vertical" style={{ margin: 0 }} />
                              <span>{item.title}</span>
                            </>
                          ) : null}

                          <Tag color={tagMap[item.operationTypeLabel]} bordered>
                            {item.operationTypeLabel}
                          </Tag>
                        </div>
                        <div className="ontology-simulation-result-effect-outputs-content-item-header-right">
                          <div className="ontology-simulation-result-effect-outputs-content-item-header-right-title">
                            {item.operationTypeLabel}属性：
                            <span>{item.details?.length || 0}项</span>
                          </div>
                          {outputsDataShowIds.includes(item.id) ? (
                            <IconArrowUp />
                          ) : (
                            <IconArrowDown />
                          )}
                        </div>
                      </div>

                      {outputsDataShowIds.includes(item.id) ? (
                        <Table
                          pagination={false}
                          columns={
                            item.operationType === 'UPDATE'
                              ? outputColumns
                              : Object.keys(item.details[0]).map(key => ({
                                  title: item.attribute[key] || key,
                                  dataIndex: key,
                                  width: (item.attribute[key] || key).length * 12 + 32,
                                }))
                          }
                          data={
                            item.operationType === 'UPDATE'
                              ? item.details.map(d => ({
                                  ...d,
                                  AttributeLabel: item.attribute[d.Attribute] || d.Attribute,
                                }))
                              : item.details
                          }
                          border={false}
                          scroll={{
                            x: '100%',
                          }}
                        />
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <Empty />
              )}
            </div>
            <Pagination
              total={outputsTotal}
              current={outputsCurrentPage}
              showTotal
              showJumper
              sizeCanChange
              onChange={handleOutputsPaginationChange}
            />
          </Spin>
        </div>
      </div>
    </div>
  );
};

export default OntologySimulationResultEffect;
