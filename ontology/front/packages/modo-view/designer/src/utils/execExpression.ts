import execMethod from './execMethod';
export default function($inner, exp, ...params) {
	return execMethod($inner, `function() {
		return ${exp};
	}`);
}