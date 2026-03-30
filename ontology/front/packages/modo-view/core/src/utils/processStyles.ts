window.cssMap = {};

const setCss = function (style, css) {
    if (style.styleSheet) {
        style.styleSheet.cssText = css;
    } else {
        style.textContent = css;
    }
};
const refreshStyle = function(styleDom, widget, nodeKey) {
    const css = widget.options.css || '';
    const style = styleDom || document.querySelector(`#_style_${nodeKey}`);
    const cssText = css.replace(/:root/g, `.editor-${nodeKey}`).replace(/\\n/g, '\n');
    setCss(style, cssText);
};
const initStyle = function(widget, nodeKey) {
    if (!document.querySelector(`#_style_${nodeKey}`)) {
        const style = document.createElement('style');
        style.setAttribute('id', `_style_${nodeKey}`);
        document.body.appendChild(style);
    }
    refreshStyle(null, widget, nodeKey);
};
const initAllStyle = function(byId, viewName) {
    const cssFragment = document.createDocumentFragment();
    for (let nodeKey in byId) {
        let key = nodeKey;
        if (nodeKey === '0' || nodeKey === 0) {
            key = viewName;
        }
        if (byId[nodeKey].options && byId[nodeKey].options.css) {
            if (cssMap[key]) {
                cssMap[key] += 1;
            } else {
                cssMap[key] = 1;
                if (!document.querySelector(`#_style_${key}`)) {
                    const style = document.createElement('style');
                    style.setAttribute('id', `_style_${key}`);
                    cssFragment.appendChild(style);
                    refreshStyle(style, byId[nodeKey], key);
                }
            }
        }
    }
    document.body.appendChild(cssFragment);
};
const destroyAllStyle = function(byId, viewName) {
    for (let nodeKey in byId) {
        let key = nodeKey;
        if (nodeKey === '0' || nodeKey === 0) {
            key = viewName;
        }
        const style = document.querySelector(`#_style_${key}`);
        if (style) {
            if (cssMap[key] === 1) {
                style.remove();
                delete cssMap[key];
            } else {
                cssMap[key] -= 1;
            }
        }
    }
};
export {
    refreshStyle,
    initStyle,
    initAllStyle,
    destroyAllStyle
}
