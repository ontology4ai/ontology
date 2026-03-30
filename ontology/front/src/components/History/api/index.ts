import axios from 'modo-plugin-common/src/core/src/http';

import type { AxiosInstance } from 'axios';

import qs from 'qs';

export const getVersions = (appName, objType, objId, search, limit, offset): Promise<AxiosResponse<{ data: any }>> => {
	const data = {
		sort: '-d.createDate',
    	limit,
    	offset
	}
	if (search) {
		data.versionInfo = search;
	}
	const params = qs.stringify(data);
	return axios.get(`/_api/_/platform/envers/search/${appName}/${objType}/${objId}?${params}`);
}

