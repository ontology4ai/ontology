import axios from 'modo-plugin-common/src/core/src/http';

const base='';

export const getData = (id) => {
  return axios.get(`${base}/_api/ontology/interface/overview?interfaceId=${id}`)
};

export const updateData = (id, data) => {
  return axios.post(`${base}/_api/ontology/interface/update`, data)
};
export const removeObjData = (id, data) => {
  return axios.post(`${base}/_api/ontology/interface/removeObj/${id}`, data)
};
export const updateStatus = (id, data) => {
  return axios.post(`${base}/_api/ontology/interface/updateStatus`, data)
};


export const checkObjectTypeExist = (params)=>{
  return axios.get(`${base}/_api/ontology/object/type/checkExists`,{params})
};
