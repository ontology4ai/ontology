import axios from 'modo-plugin-common/src/core/src/http';
import { Notification } from '@arco-design/web-react';

import type { AxiosInstance } from 'axios';

export const getApp = (appName: string): Promise<AxiosResponse<{ data: any }>> =>
    axios.get(`/_api/_/studio/modoApp/${appName}`);

export const getView = (appName: string, fileName: string): Promise<AxiosResponse<{ data: any }>> =>
    axios.get(`/_api/_view/${appName}/${fileName}`);

export const updateView = (view: any): Promise<AxiosResponse<{ data: any }>> => {
    return axios.post(`/_api/_/studio/modoView/ext/update`, view);
};

