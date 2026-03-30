export default (config, service, appServiceMap, appModelMap) => {
  let { url } = config;
  if (config.method === 'get' && config.params) {
    if (url.indexOf('?') < 0) {
      url += '?';
    } else {
      url += '&';
    }
    /* let serviceId = service.serviceId;
    serviceId = serviceId.replace('modo', 'moda');
    serviceId = serviceId.replace('Modo', 'Moda');
    let modelName = appServiceMap[serviceId].name;
    modelName = modelName.substring(0, 1).toLocaleUpperCase() + modelName.substring(1).toLocaleUpperCase();
    if (appModelMap[modelName]) {
      console.log(config.params, appModelMap[modelName]);
    } */
    const keys = Object.keys(config.params);
    for (const key of keys) {
      url += `${key}=${encodeURIComponent(config.params[key])}&`;
    }
    url = url.substring(0, url.length - 1);
    config.params = {};
  }
  config.url = url;
    
	return config;
}