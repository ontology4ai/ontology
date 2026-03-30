import React, { useRef, useState, useContext, useEffect } from 'react';
import {
    Form,
    Select,
    Button,
    Modal,
    Table, 
    TableColumnProps,
    Tooltip,
    Typography,
    Spin,
    Grid,
    Input
} from '@arco-design/web-react';
import widgetMap from '../../FormProc/widget';
import { IconFileSearch } from 'modo-design/icon';
import _ from 'underscore';
import '../style/index.less';
import axios from 'modo-plugin-common/src/core/src/http';

const ElxFormGroup: React.FC = (props) => {
  const { Text } = Typography;
  const FormItem = Form.Item;
  const Option = Select.Option;
  const { options, thisEvent, item,currentCell, formRef} = props;//option的参数
  const { value } = options;
  const { field, label }=item;
  const [groupFields, setGroupFields] = useState(item.options.fields);
  // const { options,thisEvent, item,formRef,getApi,currentCell,config} = props;//option的参数
  // const { value,fields} = options;
  // const { field }=item;

  //外部组件会调用
  const setRelation = (values) => {
    const fields  = groupFields;
    let  fields_ = [];
    const fromItems = formRef? formRef.getFieldsValue() : {};
    console.log('------fromItems', fromItems, props);
    fields.map(field => {
        let _field={...field};
        var _relatedValue = fromItems[field.field] || values;
        if(field.relatedItems){
             fields_= fields.map((itm,inx)=>{
                let itm_={...itm};
                if (field.relatedItems.indexOf(itm.field) >= 0) {
                    if (itm.dependVal && itm.dependVal.indexOf(_relatedValue) >= 0) {
                        if (!itm.isShow) {
                            itm.isShow = true;
                            return itm;
                        }
                        return itm;
                    }else{
                        itm.isShow = false;
                        return itm;
                    }

                }else{
                    return itm_;
                }
            })

        }else{
            return _field;
        }
    })
    if(fields_.length > 0){
       setGroupFields(fields_)
    }
    
    
  }

  useEffect(()=>{
    if(formRef) {
      setTimeout(()=>{
        setRelation();
      }, 0);
    }
  }, [formRef]);

  return (
      <div className='elx-form-group-content'>
          <FormItem {...item} hidden={ item.isShow === undefined ? false : !item.isShow }>
            <Grid.Row gutter={8}>
              {groupFields.map((gField, index)=>{
                const relatedItems = gField.relatedItems;
                const gOptions = gField.options;
                const Widget = widgetMap[gField.type];
                return (
                  <Grid.Col span={gField.span}>
                    <Form.Item field={gField.field} hidden={!gField.isShow}>
                      <Widget
                          {...gOptions}
                          isShow={gField.isShow}
                          key={index}
                          // changeLabel={this.props.changeLabel}
                          onSearch={(value, option) => {
                              typeof gOptions.onSearch === 'function' && gOptions.onSearch(props,formRef,value,item,gOptions,gField);
                          }}
                          visibleChange={()=>{
                              typeof gOptions.visibleChange === 'function' && gOptions.visibleChange(props,formRef,value,item,gOptions,gField);
                          }}
                          onClick={()=>{
                              typeof gOptions.onClick === 'function' && gOptions.onClick(props,formRef,value,item,gOptions,gField);
                          }}
                          onChange={(value, option) => {
                              if(relatedItems) {
                                setRelation(value);
                              }
                              typeof gOptions.onChange === 'function' && gOptions.onChange(props,formRef,value,item,gOptions,gField);
                          }}>
                          { gField.text }
                      </Widget>
                    </Form.Item>
                  </Grid.Col>
                )
              })}
          </Grid.Row>
          </FormItem>
      </div>
  )
  
}
export default ElxFormGroup;
