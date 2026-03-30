import axios from 'modo-plugin-common/src/core/src/http';

const base='';

export const getData = (id) => {
  return axios.get(`${base}/_api/ontology/object/type/get/${id}`)
};

export const updateData = (id, data) => {
  return axios.post(`${base}/_api/ontology/object/type/update/${id}`, data)
}


export const checkObjectTypeExist = (params)=>{
  return axios.get(`${base}/_api/ontology/object/type/checkExists`,{params})
}
