import axios from 'modo-plugin-common/src/core/src/http';

const base = '';

export const getOntologyList = (params ) => {
    return axios.get(`${base}/_api/ontology/findAll`, { params });
};
export const getOntologyById = (params ) => {
    return axios.get(`${base}/_api/ontology/findOne`, { params });
};

export const updateOntologyFavorite = (params ) => {
    return axios.post(`${base}/_api/ontology/favorite?ontologyId=${params.ontologyId}&isFavorite=${params.isFavorite}`,  params );
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

export const getObjectInfo = (id ) => {
    return axios.get(`${base}/_api/ontology/object/type/get/${id}`);
};

export const getObjectExpandData = (params ) => {
    return axios.get(`${base}/_api/ontology/expandGraphNode`, { params });
};

export const getActionData = (id) =>{
    return axios.get(`${base}/_api/ontology/action/type/get/${id}`);
};

export const getLogicData = (id) =>{
    return axios.get(`${base}/_api/ontology/logic/type/get/${id}`);
};
export const getInterfaceData = (id) =>{
    return axios.get(`${base}/_api/ontology/interface/overview?interfaceId=${id}`);
};






