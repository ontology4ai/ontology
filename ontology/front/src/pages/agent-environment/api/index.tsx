import axios from 'modo-plugin-common/src/core/src/http';

// 搜索分组
export const searchGroup = params => {
  return axios.get(`/_api/ontology/config/group/search`, { params });
};

// 保存分组
export const saveGroup = data => {
  return axios.post(`/_api/ontology/config/group/save`, data);
};

// 更新分组
export const updateGroup = (id, data) => {
  return axios.post(`/_api/ontology/config/group/update/${id}`, data);
};

// 删除分组
export const deleteGroup = data => {
  return axios.post(`/_api/ontology/config/group/delete`, data);
};

// 启用分组
export const enableGroup = id => {
  return axios.post(`/_api/ontology/config/group/enable/${id}`);
};

export const detailGroup = id => {
  return axios.get(`/_api/ontology/config/group/view/${id}`);
};

//禁用接口
export const disableGroup = id => {
  return axios.post(`/_api/ontology/config/group/disable/${id}`);
};

// 查询分组编码是否存在
export const checkGroupCodeExist = params => {
  return axios.get(`/_api/ontology/config/group/checkExists`, { params });
};
