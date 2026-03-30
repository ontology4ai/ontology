import axios from 'modo-plugin-common/src/core/src/http';

const base = '';

export const getData = params => {
  return axios.get(`${base}/_api/shared/attribute/list`, { params });
};

export const addAttrData = params => {
  return axios.post(`${base}/_api/shared/attribute/save`, params);
};

export const deleteAttr = params => {
  return axios.post(`${base}/_api/shared/attribute/delete`, params);
};
export const updateAttr = (id, params) => {
  return axios.post(`${base}/_api/shared/attribute/update/${id}`, params);
};
