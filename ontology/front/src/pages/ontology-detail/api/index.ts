import axios from 'modo-plugin-common/src/core/src/http';

const base='';

export const getData = (id) => {
  return axios.get(`${base}/_api/ontology/view/${id}`)
};

export const updateData = (id, data) => {
  return axios.post(`${base}/_api/ontology/update/${id}`, data)
};



export const getOntologyGraphData = (params ) => {
  return axios.get(`${base}/_api/ontology/getGraph`, { params });
};

export const getOntologyOverview = (params ) => {
  return axios.get(`${base}/_api/ontology/graphOverview`, { params });
};


export const getObjectData = (params ) => {
  return axios.get(`${base}/_api/ontology/object/type/graphObjectType`, { params });
};

export const getObjectExpandData = (params ) => {
  return axios.get(`${base}/_api/ontology/expandGraphNode`, { params });
};
