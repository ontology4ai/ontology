import axios from 'modo-plugin-common/src/core/src/http';

const base = '';

export const getData = params => {
  return axios.post(`${base}/_api/ontology/interface/explorePage`, params);
};

export const deleteInterface = params => {
  return axios.post(`${base}/_api/ontology/interface/delete`, params);
};

export const updateInterface = params => {
  return axios.post(`${base}/_api/ontology/interface/update`, params);
};
export const updateStatus = params => {
  return axios.post(`${base}/_api/ontology/interface/updateStatus`, params);
};
export const createInterface = params => {
  return axios.post(`${base}/_api/ontology/interface/create`, params);
};

export const importFile = params => {
  return axios.post(`${base}/_api/ontology/interface/attribute/importFile`, params);
};

export const downloadTemple = () => {
  return axios.get(`${base}/_api/ontology/interface/attribute/downTemplate`);
};

export const checkExists = params => {
  return axios.post(`${base}/_api/ontology/interface/checkExists`, params);
};
