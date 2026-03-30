import Icon from 'packages/modo-view/core/src/components/Widget/components/Icon';


function formatNode(node, byId, allIds) {
    let {
    	children,
    	...options
    } = node;
    options.children = [];
    byId[options.id] = options;
    allIds.push(options.id);

    if (Array.isArray(node.children)) {
        node.children.forEach(item => {
        	options.children.push(item.id);
            formatNode(item, byId, allIds);
        })
    }
}



export default function(data) {
	let rootIds = [];
	let allIds:any = [];
	let byId = {};

	for (let i = 0; i < data.length; i++) {
		rootIds.push(data[i].id);
		formatNode(data[i], byId, allIds);
	}

	let json = {
		byId,
		allIds,
		rootIds
	};
	return json;
}
