import axios from 'modo-plugin-common/src/core/src/http';

import type { AxiosInstance } from 'axios';

export const getVersions = (appName: string): Promise<AxiosResponse<{ data: any }>> =>
	axios.get(`/_api/_/platform/envers/search/datago/view/300d20541bc4d4ac`);

