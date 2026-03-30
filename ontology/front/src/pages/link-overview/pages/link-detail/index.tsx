import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Button,
  Divider,
  Empty,
  Form,
  Input,
  List,
  Modal,
  Message,
  Radio,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  Tooltip,
} from '@arco-design/web-react';
import { FormInstance } from '@arco-design/web-react/es/Form';
//import {} from 'modo-design';
import useLocale from 'modo-plugin-common/src/utils/useLocale';
import i18n from '@/pages/relationModal/locale';
import emptyIcon from '@/pages/object/images/empty.svg';
import rightIcon from '@/pages/object/images/rightIcon.svg';
import DropdownMultiSelect from '@/components/dropdownMultiSelect';
import {
  IconCalendarColor,
  IconCounterColor, IconDataIntegrationColor,
  IconDataResDirColor,
  IconHelpColor,
  IconInformationColor,
  IconTextareaColor, IconUnitMgrColor
} from 'modo-design/icon';
import './style/index.less';
import { addRelationTag,
  getDataSourceList,
  getDataTableInfo,
  getDataTables,
  getAllObject,
  getLinkData, getObjList, getTagList, getObjDetail,saveRelation,updateRelation } from '../../api';


const FormItem = Form.Item;
const InputSearch = Input.Search;
const RadioGroup = Radio.Group;
const { Option } = Select;
interface LinkDetailProps {
  linkObj: {
    id: string | number;
    ontologyId: string | number;
    // 可根据实际补充其它字段
  };
  loginT: (key: string) => string;
}

interface LinkDetailState {
  loading: boolean;
  data: any;
  objList: any[];
  tagList: any[];
  sourceObjectLinkType: string;
  targetObjectLinkType: string;
  activeTagModel: string;
  tagModalVisible: boolean;
  stepModalVisible: boolean;
  visible: boolean;
  activelinkType: string;
  dsOptions: any[];
  modelOptions: any[];
  datasetAll: any[];
  listLoading: boolean;
  tableLoading: boolean;
  datasetList: any[];
  tableData: any[];
  sourceFields: any[];
  targetFields: any[];
  columns: any[];
  current: number;
  keySearchValue: string;
  fieldList1: any[];
  fieldList2: any[];
}

class LinkDetail extends React.Component {
  constructor(props: LinkDetailProps) {
    super(props);
    this.state = {
      loading: false,
      data: {},
      sourceTag:[],
      targetTag:[],
      objList: [],
      tagList: [],
      sourceObjectLinkType: '',
      targetObjectLinkType: '',
      activeTagModel: 'source-tags',
      tagModalVisible: false,
      stepModalVisible: false,
      visible: false,
      activelinkType: '',
      dsOptions: [],
      modelOptions: [],
      datasetAll: [],
      listLoading: false,
      tableLoading: false,
      datasetList: [],
      tableData: [],
      sourceFields: [],
      targetFields: [],
      columns: [
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
      ],
      current: 1,
      keySearchValue: '',
      fieldList1: [],
      fieldList2: [],
      pageSize:20
    };
  }

  formRef = React.createRef<FormInstance<any, any, string | number | symbol>>();
  datasetFormRef = React.createRef<FormInstance<any, any, string | number | symbol>>();
  initData = () => {
    getAllObject({ontologyId:this.props.linkObj.ontologyId}).then(res=>{
      if (res.data.success) {
        this.setState({
          objList: res.data.data,
        });
      } else {
        Message.error('获取数据失败！');
      }
    });
    this.getAllTag();
  };
  getAllTag = () => {
    getTagList({ limit: 100, page: 1 }).then(res => {
      if (res.data.success) {
        const data = res.data.data;
        data.forEach(item => {
          item.id = item.id || item.tagName;
          item.label = item.tagLabel;
          item.value = item.tagName;
          item.desc = item.tagDesc;
        });
        this.setState({
          tagList: data,
        });
      } else {
        Message.error('获取数据失败！');
      }
    });
  };
  getData = () => {
    this.setState({
      loading: true,
    });
    getLinkData(this.props.linkObj.id)
      .then(res => {
        if (res.data.success) {
          const formData = { ...res.data.data };
          /*if (formData.linkType === 1) {
            this.setState({
              sourceObjectLinkType: 'one',
            });
            if (formData.linkMethod === 1) {
              this.setState({
                targetObjectLinkType: 'one',
              });
            } else {
              this.setState({
                targetObjectLinkType: 'many',
              });
            }
          } else {
            this.setState({
              sourceObjectLinkType: 'many',
              targetObjectLinkType: 'many',
            });
          }
          this.setState({
            data: formData,
            fieldList1: formData.sourceObjectType.attributes,
            fieldList2: formData.targetObjectType.attributes,
          });*/

          this.setState({
            sourceObjectLinkType: formData.linkType === 1?'one':'many',
            targetObjectLinkType: formData.linkType === 1 && formData.linkMethod === 1?'one':'many',
            data: {...formData,status:formData.status==1?true:false},
            dataset: formData,
            fieldList1: formData.sourceObjectType.attributes,
            fieldList2: formData.targetObjectType.attributes,
            sourceTag: formData.sourceTag,
            targetTag: formData.targetTag,
            sourceAttributeId: formData.sourceAttributeId,
            targetAttributeId:formData.targetAttributeId
          },()=>{
            this.setSourceObjectType(formData.sourceObjectTypeId,true);
            this.setTargetObjectType(formData.targetObjectTypeId,true);
            if(formData.linkType==2){
              this.getDataSources();
              this.getDatasetFields(true);
            }
          });
        } else {
          Message.error('获取数据失败！');
        }
      })
      .finally(() => {
        this.setState({
          loading: false,
        });
      });
  };
  setSourceObjectLinkType = (value: any) => {
    if (this.state.targetObjectLinkType === 'many' && value === 'many') {
      this.setState({
        visible: true,
        activelinkType: 'source',
      });
    } else {
      this.setState({
        sourceObjectLinkType: value,
      });
    }
    this.setState({sourceAttributeId:this.state.fieldList1.find(item=>item.isPrimaryKey==1).id});
    if(value=='many' && this.state.targetObjectLinkType == 'one'){
      this.setState({targetAttributeId:this.state.fieldList2.find(item=>item.isPrimaryKey==1).id})
    }
  };
  setTargetObjectLinkType = (value: any) => {
    if (this.state.sourceObjectLinkType === 'many' && value === 'many') {
      this.setState({
        visible: true,
        activelinkType: 'target',
      });
    } else {
      this.setState({
        targetObjectLinkType: value,
      });
    }

    if(this.state.sourceObjectLinkType !== 'one'){
      this.setState({targetAttributeId:this.state.fieldList2.find(item=>item.isPrimaryKey==1).id})
    }
    if (this.state.sourceObjectLinkType === 'many' && value === 'one') {
      this.setState({sourceAttributeId:this.state.fieldList1.find(item=>item.isPrimaryKey==1).id})
    }

  };
  setDataset = () => {
    if (this.state.activelinkType === 'source') {
      this.setState({
        visible: false,
        sourceObjectLinkType: 'many',
        stepModalVisible: true,
        targetAttributeId:this.state.fieldList2.find(item=>item.isPrimaryKey==1).id
      });
    } else {
      this.setState({
        visible: false,
        targetObjectLinkType: 'many',
        stepModalVisible: true,
        sourceAttributeId:this.state.fieldList1.find(item=>item.isPrimaryKey==1).id
      });
    }
    this.setState({
      data:{
        ...this.state.data,
        middleDsId:null,
        middleDsSchema: null,
        middleTableName:'',
      },
      tableData:[],
      dataset:{
        middleDsId:null,
        middleDsSchema: null,
        middleTableName:'',
      }
    });
    this.getDataSources();

  };
  setStatus = (value: any) => {
    this.setState({
      data: {
        ...this.state.data,
        status: value,
      },
    });
  };
  setSourceObjectType = (value: any,init=false) => {
    this.setState({
     /* data: {
        ...this.state.data,
        sourceObjectTypeId: value,
      },*/
      sourceObjectTypeId: value,
      sourceAttributeId: init?this.state.sourceAttributeId:null,
    });
    getObjDetail(value).then(res => {
      const objectType = res.data.data;
      const sourceAttribute = objectType.attributes.find(item => item.isPrimaryKey === 1);
      this.setState({
        /*data: {
          ...this.state.data,
          sourceObjectTypeId: value,
          sourceObjectType: {
            ...objectType,
            actions: objectType.actions,
            attributes: objectType.attributes,
          },
          sourceAttribute: sourceAttribute[0] ? { ...sourceAttribute[0] } : {},
          sourceAttributeId: sourceAttribute[0] ? sourceAttribute[0].id : null,
        },*/
        fieldList1:objectType.attributes,
        sourceObjectTypeId: value,
        sourceAttribute: sourceAttribute||{},
        sourceAttributeId: init?this.state.sourceAttributeId:sourceAttribute?.id || null,
      });
    });
  };
  setTargetObjectType = (value: any,init) => {
    this.setState({
     /* data: {
        ...this.state.data,
        targetObjectTypeId: value,
      },*/
      targetObjectTypeId: value,

      targetAttributeId: init?this.state.targetAttributeId: null,
    });
    getObjDetail(value).then(res => {
      const objectType = res.data.data;
      const targetAttribute = objectType.attributes.find(item => item.isPrimaryKey === 1);
      this.setState({
       /* data: {
          ...this.state.data,
          targetObjectTypeId: value,
          targetObjectType: {
            ...objectType,
            actions: objectType.actions,
            attributes: objectType.attributes,
          },
          targetAttribute: targetAttribute[0] ? { ...targetAttribute[0] } : {},
          targetAttributeId: targetAttribute[0] ? targetAttribute[0].id : null,
        },*/
        fieldList2:objectType.attributes,
        targetObjectTypeId: value,
        targetAttribute: targetAttribute|| {},
        targetAttributeId: init?this.state.targetAttributeId:targetAttribute?.id || null,
      });
    });
  };
  addNewTag = (value: any) => {
    this.setState({
      activeTagModel: value,
      tagModalVisible: true,
    });
  };
  setSouceTag = (value: any) => {
    this.setState({
      /*data: {
        ...this.state.data,
       sourceTag: value,
      },*/
      sourceTag: value,
    });
  };
  setTargetTag = (value: any) => {

    this.setState({
      /*data: {
        ...this.state.data,
        targetTag: value,
      },*/
      targetTag: value,
    });
  };
  addTag = async (value: any) => {
    try {
      await this.formRef.current?.validate();
      const param = this.formRef.current?.getFieldsValue();
      addRelationTag(param)
        .then(res => {
          if (res.data.success) {
            Message.success('新建标签成功');
            this.getAllTag();
          }
        })
        .finally(() => {
          this.setState({
            tagModalVisible: false,
          });
        });
    } catch (e) {
      //
    }
  };
  getDataSet = (param: any) => {
    this.setState({
      listLoading: true,
      datasetList: [],
    });
    getDataTables(param)
      .then(res => {
        if (res.data.success) {
          const data = res.data.data;
          this.setState({
            current: 1,
            keySearchValue:'',
            datasetAll: data,
          },()=>{
            this.updateDataset();
          });
        } else {
          Message.error('查询数据集失败');
        }
      })
      .finally(() => {
        this.setState({
          listLoading: false,
        });
      });
  };

  getDataSources = () => {
    this.setState({
      dsOptions: [],
      modelOptions: [],
    });
    getDataSourceList().then(res => {
      if (res.data.success) {
        this.setState({
          dsOptions: res.data.data,
        });
        const dsOptions = res.data.data;
        if (this.state.data.middleDsId) {
          const schema =
            dsOptions.find((item: { id: any }) => item.id === this.state.data.middleDsId)
              ?.schemas || [];
          this.setState({
            modelOptions: schema,
          });
        }
      } else {
        Message.error('查询数据源失败');
      }
    });
  };
  //获取字段信息
  getDatasetFields = (init=false) => {
    const dsData = this.datasetFormRef.current?.getFieldsValue();
    const data = this.state.dataset;
    if (data.middleTableName) {
      const param = {
        id: dsData?.middleDsId||data.middleDsId,
        schema: dsData?.middleDsSchema||data.middleDsSchema,
        tableName: data.middleTableName,
      };
      this.setState({
        tableLoading: true,
      });
      getDataTableInfo(param)
        .then(res => {
          if (res.data.success) {
            const { data } = res.data;
            this.setState({
              tableData: data.columns.datas,
            });
            if(init){
              this.setState({
                sourceFields:data.columns.datas,
                targetFields:data.columns.datas,
              })
            }
          } else {
            this.setState({
              tableData: [],
            });
            Message.error('查询字段信息失败');
          }
        })
        .finally(() => {
          this.setState({
            tableLoading: false,
          });
        });
    }
  };
  handleDatasetModelOk = async() => {
    const valid = await this.datasetValidate();
    if(valid){
      const formData = this.datasetFormRef.current.getFieldsValue();
      const data = this.state.data;
      this.setState({
        data:{
          ...this.state.data,
          ...formData,
          middleDsName:this.state.dsOptions.find(item=>item.id==formData.middleDsId)?.name||'',
          middleTableName: this.state.dataset.middleTableName,
          middleSourceField: data.middleTableName !== this.state.dataset.middleTableName ? null : data.middleSourceField,
          middleTargetField: data.middleTableName !== this.state.dataset.middleTableName ? null : data.middleTargetField,
        },
        sourceFields:this.state.tableData,
        targetFields:this.state.tableData,
        stepModalVisible:false,
      });

    }

    //
  };
  datasetValidate = async ()=>{
    let flag = true;
    try {
      await this.datasetFormRef.current.validate();
      if (!this.state.dataset.middleTableName) {
        flag = false;
        Message.error('未选择数据集')
      }
      if (this.state.tableData.length==0) {
        flag = false;
        Message.error('未获取到字段')
      }
    } catch (e) {
      flag = false;
    }
    return flag;
  };
  onValuesChange = (changeValue: any, values: any) => {
    this.setState({
      tableData:[],
      datasetAll:[],
      datasetList:[],
    });
    if (changeValue.middleDsId) {
      this.setState({
        modelOptions: this.state.dsOptions.find(item => item.id == changeValue.middleDsId)?.schemas || [],
      })
    }
    if(changeValue.middleDsId && !changeValue.middleDsSchema){
      this.datasetFormRef.current?.setFieldValue('middleDsSchema', null);
      this.setState({
        dataset:{...this.state.dataset,middleTableName: ''}
      })
    }
    if(changeValue.middleDsSchema && !changeValue.middleDsId){
      this.setState({
        dataset:{...this.state.dataset,middleTableName: ''}
      })
    }
    if (changeValue.middleDsSchema) {
      this.getDataSet({id: values.middleDsId, schema: values.middleDsSchema})
    }
  };
  updateDataset = () => {
    const { keySearchValue, datasetAll, current, pageSize } = this.state;
    let filterDataset = [...datasetAll];
    if (keySearchValue && keySearchValue.length > 0) {
      filterDataset = filterDataset.filter(item =>
        item.TABLE_NAME.toLowerCase().includes(keySearchValue.toLowerCase())
      );
    }
    this.setState({
      total: filterDataset.length,
      datasetList: filterDataset.slice(0, pageSize * current)
    });
  };
  keySearch = (val) => {
    const searchValue = val || '';
    this.setState({
      keySearchValue: searchValue,
      current: 1
    }, () => {
      this.updateDataset();
    })
  };
  renderIcon = (option) => {
    if (!option) {
      return null;
    }
    let labelIcon = '';
    switch (option) {
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
    return labelIcon
  };
  componentDidMount() {
    this.initData();
    this.getData();
  }
  componentDidUpdate(prevProps, prevState) {
    // 检查 stepModalVisible 是否变化
    if (this.state.stepModalVisible && prevState.stepModalVisible !== this.state.stepModalVisible) {
      const data = this.state.data;
      setTimeout(()=>{
        this.datasetFormRef.current?.setFieldsValue({middleDsId:data.middleDsId||undefined,middleDsSchema:data.middleDsSchema||undefined});
        this.getDatasetFields();
      })
    }
  }
  handleSave = async(callback)=>{
    const {
      sourceTag,
      targetTag,
      sourceObjectTypeId,
      targetObjectTypeId,
      sourceAttributeId,
      targetAttributeId,
      sourceObjectLinkType,
      targetObjectLinkType}=this.state;

    let linkMethod = 1;
    let linkType = 1;
    let sObjId = sourceObjectTypeId;
    let tObjId = targetObjectTypeId;
    let sAttrId = sourceAttributeId;
    let tAttrId = targetAttributeId;
    if(sourceObjectLinkType == 'one'){
      linkType = 1;
      if(targetObjectLinkType == 'one'){
        //one->one
        linkMethod = 1;
      }else{
        //one->many
        linkMethod=2;
      }
    }else{
      if(targetObjectLinkType == 'one'){
        //many->one
        linkType = 1;
        linkMethod = 2;
         sObjId = targetObjectTypeId;
         tObjId = sourceObjectTypeId;
         sAttrId = targetAttributeId;
         tAttrId = sourceAttributeId;
      }else{
        //many->many
        linkType=2;
        linkMethod = 3;
      }
    }
    const data = this.state.data;
    if(sourceTag.length==0 || targetTag.length==0){
          Message.error('请选择关系标签');
          return;
    }else if(linkType==2){
      debugger;
      console.log(data);

      if(!data.middleDsId ){
        Message.error('请选择数据集');
        return;
      }
      if( !data.middleSourceField || !data.middleTargetField){
        Message.error('请选择映射字段');
        return;
      }
    }

    this.setState({
      loading:true
    });
      let param = {
        ...data,
        status:data.status?1:0,
        ontologyId:this.props.linkObj.ontologyId,
        sourceTag,
        targetTag,
        sourceObjectTypeId:sObjId,
        targetObjectTypeId:tObjId,
        sourceAttributeId:sAttrId,
        targetAttributeId:tAttrId,
        linkType,
        linkMethod
      };
    if(param.id) {
      updateRelation(param).then(res => {
        if (res.data.success) {
          //typeof callback === 'function' && callback('关系类型详情');
          typeof callback === 'function' && callback({ type:'updateTab',tabId: this.props.linkObj.ontologyId,view:'link',tabName:'关系类型详情'});
          Message.success('保存成功！');
          return;
        }
        throw 'err'
      }).catch(err => {
        console.log(err);
        Message.error('保存失败！')
      }).finally(() => {
        this.setState({
          loading: false
        })
      })
    } else {
      saveRelation(param)
    }

  };
  render() {
    const {
      loading,
      data,
      dataset,
      objList,
      tagList,
      sourceObjectLinkType,
      targetObjectLinkType,
      activeTagModel,
      tagModalVisible,
      visible,
      dsOptions,
      modelOptions,
      datasetAll,
      sourceFields,
      targetFields,
      listLoading,
      tableLoading,
      datasetList,
      tableData,
      columns,
      current,
      keySearchValue,
      fieldList1,
      fieldList2,
      sourceTag,
      targetTag,
      sourceAttributeId,
      sourceObjectTypeId,
      targetObjectTypeId,
      targetAttributeId,
    } = this.state;
    return (
      <Spin className="link-detail-spin" loading={loading}>
        <div className="link-detail">
          <div className="base-info">
            <div className="title">关系基础信息</div>
            <div className="base-info-form">
              <div className="base-info-form-item">
                <div className="form-label">关系类型ID</div>
                <div className="form-value">{data.id}</div>
              </div>
              <div className="base-info-form-item">
                <div className="form-label">状态</div>
                <div className="form-value">
                  <Switch
                    checkedText="启用"
                    uncheckedText="禁用"
                    checked={data.status}
                    onChange={this.setStatus}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="link-info">
            <div className="first-link-info link-info-item">
              <div className="obj-name">
                <Select
                  placeholder="请选择对象类型"
                  value={sourceObjectTypeId}
                  showSearch
                  filterOption={(inputValue, option) => option.props.extra.objectTypeName.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0 ||
                    option.props.extra.objectTypeLabel.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0
                  }
                  onChange={(v)=>this.setSourceObjectType(v,false)}
                >
                  {objList.map((item: any) => (
                    <Option
                      value={item.id}
                      key={item.id}
                      extra={item}
                    //  disabled={item.id === targetObjectTypeId}
                    >
                      <Space>
                        <IconDataResDirColor />
                        {item.objectTypeLabel}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </div>
              <Form className="link-form" layout="vertical">
                <FormItem label="基数">
                  <RadioGroup value={sourceObjectLinkType} onChange={this.setSourceObjectLinkType}>
                    <Radio value="one">One</Radio>
                    <Radio value="many">Many</Radio>
                  </RadioGroup>
                </FormItem>
               {/* <FormItem label="主键">
                  <Select
                    value={sourceAttributeId}
                    placeholder="请选择"
                    options={fieldList1.map((item: any) => {
                      return {
                        value: item.id,
                        label: item.attributeName,
                      };
                    })}
                    disabled
                  ></Select>
                </FormItem>*/}

                {
                  (sourceObjectLinkType === 'many' && targetObjectLinkType === 'one') ? (
                    <FormItem label="外键">
                      <Select
                        value={sourceAttributeId}
                        placeholder="请选择"
                        showSearch
                        filterOption={(inputValue, option) => option.props.extra.attributeName.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0
                        }
                       /* options={fieldList1.map((item: any) => {
                          return {
                            value: item.id,
                            label: item.attributeName,
                          };
                        })}*/
                        onChange={(v)=>{this.setState({sourceAttributeId:v})}}
                      >
                        {fieldList1.map((item) => (
                          <Option value={item.id} key={item.id} extra={item}>
                            <Space size='mini' style={{verticalAlign:'top'}}>
                              {this.renderIcon(item.fieldType)}
                              {item.attributeName}
                              {item.isPrimaryKey ?
                                <Tag size='small' bordered color='arcoblue'>Primary key</Tag> : ''}
                              {item.isTitle? <Tag size='small' bordered color='cyan'>Title</Tag>:''}
                            </Space>
                          </Option>
                        ))}
                      </Select>
                    </FormItem>
                  ) : (
                    <FormItem label="主键">
                      <Select
                        value={sourceAttributeId}
                        placeholder="请选择"
                        showSearch
                        filterOption={(inputValue, option) => option.props.extra.attributeName.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0
                        }
                        /*options={fieldList1.map((item: any) => {
                          return {
                            value: item.id,
                            label: item.attributeName,
                          };
                        })}*/
                        //disabled
                        onChange={(v)=>{this.setState({sourceAttributeId:v})}}
                      >
                        {fieldList1.map((item) => (
                          <Option value={item.id} key={item.id} extra={item}>
                            <Space size='mini' style={{verticalAlign:'top'}}>
                              {this.renderIcon(item.fieldType)}
                              {item.attributeName}
                              {item.isPrimaryKey ?
                                <Tag size='small' bordered color='arcoblue'>Primary key</Tag> : ''}
                              {item.isTitle? <Tag size='small' bordered color='cyan'>Title</Tag>:''}
                            </Space>
                          </Option>
                        ))}
                      </Select>
                    </FormItem>
                  )}




                {sourceObjectLinkType === 'many' && targetObjectLinkType === 'many' ? (
                  <FormItem label="中间数据集" field="middleDsId">
                    <div className="dataset">
                      <div className="dataset-left">
                        <div className="dataset-icon">
                          <IconDataResDirColor style={{ fontSize: '20px', color: '#3261CE' }} />
                        </div>
                        <div className="dataset-mid">
                          <div className="dataset-mid-top">
                            {data.middleTableName || '数据集名称'}
                          </div>
                          <div className="dataset-mid-bottom">
                            {dsOptions.find(item=>item.id==data.middleDsId)?.name|| '数据源名称'}/{data.middleDsSchema || '模式名称'}
                          </div>
                        </div>
                      </div>
                      <div className="dataset-right">
                        <Button
                          type="text"
                          onClick={() => {
                            this.setState({ stepModalVisible: true });
                          }}
                        >
                          选择数据集
                        </Button>
                      </div>
                    </div>
                  </FormItem>
                ) : (
                  ''
                )}
                {sourceObjectLinkType === 'many' && targetObjectLinkType === 'many' ? (
                  <FormItem label="映射字段">
                    <Select
                      placeholder="字段名称"
                      value={data.middleSourceField}
                      error={!data.middleSourceField}
                      onChange={(value)=>{this.setState({data:{...data,middleSourceField:value}})}}
                      options={sourceFields.map((item: any) => {
                        return {
                          value: item.COLUMN_NAME,
                          label: item.COLUMN_NAME,
                        };
                      })}
                    ></Select>
                  </FormItem>
                ) : (
                  ''
                )}
                <FormItem label="示例">
                    <div className="form-shili">
                        <Tag>{sourceObjectLinkType}</Tag>
                        <Tag
                          className="blue-tag"
                          icon={<IconDataResDirColor style={{color: '#4E5969'}}/>}
                        >
                            {objList.find(item=>item.id == sourceObjectTypeId)?.objectTypeLabel || ''}
                        </Tag>
                        <Tag>has {targetObjectLinkType}</Tag>
                        <Tag
                          className="blue-tag"
                          icon={<IconDataResDirColor style={{color: '#4E5969'}}/>}
                        >
                          {objList.find(item=>item.id == targetObjectTypeId)?.objectTypeLabel || ''}
                        </Tag>
                    </div>
                </FormItem>
                <Divider style={{ marginBottom: '20px' }} />
                <FormItem>
                  <div className="tag-head">
                    关系标签
                    <Tooltip
                      content="为关系类型的每一侧输入一个名称，即指向当前
对象类型的关系展示的语义描述"
                    >
                      {' '}
                      <IconHelpColor style={{ marginLeft: 3 }} />
                    </Tooltip>
                  </div>
                  <DropdownMultiSelect
                    className={`source-tags-${this.props?.linkObj?.id} link-detail-tag`}
                    addNode={
                      <Button
                        type="text"
                        size="mini"
                        onClick={() => {
                          this.addNewTag(`source-tags-${this.props?.linkObj?.id}`);
                        }}
                      >
                        + 新建关系标签
                      </Button>
                    }
                    options={tagList}
                    limit={100}
                    selectedValues={sourceTag}
                    onChange={this.setSouceTag}
                    placeholder="请选择"
                    searchPlaceholder="请输入"
                  />
                </FormItem>
              </Form>
            </div>
            <div className="second-link-info link-info-item">
              <div className="obj-name">
                <Select
                  placeholder="请选择对象类型"
                  value={targetObjectTypeId}
                  showSearch
                  filterOption={(inputValue, option) => option.props.extra.objectTypeName.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0 ||
                    option.props.extra.objectTypeLabel.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0
                  }
                  onChange={(v)=>this.setTargetObjectType(v,false)}
                >
                  {objList.map((item: any) => (
                    <Option
                      value={item.id}
                      key={item.id}
                      extra={item}
                   //   disabled={item.id === sourceObjectTypeId}
                    >
                      <Space>
                        <IconDataResDirColor />
                        {item.objectTypeLabel}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </div>
              <Form className="link-form" layout="vertical">
                <FormItem label="基数">
                  <RadioGroup value={targetObjectLinkType} onChange={this.setTargetObjectLinkType}>
                    <Radio value="one">One</Radio>
                    <Radio value="many">Many</Radio>
                  </RadioGroup>
                </FormItem>
                {
                (sourceObjectLinkType === 'many' && targetObjectLinkType === 'one') ? (
                  <FormItem label="主键">
                    <Select
                      value={targetAttributeId}
                      showSearch
                      filterOption={(inputValue, option) => option.props.extra.attributeName.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0
                      }
                      placeholder="请选择"
                      /*options={fieldList2.map((item: any) => {
                        return {
                          value: item.id,
                          label: item.attributeName,
                        };
                      })}*/
                     // disabled
                      onChange={(v)=>{this.setState({targetAttributeId:v})}}
                    >
                      {fieldList2.map((item) => (
                        <Option value={item.id} key={item.id} extra={item}>
                          <Space size='mini' style={{verticalAlign:'top'}}>
                            {this.renderIcon(item.fieldType)}
                            {item.attributeName}
                            {item.isPrimaryKey ?
                              <Tag size='small' bordered color='arcoblue'>Primary key</Tag> : ''}
                            {item.isTitle? <Tag size='small' bordered color='cyan'>Title</Tag>:''}
                          </Space>
                        </Option>
                      ))}
                    </Select>
                  </FormItem>
                ) : (
                  <FormItem label="外键">
                    <Select
                      value={targetAttributeId}
                      showSearch
                      placeholder="请选择"
                      filterOption={(inputValue, option) => option.props.extra.attributeName.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0
                      }
                     /* options={fieldList2.map((item: any) => {
                        return {
                          value: item.id,
                          label: item.attributeName,
                        };
                      })}*/

                      onChange={(v)=>{this.setState({targetAttributeId:v})}}
                    //  disabled={sourceObjectLinkType === 'many' && targetObjectLinkType === 'many'}
                    >
                      {fieldList2.map((item) => (
                        <Option value={item.id} key={item.id} extra={item}>
                          <Space size='mini' style={{verticalAlign:'top'}}>
                            {this.renderIcon(item.fieldType)}
                            {item.attributeName}
                            {item.isPrimaryKey ?
                              <Tag size='small' bordered color='arcoblue'>Primary key</Tag> : ''}
                            {item.isTitle? <Tag size='small' bordered color='cyan'>Title</Tag>:''}
                          </Space>
                        </Option>
                      ))}
                    </Select>
                  </FormItem>
                )}
                {sourceObjectLinkType === 'many' && targetObjectLinkType === 'many' ? (
                  <FormItem label="中间数据集" field="middleDsId">
                    <div className="dataset">
                      <div className="dataset-left">
                        <div className="dataset-icon">
                          <IconDataResDirColor style={{ fontSize: '20px', color: '#3261CE' }} />
                        </div>
                        <div className="dataset-mid">
                          <div className="dataset-mid-top">
                            {data.middleTableName || '数据集名称'}
                          </div>
                          <div className="dataset-mid-bottom">
                            {dsOptions.find(item=>item.id==data.middleDsId)?.name|| '数据源名称'}/{data.middleDsSchema || '模式名称'}
                          </div>
                        </div>
                      </div>
                      <div className="dataset-right"></div>
                    </div>
                  </FormItem>
                ) : (
                  ''
                )}
                {sourceObjectLinkType === 'many' && targetObjectLinkType === 'many' ? (
                  <FormItem label="映射字段">
                    <Select
                      placeholder="字段名称"
                      error={!data.middleTargetField}
                      value={data.middleTargetField}
                      onChange={(value)=>{this.setState({data:{...data,middleTargetField:value}})}}
                      options={targetFields.map((item: any) => {
                        return {
                          value: item.COLUMN_NAME,
                          label: item.COLUMN_NAME,
                        };
                      })}
                    ></Select>
                  </FormItem>
                ) : (
                  ''
                )}
                <FormItem label="示例">
                    <div className="form-shili">
                        <Tag>{targetObjectLinkType}</Tag>
                        <Tag
                          className="blue-tag"
                          icon={<IconDataResDirColor style={{ color: '#4E5969' }} />}
                        >
                          {objList.find(item=>item.id == targetObjectTypeId)?.objectTypeLabel || ''}
                        </Tag>
                        <Tag>has {sourceObjectLinkType}</Tag>
                        <Tag
                          className="blue-tag"
                          icon={<IconDataResDirColor style={{ color: '#4E5969' }} />}
                        >
                          {objList.find(item=>item.id == sourceObjectTypeId)?.objectTypeLabel || ''}
                        </Tag>
                    </div>
                </FormItem>
                <Divider style={{ marginBottom: '20px' }} />
                <FormItem>
                  <div className="tag-head">
                    关系标签
                    <Tooltip
                      content="为关系类型的每一侧输入一个名称，即指向当前
对象类型的关系展示的语义描述"
                    >
                      {' '}
                      <IconHelpColor style={{ marginLeft: 3 }} />
                    </Tooltip>
                  </div>
                  <DropdownMultiSelect
                    className={`target-tags-${this.props?.linkObj?.id} link-detail-tag`}
                    addNode={
                      <Button
                        type="text"
                        size="mini"
                        onClick={() => {
                          this.addNewTag(`target-tags-${this.props?.linkObj?.id}`);
                        }}
                      >
                        + 新建关系标签
                      </Button>
                    }
                    options={tagList}
                    limit={100}
                    selectedValues={targetTag}
                    onChange={this.setTargetTag}
                    placeholder="请选择"
                    searchPlaceholder="请输入"
                  />
                </FormItem>
              </Form>
            </div>
          </div>
        </div>
        <Modal
          title={<div style={{ textAlign: 'left', fontWeight: 600 }}>新建关系标签</div>}
          getPopupContainer={() => {
            if (activeTagModel) {
              return document.getElementsByClassName(activeTagModel)?.[0] as HTMLElement;
            }
            return document.body as HTMLElement;
          }}
          key={activeTagModel}
          okText="保存"
          style={{ width: '280px' }}
          visible={tagModalVisible}
          onOk={this.addTag}
          onCancel={() => {
            this.setState({
              tagModalVisible: false,
            });
          }}
          autoFocus={false}
          focusLock
          unmountOnExit={true}
          className="tag-modal1"
        >
          <div className="tag-container">
            <Form
              ref={this.formRef}
              autoComplete="off"
              layout="vertical"
              className="metaData-form"
              validateMessages={{
                required: (_, { label }) => `${'请输入'}${label} `,
              }}
            >
              <FormItem label="标签中文" field="tagLabel" rules={[{ required: true },{
                validator: (value, callback) => {
                  if (!value) return callback();

                  const formatRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/;
                  // 必须包含中文或字母的校验
                  const chineseOrLetterRegex = /[\u4e00-\u9fa5a-zA-Z]/;

                  if (!formatRegex.test(value)) {
                    callback('仅支持中文、字母、数字和下划线');
                    return;
                  } else if (!chineseOrLetterRegex.test(value)) {
                    callback('必须包含中文或字母');
                    return;
                  }

                  // 检查是否已存在相同的中文标签
                  const isDuplicate = tagList.some(tag =>
                    tag.tagLabel === value
                  );

                  if (isDuplicate) {
                    return callback('该标签中文名已存在');
                  }

                  return callback();
                }
              }]}>
                <Input placeholder="请输入关系标签的中文" maxLength={50} showWordLimit/>
              </FormItem>
              <FormItem label="标签英文" field="tagName" rules={[{ required: true },{
                validator: (value, callback) => {
                  if (!value) return callback();
                  if (!/^(?=.*[a-zA-Z])[a-zA-Z0-9_]+$/.test(value)) {
                    callback('必须包含英文字母，且仅支持英文字母、数字和下划线');
                    return;
                  }
                  // 检查是否已存在相同的中文标签
                  const isDuplicate = tagList.some(tag =>
                    tag.tagName === value
                  );

                  if (isDuplicate) {
                    return callback('该标签英文名已存在');
                  }

                  return callback();
                }
              }]}>
                <Input placeholder="请输入关系标签的英文" maxLength={50} showWordLimit/>
              </FormItem>
              <FormItem label="描述" field="tagDesc">
                <Input.TextArea
                  placeholder="请输入关系标签的解释说明"
                  maxLength={50}
                  showWordLimit
                  style={{ minHeight: 62 }}
                />
              </FormItem>
            </Form>
          </div>
        </Modal>
        <Modal
          title={
            <div style={{ textAlign: 'left' }}>
              <IconInformationColor style={{ marginRight: 3, color: '#3261CE' }} />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>提示</span>
            </div>
          }
          visible={visible}
          onCancel={() => {
            this.setState({ visible: false });
          }}
          onOk={() => {
            this.setDataset();
          }}
        >
          <p>
            设置多对多的关系类型，需要通过使用中间数据集来实现。请选择一个数据集，必须包含与您所关联的对象类型都相关的外键。
          </p>
        </Modal>
        <Modal
          title={<div style={{ textAlign: 'left', fontWeight: 600 }}>选择数据集</div>}
          style={{ width: '1000px' }}
          visible={this.state.stepModalVisible}
          onOk={this.handleDatasetModelOk}
          onCancel={() => {
            this.setState({
              stepModalVisible: false,
            });
          }}
          autoFocus={false}
          focusLock
          className="relation-step-modal"
        >
          <div className="relation-dataset-container">
            <Form
              ref={this.datasetFormRef}
              autoComplete="off"
              layout="vertical"
              className="dataset-form"
              onValuesChange={this.onValuesChange}
            >
              <FormItem
                label="数据源"
                field="middleDsId"
                rules={[{ required: true, message: '请选择数据源' }]}
              >
                <Select placeholder={'请选择数据源'} showSearch
                        filterOption={(inputValue, option) => option.props.extra.name.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0}>
                  {dsOptions.map((option, index) => (
                    <Option key={option.id} value={option.id} extra={option}>
                      {option.name}
                    </Option>
                  ))}
                </Select>
              </FormItem>
              <FormItem
                label="模式"
                field="middleDsSchema"
                rules={[{ required: true, message: '请选择模式' }]}
              >
                <Select placeholder={'请选择模式'} showSearch>
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
                      placeholder={'请输入'}
                      value={keySearchValue}
                      className="search-input"
                      onChange={this.keySearch}
                    />
                  ) : (
                    ''
                  )}
                  {datasetList.length > 0 ? (
                    <List
                      className="dataset-list"
                      onReachBottom={currentPage => this.setState({ current: current + 1 },()=>{ this.updateDataset();})}
                      dataSource={datasetList}
                      render={(item, index) => (
                        <List.Item
                          key={item.TABLE_NAME}
                          className={`list-item ${
                            item.TABLE_NAME === dataset.middleTableName ? 'active' : ''
                          }`}
                          onClick={() =>
                            this.setState({
                              dataset: { ...dataset, middleTableName: item.TABLE_NAME },
                            },()=>{
                              this.getDatasetFields()
                            })
                          }
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
                          <img src={emptyIcon} alt="暂无数据" />
                        </div>
                      }
                      description={'未选择数据集'}
                    />
                  )}
                </Spin>
              </div>
              <div className="dataset-arrow">
                <div className={`right-icon ${data.middleTableName ? '' : 'empty'}`}>
                  <img className="gt" src={rightIcon} alt="暂无数据" />
                </div>
              </div>
              <div className="dataset-right">
                <div className="dataset-head">
                  <span>字段</span>
                </div>
                <div className="dataset-content">
                  <Spin
                    style={{ display: 'block', width: '100%', height: '100%' }}
                    loading={tableLoading}
                  >
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
                            <img src={emptyIcon} alt="暂无数据" />
                          </div>
                        }
                        description={'未选择字段'}
                      />
                    )}
                  </Spin>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </Spin>
    );
  }
}

const LinkDetailWrapper = (props: { linkObj: LinkDetailProps['linkObj'] }) => {
  const loginT = useLocale(i18n);
  return <LinkDetail {...props} loginT={loginT} />;
};

export default LinkDetail;
