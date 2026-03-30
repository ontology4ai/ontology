import genService from './genService';
import execExpression from './execExpression';

export default function (view, services) {
    const publicStore = view.props.get$this();

    services.forEach(service => {
        const load = genService(view, service);

        if (service.autoLoad && service.condition) {
            load();
        }
        view.props.dispatch({
            type: 'SETDATASOURCE',
            name: service.name,
            datasource: load
        })
    })
}