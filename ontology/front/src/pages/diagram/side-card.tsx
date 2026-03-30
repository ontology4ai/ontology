import {Descriptions, Empty, Tag, Tooltip, Typography, Modal,Button, Message} from '@arco-design/web-react';
import {
  IconDataResDirColor,
  IconNodeTreeColor,
  IconRight,
  IconServerNodeColor,
  IconTopologyColor,
  IconDataIntegrationColor,
  IconInputParametersColor,
  IconUserColor,
    IconFileSearch,
  IconDataMapColor, IconTextareaColor, IconCounterColor, IconUnitMgrColor, IconCalendarColor,
} from 'modo-design/icon';
import to1 from './icons/1to1.svg';
import to2 from './icons/1to2.svg';
import right from './icons/right.svg';
import left from './icons/left.svg';
import React, {useState} from 'react';
import './style/side-card.less';
import ObjectIcon from "@/components/ObjectIcon";
import emptyIcon from "@/pages/object/images/empty.svg";

import oneToOneIcon from "@/pages/link-manager/images/oToO.svg";
import oneToManyIcon from "@/pages/link-manager/images/oToM.svg";
import manyToManyIcon from "@/pages/link-manager/images/mToM.svg";

const renderIcon = (option) => {
  let labelIcon = <IconDataIntegrationColor />;
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
const TypeMap = {
  object: {
    color: '#3261CE',
    icon: <IconDataResDirColor style={{ color: 'var(--color-primary-6)' }} />,
    topLine: true,
    style: {
      background:
        'linear-gradient(180deg, rgba(50, 97, 206, 0.20) -2.45%, rgba(50, 97, 206, 0.00) 10.49%), #FFF',
    },
    basicInfo: [
      { label: '中文名称', key: 'objectTypeLabel', value: '' },
      { label: '英文名称', key: 'objectTypeName', value: '' },
      { label: '描述', key: 'objectTypeDesc', value: '' },
    ],
    dsInfo: [
      { label: '连接方式', key: '', value: '' },
      { label: '数据源类型', key: '', value: '' },
      { label: '数据库', key: '', value: '' },
      { label: '模式', key: '', value: '' },
      { label: '数据表', key: '', value: '' },
      { label: '实例数', key: '', value: '' },
    ],
  },
  logic: {
    color: '#55BC8A',
    icon: <IconNodeTreeColor style={{ color: '#55BC8A' }} />,
    topLine: true,
    style: {
      background:
        'linear-gradient(180deg, rgba(85, 188, 138, 0.20) -2.45%, rgba(85, 188, 138, 0.00) 10.49%), #FFF',
    },
    basicInfo: [
      { label: '中文名称', key: 'logicTypeLabel', value: '' },
      { label: '英文名称', key: 'logicTypeName', value: '' },
      { label: '描述', key: 'logicTypeDesc', value: '' },
      { label: '构建方式', key: 'buildType', value: '' },
      { label: '存储路径', key: 'storagePath', value: '' },
    ],
  },
  action_object: {
    color: '#724BC5',
    icon: <IconTopologyColor style={{ color: '#724BC5' }} />,
    topLine: true,
    style: {
      background:
        'linear-gradient(180deg, rgba(156, 118, 238, 0.20) -2.45%, rgba(156, 118, 238, 0.00) 10.49%), #FFF',
    },
    basicInfo: [
      { label: '中文名称', key: 'actionLabel', value: '' },
      { label: '英文名称', key: 'actionName', value: '' },
      { label: '描述', key: 'actionDesc', value: '' },
      { label: '执行对象', key: 'objectTypeLabel', value: '' },
      { label: '执行类型', key: 'actionType', value: '' },
      { label: '构建方式', key: 'buildType', value: '对象' },
      { label: '存储路径', key: 'codeUrl', value: '' },
    ],
  },
  action_function: {
    color: '#9C76EE',
    icon: <IconTopologyColor style={{ color: '#9C76EE' }} />,
    topLine: true,
    style: {
      background:
        'linear-gradient(180deg, rgba(114, 75, 197, 0.20) -2.45%, rgba(114, 75, 197, 0.00) 10.49%), #FFF',
    },
    basicInfo: [
      { label: '中文名称', key: 'actionLabel', value: '' },
      { label: '英文名称', key: 'actionName', value: '' },
      { label: '描述', key: 'actionDesc', value: '' },
      { label: '执行对象', key: 'objectTypeLabel', value: '函数' },
      { label: '执行类型', key: '', value: '' },
      { label: '构建方式', key: 'buildType', value: '函数' },
    ],
  },
  interface: {
    color: '#D451A8',
    icon: <IconServerNodeColor style={{ color: '#D451A8' }} />,
    topLine: true,
    style: {
      background:
        'linear-gradient(180deg, rgba(212, 81, 168, 0.20) -2.45%, rgba(212, 81, 168, 0.00) 10.49%), #FFF',
    },
    basicInfo: [
      { label: '中文名称', key: 'label', value: '' },
      { label: '英文名称', key: 'name', value: '' },
      { label: '描述', key: 'description', value: '' },
    ],
  },
  ontology: {
    title: '本体概览',
    color: 'var(--color-primary-6)',
    topLine: false,
    style: {
      background:
        'linear-gradient(180deg, rgba(50, 97, 206, 0.20) -2.45%, rgba(50, 97, 206, 0.00) 10.49%), #FFF',
    },
    basicInfo: [
      { label: '中文名称', value: '', key: 'ontologyLabel' },
      { label: '英文名称', value: '', key: 'ontologyName' },
      { label: '描述', value: '', key: 'ontologyDesc' },
      { label: '拥有者', value: '', key: 'ownerId' },
      { label: '更新时间', value: '', key: 'lastUpdate' },
      { label: '版本', value: '', key: 'version' },
    ],
  },
  link: {
    title: '关系详情',
    color: 'var(--color-primary-6)',
    topLine: false,
    style: {
      background:
        'linear-gradient(180deg, rgba(50, 97, 206, 0.20) -2.45%, rgba(50, 97, 206, 0.00) 10.49%), #FFF',
    },
    basicInfo: false,
  },
};
const SideCard = (props) => {
  const {data} = props;
  const {type = 'ontology'} = data;
  if(data){
      TypeMap[type].basicInfo && TypeMap[type].basicInfo.forEach(item=>{
        let valueData = '';
      if(item.key == 'buildType'){
          item.value = data[item.key] == 'function' ?
            <div className='func-preview'>
                <span>函数</span>
                <Button type='text' icon={<IconFileSearch/>} onClick={()=>handleCodePreview()}>预览</Button>
            </div>
            : data[item.key] == 'object' ? '对象'
              : data[item.key] == 'api' ? 'API'
                : data[item.key] == 'link' ? 'Link'
                  : '';
      }else if(item.key == 'actionType'){
          item.value = data[item.key]=='create'?'新建':data[item.key]=='delete'?'删除':data[item.key]=='update'?'修改':'';
      }else{
          valueData= data[item.key]||'--';
          item.value = <div className='info-content' style={{width:'160px'}}>
              <Tooltip content={valueData}>
                  <span>{valueData}</span>
              </Tooltip>
          </div>
      }


    });
    TypeMap[type].title = data.title;
    if(type == 'link'){
      console.log(data);
      TypeMap[type].title = '关系详情';
    }
  }
  const [funCodeModalVisible,setFunCodeModalVisible] = useState(false);
  const [functionCode,setFunctionCode] = useState('');
  const handleCodePreview = ()=>{
    if(data.functionCode){
      setFunctionCode(data.functionCode);
      setFunCodeModalVisible(true);
    }else{
      Message.warning('此函数没有代码信息');
    }

  };
  return (
    <div className={`side-card  ${props.hide?'hide':''}`} style={TypeMap[type].style}>
      {TypeMap[type].topLine ? (
        <div className="top-line" style={{ backgroundColor: TypeMap[type].color }} />
      ) : null}
      <div className="header">
        {TypeMap[type].icon}
        <span className="label" style={{display:"inline-block",width:'150px'}}>
          {TypeMap[type]?.title || 'XXX'}
          </span>
        <IconRight style={{cursor:'pointer'}} onClick={()=>{props.onClose && props.onClose()}}/>
      </div>
      <div className="content">
        {TypeMap[type].basicInfo ? (
          <>
            <div className="label">
              <div className="mark" style={{ backgroundColor: TypeMap[type].color }}></div>
              <div className="text">基本信息</div>
              <div className="line" />
            </div>
            <Descriptions
              size="small"
              border
              data={TypeMap[type].basicInfo}
              column={1}
              labelStyle={{ width: '80px' }}
              valueStyle={{width:'160px'}}
            />
          </>
        ) : null}
        {type === 'object' ? (
          <>
            {/*<div className="label">
              <div className="mark" style={{ backgroundColor: TypeMap[type].color }}></div>
              <div className="text">数据源</div>
              <div className="line" />
            </div>
            <Descriptions
              size="small"
              border
              data={TypeMap[type].dsInfo}
              column={1}
              labelStyle={{ width: '80px' }}
            />*/}
            <div className="label">
              <div className="mark" style={{ backgroundColor: TypeMap[type].color }}></div>
              <div className="text">属性</div>
              <Tag className="tag">{data.attributes?.length||0}</Tag>
              <div className="line" />
            </div>
              {data.attributes?.length == 0?<Empty
                icon={<img style={{height: '50px'}}
                           src={emptyIcon}/>}
                description='暂无数据'
              />:''}
            {data.attributes?.map(item => {
              return (
                <div className="attr-row" key = {item.id}>
                  <div className="icon">
                    {/*item.icon*/}
                    {/*<IconDataIntegrationColor />*/}
                      {renderIcon(item.fieldType)}
                  </div>
                  <div className="attr-label">
                    <Typography.Text ellipsis={{showTooltip: true}}>
                      {item.attributeName}
                    </Typography.Text>
                    </div>
                  <div className="tag-list">
                    {item.isPrimaryKey ? (
                      <Tag size="small" bordered color="arcoblue">
                        主键
                      </Tag>
                    ) : null}
                    {item.isTitle ? (
                      <Tag size="small" bordered color="cyan">
                        标题
                      </Tag>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </>
        ) : null}
        {type === 'logic' ? (
          <>
            <div className="label">
              <div className="mark" style={{ backgroundColor: TypeMap[type].color }}></div>
              <div className="text">入参</div>
                <Tag className="tag">{data.inputKeys?.length||0}</Tag>
                <div className="line" />
            </div>
              {data.inputKeys?.length == 0?<Empty
                icon={<img style={{height: '50px'}}
                           src={emptyIcon}/>}
                description='暂无数据'
              />:''}
              {data.inputKeys?.map((item,index) => {
                  return (
                    <div className="attr-row" key={item}>
                        <div className="icon">
                            {/*item.icon*/}
                            <IconInputParametersColor />
                        </div>
                        <div className="attr-label">
                          <Typography.Text ellipsis={{showTooltip: true}}>
                            {item}
                          </Typography.Text>
                        </div>
                    </div>
                  );
              })}
           {/* {[{ paramsName: '测试参数' }, { paramsName: '测试参数' }].map(item => {
              return (
                <div className="attr-row">
                  <div className="icon">
                    item.icon
                    <IconInputParametersColor />
                  </div>
                  <div className="attr-label">{item.paramsName}</div>
                </div>
              );
            })}*/}
            <div className="label">
              <div className="mark" style={{ backgroundColor: TypeMap[type].color }}></div>
              <div className="text">引用对象</div>
              <Tag className="tag">{data.objectType?.length||0}</Tag>
              <div className="line" />
            </div>
            {!data.objectType || data.objectType?.length == 0?<Empty
              icon={<img style={{height: '50px'}}
                         src={emptyIcon}/>}
              description='暂无数据'
            />:''}
            {data.objectType && data.objectType?.map((item,index) => {
              return (
                <div className="attr-row" key={index}>
                  <div className="icon">
                    <ObjectIcon icon={item.icon||''}/>
                  </div>
                  <div className="attr-label">
                    <Typography.Text ellipsis={{showTooltip: true}}>
                      {item.objectTypeLabel}
                    </Typography.Text></div>
                </div>
              );
            })}

            {/*{[{ objectTypeLabel: '对象名称' }].map(item => {
              return (
                <div className="attr-row">
                  <div className="icon">
                    item.icon
                    <IconDataResDirColor />
                  </div>
                  <div className="attr-label">
                          <Typography.Text ellipsis={{showTooltip: true}}>
                            {item.objectTypeLabel}
                          </Typography.Text></div>
                </div>
              );
            })}*/}
          </>
        ) : null}
        {type === 'action_function' ? (
          <>
            <div className="label">
              <div className="mark" style={{ backgroundColor: TypeMap[type].color }}></div>
              <div className="text">入参</div>
              <Tag className="tag">{data.inputKeys?.length||0}</Tag>
              <div className="line" />
            </div>
              {data.inputKeys?.length == 0?<Empty
                icon={<img style={{height: '50px'}}
                           src={emptyIcon}/>}
                description='暂无数据'
              />:''}
            {data.inputKeys?.map((item,index) => {
              return (
                <div className="attr-row" key={item} key = {index}>
                  <div className="icon">
                    {/*item.icon*/}
                    <IconInputParametersColor />
                  </div>
                  <div className="attr-label">
                    <Typography.Text ellipsis={{showTooltip: true}}>
                    {item}
                  </Typography.Text>
                  </div>
                </div>
              );
            })}
          </>
        ) : null}
        {type === 'action_object' ? (
          <>
            <div className="label">
              <div className="mark" style={{ backgroundColor: TypeMap[type].color }}></div>
              <div className="text">更新属性</div>
              <Tag className="tag">{data.params?.length||0}</Tag>
              <div className="line" />
            </div>
              {data.params?.length == 0?<Empty
                icon={<img style={{height: '50px'}}
                           src={emptyIcon}/>}
                description='暂无数据'
              />:''}
            {data.params?.map(item => {
              return (
                <div className="attr-row"  key = {item.id}>
                  <div className="icon">
                    {/*item.icon*/}
                    {/*<IconDataIntegrationColor />*/}
                    {renderIcon(item.fieldType)}
                  </div>
                  <div className="attr-label">
                    <Typography.Text ellipsis={{showTooltip: true}}>
                      {item.attributeName || '--'}
                    </Typography.Text>
                  </div>
                  <div className="tag-list">
                    {item.isPrimaryKey ? (
                      <Tag size="small" bordered color="arcoblue">
                        主键
                      </Tag>
                    ) : null}
                    {item.isTitle ? (
                      <Tag size="small" bordered color="cyan">
                        标题
                      </Tag>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </>
        ) : null}
        {type === 'interface' ? (
          <>
            <div className="label">
              <div className="mark" style={{ backgroundColor: TypeMap[type].color }}></div>
              <div className="text">属性</div>
              <Tag className="tag">{data.attributeList?.length||0}</Tag>
              <div className="line" />
            </div>
              {data.attributeList?.length == 0?<Empty
                icon={<img style={{height: '50px'}}
                           src={emptyIcon}/>}
                description='暂无数据'
              />:''}
            {data.attributeList?.map(item => {
              return (
                <div className="attr-row" key = {item.id}>
                  <div className="icon">
                    {/*item.icon*/}
                    <IconDataIntegrationColor />
                  </div>
                  <div className="attr-label">
                    <Typography.Text ellipsis={{showTooltip: true}}>
                      {item.label||item.name}
                    </Typography.Text>
                    </div>
                </div>
              );
            })}
            <div className="label">
              <div className="mark" style={{ backgroundColor: TypeMap[type].color }}></div>
              <div className="text">关系约束</div>
              <Tag className="tag">{data.constraintList?.length||0}</Tag>
              <div className="line" />
            </div>
              {data.constraintList?.length == 0?<Empty
                icon={<img style={{height: '50px'}}
                           src={emptyIcon}/>}
                description='暂无数据'
              />:''}
            {/*{[1, 2].map(() => {
              return (
                <div className="relation-row">
                  <Tag className="tag">
                    <IconUserColor />
                    Customer
                  </Tag>
                  <img src={to1} alt="" />
                  <Tag className="tag">
                    <IconDataMapColor />
                    Location
                  </Tag>
                </div>
              );
            })}*/}
            <div className="label">
              <div className="mark" style={{ backgroundColor: TypeMap[type].color }}></div>
              <div className="text">继承对象</div>
              <Tag className="tag">{data.extendedList?.length||0}</Tag>
              <div className="line" />
            </div>
              {data.extendedList?.length == 0?<Empty
                icon={<img style={{height: '50px'}}
                           src={emptyIcon}/>}
                description='暂无数据'
              />:''}
            {data.extendedList?.map(item => {
              return (
                <div className="attr-row" key={item.id}>
                  <div className="icon">
                    {/*item.icon*/}
                    {/*<IconDataResDirColor />*/}
                    <ObjectIcon icon={item.icon||''}/>
                  </div>
                  <div className="attr-label">
                    <Typography.Text ellipsis={{showTooltip: true}}>
                      {item.objectTypeLabel}
                    </Typography.Text>
                  </div>
                </div>
              );
            })}
          </>
        ) : null}
        {type === 'ontology' ? (
          <>
            <div className="label">
              <div className="mark" style={{ backgroundColor: TypeMap[type].color }}></div>
              <div className="text">关系标签</div>
              <div className="line" />
            </div>
            <div className="relationship-tags">
              {data.edgeStatistics?.map((link,index) => (
                <Tag key={index}>{link.label}（{link.count}）</Tag>
                ))}
            </div>
          </>
        ) : null}
        {data && type === 'link' ? (
          <>
            <div className="label">
              <div className="mark" style={{ backgroundColor: TypeMap[type].color }}></div>
              <div className="text">关联对象</div>
              <div className="line" />
            </div>
            <div className="relation-row">
              <Tag className="tag">
                <ObjectIcon icon={data.source?.data?.icon||''}/>
                {/*<IconUserColor />*/}
                <span style={{marginLeft:'3px'}}>{data.source?.data?.label}</span>

              </Tag>
              <img
                src={
                  data.cardinality === 'onetoone'
                    ? oneToOneIcon
                    : data.cardinality === 'onetomany'
                    ? oneToManyIcon
                    : manyToManyIcon
                }
              />
              <Tag className="tag">
                <ObjectIcon icon={data.target?.data?.icon||''}/>
                {/*<IconDataMapColor />*/}
                <span style={{marginLeft:'3px'}}>{data.target?.data?.label}</span>
              </Tag>
            </div>
            <div className="label">
              <div className="mark" style={{ backgroundColor: TypeMap[type].color }}></div>
              <div className="text">关联属性</div>
              <div className="line" />
            </div>
            {data && [data.source_attribute,data.target_attribute].map((item,index) => {
              return (
                <div className={`attr-row link-attr-row item-${index}`} key={item?.id}>
                  <div className="icon">
                    {/*item.icon*/}
                    <IconDataIntegrationColor />
                  </div>
                  <div className="attr-label">
                    <Typography.Text ellipsis={{showTooltip: true}}>
                      {item?.label||'--'}
                    </Typography.Text>
                  </div>
                </div>
              );
            })}
            <div className="label">
              <div className="mark" style={{ backgroundColor: TypeMap[type].color }}></div>
              <div className="text">中间数据集</div>
              <div className="line" />
            </div>
            <div>{data.middle_dataset?.table_name||'-'}</div>
            <>
              <div className="label">
                <div className="mark" style={{ backgroundColor: TypeMap[type].color }}></div>
                <div className="text">关系标签</div>
                <img src={right} alt="" />
                <div className="line" />
              </div>
              <div className="relationship-tags">
                {/*{['关系标签1', '关系标签12', '关系标签12', '关系标签12'].map(item => (
                  <Tag>{item}</Tag>
                ))}*/}
                {data.link_labels?.source_labels?.map((item) => (
                  <Tag key={item}>{item}</Tag>
                ))}
              </div>
            </>
            <>
              <div className="label">
                <div className="mark" style={{ backgroundColor: TypeMap[type].color }}></div>
                <div className="text">关系标签</div>
                <img src={left} alt="" />
                <div className="line" />
              </div>
              <div className="relationship-tags">
                {/*{['关系标签1', '关系标签12', '关系标签12', '关系标签12'].map(item => (
                  <Tag>{item}</Tag>
                ))}*/}
                {data.link_labels?.target_labels?.map(item => (
                  <Tag key={item}>{item}</Tag>
                ))}
              </div>
            </>
          </>
        ) : null}
      </div>

        <Modal
          title={<div style={{textAlign: 'left', fontWeight: 600}}>{type=='action_function'?'动作':'逻辑'}预览</div>}
          style={{width: '900px'}}
          visible={funCodeModalVisible}
          onCancel={() => {
              setFunctionCode('');
              setFunCodeModalVisible(false)
          }}
          footer={null}
          autoFocus={false}
          focusLock
          className="function-code-modal"
        >
            <div className="func-detail function-overview-item border-item">
                <div className="func-code-view">
                    {functionCode ? (
                      // 带行号的只读代码块
                      (() => {
                          const codeString = functionCode || '';
                          const codeLines = codeString.split('\n');
                          return (
                            <div className="func-code-container" style={{display: 'flex'}}>
                                <div className="func-code-view-index">
                                    {codeLines.map((_: any, idx: number) => (
                                      <div style={{height: 20, lineHeight: '20px'}}>{idx + 1}</div>
                                    ))}
                                </div>
                                <pre style={{margin: 0, flex: 1}}>
                          <code>
                            {codeLines.map((line: any, idx: any) => (
                              <div style={{height: 20, lineHeight: '20px'}}>{line}</div>
                            ))}
                          </code>
                        </pre>
                            </div>
                          );
                      })()
                    ) : (
                      <Empty
                        icon={
                            <div
                              style={{
                                  display: 'inline-flex',
                                  width: 48,
                                  height: 48,
                                  justifyContent: 'center',
                              }}
                            >
                                <img src={emptyIcon} alt="此函数没有代码信息"/>
                            </div>
                        }
                        description="此函数没有代码信息"
                        style={{paddingTop: '50px'}}
                      />
                    )}
                </div>
            </div>
        </Modal>

    </div>
  );
};
export default SideCard;
