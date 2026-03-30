import axios from 'axios';

export const logicTypeDetail = params => {
  return axios.get(`/ontology_show/_api/logic/type/detail`, { params });
};

export const logicCreate = data => {
  return axios.post(`/ontology_show/_api/logic/type/save`, data);
};

export const logicUpdate = data => {
  return axios.post(`/ontology_show/_api/logic/type/update`, data);
};
