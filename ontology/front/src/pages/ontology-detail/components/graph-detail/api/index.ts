import axios from 'modo-plugin-common/src/core/src/http';

const base = '';


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






