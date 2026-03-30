import getBindVars from './getBindVars';

export default function(current, nextProps, nextState, type) {
	const {
        node,
        editable,
        viewKey
    } = current.props;

    const {
        changeState
    } = nextProps;
    // console.time();

    const {
        stateVars
    } = getBindVars(current.props.nodes, current.props.editable, current.props.node, viewKey);
    // console.log(`diff-${type}-${node.id}`);

    if (current.state) {
        if (current.state !== nextState) {
            for (let key in current.state) {
                if (current.state[key] !== nextState[key]) {
                    if (!_.isEqual(current.state[key], nextState[key])) {
                        // console.timeEnd();
                        return true;
                    }
                }
            }
        }
    }

    if (current.props.renderer) {
        if (nextProps.renderer !== current.props.renderer) {
            // console.timeEnd();
            return true;
        }
    }
    if (current.props.get$this) {
        const $this = current.props.get$this();
        const next$this = nextProps.get$this();
        for (let v of stateVars) {
            if ($this[v] !== next$this[v]) {
                if (!_.isEqual($this[v], next$this[v])) {
                    // console.timeEnd();
                    return true;
                }
            }
        }
    }
    
    if (current.props.$inner) {
        for (let key in current.props.$inner) {
            if (current.props.$inner[key] !== nextProps.$inner[key]) {
                if (!_.isEqual(current.props.$inner[key], nextProps.$inner[key])) {
                    // console.timeEnd();
                    return true;
                }
            }
        }
    }
    if (/\/modo\/([^\/]+)\/(design|render)\/([^\/]+)/.test(window.location.pathname)) {
        if (current.props.appLang !== nextProps.appLang) {
            return true;
        }
    }
    if (current.props.lang !== nextProps.lang) {
        return true;
    }
    // console.timeEnd();
    return false;
}