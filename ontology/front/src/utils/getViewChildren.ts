export default (children, currentKey) => {
	/* const currentChildren = {};
	for (let key in children) {
		if (Array.isArray(children[key])) {
			currentChildren[key] = children[key].map(item => {
				return item.props.get$this();	
			});
		} else {
			currentChildren[key] = children[key].props.get$this();
		}
	} */
	if (Array.isArray(children[currentKey])) {
		return children[currentKey].map(item => {
			return item.props.get$this();	
		});
	} else {
		return children[currentKey].props.get$this();
	}
}