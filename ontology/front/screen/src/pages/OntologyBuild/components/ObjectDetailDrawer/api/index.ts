import axios from 'axios';

export const objectTypeTableData = params => {
  return axios.get(`/ontology_show/_api/object/type/table/data`, { params });
};
