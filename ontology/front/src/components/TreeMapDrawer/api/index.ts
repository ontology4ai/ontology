import axios from 'modo-plugin-common/src/core/src/http';

const base = '';

// 资产查询接口（单击节点）
const getAssetData = Params => axios.get(`${base}/api/data/map/asset/search`, { params: Params });

export { getAssetData };
