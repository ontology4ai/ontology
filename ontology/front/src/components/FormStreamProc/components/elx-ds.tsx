import React, { useRef, useState, useContext, useEffect, useCallback } from 'react';
import {
    Form,
    Select,
} from '@arco-design/web-react';
import _ from 'underscore';
import '../style/index.less';
import axios from 'modo-plugin-common/src/core/src/http';
const base='/_dev-dataos';//_4.3-dataos
const ElxDs: React.FC = (props) => {
    const FormItem = Form.Item;
    const Option = Select.Option;
    const { options, formRef,thisEvent, getApi,currentCell,config} = props;//option的参数
    const { param,metaTableNameVisible } = options;
    const [isMetaTableName, setIsMetaTableName] = useState(metaTableNameVisible);
    // const metaTableNameVisible=currentCell && currentCell.stepInst == 'sql'?false:true;;//sql 组件没有模式名
    const { findDatasources,getTableByTeamAndDsNameSchema } = getApi;
    const [dsOptions, setDsOptions] = useState([]);
    const [elxDsOptions, setElxDsOptions] = useState([]);
    const [schemaOptions, setSchemaOptions] = useState([
        {
            label:'qadb1',
            value:'qadb1'
        },
        {
            label:'qadb2',
            value:'qadb2'
        },

    ]);//模式名
    const [metaTableNameOptions, setMetaTableNameOptions] = useState([ ]);//元模型
    const [dsName, setDsName] = useState('');//数据源的dsName
    const [defaultDsName, setDefaultDsName] = useState('');//数据源的dsName
    const teamName = sessionStorage.getItem('teamName');

    const [currentValue, setCurrentValue] = useState({
            schema_dev:'',
            schema_prod:'',
        });//数据源的dsName
    const schema_ ='schema_' + param.env;
    const getSchemaOptions=(dsName)=>{
        // console.log('dsName',dsName,elxDsOption)
        // const elxDsOptionDatas=elxDsOption?elxDsOption:elxDsOptions;
        const { env } = param;
        const schemaOptions = elxDsOptions.find((option) => {
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
            // console.log('')
            // setSchemaOptions();
            // if(schemaOptionObj[env].length>0){
            //     let defaultSchema=schemaOptionObj[env][0].value;
            //     console.log(defaultSchema)
            //     console.log('模式名默认值',schemaOptionObj[env],schemaOptionObj[env][0].value)

            //     formRef?formRef.setFieldsValue({schema:defaultSchema}):'';
            //     getMetaTableNameOptions(defaultSchema);//初始渲染元模型的值

            // }

        }

    }

    const changeItmDsName=(val)=>{
       getSchemaOptions(val);
       setDsName(val);
        if (param.env == 'union') {
            formRef?formRef.setFieldsValue({schema_union:''}):'';
        }
        const { changeDsName } = options;
        let  formData = formRef?formRef.getFieldsValue():'';
        if(changeDsName){
            changeDsName(thisEvent,config,val,formData,teamName,axios,base)
        }
    }
    const getMetaTableNameOptions=(keyword?)=>{
        // limit=20&offset=0&modelName=xxx&tabSchema=xxx
        // limit=20&offset=0&dsName=xxx
        const param={
            limit:100,
            offset:0,
            teamName,
            workspaceId:config.apiInfo.workspaceId,
            keyword:keyword||''
            // dsName:dsName,
            // tabSchema:schema,
            // pageNum:0,
            // pageSize:50,
            // dsName:dsName,
            // schema:schema,
            // teamName:teamName
        }
        getTableByTeamAndDsNameSchema(param).then(res => {
            const { data } = res;
            if (data.data?.content) {
              const options = [];
              data.data.content.forEach(item => {
                options.push({
                  value: item.modelName,
                  label: item.modelLabel
                });
              });
              setMetaTableNameOptions(options);
            //   if(res.data.content.length>0){
            //     const defalutMetaTableName=res.data.content[0].name;
            //     formRef?formRef.setFieldsValue({metaTableName:defalutMetaTableName}):'';
            //   }
            }
          }).catch(err => {
            console.log(err);
          });

    }
    const changeItmSchema=(val)=>{
        //元模型更换接口后和模式名无关了
        // if(isMetaTableName){
        //     getMetaTableNameOptions(val);
        //     formRef?formRef.setFieldsValue({metaTableName:''}):'';
        // }
        // setTimeout(()=>{
            let  schemaDefalut= formRef?formRef.getFieldValue(schema_):'';
            if (param.env !== 'union') {
                return;
            }
            let currentValue_={
                schema_dev:'',
                schema_prod:''
            }
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
            formRef?formRef.setFieldsValue(currentValue_):'';
            const { changeSchema } = options;
            let  formData = formRef?formRef.getFieldsValue():'';
            if(changeSchema){
                changeSchema(thisEvent,config,val,formData,teamName)
            }
            // setCurrentValue(currentValue_);
        // },1000)

     }
    const changeMetaTableName=(val)=>{

    }
    const searchMetaTableName = useCallback(
      _.debounce((inputValue) => {
        getMetaTableNameOptions(inputValue)
      }, 500),
      []
    );

    const getElxDsOptions = () => {
    const params={
            // scenario:param.scenario,
            // dsCategory: param.dsCategory,
            // storageType: param.storageType,
            // teamName:teamName,
            // dsType:'mysql',
            workspaceId:config.apiInfo.workspaceId,
            dsType:'',
            dsCategory: param.dsCategory
        };
        console.log('params',params)
        findDatasources(params).then(res => {
            const { data }=res;
          if (res.data.data) {
            const options = [];
            res.data.data.forEach(item => {
                options.push({
                    value: item.name,
                    label: item.label
                  });
            //   options.push({
            //     value: item.dsName,
            //     label: item.dsLabel
            //   });
            });
            setDsOptions(options);
            setElxDsOptions( res.data.data);
            //赋值默认值
            // if(res.data.data.length>0){
            //     let defaultDsName=res.data.data[0].dsName
            //     setDefaultDsName(defaultDsName);
            //     formRef?formRef.setFieldsValue({dsName:defaultDsName}):'';
            //     getSchemaOptions(defaultDsName,res.data.data);//初始渲染模式名的值
            // }
          }
        }).catch(err => {
          console.log(err);
        });
      };
    const compatibleSchema=(value)=> {
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
      }
    const defaultValue = {
        schema_union: null,
        schema_dev: null,
        schema_prod: null,
        // queue_union: null,
        // queue_dev: null,
        // queue_prod: null
    };
    useEffect(()=>{
        getElxDsOptions();
        getMetaTableNameOptions()
        let schemaDefalut= formRef?formRef.getFieldValue(schema_):'';
            formRef?formRef.setFieldsValue(compatibleSchema(_.extend(defaultValue, schemaDefalut))):'';
    },[])
    useEffect(()=>{
        const { options} = props;
        if(options.metaTableNameVisible == undefined){
            setIsMetaTableName(true);
        }else{
            setIsMetaTableName(false);
        }
    },[options])
    //默认根据选择数据源动态更新模式名
    // useEffect(()=>{
    //     getSchemaOptions(dsName);
    //     getMetaTableNameOptions(dsName)
    // },[dsName])
     /* {"'queue_'+param.env" */
    const queue_='queue_'+param.env;

    return (
        <>
            <FormItem label='数据源' field='dsName'
                 rules={[
                    {
                        required: true,
                        message: '请选择数据源',
                    },
                ]}>
                <Select showSearch onChange={(v) => {changeItmDsName(v)}}>
                {dsOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                    {option.label}
                </Option>
                ))}
                </Select>
            </FormItem>
            <FormItem label='模式名' field={schema_}
                rules={[
                    {
                        required: true,
                        message: '请选择模式名',
                    }
                ]}>
                <Select value={currentValue} showSearch onChange={(v) => {changeItmSchema(v)}}>
                {schemaOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                    {option.label}
                </Option>
                ))}
                </Select>
            </FormItem>
            {/* <FormItem label='数据源profile' field={}
                rules={[
                    {
                        required: true,
                        message: '请选择模式名',
                    }
                ]}>
                <Select value={currentValue} showSearch onChange={(v) => {changeItmSchema(v)}}>
                {schemaOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                    {option.label}
                </Option>
                ))}
                </Select>
            </FormItem> */}
            {
                isMetaTableName ?(<FormItem label='元模型'  field='metaTableName'
                rules={[
                    {
                        required: true,
                        message: '请选择模式名',
                    }
                ]}>
                    <Select showSearch filterOption={false}
                            onChange={(v) => {changeMetaTableName(v)}}
                            onSearch={searchMetaTableName}>
                        {metaTableNameOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                            {option.label}
                        </Option>
                        ))}
                        </Select>
                </FormItem>):''
            }
            {/* {
                metaTableNameVisible ?(<FormItem label='队列'  field={queue_}
                rules={[
                    {
                        required: true,
                        message: '请选择队列',
                    }
                ]}>
                    <Select showSearch>
                        {metaTableNameOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                            {option.label}
                        </Option>
                        ))}
                        </Select>
                </FormItem>):''
            } */}


        </>
    )
}
export default ElxDs;
