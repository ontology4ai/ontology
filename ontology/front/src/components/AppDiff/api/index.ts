import axios from 'modo-plugin-common/src/core/src/http';
import qs from 'qs';
import type { AxiosResponse } from 'axios';

export const getApp = (appName: string): Promise<AxiosResponse<{ data: any }>> => {
  return axios.get(`/_api/_/studio/modoApp/${appName}?fields=name,label`);
}
export const getDiff = (appName: string, objType: string, v1: string, v2: string): Promise<AxiosResponse<{ data: any }>> => {
  return axios.get(`/_api/_/platform/history/app/list/${appName}/${objType}?versionList=${v1},${v2}`);
}
export const updateView = (appName, view): Promise<AxiosResponse<{ data: any }>> =>
  axios.post(`/_api/_/studio/modoView/ext/update/${appName}`, view);

export const updateModel = (appName, model): Promise<AxiosResponse<{ data: any }>> =>
  axios.post(`/_api/_/studio/v2/modoModel/ext/update/${appName}`, model);

export const updateTape = (appName, tape): Promise<AxiosResponse<{ data: any }>> =>
  axios.post(`/_api/_/studio/tape/ext/update/cascade/${appName}`, tape);

export const download = (data): Promise<AxiosResponse<{ data: any }>> =>
  axios({
    method: 'post',
    url: `/_api/_/studio/modoApp/download/source`,
    data,
    responseType: 'blob'
  })

export const getSelectVersions = (appName: string, appVersion: string, commitMessage: string) : Promise<AxiosResponse<{ data: AppVersion[] }>> => {
	const params = qs.stringify({
		appName,
    	_extAppVersion: appVersion,
    	commitMessage: `~%${commitMessage}%`,
        fields: 'appVersion,commitMessage',
    	sort: '-d.createDate',
    	limit: 50,
    	offset: 0
	})

  return axios.get(`/_api/_/platform/modoVersionMgr/ext/search?${params}`)
}


