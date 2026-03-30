export default function($inner, method, ...params) {
	const Fn = Function;
	const keys = [];
	const values = [];
	const $this = $inner.$this;
	Object.keys($inner).forEach(key => {
		if (key !== '$this') {
			keys.push(key);
			values.push($inner[key]);
		}
	});

	try {
		return new Fn('$this', '$utils', '$i18n', ...keys, `
			return ${method}
			//# sourceURL=vm-${new Date().getTime()}
	    `)($this, $this.utils, $this.i18n, ...values)(...params);
	} catch(e) {
		if (!window.$editable) {
			console.warn(e);
		}
	}
}