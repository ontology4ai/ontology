import axios from 'modo-plugin-common/src/core/src/http';

const base = '';

export const getData = id => {
  return axios.get(`${base}/_api/ontology/interface/overview?interfaceId=${id}`);
};

export const exploreConstraintPage = params => {
  return axios.post(`${base}/_api/ontology/interface/constraint/explorePage`, params);
};

export const createConstraint = params => {
  return axios.post(`${base}/_api/ontology/interface/constraint/create`, params);
};

export const updateConstraint = params => {
  return axios.post(`${base}/_api/ontology/interface/constraint/update`, params);
};

export const deleteConstraint = params => {
  return axios.post(`${base}/_api/ontology/interface/constraint/delete`, params);
};

export const overviewConstraint = params => {
  return axios.get(`${base}/_api/ontology/interface/constraint/overview`, { params });
};

export const constraintAffected = params => {
  return axios.post(`${base}/_api/ontology/interface/constraint/affected`, params);
};
