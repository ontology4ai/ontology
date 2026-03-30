import axios from 'modo-plugin-common/src/core/src/http';

export const searchApi = params => {
  return axios.get(`/_api/ontology/api/search`, { params });
};

export const saveApi = data => {
  return axios.post(`/_api/ontology/api/save`, data);
};

export const updateApi = data => {
  return axios.post(`/_api/ontology/api/update`, data);
};

export const deleteApi = data => {
  return axios.post(`/_api/ontology/api/delete`, data);
};

export const testApi = data => {
  return axios.post(`/_api/ontology/api/test`, data);
};

export const validApiName = params => {
  return axios.get(`/_api/ontology/api/valid_name`, { params });
};

export const searchApiFunction = params => {
  return axios.get(`/_api/ontology/api_function/search`, { params });
};
