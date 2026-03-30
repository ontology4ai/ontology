export default function activeNodeKey(state = 0, action:any) {
    switch (action.type) {
        case 'SETACTIVENODEKEY':
            return action.nodeKey;
        default:
            return state;
    }
}
