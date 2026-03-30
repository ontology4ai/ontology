import execExpression from './execExpression';
export default function (view, vars) {
    const publicStore = view.props.get$this();

    const action = {};
    const state = {};
    const storeI18n = {};

    const expArr = vars;

    const {stores} = view.props;

    function initVar(name, value) {
        state[name] = execExpression({$this: publicStore}, value);

        const uName = name.substring(0, 1).toLocaleUpperCase() + name.substring(1);

        action[`set${uName}`] = (value) => {
            view.props.dispatch({
                type: 'SETSTATE',
                name,
                value
            });
        };
        action[`get${uName}`] = () => {
            return execExpression({$this: publicStore}, view.props.get$this()[name]);
        }
    }

    expArr.forEach(exp => {
        initVar(exp.name, exp.value);
    });

    if (Array.isArray(stores)) {
        stores.forEach(store => {
            initVar(store.name + 'Store', `{
                columnModel: [],
                loading: true,
                count: 0,
                fields: [],
                message: null,
                root: []
            }`);
        })
    }

    const { params, i18n } = view.props;

    if (params) {
        for (let key in params) {
            if (state[key]) {
                state[key] = params[key];
            } else {
                initVar(key, JSON.stringify(params[key]));
            }
        }
    }

    if (i18n) {
        for (let lang in i18n) {
            try {
                storeI18n[lang] = JSON.parse(i18n[lang]);
            } catch(e) {
                storeI18n[lang] = {};
            }
        }
    }

    view.props.dispatch({
        type: 'SETSTORE',
        store: {
            initVars: true,
            $refs: publicStore.$refs,
            action,
            state,
            i18n: storeI18n
        }
    });
}
