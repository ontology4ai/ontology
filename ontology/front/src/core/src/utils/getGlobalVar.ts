import axios from 'modo-plugin-common/src/core/src/http';
import getContextPath from './getContextPath';
import getAppName from './getAppName';
import getModoStatus from './getModoStatus';

const global = window;
export default async (url) => {
  let identity = {};
  await axios({
    method: 'get',
    url
  }).then((res) => {
    identity = res.data.data;
    global.$proxyRegex = identity.proxyRegex;
    global.$currentContextRegex = identity.currentContextRegex;
    global.$identity = identity;
    document.body.setAttribute('theme', identity.name);
    if (identity.extConf && identity.extConf.favicon) {
      document.querySelector('#favicon').setAttribute('href', identity.extConf.favicon);
    }
  }).catch((e) => {
    console.log(e);
  });
  return identity;
};
