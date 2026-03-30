import axios from 'modo-plugin-common/src/core/src/http';

const base = '';

const createTemplate = param => axios.post(`${base}/_api/_/platform/modoViewTemplate/create`, param);

export {
	createTemplate
}
