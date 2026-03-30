import axios from 'modo-plugin-common/src/core/src/http';

const base='';

const getDataSourceList = () => {
  return axios.get(`${base}/_api/datasource/list`)
};
const getDataTables= (params)=>{
  return axios.get(`${base}/_api/datasource/tables`,{params})
};

const getDataTableInfo= (params)=>{
  return axios.get(`${base}/_api/datasource/table/infos`,{params})
};

const getAllObject=(params)=>{
  return axios.get(`${base}/_api/ontology/object/type/findAll`,{params})
}
const getObjectDetail=(params)=>{
  return axios.get(`${base}/_api/ontology/object/type/get/${params.id}`,{params})
};

const getAllTags=()=>{
  return axios.get(`${base}/_api/ontology/link/type/tag/list`)
};
const addRelationTag = (param)=>{
  return axios.post(`${base}/_api/ontology/link/type/tag/add`,param)
};

const saveAction=(param)=>{
  return axios.post(`${base}/_api/ontology/action/type/save`,param)
};

export {
  getDataSourceList,
  getDataTables,
  getDataTableInfo,
  getAllObject,
  getObjectDetail,
  getAllTags,
  addRelationTag,
  saveAction
}
