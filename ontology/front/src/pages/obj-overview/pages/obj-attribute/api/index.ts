import axios from 'modo-plugin-common/src/core/src/http';

const base = '';

export const getData = (id) => {
  return axios.get(`${base}/_api/ontology/object/type/get/${id}`);
};
export const changeStatus = (params: { ids: Array<string>; status: number }) => {
  return axios.post(`${base}/_api/ontology/object/type/attr/changeStatus`, params);
};
export const deleteAttr = (params: Array<string>) => {
  return axios.post(`${base}/_api/ontology/object/type/attr/delete`, params);
};
