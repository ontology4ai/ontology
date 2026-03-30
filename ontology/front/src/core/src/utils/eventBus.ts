const eventBus = {
	utils: {},
	dispatch: function(viewKey, modelName, eventName, data) {
		if (eventBus.utils[`${viewKey}-${modelName}-${eventName}`]) {
			eventBus.utils[`${viewKey}-${modelName}-${eventName}`](data);
		}
	},
	bind: function(viewKey, modelName, eventName, callback) {
		eventBus.utils[`${viewKey}-${modelName}-${eventName}`] = callback;
	},
	unBind: function(viewKey, modelName, eventName, callback) {
		delete eventBus.utils[`${viewKey}-${modelName}-${eventName}`];
	}
};
export default eventBus;