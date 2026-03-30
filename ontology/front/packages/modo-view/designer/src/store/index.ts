import { combineReducers } from 'redux'

import lang from './lang';
import appLang from './appLang';
import activeNodeKey from './activeNodeKey';
import activeInForm from './activeInForm';
import highlightNodeKey from './highlightNodeKey';
import parentViewKey from './parentViewKey';
import storeKey from './storeKey';
import viewKey from './viewKey';
import viewState from './viewState';
import params from './params';
import nodes from './nodes';
import app from './app';
import globalStore from './globalStore';
import view from './view';
import store from './store';
import event from './event';

export default combineReducers({
    lang,
    appLang,
    storeKey,
    parentViewKey,
    highlightNodeKey,
    activeNodeKey,
    activeInForm,
    nodes,
    app,
    globalStore,
    viewKey,
    viewState,
    params,
    view,
    store,
    event
})