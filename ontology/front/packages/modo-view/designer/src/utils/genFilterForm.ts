import Widget from 'packages/modo-view/core/src/components/Widget/utils';
import Action from 'packages/modo-view/core/src/components/Widget/utils/Action';
require('static/guid');

export default function(model) {

	const containerId = guid();
	const container = new Widget.container(containerId, containerId, '筛选表单容器');
	container.options.css = `:root {
		height: auto;
	}`;

	const formId = guid();
	const form = new Widget.form(formId, formId, `${model.doc}表单`);
	form.options.modelName = model.name;
	form.options.layout = 'inline';
	const children = model.fields.map(field => {
		const itemId = guid();
		const item =  new Widget[field.renderType || 'input'](itemId, field.name, `${field.doc}`);
		item.options.span = '8';
		item.options.labelFlex = '84px';
		return item;
	});

	form.children = children;

	container.children.push(form);

	const action = new Action();
	action.callback = `function callback(values) {
		console.log(values);
	}`;
	form.options.eventMap.search = action;
	return container;
};
