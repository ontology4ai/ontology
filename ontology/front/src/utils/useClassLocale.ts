import defaultLocale from '../locale';

function useLocale(context, locale = null) {
    const { lang } = context;
    const currentLocal = (locale || defaultLocale)[lang] || {};
    return (key) => {
  		return currentLocal[key] || key
    }
}

export default useLocale;
