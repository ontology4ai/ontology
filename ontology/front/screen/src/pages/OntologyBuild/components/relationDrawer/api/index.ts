import axios from 'axios';

export const linkTypeDetail = params => {
  return axios.get(`/ontology_show/_api/link/type/detail`, { params });
};

export const linkTypeSave = data => {
  return axios.post(`/ontology_show/_api/link/type/save`, data);
};
