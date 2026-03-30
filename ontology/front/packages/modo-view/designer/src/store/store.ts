import { getAxios } from 'modo-plugin-common/src/core/src/http';
import axios from 'modo-plugin-common/src/core/src/http';
import _ from 'underscore';
import { Message, Notification, Modal } from '@arco-design/web-react';
import moment from 'moment';
import qs from 'qs';

require('static/guid');

function setState(state, name, value) {
	state.state[name] = value;
    state.change = name;
    state.changeIndex += 1;
    state.changeList.push(name);
	return {
		...state
	};
}
function setAction(state, name, value) {
    state.action[name] = value;
    return {
        ...state
    };
}
function setAppName(state, appName) {
    state.appName = appName;
    /* state.axios = function(...params) {
        axios
    } */
    return {
        ...state
    }
}
function setTapePrefix(state, tapePrefix) {
    state.tapePrefix = tapePrefix;
    return {
        ...state
    }
}
function setRef(state, name, ref) {
    state.$refs[name] = ref;
    return {
        ...state
    };
}
function deleteRef(state, name) {
    delete state.$refs[name];
    return {
        ...state
    };
}
function setDatasource(state, name, datasource) {
    state.datasourceMap[name] = datasource;
    return {
        ...state
    };
}
function setUtil(state, name, value) {
    state.util[name] = value;
    return {
        ...state
    };
}
function setModel(state, name, model) {
    state.modelMap[name] = model;
    return {
        ...state
    };
}
function setParent(state, data) {
    state.parent = data;
    return {
        ...state
    };
}
function setChild(state, data) {
    const {
        key,
        view
    } = data;

    if (state.children.hasOwnProperty(key)) {
        if (Array.isArray(state.children[key]) && state.children[key].indexOf(view) < 0) {
            state.children[key].push(view);
        } else {
            if (state.children[key] !== view) {
                state.children[key] = [state.children[key], view];
            }
        }
    } else {
        state.children[key] = view;
    }
    return {
        ...state
    };
}
function deleteChild(state, data) {
    const {
        key,
        view
    } = data;
    if (Array.isArray(state.children[key])) {
        state.children[key].splice(state.children[key].indexOf(view), 1);
    } else {
        delete state.children[key]
    }
    return {
        ...state
    };
}
function setClose(state, method) {
    state.close = method;
    return {
        ...state
    };
}

export default function store(state = {
    initVars: false,
    initServices: false,
	state: {},
	action: {},
    datasourceMap: {},
    modelMap: {},
    $refs: {},
    dispatch: function() {},
    close: function() {},
    parent: null,
    children: {},
    appName: null,
    change: null,
    changeIndex: 0,
    changeList: [],
    i18n: {},
    utils: {
        _,
        guid,
        axios,
        message: Message,
        notification: Notification,
        modal: Modal,
        moment,
        getUrlParams() {
            return qs.parse(window.location.search.split('?')[1])
        },
        gotoMenuName(name, params, obj) {
            frameRef.props.history.push({
                pathname: `${frameRef.props.match.url}/${name}`,
                state: params
            });
            frameRef.goToMenuName(name);
        }
    }
}, action:any) {
    switch (action.type) {
        case 'SETSTORE':
            return {
                ...state,
                ...action.store
            };
        case 'SETSTATE':
            return setState(state, action.name, action.value);
        case 'SETACTION':
            return setAction(state, action.name, action.value);
        case 'SETREF':
            return setRef(state, action.name, action.ref);
        case 'SETAPPNAME':
            return setAppName(state, action.appName);
        case 'SETTAPEPREFI':
            return setTapePrefix(state, action.prefix);
        case 'SETUTIL':
            return setUtil(state, action.name, action.value);
        case 'SETDATASOURCE':
            return setDatasource(state, action.name, action.datasource);
        case 'SETMODEL':
            return setModel(state, action.name, action.model);
        case 'SETPARENT':
            return setParent(state, action.data);
        case 'SETCHILD':
            return setChild(state, action.data);
        case 'DELETECHILD':
            return deleteChild(state, action.data);
        case 'SETCLOSE':
            return setClose(state, action.method);
        case 'DELETEREF':
            return deleteRef(state, action.name);
        default:
            return state;
    }
}
