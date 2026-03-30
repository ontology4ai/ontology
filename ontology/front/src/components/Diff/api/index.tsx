import axios from 'modo-plugin-common/src/core/src/http';
import qs from 'qs';
import type { AxiosResponse } from 'axios';

export const getApp = (appName: string): Promise<AxiosResponse<{ data: any }>> => {
    return axios.get(`/_api/_/studio/modoApp/${appName}?fields=name,label`);
}

export const getView = (appName: string, viewName: string): Promise<AxiosResponse<{ data: any }>> => {
    return axios.get(`/_api/_/studio/modoView/find?appName=${appName}&name=${viewName}&fields=id,name,label,appLabel`)
}
export const getModel = (appName: string, modelName: string): Promise<AxiosResponse<{ data: any }>> => {
    return axios.get(`/_api/_/studio/modoModel/${appName}/${modelName}?fields=id,name,doc`);
}
export const getTape = (appName: string, tapeName: string): Promise<AxiosResponse<{ data: any }>> => {
    return axios.get(`/_api/_/studio/modoTape/${appName}/${tapeName}?fields=id,name,label`);
}

export const getViewVersions = (appName: string, objType: string, objId: string, extVersion: string, versionInfo: string): Promise<AxiosResponse<{ data: any }>> => {
	const params = qs.stringify({
		appName,
    	_extVersion: extVersion,
    	versionInfo: `~%${versionInfo}%`,
        fields: 'ver,versionInfo',
    	sort: '-d.createDate',
    	limit: 50,
    	offset: 0
	});
    return axios.get(`/_api/_/platform/envers/search/${appName}/${objType}/${objId}?${params}`)
}


export const getViewDiff = (appName: string, viewId: string, v1: string, v2: string): Promise<AxiosResponse<{ data: any }>> => {
    return axios.get(`/_api/_/platform/envers/diff/${appName}/view/${viewId}?versionList=${v1},${v2}`);
}
export const getModelDiff = (appName: string, modelId: string, v1: string, v2: string): Promise<AxiosResponse<{ data: any }>> => {
    return axios.get(`/_api/_/platform/envers/diff/${appName}/model/${modelId}?versionList=${v1},${v2}`);
}
export const getTapeDiff = (appName: string, tapeId: string, v1: string, v2: string): Promise<AxiosResponse<{ data: any }>> => {
    return axios.get(`/_api/_/platform/envers/diff/${appName}/tape/${tapeId}?versionList=${v1},${v2}`);
}

export const updateView = (appName, view): Promise<AxiosResponse<{ data: any }>> =>
  axios.post(`/_api/_/studio/modoView/ext/update/${appName}`, view);

export const updateModel = (appName, model): Promise<AxiosResponse<{ data: any }>> =>
  axios.post(`/_api/_/studio/v2/modoModel/ext/update/${appName}`, model);

export const updateTape = (appName, tape): Promise<AxiosResponse<{ data: any }>> =>
  axios.post(`/_api/_/studio/tape/ext/update/${appName}`, tape);
