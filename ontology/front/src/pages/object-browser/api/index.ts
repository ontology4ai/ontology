import axios from 'modo-plugin-common/src/core/src/http';

const base = '';

export const getData = (params: {
  groupId?: string;
  keyword: string;
  limit: number;
  page: number;
}) => {
  return axios.get(`${base}/_api/ontology/object/type/explore`, { params }) as any;
};

export const getDetail = (params: { objectTypeId: string }) => {
  return axios.get(`${base}/_api/ontology/object/type/explore/detail`, { params }) as any;
};

export const getSummaryData = (params: any) => {
  return axios.get(`${base}/_api/ontology/object/type/explore/summary`, { params }) as any;
};

export const getPreview = (params: { objectTypeId: string }) => {
  return axios.get(`${base}/_api/ontology/object/type/explore/preview`, { params }) as any;
};
