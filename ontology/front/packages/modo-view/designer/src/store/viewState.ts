export default function viewState(state = 'update', action:any) {
    switch (action.type) {
    case 'SETVIEWSTATE':
        return action.data;
    default:
        return state;
    }
}