export default function app(state = null, action:any) {
    switch (action.type) {
        case 'SETAPP':
            return action.data;
        case 'SETTEMPLATES':
        	state.templates = action.data;
            return {
            	...state
            };
        default:
            return state;
    }
}
