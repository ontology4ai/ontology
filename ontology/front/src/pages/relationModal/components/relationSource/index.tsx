import {
  Button,
  Empty,
  Form,
  Grid,
  Input,
  List,
  Message,
  Modal,
  Select,
  Space,
  Spin,
  Table,
  TableColumnProps,
  Tag,
  Tooltip,
  Typography,
} from '@arco-design/web-react';
import {
  IconCalendarColor,
  IconCounterColor,
  IconDataCatalogMgrColor,
  IconDataIntegrationColor,
  IconDataResDirColor,
  IconHelpColor,
  IconSwapLeftRight,
  IconTextareaColor,
  IconUnitMgrColor,
} from 'modo-design/icon';
import useLocale from 'modo-plugin-common/src/utils/useLocale';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

import ObjectIcon from '@/components/ObjectIcon';
import i18n from '../../locale';

import './index.less';

import linkImg1 from '@/pages/relationModal/images/linkImg1.svg';
import linkImg2 from '@/pages/relationModal/images/linkImg2.svg';
import linkImg3 from '@/pages/relationModal/images/linkImg3.svg';
import linkImg4 from '@/pages/relationModal/images/linkImg4.svg';

import emptyIcon from '@/pages/object/images/empty.svg';
import rightIcon from '@/pages/object/images/rightIcon.svg';

import {
  getAllObject,
  getDataSourceList,
  getDataTableInfo,
  getDataTables,
  getObjectDetail,
} from '@/pages/relationModal/api';
const typeOptions = [
  { value: 'string', label: '字符型' },
  { value: 'int', label: '整数型' },
  { value: 'decimal', label: '浮点数型' },
  { value: 'date', label: '日期型' },
  { value: 'bool', label: '布尔型' },
];
const typeDetailInfo = {
  1: {
    srcName: '链接资源',
    srcInfo:
      '选择你需要创建链接的对象类型，选择左侧对象类型的属性作为主键，右侧对象类型作为外键，仅支持选择已启用的对象类型',
    baseInfo: '配置主键和外键对应的对象类型是“一对一”还是“一对多”的关系',
  },
  2: {
    srcName: '关系资源',
    srcInfo:
      '通过中间数据集建立主外键关系，实现两个对象类型的关系。选择你需要创建链接的对象类型，仅支持选择已启用的对象类型',
    srcSet: '选择数据集',
    setInfo: '选择一个可以描述两对象类型映射关系（即包含与两个所选对象类型的主键匹配的列）的数据集',
    baseInfo: '选择中间数据集的哪两列映射对象类型作为主键的属性',
  },
  3: {
    srcName: '链接资源',
    srcInfo: '通过中间数据集建立主外键关系，实现两个对象类型的关系。选择你需要创建关系的对象类型',
    baseInfo: '选择与两侧对象类型主键关联的中间对象类型的属性作为关联外键，并设置基数',
  },
  4: {
    srcName: '链接资源',
    srcInfo:
      '选择你需要创建链接的对象类型，选择左侧对象类型的属性作为主键，右侧对象类型作为外键，仅支持选择已启用的对象类型',
    baseInfo: '',
  },
};

const FormItem = Form.Item;
const { Option } = Select;
const InputSearch = Input.Search;
const source = (props, ref) => {
  const t = useLocale();
  const loginT = useLocale(i18n);
  const { linkType } = props;
  const [initObjList, setInitObjList] = useState([]);
  const [objList, setObjList] = useState([]);
  const [sourceObjectTypeId, setSourceObjectTypeId] = useState('');
  const [targetObjectTypeId, setTargetObjectTypeId] = useState('');
  const [rightAttrList, setRightAttrList] = useState([]);
  const [leftAttrList, setLeftAttrList] = useState([]);
  const [rightAttr, setRightAttr] = useState({});
  const [leftAttr, setLeftAttr] = useState({});
  const [dataset, setDataset] = useState(null);
  const [relationTypes, setRelationTypes] = useState([
    { value: 1, label: '一对一' },
    { value: 2, label: '一对多' },
  ]);
  const leftFormRef = useRef();
  const rightFormRef = useRef();
  const baseFormRef = useRef();

  const formRef = useRef();
  const [stepModalVisible, setStepModalVisible] = useState(false);
  const [scrollLoading, setScrollLoading] = useState(<Spin loading />);
  const [dsOptions, setDsOptions] = useState([]);
  const [modelOptions, setModelOptions] = useState([]);
  const [keySearchValue, setKeySearchValue] = useState('');
  const [datasetList, setDatasetList] = useState([]);
  const [datasetAll, setDatasetAll] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [tableName, setTableName] = useState('');
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [current, setCurrent] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRow, setSelectedRows] = useState([]);
  const columns: TableColumnProps[] = [
    {
      title: '字段英文名',
      dataIndex: 'COLUMN_NAME',
    },
    {
      title: '字段说明',
      dataIndex: 'COMMENTS',
    },
    {
      title: '数据类型',
      dataIndex: 'DATA_TYPE',
      render: (col, record, index) => <Tag>{col}</Tag>,
    },
    {
      title: '长度',
      dataIndex: 'DATA_LENGTH',
    },
    /* {
             title: '精度',
             dataIndex: '',
         },*/
  ];
  const keySearch = val => {
    setKeySearchValue(val);
    setCurrent(1);
  };
  const onValuesChange = (changeValue: any, values: any) => {
    setTableData([]);
    //  setSelectedRowKeys([]);
    //  setSelectedRows([]);
    setDatasetAll([]);
    setTableName('');
    if (changeValue.dsId) {
      formRef.current.setFieldValue('dsSchema', undefined);
      setModelOptions(dsOptions.find(item => item.id == changeValue.dsId)?.schemas || []);
    }
    if (changeValue.dsSchema) {
      getDataSet({ id: values.dsId, schema: values.dsSchema });
    }
  };

  const onObjValuesChange = (changeValue: any, values: any) => {
    if (changeValue.sourceObjectTypeId) {
      setSourceObjectTypeId(changeValue.sourceObjectTypeId);
    }
    if (changeValue.targetObjectTypeId) {
      setTargetObjectTypeId(changeValue.targetObjectTypeId);
    }
  };
  useEffect(() => {
    setLeftAttrList([]);
    setLeftAttr({});
    leftFormRef.current?.setFieldValue('attr', void 0);
    if (sourceObjectTypeId) {
      getObjectAttr(sourceObjectTypeId).then(list => {
        setLeftAttrList(list);
        const leftPrimaryAttr = list.find(item => item.isPrimaryKey);
        setLeftAttr(leftPrimaryAttr);
        leftFormRef.current?.setFieldValue('attr', leftPrimaryAttr?.id);
      });
    } /*else{
            setLeftAttrList([]);
        }*/
    const newObjList = objList.map(item => {
      item.isLeftId = item.id == sourceObjectTypeId;
      return item;
    });
    setObjList(newObjList);
  }, [sourceObjectTypeId]);
  useEffect(() => {
    setRightAttrList([]);
    /*  linkType == 1 ? rightFormRef.current?.setFieldValue('attr', void 0) : '';
        linkType == 2 ? setRightAttr({}) : '';*/
    rightFormRef.current?.setFieldValue('attr', void 0);
    if (targetObjectTypeId) {
      getObjectAttr(targetObjectTypeId).then(list => {
        setRightAttrList(list);
        const rightPrimaryAttr = list.find(item => item.isPrimaryKey);
        setRightAttr(rightPrimaryAttr || {});
        rightFormRef.current?.setFieldValue('attr', rightPrimaryAttr?.id);
        /*if (linkType == 1 && rightAttr.id) {
                    rightFormRef.current?.setFieldValue('attr', rightAttr.id);
                    setRightAttr({});
                }
                linkType == 2 ? setRightAttr(list.find(item => item.isPrimaryKey)) : '';*/
      });
    } /*else{
            setRightAttrList([]);
        }*/
    const newObjList = objList.map(item => {
      item.isRightId = item.id == targetObjectTypeId;
      return item;
    });
    setObjList(newObjList);
  }, [targetObjectTypeId]);

  const changeRelationSource = () => {
    if (sourceObjectTypeId && targetObjectTypeId) {
      setRightAttr({ ...leftAttr });
      rightFormRef.current.setFieldValue('targetObjectTypeId', sourceObjectTypeId);
      leftFormRef.current.setFieldValue('sourceObjectTypeId', targetObjectTypeId);
    } else if (sourceObjectTypeId) {
      setRightAttr({ ...leftAttr });
      rightFormRef.current.setFieldValue('targetObjectTypeId', sourceObjectTypeId);
      leftFormRef.current.setFieldValue('sourceObjectTypeId', void 0);
      setSourceObjectTypeId('');
    } else if (targetObjectTypeId) {
      leftFormRef.current.setFieldValue('sourceObjectTypeId', targetObjectTypeId);
      rightFormRef.current.setFieldValue('targetObjectTypeId', void 0);
      setTargetObjectTypeId('');
    }
  };
  const getRelationSourceConfig = () => {
    let data = {
      linkType,
      sourceObjectTypeId,
      targetObjectTypeId,
      sourceAttributeId: leftFormRef.current.getFieldValue('attr'), //leftAttr.id,
      sourceObject: objList.find(item => item.id == sourceObjectTypeId),
      targetObject: objList.find(item => item.id == targetObjectTypeId),
    };
    if (linkType == 1) {
      data.targetAttributeId = rightFormRef.current.getFieldValue('attr');
      data.linkMethod = baseFormRef.current.getFieldValue('linkMethod');
    }
    if (linkType == 2) {
      data.targetAttributeId = rightFormRef.current.getFieldValue('attr'); //rightAttr.id;
      data = { ...data, ...dataset, ...baseFormRef.current.getFieldsValue() };
    }
    return data;
  };
  const validate = async () => {
    let flag = true;
    if (linkType == 1) {
      try {
        await leftFormRef.current.validate();
        await rightFormRef.current.validate();
        /* if (!leftAttr.id) {
                    flag = false;
                    Message.error('左侧对象类型的属性为空')
                }*/
      } catch (e) {
        flag = false;
      }
    } else if (linkType == 2) {
      try {
        await leftFormRef.current.validate();
        await rightFormRef.current.validate();

        /*if (!leftAttr.id) {
                    flag = false;
                    Message.error('左侧对象类型的属性为空')
                }
                if (!rightAttr.id) {
                    flag = false;
                    Message.error('右侧对象类型的属性为空')
                }*/
        if (!dataset) {
          flag = false;
          Message.error('请选择数据集');
        } else {
          await baseFormRef.current.validate();
        }
      } catch (e) {
        flag = false;
      }
    }
    return flag;
  };
  useImperativeHandle(ref, () => ({
    getRelationSourceConfig,
    validate,
  }));
  const renderIcon = option => {
    if (!option) {
      return null;
    }
    let labelIcon = '';
    switch (option) {
      case 'string':
        labelIcon = <IconTextareaColor />;
        break;
      case 'int':
        labelIcon = <IconCounterColor />;
        break;
      case 'decimal':
        labelIcon = <IconDataIntegrationColor />;
        break;
      case 'bool':
        labelIcon = <IconUnitMgrColor />;
        break;
      case 'date':
        labelIcon = <IconCalendarColor />;
        break;
    }
    return labelIcon;
  };
  const renderAttr = item => {
    if (!item) {
      return null;
    }
    return (
      <Space size="mini">
        {renderIcon(item.fieldType)}
        <Typography.Text ellipsis={{ showTooltip: true }}>{item.attributeName}</Typography.Text>
        {item.isPrimaryKey ? (
          <Tag size="small" bordered color="arcoblue">
            Primary key
          </Tag>
        ) : (
          ''
        )}
        {item.isTitle ? (
          <Tag size="small" bordered color="cyan">
            Title
          </Tag>
        ) : (
          ''
        )}
      </Space>
    );
  };
  const getAllObjects = () => {
    getAllObject({ ontologyId: props.ontologyId }).then(res => {
      if (res.data.success) {
        const { data } = res.data;
        setObjList(data);
        setInitObjList(data);
      }
    });
  };
  const getObjectAttr = id => {
    return new Promise((resolve, reject) => {
      getObjectDetail({ id }).then(res => {
        if (res.data.success) {
          resolve(res.data.data.attributes);
        } else {
          Message.error('获取属性失败');
          resolve([]);
        }
      });
    });
  };

  const getLinkImg = type => {
    switch (type) {
      case 1:
        return linkImg1;
      case 2:
        return linkImg2;
      case 3:
        return linkImg3;
      case 4:
        return linkImg4;
      default:
        return linkImg1;
    }
  };
  useEffect(() => {
    getAllObjects();
  }, []);

  const getDataSet = param => {
    setDatasetList([]);
    setListLoading(true);
    getDataTables(param)
      .then(res => {
        if (res.data.success) {
          const { data } = res.data;
          setDatasetAll(data);
          setCurrent(1);
        } else {
          Message.error('查询数据集失败');
        }
      })
      .finally(() => {
        setListLoading(false);
      });
  };

  const getDataSources = () => {
    setDsOptions([]);
    setModelOptions([]);
    getDataSourceList().then(res => {
      if (res.data.success) {
        setDsOptions(res.data.data);
      } else {
        Message.error('查询数据源失败');
      }
    });
  };
  //获取字段信息
  const getDatasetFields = () => {
    const dsData = formRef.current?.getFieldsValue();
    if (tableName) {
      const param = {
        id: dsData.dsId,
        schema: dsData.dsSchema,
        tableName: tableName,
      };
      setLoading(true);
      getDataTableInfo(param)
        .then(res => {
          if (res.data.success) {
            const { data } = res.data;
            setTableData(data.columns.datas);
            // setSelectedRows(data.columns.datas);
            //  setSelectedRowKeys(data.columns.datas.map(item=>item.COLUMN_NAME))
          } else {
            setTableData([]);
            //  setSelectedRows([]);
            // setSelectedRowKeys([]);
            Message.error('查询字段信息失败');
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };
  const datasetValidate = async () => {
    let flag = true;
    if (linkType == 2) {
      try {
        await formRef.current.validate();
        if (!tableName) {
          flag = false;
          Message.error('未选择数据集');
        }
        if (tableData.length == 0) {
          flag = false;
          Message.error('未获取到字段');
        }
      } catch (e) {
        flag = false;
      }
    }
    return flag;
  };
  const handleDatasetModelOk = async () => {
    const valid = await datasetValidate();
    if (valid) {
      const formData = formRef.current.getFieldsValue();
      const data = {
        ...formData,
        middleDsId: formData.dsId,
        middleDsSchema: formData.dsSchema,
        middleTableName: tableName,
        middleDsName: dsOptions.find(item => item.id == formData.dsId)?.name || '',
      };
      setDataset(data);
      setStepModalVisible(false);
    }
  };
  useEffect(() => {
    rightFormRef.current.setFieldValue('targetObjectTypeId', void 0);
    leftFormRef.current.setFieldValue('sourceObjectTypeId', void 0);
    setSourceObjectTypeId('');
    setTargetObjectTypeId('');
    setLeftAttr({});
    setRightAttr({});
    if (linkType == 2) {
      getDataSources();
      setDataset(null);
      setTableData([]);
      setKeySearchValue('');
    }
  }, [linkType]);
  useEffect(() => {
    let filterDataset = [...datasetAll];
    if (keySearchValue.length > 0) {
      filterDataset = filterDataset.filter(item =>
        item.TABLE_NAME.toLowerCase().includes(keySearchValue.toLowerCase()),
      );
    }
    setTotal(filterDataset.length);
    setDatasetList(filterDataset.slice(0, pageSize * current));
    setScrollLoading(<Spin key={current} loading={pageSize * current < filterDataset.length} />);
  }, [keySearchValue, datasetAll, current, pageSize]);
  useEffect(() => {
    getDatasetFields();
  }, [tableName]);
  useEffect(() => {
    if (stepModalVisible) {
      setKeySearchValue('');
      if (dataset == null) {
        formRef.current?.resetFields();
      }
    }
  }, [stepModalVisible]);
  return (
    <>
      <div
        className="relation-source-container"
        style={{ display: props.isShow ? 'block' : 'none' }}
      >
        <div className="datasource-content">
          <div className="datasource-head">
            <div>
              <div className="dot"></div>
              {typeDetailInfo[linkType].srcName}
              <Typography.Text type="secondary">{typeDetailInfo[linkType].srcInfo}</Typography.Text>
            </div>
          </div>
          <div className="datasource-body">
            <img src={getLinkImg(linkType)} alt="" />
            {linkType == 1 ? (
              <div className="obj-attr-select">
                <div className="select-form">
                  <Form
                    ref={leftFormRef}
                    autoComplete="off"
                    wrapperCol={{ span: 24 }}
                    onValuesChange={onObjValuesChange}
                  >
                    <FormItem
                      field="sourceObjectTypeId"
                      rules={[{ required: true, message: '请选择对象类型' }]}
                    >
                      <Select
                        showSearch
                        placeholder="请选择"
                        filterOption={(inputValue, option) =>
                          option.props.extra.objectTypeName
                            .toLowerCase()
                            .indexOf(inputValue.toLowerCase()) >= 0 ||
                          option.props.extra.objectTypeLabel
                            .toLowerCase()
                            .indexOf(inputValue.toLowerCase()) >= 0
                        }
                      >
                        {objList.map(item => (
                          <Option
                            value={item.id}
                            key={item.id}
                            extra={item}
                            // disabled={item.isRightId}
                          >
                            <ObjectIcon icon={item.icon} /> {item.objectTypeLabel}
                          </Option>
                        ))}
                      </Select>
                    </FormItem>
                    {/*<FormItem>
                                  <div className="attr-content">
                                      {renderAttr(leftAttr)}
                                  </div>
                              </FormItem>*/}
                    <FormItem
                      field="attr"
                      rules={[{ required: true, message: '请选择对象类型的属性' }]}
                    >
                      <Select
                        placeholder="请选择"
                        showSearch
                        filterOption={(inputValue, option) =>
                          option.props.extra.attributeName
                            .toLowerCase()
                            .indexOf(inputValue.toLowerCase()) >= 0
                        }
                      >
                        {leftAttrList.map(item => {
                          if (!item) return null;
                          return (
                            <Option value={item.id} key={item.id} extra={item}>
                              <Space size="mini" style={{ verticalAlign: 'top' }}>
                                {renderIcon(item.fieldType)}
                                <Typography.Text ellipsis={{ showTooltip: true }}>
                                  {item.attributeName}
                                </Typography.Text>
                                {item.isPrimaryKey ? (
                                  <Tag size="small" bordered color="arcoblue">
                                    Primary key
                                  </Tag>
                                ) : (
                                  ''
                                )}
                                {item.isTitle ? (
                                  <Tag size="small" bordered color="cyan">
                                    Title
                                  </Tag>
                                ) : (
                                  ''
                                )}
                              </Space>
                            </Option>
                          );
                        })}
                      </Select>
                    </FormItem>
                  </Form>
                </div>
                <Button
                  shape="circle"
                  onClick={changeRelationSource}
                  type="secondary"
                  className="change"
                  icon={<IconSwapLeftRight />}
                />
                <div className="select-form">
                  <Form
                    ref={rightFormRef}
                    autoComplete="off"
                    wrapperCol={{ span: 24 }}
                    onValuesChange={onObjValuesChange}
                  >
                    <FormItem
                      field="targetObjectTypeId"
                      rules={[{ required: true, message: '请选择对象类型' }]}
                    >
                      <Select
                        placeholder="请选择"
                        showSearch
                        filterOption={(inputValue, option) =>
                          option.props.extra.objectTypeName
                            .toLowerCase()
                            .indexOf(inputValue.toLowerCase()) >= 0 ||
                          option.props.extra.objectTypeLabel
                            .toLowerCase()
                            .indexOf(inputValue.toLowerCase()) >= 0
                        }
                      >
                        {objList.map(item => (
                          <Option
                            value={item.id}
                            key={item.id}
                            extra={item}
                            //  disabled={item.isLeftId}
                          >
                            {/* <Space size='mini'><IconDataResDirColor/><Typography.Text ellipsis={{ showTooltip: true }}>
                                                {item.objectTypeLabel}
                                            </Typography.Text></Space> */}
                            <ObjectIcon icon={item.icon} /> {item.objectTypeLabel}
                          </Option>
                        ))}
                      </Select>
                    </FormItem>
                    <FormItem
                      field="attr"
                      rules={[{ required: true, message: '请选择对象类型的属性' }]}
                    >
                      <Select
                        placeholder="请选择"
                        showSearch
                        filterOption={(inputValue, option) =>
                          option.props.extra.attributeName
                            .toLowerCase()
                            .indexOf(inputValue.toLowerCase()) >= 0
                        }
                      >
                        {rightAttrList.map(item => {
                          if (!item) return null;
                          return (
                            <Option value={item.id} key={item.id} extra={item}>
                              <Space size="mini" style={{ verticalAlign: 'top' }}>
                                {renderIcon(item.fieldType)}
                                <Typography.Text ellipsis={{ showTooltip: true }}>
                                  {item.attributeName}
                                </Typography.Text>
                                {item.isPrimaryKey ? (
                                  <Tag size="small" bordered color="arcoblue">
                                    Primary key
                                  </Tag>
                                ) : (
                                  ''
                                )}
                                {item.isTitle ? (
                                  <Tag size="small" bordered color="cyan">
                                    Title
                                  </Tag>
                                ) : (
                                  ''
                                )}
                              </Space>
                            </Option>
                          );
                        })}
                      </Select>
                    </FormItem>
                  </Form>
                </div>
              </div>
            ) : (
              ''
            )}
            {linkType == 2 ? (
              <div className="obj-attr-select link-type-2">
                <div className="select-form">
                  <Form
                    ref={leftFormRef}
                    autoComplete="off"
                    wrapperCol={{ span: 24 }}
                    onValuesChange={onObjValuesChange}
                  >
                    <FormItem
                      field="sourceObjectTypeId"
                      rules={[{ required: true, message: '请选择对象类型' }]}
                    >
                      <Select
                        placeholder="请选择"
                        showSearch
                        filterOption={(inputValue, option) =>
                          option.props.extra.objectTypeName
                            .toLowerCase()
                            .indexOf(inputValue.toLowerCase()) >= 0 ||
                          option.props.extra.objectTypeLabel
                            .toLowerCase()
                            .indexOf(inputValue.toLowerCase()) >= 0
                        }
                      >
                        {objList.map(item => (
                          <Option
                            value={item.id}
                            key={item.id}
                            extra={item}
                            //   disabled={item.isRightId}
                          >
                            {/* <Space size='mini'><IconDataResDirColor/><Typography.Text ellipsis={{ showTooltip: true }}>
                                                {item.objectTypeLabel}
                                            </Typography.Text></Space> */}
                            <ObjectIcon icon={item.icon} /> {item.objectTypeLabel}
                          </Option>
                        ))}
                      </Select>
                    </FormItem>

                    {/* <FormItem>
                                 <div className="attr-content">
                                     {renderAttr(leftAttr)}
                                 </div>
                              </FormItem>*/}
                    <FormItem
                      field="attr"
                      rules={[{ required: true, message: '请选择对象类型的属性' }]}
                    >
                      <Select
                        placeholder="请选择"
                        showSearch
                        filterOption={(inputValue, option) =>
                          option.props.extra.attributeName
                            .toLowerCase()
                            .indexOf(inputValue.toLowerCase()) >= 0
                        }
                      >
                        {leftAttrList.map(item => {
                          if (!item) return null;
                          return (
                            <Option value={item.id} key={item.id} extra={item}>
                              <Space size="mini" style={{ verticalAlign: 'top' }}>
                                {renderIcon(item.fieldType)}
                                <Typography.Text ellipsis={{ showTooltip: true }}>
                                  {item.attributeName}
                                </Typography.Text>
                                {item.isPrimaryKey ? (
                                  <Tag size="small" bordered color="arcoblue">
                                    Primary key
                                  </Tag>
                                ) : (
                                  ''
                                )}
                                {item.isTitle ? (
                                  <Tag size="small" bordered color="cyan">
                                    Title
                                  </Tag>
                                ) : (
                                  ''
                                )}
                              </Space>
                            </Option>
                          );
                        })}
                      </Select>
                    </FormItem>
                  </Form>
                </div>
                <div className="select-form">
                  <Form
                    ref={rightFormRef}
                    autoComplete="off"
                    wrapperCol={{ span: 24 }}
                    onValuesChange={onObjValuesChange}
                  >
                    <FormItem
                      field="targetObjectTypeId"
                      rules={[{ required: true, message: '请选择对象类型' }]}
                    >
                      <Select
                        placeholder="请选择"
                        showSearch
                        filterOption={(inputValue, option) =>
                          option.props.extra.objectTypeName
                            .toLowerCase()
                            .indexOf(inputValue.toLowerCase()) >= 0 ||
                          option.props.extra.objectTypeLabel
                            .toLowerCase()
                            .indexOf(inputValue.toLowerCase()) >= 0
                        }
                      >
                        {objList.map(item => (
                          <Option
                            value={item.id}
                            key={item.id}
                            extra={item}
                            //   disabled={item.isLeftId}
                          >
                            {/* <Space size='mini'><IconDataResDirColor/><Typography.Text ellipsis={{ showTooltip: true }}>
                                                {item.objectTypeLabel}
                                            </Typography.Text></Space> */}
                            <ObjectIcon icon={item.icon} /> {item.objectTypeLabel}
                          </Option>
                        ))}
                      </Select>
                    </FormItem>
                    {/*<FormItem>
                                  <div className="attr-content">
                                      {renderAttr(rightAttr)}
                                  </div>
                              </FormItem>*/}
                    <FormItem
                      field="attr"
                      rules={[{ required: true, message: '请选择对象类型的属性' }]}
                    >
                      <Select
                        placeholder="请选择"
                        showSearch
                        filterOption={(inputValue, option) =>
                          option.props.extra.attributeName
                            .toLowerCase()
                            .indexOf(inputValue.toLowerCase()) >= 0
                        }
                      >
                        {rightAttrList.map(item => {
                          if (!item) return null;
                          return (
                            <Option value={item.id} key={item.id} extra={item}>
                              <Space size="mini" style={{ verticalAlign: 'top' }}>
                                {renderIcon(item.fieldType)}
                                <Typography.Text ellipsis={{ showTooltip: true }}>
                                  {item.attributeName}
                                </Typography.Text>
                                {item.isPrimaryKey ? (
                                  <Tag size="small" bordered color="arcoblue">
                                    Primary key
                                  </Tag>
                                ) : (
                                  ''
                                )}
                                {item.isTitle ? (
                                  <Tag size="small" bordered color="cyan">
                                    Title
                                  </Tag>
                                ) : (
                                  ''
                                )}
                              </Space>
                            </Option>
                          );
                        })}
                      </Select>
                    </FormItem>
                  </Form>
                </div>
              </div>
            ) : (
              ''
            )}
            {linkType == 4 ? (
              <div className="obj-attr-select">
                <div className="select-form">
                  <Form
                    ref={leftFormRef}
                    autoComplete="off"
                    wrapperCol={{ span: 24 }}
                    onValuesChange={onObjValuesChange}
                  >
                    <FormItem
                      field="sourceObjectTypeId"
                      rules={[{ required: true, message: '请选择对象类型' }]}
                    >
                      <Select
                        showSearch
                        placeholder="请选择"
                        filterOption={(inputValue, option) =>
                          option.props.extra.objectTypeName
                            .toLowerCase()
                            .indexOf(inputValue.toLowerCase()) >= 0 ||
                          option.props.extra.objectTypeLabel
                            .toLowerCase()
                            .indexOf(inputValue.toLowerCase()) >= 0
                        }
                      >
                        {objList.map(item => (
                          <Option
                            value={item.id}
                            key={item.id}
                            extra={item}
                            // disabled={item.isRightId}
                          >
                            <ObjectIcon icon={item.icon} /> {item.objectTypeLabel}
                          </Option>
                        ))}
                      </Select>
                    </FormItem>
                  </Form>
                </div>
                <Button
                  shape="circle"
                  onClick={changeRelationSource}
                  type="secondary"
                  className="change"
                  icon={<IconSwapLeftRight />}
                />
                <div className="select-form">
                  <Form
                    ref={rightFormRef}
                    autoComplete="off"
                    wrapperCol={{ span: 24 }}
                    onValuesChange={onObjValuesChange}
                  >
                    <FormItem
                      field="targetObjectTypeId"
                      rules={[{ required: true, message: '请选择对象类型' }]}
                    >
                      <Select
                        placeholder="请选择"
                        showSearch
                        filterOption={(inputValue, option) =>
                          option.props.extra.objectTypeName
                            .toLowerCase()
                            .indexOf(inputValue.toLowerCase()) >= 0 ||
                          option.props.extra.objectTypeLabel
                            .toLowerCase()
                            .indexOf(inputValue.toLowerCase()) >= 0
                        }
                      >
                        {objList.map(item => (
                          <Option
                            value={item.id}
                            key={item.id}
                            extra={item}
                            //  disabled={item.isLeftId}
                          >
                            {/* <Space size='mini'><IconDataResDirColor/><Typography.Text ellipsis={{ showTooltip: true }}>
                                                {item.objectTypeLabel}
                                            </Typography.Text></Space> */}
                            <ObjectIcon icon={item.icon} /> {item.objectTypeLabel}
                          </Option>
                        ))}
                      </Select>
                    </FormItem>
                  </Form>
                </div>
              </div>
            ) : (
              ''
            )}
          </div>
        </div>
        {linkType == 2 ? (
          <div className="datasource-content">
            <div className="datasource-head">
              <div>
                <div className="dot"></div>
                {typeDetailInfo[linkType].srcSet}
                <Typography.Text type="secondary">
                  {typeDetailInfo[linkType].setInfo}
                </Typography.Text>
              </div>
            </div>
            <div className="datasource-body">
              <div className="dataset-choose">
                <div className={`dataset-content ${dataset ? 'active' : ''}`}>
                  <div className="dataset-icon">
                    <IconDataCatalogMgrColor />
                  </div>
                  {dataset ? (
                    <div className="dataset-info">
                      {dataset.middleTableName}{' '}
                      <Typography.Text type="secondary">
                        {dataset.middleDsName}/{dataset.middleDsSchema}
                      </Typography.Text>
                    </div>
                  ) : (
                    '请选择数据集'
                  )}
                </div>
                <div className="dataset-btn">
                  <Button type="text" onClick={() => setStepModalVisible(true)}>
                    请选择数据集
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          ''
        )}
        {linkType == 4 ? null : (
          <div className="datasource-content">
            <div className="datasource-head">
              <div>
                <div className="dot"></div>
                基数设置
                <Typography.Text type="secondary">
                  {typeDetailInfo[linkType].baseInfo}
                </Typography.Text>
              </div>
            </div>
            <div className="datasource-content">
              {linkType == 1 ? (
                <Form
                  ref={baseFormRef}
                  initialValues={{ linkMethod: 1 }}
                  autoComplete="off"
                  layout="inline"
                  wrapperCol={{ span: 24 }}
                >
                  <Grid.Col span={9}>
                    <div className="obj-content">
                      <Space>
                        {sourceObjectTypeId ? <IconDataResDirColor /> : ''}
                        <Typography.Text ellipsis={{ showTooltip: true }}>
                          {objList.find(item => item.id == sourceObjectTypeId)?.objectTypeLabel}
                        </Typography.Text>
                      </Space>
                    </div>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <FormItem field="linkMethod">
                      <Select placeholder="请选择">
                        {relationTypes.map(item => (
                          <Option value={item.value} key={item.value}>
                            {item.label}
                          </Option>
                        ))}
                      </Select>
                    </FormItem>
                  </Grid.Col>
                  <Grid.Col span={9}>
                    <div className="obj-content">
                      <Space>
                        {targetObjectTypeId ? <IconDataResDirColor /> : ''}
                        <Typography.Text ellipsis={{ showTooltip: true }}>
                          {objList.find(item => item.id == targetObjectTypeId)?.objectTypeLabel}
                        </Typography.Text>
                      </Space>
                    </div>
                  </Grid.Col>
                </Form>
              ) : (
                ''
              )}
              {linkType == 2 ? (
                <Form
                  ref={baseFormRef}
                  autoComplete="off"
                  layout="vertical"
                  wrapperCol={{ span: 24 }}
                >
                  <FormItem
                    label={
                      <span>
                        左侧映射字段
                        <Tooltip content="">
                          {' '}
                          <IconHelpColor style={{ marginLeft: 3 }} />
                        </Tooltip>
                      </span>
                    }
                    field="middleSourceField"
                    rules={[{ required: true, message: '请选择字段' }]}
                  >
                    <Select placeholder="请选择">
                      {tableData.map(item => (
                        <Option value={item.COLUMN_NAME} key={item.COLUMN_NAME}>
                          {item.COLUMN_NAME}
                        </Option>
                      ))}
                    </Select>
                  </FormItem>
                  <FormItem
                    label={
                      <span>
                        右侧映射字段
                        <Tooltip content="">
                          {' '}
                          <IconHelpColor style={{ marginLeft: 3 }} />
                        </Tooltip>
                      </span>
                    }
                    field="middleTargetField"
                    rules={[{ required: true, message: '请选择字段' }]}
                  >
                    <Select placeholder="请选择">
                      {tableData.map(item => (
                        <Option value={item.COLUMN_NAME} key={item.COLUMN_NAME}>
                          {item.COLUMN_NAME}
                        </Option>
                      ))}
                    </Select>
                  </FormItem>
                </Form>
              ) : (
                ''
              )}
            </div>
          </div>
        )}
      </div>
      <Modal
        title={<div style={{ textAlign: 'left', fontWeight: 600 }}>选择数据集</div>}
        style={{ width: '1000px' }}
        visible={stepModalVisible}
        onOk={handleDatasetModelOk}
        onCancel={() => {
          setStepModalVisible(false);
        }}
        autoFocus={false}
        focusLock
        className="relation-step-modal"
      >
        <div className="relation-dataset-container">
          <Form
            ref={formRef}
            autoComplete="off"
            layout="vertical"
            className="dataset-form"
            onValuesChange={onValuesChange}
          >
            <FormItem
              label="数据源"
              field="dsId"
              rules={[{ required: true, message: '请选择数据源' }]}
            >
              <Select
                placeholder={loginT('请选择数据源')}
                showSearch
                filterOption={(inputValue, option) =>
                  option.props.extra.name.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0
                }
              >
                {dsOptions.map((option, index) => (
                  <Option key={option.id} value={option.id} extra={option}>
                    {option.name}
                  </Option>
                ))}
              </Select>
            </FormItem>
            <FormItem
              label="模式"
              field="dsSchema"
              rules={[{ required: true, message: '请选择模式' }]}
            >
              <Select placeholder={loginT('请选择模式')} showSearch>
                {modelOptions.map((option, index) => (
                  <Option key={option} value={option}>
                    {option}
                  </Option>
                ))}
              </Select>
            </FormItem>
          </Form>
          <div className="dataset-container">
            <div className="dataset-left">
              <div className="dataset-head">
                <span>数据集</span>
              </div>
              <Spin style={{ display: 'block', width: '100%' }} loading={listLoading}>
                {datasetAll.length > 0 ? (
                  <InputSearch
                    allowClear
                    placeholder={loginT('请输入')}
                    value={keySearchValue}
                    className="search-input"
                    onChange={keySearch}
                  />
                ) : (
                  ''
                )}
                {datasetList.length > 0 ? (
                  <List
                    className="dataset-list"
                    onReachBottom={currentPage => setCurrent(current + 1)}
                    dataSource={datasetList}
                    render={(item, index) => (
                      <List.Item
                        key={item.TABLE_NAME}
                        className={`list-item ${item.TABLE_NAME == tableName ? 'active' : ''}`}
                        onClick={() => setTableName(item.TABLE_NAME)}
                      >
                        <Tooltip content={item.TABLE_NAME}> {item.TABLE_NAME}</Tooltip>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty
                    icon={
                      <div
                        style={{
                          display: 'inline-flex',
                          width: 48,
                          height: 48,
                        }}
                      >
                        <img src={emptyIcon} />
                      </div>
                    }
                    description={loginT('未选择数据集')}
                  />
                )}
              </Spin>
            </div>
            <div className="dataset-arrow">
              <div className={`right-icon ${tableName ? '' : 'empty'}`}>
                <img className="gt" src={rightIcon} />
              </div>
            </div>
            <div className="dataset-right">
              <div className="dataset-head">
                <span>字段</span>
              </div>
              <div className="dataset-content">
                <Spin style={{ display: 'block', width: '100%', height: '100%' }} loading={loading}>
                  {tableData.length > 0 ? (
                    <Table
                      columns={columns}
                      data={tableData}
                      scroll={{
                        x: false,
                        y: 440,
                      }}
                      style={{
                        minHeight: '200px',
                      }}
                      rowKey="COLUMN_NAME"
                      pagination={false}
                      /*rowSelection={{
                                          type: 'checkbox',
                                          selectedRowKeys,
                                          onChange: (selectedRowKeys, selectedRows) => {
                                              setSelectedRowKeys(selectedRowKeys);
                                              setSelectedRows(selectedRows);
                                          },
                                          onSelect: (selected, record, selectedRows) => {
                                          },
                                      }}*/
                    />
                  ) : (
                    <Empty
                      icon={
                        <div
                          style={{
                            display: 'inline-flex',
                            width: 48,
                            height: 48,
                          }}
                        >
                          <img src={emptyIcon} />
                        </div>
                      }
                      description={loginT('未选择字段')}
                    />
                  )}
                </Spin>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default forwardRef(source);
