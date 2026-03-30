export default function highlightNodeKey(state = 0, action:any) {
    switch (action.type) {
        case 'SETHIGHLIGHTNODEKEY':
            return action.nodeKey;
        case 'SETUNHIGHLIGHTNODEKEY':
            return state === action.nodeKey ? null : state;
        default:
            return state;
    }
}
