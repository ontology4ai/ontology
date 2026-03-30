import axios from 'modo-plugin-common/src/core/src/http';

const base='';

const getDataSourceList = () => {
  return axios.get(`${base}/_api/datasource/list`)
};

const getInterfaceList = (params) => {
  return axios.get(`${base}/_api/ontology/interface/findAll`,{params})
};
const getDataTables= (params)=>{
  return axios.get(`${base}/_api/datasource/tables`,{params})
};

const getDataTableInfo= (params)=>{
  return axios.get(`${base}/_api/datasource/table/infos`,{params})
};

const getObjectGroup=(params)=>{
  return axios.get(`${base}/_api/ontology/object/group/list`,{params})
};
const saveObjectType=(param)=>{
  return axios.post(`${base}/_api/ontology/object/type/save`,param)
};

const getAttrSuggest=(param)=>{
  return axios.post(`${base}/_api/ontology/object/type/attr/suggest`, param)
};

const checkObjectTypeExist = (params)=>{
  return axios.get(`${base}/_api/ontology/object/type/checkExists`,{params})
};

const getInterfaceData = (id) => {
  return axios.get(`${base}/_api/ontology/interface/overview?interfaceId=${id}`)
};

const getAllObject=(params)=>{
  return axios.get(`${base}/_api/ontology/object/type/findAll`,{params})
};

const getAllApi=()=>{
  return axios.get(`${base}/_api/ontology/api/search`)
};

const getApiRes=(params)=>{
  return axios.get(`${base}/_api/ontology/external/get`,{params})
};
const parseSql=(params)=>{
  return axios.post(`${base}/_api/ontology/object/type/parseCustomSql`,params)
};

export {
  getAllObject,
  getDataSourceList,
  getInterfaceList,
  getDataTables,
  getDataTableInfo,
  getObjectGroup,
  saveObjectType,
  getAttrSuggest,
  checkObjectTypeExist,
  getInterfaceData,
  getAllApi,
  getApiRes,
  parseSql
}
