import isNull from './isNull';

export default function(value, defaultValue) {
	return isNull(value) ? defaultValue : value
}