require('static/guid');

const parseEvent = (event, view, node, eventKey, app) => {
    event.builtIn.viewAction.condition = 'true';
    event.builtIn.viewActions = [event.builtIn.viewAction];
    //this.parseEvent(event, view, node, eventKey, app);
    return event;
};
const parseAction = (action, view, node, eventKey, app) => {
    const service = app.serviceMap[action.url];
    if (service) {
        const {
            name,
            methodName,
        } = service;
        if (service.type === 'model') {
            action.name = name.substring(0, 1).toLocaleLowerCase() + name.substring(1) + methodName.substring(0, 1).toLocaleUpperCase() + methodName.substring(1);
        } else if (service.type === 'tape') {
            action.name = name;
        } else {
            action.name = guid();
        }
        action.descr = service.description;
        action.method = service.methodType;
    } else {
        action.name = 'service' + guid();
    }
    action.serviceId = action.url;
    action.autoLoad = false;
    action.condition = true;
    action.descr = action.descr || node.label;
    return action;
};
const parseCEvent = (event, view, node, eventKey, app) => {
    const {
        serviceActions,
        serviceAction
    } = event.builtIn;
    if (Array.isArray(serviceActions)) {
        serviceActions.forEach(action => {
            if (action.url) {
                view.options.services.push(parseAction(action, view, node, eventKey, app));
            }
        })
    }
    if (serviceAction) {
        if (serviceAction.url) {
            view.options.services.push(parseAction(serviceAction, view, node, eventKey, app));
        }
    }
    delete event.builtIn.serviceActions;
    delete event.builtIn.serviceAction;
    return event;
};
const parseService = (node, view, attr) => {
    const {
        service
    } = node.options;

    if (service && service.url) {
        service.name = `get${node.name}Data`;
        service.serviceId = service.url;
        service.stateName = `${node.name}Data`;
        if (!service.success) {
            service.success = `function successCallback(data) {
                return data;
            }`;
        }

        service.autoLoad = true;
        service.condition = true;
        node.options[`${attr}BindVar`] = `$this.${node.name}Data`;
        view.options.services = [service];
    }
    delete node.options.service;
};
const parseLoop = (node, view) => {
    const {
        loop
    } = node.options;

    if (loop) {
        node.options.loop.pagination = {
            style: {
                display: node.options.loop.paginationVisible ? 'block' : 'none'
            },
            sizeOptions: [10, 20, 30, 40, 50],
            show: node.options.loop.paginationVisible,
            showTotal: true,
            pageSizeChangeResetCurrent: true,
            sizeCanChange: true,
            total: 0,
            totalBindVar: null,
            pageSize: node.options.loop.pageSize || 20,
            pageSizeBindVar: null,
            current: 1,
            currentBindVar: null
        }
    }

    if (!loop || (loop && !loop.service)) {
        return;
    }

    const {
        service
    } = loop;

    if (service && service.url) {
        service.name = `get${node.name}Data`;
        service.serviceId = service.url;
        service.stateName = `${node.name}Data`;
        if (!service.success) {
            service.success = `function successCallback(data) {
                return data;
            }`;
        }

        service.autoLoad = true;
        service.condition = true;
        loop.dataBindVar = `$this.${node.name}Data`;
        view.options.services = [service];
    }
    delete node.options.loop.service;
};
const parseIcon = icon => {
    return icon && icon.split('-').slice(1).map(str => str.substring(0, 1).toLocaleUpperCase() + str.substring(1)).join('')
};

const parse = {
    view: (node, view) => {
        node.id = '0';
        node.options.models = [];
        node.options.vars = node.options.vars || [];
        node.options.services = node.options.services || [];
    },
    table: (node, view) => {
        node.options.modelName = node.options.modelId;
        node.options.pagination = {
            show: node.options.paginationVisible,
            pageSize: 20
        };
        node.options.columns = node.options.fields.map(field => {
            return {
                ...field,
                dataIndex: field.name,
                title: field.label
            }
        });
        node.options.actions = node.options.actions.map(action => {
            action.icon = parseIcon(action.icon);
            action.event = parseEvent(action.eventMap.click);

            return action;
        });
        node.options.pagination = {
            style: {
                display: node.options.paginationVisible ? 'block' : 'none'
            },
            sizeOptions: [10, 20, 30, 40, 50],
            show: node.options.paginationVisible,
            showTotal: true,
            pageSizeChangeResetCurrent: true,
            sizeCanChange: true,
            total: 0,
            totalBindVar: null,
            pageSize: node.options.pageSize,
            pageSizeBindVar: null,
            current: 1,
            currentBindVar: null
        };

        parseService(node, view, 'data');

        delete node.options.modelId;
    },
    form: (node, view) => {
        node.options.modelName = node.options.modelId;
        node.options.labelFlex = node.options.labelWidth;
        node.options.labelAlign = node.options.labelPosition !== 'top' ? node.options.labelPosition : 'right';
        node.options.layout = node.options.type === 'inline' ? 'inline' : 'horizontal';
        if (node.options.labelPosition === 'top') {
            node.options.layout = 'vertical'
        }
        if (node.options.layout === 'inline') {
            node.children.forEach(child => {
                child.options.span = '8';
            });
        }

        delete node.options.modelId;
        delete node.options.labelWidth;
        delete node.options.labelPosition;
    },
    radio: (node, view) => {
        node.type = 'radioGroup';
        node.options.type = 'radio';
        parseService(node, view, 'options');
    },
    checkbox: (node, view) => {
        node.type = 'checkboxGroup';
        parseService(node, view, 'options');
    },
    select: (node, view) => {
        /* node.options.options = node.options.options.map(option => {
            return {
                label: option[node.options.props.label],
                value: option[node.options.props.value]
            }
        });*/
        parseService(node, view, 'options');
        delete node.children;
    },
    tree: (node, view) => {
    	parseService(node, view, 'data');
    },
    tag: (node, view) => {
        node.options.icon = parseIcon(node.options.icon);
    },
    button: (node, view) => {
        const eventMap = {};
        Object.keys(node.options.eventMap).forEach(key => {
            const name = key.substring(0, 1).toLocaleUpperCase() + key.substring(1);
            eventMap[`on${name}`] = node.options.eventMap[key];
        });
        const { type } = node.options;
        node.options.type = type === 'custom' ? 'default' : type;
        node.options.icon = parseIcon(node.options.icon);
        node.options.eventMap = eventMap;
    },
    text: (node, view) => {
        node.labelBindVar = node.options.textBindVar;

        delete node.options.textBindVar;
    },
    dropdown: (node, view) => {
        // console.log(node);
    },
    icon: (node, view) => {
        node.options.icon = parseIcon(node.options.class);

        delete node.options.class;
        delete node.options.classBindVar;
    },
    container: (node, view) => {
    },
    datePicker: (node, view) => {
    },
    'date-picker': (node, view) => {
        node.type = 'datePicker';
    },
    tabs: (node, view) => {
        const {
            defaultActiveTab
        } = node.options;
        node.options.edit = Boolean(node.options.editable);
        node.options.defaultActiveTab = defaultActiveTab === 'placeholder' ? null : defaultActiveTab;

        delete node.options.editable;
    }
};

const parseC = {
    tag: (node, view) => {
        if (node.options.hasOwnProperty('text')) {
            node.label = node.options.text;
        }
        if (node.options.hasOwnProperty('textBindVar')) {
            node.labelBindVar = node.options.textBindVar;
        }
        delete node.options.text;
        delete node.options.textBindVar;
    },
    text: (node, view) => {
        if (node.options.hasOwnProperty('text')) {
            node.label = node.options.text;
        }
        if (node.options.hasOwnProperty('textBindVar')) {
            node.labelBindVar = node.options.textBindVar;
        }
        delete node.options.text;
        delete node.options.textBindVar;
    }
};
const parseNode = (node, view, is, app) => {
    if (is) {
        if (parseC[node.type]) {
            parseC[node.type](node, view);
        }
        if (node.options.eventMap) {
            for (let key in node.options.eventMap) {
                node.options.eventMap[key] = parseCEvent(node.options.eventMap[key], view, node, key, app);
            }
        }
        if (Array.isArray(node.children)) {
            node.children.forEach(child => {
                parseNode(child, view, is, app);
            });
        }
        return ;
    }
    if (parse[node.type]) {
        parse[node.type](node, view);
    }
    if (node.options.loop) {
        parseLoop(node, view, is, app);
    }
    if (node.options.eventMap) {
        for (let key in node.options.eventMap) {
            node.options.eventMap[key] = parseEvent(node.options.eventMap[key], view, node, key, app);
        }
    }
    if (Array.isArray(node.children)) {
        node.children.forEach(child => {
            parseNode(child, view, is, app);
        });
    }
};

export default function(view, parameters, app) {
    let currentParameters = parameters;
    let data = JSON.parse(currentParameters);
    if (Array.isArray(data)) {
        parseNode(data[0], data[0], true, app);
        return JSON.stringify(data);
    }
    data = [JSON.parse(currentParameters)];
    const inputVars = JSON.parse(view.inputVars);
    const vars = inputVars.filter(item => {
        return item.type === 'var';
    });
    const services = inputVars.filter(item => {
        return item.type === 'service';
    });

    data[0].options.vars = vars;
    data[0].options.services = services;

    parseNode(data[0], data[0], false, app);


    return JSON.stringify(data);
}
