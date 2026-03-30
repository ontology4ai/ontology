export default function appLang(state = 'zh-CN', action:any) {
    switch (action.type) {
    case 'SETAPPLANG':
        return action.data;
    default:
        return state;
    }
}