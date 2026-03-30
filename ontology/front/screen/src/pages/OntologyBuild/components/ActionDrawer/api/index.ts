import axios from 'axios';

export const actionTypeDetail = params => {
  return axios.get(`/ontology_show/_api/action/type/detail`, { params });
};

export const actionTypeSave = data => {
  return axios.post(`/ontology_show/_api/action/type/save`, data);
};

export const actionTypeUpdate = data => {
  return axios.post(`/ontology_show/_api/action/type/update`, data);
};
