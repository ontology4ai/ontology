import axios from 'modo-plugin-common/src/core/src/http';
import qs from 'qs';


const getData = (sceneId, cancelToken) => {
    return axios.get(`/_api/ontology/simu/scene/find/${sceneId}`, { cancelToken })
}

const updateData = (id, data) => {
    return axios.post(`/_api/ontology/simu/scene/update/${id}`, data)
}

const checkSceneLabel = (params, args) => {
    return axios.get(`/_api/ontology/simu/scene/isLabelExists`, { params, ...args })
}

const getOntologyGraph = (ontologyId, cancelToken) => {
    return axios.get(`/_api/ontology/simu/scene/findAvaliableObjects/${ontologyId}`,  { cancelToken })
}

const getCanvas = (id, cancelToken) => {
    return axios.get(`/_api/ontology/simu/canvas/find/${id}`,  { cancelToken })
}

const createCanvas = (data) => {
    return axios.post(`/_api/ontology/simu/canvas/save`, data)
}

const updateCanvas = (id, data) => {
    return axios.post(`/_api/ontology/simu/canvas/update/${id}`, data)
}

const sceneIsLabelExists = (params: Params) => {
  return axios.get('/_api/ontology/simu/scene/isLabelExists', { params });
};

const sceneIsNameExists = (params: Params) => {
  return axios.get('/_api/ontology/simu/scene/isNameExists', { params });
};

const ontologyFindAll = (params: Params) => {
  return axios.get('/_api/ontology/findAll', { params });
};

export {
    getData,
    updateData,
    checkSceneLabel,
    getOntologyGraph,
    getCanvas,
    createCanvas,
    updateCanvas,
    sceneIsLabelExists,
    sceneIsNameExists,
    ontologyFindAll
};
