import axios from 'modo-plugin-common/src/core/src/http';
import qs from 'qs';


const initData = (data) => {
    return axios.post(`/_api/ontology/simu/scene/initData`, data)
}

const getInitDataStatus = (data) => {
    return axios.post(`/_api/ontology/simu/scene/initData/status`, data)
}

export {
    initData,
    getInitDataStatus
}

