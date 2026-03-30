import React, { useRef, useState, useContext, useEffect, useCallback } from 'react';
import { Form, Select, Input, Message, Button } from '@arco-design/web-react';
import { IconTableChartColor, IconReportEditColor } from 'modo-design/icon';
import _ from 'underscore';
import molecule from '@dtinsight/molecule';
import '../style/index.less';
import SelectRefresh from '@/components/SelectRefresh';
import axios from 'modo-plugin-common/src/core/src/http';
import ModelDesign from '@/pages/model-design';
import modelIcon from '@/pages/flink-sql/images/procTypeIcons/model.svg';
const base = '/_dev-dataos'; //_4.3-dataos
import useLocale from 'modo-plugin-common/src/utils/useLocale';
import i18n from '../locale';
const ElxDs: React.FC = props => {
    const t = useLocale();
    const loginT = useLocale(i18n);
  const FormItem = Form.Item;
  const Option = Select.Option;
  const { options, formRef, thisEvent, getApi, currentCell, config } = props; //option的参数
  const { param, metaTableNameVisible, modeNameVisible } = options;
  const [isMetaTableName, setIsMetaTableName] = useState(metaTableNameVisible);
  const [isHiddenModeName, setIsHiddenModeName] = useState(modeNameVisible);
  // const metaTableNameVisible=currentCell && currentCell.stepInst == 'sql'?false:true;;//sql 组件没有模式名
  const { findDatasources, getTableByTeamAndDsNameSchema } = getApi;
  const [dsOptions, setDsOptions] = useState([]);
  const [elxDsOptions, setElxDsOptions] = useState([]);
  const [schemaOptions, setSchemaOptions] = useState([
    /* {
            label:'qadb1',
            value:'qadb1'
        },
        {
            label:'qadb2',
            value:'qadb2'
        },*/
  ]); //模式名
  const [dsSchemaListInit, setDsSchemaListInt] = useState(false);
  const [metaTableListInit, setMetaTableListInt] = useState(false);
  const [queueListInit, setQueueListInt] = useState(false);
  const [hasQueue, setHasQueue] = useState(false);
  const [queueList, setQueueList] = useState([]); //队列列表
  const [metaTableNameOptions, setMetaTableNameOptions] = useState([]); //元模型
  const [dsName, setDsName] = useState(''); //数据源的dsName
  const [defaultDsName, setDefaultDsName] = useState(''); //数据源的dsName
  const [metaTableName, setMetaTableName] = useState('');
  const teamName = sessionStorage.getItem('teamName');
  const [engineOptions, setEngineOptions] = useState([
    {
      value: 'mr',
      label: 'mr',
    },
    {
      value: 'tez',
      label: 'tez',
    },
    {
      value: 'spark',
      label: 'spark',
    },
  ]);
  const [engineVisible, setEngineVisible] = useState(false);

  const [currentValue, setCurrentValue] = useState({
    schema_dev: '',
    schema_prod: '',
  }); //数据源的dsName
  const schema_ = 'schema_' + param.env;
  const queue_ = 'queue_' + param.env;
  const getQueueList = dsName => {
    const { env } = param;
    setQueueList([]);
    axios
      .get(`/_api/_/modoAppTeamDs/hiveDs/queue/${dsName}/${teamName}`)
      .then(res => {
        if (res.data?.data) {
          const { data } = res.data;
          const options = data.queueList;
          const queueOptionObj = {
            union: [],
            dev: [],
            prod: [],
          };
          _.map(options, option => {
            const queue = option.split('|');
            if (queue.length > 0) {
              if (queue.length == 1) {
                queue.push(queue[0]);
              }
              const devOption = { label: queue[0], value: queue[0] };
              const prodOption = { label: queue[1], value: queue[1] };
              let unionOption;
              if (queue[0] === queue[1]) {
                unionOption = { label: queue[0], value: queue[0] };
              } else {
                unionOption = {
                  label: `开发：${queue[0]}  生产：${queue[1]}`,
                  value: `${queue[0]}|${queue[1]}`,
                };
              }

              queueOptionObj.union.push(unionOption);
              queueOptionObj.dev.push(devOption);
              queueOptionObj.prod.push(prodOption);
            }
          });
          setQueueList(queueOptionObj[env]);
        }
      })
      .catch(e => {
        console.log(e);
        Message.error('队列数据查询失败');
      });
  };
  const getSchemaOptions = dsName => {
    const { env } = param;
    setSchemaOptions([]);
    return new Promise((resolve, reject)=>{
      axios.get(`/_api/_/modoAppTeamDs/ds/schema/${dsName}/${teamName}`).then(res => {
        if (res.data?.data) {
          const { data } = res.data;
          const options = data.schemaList;
          const schemaOptionObj = {
            union: [],
            dev: [],
            prod: [],
          };
          _.map(options, option => {
            const schema = option.split('|');
            if (schema.length > 0) {
              if (schema.length == 1) {
                schema.push(schema[0]);
              }
              const devOption = { label: schema[0], value: schema[0] };
              const prodOption = { label: schema[1], value: schema[1] };
              let unionOption;
              if (schema[0] === schema[1]) {
                unionOption = { label: schema[0], value: schema[0] };
              } else {
                unionOption = {
                  label: `开发：${schema[0]}  生产：${schema[1]}`,
                  value: `${schema[0]}|${schema[1]}`,
                };
              }

              schemaOptionObj.union.push(unionOption);
              schemaOptionObj.dev.push(devOption);
              schemaOptionObj.prod.push(prodOption);
            }
          });
          setSchemaOptions(schemaOptionObj[env]);
        }
      }).finally(()=>{
        resolve('');
      });
    })

    /*    const schemaOptions = elxDsOptions.find((option) => {
            return option.name === dsName;
        });
        if (schemaOptions) {
            const options = schemaOptions.schemaEnums;

            const schemaOptionObj = {
                union: [],
                dev: [],
                prod: []
            };
            _.map(options, (option) => {
                const labelArr = option.label.split('|');
                const valueArr = option.value.split('|');
                const devOption = { label: labelArr[0], value: valueArr[0] };
                const prodOption = { label: labelArr[1], value: valueArr[1] };
                let unionOption;
                if (valueArr[0] === valueArr[1]) {
                    unionOption = { label: labelArr[0], value: valueArr[0] };
                } else {
                    unionOption = { label: `开发：${labelArr[0]}  生产：${labelArr[1]}`, value: `${valueArr[0]}|${valueArr[1]}` };
                }

                schemaOptionObj.union.push(unionOption);
                schemaOptionObj.dev.push(devOption);
                schemaOptionObj.prod.push(prodOption);
            });
            // setSchemaOptions(schemaOptionObj[env]);
            // const option=
            // setSchemaOptions();
            // if(schemaOptionObj[env].length>0){
            //     let defaultSchema=schemaOptionObj[env][0].value;

            //     formRef?formRef.setFieldsValue({schema:defaultSchema}):'';
            //     getMetaTableNameOptions(defaultSchema);//初始渲染元模型的值

            // }

        }*/
  };
  const debouncedFetchUser = useCallback(
      _.debounce((inputValue) => {
        setDsOptions([]);
        getElxDsOptions(inputValue)
      }, 500),
      []
    );
  const changeItmDsName = async (val) => {
    await getSchemaOptions(val);
    setDsName(val);
    if (param.env == 'union') {
      formRef ? formRef.setFieldsValue({ schema_union: '' }) : '';
    }
    const { changeDsName } = options;
    let formData = formRef ? formRef.getFieldsValue() : '';
    let arr = dsOptions.filter(item => {
      if (item.name == val) {
        return item;
      }
    });
    let arr_ = arr.length > 0 ? arr[0] : [];
    if (changeDsName) {
      changeDsName(thisEvent, config, val, formData, teamName, axios, base, arr_);
    }
    // console.log('arr_.dsSchema',arr_,arr_?.dsSchema)
    // const dsSchema = arr_.dsSchema?.length > 0 ? arr_?.dsSchema?.split(',')[0] : '';
    formRef
      ? formRef.setFieldsValue({
          schema: '',
          schema_union: '',
          schema_dev: '',
          schema_prod: '',
        })
      : '';
    isMetaTableName && formRef?.setFieldsValue({ metaTableName: '', tableName: '', xmlId: '' });
    setMetaTableName('');
    schemaOptions.length ==0 && getMetaTableNameOptions(val, '');

    let dsData: any = dsOptions.find(item => {
      return item.name == val;
    });
    formRef?.setFieldsValue({ dsUserId: dsData?.dsUserId || '' });
    //数据源变化时和队列的交互
    const hasQueue = param.queueShow && dsData?.dsType == 'hive';
    setHasQueue(hasQueue);
    setEngineVisible(dsData?.dsType == 'hive');
    hasQueue && getQueueList(val);
    formRef.setFieldsValue({
      queue: '',
      queue_union: '',
      queue_dev: '',
      queue_prod: '',
    });
  };
  const getMetaTableNameOptions = (val, keyword?) => {
    let dsName_ = formRef ? formRef.getFieldValue('dsName') : '';
    let schema = formRef ? formRef.getFieldValue(schema_) : '';
    const param = {
      limit: 20,
      offset: 0,
      teamName,
      keyWord: keyword || '',
      dsName: dsName_,
      schema:schema,
      dataSrc: 'draft',
    };
    getTableByTeamAndDsNameSchema(param)
      .then(res => {
        const { data } = res;
        if (data.data?.content) {
          const options = [];
          data.data.content.forEach(item => {
            options.push({
              value: item.modelName,
              label: item.modelLabel,
              ...item,
            });
          });
          setMetaTableNameOptions(options);
          //   if(res.data.content.length>0){
          //     const defalutMetaTableName=res.data.content[0].name;
          //     formRef?formRef.setFieldsValue({metaTableName:defalutMetaTableName}):'';
          //   }
        }
      })
      .catch(err => {
        console.log(err);
      });
  };
  //元模型远程搜索
  const getMetaTableNameOptionsSeach = (inputValue, dsName) => {
    const param = {
      limit: 20,
      offset: 0,
      teamName,
      keyWord: inputValue || '',
      dsName: dsName || '',
      dataSrc: 'draft',
    };
    getTableByTeamAndDsNameSchema(param)
      .then(res => {
        const { data } = res;
        if (data.data?.content) {
          const options = [];
          data.data.content.forEach(item => {
            options.push({
              value: item.modelName,
              label: item.modelLabel,
              ...item,
            });
          });
          setMetaTableNameOptions(options);
          //   if(res.data.content.length>0){
          //     const defalutMetaTableName=res.data.content[0].name;
          //     formRef?formRef.setFieldsValue({metaTableName:defalutMetaTableName}):'';
          //   }
        }
      })
      .catch(err => {
        console.log(err);
      });
  };
  const changeItmQueue = val => {
    let queueDefalut = formRef ? formRef.getFieldValue(queue_) : '';
    if (param.env !== 'union') {
      return;
    }
    let currentValue_ = {
      queue_dev: '',
      queue_prod: '',
    };
    if (typeof queueDefalut === 'string') {
      if (/\|/g.test(queueDefalut)) {
        const valueArr = queueDefalut.split('|');
        currentValue_.queue_dev = valueArr[0];
        currentValue_.queue_prod = valueArr[1];
      } else {
        currentValue_.queue_dev = queueDefalut;
        currentValue_.queue_prod = queueDefalut;
      }
    } else {
      currentValue_.queue_dev = null;
      currentValue_.queue_prod = null;
    }
    formRef ? formRef.setFieldsValue(currentValue_) : '';
  };
  const changeItmSchema = val => {

    // setTimeout(()=>{
    let schemaDefalut = formRef ? formRef.getFieldValue(schema_) : '';
    if (param.env !== 'union') {
      return;
    }
    let currentValue_ = {
      schema_dev: '',
      schema_prod: '',
    };
    if (typeof schemaDefalut === 'string') {
      if (/\|/g.test(schemaDefalut)) {
        const valueArr = schemaDefalut.split('|');
        currentValue_.schema_dev = valueArr[0];
        currentValue_.schema_prod = valueArr[1];
      } else {
        currentValue_.schema_dev = schemaDefalut;
        currentValue_.schema_prod = schemaDefalut;
      }
    } else {
      currentValue_.schema_dev = null;
      currentValue_.schema_prod = null;
    }
    formRef ? formRef.setFieldsValue(currentValue_) : '';
    if(isMetaTableName){
      const dsName = formRef?.getFieldValue('dsName');
      getMetaTableNameOptions(dsName);
      formRef?formRef.setFieldsValue({metaTableName:'', tableName: ''}):'';
    }
    const { changeSchema } = options;
    let formData = formRef ? formRef.getFieldsValue() : '';
    if (changeSchema) {
      changeSchema(thisEvent, config, val, formData, teamName);
    }
    // setCurrentValue(currentValue_);
    // },1000)
  };
  const changeMetaTableName = val => {
    setMetaTableName(val);
    setTimeout(() => {
      formRef
        ? formRef.setFieldsValue({
            tableName: val,
          })
        : '';
    }, 100);

    let arr = metaTableNameOptions.filter(item => {
      if (item.modelName == val) {
        return item;
      }
    });
    if (arr.length > 0) {
      let schemaDefalut = formRef ? formRef.getFieldsValue() : '';
      formRef
        ? formRef.setFieldsValue({
            metaTableName: arr[0].modelName,
            xmlId: arr[0].id,

            // dsSchema:arr[0].dsSchema
          })
        : '';
    }

  };
  const searchMetaTableName = useCallback(
    _.debounce((inputValue, dsName) => {
      getMetaTableNameOptionsSeach(inputValue, dsName);
    }, 500),
    [],
  );

  const getElxDsOptions = (inputValue) => {
    const params = {
      // scenario:param.scenario,
      // dsCategory: param.dsCategory,
      // storageType: param.storageType,
      // teamName:teamName,
      // dsType:'mysql',
      workspaceId: config.apiInfo.workspaceId,
      dsType: param.dsType || '',
      dsCategory: param.dsCategory,
    };
    if(inputValue && param.isRemoteSearch){
      params['dsName'] = inputValue;
      params['dsLabel'] = inputValue;
    }
    let url='';
    if(param?.requestUrl){
      url=param?.requestUrl;
    }else{
      url=`_common_/_api/_/workspace/ds-list`
    }
    const host=`${window.location.host}`;
    const protocol=`${window.location.protocol}`;
    axios.get(`${protocol}//${host}/${url}`,{params}).then(res => {
        const { data } = res;
          let data_=data?.data;
        if (param.processData) {
          data_ = param.processData(data);
        }
        console.log('data_',data_)
        if (data.success && Array.isArray(data_) ) {
          const options = [];
          data_.forEach(item => {
            options.push({
              value: item.name,
              label: item.label,
              ...item,
            });
          });
          setDsOptions(options);
          setElxDsOptions(data_);
        }else{
          setDsOptions([]);
          setElxDsOptions([]);
        }
    }).catch(err => {
        console.log(err);
    });

  };
  const compatibleSchema = value => {
    if (!value) {
      return;
    }
    if (param.env === 'union') {
      if (value.schema_dev && value.schema_prod) {
        if (value.schema_dev === value.schema_prod) {
          value.schema_union = value.schema_dev;
        } else {
          value.schema_union = `${value.schema_dev}|${value.schema_prod}`;
        }
        return value;
      }
      if (!value.schema_dev && !value.schema_prod) {
        if (/\|/g.test(value.schema_union)) {
          const unionArr = value.schema_union.split('|');
          value.schema_dev = unionArr[0];
          value.schema_prod = unionArr[1];
        } else {
          value.schema_dev = value.schema_union;
          value.schema_prod = value.schema_union;
        }
        return value;
      }
      if (/\|/g.test(value.schema_union)) {
        if (value.schema_dev === value.schema_prod) {
          value.schema_union = value.schema_dev;
        }
      }
    }
    return value;
  };
  const defaultValue = {
    schema_union: null,
    schema_dev: null,
    schema_prod: null,
    // queue_union: null,
    // queue_dev: null,
    // queue_prod: null
  };
  useEffect(() => {
    getElxDsOptions();
    let schemaDefalut = formRef ? formRef.getFieldValue(schema_) : '';
    formRef ? formRef.setFieldsValue(compatibleSchema(_.extend(defaultValue, schemaDefalut))) : '';
  }, []);
  useEffect(() => {
    if (isHiddenModeName && schemaOptions.length !== 0) {
      formRef ? formRef.setFieldsValue({ [`schema_${param.env}`]: schemaOptions[0].value }) : '';
    }
  }, [schemaOptions]);
  useEffect(() => {
    const { options } = props;
    if (options.metaTableNameVisible == undefined) {
      setIsMetaTableName(true);
    } else {
      setIsMetaTableName(false);
    }
    if (options.modeNameVisible == undefined) {
      setIsHiddenModeName(false);
    } else {
      setIsHiddenModeName(true);
    }
  }, [options]);
  //初始化时根据dsName获取schema选项,元模型选项
  useEffect(() => {
    if (formRef?.getFieldValue('dsName')) {
      const dsName = formRef?.getFieldValue('dsName');
      setDsName(dsName);
      if (!dsSchemaListInit) {
        getSchemaOptions(dsName);
        setDsSchemaListInt(true);
      }
      if (isMetaTableName && !metaTableListInit) {
        getMetaTableNameOptions(dsName);
        setMetaTableListInt(true);
      }
    }
    if (formRef?.getFieldValue('metaTableName')) {
      const metaTableName = formRef?.getFieldValue('metaTableName');
      setMetaTableName(metaTableName);
    }
  }, [props.formRef]);
  useEffect(() => {
    if (formRef?.getFieldValue('dsName') && dsOptions.length > 0) {
      const dsName = formRef?.getFieldValue('dsName');
      let dsData: any = dsOptions.find(item => {
        return item.name == dsName;
      });
      //初始化队列选项
      if (param.queueShow) {
        const hasQueue = dsData?.dsType == 'hive';
        setHasQueue(hasQueue);
        if (hasQueue && !queueListInit) {
          getQueueList(dsName);
          setQueueListInt(true);
        }
      }
      setEngineVisible(dsData?.dsType == 'hive');
      //初始化dsUserId
      formRef?.setFieldsValue({ dsUserId: dsData?.dsUserId || '' });
    }
  }, [dsOptions, props.formRef]);
  useEffect(() => {
    if (!engineVisible) {
      formRef?.setFieldsValue({ engine: undefined });
    }
  }, [engineVisible]);
  let optionsParam = options.param;
  return (
    <>
      <FormItem
        label={loginT("数据源")}
        field="dsName"
        rules={[
          {
            required: true,
            message: loginT("请选择数据源"),
          },
        ]}
      >
        <SelectRefresh
          {...optionsParam}
          filterOption={optionsParam?.isRemoteSearch ? false : (inputValue, option)=>option.props.value.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0 || option.props.children.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0}
          onSearch={optionsParam?.isRemoteSearch ? debouncedFetchUser : '' }
          onChange={v => {
            changeItmDsName(v);
          }}
          handelRefresh={(self_)=>{
            getElxDsOptions();
          }}
        >
          {dsOptions.map(option => (
            <Option key={option.value} value={option.value}>
              {option.label}
            </Option>
          ))}
        </SelectRefresh>
      </FormItem>
      <FormItem hidden field="dsUserId">
        <Input />
      </FormItem>

      {/* <FormItem label='数据源英文名' field='dsName' disabled >
                 <Input  placeholder='请输入数据源英文名' />
            </FormItem> */}
      {/* 数据源为一个时，不自动隐藏模式名 */}
      {!isHiddenModeName && (
        <FormItem
          style={{ display: schemaOptions.length > 0 ? 'block' : 'none' }}
          label={loginT("模式名")}
          field={schema_}
          rules={[
            {
              required: schemaOptions.length > 0, //非必选
              message: loginT("请选择模式名"),
            },
          ]}
        >
          <SelectRefresh
            value={currentValue}
            showSearch
            onChange={v => {
              changeItmSchema(v);
            }}
            handelRefresh={(self_)=>{
              const dsName = formRef?.getFieldValue('dsName');
                getSchemaOptions(dsName);
            }}
          >
            {schemaOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </SelectRefresh>
        </FormItem>
      )}
      {/* 模式名为一个或时没有时，自动隐藏模式名 */}
      {isHiddenModeName && (
        <FormItem
          style={{ display: schemaOptions.length > 1 ? 'block' : 'none' }}
          label={loginT("模式名")}
          field={schema_}
          rules={[
            {
              required: false, //非必选
              message:loginT("请选择模式名"),
            },
          ]}
        >
          <SelectRefresh
            value={currentValue}
            showSearch
            onChange={v => {
              changeItmSchema(v);
            }}
            handelRefresh={(self_)=>{
              const dsName = formRef?.getFieldValue('dsName');
                getSchemaOptions(dsName);
            }}
          >
            {schemaOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </SelectRefresh>
        </FormItem>
      )}
      {/* <FormItem label='数据源profile' field={}
                rules={[
                    {
                        required: true,
                        message: '请选择模式名',
                    }
                ]}>
                <SelectRefresh value={currentValue} showSearch onChange={(v) => {changeItmSchema(v)}}>
                {schemaOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                    {option.label}
                </Option>
                ))}
                </SelectRefresh>
            </FormItem> */}
      {isMetaTableName ? (
        <>
          <FormItem
            label={(
              <>
                {loginT("元模型")}
                {options.editModelVisible && metaTableName  && <Button
                  type="text"
                  style={{float: 'right'}}
                  onClick={() => {
                    const modelId = formRef?.getFieldValue('xmlId');
                    const metaTableName = formRef?.getFieldValue('metaTableName');
                    const modelLabel = metaTableNameOptions.find(o => o.value === metaTableName)?.label;
                    molecule.editor.open({
                      id: modelId,
                      name: modelLabel || metaTableName,
                      type: 'model',
                      fileType: 'model',
                      icon: modelIcon,
                      renderPane: () => {
                        return (
                          <ModelDesign
                            key={modelId}
                            workspaceId={sessionStorage.getItem('wsId')}
                            modelId={modelId}
                            useArchAsTag={false}
                            disable={false}
                            reloadNodeModelData={null}
                            updateAddLogicModelTab={null}
                            modelCfgs={{}}
                            modelCustomCfgs={[]}
                            refreshModelCfgs={{}}/>
                        );
                      },
                    });
                  }}>
                  <IconReportEditColor/>
                  编辑模型
                </Button>}
                {options.createModelVisible && <Button
                  type="text"
                  style={{float: 'right'}}
                  onClick={() => {
                    const data = getApi.getModelData().then(data => {
                      molecule.editor.open({
                        id: 'addLogicModel',
                        name: '新建模型',
                        type: 'model',
                        fileType: 'model',
                        icon: modelIcon,
                        renderPane: () => {
                          return (
                            <ModelDesign
                              key="addLogicModel"
                              workspaceId={sessionStorage.getItem('wsId')}
                              dirId={null}
                              modelId={null}
                              useArchAsTag="false"
                              disable={false}
                              reloadNodeModelData={null}
                              modelCfgs={{}}
                              modelCustomCfgs={[]}
                              refreshModelCfgs={{}}
                              defaultValues={data}
                            />
                          )
                        },
                      })
                    });
                  }}>
                  <IconTableChartColor />
                  一键建模
                </Button>}
              </>
            )}
            field="metaTableName"
            rules={[
              {
                required: true,
                message: loginT('请选择模式名'),
              },
            ]}
          >
            <SelectRefresh
              {...optionsParam}
              filterOption={(inputValue, option) =>
                option.props.value.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0 ||
                option.props.children.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0
              }
              onChange={v => {
                changeMetaTableName(v);
              }}
              onSearch={inputValue => {
                searchMetaTableName(inputValue, dsName);
              }}
              handelRefresh={(self_)=>{
                const dsName = formRef?.getFieldValue('dsName');
                getMetaTableNameOptions(dsName);
                getApi?.refreshMetaTableName && getApi?.refreshMetaTableName();
              }}
            >
              {metaTableNameOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {`${option.label} (${option.value})`}
                </Option>
              ))}
            </SelectRefresh>
          </FormItem>
          {param.isShowTableName && typeof param.isShowTableName == 'boolean' ? (
            <FormItem label={loginT("创建表名")} field="tableName">
              <Input placeholder={loginT("请输入创建表名")} />
            </FormItem>
          ) : (
            ''
          )}
        </>
      ) : (
        ''
      )}
      {hasQueue ? (
        <FormItem
          label={loginT("队列")}
          field={queue_}
          rules={[
            {
              required: true,
              message: loginT('请选择队列'),
            },
          ]}
        >
          <SelectRefresh
          onChange={val => changeItmQueue(val)}
          handelRefresh={(self_)=>{
            const dsName = formRef?.getFieldValue('dsName');
            getQueueList(dsName);
          }}
          >
            {queueList.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </SelectRefresh>
        </FormItem>
      ) : (
        ''
      )}
      {engineVisible && (
        <FormItem label={loginT("执行引擎")} field={'engine'} placeholder={loginT("请选择执行引擎")}>
          <Select allowClear>
            {engineOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </FormItem>
      )}
    </>
  );
};
export default ElxDs;
