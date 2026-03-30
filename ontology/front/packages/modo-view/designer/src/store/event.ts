export default function event(state = {
	nodeKey: null,
	eventType: null
}, action:any) {
    switch (action.type) {
        case 'SETACTIVEEVENT':
            return {
            	nodeKey: action.nodeKey,
            	eventType: action.eventType
            };
        default:
            return state;
    }
}
