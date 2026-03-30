export const useRootJson = () => {
  const env = process.env.NODE_ENV;
  const context = process.env.npm_config_context_path;
  let pre = '';
  if (env !== 'production') {
    pre = '/__modo';
  }
  const paths = window.location.pathname.split('/');
  if (paths[1] === 'modo') {
    return {
      pre,
      appName: '',
      app: '',
      rootPath: pre,
      beforeRoot: paths[2],
      status: 'platform',
      platformPre: '/modo',
      routePre: 'modo_',
      mvc_path: context ? `/${context}` : '',
    };
  }
  return {
    pre,
    appName: `/${paths[1]}`,
    app: paths[1],
    beforeRoot: paths[1],
    rootPath: `${pre}/${paths[1]}`,
    status: 'app',
    platformPre: '',
    routePre: '',
    mvc_path: context ? `/${context}` : '',
  };
};
