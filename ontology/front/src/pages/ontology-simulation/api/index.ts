import axios from 'modo-plugin-common/src/core/src/http';

interface Params {
  [key: string]: any;
}

export const sceneSearch = (params: Params) => {
  return axios.get('/_api/ontology/simu/scene/search', { params });
};

export const sceneList = (params: Params) => {
  return axios.get('/_api/ontology/simu/scene/list', { params });
};

export const ontologyFindAll = (params: Params) => {
  return axios.get('/_api/ontology/findAll', { params });
};

export const sceneSave = (params: Params) => {
  return axios.post('/_api/ontology/simu/scene/save', params);
};

export const sceneDelete = (params: Params) => {
  return axios.post('/_api/ontology/simu/scene/delete', params);
};

export const sceneIsLabelExists = (params: Params) => {
  return axios.get('/_api/ontology/simu/scene/isLabelExists', { params });
};

export const sceneIsNameExists = (params: Params) => {
  return axios.get('/_api/ontology/simu/scene/isNameExists', { params });
};
