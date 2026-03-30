const global = require('global');

export default (function(event) {
  let interval_id:any;
  let last_hash:any;
  let cache_bust = 1;
  let attached_callback:any;
  return {
    postMessage: function(message, target_url, target) {
      if (!target_url) {
        return;
      }
      target = target || parent;
      if (global['postMessage']) {
        target['postMessage'](message, target_url.replace(/([^:]+:\/\/[^\/]+).*/, '$1'));
      } else if (target_url) {
        target.location = target_url.replace(/#.*$/, '') + '#' + (+new Date()) + (cache_bust++) + '&' + message;
      }
    },
    receiveMessage: function(callback: (message: any) => void, source_origin?:any) {
      if (global['postMessage']) {
        if (callback) {
          attached_callback = function(e) {
            if ((typeof source_origin === 'string' && e.origin !== source_origin) || (Object.prototype.toString.call(source_origin) === '[object Function]' && source_origin(e.origin) === !1)) {
              return !1;
            }
            callback(e);
          };
        }
        if (global['addEventListener']) {
          global[callback ? 'addEventListener' : 'removeEventListener']('message', attached_callback, !1);
        } else {
          global[callback ? 'attachEvent' : 'detachEvent']('onmessage', attached_callback);
        }
      } else {
        interval_id && clearInterval(interval_id);
        interval_id = null;
        if (callback) {
          interval_id = setInterval(function() {
            const hash = document.location.hash;
            const re = /^#?\d+&/;
            if (hash !== last_hash && re.test(hash)) {
              last_hash = hash;
              callback({data: hash.replace(re, '')});
            }
          }, 100);
        }
      }
    },
    bindReceiveMessage: function(attr) {
      let isExecFunc:any = null;
      let base:any = {};
      if (typeof attr === 'object' && !Array.isArray(attr)) {
        isExecFunc = attr.isExecFunc;
        base = attr.base;
      }
      this.receiveMessage(function(message) {
        if (typeof message.data === 'object' && !Array.isArray(message.data)) {
          if (isExecFunc) {
            if (message.data.func) {
              if (message.data.base) {
                if (message.data.base === 'window') {
                  if (global[message.data.func]) {
                    global[message.data.func](message.data.para);
                  }
                } else {
                  if (base[message.data.func]) {
                    base[message.data.func](message.data.para);
                  }
                }
              }
            }
          }
        }
      });
    }
  };
})()
