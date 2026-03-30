import axios from 'modo-plugin-common/src/core/src/http';

const base = '';

export const centerSearch = params => {
  return axios.get(`${base}/_api/ontology/center/search`, { params });
};

export const centerSave = data => {
  return axios.post(`${base}/_api/ontology/center/save`, data);
};

export const centerUpdate = data => {
  return axios.post(`${base}/_api/ontology/center/update`, data);
};

export const centerDelete = data => {
  return axios.post(`${base}/_api/ontology/center/delete`, data);
};

export const centerTypeExplorePage = data => {
  return axios.post(`${base}/_api/ontology/center/type/explorePage`, data);
};

export const centerTypeExplorDetail = (params: { objectTypeId: string }) => {
  return axios.get(`${base}/_api/ontology/center/type/exploreDetail`, { params });
};
