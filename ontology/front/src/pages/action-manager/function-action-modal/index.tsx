import { getAllObject, saveAction } from '@/pages/action-modal/api/index';
import {
  Button,
  Divider,
  Form,
  Input,
  Message,
  Modal,
  Select,
  Space,
} from '@arco-design/web-react';
import type { FormInstance } from '@arco-design/web-react/es/Form';
import { IconAdd, IconDataResDirColor, IconSearchColor, IconWarningColor } from 'modo-design/icon';
import React, { useEffect, useRef, useState } from 'react';
import { actionExists, getFileList } from '../api/index';
import './style/index.less';

const FormItem = Form.Item;
const { Option } = Select;

interface LogicTypeEditModalProps {
  visible: boolean;
  ontologyId?: string;
  ontologyName?: string;
  onClose: () => void;
  afterCreated: (row: any) => void;
}
const LogicTypeEditModal: React.FC<LogicTypeEditModalProps> = ({
  visible,
  ontologyId,
  ontologyName,
  onClose,
  afterCreated,
}) => {
  const formRef = useRef<FormInstance>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [addFileVisible, setAddFileVisible] = useState(false);
  const [searchKey, setSearchKey] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileList, setFileList] = useState<any[]>([]);

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
          await actionExists({
            ontologyId,
            actionLabel: value,
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
        validator:  async (value: any, cb: (err?: string) => void) => {
          if (!value) {
            cb();
            return;
          }
          await actionExists({
            ontologyId,
            actionName: value,
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
    objectTypeId: [
      {
        required: true,
        message: '请选择对象',
      }
    ],
  };

  const handleCreate = () => {
    setCreateLoading(true);
    formRef.current
      ?.validate()
      .then(() => {
        const values = formRef.current?.getFieldsValue();
        const params = { ...values, buildType: 'function', actionType: 'create' };
        if (ontologyId) {
          params.ontologyId = ontologyId;
        }
        return saveAction(params);
      })
      .then(res => {
        if (res?.data?.data) {
          Message.success('保存成功');
          afterCreated({ id: res.data.data.id, ...formRef.current?.getFieldsValue(), buildType: 'function' });
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

  const [objList, setObjList] = useState([]);
  const getAllObjects = () => {
    getAllObject({ ontologyId }).then(res => {
      if (res.data.success) {
        const { data } = res.data;
        setObjList(data);
      }
    });
  };
  useEffect(() => {
    if(visible){
      handleGetFileList();
      getAllObjects();
    }
  }, [visible]);

  useEffect(() => {
    handleGetFileList();
    getAllObjects();
  }, []);

  return (
    <div>
      <Modal
        title="基于函数创建动作类型"
        key={visible}
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
        <Form layout="vertical" ref={formRef}>
          <FormItem label="执行对象" field="objectTypeId" rules={rules.objectTypeId}>
            <Select placeholder="请选一个对象类型">
              {objList.map(item => (
                <Option value={item.id} key={item.id}>
                  <Space size="mini">
                    <IconDataResDirColor />
                    {item.objectTypeLabel}
                  </Space>
                </Option>
              ))}
            </Select>
          </FormItem>
          <FormItem label="中文名称" field="actionLabel" rules={rules.logicTypeLabel}>
            <Input placeholder="请输入中文名称" maxLength={100} showWordLimit/>
          </FormItem>
          <FormItem label="英文名称" field="actionName" rules={rules.logicTypeName}>
            <Input placeholder="请输入英文名称" maxLength={100} showWordLimit/>
          </FormItem>
          <FormItem label="描述" field="actionDesc">
            <Input.TextArea
              placeholder="请输入描述"
              maxLength={200}
              showWordLimit
              style={{ height: '62px' }}
            />
          </FormItem>
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
        </Form>
      </Modal>
    </div>
  );
};

export default LogicTypeEditModal;
