import axios from 'modo-plugin-common/src/core/src/http';

interface Params {
  [key: string]: any;
}

export const promptExplorePage = (params: Params) => {
  return axios.post('/_api/v1/prompt/explorePage', params);
};

export const promptDetail = (params: Params) => {
  return axios.post('/_api/v1/prompt/detail', params);
};

export const promptSave = (params: Params) => {
  return axios.post('/_api/v1/prompt/save', params);
};

export const promptEdit = (params: Params) => {
  return axios.post('/_api/v1/prompt/edit', params);
};

export const promptDelete = (params: Params) => {
  return axios.post('/_api/v1/prompt/delete', params);
};

export const promptRdf = (params: Params) => {
  return axios.get(`/_api/ontology/prompt/rdf?id=${params.id}`, params);
};
