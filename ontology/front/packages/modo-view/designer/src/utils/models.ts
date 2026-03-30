import execExpression from './execExpression';
import execMethod from './execMethod';
import axios from 'modo-plugin-common/src/core/src/http';
import parseRequest from 'modo-plugin-common/src/core/src/http/parseRequest';
import parseParams from 'modo-plugin-common/src/core/src/http/parseParams';
import genService from './genService';

export default function (view, models) {
  const publicStore = view.props.get$this();
  models.forEach(model => {
    const data = {};
    const serviceMap = {};
    model.fields.forEach(field => {
      data[field.name] = field.defaultValue;
    });
    const modelStr = `function genModel() {
            return class ${model.name} {
                constructor() {
                    return ${JSON.stringify(data, null, 4)};
                }
            };
        }`;
    view.props.dispatch({
      type: 'SETMODEL',
      name: model.name,
      model: execMethod({$this: publicStore}, `function genModel() {
                return class ${model.name} {
                    constructor() {
                        return ${JSON.stringify(data, null, 4)};
                    }
                };
            }`)
    });
    model.events.forEach(service => {
      if (service.name) {
        serviceMap[service.name] = genService(view, service, model.name);
      }
    });
    view.props.dispatch({
      type: 'SETMODEL',
      name: model.name.substring(0, 1).toLocaleLowerCase() + model.name.substring(1) + 'Repo',
      model: serviceMap
    });
  })
}
