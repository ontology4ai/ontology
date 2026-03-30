import lazyload from 'modo-plugin-common/src/utils/lazyload';
import routes from './routes';

const View = lazyload(() => import('modo-plugin-common/src/router/View'));

export default [
	{
        path: '/',
        name: '',
        component: View,
        routes
    }
];
