import {
  Button,
  Form,
  Input,
  Message,
  Modal,
  Select,
  Space,
  Table,
  TableColumnProps,
  Upload,
} from '@arco-design/web-react';
import {
  IconAdd,
  IconCalendarColor,
  IconCounterColor,
  IconDataIntegrationColor,
  IconDeleteColor,
  IconDocumentColor,
  IconDonutChartFill,
  IconDownloadColor,
  IconTextareaColor,
  IconTick,
  IconUnitMgrColor,
  IconUploadColor,
  IconDatabaseColor,
} from 'modo-design/icon';
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { downloadTemple, importFile } from '../api/index';
import './style/attr-config.less';
import SourceSelectModal from './source-select-modal';

require('static/guid');
import { set } from 'lodash';
import getAppName from "modo-plugin-common/src/core/src/utils/getAppName";
const FormItem = Form.Item;
const { Option } = Select;

const typeOptions = [
  { value: 'string', label: '字符型' },
  { value: 'int', label: '整数型' },
  { value: 'decimal', label: '浮点数型' },
  { value: 'date', label: '日期型' },
  { value: 'bool', label: '布尔型' },
];

function parseDbType(dbType) {
  if (dbType == null) {
    return "string"; // 默认类型
  }
  // 转成小写并去除空白
  const type = dbType.trim().toLowerCase();

  // String 类型
  if (type.includes("char") || type.includes("text") || type === "uuid" || type === "xml") {
    return "string";
  }

  // Int 类型
  if (
    type.includes("int") ||
    type === "smallint" ||
    type === "integer" ||
    type === "tinyint" ||
    type === "mediumint" ||
    type === "bigint"
  ) {
    return "int";
  }

  // Decimal/Float/Double 类型
  if (
    type.includes("dec") ||
    type.includes("numeric") ||
    type.includes("number") ||
    type.includes("float") ||
    type.includes("real") ||
    type.includes("double")
  ) {
    return "decimal";
  }

  // Date/Time 类型
  if (
    type.includes("date") ||
    type.includes("time") ||
    type === "datetime" ||
    type === "timestamp" ||
    type === "year"
  ) {
    return "date";
  }

  // Boolean 类型
  if (type.includes("bool") || type === "boolean") {
    return "bool";
  }

  // 默认
  return "string";
}
const formatRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]*$/;
const chineseOrLetterRegex = /[\u4e00-\u9fa5a-zA-Z]/;
const AttrConfig = forwardRef<{ getAttrData: () => any[]; validate: () => Promise<boolean> }, {}>(
  (props, ref) => {
    const [tableData, setTableData] = useState<any[]>([]);
    const [importVisible, setImportVisible] = useState(false);
    const [sourceModalVisible, setSourceModalVisible] = useState(false);
    const [fileList, setFileList] = useState<any[]>([]);
    const [downLoading, setDownLoading] = useState(false);
    useImperativeHandle(ref, () => ({
      getAttrData: () => {
        return tableData.map(item => ({
          type: item.type,
          name: item.name,
          label: item.label,
          description: item.description,
          id: item.id,
          //   isRequired: 1,
        }));
      },
      validate: async () => {
        // 检查是否有数据
        if (tableData.length === 0) {
          Message.error('请至少添加一个属性');
          return false;
        }
        const formatRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]*$/;
        const chineseOrLetterRegex = /[\u4e00-\u9fa5a-zA-Z]/;
        // 检查必填字段
        for (const item of tableData) {
          if (!item.type) {
            Message.error('属性类型不能为空');
            return false;
          }
          if (!item.label || item.label.trim() === '') {
            Message.error('属性中文名不能为空');
            return false;
          }
          if (!item.name || item.name.trim() === '') {
            Message.error('属性英文名不能为空');
            return false;
          }

          if(!formatRegex.test(item.label) || !chineseOrLetterRegex.test(item.label)){
            Message.error('属性名称仅支持中文、字母、数字和下划线，且必须包含中文或字母');
            return false;
          }
          if(!/^(?=.*[a-zA-Z])[a-zA-Z0-9_]+$/.test(item.name)){
            Message.error('属性英文名称必须包含英文字母，且只能输入英文字母、数字和下划线');
            return false;
          }
        }

        // 检查属性名称是否重复
        const attributeLabels = tableData.map(item => item.label);
        const uniqueLabels = new Set(attributeLabels);
        if (attributeLabels.length !== uniqueLabels.size) {
          Message.error('属性中文名不能重复');
          return false;
        }
        // 检查属性英文名称是否重复
        const attributeNames = tableData.map(item => item.name);
        const uniqueNames = new Set(attributeNames);
        if (attributeNames.length !== uniqueNames.size) {
          Message.error('属性英文名不能重复');
          return false;
        }

        return true;
      },
    }));

    const renderIcon = (option: string) => {
      let labelIcon = null;
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
        default:
          labelIcon = null;
      }
      return labelIcon;
    };

    const addNewRow = () => {
      const newRow = {
        key: Date.now(),
        id: Date.now(),
        type: 'string',
        name: '',
        label: '',
        description: '',
      };
      setTableData([...tableData, newRow]);
    };

    const addSourceAttr = async (attrs:any[])=>{
      attrs.forEach((item) => {
        const id = guid();
        item.key = id;
        item.id = id;
        item.type = parseDbType(item.DATA_TYPE);
        item.name= item.COLUMN_NAME;
        item.label= item.COMMENTS;
        item.description= item.COMMENTS;
        item.error = !formatRegex.test(item.label) || !chineseOrLetterRegex.test(item.label);
        item.nameError =item.name && !/^(?=.*[a-zA-Z])[a-zA-Z0-9_]+$/.test(item.name)
      });
      await setTableData([...tableData, ...attrs]);
      // 滚动到最后一条数据可见
      setTimeout(() => {
        const tableBody = document.querySelector('.attr-config .arco-table-body');
        if (tableBody) {
          tableBody.scrollTop = tableBody.scrollHeight;
        }
      }, 0);
    };

    const deleteRow = (rowId: number) => {
      setTableData(tableData.filter(item => item.id !== rowId));
    };

    const handleFieldTypeChange = (rowId: number, value: string) => {
      setTableData(tableData.map(item => (item.id === rowId ? { ...item, type: value } : item)));
    };

    const handleAttributeLabelChange = (rowId: number, data: any) => {
      setTableData(tableData.map(item => (item.id === rowId ? {...item, ...data} : item)));
    };
    const handleAttributeNameChange = (rowId: number, data: any) => {
      setTableData(tableData.map(item => (item.id === rowId ? { ...item, ...data } : item)));
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

    const deleteFile = file => {
      const _fileList = [...fileList];
      const index = _fileList.findIndex(item => item.name === file.name);
      _fileList.splice(index, 1);
      setFileList(_fileList);
    };
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
    const onFileUploadChange = (fileList, file) => {
      setFileList([file]);
    };

    const handleDownTpl = () => {

      const host=`${window.location.host}`;
      const protocol=`${window.location.protocol}`;
      const _url=`${protocol}//${host}/${getAppName()}`;
      const url = _url +'/_api/ontology/interface/attribute/downTemplate';
      var a = document.createElement('a');
      a.href=url;
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
            id: Date.now() + index,
            type: parseDbType(item.type),
            name: item.name,
            label: item.label,
            description: item.description || '', // 确保有默认值
            error:!formatRegex.test(item.label) || !chineseOrLetterRegex.test(item.label),
            nameError:item.name && !/^(?=.*[a-zA-Z])[a-zA-Z0-9_]+$/.test(item.name)
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

    const handleAttributeDescChange = (rowId: number, value: string) => {
      setTableData(
        tableData.map(item => (item.id === rowId ? { ...item, description: value } : item)),
      );
    };

    const columns: TableColumnProps[] = [
      {
        title: '属性类型',
        dataIndex: 'type',
        width: 150,
        render: (_, record) => (
          <Select
            value={record.type}
            placeholder="请选择属性类型"
            style={{ width: '100%' }}
            onChange={value => handleFieldTypeChange(record.id, value)}
          >
            {typeOptions.map(item => (
              <Option key={item.value} value={item.value}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {renderIcon(item.value)}
                  {item.label}
                </div>
              </Option>
            ))}
          </Select>
        ),
      },
      {
        title: '属性中文名',
        dataIndex: 'label',
        render: (col, record) => (
          <Input
            value={record.label}
            placeholder="请输入属性中文名"
            maxLength={100}
            error={!col || col.length==0 || record.error}
            onChange={value => {
              handleAttributeLabelChange(
                record.id,
                {
                  error: !formatRegex.test(value) || !chineseOrLetterRegex.test(value),
                  label: value
                })
            }}
          />
        ),
      },
      {
        title: '属性英文名',
        dataIndex: 'name',
        render: (_, record) => (
          <Input
            value={record.name}
            placeholder="请输入属性英文名"
            maxLength={100}
            error={record.nameError}
            onChange={value => handleAttributeNameChange(
              record.id,
              {
                nameError: value && !/^(?=.*[a-zA-Z])[a-zA-Z0-9_]+$/.test(value),
                name: value
              })}
          />
        ),
      },
      {
        title: '属性描述',
        dataIndex: 'description',
        render: (_, record) => (
          <Input
            value={record.description}
            placeholder="请输入属性描述"
            maxLength={200}
            onChange={value => handleAttributeDescChange(record.id, value)}
          />
        ),
      },
      {
        title: '操作',
        dataIndex: 'actions',
        width: 100,
        render: (_, record) => (
          <Button type="text" onClick={() => deleteRow(record.id)}>
            删除
          </Button>
        ),
      },
    ];

    return (
      <div className="attr-config" style={{ display: props.isShow ? 'block' : 'none' }}>
        <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
          <Button type="dashed" onClick={addNewRow}>
            <IconAdd />
            添加属性
          </Button>
          <Button type="dashed" onClick={() => setImportVisible(true)}>
            <IconUploadColor />
            批量导入
          </Button>
          <Button type="dashed" onClick={() => setSourceModalVisible(true)}>
            <IconDatabaseColor />
            基于数据源生成
          </Button>
        </div>

        <Table columns={columns} data={tableData} pagination={false} scroll={{ y: 400 }} />
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
        <SourceSelectModal
          visible={sourceModalVisible}
          afterClose={()=>{setSourceModalVisible(false)}}
          dataChoosed={addSourceAttr}/>
      </div>
    );
  },
);

export default AttrConfig;
