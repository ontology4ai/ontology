export default function(key, lang) {
	let browserLang = navigator.language || navigator.browserLanguage;
	if (browserLang.indexOf('en') > -1) {
		browserLang = 'en-US';
	}
	const localStorageLang = localStorage.getItem(key);
	return localStorageLang || lang || browserLang;
}