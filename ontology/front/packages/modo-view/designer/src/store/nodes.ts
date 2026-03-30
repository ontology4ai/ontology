import generateTree from 'packages/modo-view/designer/src/utils/generateTree';
import normalizeTree from 'packages/modo-view/designer/src/utils/normalizeTree';
import transform from 'packages/modo-view/designer/src/utils/transform';

interface Nodes {
    tree: any,
    rootIds: Array<string>;
    byId: any,
    allIds:Array<string>;
}

function setTree(state: any, data: any) {
    return {
        ...state,
        tree: data
    };
}

function setNormalizeTree(state: any, data: any) {
    return {
        ...state,
        ...normalizeTree(state, data)
    };
}

function setData(state:any, data:any) {
    return {
        ...state,
        ...data,
        tree: generateTree(data)
    };
}

function setRootIds(state:any, data:any) {
    return {
        ...state,
        tree: generateTree(state)
    };
}

function setNodeChildren(state:any, data:Array<string>, nodeKey:string) {
    state.byId[nodeKey].children = data;
    return {
        ...state,
        tree: generateTree(state)
    };
}

function addNode(state:any, parentNodeKey:string, node:any) {
    state.byId[parentNodeKey].children.push(node.id);
    let currentState = {};
    currentState = transform([node]);
    state = {
        ...state,
        allIds: [
            ...state.allIds,
            ...currentState.allIds
        ],
        byId: {
            ...state.byId,
            ...currentState.byId
        }
    };
    return {
        ...state,
        tree: generateTree(state)
    };
}
function deleteItem(state:any, parentNodeKey:string, node:any) {
    delete state.byId[node.id];
    const allIndex = state.allIds.findIndex(id => id.toString() === node.id.toString());
    if (state.byId[parentNodeKey]) {
        const index = state.byId[parentNodeKey].children.findIndex(id => id.toString()  === node.id.toString());
        state.byId[parentNodeKey].children.splice(index, 1);
    }

    state.allIds.splice(allIndex, 1);

    node.children.forEach(id => {
        deleteItem(state, node.id, state.byId[id]);
    });
}
function deleteNode(state:any, parentNodeKey:string, node:any) {
    deleteItem(state, parentNodeKey, node);
    return {
        ...state,
        tree: generateTree(state)
    };
}
function setNode(state:any, nodeKey:string, currentNode:any) {
    const node = state.byId[nodeKey];
    const {
        options,
        ...currentRest
    } = currentNode;

    state.byId[nodeKey] = Object.assign(node, currentRest);

    state.byId[nodeKey].options = {
        ...node.options,
        ...options
    };

    return {
        ...state,
        tree: generateTree(state)
    };
}
function clearNodes(state: any) {
    state.byId['0'].children = [];
    state = {
        rootIds: ['0'],
        byId: {
            '0': state.byId['0']
        },
        allIds: ['0']
    };
    return {
        ...state,
        tree: generateTree(state)
    }
}

export default function nodes(state:Nodes = {
        tree: [],
        rootIds: [],
        byId: {},
        allIds: []
    }, action:any) {
        switch (action.type) {
        case 'SETTREE':
            return setTree(state, action.data);
        case 'SETNORMALIZETREE':
            return setNormalizeTree(state, action.data);
        case 'SETNODES':
            return setData(state, action.data);
        case 'SETNODECHILDREN':
            return setNodeChildren(state, action.data, action.nodeKey);
        case 'SETROOTIDS':
            return setRootIds(state, action.data);
        case 'ADDNODE':
            return addNode(state, action.parentNodeKey, action.node);
        case 'SETNODE':
            return setNode(state, action.nodeKey, action.currentNode);
        case 'DELETENODE':
            return deleteNode(state, action.parentNodeKey, action.node);
          case 'CLEARNODES':
            return clearNodes(state);
        default:
            return state;
        }
}
