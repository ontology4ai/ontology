import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { connect } from 'react-redux';
import useLocale from 'modo-plugin-common/src/utils/useLocale';

import getAppName from 'modo-plugin-common/src/core/src/utils/getAppName';
import {
  Form,
  Tooltip,
  Select,
  Input,
  Button,
  Table,
  TableColumnProps,
  Trigger,
  Checkbox,
  Space,
  Tag,
  Message,
  Alert,
  Upload,
  Modal,
} from '@arco-design/web-react';
import i18n from '../../locale';

import './index.less';
import {
  IconSearchColor,
  IconBackupsShareColor,
  IconBrushColor,
  IconCalendarColor,
  IconCounterColor,
  IconDataIntegrationColor,
  IconTextareaColor,
  IconUnitMgrColor,
  IconHelpColor,
  IconAiColor,
  IconInformationColor,
  IconUploadColor,
  IconApiMgr,
  IconAdd,
  IconDownloadColor,
  IconDocumentColor,
  IconTick,
  IconDonutChartFill,
  IconDeleteColor,
} from 'modo-design/icon';
import { getAttrSuggest, getAllApi, getApiRes } from '../../api';
import { downloadTemple, importFile } from '@/pages/interface-manager/api';
const FormItem = Form.Item;
const { Option } = Select;
const InputSearch = Input.Search;

const typeOptions = [
  { value: 'string', label: '字符型' },
  { value: 'int', label: '整数型' },
  { value: 'decimal', label: '浮点数型' },
  { value: 'date', label: '日期型' },
  { value: 'bool', label: '布尔型' },
];
function parseDbType(dbType) {
  if (dbType == null) {
    return 'string'; // 默认类型
  }
  // 转成小写并去除空白
  const type = dbType.trim().toLowerCase();

  // String 类型
  if (type.includes('char') || type.includes('text') || type === 'uuid' || type === 'xml') {
    return 'string';
  }

  // Int 类型
  if (
    type.includes('int') ||
    type === 'smallint' ||
    type === 'integer' ||
    type === 'tinyint' ||
    type === 'mediumint' ||
    type === 'bigint'
  ) {
    return 'int';
  }

  // Decimal/Float/Double 类型
  if (
    type.includes('dec') ||
    type.includes('numeric') ||
    type.includes('number') ||
    type.includes('float') ||
    type.includes('real') ||
    type.includes('double')
  ) {
    return 'decimal';
  }

  // Date/Time 类型
  if (
    type.includes('date') ||
    type.includes('time') ||
    type === 'datetime' ||
    type === 'timestamp' ||
    type === 'year'
  ) {
    return 'date';
  }

  // Boolean 类型
  if (type.includes('bool') || type === 'boolean') {
    return 'bool';
  }

  // 默认
  return 'string';
}

const formatRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]*$/;
const chineseOrLetterRegex = /[\u4e00-\u9fa5a-zA-Z]/;

const attrConfig = forwardRef((props, ref) => {
  const t = useLocale();
  const loginT = useLocale(i18n);
  const columns1: TableColumnProps[] = [
    {
      title: '字段',
      dataIndex: 'COLUMN_NAME',
    },
    {
      title: '属性类型',
      dataIndex: 'DATA_TYPE',
      render: (col, record, index) => (
        <Space size="mini">
          {renderIcon(record.DATA_TYPE)}
          {typeOptions.find(item => item.value == col)?.label}
        </Space>
      ),
    },
    {
      title: '属性名称',
      dataIndex: 'attributeName',
      width: 200,
      render: (col, record, index) => (
        <div className="attr-tr">
          <Input
            value={col}
            key={index}
            error={!col || col.length == 0 || record.error}
            style={{ width: '100%' }}
            disabled={record.isShared}
            onChange={value => {
              onChangeRow1(
                {
                  ...record,
                  attributeName: value.trim(),
                },
                index,
              );
            }}
            placeholder="请输入"
            maxLength={50}
            showWordLimit
          />
          <div className="attr-tag">
            {record.isShared ? (
              <IconBackupsShareColor style={{ color: 'var(--color-magenta-6)' }} />
            ) : (
              ''
            )}
            {record.isPrimaryKey ? (
              <Tag size="small" bordered color="arcoblue">
                Primary key
              </Tag>
            ) : (
              ''
            )}
            {record.isTitle ? (
              <Tag size="small" bordered color="cyan">
                Title
              </Tag>
            ) : (
              ''
            )}
            {record.isShared ? (
              <IconBrushColor
                onClick={() => {
                  onChangeRow1(
                    {
                      ...record,
                      attributeName: '',
                      isShared: false,
                    },
                    index,
                  );
                }}
              />
            ) : (
              ''
            )}
          </div>
        </div>
      ),
    },
    {
      title: '属性描述',
      dataIndex: 'attributeDesc',
      width: 200,
      render: (col, record, index) => (
        <div className="attr-tr">
          <Input
            value={col}
            key={index}
            style={{ width: '100%' }}
            disabled={record.isShared}
            onChange={value => {
              onChangeRow1(
                {
                  ...record,
                  attributeDesc: value.trim(),
                },
                index,
              );
            }}
            placeholder="请输入"
            maxLength={50}
            showWordLimit
          />
        </div>
      ),
    },
    {
      title: loginT('操作'),
      dataIndex: 'handle',
      width: 100,
      render: (col, record, index) => {
        return (
          <span className="table-btn-group">
            <Button type="text" onClick={() => deleteTableData1(record)}>
              删除
            </Button>
            {/* <Button type='text'>添加共享属性</Button> */}
          </span>
        );
      },
    },
  ];
  const columnsSql: TableColumnProps[] = [
    {
      title: '字段',
      dataIndex: 'COLUMN_NAME',
    },
    {
      title: '属性类型',
      dataIndex: 'DATA_TYPE',
      render: (col, record, index) => (
        record.isNew ? (
          <div className="attr-data-type">
            <Select
              key={index}
              value={col}
              error={!col}
              placeholder="请选择"
              style={{ width: '100%' }}
              onChange={value => {
                onChangeRow1(
                  {
                    ...record,
                    DATA_TYPE: value,
                  },
                  index,
                );
              }}
            >
              {typeOptions.map(item => (
                <Option value={item.value} key={item.value}>
                  <Space size="mini">
                    {renderIcon(item.value)}
                    {item.label}
                  </Space>
                </Option>
              ))}
            </Select>
          </div>
        ) : (
          <Space size="mini">
            {renderIcon(record.DATA_TYPE)}
            {typeOptions.find(item => item.value == col)?.label}
          </Space>
        )
      ),
    },
    {
      title: '属性名称',
      dataIndex: 'attributeName',
      width: 200,
      render: (col, record, index) => (
        <div className="attr-tr">
          <Input
            value={col}
            key={index}
            error={!col || col.length == 0 || record.error}
            style={{ width: '100%' }}
            disabled={record.isShared}
            onChange={value => {
              onChangeRow1(
                {
                  ...record,
                  attributeName: value.trim(),
                },
                index,
              );
            }}
            placeholder="请输入"
            maxLength={50}
            showWordLimit
          />
          <div className="attr-tag">
            {record.isShared ? (
              <IconBackupsShareColor style={{ color: 'var(--color-magenta-6)' }} />
            ) : (
              ''
            )}
            {record.isPrimaryKey ? (
              <Tag size="small" bordered color="arcoblue">
                Primary key
              </Tag>
            ) : (
              ''
            )}
            {record.isTitle ? (
              <Tag size="small" bordered color="cyan">
                Title
              </Tag>
            ) : (
              ''
            )}
            {record.isShared ? (
              <IconBrushColor
                onClick={() => {
                  onChangeRow1(
                    {
                      ...record,
                      attributeName: '',
                      isShared: false,
                    },
                    index,
                  );
                }}
              />
            ) : (
              ''
            )}
          </div>
        </div>
      ),
    },
    {
      title: '属性描述',
      dataIndex: 'attributeDesc',
      width: 200,
      render: (col, record, index) => (
        <div className="attr-tr">
          <Input
            value={col}
            key={index}
            style={{ width: '100%' }}
            disabled={record.isShared}
            onChange={value => {
              onChangeRow1(
                {
                  ...record,
                  attributeDesc: value.trim(),
                },
                index,
              );
            }}
            placeholder="请输入"
            maxLength={50}
            showWordLimit
          />
        </div>
      ),
    }
  ];
  const columns2: TableColumnProps[] = [
    {
      title: '属性类型',
      dataIndex: 'DATA_TYPE',
      width: 128,
      render: (col, record, index) => (
        <div className="attr-data-type">
          <Select
            key={index}
            value={col}
            error={!col}
            disabled={record.interfaceId}
            placeholder="请选择"
            style={{ width: '100%' }}
            onChange={value => {
              onChangeRow2(
                {
                  ...record,
                  DATA_TYPE: value,
                },
                index,
              );
            }}
          >
            {typeOptions.map(item => (
              <Option value={item.value} key={item.value}>
                <Space size="mini">
                  {renderIcon(item.value)}
                  {item.label}
                </Space>
              </Option>
            ))}
          </Select>
        </div>
      ),
    },
    {
      title: '属性中文名称',
      dataIndex: 'attributeName',
      width: 180,
      render: (col, record, index) => (
        <div className="attr-tr">
          <Input
            key={index}
            value={col}
            error={!col || col.length == 0 || record.error}
            style={{ width: '100%' }}
            disabled={record.isShared || record.interfaceId}
            onChange={value => {
              const formatRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]*$/;
              const chineseOrLetterRegex = /[\u4e00-\u9fa5a-zA-Z]/;
              onChangeRow2(
                {
                  ...record,
                  error: !formatRegex.test(value) || !chineseOrLetterRegex.test(value),
                  attributeName: value.trim(),
                },
                index,
              );
            }}
            placeholder="请输入"
            maxLength={50}
            showWordLimit
          />
          <div className="attr-tag">
            {record.isShared ? (
              <IconBackupsShareColor style={{ color: 'var(--color-magenta-6)' }} />
            ) : (
              ''
            )}
            {record.isPrimaryKey ? (
              <Tag size="small" bordered color="arcoblue">
                Primary key
              </Tag>
            ) : (
              ''
            )}
            {record.isTitle ? (
              <Tag size="small" bordered color="cyan">
                Title
              </Tag>
            ) : (
              ''
            )}
            {record.isShared ? (
              <IconBrushColor
                onClick={() => {
                  onChangeRow2(
                    {
                      ...record,
                      attributeName: '',
                      isShared: false,
                    },
                    index,
                  );
                }}
              />
            ) : (
              ''
            )}
          </div>
        </div>
      ),
    },
    {
      title: '属性英文名称',
      dataIndex: 'attributeLabel',
      width: 160,
      render: (col, record, index) => (
        <div className="attr-tr">
          <Input
            key={index}
            value={col}
            error={record.labelError}
            style={{ width: '100%' }}
            disabled={record.isShared || record.interfaceId}
            onChange={value => {
              onChangeRow2(
                {
                  ...record,
                  labelError: value && !/^(?=.*[a-zA-Z])[a-zA-Z0-9_]+$/.test(value),
                  attributeLabel: value.trim(),
                },
                index,
              );
            }}
            placeholder="请输入"
            maxLength={50}
            showWordLimit
          />
        </div>
      ),
    },
    {
      title: '属性描述',
      dataIndex: 'attributeDesc',
      width: 180,
      render: (col, record, index) => (
        <div className="attr-tr">
          <Input
            value={col}
            key={index}
            style={{ width: '100%' }}
            disabled={record.isShared}
            onChange={value => {
              onChangeRow2(
                {
                  ...record,
                  attributeDesc: value.trim(),
                },
                index,
              );
            }}
            placeholder="请输入"
            maxLength={50}
            showWordLimit
          />
        </div>
      ),
    },
    {
      title: loginT('操作'),
      dataIndex: 'handle',
      // width:160,
      render: (col, record, index) => {
        return (
          <span className="table-btn-group">
            <Button
              type="text"
              disabled={record.interfaceId && record.isRequired}
              onClick={() => deleteTableData2(record, index)}
            >
              删除
            </Button>
            {/* <Button type='text'>添加共享属性</Button> */}
          </span>
        );
      },
    },
  ];
  const { attributesList, attrType, interfaceAttr, interfaceId } = props; //attrType=1有字段，attrType=2无字段，需要手动添加
  const [tableData, setTableData] = useState([]);
  const [allAttrData, setAllAttrData] = useState([]);
  // const [filterAttrData,setFilterAttrData]=useState([]);
  const [keySearchValue, setKeySearchValue] = useState('');
  const [popVisible, setPopVisible] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [checkedFields, setCheckedFields] = useState([]);
  const [attrlist, setAttrlist] = useState([]);

  const [importVisible, setImportVisible] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const [downLoading, setDownLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiModalVisible, setApiModalVisible] = useState(false);
  const [apiOptions, setApiOptions] = useState<any[]>([]);
  const formRef = useRef();
  const apiFormRef = useRef();
  const dropdownRef = useRef(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const checkedFieldsRef = useRef([]);
  const allAttrDataRef = useRef(allAttrData);
  useImperativeHandle(ref, () => ({
    getAttrData,
    validate,
  }));

  useEffect(() => {
    checkedFieldsRef.current = checkedFields;
  }, [checkedFields]);
  useEffect(() => {
    formRef.current?.setFieldsValue({ primaryKey: undefined, title: undefined });
    setTableLoading(false);
    if (attrType == '2') {
      if (interfaceAttr.length > 0) {
        const data = interfaceAttr.map(item => {
          return {
            DATA_TYPE: item.type,
            attributeName: item.label,
            attributeLabel: item.name,
            attributeDesc: item.description,
            interfaceId: item.interfaceId,
            interfaceType: 2,
            interfaceAttrId: item.id,
            isRequired: item.isRequired,
          };
        });
        setTableData(data);
      } else {
        setTableData([]);
      }
    } else {
      /*if(attributesList && attributesList.length > 0) {
                setTableLoading(true);
                const data = attributesList.map(item=>{
                    item.attributeName = '';
                    return item;
                });
                setAllAttrData(data);
                const attrArr = attributesList.map(item => {
                    return item.COLUMN_NAME
                });
                getAttrSuggest({fieldNames: attrArr}).then(res => {
                    if(res.data.success) {
                        setAttrlist(res.data.data);
                        const data = attributesList.map(item=>{
                            item.attributeName = res.data.data[item.COLUMN_NAME];
                            return item;
                        });
                        setAllAttrData(data);
                    }
                }).finally(()=>{
                    setTableLoading(false);
                })
            }else{
                setAllAttrData([]);
            }*/
      const data = attributesList.map(item => {
        item.attributeName = item.COMMENTS;
        item.attributeLabel = item.COLUMN_NAME;
        item.DATA_TYPE = parseDbType(item.DATA_TYPE);
        item.attributeDesc = item.COMMENTS;
        return item;
      });
      setAllAttrData(data);
    }
  }, [attributesList, attrType, interfaceAttr]);
  useEffect(() => {
    attrType == '2' && props.isShow && getAllApiList();
  }, [attrType, props.isShow]);

  useEffect(() => {
    const table = allAttrData.filter(item => item.disabled);
    
    // 统计每个属性名称出现的次数（基于 allAttrData 中 disabled 为 true 的项）
    const nameCountMap = new Map();
    table.forEach(item => {
      if (item.attributeName && item.attributeName.trim()) {
        const name = item.attributeName.trim();
        nameCountMap.set(name, (nameCountMap.get(name) || 0) + 1);
      }
    });
    
    table.forEach(item=>{
      const hasFormatError = !formatRegex.test(item.attributeName) || !chineseOrLetterRegex.test(item.attributeName);
      const name = item.attributeName && item.attributeName.trim() ? item.attributeName.trim() : '';
      const isDuplicate = name ? (nameCountMap.get(name) || 0) > 1 : false;
      item.error = hasFormatError || isDuplicate;
    });
    setTableData(table);
    allAttrDataRef.current = allAttrData;
  }, [allAttrData, attrlist]);
  const getAllApiList = () => {
    setApiOptions([]);
    getAllApi()
      .then(res => {
        if (res.data.success) {
          setApiOptions(res.data.data);
        } else {
          throw 'err';
        }
      })
      .catch(err => {
        Message.error('获取api失败');
      });
  };
  const getAIAttr = () => {
    if (allAttrData && allAttrData.length > 0) {
      const attrArr = allAttrData.map(item => item.COLUMN_NAME);
      setTableLoading(true);
      getAttrSuggest({ fieldNames: attrArr })
        .then(res => {
          if (res.data.success) {
            setAttrlist(res.data.data);
            const data = allAttrData.map(item => ({
              ...item,
              attributeName: res.data.data[item.COLUMN_NAME] || item.attributeName,
            }));
            setAllAttrData(data);
          }
        })
        .finally(() => {
          setTableLoading(false);
        });
    }
  };
  /* useEffect(()=>{
        const data =allAttrData.filter(item=>item.COLUMN_NAME.toLowerCase().includes(keySearchValue.trim().toLowerCase()));
        setFilterAttrData(data);
    },[keySearchValue,allAttrData]);*/
  //属性变化时，主键和标题更新
  useEffect(() => {
    const formData = formRef.current.getFieldsValue();
    if (formData.primaryKey) {
      const primaryKeyIndex = tableData.findIndex(
        (item, index) =>
          `${item.COLUMN_NAME || item.attrId}+${item.attributeName}` == formData.primaryKey,
      );
      if (primaryKeyIndex == -1) {
        formRef.current.setFieldValue('primaryKey', null);
      }
    }
    if (formData.title) {
      const titleIndex = tableData.findIndex(
        (item, index) =>
          `${item.COLUMN_NAME || item.attrId}+${item.attributeName}` == formData.title,
      );
      if (titleIndex == -1) {
        formRef.current.setFieldValue('title', null);
      }
    }
  }, [tableData]);
  const handleCheckFields = () => {
    if (checkedFieldsRef.current?.length > 0) {
      const newData = [...allAttrDataRef.current]; // 使用 ref 获取最新值
      newData.forEach(item => {
        if (checkedFieldsRef.current.includes(item.COLUMN_NAME)) {
          item.disabled = true;
        }
      });
      setAllAttrData([...newData]);
      setCheckedFields([]);
    }
  };
  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        handleCheckFields();
        setPopVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  const onChangeRow1 = (row, index) => {
    const allTableIndex = allAttrData.findIndex(item => item.COLUMN_NAME == row.COLUMN_NAME);
    const newAllTable = [...allAttrData];
    newAllTable[allTableIndex] = row;
    
    // 检查所有属性名称是否重复
    const formatRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]*$/;
    const chineseOrLetterRegex = /[\u4e00-\u9fa5a-zA-Z]/;
    
    // 统计每个属性名称出现的次数
    const nameCountMap = new Map();
    newAllTable.forEach(item => {
      if (item.attributeName && item.attributeName.trim()) {
        const name = item.attributeName.trim();
        nameCountMap.set(name, (nameCountMap.get(name) || 0) + 1);
      }
    });
    
    // 更新所有行的 error 状态
    newAllTable.forEach(item => {
      if (item.attributeName && item.attributeName.trim()) {
        const name = item.attributeName.trim();
        const isDuplicate = (nameCountMap.get(name) || 0) > 1;
        const hasFormatError = !formatRegex.test(item.attributeName) || !chineseOrLetterRegex.test(item.attributeName);
        // 如果有格式错误或重复，设置 error 为 true
        item.error = hasFormatError || isDuplicate;
      } else {
        // 如果属性名称为空，只检查格式错误
        const hasFormatError = item.attributeName ? (!formatRegex.test(item.attributeName) || !chineseOrLetterRegex.test(item.attributeName)) : false;
        item.error = hasFormatError;
      }
    });
    
    setAllAttrData(newAllTable);
  };
  const onChangeRow2 = (row, index) => {
    const newData = [...tableData];
    newData[index] = row;
    setTableData(newData);
  };
  const deleteTableData1 = row => {
    const newData = [...allAttrData];
    newData.forEach(item => {
      if (item.COLUMN_NAME == row.COLUMN_NAME) {
        item.disabled = false;
        item.attributeName = row.COMMENTS;
      }
    });
    setAllAttrData([...newData]);
  };
  const deleteTableData2 = (row, index) => {
    const newData = [...tableData];
    newData.splice(index, 1);
    setTableData(newData);
  };
  const getAttrData = () => {
    const attr = formRef.current.getFieldsValue();
    const attributes = tableData.map(item => {
      return {
        ...item,
        fieldName: item.COLUMN_NAME,
        attributeName: item.attributeName,
        attributeLabel: item.attributeLabel,
        fieldType: item.DATA_TYPE,
        attributeDesc: item.attributeDesc,
        isPrimaryKey:
          `${item.COLUMN_NAME || item.attrId}+${item.attributeName}` == attr.primaryKey ? 1 : 0,
        isTitle: `${item.COLUMN_NAME || item.attrId}+${item.attributeName}` == attr.title ? 1 : 0,
      };
    });
    return attributes;
  };
  const validate = async () => {
    let valid = true;
    if (tableData.length == 0) {
      Message.error('未添加属性');
      return false;
    }
    const noDataTypeIndex = tableData.findIndex(item => !item.DATA_TYPE);
    if (noDataTypeIndex != -1) {
      Message.error('属性类型不能为空');
      return false;
    }
    const noAttributeNameIndex = tableData.findIndex(
      item => !item.attributeName || item.attributeName.length == 0,
    );
    if (noAttributeNameIndex != -1) {
      Message.error('属性不能为空');
      return false;
    }
    if (hasDuplicateAttributes(tableData)) {
      Message.error('属性名称不能重复');
      return false;
    }

    const errorAttributeNameIndex = tableData.findIndex(item => {
      const value = item.attributeName;
      const formatRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]*$/;
      const chineseOrLetterRegex = /[\u4e00-\u9fa5a-zA-Z]/;
      if (item.interfaceType) {
        return false;
      }
      return !formatRegex.test(value) || !chineseOrLetterRegex.test(value);
    });
    if (errorAttributeNameIndex != -1) {
      Message.error('属性名称仅支持中文、字母、数字和下划线，且必须包含中文或字母');
      return false;
    }
    const errorAttributeLabelIndex = tableData.findIndex(item => {
      const value = item.attributeLabel;
      if (item.interfaceType) {
        return false;
      }
      return !/^(?=.*[a-zA-Z])[a-zA-Z0-9_]+$/.test(value);
    });
    if (attrType == 2 && errorAttributeLabelIndex != -1) {
      Message.error('属性英文名称必须包含英文字母，且只能输入英文字母、数字和下划线');
      return false;
    }

    try {
      await formRef.current.validate();
    } catch (e) {
      valid = false;
    }
    return valid;
  };
  const hasDuplicateAttributes = objects => {
    // 提取所有 attribute 值
    const attributes = objects.map(obj => obj.attributeName);
    // 利用 Set 去重后比较长度
    const uniqueAttributes = new Set(attributes);
    return attributes.length !== uniqueAttributes.size;
  };
  const keySearch = val => {
    setKeySearchValue(val);
  };

  const renderIcon = option => {
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

  const addAttr = () => {
    const newData = {
      attrId: new Date().getTime(),
      attributeName: '',
      attributeLabel: '',
      DATA_TYPE: 'string',
    };
    setTableData([...tableData, newData]);
  };
  /* const handleImportFile = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };*/

  const renderUploadList = (fileList, props) => {
    return (
      <div className="arco-upload-list arco-upload-list-type-text rdf-upload">
        {fileList.map((file, index) => {
          return (
            <div
              key={`${index}-${file.name}`}
              className="arco-upload-list-item arco-upload-list-item-done"
            >
              <div className="arco-upload-list-item-text">
                <div className="arco-upload-list-item-text-content">
                  <div className="arco-upload-list-item-text-name">
                    <span className="arco-upload-list-file-icon">
                      <IconDocumentColor />
                    </span>
                    <span className="arco-upload-list-item-text-name-text">
                      <a>{file.name}</a>
                    </span>
                  </div>
                </div>
              </div>
              <div className="arco-upload-list-item-operation">
                {file.status === 'success' && (
                  <span className="arco-icon-hover">
                    <span className="arco-upload-list-remove-icon">
                      <IconTick style={{ fontSize: 12, color: '#55BC8A' }} />
                    </span>
                  </span>
                )}
                {file.status === 'fail' && (
                  <span className="arco-icon-hover">
                    <span className="arco-upload-list-remove-icon">
                      <span
                        style={{ fontSize: 12, color: '#3261CE' }}
                        onClick={() => {
                          handleUpload(file.originFile);
                        }}
                      >
                        点击重试
                      </span>
                    </span>
                  </span>
                )}
                {file.status === 'uploading' && (
                  <span className="arco-icon-hover">
                    <span className="arco-upload-list-remove-icon">
                      <IconDonutChartFill style={{ fontSize: 12, color: '#3261CE' }} spin />
                    </span>
                  </span>
                )}
                {file.status !== 'uploading' && (
                  <span className="arco-icon-hover">
                    <span className="arco-upload-list-remove-icon">
                      <IconDeleteColor
                        style={{ fontSize: 12 }}
                        onClick={() => {
                          deleteFile(file);
                        }}
                      />
                    </span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  const deleteFile = file => {
    const _fileList = [...fileList];
    const index = _fileList.findIndex(item => item.name === file.name);
    _fileList.splice(index, 1);
    setFileList(_fileList);
  };
  const onFileUploadChange = (fileList, file) => {
    setFileList([file]);
  };
  const handleDownTpl = () => {
    const host = `${window.location.host}`;
    const protocol = `${window.location.protocol}`;
    const _url = `${protocol}//${host}/${getAppName()}`;
    const url = `${_url}/_api/ontology/interface/attribute/downTemplate`;
    const a = document.createElement('a');
    a.href = url;
    a.click();
    /*setDownLoading(true);
        downloadTemple()
          .then(res => {
              if (res.data) {
                  const filename =
                    res.headers['content-disposition']?.match(/filename="?(.+?)"?$/)?.[1] || '模板.ttl';
                  const blob = new Blob([res.data]);
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = filename;
                  a.click();
                  setDownLoading(false);
                  window.URL.revokeObjectURL(url);
              }
          })
          .finally(() => {
              setDownLoading(false);
          });*/
  };
  const handleUpload = async file => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await importFile(formData);
      if (response.data.success && response.data.data) {
        const importedData = response.data.data.map((item: any, index: number) => ({
          key: Date.now() + index,
          attrId: Date.now() + index,
          type: item.type.toLowerCase(),
          DATA_TYPE: parseDbType(item.type.toLowerCase()),
          attributeLabel: item.name,
          attributeName: item.label,
          attributeDesc: item.description || '', // 确保有默认值
          error: !formatRegex.test(item.label) || !chineseOrLetterRegex.test(item.label),
          labelError: item.name && !/^(?=.*[a-zA-Z])[a-zA-Z0-9_]+$/.test(item.name),
        }));

        setTableData([...tableData, ...importedData]);
        Message.success('导入成功');
      } else {
        Message.error(response.message || '导入失败');
      }
    } catch (error) {
      Message.error('文件导入失败');
    }
  };
  const handleImportFile = () => {
    if (!fileList.length) {
      Message.error('请先上传文件');
      return;
    }
    handleUpload(fileList[0].originFile);
    setFileList([]);
    setImportVisible(false);
  };
  const handleImportAPI = async () => {
    try {
      await apiFormRef.current.validate();
      const apiId = apiFormRef.current.getFieldValue('api');
      setLoading(true);
      getApiRes({
        apiId,
        ontologyName: props.ontology?.ontologyName,
        objectName: props.objectData?.objectTypeName,
      })
        .then(res => {
          if (res.data.success) {
            const { data } = res.data;
            const id = new Date().getTime();
            const importData = [];
            data.forEach((item, index) => {
              if (item.columnLabel && item.columnType) {
                importData.push({
                  attrId: id + index,
                  DATA_TYPE: parseDbType(item.columnType.toLowerCase()),
                  attributeLabel: item.columnName || '',
                  attributeName: item.columnLabel,
                  attributeDesc: item.columnDesc || '',
                  error:
                    !formatRegex.test(item.columnLabel) ||
                    !chineseOrLetterRegex.test(item.columnLabel),
                  labelError:
                    item.columnName && !/^(?=.*[a-zA-Z])[a-zA-Z0-9_]+$/.test(item.columnName),
                });
              }
            });
            Message.success('API导入成功');
            if (importData.length == 0) {
              Message.warning('格式异常');
            } else {
              setTableData([...tableData, ...importData]);
            }
          } else {
            Message.error(res.data.message || 'API导入失败');
          }
        })
        .catch(err => {
          Message.error('API导入失败');
        })
        .finally(() => {
          setLoading(false);
          setApiModalVisible(false);
        });
    } catch (e) {}
  };

  /* const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const { files } = event.target;
        if (!files || files.length === 0) return;
        console.log('event.target', event.target, files);
        try {
            const formData = new FormData();
            formData.append('file', files[0]);
            const response = await importFile(formData);
            if (response.data.success && response.data.data) {
                const importedData = response.data.data.map((item: any, index: number) => ({
                    key: Date.now() + index,
                    id: Date.now() + index,
                    type: item.type.toLowerCase(),
                    DATA_TYPE:item.type.toLowerCase(),
                    attributeName:item.name,
                    attributeDesc:item.description || '', // 确保有默认值
                }));

                setTableData([...tableData,...importedData]);
                Message.success('导入成功');
            } else {
                Message.error(response.message || '导入失败');
            }
        } catch (error) {
            Message.error('文件导入失败');
        } finally {
            // 清空文件输入框
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };*/
  const onValuesChange = (changeValue: any, values: any) => {
    if (attrType == '1') {
      const allData = allAttrData.map(item => {
        if (`${item.COLUMN_NAME}+${item.attributeName}` == values.primaryKey) {
          item.isPrimaryKey = 1;
        } else {
          item.isPrimaryKey = 0;
        }
        if (`${item.COLUMN_NAME}+${item.attributeName}` == values.title) {
          item.isTitle = 1;
        } else {
          item.isTitle = 0;
        }
        return item;
      });
      setAllAttrData(allData);
    } else {
      const allData = tableData.map((item, index) => {
        if (`${item.attrId}+${item.attributeName}` == values.primaryKey) {
          item.isPrimaryKey = 1;
        } else {
          item.isPrimaryKey = 0;
        }
        if (`${item.attrId}+${item.attributeName}` == values.title) {
          item.isTitle = 1;
        } else {
          item.isTitle = 0;
        }
        return item;
      });
      setTableData(allData);
    }
  };
  const filterAttrData = allAttrData.filter(item =>
    item.COLUMN_NAME.toLowerCase().includes(keySearchValue.trim().toLowerCase()),
  );
  return (
    <div className="attrConfig-container" style={{ display: props.isShow ? 'flex' : 'none' }}>
      <div className="attr-setting-container">
        {attrType == 2 && props.interfaceId ? (
          <Alert
            className="action-alert"
            icon={<IconInformationColor />}
            content="您可以在接口属性的基础上扩展自定义属性，后续如需修改映射方式或映射的属性，可在对象中的【接口】模块处理"
          />
        ) : (
          ''
        )}
        <div className="attr-setting-head">
          <div>
            <div className="dot"></div>属性设置
          </div>
          {/*{attrType == 1?<Button type="outline" size='small' className='ai-attr-btn' onClick={getAIAttr}>智能生成属性</Button>:''}*/}
        </div>
        {/*<input
                 type="file"
                 ref={fileInputRef}
                 style={{ display: 'none' }}
                 accept=".xlsx,.xls"
                 onChange={handleFileChange}
               />*/}
        {attrType == 1 ? (
          <div ref={dropdownRef} className="attr-add-pop">
            <Space size="mini">
              {props.viewType == 'common' && <Button
                className="attr-add-btn"
                onClick={() => {
                  setPopVisible(!popVisible);
                  setKeySearchValue('');
                }}
              >
                <IconAdd />
                添加属性
              </Button>}
              <Button size="small" className="ai-attr-btn attr-add-btn" onClick={getAIAttr}>
                <IconAiColor />
                智能生成属性
              </Button>
            </Space>
            {popVisible ? (
              <div className="object-attr-pop demo-trigger-popup" key={popVisible}>
                <div className="attr-list-container">
                  {/*  <InputSearch allowClear
                               placeholder={loginT('请输入')}
                               value={keySearchValue}
                               className='search-input' onChange={(v)=>{keySearch(v)}}/>*/}

                  <Input
                    key={popVisible}
                    prefix={<IconSearchColor />}
                    allowClear
                    placeholder={loginT('请输入')}
                    value={keySearchValue}
                    className="search-input"
                    onChange={v => {
                      keySearch(v);
                    }}
                  />
                  <div className="attr-list-content">
                    <div className="oper">
                      <Button
                        type="text"
                        onClick={() => {
                          setCheckedFields(
                            filterAttrData.filter(item => !item.disabled)?.map(i => i.COLUMN_NAME),
                          );
                        }}
                      >
                        全选
                      </Button>
                      <Button type="text" status="danger" onClick={() => setCheckedFields([])}>
                        清空
                      </Button>
                    </div>
                    <Checkbox.Group value={checkedFields} onChange={val => setCheckedFields(val)}>
                      {filterAttrData.map(item => {
                        return (
                          <Checkbox
                            key={item.COLUMN_NAME}
                            value={item.COLUMN_NAME}
                            disabled={item.disabled}
                          >
                            {({ checked }) => {
                              return (
                                <Space size="mini" align="start" className="custom-checkbox-card">
                                  <Checkbox checked={checked}>
                                    <Space size="mini" className="custom-checkbox-card-title">
                                      {renderIcon(item.DATA_TYPE)}
                                      {item.COLUMN_NAME}
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
                                  </Checkbox>
                                </Space>
                              );
                            }}
                          </Checkbox>
                        );
                      })}
                    </Checkbox.Group>
                  </div>
                </div>
              </div>
            ) : (
              ''
            )}
          </div>
        ) : (
          ''
        )}
        {attrType == 2 ? (
          <Space size="mini">
            <Button className="attr-add-btn" onClick={addAttr}>
              <IconAdd />
              添加属性
            </Button>
            <Button className="attr-add-btn" onClick={() => setImportVisible(true)}>
              <IconUploadColor />
              批量导入
            </Button>
            <Button
              className="attr-add-btn"
              onClick={() => {
                setApiModalVisible(true);
                setLoading(false);
              }}
            >
              <IconApiMgr />
              API导入
            </Button>
          </Space>
        ) : (
          ''
        )}
        <div className="attr-table">
          <Table
            loading={tableLoading}
            columns={attrType == 1 ? props.viewType == 'sql' ? columnsSql : columns1 : columns2}
            data={tableData}
            scroll={{
              x: false,
              y: 442,
            }}
            pagination={false}
          />
        </div>
      </div>
      <Form
        ref={formRef}
        autoComplete="off"
        layout="vertical"
        className="attr-form"
        onValuesChange={onValuesChange}
      >
        <FormItem
          label={
            <span>
              主键
              <Tooltip content="属性的唯一标识">
                {' '}
                <IconHelpColor style={{ marginLeft: 3 }} />
              </Tooltip>
            </span>
          }
          field="primaryKey"
          rules={[{ required: false, message: '请选择主键' }]}
        >
          <Select placeholder={loginT('请选择主键')} showSearch allowClear>
            {tableData
              .filter(item => item.attributeName && item.attributeName.length > 0)
              .map((option, index) => (
                <Option
                  key={index}
                  value={`${option.COLUMN_NAME || option.attrId}+${option.attributeName}`}
                >
                  {option.attributeName}
                </Option>
              ))}
          </Select>
        </FormItem>
        <FormItem
          label={
            <span>
              标题
              <Tooltip content="对象显示的名称">
                {' '}
                <IconHelpColor style={{ marginLeft: 3 }} />
              </Tooltip>
            </span>
          }
          field="title"
          rules={[{ required: true, message: '请选择标题' }]}
        >
          <Select placeholder={loginT('请选择')} showSearch allowClear>
            {tableData
              .filter(item => item.attributeName && item.attributeName.length > 0)
              .map((option, index) => (
                <Option
                  key={index}
                  value={`${option.COLUMN_NAME || option.attrId}+${option.attributeName}`}
                >
                  {option.attributeName}
                </Option>
              ))}
          </Select>
        </FormItem>
      </Form>
      <Modal
        title={<div style={{ textAlign: 'left', fontWeight: 600 }}>批量导入</div>}
        visible={importVisible}
        footer={
          <Space>
            <Button
              onClick={() => {
                setImportVisible(false);
                setFileList([]);
              }}
            >
              取消
            </Button>
            <Button type="primary" onClick={() => handleImportFile()}>
              导入
            </Button>
          </Space>
        }
        onCancel={() => {
          setImportVisible(false);
          setFileList([]);
        }}
        autoFocus={false}
        focusLock
        className="import-modal"
      >
        <Form autoComplete="off" layout="vertical">
          <Form.Item label="下载模版" field="down">
            <Button
              type="outline"
              onClick={handleDownTpl}
              loading={downLoading}
              style={{ color: 'var(--color-primary-6)' }}
            >
              <IconDownloadColor />
              下载模板
            </Button>
          </Form.Item>
          <Form.Item label="上传文件" field="upload">
            <Upload
              autoUpload={false}
              accept=".xlsx,.xls"
              renderUploadList={renderUploadList}
              onChange={onFileUploadChange}
              fileList={fileList}
            >
              <div className="upload-trigger">
                <IconAdd className="icon" />
                <div className="text">
                  将文件拖到此处，或
                  <span style={{ color: 'var(--color-primary-6)', padding: '0 4px' }}>
                    点击上传
                  </span>
                </div>
                <div className="tips">支持xlsx，xls格式文件</div>
              </div>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={<div style={{ textAlign: 'left', fontWeight: 600 }}>API导入</div>}
        visible={apiModalVisible}
        style={{ width: 500 }}
        key={apiModalVisible}
        footer={
          <Space>
            <Button
              onClick={() => {
                setApiModalVisible(false);
              }}
            >
              取消
            </Button>
            <Button type="primary" loading={loading} onClick={() => handleImportAPI()}>
              导入
            </Button>
          </Space>
        }
        onCancel={() => {
          setApiModalVisible(false);
        }}
        autoFocus={false}
        focusLock
        className="api-import-modal"
      >
        <Form ref={apiFormRef} autoComplete="off">
          <Form.Item
            label="API"
            field="api"
            labelAlign="left"
            labelCol={{ flex: '64px' }}
            rules={[{ required: true, message: '请选择' }]}
          >
            <Select
              placeholder="请选择api"
              showSearch
              filterOption={(inputValue, option) =>
                option.props.extra.apiName.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0
              }
            >
              {apiOptions.map((option, index) => (
                <Option key={option.id} value={option.id} extra={option}>
                  {option.apiName}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
});

export default attrConfig;
