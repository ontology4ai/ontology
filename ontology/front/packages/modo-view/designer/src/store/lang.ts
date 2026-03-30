export default function lang(state = 'zh-CN', action:any) {
    switch (action.type) {
    case 'SETLANG':
        return action.data;
    default:
        return state;
    }
}