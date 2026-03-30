import routes from './router/routes';
import { registContext } from 'modo-plugin-common/src/utils/context';
import getAppName from 'modo-plugin-common/src/core/src/utils/getAppName';

const deployFront = require('deployFront');

deployFront.util.registLine(
	getAppName(),
	{
		routes
	},
	context => {
		registContext(context);
	}
);