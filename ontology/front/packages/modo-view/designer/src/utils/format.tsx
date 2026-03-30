import Icon from 'packages/modo-view/core/src/components/Widget/components/Icon';

function formatNode(node) {
    node.icon = <Icon class={node.icon}/>;
    
    if (Array.isArray(node.children)) {
        node.children.forEach(item => {
            formatNode(item);
        })
    }
}

export default function(data) {
	formatNode(data[0]);
	return data;
}
