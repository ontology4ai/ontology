import axios from 'modo-plugin-common/src/core/src/http';

const base = '';

export const getData = (params: any) => {
  return axios.get(`${base}/_api/ontology/link/type/list`, { params });
};

export const deleteLink = (params: any) => {
  return axios.post(`${base}/_api/ontology/link/type/delete`, params);
};

export const updateStatus = (params: any) => {
  return axios.post(`${base}/_api/ontology/link/type/changeStatus`, params);
};
