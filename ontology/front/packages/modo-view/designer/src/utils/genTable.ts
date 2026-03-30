import Widget from 'packages/modo-view/core/src/components/Widget/utils';
require('static/guid');

export default function(model) {
	const tableId = guid();
	const table = new Widget.table(tableId, tableId, `${model.doc}表格`);
	table.options.modelName = model.name;
	const columns = model.fields.map(field => {
		return {
			title: field.doc,
            dataIndex: field.name
		};
	});
	table.options.columns = columns;
	return table;
};
