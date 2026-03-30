import isNull from './isNull';

export default (values) => {
    let obj = {};
    for (let i in values) {
        if(!isNull(values[i]) && values[i] !== ''){
            if (values[i] && !Array.isArray(values[i]) && typeof values[i] === 'object') {
                for (let j in values[i]) {
                    if(!isNull(values[i][j]) && values[i][j] !== ''){
                        obj[`${i}.${j}`] = values[i][j]
                    }
                }
            } else {
                obj[i] = values[i]
            }
        }
        
    }
    return obj
}