export default function parentViewKey(state = 0, action:any) {
    switch (action.type) {
    case 'SETPARENTVIEWKEY':
        return action.data;
    default:
        return state;
    }
}