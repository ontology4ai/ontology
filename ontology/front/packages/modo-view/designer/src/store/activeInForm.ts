export default function activeInForm(state = false, action:any) {
    switch (action.type) {
        case 'SETACTIVEINFORM':
            return action.value;
        default:
            return state;
    }
}
