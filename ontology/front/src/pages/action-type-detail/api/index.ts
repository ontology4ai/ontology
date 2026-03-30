import axios from 'modo-plugin-common/src/core/src/http';

const base = '';
export const getActionDetail = (id: string) => {
  return axios.get(`${base}/_api/ontology/action/type/get/${id}`);
};

export const updateAction = (id: string, param: any) => {
  return axios.post(`${base}/_api/ontology/action/type/update/${id}`, param);
};
