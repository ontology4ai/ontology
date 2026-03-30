import { useContext } from 'react';
import { GlobalContext } from './context';
import defaultLocale from '../locale';

function useLocale(locale = null) {
    // const { lang } = useContext(GlobalContext);
    let lang='zh-CN'
    // console.log('lang',lang)

    const currentLocal = (locale || defaultLocale)[lang] || {};
    return (key) => {
  		return currentLocal[key] || key
    }
}

export default useLocale;
