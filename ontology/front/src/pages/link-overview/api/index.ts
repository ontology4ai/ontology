import axios from 'modo-plugin-common/src/core/src/http';

const base = '';

const getLinkData = (id: any) => {
  return axios.get(`${base}/_api/ontology/link/type/get/${id}`);
};
const getObjList = (params: any) => {
  return axios.get(`${base}/_api/ontology/object/type/list`, { params });
};

const getObjDetail = (id: any) => {
  return axios.get(`${base}/_api/ontology/object/type/get/${id}`);
};

const getTagList = (params: any) => {
  return axios.get(`${base}/_api/ontology/link/type/tag/list`, { params });
};

const getAllObject=(params)=>{
  return axios.get(`${base}/_api/ontology/object/type/findAll`,{params})
};

const addRelationTag = (param)=>{
  return axios.post(`${base}/_api/ontology/link/type/tag/add`,param)
};


const getDataSourceList = () => {
  return axios.get(`${base}/_api/datasource/list`)
};
const getDataTables= (params)=>{
  return axios.get(`${base}/_api/datasource/tables`,{params})
};

const getDataTableInfo= (params)=>{
  return axios.get(`${base}/_api/datasource/table/infos`,{params})
};

const saveRelation=(param)=>{
  return axios.post(`${base}/_api/ontology/link/type/save`,param)
};

const updateRelation=(param)=>{
  return axios.post(`${base}/_api/ontology/link/type/update/${param.id}`,param)
};

export{
  addRelationTag,
  getDataSourceList,
  getDataTableInfo,
  getDataTables,
  getAllObject,
  getLinkData, getObjList, getTagList, getObjDetail,
  saveRelation,
  updateRelation
}
