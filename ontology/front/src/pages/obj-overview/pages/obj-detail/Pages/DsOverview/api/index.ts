import axios from 'modo-plugin-common/src/core/src/http';

const base='';

export const getData = (params) => {
  return axios.get(`${base}/_api/ontology/object/type/explore/preview`, {params})
};
