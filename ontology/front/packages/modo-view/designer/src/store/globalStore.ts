export default function globalStore(state = null, action:any) {
    switch (action.type) {
        case 'SETGLOBALSTORE':
            return action.store;
        default:
            return state;
    }
}
