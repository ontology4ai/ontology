import axios from 'modo-plugin-common/src/core/src/http';

interface Params {
  [key: string]: any;
}

export const processSearch = (params: Params) => {
  return axios.get('/_api/ontology/action/process/search', { params });
};

export const processDelete = (params: Params) => {
  return axios.post('/_api/ontology/action/process/delete', { params });
};

export const processDetail = (params: Params) => {
  return axios.get('/_api/ontology/action/process/detail', { params });
};
