import axios from 'modo-plugin-common/src/core/src/http';

const base = '';

const deleteTemplate = id => axios.post(`${base}/_api/_/platform/modoViewTemplate/delete/${id}`);
const updateTemplate = data => axios.post(`${base}/_api/_/platform/modoViewTemplate/update`, data);
export {
	deleteTemplate,
	updateTemplate
}
