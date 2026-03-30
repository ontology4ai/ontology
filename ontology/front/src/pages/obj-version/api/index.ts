import axios from 'modo-plugin-common/src/core/src/http';

const base = '';

export const getVersionList = (params: any) => {
  return axios.get(`${base}/_api/ontology/version/list`, { params });
};
