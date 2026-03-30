import {
  Alert,
  Checkbox,
  Form,
  Input,
  Message,
  Select,
  Space,
  Spin,
  Switch,
} from '@arco-design/web-react';
import {
  IconCalendarColor,
  IconCounterColor,
  IconDataIntegrationColor,
  IconEmptyColor,
  IconTextareaColor,
  IconUnitMgrColor,
} from 'modo-design/icon';
import React from 'react';
import { getData, getTableInfo, updateAttr, updateData, getSqlAttrData} from './api';
import Graph from './graph';
import './style/index.less';

require('static/guid');

const typeOptions = [
  { value: 'string', label: '字符型' },
  { value: 'int', label: '整数型' },
  { value: 'decimal', label: '浮点数型' },
  { value: 'date', label: '日期型' },
  { value: 'bool', label: '布尔型' },
];

function sortArray2ByArray1(array1:any[], array2:any[],column1:string,column2:string):any[] {
  // 1. 创建name到顺序索引的映射
  const orderMap = new Map();
  array1.forEach((item, index) => {
    orderMap.set(item[column1], index);
  });

  // 2. 排序array2
  return [...array2].sort((a, b) => {
    const orderA = orderMap.get(a[column2]);
    const orderB = orderMap.get(b[column2]);

    // 如果a在array1中，b不在，a排前面
    if (orderA !== undefined && orderB === undefined) return -1;
    // 如果b在array1中，a不在，b排前面
    if (orderA === undefined && orderB !== undefined) return 1;
    // 如果都不在array1中，保持原顺序
    if (orderA === undefined && orderB === undefined) return 0;
    // 如果都在array1中，按array1的顺序排序
    return orderA - orderB;
  });
}

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
          data.dsType = data.dsType || 0;
          this.setState({
            data,
          });
          let source = { tableName: data.tableName, nodeType: 'source', fields: [] };
          if (data.dsId && data.dsSchema && data.tableName) {
            if (data.dsType == 1) {
              //获取
              await new Promise((resolve, reject) => {
                getSqlAttrData({
                  customSql: data.customSql,
                  dsId: data.dsId,
                  dsSchema: data.dsSchema,
                  check: false
                }).then(res => {
                  if (res.data.status) {
                    const tableData = res.data.attributeList.map(item => {
                      return {
                        name: item.attributeName,
                        type: parseDbType(item.attributeType),
                        comments: item.attributeLabel,
                      };
                    });
                    source.fields = sortArray2ByArray1(data.attributes, tableData, 'fieldName', 'name')
                  } else {
                    Message.error(res.data.message);
                  }
                }).finally(() => {
                  resolve();
                })
              })
            } else {
              await new Promise((resolve, reject) => {
                getTableInfo({
                  id: data.dsId,
                  schema: data.dsSchema,
                  tableName: data.tableName,
                })
                  .then(res => {
                    if (Array.isArray(res.data?.data?.columns?.datas)) {
                      const tableData = res.data.data.columns.datas.map(item => {
                        return {
                          name: item.COLUMN_NAME,
                          type: parseDbType(item.DATA_TYPE),
                          comments: item.COMMENTS,
                        };
                      });
                      source.fields = sortArray2ByArray1(data.attributes, tableData, 'fieldName', 'name')
                    }
                  })
                  .finally(() => {
                    resolve();
                  });
              });
            }
          } else {
            source = null;
            Message.warning('暂未绑定数据源');
          }
          const target = {
            tableName: '属性',
            nodeType: 'target',
            dsType: data.dsType,
            fields: data.attributes.map(row => {
              return {
                name: row.attributeName,
                type: row.fieldType,
                attributeLabel: row.attributeLabel || '',
                ...row,
              };
            }),
          };
          const edges = target.fields
            .filter(field => field.fieldName)
            .map(field => {
              return {
                id: guid(),
                source: 'table',
                target: 'attribute',
                sourceHandle: `${field.fieldName}__${field.type}__source`,
                targetHandle: `${field.id}__${field.type}__target`,
                label: '',
                style: { stroke: 'var(--color-primary-6)', strokeWidth: 1 },
                labelStyle: { fill: 'var(--color-primary-6)', fontWeight: 'bold' },
                markerEnd: { type: 'arrowclosed', color: 'var(--color-primary-6)' },
              };
            });

          this.graphRef.current.initData(source, target, edges);
        }
      })
      .catch(err => {
        console.log(err);
      })
      .finally(() => {
        this.setState({
          loading: false,
        });
      });
  };

  // 表单值变化时的处理函数
  handleFormValuesChange = async(changedValues, allValues) => {
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
      const attributeName = allValues.attributeName;
      const attributeLabel = allValues.attributeLabel;
      //不满足校验
      const disValided = !formatRegex.test(attributeName)||!chineseOrLetterRegex.test(attributeName)||(attributeLabel && !/^(?=.*[a-zA-Z])[a-zA-Z0-9_]+$/.test(attributeLabel));

      // 实时更新图形中的字段数据
      if (this.state.oper === 'edit') {
        console.log(this.state.activeField,allValues);
        // 如果中文名被清空，则删除该字段
        //如果不满足校验,且不是禁用的 则不创建或删除
        if (!allValues.attributeName || allValues.attributeName.trim() === ''|| disValided && allValues.interfaceType!=2) {
          // 从图形中删除字段
          this.state.activeField && this.state.activeField.id == allValues.id && this.graphRef.current.deleteAttribute(this.state.activeField);
          // 清空当前活动字段
          this.setState({
            activeField: null,
          });
          this.formRef.current.validate();
          return;
        }
        const updatedField = {
          ...this.state.activeField,
          ...allValues,
          name: allValues.attributeName || '',
          isPrimaryKey: allValues.isPrimaryKey ? 1 : 0,
          isTitle: allValues.isTitle ? 1 : 0,
          status: allValues.status ? 1 : 0,
        };

        if(this.state.activeField){
            this.setState({
                activeField: updatedField,
            });
            // 实时更新图形中的字段显示
            this.graphRef.current.updateField(updatedField);
        }else{
            this.graphRef.current.createField(updatedField);
            this.setState({
                activeField: updatedField,
            });
        }

      }
      // 处理新增字段的实时创建
      else if (this.state.oper === 'create') {
        // 如果中文名为空，则不创建或删除已创建的字段
        //如果不满足校验则不创建或删除
        if (!allValues.attributeName || allValues.attributeName.trim() === '' || disValided) {
          // 如果之前已创建字段，则删除它
          if (this.state.activeField && this.state.activeField.id) {
            this.graphRef.current.deleteAttribute(this.state.activeField);
            this.setState({
              activeField: null,
            });
          }
          return;
        }
        // 如果有中文名且还没有创建字段，则创建字段
        if (allValues.attributeName && (!this.state.activeField || !this.state.activeField.id)) {
          const newField = {
            ...allValues,
            id: guid(),
            attributeLabel: allValues.attributeLabel || '',
            name: allValues.attributeName || '',
            isPrimaryKey: allValues.isPrimaryKey ? 1 : 0,
            isTitle: allValues.isTitle ? 1 : 0,
            status: allValues.status ? 1 : 0,
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
            name: allValues.attributeName || '',
            isPrimaryKey: allValues.isPrimaryKey ? 1 : 0,
            isTitle: allValues.isTitle ? 1 : 0,
            status: allValues.status ? 1 : 0,
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
  };

  handleSave = async callback => {
    this.setState({
      loading: true
    })
    const attributes = this.graphRef.current.getData();
    attributes.forEach(attr => {
      delete attr.name;
      delete attr.type;
      delete attr.attributeName1;
    //  delete attr.attributeDesc;
    });
    // 过滤掉没有中文名的属性
    const validAttributes = attributes.filter(
      attr => attr.attributeName && attr.attributeName.trim() !== '',
    );

    // if (attributes.length !== validAttributes.length) {
    //   Message.warning('存在没有中文名的属性，已自动过滤');
    // }
    const data = {
      ...this.state.data,
    };
    delete data.actions;
    delete data.groups;
    delete data.id;
    data.attributes = validAttributes;

    updateAttr(this.state.data.id, data).then(async () => {
      updateData(this.state.data.id, data).then(async () => {
        Message.success('保存成功');
        // 保存成功后清除未保存标志
        this.setState({hasUnsavedChanges: false});
        typeof callback === 'function' &&
        (await callback({}));
      }).catch(() => {
        Message.error('保存失败');
      }).finally(() => {
        this.setState({
          loading: false
        })
      })
    }).catch(() => {
      Message.error('保存失败');
      this.setState({
        loading: false
      })
    })
  };

  renderOption = option => {
    let labelIcon = '';
    switch (option.value) {
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
    return (
      <Space>
        {labelIcon}
        {option.children}
      </Space>
    );
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
    const { loading, data, oper, activeField } = this.state;
    return (
      <Spin loading={loading} className="obj-attribute-canvas-spin">
        <div className="obj-attribute-canvas">
          <div className="obj-attribute-canvas-header">
            <Alert content="如属性同步使用接口属性，则禁止修改，如需修改您可以在接口中更改配置。" />
            {/*<div className="title">{data.objectTypeLabel || '--'}</div>
            <div className="oper-group">
              <Button
                className="reset"
                size="mini"
                type="text"
                onClick={() => {
                  this.handleSave();
                }}
              >
                <IconReset />
                重置
              </Button>
            </div>*/}
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
                          isPrimaryKey: !!attr.isPrimaryKey,
                          isTitle: !!attr.isTitle,
                          status: !!attr.status,
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
                    <Form.Item shouldUpdate noStyle>
                      {values => {
                        console.log(values);
                        return (
                          <>
                            <Form.Item
                              label="中文名"
                              field="attributeName"
                              rules={[{ required: true, message: '中文名必填' },
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
                              <Input
                                disabled={values.interfaceType === 2}
                                placeholder="请输入属性的中文名称" maxLength={100} showWordLimit
                              />
                            </Form.Item>
                            <Form.Item label="英文名" field="attributeLabel" rules={[
                              {
                                validator:
                                  async (val, callback) => {
                                    if (val && !/^(?=.*[a-zA-Z])[a-zA-Z0-9_]+$/.test(val)) {
                                      callback('必须包含英文字母，且仅支持英文字母、数字和下划线');
                                      return;
                                    }
                                    callback();
                                  }
                              }]}>
                              <Input
                                disabled={data.dsType === 1 || values.interfaceType === 2}
                                placeholder="请输入属性的英文名称" maxLength={100} showWordLimit
                              />
                            </Form.Item>
                            <Form.Item label="属性类型" field="fieldType">
                              <Select
                                disabled={data.dsId}
                                // disabled={values.interfaceType === 2}
                                options={typeOptions}
                                placeholder="请选择属性类型"
                                renderFormat={(option, value) => {
                                  return option ? this.renderOption(option) : value;
                                }}
                              />
                            </Form.Item>
                          </>
                        );
                      }}
                    </Form.Item>
                    <Form.Item label="描述" field="attributeDesc">
                      <Input.TextArea
                        maxLength={200}
                        showWordLimit
                        style={{ height: '52px' }}
                        placeholder="请输入属性描述"
                      />
                    </Form.Item>
                    <Form.Item shouldUpdate noStyle>
                      {values => {
                        return (
                          <Form.Item label="属性启用" field="status" triggerPropName="checked">
                            <Switch
                              disabled={data.dsType === 1}
                              checkedText="启用"
                              uncheckedText="禁用"
                            />
                          </Form.Item>
                        );
                      }}
                    </Form.Item>
                    <Form.Item label="属性配置">
                      <Form.Item field="isPrimaryKey" triggerPropName="checked" noStyle>
                        <Checkbox>主键</Checkbox>
                      </Form.Item>
                      <Form.Item field="isTitle" triggerPropName="checked" noStyle>
                        <Checkbox style={{ marginLeft: '12px' }}>标题</Checkbox>
                      </Form.Item>
                    </Form.Item>
                  </Form>
                  <div className="tip">
                    可以将当前属性配置为主键或标题，如已存在其他属性设置为主键或标题，点击确定时其他属性的主键、标题配置失效
                  </div>
                  <div>
                    <div className="label">是否继承</div>
                    <div className="value">
                      {activeField && activeField.interfaceAttrId ? '是' : '否'}
                    </div>
                  </div>
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
