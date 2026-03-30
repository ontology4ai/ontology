import axios from 'modo-plugin-common/src/core/src/http';

const base = '';

const getCardList = params => axios.get(`${base}/_api/_/modo3dView/search`, { params });

const deleteView = Params => axios.post(`${base}/_api/_/modo3dView/delete/${Params.id}`);

const getModelList = Params => axios.get(`${base}/_api/_/modo3dModel/list`, { params: Params });

const saveView = Params => axios.post(`${base}/_api/_/modo3dView/create`, Params);

const updateView = Params => axios.post(`${base}/_api/_/modo3dView/update`, Params);


export {
  getCardList,
  deleteView,
  getModelList,
  saveView,
  updateView
};
