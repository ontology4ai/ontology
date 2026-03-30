import axios from 'axios';

export const objectTypeDetail = params => {
  return axios.get(`/ontology_show/_api/object/type/detail`, { params });
};

export const objectTypeSave = data => {
  return axios.post(`/ontology_show/_api/object/type/save`, data);
};

export const objectTypeUpdate = data => {
  return axios.post(`/ontology_show/_api/object/type/update`, data);
};

export const objectTypeDelete = params => {
  return axios.get(`/ontology_show/_api/object/type/delete`, { params });
};

export const objectTypeTableList = params => {
  return axios.get(`/ontology_show/_api/object/type/table/list`, { params });
};

export const objectTypeTableColumn = params => {
  return axios.get(`/ontology_show/_api/object/type/table/column`, { params });
};

export const objectTypeList = params => {
  return axios.get(`/ontology_show/_api/object/type/list`, { params });
};
