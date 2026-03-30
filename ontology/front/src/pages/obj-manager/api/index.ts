import axios from 'modo-plugin-common/src/core/src/http';

const base='';

export const getData = (params) => {
  return axios.get(`${base}/_api/ontology/object/type/list`, { params })
};

export const deleteObj = (params) => {
  return axios.post(`${base}/_api/ontology/object/type/delete`,  params)
};

export const updateObj = (id,params) => {
  return axios.post(`${base}/_api/ontology/object/type/update/${id}`,  params)
};
export const updateObjStatus = (params) => {
  return axios.post(`${base}/_api/ontology/object/type/changeStatus`,  params)
};
