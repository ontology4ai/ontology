import {
  Button,
  Divider,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Message,
} from '@arco-design/web-react';
import type { FormInstance } from '@arco-design/web-react/es/Form';
import { IconAdd, IconSearchColor, IconWarningColor, IconDataResDirColor } from 'modo-design/icon';
import React, { useEffect, useRef, useState } from 'react';
import { searchApi } from '@/pages/api-manager/api/index';
import { logicExist, getFileList, saveLogic } from '../api/index';
import { getData } from '@/pages/ontology-manager/api/index';
import './style/index.less';
import { getAllObject } from '@/pages/object/api';
import ObjectIcon from '@/components/ObjectIcon';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;

interface LogicTypeEditModalProps {
  visible: boolean;
  selectOntology?: boolean;
  ontologyId?: string;
  ontologyName?: string;
  onClose: () => void;
  afterCreated: (row: any) => void;
}
const LogicTypeEditModal: React.FC<LogicTypeEditModalProps> = ({
  visible,
  selectOntology,
  ontologyId,
  ontologyName,
  onClose,
  afterCreated,
}) => {
  const formRef = useRef<FormInstance>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [buildType, setBuildType] = useState('function');
  const [addFileVisible, setAddFileVisible] = useState(false);
  const [searchKey, setSearchKey] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileList, setFileList] = useState<any[]>([]);
  const [objList, setObjList] = useState<any[]>([]);
  const [ontologyList, setOntologyList] = useState<any[]>([]);
  const [selectedOntologyId, setSelectedOntologyId] = useState(ontologyId);
  const [apiList, setApiList] = useState<any[]>([]);

  const logicTypeOptions = [
    {
      label: 'Function',
      value: 'function',
    },
    {
      label: 'API',
      value: 'api',
    },
    {
      label: 'Link',
      value: 'link',
      disabled: true,
    },
  ];
  const rules = {
    logicTypeLabel: [
      {
        required: true,
        message: '请输入中文名称',
      },
      {
        validator: (value: any, cb: (err?: string) => void) => {
          if (!value) {
            cb();
            return;
          }
          const formatRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/;
          // 必须包含中文或字母的校验
          const chineseOrLetterRegex = /[\u4e00-\u9fa5a-zA-Z]/;

          if (!formatRegex.test(value)) {
            cb('仅支持中文、字母、数字和下划线');
            return;
          } else if (!chineseOrLetterRegex.test(value)) {
            cb('必须包含中文或字母');
            return;
          }
          cb();
        },
        trigger: ['onBlur', 'onSubmit'],
      },
      {
        trigger: ['onBlur', 'onSubmit'],
        validator: async (value: any, cb: (err?: string) => void) => {
          if (!value) {
            cb();
            return;
          }
          await logicExist({
            ontologyId,
            logicTypeLabel: value,
          })
            .then(res => {
              if (res.data.data.exists) {
                cb('中文名称已存在');
              } else {
                cb();
              }
            })
            .catch(err => {
              cb(err);
            });
        },
      },
    ],
    logicTypeName: [
      {
        required: true,
        message: '请输入英文名称',
      },
      {
        validator: (value: any, cb: (err?: string) => void) => {
          if (!value) {
            cb();
            return;
          }
          /*// 仅支持英文校验
          if (!/^[A-Za-z0-9_]+$/.test(value)) {
            cb('仅支持英文、下划线、数字');
            return;
          }*/
          if (!/^(?=.*[a-zA-Z])[a-zA-Z0-9_]+$/.test(value)) {
            cb('名称必须包含英文字母，且只能输入英文字母、数字和下划线');
            return;
          }
          cb();
        },
        trigger: ['onBlur', 'onSubmit'],
      },
      {
        trigger: ['onBlur', 'onSubmit'],
        validator: async (value: any, cb: (err?: string) => void) => {
          if (!value) {
            cb();
            return;
          }
          await logicExist({
            ontologyId,
            logicTypeName: value,
          })
            .then(res => {
              if (res.data.data.exists) {
                cb('英文名称已存在');
              } else {
                cb();
              }
            })
            .catch(err => {
              cb(err);
            });
        },
      },
    ],
    fileName: [
      {
        required: true,
        message: '请选择逻辑存放的代码文件',
      },
    ],
    ontologyId: [
      {
        required: true,
        message: '请选择本体',
      },
    ],
  };

  const handleCreate = () => {
    setCreateLoading(true);
    formRef.current
      ?.validate()
      .then(() => {
        const values = formRef.current?.getFieldsValue();
        const params = { ...values };
        if (ontologyId) {
          params.ontologyId = ontologyId;
        }
        return saveLogic(params);
      })
      .then(res => {
        if (res?.data?.data) {
          Message.success('保存成功');
          afterCreated({ id: res.data.data.id, ...formRef.current?.getFieldsValue() });
        }
      })
      .catch(() => {})
      .finally(() => {
        setCreateLoading(false);
      });
  };
  const handleAddFile = () => {
    setAddFileVisible(true);
  };
  const handleAddBlur = () => {
    if (fileName) {
      handleAddFileConfirm();
    } else {
      setAddFileVisible(false);
    }
  };
  const handleGetFileList = () => {
    getFileList({
      ontologyName,
    }).then(res => {
      if (res.data.data) {
        setFileList(res.data.data);
      }
    });
  };

  const getAllObjects = () => {
    getAllObject({ ontologyId: ontologyId }).then(res => {
      if (res.data.success) {
        const data = res.data.data;
        setObjList(data);
      }
    });
  };
  const handleGetOntology = () => {
    getData({
      page: 0,
      limit: 9999,
    })
      .then(res => {
        if (Array.isArray(res?.data?.data?.content)) {
          setOntologyList(res?.data?.data?.content);
        }
      })
      .finally(() => {});
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddFileConfirm();
    }
  };
  const handleAddFileConfirm = () => {
    if (fileName) {
      // 将新文件添加到文件列表中
      const newFile = fileName;

      // 检查文件是否已存在
      const fileExists = fileList.some(item => item.value === fileName);

      if (!fileExists) {
        setFileList(prev => [...prev, newFile]);

        // 如果这是第一个文件，自动选中它
        if (fileList.length === 0) {
          formRef.current?.setFieldValue('fileName', fileName);
        }
      }

      setFileName('');
      setAddFileVisible(false);
    } else {
      setAddFileVisible(false);
    }
  };
  const getFilteredFileList = () => {
    if (!searchKey) {
      return fileList;
    }
    return fileList.filter(item => item.includes(searchKey));
  };
  useEffect(() => {
    handleGetFileList();
    getAllObjects();
  }, []);
  useEffect(() => {
    if (buildType === 'api') {
      searchApi().then(res => {
        const apiData = res.data.data || [];
        setApiList(apiData.map(item => ({ value: item.id, label: item.apiName })));
      });
    }
  }, [buildType]);
  useEffect(() => {
    if (selectOntology) {
      handleGetOntology();
    }
  }, [selectOntology]);
  useEffect(() => {
    if (selectedOntologyId) {
      // 根据选中的ontologyId找到对应的ontologyName
      const selectedOntology = ontologyList.find(item => item.id === selectedOntologyId);
      if (selectedOntology) {
        getFileList({
          ontologyName: selectedOntology.ontologyName,
        }).then(res => {
          if (res.data.data) {
            setFileList(res.data.data);
          }
        });
      }
    }
  }, [selectedOntologyId, ontologyList]);
  return (
    <div>
      <Modal
        title="创建逻辑类型"
        visible={visible}
        onOk={() => {
          handleCreate();
        }}
        onCancel={() => {
          onClose();
        }}
        okText="创建"
        confirmLoading={createLoading}
        className="logic-type-edit-modal"
      >
        <Form
          layout="vertical"
          ref={formRef}
          onValuesChange={changedValues => {
            if (changedValues.buildType) {
              setBuildType(changedValues.buildType);
            }
          }}
        >
          <FormItem label="选择逻辑类型" field="buildType" initialValue="function">
            <RadioGroup options={logicTypeOptions} className="radio-group" />
          </FormItem>
          <FormItem label="中文名称" field="logicTypeLabel" rules={rules.logicTypeLabel}>
            <Input placeholder="请输入中文名称" maxLength={100} showWordLimit/>
          </FormItem>
          <FormItem label="英文名称" field="logicTypeName" rules={rules.logicTypeName}>
            <Input placeholder="请输入英文名称" maxLength={100} showWordLimit/>
          </FormItem>
          <FormItem label="描述" field="logicTypeDesc">
            <Input.TextArea
              placeholder="请输入描述"
              maxLength={200}
              showWordLimit
              style={{ height: '62px' }}
            />
          </FormItem>
          {selectOntology ? (
            <FormItem label="归属本体" field="ontologyId" rules={rules.ontologyId}>
              <Select
                placeholder="请选择构建函数所引用的本体"
                onChange={value => setSelectedOntologyId(value)}
              >
                {ontologyList.map(item => (
                  <Select.Option key={item.id} value={item.id}>
                    <span>{item.ontologyLabel}</span>
                  </Select.Option>
                ))}
              </Select>
            </FormItem>
          ) : null}
          <FormItem label="对象" field="objectTypeIds">
            <Select
              mode="multiple"
              allowClear
              showSearch
              placeholder="请选择对象"
              filterOption={(inputValue, option) =>
                option.props.extra.objectTypeLabel
                  .toLowerCase()
                  .indexOf(inputValue.toLowerCase()) >= 0 ||
                option.props.extra.objectTypeName.toLowerCase().indexOf(inputValue.toLowerCase()) >=
                  0
              }
            >
              {objList.map(item => (
                <Select.Option key={item.id} value={item.id} extra={item}>
                  <ObjectIcon icon={item.icon} />
                  <span style={{ marginLeft: '3px' }}>{item.objectTypeLabel}</span>
                </Select.Option>
              ))}
            </Select>
          </FormItem>
          {buildType === 'api' && (
            <FormItem label="API" field="apiId">
              <Select options={apiList} placeholder="请选择API" />
            </FormItem>
          )}
          {buildType !== 'api' && (
            <FormItem label="存储位置" field="fileName" rules={rules.ontologyId}>
              <Select
                className="select-file"
                dropdownRender={menu => {
                  const options =
                    React.isValidElement(menu) && Array.isArray(menu.props.data)
                      ? menu.props.data
                      : [];
                  return (
                    <div>
                      <Input
                        placeholder="请输入"
                        value={searchKey}
                        onChange={v => setSearchKey(v)}
                        prefix={<IconSearchColor />}
                      />
                      {options.length > 0 ? (
                        menu
                      ) : (
                        <div className="no-file">
                          <IconWarningColor />
                          暂无可用文件，您可以点击新建文件
                        </div>
                      )}
                      <Divider style={{ margin: 0 }} />
                      {addFileVisible ? (
                        <Input
                          placeholder="请输入"
                          value={fileName}
                          prefix={<IconDataResDirColor />}
                          onChange={v => setFileName(v)}
                          onBlur={() => handleAddBlur()}
                          onKeyDown={e => handleKeyDown(e)}
                          className="add-file-input"
                        ></Input>
                      ) : null}
                      <Button
                        type="text"
                        className="add-file"
                        onClick={() => handleAddFile()}
                        icon={<IconAdd />}
                      >
                        新建文件
                      </Button>
                    </div>
                  );
                }}
                placeholder="请选择逻辑存放的代码文件"
              >
                {getFilteredFileList().map(item => (
                  <Select.Option key={item} value={item}>
                    <IconDataResDirColor />
                    <span style={{ marginLeft: 8 }}>{item}</span>
                  </Select.Option>
                ))}
              </Select>
            </FormItem>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default LogicTypeEditModal;
