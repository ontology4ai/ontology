import axios from "modo-plugin-common/src/core/src/http/index";
const base = '';
const host=`${window.location.host}`;
const protocol=`${window.location.protocol}`;
const url_dataps=`${protocol}//${host}/dataps`;
const url_dataflow=`${protocol}//${host}/dataflow`;
const url_datastash=`${protocol}//${host}/dataos_datastash`;


//查询数据源
const getDataSources = workspaceId => {
  return axios.get(`${base}/_api/_/workspace/find/${workspaceId}`);
};
//获取数据源信息
const getDatasourceInfo = params => {
  return axios.get(`${url_dataps}/_api/_/proc/project/node/getTeamDsParamDesc`, { params });
};

export {
  getDataSources,
  getDatasourceInfo
}
