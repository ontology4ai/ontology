import axios from 'modo-plugin-common/src/core/src/http';

const base = '';
export const getAllSession = (params?: any) => {
    return axios.post(`${base}/_api/v1/dify/conversations`,  params );
};
export const getSessionHistory = (params: any) => {
    return axios.post(`${base}/_api/v1/dify/messages`, params);
};

export const stopChat = (params: any) => {
    return axios.post(`${base}/_api/v1/dify/chat/stop`, params);
};
export const deleteChat = (params: any) => {
    return axios.post(`${base}/_api/v1/dify/conversation/delete`, params);
};
export const deleteTask = (params: any) => {
    return axios.post(`${base}/_api/v1/task/deleteHisTask`, params);
};
export const getGraph = ( params: any) => {
    return axios.get(`${base}/_api/v1/dify/getGraph`, {params});
};

export const getOntologyData = (id) => {
    return axios.get(`${base}/_api/ontology/findOne?ontologyId=${id}`)
};

export const ontologyPromptBasic = params => {
    return axios.get(`${base}/_api/ontology/prompt/basic`, { params });
};
export const saveGraph = params => {
    return axios.post(`${base}/_api/v1/dify/saveGraph`, params );
};


export const getAllTaskSession = (params?: any) => {
    return axios.post(`${base}/_api/v1/task/exploreHisTask`,  params );
};
export const getTestCaseList = (params: any) => {
    return axios.post(`${base}/_api/v1/case/explorePage`, params);
};
export const addTestCase = (params: any) => {
    return axios.post(`${base}/_api/v1/case/save`, params);
};

export const editTestCase = (params: any) => {
    return axios.post(`${base}/_api/v1/case/edit`, params);
};
export const deleteTestCase = (params: any) => {
    return axios.post(`${base}/_api/v1/case/delete`, params);
};

/** 批量导入测试用例（上传 CSV 文件，后端解析） */
export const batchImportTestCase = (formData: FormData) => {
    return axios.post(`${base}/_api/v1/case/importFile`, formData);
};

export const downloadTemple = () => {
    return axios.get(`${base}/_api/v1/case/downTemplate`);
};


export const taskStatus = (params: any) => {
    return axios.post(`${base}/_api/v1/task/status`, params);
};

export const startTestCaseTask = (params: any) => {
    return axios.post(`${base}/_api/v1/task/start`, params);
};
// 分页查询批量测试任务
export const batchTestCaseList = (params: any) => {
    return axios.post(`${base}/_api/v1/task/exploreBatchTask`, params);
};

//重新测试
export const reStartTestCaseTask = (params:any)=>{
    return axios.post(`${base}/_api/v1/task/restart`, params);
}
//获取本体测试对比分析结果
export const compareResult = (params:any)=>{
    return axios.post(`${base}/_api/v1/task/compareResult`, params);
}
//获取本体的所有图谱节点
export const getOntologyAllGraph = (params:any)=>{
    return axios.get(`${base}/_api/ontology/getGraph`, {params});
}
//停止本体批量测试

export const stopTestCaseTask = (params:any)=>{
    return axios.post(`${base}/_api/v1/task/stop`, params);
}
//获取提示词列表
export const getPromptList = (params:any)=>{
    return axios.post(`${base}/_api/v1/prompt/explorePage`, params);
}
//获取提示词详情
export const getPromptDetail = (params:any)=>{
    return axios.post(`${base}/_api/v1/prompt/detail`, params);
}
//更新提示词
export const updatePrompt = (params:any)=>{
    return axios.post(`${base}/_api/v1/prompt/edit`, params);
}
//获取提示词RDF
export const getPromptRdf = (params:any)=>{
    return axios.get(`${base}/_api/ontology/prompt/rdf`, {params});
}
//保存本体模式设置
export const saveOntologyModeSetting = (params:any)=>{
    return axios.post(`${base}/_api/v1/prompt/config/save`, params);
}
//获取本体模式设置
export const getOntologyModeSettingData = (params:any)=>{
    return axios.post(`${base}/_api/v1/prompt/config/detail`, params);
}
 