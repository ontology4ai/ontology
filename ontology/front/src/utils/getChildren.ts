import execExp from 'packages/modo-view/designer/src/utils/execExpression';
export default function getChildren($inner: any, widget: any) {
	const types = ['button', 'text', 'tag', 'download'];
	if (types.indexOf(widget.type) > -1) {
		let { label } = widget;
		if (widget.labelBindVar) {
			try {
	            const expLabel = execExp($inner, widget.labelBindVar);
	            if (expLabel !== null && expLabel !== undefined) {
	            	label = String(expLabel);
	            }
	        } catch(e) {
	            console.warn(e);
	        }
		}
		return label;
	}
    return null;
}