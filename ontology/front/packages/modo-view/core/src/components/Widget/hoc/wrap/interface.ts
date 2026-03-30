class Nodes {
	rootIds: Array<string>;
	byId: any;
	allIds:Array<string>;
    constructor(data: any) {
    	this.rootIds = data.rootIds;
	    this.byId = data.byId;
	    this.allIds = data.allIds;
    }
}

export default interface WrapProps {
    nodeKey: string;
    parentNodeKey: string;
    nodes: Nodes;
}
