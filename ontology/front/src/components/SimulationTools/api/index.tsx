import axios from 'modo-plugin-common/src/core/src/http';

const base = '';

export const findAvaliableObjects = (id: string) => {
  return axios.get(`${base}/_api/ontology/simu/scene/findAvaliableObjects/${id}`);
};

export const getObjDetail = (id: any) => {
  return axios.get(`${base}/_api/ontology/object/type/get/${id}`);
};

export const getActionDetail = (id: any) => {
  return axios.get(`${base}/_api/ontology/action/type/get/${id}`);
};

export const getLogicDetail = (params: any) => {
  return axios.get(`${base}/_api/ontology/logic/type/get/${params}`);
};
export const getObjectExploreSummary = (params: any) => {
  return axios.get(`${base}/_api/ontology/object/type/explore/summary`, { params });
};
