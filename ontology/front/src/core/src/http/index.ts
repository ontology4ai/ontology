import axios from 'axios';
import { Message, Notification, Modal } from '@arco-design/web-react';
import parseRequest from './parseRequest';
import parseParams from './parseParams';
const qs = require('qs');
let redirectConfirm = true;

function getAxios() {
    const service = axios;
    service.defaults.timeout = 100000;

    const userAgent = navigator.userAgent.toLowerCase();
    const isIe = /(msie|trident).*?([\d.]+)/.test(userAgent);

    const env = process.env.NODE_ENV;
    const rootPath = env === 'production' ? '' : '/__modo';

    service.interceptors.request.use(
        config => {
            const url = parseParams(parseRequest(config));
            console.log('url---',url);
            return url;
        },
        error => Promise.reject(error),
    );

    service.interceptors.response.use(
        response => {
            const { redirect } = response.headers;
            if (redirectConfirm && redirect === 'true' && window.location.href.indexOf('/login') < 0) {
                const { redirecturl } = response.headers;
                if (redirecturl) {
                    redirectConfirm = false;
                    Modal.confirm({
                        title: '提示',
                        content:
                            '即将前往登录页?',
                        okButtonProps: {
                            status: 'primary',
                        },
                        onOk: () => {
                            window.location.href = redirecturl;
                        }
                    });

                    setTimeout(() => {
                        redirectConfirm = true;
                    }, 60000);
                }
            }
            return response
        },
        error => {
            const { message } = error;
            const { data } = error;
            console.warn(message, data, error);
            if (message) {
            }

            return Promise.reject(error);
        },
    );

    return service;
}

export default getAxios();
