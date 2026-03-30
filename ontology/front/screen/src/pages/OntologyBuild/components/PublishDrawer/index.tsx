import {
  Button,
  Drawer,
  Form,
  Input,
  Select,
  Table
} from '@arco-design/web-react';
import React, { useState, useEffect } from 'react';
import Title from '../Title';
import './index.less';
import { useTranslation } from 'react-i18next';

const FormItem = Form.Item;
const Option = Select.Option;

interface PublishDrawerProps {
  visible: boolean;
  ontologyId?: string;
  logicList: any[];
  actionList: any[];
  onCancel: () => void;
  onOk: (data: any) => void;
}

const PublishDrawer: React.FC<PublishDrawerProps> = ({ visible, actionList, logicList, ontologyId, onCancel, onOk }) => {
  const { t, i18n } = useTranslation();
  const [ontologyName, setOntologyName] = useState(t('abnormal.weather.impact.analysis.ontology'));
  const [ontologyDesc, setOntologyDesc] = useState(t('abnormal.weather.impact.analysis.ontology'));
  const [serviceName, setServiceName] = useState(t('abnormal.weather.impact.analysis.ontology.service'));
  
  const chKnowledge = `以下为片段示例：

    #角色
    你是一个职能决策/分析助手、拥有两种能力：
    1.本体推理：基于RDF定义的类、属性和规则进行逻辑推导
    1.本体推理：基于RDF定义的类、属性和规则进行逻辑推导
    
    #本体定义
    你是一个职能决策/分析助手、拥有两种能力：
    1.本体推理：基于RDF定义的类、属性和规则进行逻辑推导`;
    
  const enKnowledge = `The following is a snippet example:

    #Role
    You are an intelligent decision/analysis assistant with two capabilities:
    1. Ontology Reasoning: Perform logical deduction based on classes, properties, and rules defined in RDF.
    2. Execute Object Service: Access the \`ontology_service\` tool to execute functions and actions defined in the ontology or query object instance data.
    #\`ontology_service\` Usage Instructions
    The \`ontology_service\` can convert your input code into corresponding function or action calls, or query object instance data.
    <object>.find(...)
    Allowed parameters for find: (Omitted)
    RDF
    
    #Ontology Definition
    @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
    @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
    @prefix owl: <http://www.w3.org/2002/07/owl#> .
    Impact
    Address
    @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
    @prefix prov: <http://www.w3.org/ns/prov#>
    @prefix dcterms: <http://purl.org/dc/terms/>
    @prefix swrl: <http://www.w3.org/2003/11/swrl#> .
    @prefix swrlb: <http://www.w3.org/2003/11/swrlb#>
    @prefix scm: <http://asiainfo.com/supplychain#>.
    @prefix ex: <http://asiainfo.com/supplychain-instances#>
    <http://asiainfo.com/supplychain> a owl:Ontology ;
    rdfs:label "Supply Chain Disaster Ontology"@en;
    rdfs:label "Supply Chain Disaster Ontology"@zh;
    dcterms:description "Covers concepts of disaster events, warehouses, roads, logistics, orders, revenue, and customers; defines impact relationships, dependencies, and executable actions. Used to support traceable and reproducible business decision reasoning."@zh;
    owl:versionlnfo "1.0".
    The rest is omitted.`;

  const [knowledgeData, setKnowledgeData] = useState(i18n.language.startsWith('en') ? enKnowledge : chKnowledge);

  // 监听语言变化并更新知识库内容
  useEffect(() => {
    if (i18n.language.startsWith('en')) {
      setKnowledgeData(enKnowledge);
    } else {
      setKnowledgeData(chKnowledge);
    }
  }, [i18n.language]);

  const handleOk = () => {
    onOk({});
  };

  const actionColumns = [
    {
      title: t('action.name'),
      dataIndex: 'label',
      align: 'center',
      width: 350,
    },
    {
      title: t('related.object'),
      dataIndex: 'objectType',
      align: 'center',
      width: 200,
    },
    {
      title: t('description.field'),
      dataIndex: 'desc',
      align: 'center',
    },
  ];


  const logicColumns = [
    {
      title: t('logic.list'),
      dataIndex: 'label',
      align: 'center',
      width: 350,
    },
    {
      title: t('query.object'),
      dataIndex: 'objectType',
      align: 'center',
      width: 200,
      render: (col, record, index) => {
        return (
            <span>{record.objectType?.join('、')}</span>
        );
      }
    },
    {
      title: t('description.field'),
      dataIndex: 'desc',
      align: 'center',
    },
  ];

  return (
    <Drawer
      getPopupContainer={() => {
        return document.querySelector('.screen-content') || document.body;
      }}
      width="50%"
      title={null}
      visible={visible}
      footer={null}
      closable={false}
      onOk={() => {
        handleOk();
      }}
      onCancel={() => {
        onCancel();
      }}
      className="publish-drawer"
    >
      <div className='publish-drawer-bg'>
        <img src={new URL(`./imgs/bg.png`, import.meta.url).href} />
      </div>
      <div className='publish-drawer-wrap'>
        <div className='publish-drawer-title'>
          {t('publish.ontology')}
          <img onClick={() => { onCancel(); }} src={new URL(`./imgs/close.png`, import.meta.url).href} />
        </div>
        <div className="publish-drawer-content">
          <Title className="publish-drawer-content-title">{t('basic.info')}</Title>
          <Form layout="vertical">
            <FormItem label={t('ontology.name')} required>
              <Input 
                value={ontologyName} 
                onChange={setOntologyName} 
                placeholder={t('enter.ontology.name')}
                style={{ width: '400px' }} 
              />
            </FormItem>
            <FormItem label={t('ontology.description')} required>
              <Input.TextArea 
                value={ontologyDesc} 
                onChange={setOntologyDesc} 
                placeholder={t('enter.ontology.description')}
              />
            </FormItem>
          </Form>
          <Title className="publish-drawer-content-title">{t('knowledge.base')}</Title>
          <div className="publish-knowledge">
            <Input.TextArea
              value={knowledgeData}
              onChange={setKnowledgeData}
              style={{ height: '100%' }}
            />
          </div>
          <Title className="publish-drawer-content-title">{t('mcp.service')}</Title>
          <Form layout="vertical">
            <FormItem label={t('service.name')} required>
              <Input 
                value={serviceName} 
                onChange={setServiceName} 
                placeholder={t('enter.service.name')}
                style={{ width: '400px' }} 
              />
            </FormItem>
          </Form>
          <Title className="publish-drawer-content-title">{t('actions')}</Title>
          <Table
            columns={actionColumns}
            data={actionList}
            borderCell={false}
            pagination={false}
            style={{ marginBottom: '30px' }}
          />
          <Title className="publish-drawer-content-title">{t('logic.list')}</Title>
          <Table columns={logicColumns} data={logicList} borderCell={false} pagination={false} />
        </div>
        <div className='publish-drawer-footer'>
          <Button onClick={() => handleOk()} type="primary">
            {t('publish.ontology')}
          </Button>
        </div>
      </div>
    </Drawer>
  );
};

export default PublishDrawer;