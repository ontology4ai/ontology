export default function(data) {
	const {
		rootIds,
		byId,
		allIds
	} = data;

	const ids:Array<string> = [];
	function getChildren(node) {
		const childIds = node.children;
		node.children = childIds.filter(childId => {
			if (ids.indexOf(childId.toString()) < 0) {
				ids.push(childId.toString());
				return true;
			}
			return false;
		}).map(childId => {
			const child = byId[childId];
			const currentChild = {
				...child,
				children: [...child.children]
			};
			getChildren(currentChild);
			return currentChild;
		})
	}
	const tree = rootIds.map(rootId => {
		const node = byId[rootId];
		const currentNode = {
			...node,
			children: [...node.children]
		};
		ids.push(node.id.toString());
		getChildren(currentNode);

		return currentNode;
	});

	return tree;
}
