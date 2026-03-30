export default function viewKey(state = null, action:any) {
    switch (action.type) {
    case 'SETVIEWKEY':
        return action.data;
    default:
        return state;
    }
}