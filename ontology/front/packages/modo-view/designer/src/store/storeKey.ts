export default function storeKey(state = 0, action:any) {
    switch (action.type) {
    case 'REFRESHKEY':
        return state + 1;
    default:
        return state;
    }
}