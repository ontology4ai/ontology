import axios from 'modo-plugin-common/src/core/src/http';

const base='';

export const getTeamTreeData = () => {
  return axios.get(`${base}/_api/_/team/tree/list?level=1`)
};