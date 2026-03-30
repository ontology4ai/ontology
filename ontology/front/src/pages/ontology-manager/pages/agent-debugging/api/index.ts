import axios from 'modo-plugin-common/src/core/src/http';

const base = '';

export const getConfig = () => {
  return axios.get(`${base}/_api/ontology/config/findAll?configType=agent`);
};

export const getAgent = (params) => {
  return axios.get(`${base}/_api/ontology/agent`, {params})
}