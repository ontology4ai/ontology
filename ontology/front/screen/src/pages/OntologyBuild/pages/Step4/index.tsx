import React, { useState, useEffect, useMemo } from 'react'
import { Button, Drawer, Table, Form, Select, Input } from '@arco-design/web-react';
import { withTranslation, WithTranslation } from 'react-i18next'
import Title from '../../components/Title'
import './style/index.less'

const FormItem = Form.Item;
const Option = Select.Option;

// 解析 markdown 文本并渲染为 JSX
const renderMarkdownText = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    
    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith('# ')) {
            // 一级标题，保留 # 符号
            elements.push(
                <div key={index} className="markdown-h1">
                    {trimmedLine}
                </div>
            );
        } else if (trimmedLine.startsWith('## ')) {
            // 二级标题，保留 ## 符号
            elements.push(
                <div key={index} className="markdown-h2">
                    {trimmedLine}
                </div>
            );
        } else if (trimmedLine.startsWith('- ') || /^\d+\.\s/.test(trimmedLine)) {
            // 列表项
            elements.push(
                <div key={index} className="markdown-list-item">
                    {trimmedLine}
                </div>
            );
        } else if (trimmedLine) {
            // 普通文本
            elements.push(
                <div key={index} className="markdown-text">
                    {trimmedLine}
                </div>
            );
        } else {
            // 空行
            elements.push(<br key={index} />);
        }
    });
    
    return <React.Fragment>{elements}</React.Fragment>;
};

// MCP服务工具数据
const mcpServer = {
    zh: {
        title: '异常天气影响分析本体MCP服务-包含工具',
        paramsTitle: '参数',
        exampleTitle: '示例',
        tools: [
            {
                name: 'ontology_object_action_run',
                description: '在本体对象上执行动作,支持CREATE、UPDATE、DELETE操作',
                params: [
                    "`ontology_name`(string,必填) - 本体的英文名",
                    "`params`(dict,可选) - 动作的参数,例如`{\"name\":\"张三\"}`",
                    "`action_name`(string,必填) - 动作的英文名",
                    "`object_name`(string,必填) - 对象的英文名"
                ],
                example: `{
                    "ontology_name": "test_ontology",
                    "params": {
                        "数量": 26,
                        "编号": 1
                    },
                    "action_name": "createOrder",
                    "object_name": "Order"
                    }`
            },
            {
                name: 'ontology_object_find',
                description: '从本体对象中查找数据行',
                params: [
                    "`ontology_name`(string,必填) - 本体英文名称",
                    "`object_name`(string,必填) - 对象英文名称",
                    "`return_attrs`(list[string],可选) - 期望返回的属性名称",
                    "`where_sql`(string,可选) - WHERE条件的SQL语句,允许使用属性作为过滤条件",
                    "`where_params`(list[any],可选) - WHERE SQL中的变量量值",
                    "`order_by`(string,可选) - 排序规则",
                    "`page_size`(int,可选) - 分页大小",
                    "`page_token`(string,可选) - 翻页标识"
                ],
                example: `{
                    "ontology_name": "test_ontology",
                    "object_name": "DisasterEvent",
                    "return_attrs": ["eventID"],
                    "where_sql": "typhoonName LIKE %s",
                    "where_params":["%苏帕%"]
                    }`
            },
            {
                name: 'ontology_object_function_run',
                description: '执行本体全局函数',
                params: [
                    "`ontology_name`(string,必填) - 本体英文名称",
                    "`function_name`(string,必填) - 函数英文名",
                    "`params`(dict,可选) - 函数入参"
                ],
                example: `{
                    "ontology_name": "test_ontology",
                    "function_name": "get_vip_customer",
                    "params": {}
                    }`
            }
        ]
    },
    en: {
        title: 'Abnormal Weather  Analysis Ontology MCP - Called Tools',
        paramsTitle: 'Parameters',
        exampleTitle: 'Example',
        tools: [
            {
                name: 'ontology_object_action_run',
                description: 'Executes action on ontology object, supports CREATE, UPDATE, DELETE operations',
                params: [
                    "`ontology_name`(string, required) - Ontology Code",
                    "`params`(dict, optional) - Action parameters, e.g. {\"name\": \"Zhang San\"}",
                    "`action_name`(string, required) - Action Code",
                    "`object_name`(string, required) - Object Code"
                ],
                example: `{
                    "ontology_name": "test_ontology",
                    "params": {
                        "quantity": 26,
                        "number": 1
                    },
                    "action_name": "createOrder",
                    "object_name": "Order"
                    }`
            },
            {
                name: 'ontology_object_find',
                description: 'Finds data from ontology object',
                params: [
                    "`ontology_name`(string, required) - Ontology Code",
                    "`object_name`(string, required) - Object Code",
                    "`return_attrs`(list[string], optional) - Expected return attribute names",
                    "`where_sql`(string, optional) - WHERE SQL clause for filtering, allows attributes as conditions",
                    "`where_params`(list[any], optional) - Variable values for WHERE SQL",
                    "`order_by`(string, optional) - Sort rule",
                    "`page_size`(int, optional) - Page size",
                    "`page_token`(string, optional) - Pagination token"
                ],
                example: `{
                    "ontology_name": "test_ontology",
                    "object_name": "DisasterEvent",
                    "return_attrs": ["eventID"],
                    "where_sql": "typhoonName LIKE %s",
                    "where_params":["%Typhoon%"]
                    }`
            },
            {
                name: 'ontology_object_function_run',
                description: 'Executes ontology global function',
                params: [
                    "`ontology_name`(string, required) - Ontology Code",
                    "`function_name`(string, required) - Function Code",
                    "`params`(dict, optional) - Function input parameters"
                ],
                example: `{
                    "ontology_name": "test_ontology",
                    "function_name": "get_vip_customer",        
                    "params": {}
                    }`
            }
        ]
    }
}

const knowledge = {
    zh:
    {
        title: '异常天气影响分析本体知识',
        text: `# 角色
你是一个智能决策/分析助手，拥有两种能力：
1. 本体推理：基于RDF定义的类、属性和规则进行逻辑推导
2. 执行对象服务：通过访问ontology_service工具服务，执行本体中定义的函数和行动或者查询对象的实例数据

## 执行行动
rdf中每个对象也可能会有绑定的action操作，来对实例数据进行增删改操作，action的调用方法为: <object>.<action_name>({...})。action允许的入参请参考rdf中的定义。

## 执行函数
rdf中所有的函数也可被调用，function的调用方法为: <function_name>({...})。function允许的入参请参考rdf中的定义。

# 决策原则
- 概念性问题→使用本体推理
- 具体数据需求→使用ontology_service工具查询对象的实例数据
- 函数/行动调用→使用ontology_service工具执行函数，当需要执行本体中定义的行动时，利用ontology_service工具执行对对象实例进行操作的行动
- 复杂决策→结合推理和查询
- 结合你的推理，调用相应的action或function来达到你的目的

# 输出要求
在进行输出，首先将本体推理流程进行步骤化的表述，清晰的告诉用户你要怎么做，然后再开始你的执行步骤。

# 要求
- 禁止编造不存在的内容，本体定义中没提到的即为不存在的。
- 你必须只基于本体定义来进行思考和推理，禁止使用除了本体定义外的逻辑或常识来进行思考或推理
- 如果遇到你无法基于本体定义进行推理的情况，请直接拒绝回答此类问题并回复你并没有相关信息

# 本体定义由客户进行输入


# 本体: Analysis of the Impact of Abnormal Weather (异常天气影响分析)

描述本体的RDF省略
            `
    },
    en:
    {
        title: 'Abnormal Weather Analysis Ontology Knowledge',
        text: `# Role
You are an intelligent decision/analysis assistant with two capabilities:
1. Ontology Reasoning: Perform logical deduction based on classes, properties, and rules defined in RDF
2. Execute Object Service: Access the \`ontology_service\` tool to execute functions and actions defined in the ontology or query object instance data

## Execute Action
Each object in RDF may also have bound action operations to perform add/delete/modify operations on instance data. The calling method for action is: <object>.<action_name>({...}). Please refer to definitions in RDF for allowed input parameters of action.

## Execute Function
All functions in RDF can also be called. The calling method for function is: <function_name>({...}). Please refer to definitions in RDF for allowed input parameters of function.

# Decision Principles
- Conceptual questions → Use ontology reasoning
- Specific data needs → Use \`ontology_service\` tool to query instance data
- Function/Action calls → Use \`ontology_service\` tool to execute functions; when defined actions need to be executed, use \`ontology_service\` tool to perform actions on object instances
- Complex decisions → Combine reasoning and query
- Combine your reasoning and call corresponding action or function to achieve your goal

# Output Requirements
When outputting, first articulate the ontology reasoning process in steps, clearly telling the user what you intend to do, then begin your execution steps.

# Requirements
- Do not fabricate non-existent content; anything not mentioned in the ontology definition is considered non-existent.
- You must think and reason based ONLY on the ontology definition; do not use logic or common sense outside the ontology definition.
- If you encounter a situation where you cannot reason based on the ontology definition, directly refuse to answer such questions and reply that you have no relevant information.

# Ontology definition is input by the customer

# Ontology: Analysis of the Impact of Abnormal Weather

RDF describing the ontology is omitted`
    }
}

class Step4 extends React.Component<WithTranslation, { stepActive: number; language: string }> {
    constructor(props: WithTranslation) {
        super(props);
        // 从 localStorage 读取语言，默认为 'zh'
        const savedLanguage = localStorage.getItem('app_language') || 'zh';
        this.state = {
            stepActive: 1,
            language: savedLanguage,
        };
        

  
    }
    render() {
        const {
            stepActive,
            language = 'zh',
        } = this.state;
        // 从 localStorage 读取当前语言，确保与全局设置同步
        const currentLanguage = localStorage.getItem('app_language') || language || 'zh';
        return (
            <div
                className="build-step-4">
                <div
                    className="build-step-4-bg">
                    <svg width="1556" height="938" viewBox="0 0 1556 938" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="0.5" y="0.5" width="1554" height="934" rx="30.5" fill="#2C3262" fill-opacity="0.3" stroke="url(#paint0_linear_5209_339)"/>
                        <defs>
                            <linearGradient id="paint0_linear_5209_339" x1="-776" y1="469" x2="51.3766" y2="1842.66" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#535D98"/>
                                <stop offset="1" stop-color="#2C3257"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <div
                    className="build-step-4-header">
                    <div
                        className="build-step-4-header-content">
                         <div
                            className="info">
                            <div
                                className="label">
                                {this.props.t('ontology.service.generation.title')}
                            </div>
                            <div
                                className="descr">
                                {this.props.t('ontology.service.generation.description')}
                            </div>
                        </div>
                    </div>
                    <svg className="border-bottom" xmlns="http://www.w3.org/2000/svg" width="1552" height="1" viewBox="0 0 1552 1" fill="none">
                    <path d="M0 0.5H1552" stroke="url(#paint0_linear_0_16532)"/>
                    <defs>
                        <linearGradient id="paint0_linear_0_16532" x1="1552" y1="0.512024" x2="37.3216" y2="0.512024" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#50576E" stop-opacity="0.5"/>
                        <stop offset="0.538528" stop-color="#50576E"/>
                        <stop offset="1" stop-color="#50576E" stop-opacity="0.5"/>
                        </linearGradient>
                    </defs>
                    </svg>
                </div>
                <div
                    className="build-step-4-main">
                    <div
                        className="build-step-4-tab">
                        <div
                            className="tab-list">
                            {[
                                {
                                    key: 1,
                                    label: this.props.t('ontology.service.generation.tab.knowledge'),
                                    icon:  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="18" viewBox="0 0 16 18" fill="none">
                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M12.5854 0.00406901C13.0056 0.0468454 13.3333 0.401936 13.3333 0.833333V11.6667C13.3333 12.1269 12.9602 12.5 12.5 12.5H3.33333C2.53356 12.5 1.86072 13.0692 1.70247 13.8257C1.67957 13.9358 1.66667 14.0497 1.66667 14.1667C1.66667 15.0871 2.41286 15.8333 3.33333 15.8333H14.1667V1.66667C14.1667 1.20643 14.5398 0.833333 15 0.833333C15.4602 0.833333 15.8333 1.20643 15.8333 1.66667V16.6667C15.8333 17.1269 15.4602 17.5 15 17.5H3.33333C1.49238 17.5 0 16.0076 0 14.1667V3.33333C0 1.49238 1.49238 0 3.33333 0H12.5L12.5854 0.00406901ZM3.33333 1.66667C2.41286 1.66667 1.66667 2.41286 1.66667 3.33333V11.2801C1.84692 11.1758 2.03758 11.0875 2.23714 11.0181C2.24629 11.0149 2.25563 11.0122 2.26481 11.0091C2.46132 10.9426 2.66578 10.8932 2.87679 10.8643C2.88545 10.8631 2.89415 10.8621 2.90283 10.861C2.95936 10.8537 3.01636 10.8483 3.07373 10.8439C3.09161 10.8425 3.10949 10.8409 3.12744 10.8398C3.19554 10.8357 3.26419 10.8333 3.33333 10.8333H11.6667V1.66667H3.33333Z" fill="white" fill-opacity="0.5"/>
                                    <path d="M12.0833 13.3333C12.5436 13.3333 12.9167 13.7064 12.9167 14.1667C12.9167 14.6269 12.5436 15 12.0833 15H3.75C3.28976 15 2.91667 14.6269 2.91667 14.1667C2.91667 13.7064 3.28976 13.3333 3.75 13.3333H12.0833Z" fill="white" fill-opacity="0.5"/>
                                  </svg>,
                                    iconActive: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M14.6688 1.25407C15.0889 1.29685 15.4167 1.65194 15.4167 2.08333V12.9167C15.4167 13.3769 15.0436 13.75 14.5833 13.75H5.41668C4.61691 13.75 3.94407 14.3192 3.78582 15.0757C3.76291 15.1858 3.75001 15.2997 3.75001 15.4167C3.75001 16.3371 4.4962 17.0833 5.41668 17.0833H16.25V2.91667C16.25 2.45643 16.6231 2.08333 17.0833 2.08333C17.5436 2.08333 17.9167 2.45643 17.9167 2.91667V17.9167C17.9167 18.3769 17.5436 18.75 17.0833 18.75H5.41668C3.57573 18.75 2.08334 17.2576 2.08334 15.4167V4.58333C2.08334 2.74238 3.57573 1.25 5.41668 1.25H14.5833L14.6688 1.25407ZM5.41668 2.91667C4.4962 2.91667 3.75001 3.66286 3.75001 4.58333V12.5301C3.93027 12.4258 4.12092 12.3375 4.32049 12.2681C4.32963 12.2649 4.33897 12.2622 4.34815 12.2591C4.54466 12.1926 4.74912 12.1432 4.96013 12.1143C4.96879 12.1131 4.97749 12.1121 4.98618 12.111C5.0427 12.1037 5.0997 12.0983 5.15707 12.0939C5.17495 12.0925 5.19283 12.0909 5.21078 12.0898C5.27889 12.0857 5.34753 12.0833 5.41668 12.0833H13.75V2.91667H5.41668Z" fill="url(#paint0_linear_0_16504)"/>
                                    <path d="M14.1667 14.5833C14.6269 14.5833 15 14.9564 15 15.4167C15 15.8769 14.6269 16.25 14.1667 16.25H5.83334C5.37311 16.25 5.00001 15.8769 5.00001 15.4167C5.00001 14.9564 5.37311 14.5833 5.83334 14.5833H14.1667Z" fill="url(#paint1_linear_0_16504)"/>
                                    <defs>
                                      <linearGradient id="paint0_linear_0_16504" x1="0.895844" y1="2.5625" x2="24.9827" y2="13.5878" gradientUnits="userSpaceOnUse">
                                        <stop stop-color="#4598FF"/>
                                        <stop offset="0.419681" stop-color="#983DFF"/>
                                        <stop offset="0.730326" stop-color="#EC7DFF"/>
                                        <stop offset="1" stop-color="#FFB096"/>
                                      </linearGradient>
                                      <linearGradient id="paint1_linear_0_16504" x1="0.895844" y1="2.5625" x2="24.9827" y2="13.5878" gradientUnits="userSpaceOnUse">
                                        <stop stop-color="#4598FF"/>
                                        <stop offset="0.419681" stop-color="#983DFF"/>
                                        <stop offset="0.730326" stop-color="#EC7DFF"/>
                                        <stop offset="1" stop-color="#FFB096"/>
                                      </linearGradient>
                                    </defs>
                                  </svg>,
                                },
                                {
                                    key: 2,
                                    label: this.props.t('ontology.service.generation.tab.mcp'),
                                    icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M7.35037 0.683477C8.0177 0.0163053 9.02152 -0.183502 9.89334 0.177618C10.7648 0.538849 11.3336 1.3895 11.3338 2.33289C11.3338 3.38948 10.6302 4.28087 9.66678 4.56824V6.31434C9.90479 6.35947 10.1412 6.42722 10.3709 6.52234C11.7096 7.07699 12.5826 8.38385 12.5828 9.83289C12.5828 10.2119 12.5229 10.5769 12.4139 10.9198L14.1931 12.1903C14.595 11.863 15.1082 11.6669 15.6668 11.6669C16.9551 11.6672 17.9997 12.7115 17.9998 13.9999C17.9997 15.2883 16.9551 16.3326 15.6668 16.3329C14.3782 16.3329 13.3329 15.2885 13.3328 13.9999C13.3328 13.7531 13.3711 13.5151 13.4422 13.2919L11.7732 12.1005C11.1162 12.9035 10.1182 13.4168 8.99979 13.4169C7.90606 13.4169 6.89377 12.919 6.2244 12.0995L4.55545 13.2909C4.62745 13.5164 4.66677 13.7549 4.66678 13.9999C4.66671 15.2884 3.62128 16.3327 2.3328 16.3329C1.38929 16.3327 0.538679 15.7641 0.177522 14.8925C-0.183411 14.0207 0.0162669 13.0177 0.683382 12.3505C1.35071 11.6832 2.35448 11.4835 3.22635 11.8446C3.4376 11.9322 3.63066 12.049 3.80252 12.1884L5.58475 10.9179C5.18186 9.65036 5.51347 8.25205 6.46561 7.29969C6.98638 6.77894 7.64047 6.44356 8.33377 6.31238V4.56922C7.67155 4.37181 7.11791 3.88618 6.84451 3.22645C6.48336 2.35454 6.68305 1.3508 7.35037 0.683477ZM15.6668 12.9999C15.1145 12.9999 14.6668 13.4476 14.6668 13.9999C14.6669 14.5521 15.1145 14.9999 15.6668 14.9999C16.2187 14.9996 16.6667 14.5519 16.6668 13.9999C16.6667 13.4478 16.2188 13.0002 15.6668 12.9999ZM2.3328 12.9999C1.92851 13 1.56371 13.2435 1.40897 13.6171C1.25424 13.9906 1.33996 14.4209 1.62576 14.7069C1.91172 14.9927 2.34207 15.0784 2.71561 14.9237C3.08913 14.7689 3.33274 14.4042 3.3328 13.9999C3.33278 13.7348 3.22721 13.4804 3.03983 13.2929C2.85238 13.1055 2.5978 13 2.3328 12.9999ZM8.99979 7.58289C7.75731 7.58291 6.75001 8.59046 6.74979 9.83289C6.74986 11.0755 7.75721 12.0829 8.99979 12.0829C10.2422 12.0827 11.2497 11.0754 11.2498 9.83289C11.2496 8.59054 10.2422 7.58304 8.99979 7.58289ZM8.99979 1.33289C8.44781 1.3331 8 1.78092 7.99979 2.33289C7.99979 2.88505 8.44768 3.33268 8.99979 3.33289C9.5519 3.33269 9.99979 2.88505 9.99979 2.33289C9.99968 2.0679 9.89415 1.81328 9.70682 1.62586C9.51941 1.43865 9.26469 1.33299 8.99979 1.33289Z" fill="white" fill-opacity="0.5"/>
                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M4.44904 15.496C4.67332 15.3851 4.94048 15.4094 5.14142 15.5585C7.49396 16.9877 10.447 16.9875 12.7996 15.5585C13.1112 15.3842 13.5056 15.4862 13.6932 15.7899C13.8805 16.0936 13.795 16.4908 13.4998 16.6913C12.1506 17.5371 10.5922 17.9905 8.99982 17.9999C7.38397 18.0009 5.80069 17.5446 4.43341 16.6835C4.21194 16.5667 4.07474 16.3352 4.07794 16.0848C4.08118 15.8345 4.22468 15.6071 4.44904 15.496ZM4.30841 2.23327C4.61669 2.03083 5.03065 2.11653 5.23322 2.42468C5.43568 2.73298 5.35001 3.14694 5.04181 3.34949C2.98832 4.68405 1.74926 6.96781 1.74982 9.41687C1.74972 9.59355 1.67945 9.76263 1.55451 9.88757C1.42956 10.0125 1.26049 10.0828 1.0838 10.0829C0.906992 10.0829 0.737147 10.0126 0.612123 9.88757C0.487276 9.76265 0.416904 9.59348 0.41681 9.41687C0.415206 6.51827 1.87949 3.81512 4.30841 2.23327ZM12.8182 2.06824C13.0355 1.95529 13.2971 1.97071 13.4998 2.10827C16.0445 3.66347 17.5933 6.4346 17.5838 9.41687C17.5837 9.59339 17.5132 9.76266 17.3885 9.88757C17.2635 10.0126 17.0936 10.0829 16.9168 10.0829C16.74 10.0829 16.5702 10.0126 16.4451 9.88757C16.3204 9.76266 16.2499 9.59342 16.2498 9.41687C16.2566 6.89744 14.9487 4.55607 12.7996 3.24109C12.5861 3.12137 12.4551 2.89412 12.4588 2.64929C12.4626 2.40435 12.6008 2.18125 12.8182 2.06824Z" fill="white" fill-opacity="0.5"/>
                                  </svg>,
                                    iconActive: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M7.35048 0.683477C8.01781 0.0163053 9.02163 -0.183502 9.89345 0.177618C10.7649 0.538849 11.3337 1.3895 11.3339 2.33289C11.3339 3.38948 10.6303 4.28087 9.66689 4.56824V6.31336C9.90505 6.35849 10.1411 6.42716 10.371 6.52234C11.7098 7.0769 12.5827 8.3838 12.5829 9.83289C12.5829 10.2119 12.523 10.5769 12.414 10.9198L14.1933 12.1913C14.5952 11.8637 15.1081 11.6669 15.6669 11.6669C16.9553 11.6671 17.9998 12.7115 17.9999 13.9999C17.9999 15.2884 16.9554 16.3327 15.6669 16.3329C14.3782 16.3329 13.3329 15.2885 13.3329 13.9999C13.3329 13.753 13.3712 13.5152 13.4423 13.2919L11.7733 12.1005C11.1163 12.9036 10.1184 13.4169 8.9999 13.4169C7.90605 13.4169 6.89388 12.9192 6.22451 12.0995L4.55556 13.2909C4.62763 13.5164 4.66683 13.7549 4.66689 13.9999C4.66689 15.2885 3.62153 16.3338 2.33291 16.3339C1.3894 16.3337 0.538792 15.7651 0.177633 14.8934C-0.183458 14.0216 0.0161945 13.0178 0.683492 12.3505C1.35082 11.6832 2.35461 11.4835 3.22646 11.8446C3.43815 11.9323 3.63147 12.0496 3.80361 12.1893L5.58486 10.9179C5.18214 9.65044 5.51366 8.25197 6.46572 7.29969C6.9864 6.77905 7.64072 6.44457 8.33388 6.31336V4.56922C7.67166 4.37181 7.11802 3.88618 6.84462 3.22645C6.48347 2.35454 6.68316 1.3508 7.35048 0.683477ZM15.6669 12.9999C15.1147 12.9999 14.667 13.4477 14.6669 13.9999C14.6669 14.5522 15.1146 14.9999 15.6669 14.9999C16.219 14.9997 16.6669 14.552 16.6669 13.9999C16.6668 13.4478 16.2189 13.0001 15.6669 12.9999ZM2.33291 12.9999C1.92868 13 1.56386 13.2436 1.40908 13.6171C1.25435 13.9906 1.3401 14.4209 1.62587 14.7069C1.91183 14.9929 2.34209 15.0784 2.71572 14.9237C3.08933 14.7689 3.33291 14.4043 3.33291 13.9999C3.33284 13.7348 3.22742 13.4803 3.03994 13.2929C2.85244 13.1055 2.59797 12.9999 2.33291 12.9999ZM8.9999 7.58289C7.75732 7.58289 6.74998 8.59033 6.7499 9.83289C6.7499 11.0755 7.75727 12.0829 8.9999 12.0829C10.2425 12.0829 11.2499 11.0755 11.2499 9.83289C11.2498 8.59035 10.2424 7.58293 8.9999 7.58289ZM8.9999 1.33289C8.44784 1.33315 8.00088 1.78078 8.00087 2.33289C8.00088 2.88501 8.44784 3.33263 8.9999 3.33289C9.55201 3.33269 9.9999 2.88505 9.9999 2.33289C9.9999 2.06788 9.89517 1.81335 9.70791 1.62586C9.52046 1.43841 9.26498 1.33299 8.9999 1.33289Z" fill="url(#paint0_linear_0_46942)"/>
                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M4.44898 15.496C4.67326 15.3851 4.94042 15.4094 5.14136 15.5585C7.4939 16.9877 10.4469 16.9875 12.7996 15.5585C13.1111 15.3842 13.5055 15.4862 13.6931 15.7899C13.8804 16.0936 13.7949 16.4908 13.4998 16.6913C12.1505 17.5371 10.5922 17.9905 8.99976 17.9999C7.38391 18.0009 5.80062 17.5446 4.43335 16.6835C4.21188 16.5667 4.07468 16.3352 4.07788 16.0848C4.08112 15.8345 4.22462 15.6071 4.44898 15.496ZM4.30835 2.23327C4.6167 2.03087 5.03068 2.11734 5.23316 2.42566C5.43553 2.734 5.35006 3.14799 5.04175 3.35046C2.98832 4.68503 1.74921 6.96785 1.74976 9.41687C1.74976 9.59368 1.67947 9.76352 1.55444 9.88855C1.42953 10.0133 1.26029 10.0838 1.08374 10.0839C0.906998 10.0839 0.737072 10.0135 0.612062 9.88855C0.487038 9.76352 0.416749 9.59368 0.416749 9.41687C0.41516 6.51826 1.87941 3.8151 4.30835 2.23327ZM12.8181 2.06824C13.0355 1.95529 13.2971 1.97071 13.4998 2.10827C16.0444 3.66347 17.5932 6.4346 17.5837 9.41687C17.5836 9.59339 17.5132 9.76266 17.3884 9.88757C17.2634 10.0126 17.0935 10.0829 16.9167 10.0829C16.7399 10.0829 16.5701 10.0126 16.4451 9.88757C16.3203 9.76266 16.2499 9.59342 16.2498 9.41687C16.2565 6.89744 14.9486 4.55607 12.7996 3.24109C12.586 3.12137 12.455 2.89412 12.4587 2.64929C12.4626 2.40435 12.6008 2.18125 12.8181 2.06824Z" fill="url(#paint1_linear_0_46942)"/>
                                    <defs>
                                      <linearGradient id="paint0_linear_0_46942" x1="-1.34999" y1="1.22504" x2="23.9166" y2="15.3116" gradientUnits="userSpaceOnUse">
                                        <stop stop-color="#4598FF"/>
                                        <stop offset="0.419681" stop-color="#983DFF"/>
                                        <stop offset="0.730326" stop-color="#EC7DFF"/>
                                        <stop offset="1" stop-color="#FFB096"/>
                                      </linearGradient>
                                      <linearGradient id="paint1_linear_0_46942" x1="-0.87078" y1="3.19367" x2="23.5325" y2="16.4346" gradientUnits="userSpaceOnUse">
                                        <stop stop-color="#4598FF"/>
                                        <stop offset="0.419681" stop-color="#983DFF"/>
                                        <stop offset="0.730326" stop-color="#EC7DFF"/>
                                        <stop offset="1" stop-color="#FFB096"/>
                                      </linearGradient>
                                    </defs>
                                  </svg>,
                                }
                            ].map((tab, index) => {
                                return (
                                    <div
                                        className={`tab-item ${stepActive === tab.key ? 'active' : ''}`}
                                        onClick={() => {
                                            this.setState({
                                                stepActive: tab.key
                                            })
                                        }}>
                                        <div
                                            className="tab-item-content">
                                            {stepActive === tab.key ? tab.iconActive : tab.icon}
                                            <div
                                                className={ `text ${stepActive === tab.key?'active':''}`}>
                                                {tab.label}
                                            </div>
                                        </div>
                                        {tab.key === stepActive && <div className="tab-line"/>}
                                        
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    <svg className="border-bottom" xmlns="http://www.w3.org/2000/svg" width="1552" height="1" viewBox="0 0 1552 1" fill="none">
                            <path d="M0 0.5H1552" stroke="url(#paint0_linear_0_16532)"/>
                            <defs>
                                <linearGradient id="paint0_linear_0_16532" x1="1552" y1="0.512024" x2="37.3216" y2="0.512024" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#50576E" stop-opacity="0.5"/>
                                <stop offset="0.538528" stop-color="#50576E"/>
                                <stop offset="1" stop-color="#50576E" stop-opacity="0.5"/>
                                </linearGradient>
                            </defs>
                        </svg>
                    <div
                        className="build-step-4-content">
                        {stepActive === 1 && (
                            <div className="tab-ontology-knowledge">
                                <div className="title-content">
                                     {knowledge[currentLanguage]?.title || knowledge['zh'].title}
                                </div>
                                <div className="tab-ontology-knowledge-content">
                                    {renderMarkdownText(knowledge[currentLanguage]?.text || knowledge['zh'].text)}
                                </div>
                            </div>
                        )}
                        {stepActive === 2 && (
                            <div className="tab-mcp-server">
                                <div className="title-content">
                                    {mcpServer[currentLanguage]?.title || mcpServer['zh'].title}
                                </div>
                                <div className="tab-mcp-server-content">
                                    {(mcpServer[currentLanguage]?.tools || mcpServer['zh'].tools).map((tool, index) => (
                                        <div key={index} className="mcp-tool-card">
                                            <div className="tool-name-bg">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="1506" height="51" viewBox="0 0 1506 51" fill="none">
                                                <path d="M0 10.0241C0 4.48796 4.48796 0 10.0241 0H1495.98C1501.51 0 1506 4.48796 1506 10.0241V51H0V10.0241Z" fill="url(#paint0_radial_0_46891)" fill-opacity="0.2"/>
                                                <defs>
                                                    <radialGradient id="paint0_radial_0_46891" cx="0" cy="0" r="1" gradientTransform="matrix(1406.65 107.49 -2761.12 416.961 8.287e-05 -7.08335)" gradientUnits="userSpaceOnUse">
                                                    <stop stop-color="#1B3EF8"/>
                                                    <stop offset="0.748952" stop-color="#983DFF"/>
                                                    <stop offset="1" stop-color="#EC7DFF"/>
                                                    </radialGradient>
                                                </defs>
                                            </svg>
                                            </div>
                                            <div className="tool-header">
                                                <div className="tool-name">{tool.name}</div>
                                                <div className="tool-description">{tool.description}</div>
                                            </div>
                                            <div className="tool-body">
                                                <div className="tool-params">
                                                    <div className="params-title">{mcpServer[currentLanguage]?.paramsTitle || mcpServer['zh'].paramsTitle}</div>
                                                    <div className="params-content">
                                                    {tool.params.map((param, paramIndex) => (
                                                        <div key={paramIndex} className="param-item">
                                                         -{param}
                                                        </div>
                                                    ))}
                                                    </div>
                                                    
                                                </div>
                                                <div className="tool-example">
                                                    <div className="example-title">{mcpServer[currentLanguage]?.exampleTitle || mcpServer['zh'].exampleTitle}</div>
                                                    <div className="example-json">
                                                        <pre>json</pre>
                                                        <pre>{tool.example}</pre>
                                                        <pre></pre>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>  
           
        )
    }
}

export default withTranslation()(Step4);