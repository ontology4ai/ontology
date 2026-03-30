import axios from 'modo-plugin-common/src/core/src/http';

const base = '';
export const recommend = (params: any) => {
  return axios.get(`${base}/_api/ontology/recommend`, { params });
};

export const listChanged = (params: any) => {
  return axios.get(`${base}/_api/ontology/listChanged`, { params });
};
