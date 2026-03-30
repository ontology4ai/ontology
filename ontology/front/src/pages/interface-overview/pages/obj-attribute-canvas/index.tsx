import { Alert, Form, Input, Message, Select, Space, Spin } from '@arco-design/web-react';
import {
  IconCalendarColor,
  IconCounterColor,
  IconDataIntegrationColor,
  IconEmptyColor,
  IconInformationColor,
  IconTextareaColor, IconUnitMgrColor
} from 'modo-design/icon';
import React from 'react';
import { getData, updateAttr } from './api';
import Graph from './graph';
import './style/index.less';

require('static/guid');

const typeOptions = [
  {value:'string',label:'字符型'},
  {value:'int',label:'整数型'},
  {value:'decimal',label:'浮点数型'},
  {value:'date',label:'日期型'},
  {value:'bool',label:'布尔型'},
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
class ObjAttributeCanvas extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = {
      loading: true,
      data: {
        attributes: [],
        actions: [],
      },
      oper: null,
      activeField: null,
      hasUnsavedChanges: false,
    };
    this.formRef = React.createRef();
    this.graphRef = React.createRef();
  }

  getData = () => {
    this.setState({
      loading: true,
    });
    getData(this.props.obj.id)
      .then(async res => {
        if (res.data.data) {
          const { data } = res.data;
          this.setState({
            data,
          });
          const target = {
            tableName: '接口属性',
            nodeType: 'target',
            fields: data.attributeList,
          };

          this.graphRef.current.initData(target);
        }
      })
      .catch(err => {
        console.log(err);
      })
      .finally(() => {
        this.setState({
          loading: false,
        });
        if (this.props.onUpdateUseSaveBtn) {
          this.props.onUpdateUseSaveBtn(`${this.props.obj.id}-attribute-edit`, true);
        }
      });
  };

  // 表单值变化时的处理函数
  handleFormValuesChange = (changedValues, allValues) => {
    // 设置有未保存的更改标志
    this.setState({ hasUnsavedChanges: true });

    // 通知父组件启用保存按钮
    if (this.props.onUpdateUseSaveBtn) {
      this.props.onUpdateUseSaveBtn(`${this.props.obj.id}-attribute-edit`, true);
    }

    try {
      const formatRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/;
      // 必须包含中文或字母的校验
      const chineseOrLetterRegex = /[\u4e00-\u9fa5a-zA-Z]/;
      const name = allValues.name;
      const label = allValues.label;
      //不满足校验
      const disValided = !formatRegex.test(label)||!chineseOrLetterRegex.test(label)||(name && !/^(?=.*[a-zA-Z])[a-zA-Z0-9_]+$/.test(name));

      // 实时更新图形中的字段数据
      if (this.state.oper === 'edit' && this.state.activeField) {
        // 如果中文名被清空，则删除该字段
        if (!allValues.name || allValues.name.trim() === '' || !allValues.label || allValues.label.trim() === ''|| disValided) {
          // 从图形中删除字段
          this.graphRef.current.deleteAttribute();
          // 清空当前活动字段
          this.setState({
            activeField: null,
          });
          return;
        }
        const updatedField = {
          ...this.state.activeField,
          ...allValues,
        };

        this.setState({
          activeField: updatedField,
        });

        // 实时更新图形中的字段显示
        this.graphRef.current.updateField(updatedField);
      }
      // 处理新增字段的实时创建
      else if (this.state.oper === 'create') {
        // 如果必填的为空，则不创建或删除已创建的字段
        if (!allValues.label || allValues.label.trim() === '' || !allValues.name || allValues.name.trim() === ''|| disValided) {
          // 如果之前已创建字段，则删除它
          if (this.state.activeField && this.state.activeField.id) {
            // graph.tsx 的 deleteAttribute 按当前 active 删除，这里无需传参
            this.graphRef.current.deleteAttribute();
            this.setState({
              activeField: null,
            });
          }
          // 本次值不合法：已删除（或无需删除），直接结束，避免继续走 updateField 导致状态不一致
          return;
        }
        // 如果有中文名和英文名且还没有创建字段，则创建字段
        if (allValues.name && allValues.label && (!this.state.activeField || !this.state.activeField.id)) {
          const newField = {
            ...allValues,
            id: guid(),
            // 与 graph.createField 中的默认值保持一致，后续 updateField 能稳定命中
            operStatus: 0,
          };

          // 在图形中创建字段
          this.graphRef.current.createField(newField);

          // 更新状态
          this.setState({
            activeField: newField,
          });
        }
        // 如果字段已创建，则更新字段
        else if (this.state.activeField && this.state.activeField.id) {
          const updatedField = {
            ...this.state.activeField,
            ...allValues,
            name: allValues.name || '',
            label: allValues.label || '',
          };

          this.setState({
            activeField: updatedField,
          });

          // 实时更新图形中的字段显示
          this.graphRef.current.updateField(updatedField);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };
  /*
  handleSaveForm = async () => {
    let valid = true;
    try {
      this.formRef.current.validate();
    } catch (e) {
      valid = false;
    }
    if (!valid) {
      return;
    }

    // 获取表单数据
    const formData = this.formRef.current.getFieldsValue();

    // 校验中文名是否为空
    if (!formData.attributeName || formData.attributeName.trim() === '') {
      Message.warning('中文名不能为空');
      return;
    }

    if (this.state.oper === 'create') {
      // 字段已经在 handleFormValuesChange 中创建了，这里只需要切换到编辑模式
      if (this.state.activeField) {
        this.setState({
          oper: 'edit',
        });
      }
    } else {
      // 编辑模式下的保存逻辑保持不变
      const data = {
        ...this.state.activeField,
        ...formData,
        name: formData.attributeName || '',
        isPrimaryKey: formData.isPrimaryKey ? 1 : 0,
        isTitle: formData.isTitle ? 1 : 0,
        status: formData.status ? 1 : 0,
      };
      this.graphRef.current.updateField(data);
      this.setState({
        activeField: data,
      });
    }
  };*/

  renderOption = (option) => {
    let labelIcon = '';
    switch (option.value) {
      case 'string':
        labelIcon = <IconTextareaColor/>;
        break;
      case 'int':
        labelIcon = <IconCounterColor/>;
        break;
      case 'decimal':
        labelIcon = <IconDataIntegrationColor/>;
        break;
      case 'bool':
        labelIcon = <IconUnitMgrColor/>;
        break;
      case 'date':
        labelIcon = <IconCalendarColor/>;
        break
    }
    return (<Space>{labelIcon}{option.children}</Space>)
  };
  handleSave = async (callback, onerror) => {
    const attributes = this.graphRef.current.getData();
    // 过滤掉没有中文名的属性
    const validAttributes = attributes.filter(
      attr => (attr.label && attr.label.trim() !== ''),
    );
    const names = validAttributes.filter(i => i.operStatus !== 3).map(attr => attr.label);
    const uniqueNames = new Set(names);
    if (names.length !== uniqueNames.size) {
      Message.error('属性中文名不能重复');
      onerror && onerror();
      return;
    }
    // 过滤掉没有英文名的属性
    const validAttributes2 = attributes.filter(
      attr => (attr.name && attr.name.trim() !== ''),
    );
    const names2 = validAttributes2.filter(i => i.operStatus !== 3).map(attr => attr.name);
    const uniqueNames2 = new Set(names2);
    if (names2.length !== uniqueNames2.size) {
      Message.error('属性英文名不能重复');
      onerror && onerror();
      return;
    }
    const data = {
      ...this.state.data,
    };
    delete data.extendedList;
    delete data.relationList;
    //delete data.id;
    data.attributeList = validAttributes;

    updateAttr(this.state.data.id, data)
      .then(async (res) => {
        if(res.data.success){
          Message.success('保存成功');
          // 保存成功后清除未保存标志
          this.setState({ hasUnsavedChanges: false });
          typeof callback === 'function' &&
          (await callback({ type: 'updateTab', tabId: this.props.obj.id }));
        }else{
          Message.error('保存失败');
          onerror && onerror();
        }
      })
      .catch(() => {
        Message.error('保存失败');
        onerror && onerror();
      });
  };

  componentDidMount() {
    if (this.props.oper) {
      this.setState({
        oper: this.props.oper,
      });
    }
    this.getData();
  }

  render() {
    const { loading, data, oper } = this.state;
    return (
      <Spin loading={loading} className="obj-attribute-canvas-spin">
        <div className="obj-attribute-canvas">
          <div className="obj-attribute-canvas-header">
            <Alert className='action-alert' icon={<IconInformationColor/>} content='当前接口存在下游继承对象，如变更接口属性（包括增、删、改），可能会影响下游对象，请谨慎操作。'/>
          </div>
          <div className="obj-attribute-canvas-content">
            <Graph
              ref={this.graphRef}
              createAttribute={() => {
                this.setState(
                  () => {
                    return {
                      oper: 'create',
                      activeField: null, // 清空当前选中的字段
                    };
                  },
                  () => {
                    this.formRef.current.clearFields();
                    this.formRef.current.setFieldValue('type','string');
                  },
                );
              }}
              editAttribute={attr => {
                this.setState(
                  () => {
                    return {
                      oper: 'edit',
                      activeField: attr,
                    };
                  },
                  () => {
                    this.formRef.current.setFieldsValue({
                      ...attr,
                     /* isPrimaryKey: !!attr.isPrimaryKey,
                      isTitle: !!attr.isTitle,
                      status: !!attr.status,*/
                    });
                  },
                );
              }}
              deleteAttribute={attr => {}}
            />
            <div className="attr-form-panel">
              {oper ? (
                <>
                  <Form
                    ref={this.formRef}
                    layout="vertical"
                    onValuesChange={this.handleFormValuesChange} // 添加表单值变化监听
                  >
                    <Form.Item
                      label="中文名称"
                      field="label"
                      rules={[{ required: true, message: '中文名称必填' },
                        {
                          validator: async (val, callback) => {
                            const formatRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/;
                            // 必须包含中文或字母的校验
                            const chineseOrLetterRegex = /[\u4e00-\u9fa5a-zA-Z]/;

                            if (!formatRegex.test(val)) {
                              callback('仅支持中文、字母、数字和下划线');
                              return;
                            } else if (!chineseOrLetterRegex.test(val)) {
                              callback('必须包含中文或字母');
                              return;
                            }
                            callback()
                          }
                        }]}
                    >
                      <Input placeholder="请输入中文名称" maxLength={100} showWordLimit/>
                    </Form.Item>
                    <Form.Item
                      label="英文名称"
                      field="name"
                      rules={[{ required: true, message: '英文名称必填' },{
                        validator:
                          async (val, callback) => {
                            if (val && !/^(?=.*[a-zA-Z])[a-zA-Z0-9_]+$/.test(val)) {
                              callback('必须包含英文字母，且仅支持英文字母、数字和下划线');
                              return;
                            }
                            callback();
                          }
                      }]}
                    >
                      <Input placeholder="请输入英文名称" maxLength={100} showWordLimit/>
                    </Form.Item>
                    <Form.Item label="属性类型" field="type">
                      <Select
                        placeholder='请选择'
                        options={typeOptions}
                        renderFormat={(option, value) => {
                          return option ? this.renderOption(option) : (
                            value
                          );
                        }}
                      >
                      </Select>

                    </Form.Item>
                    <Form.Item label="描述" field="description">
                      <Input.TextArea
                        maxLength={200}
                        showWordLimit
                        style={{ height: '80px' }}
                        placeholder="请输入属性描述"
                      />
                    </Form.Item>
                  </Form>
                </>
              ) : (
                <div className="obj-attribute-empty">
                  <div className="obj-attribute-empty-content">
                    <IconEmptyColor />
                    <div className="tip">未选择属性</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Spin>
    );
  }
}

export default ObjAttributeCanvas;
