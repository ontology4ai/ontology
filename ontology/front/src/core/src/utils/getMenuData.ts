import axios from 'modo-plugin-common/src/core/src/http';

let frameRoutes = []
let menuRoutes = [];
let menuMap = {};
let menuObj = {};

function parseMenu(menu) {
  return menu.map(node => {
    menuMap[node.name] = node;
    menuObj[node.id] = node.name;
    node.parentName = menuObj[node.parentId];
    const parentNode = menuMap[node.parentName];
    if (node.parentName) {
      if (parentNode.type === 'nav') {
        node.navName = node.parentName;
      } else {
        if (parentNode.navName) {
          node.navName = parentNode.navName;
        }
      }
    }
    if (Array.isArray(node.children) && node.children.length > -1) {
      node.children = parseMenu(node.children);
    } else {
      node.children = []
    }
    let extConf = {};
    try {
      extConf = JSON.parse(node.extConf);
    } catch(e) {
    }

    if (extConf.route) {
      const currentRoute = frameRoutes.find(route => {
        return route.name === extConf.route;
      });
      if (currentRoute && node.name !== currentRoute.name) {
        menuRoutes.push({
          path: node.name,
          name: node.name,
          component: currentRoute.component
        })
      }
    }
    node.appId = extConf.appId;
    node.viewName = extConf.viewName;
    node.url = extConf.url;
    node.route = extConf.route;
    if (extConf.viewName) {
      if (extConf.type === 'outer') {
        extConf.appName = extConf.viewName.split('/')[0];
        extConf.viewName = extConf.viewName.split('/')[1];
      }
      menuRoutes.push({
        path: node.name,
        name: node.name,
        component: Renderer,
        state: {
          viewName: extConf.viewName,
          fileName: extConf.viewName + '.activity',
          appName: extConf.appName
        }
      });
    }
    if (extConf.pageName) {
      menuRoutes.push({
        path: node.name,
        name: node.name,
        component: Reporter,
        state: {
          viewName: extConf.pageName,
          fileName: extConf.pageName + '.page',
          appName: extConf.appName
        }
      });
    }
    if (extConf.url) {
      menuRoutes.push({
        path: node.name,
        name: node.name,
        component: Frame,
        state: {
          url: extConf.url
        }
      });
    }
    if (!extConf.url && !extConf.viewName && !extConf.route) {
      menuRoutes.push({
        path: node.name,
        name: node.name,
        component: Placeholder,
        state: {
        }
      });
    }
    const {
      icon
    } = node;
    node.icon = (icon && icon.indexOf('uex') > -1) ? icon.split('-').slice(1).map(str => str.substring(0, 1).toLocaleUpperCase() + str.substring(1)).join('') : node.icon;
    return node;
  })
}
export default async (fRoutes) => {
  let menuData = [];
  frameRoutes = fRoutes;
  await axios({
    method: 'get',
    url: `/_api/_/modoMenu/tree/listAvailable`
  }).then((res) => {
    if (res.data.data.length > 0) {
      menuData = parseMenu(res.data.data[0].children);
    }
  }).catch((e) => {
    console.log(e);
  });
  return {
    data: menuData,
    map: menuMap,
    routes: menuRoutes
  }
};
