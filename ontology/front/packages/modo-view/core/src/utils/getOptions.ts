import execExp from 'packages/modo-view/designer/src/utils/execExpression';
import execMethod from 'packages/modo-view/designer/src/utils/execMethod';

function xexecExp(expression, $this, $inner) {
    return execExp({
        $this,
        ...$inner
    }, expression)
}
function parseValue(value, $this, $inner) {
    if (typeof value === 'object' && value && !Array.isArray(value)) {
        return getObj(value, $this, $inner);
    }
    if (Array.isArray(value)) {
        return value.map(item => {
            if (typeof item === 'object' && item && !Array.isArray(item)) {
                return getObj(item, $this, $inner);
            }
            return item;
        });
    }
    return value;
}
function getObj(obj, $this, $inner) {
    const currentObj = {};
    for (let attr in obj) {
        let bindAttr = `${attr}BindVar`;
        let currentAttr = `${attr}`;

        if (currentAttr.indexOf('BindVar') > -1 && Object.keys(obj).indexOf(currentAttr.split('BindVar')[0]) < 0) {
            bindAttr = currentAttr;
            currentAttr = currentAttr.split('BindVar')[0];
        }
        if (Object.keys(obj).indexOf(bindAttr) > -1) {
            if (typeof obj[bindAttr] === 'string' && obj[bindAttr]) {
                try {
                    currentObj[currentAttr] = xexecExp(obj[bindAttr], $this, $inner);
                } catch(e) {
                    console.warn(e);
                    currentObj[currentAttr] = parseValue(obj[currentAttr], $this, $inner);
                }
            } else {
                currentObj[currentAttr] = parseValue(obj[currentAttr], $this, $inner);
            }
        } else {
            currentObj[currentAttr] = parseValue(obj[currentAttr], $this, $inner);
        }
    }

    return currentObj;
}

export default function getOptions(rest, $this, $inner) {
    return getObj(rest, $this, $inner);
}
