import axios from 'modo-plugin-common/src/core/src/http';

const base = '';

export const getOntologyList = (params: any) => {
  return axios.get(`${base}/_api/ontology/list`, { params });
};

export const getCodeList = (params: any) => {
  return axios.get(`${base}/_api/ontology/code/repo/list`, { params });
};

export const saveCodeRepo = (params: any) => {
  return axios.post(`${base}/_api/ontology/code/repo/save`, params);
};
