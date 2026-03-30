import axios from 'modo-plugin-common/src/core/src/http';

interface Params {
  [key: string]: any;
}

export const changeLogGetAffect = (params: Params) => {
  return axios.get(`/_api/ontology/data/change/log/getAffect/${params.trackId}`, { params });
};
export const changeLogGetTarget = (params: Params) => {
  return axios.get(`/_api/ontology/data/change/log/getTarget/${params.trackId}`, { params });
};

export const changeLogListAffect = (params: Params) => {
  return axios.get(`/_api/ontology/data/change/log/listAffect/${params.trackId}`, { params });
};
export const changeLogListTarget = (params: Params) => {
  return axios.get(`/_api/ontology/data/change/log/listTarget/${params.trackId}`, { params });
};
