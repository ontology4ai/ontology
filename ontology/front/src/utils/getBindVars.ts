const getVars = (options, stateVars, innerVars) => {
	for (let key in options) {
		if (key.indexOf('BindVar') > -1) {
			if (options[key]) {
				const stateMatchs = options[key].match(/\$this\.[\w\d_-]+/g);
				// const innerMatchs = options[key].match(/\$[a-zA-z_-]+/g);
				if (stateMatchs) {
					stateMatchs.forEach(str => {
						stateVars.push(str.split('.')[1]);
					});
				}
				/* if (innerMatchs) {
					innerMatchs.forEach(str => {
						if (str !== '$this') {
							innerVars.push(str);
						}
					})
				} */
			}
		} else {
			if (options[key] && typeof options[key] === 'object') {
				if (Array.isArray(options[key])) {
					options[key].forEach((item, k) => {
						if (options[key][k] && typeof options[key][k] === 'object' && !Array.isArray(options[key][k])) {
							getVars(options[key][k], stateVars, innerVars);
						} 
					})
				} else {
					getVars(options[key], stateVars, innerVars);
				}
			}
		}
	}
}

const getNodes = function(key, nodes, viewNodes) {
	const child = viewNodes.byId[key]
	nodes.push(child);
	for (let k of child.children) {
		getNodes(k, nodes, viewNodes);
	}
}
export default function(viewNodes, editable, options, viewKey, stores) {
	const nodeBindVarMap = window.nodeVarMap[viewKey];
	if (!editable && nodeBindVarMap && nodeBindVarMap[options.id]) {
		const {
			stateVars,
			innerVars
		} = nodeBindVarMap[options.id];
		return {
			stateVars,
			innerVars
		}
	}
	let stateVars = [];
	let innerVars = [];
	const nodes = [];
	const types = ['formList', 'tableForm', 'tabsForm'];
	if (options.type === 'form' && options.options.layout === 'inline') {
		getNodes(options.id, nodes, viewNodes);
	}
	if (options.options.store) {
		const currentStore = stores.find(s => {
			return s.id === options.options.store
		});
		if (currentStore) {
			stateVars.push(currentStore.name + 'Store');
		}
	}
	if (types.indexOf(options.type) > -1) {
		getNodes(options.id, nodes, viewNodes);
	}
	if (nodes.length === 0) {
		nodes.push(options);
	}
	for (let node of nodes) {
		getVars(node, stateVars, innerVars);
	}
	
	stateVars = Array.from(new Set(stateVars));
	innerVars = Array.from(new Set(innerVars));
	const obj = {};
	obj[options.id] = {
		stateVars,
		innerVars
	}
	if (window.nodeVarMap[viewKey]) {
		window.nodeVarMap[viewKey] = {
			...window.nodeVarMap[viewKey],
			...obj
		};
	} else {
		window.nodeVarMap[viewKey] = obj;
	}
	return {
		stateVars,
		innerVars
	}
}