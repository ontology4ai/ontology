import getContextPath from '../utils/getContextPath';
import getAppName from '../utils/getAppName';
import getModoStatus from '../utils/getModoStatus';

const userAgent = navigator.userAgent.toLowerCase();
const isIe = /(msie|trident).*?([\d.]+)/.test(userAgent);
const env = process.env.NODE_ENV;
const rootPath = env === 'production' ? '' : '/__modo';

export default (config, appName) => {
    let contextPath = getContextPath();
    const modoStatus = getModoStatus();
    appName = appName || process.env.APP_NAME || getAppName();
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    if (config.url.indexOf('http') !== 0) {
        if (global.$currentContextRegex && new RegExp(global.$currentContextRegex).test(config.url)) {
            config.url = `${rootPath}${contextPath}${config.url}`;
        } else if (global.$proxyRegex) {
            if (!new RegExp(global.$proxyRegex).test(config.url)) {
                config.url = `${rootPath}/${appName}${config.url}`;
            } else {
                config.url = `${rootPath}${config.url}`;
            }
        } else {
            config.url = `${rootPath}${config.url}`;
        }
    } else {
        config.url = `${config.url}`;
    }

    if (isIe) {
        config.headers.common['Cache-Control'] = 'no-cache';
        config.cache = false;
        config.headers.get = config.headers.get || {};
        config.headers.get['If-Modified-Since'] = '0';
    }

    return config;
}
