import axios from 'modo-plugin-common/src/core/src/http';

const base = '';

export const getOntologyList = (params ) => {
    return axios.get(`${base}/_api/ontology/findAll`, { params });
};

export const updateOntologyFavorite = (params ) => {
    return axios.post(`${base}/_api/ontology/favorite?ontologyId=${params.ontologyId}&isFavorite=${params.isFavorite}`,  params );
};

export const getOntologyApiData = (params ) => {
    return axios.get(`${base}/_api/publishApi/list`, { params });
};

export const getMcpServer = () => {
    return axios.get(`${base}/_api/ontology/config/findKey?key=mcp_info`);
};
export const getMcpServerTool = () => {
    return axios.get(`${base}/_api/ontology/config/findKey?key=mcp_tool`);
};
export const getServerTool = (key) => {
    return axios.get(`${base}/_api/ontology/config/findKey?key=${key}`);
};

export const getToken = () => {
    return axios.get(`${base}/_api/token`);
};








