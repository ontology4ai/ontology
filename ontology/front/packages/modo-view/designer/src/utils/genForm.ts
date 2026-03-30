import Widget from 'packages/modo-view/core/src/components/Widget/utils';
import Action from 'packages/modo-view/core/src/components/Widget/utils/Action';
require('static/guid');

export default function(model) {
	const formId = guid();
	const form = new Widget.form(formId, formId, `${model.doc}表单`);
	form.options.modelName = model.name;
	const children = model.fields.map(field => {
		const itemId = guid();
		const item =  new Widget[field.renderType || 'input'](itemId, field.name, `${field.doc}`);
		return item;
	});
	form.children = children;

	const layout = new Widget.flexLayout(null, null, '容器');
	layout.options.flexDirection = 'column';
	layout.options.height = '100%';
	const formLayout = new Widget.flexLayout(null, null, '表单容器');
	formLayout.options.css = `
		:root {
			overflow: auto;
		}
	`;
	const buttonLayout = new Widget.flexLayout(null, null, '按钮组容器');
	buttonLayout.options.height = '40px';
	buttonLayout.options.css = `
		:root {
			justify-content: flex-end;
			flex: 0 1 auto !important;
			padding: 6px 12px;
		}
	`;
	layout.children.push(formLayout);
	layout.children.push(buttonLayout);
	formLayout.children.push(form);

	const cancelButton = new Widget.button(null, null, '取消');
	cancelButton.options.css = `
		:root {
			margin-right: 12px;
	    }
	`;
	const cancelAction = new Action();
	cancelAction.callback = `function callback() {
		console.log('cancel');
		$this.dispatch({
			type: 'close',
			target: 'parent'
		});
	}`;
	cancelButton.options.eventMap.onClick = cancelAction;

	const saveButton = new Widget.button(null, null, '保存');
	saveButton.options.type = 'primary';
	const saveAction = new Action();
	saveAction.callback = `function callback() {
		console.log('save', $this);
		$this.dispatch({
			type: 'close',
			target: 'parent'
		});
	}`;
	saveButton.options.eventMap.onClick = saveAction;

	buttonLayout.children.push(cancelButton);
    buttonLayout.children.push(saveButton);
	return layout;
};
