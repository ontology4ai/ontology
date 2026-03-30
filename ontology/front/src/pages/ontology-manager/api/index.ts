import axios from 'modo-plugin-common/src/core/src/http';

const base = '';

export const getData = params => {
  return axios.get(`${base}/_api/ontology/list`, { params });
};

export const getOntologyData = id => {
  return axios.get(`${base}/_api/ontology/view/${id}`);
};

export const createOntology = data => {
  return axios.post(`${base}/_api/ontology/save`, data);
};

export const deleteOntology = ids => {
  return axios.post(`${base}/_api/ontology/delete/`, ids);
};

export const updateOntology = (id, data) => {
  return axios.post(`${base}/_api/ontology/update/${id}`, data);
};

export const checkExistOntology = params => {
  return axios.get(`${base}/_api/ontology/checkExists`, { params });
};

export const publishOntology = data => {
  return axios.post(`${base}/_api/ontology/publish`, data);
};
export const exportOntology = params => {
  return axios.post(`${base}/_api/ontology/exportFile`, params);
};

export const downloadTemple = params => {
  return axios.get(`${base}/_api/ontology/downTemplate`, { params });
};

export const importFile = param => {
  return axios.post(`${base}/_api/ontology/importFile`, param);
};

export const centerSyncObjectTypes = data => {
  return axios.post(`${base}/_api/ontology/center/syncObjectTypes`, data);
};

export const ontologyPrompt = params => {
  return axios.get(`${base}/_api/ontology/prompt`, { params });
};
export const ontologyPromptBasic = params => {
  return axios.get(`${base}/_api/ontology/prompt/basic`, { params });
};

export const migrateOut = params => {
  return axios.get(`${base}/_api/ontology/migrateOut`, { params });
};

export const migrateIn = data => {
  return axios.post(`${base}/_api/ontology/migrateIn`, data);
};

export const processStart = data => {
  return axios.post(`${base}/_api/ontology/action/process/start`, data);
};

export const processStatus = taskId => {
  return axios.post(`${base}/_api/ontology/action/process/query`, taskId, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
};

export const ontologyUploadFile = data => {
  return axios.post(`${base}/_api/ontology/uploadFile`, data);
};
