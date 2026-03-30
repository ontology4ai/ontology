import axios from 'modo-plugin-common/src/core/src/http';

const base='';

export const getData = (id) => {
  return axios.get(`${base}/_api/ontology/interface/overview?interfaceId=${id}`)
};

export const updateData = (id, data) => {
  return axios.post(`${base}/_api/ontology/object/type/update/${id}`, data)
};

export const getTableInfo = (params) => {
  return axios.get(`${base}/_api/datasource/table/infos`, { params })
};

export const updateAttr = (id, data) => {
  return axios.post(`${base}/_api/ontology/interface/update/`, data)
};
