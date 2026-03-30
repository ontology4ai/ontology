export default function(nodes, data) {
	let rootIds = [];
	let allIds:any = [];
	let byId = {};

	function formatNode(node) {
	    let {
	    	children,
	    	...options
	    } = nodes.byId[node.id];

	    options.children = [];
	    byId[options.id] = options;
	    allIds.push(options.id);

	    if (Array.isArray(node.children)) {
	        node.children.forEach(item => {
	        	options.children.push(item.id);
	            formatNode(item);
	        })
	    }
	}


	for (let i = 0; i < data.length; i++) {
		rootIds.push(data[i].id);
		formatNode(data[i]);
	}

	return {
		byId,
		allIds,
		rootIds
	};
}
