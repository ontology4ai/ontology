import axios from 'modo-plugin-common/src/core/src/http';

const base = '';
export const getActionList = (params: any) => {
  return axios.get(`${base}/_api/ontology/action/type/list`, { params });
};
export const syncAction = (params: any) => {
  return axios.get(`${base}/_api/ontology/action/type/sync`, { params });
};

export const updateAction = (id: string, params: any) => {
  return axios.post(`${base}/_api/ontology/action/type/update/${id}`, params);
};
export const deleteAction = (params: Array<string>) => {
  return axios.post(`${base}/_api/ontology/action/type/delete`, params);
};
export const actionExists = (params: any) => {
  return axios.get(`${base}/_api/ontology/action/type/checkExists`, { params });
};

export const changeStatus = (params: { ids: Array<string>; status: number }) => {
  return axios.post(`${base}/_api/ontology/action/type/changeStatus`, params);
};
export const getFileList = (params: any) => {
  return axios.get(`${base}/_api/ontology/action/type/file/list`, { params });
};
