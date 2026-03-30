export default function params(state = null, action:any) {
    switch (action.type) {
        case 'SETPARAMS':
            return action.data;
        default:
            return state;
    }
}
