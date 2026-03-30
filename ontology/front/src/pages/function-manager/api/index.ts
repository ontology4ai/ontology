import axios from 'modo-plugin-common/src/core/src/http';

const base = '';

// 逻辑类型新增界面文件选择下拉框数据
export const getFileList = (params: any) => {
  return axios.get(`${base}/_api/ontology/logic/type/file/list`, { params });
};

// 分页查询逻辑类型列表
export const logicList = (params: any) => {
  return axios.get(`${base}/_api/ontology/logic/type/list`, { params });
};

// 查询逻辑类型名称是否存在
export const logicExist = (params: any) => {
  return axios.get(`${base}/_api/ontology/logic/type/checkExists`, { params });
};

// 新增逻辑类型
export const saveLogic = (params: any) => {
  return axios.post(`${base}/_api/ontology/logic/type/save`, params);
};

// 修改逻辑类型
export const updateLogic = (id: string, params: any) => {
  return axios.post(`${base}/_api/ontology/logic/type/update/${id}`, params);
};

// 修改逻辑类型状态
export const changeStatus = (params: any) => {
  return axios.post(`${base}/_api/ontology/logic/type/changeStatus`, params);
};

// 删除逻辑类型
export const deleteLogic = (params: any) => {
  return axios.post(`${base}/_api/ontology/logic/type/delete`, params);
};

// 查询逻辑类型详情
export const logicDetail = (id: string) => {
  return axios.get(`${base}/_api/ontology/logic/type/get/${id}`);
};

// 查询逻辑类型详情
export const getLogicDetailByName = (params:any) => {
  return axios.get(`${base}/_api/ontology/logic/type/getByName`,{params});
};

// 同步函数
export const syncFunction = (params: any) => {
  return axios.get(`${base}/_api/ontology/logic/type/sync`, { params });
};

