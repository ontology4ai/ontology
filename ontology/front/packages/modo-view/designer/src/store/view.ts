export default function view(state = null, action:any) {
    switch (action.type) {
        case 'SETVIEW':
            return action.data;
        default:
            return state;
    }
}
