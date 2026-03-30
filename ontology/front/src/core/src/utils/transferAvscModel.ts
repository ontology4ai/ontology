const getMethodName = script => {
  let ret = script.toString();
  ret = ret.replace(/[\n]/g, ' ');
  ret = ret.replace(/[\r]/g, ' ');
  ret = ret.replace(/[\t]/g, ' ');
  ret = ret.replace(/\s+/g, ' ');
  ret = ret.replace(/\(/g, ' ');
  return ret.trim().split(' ')[1];
};
export default (avsc, type) => {
    function parseJavaAnnotation(javaAnnotation, regx) {
        for (let index = 0; index < javaAnnotation.length; index++) {
            const element = javaAnnotation[index];
            if (regx.test(element)) {
                return element;
            }
        }
    }
    const node = JSON.parse(JSON.stringify(avsc));
    node.fields = node.modoModelFieldList;
    let tableName = '';
    let fields = [];
    let oneToMany = [];
    let oneToOne = [];
    let manyToMany = [];
    // const methods = node.methods ? JSON.parse(node.methods) : [];
    // const services = node.services ? JSON.parse(node.services) : [];
    // const listens = node.listens ? JSON.parse(node.listens) : [];
    // 修复导入模型报错
    let methods = [];
    if (node.methods && node.methods.length > 0) {
        methods = JSON.parse(node.methods);
    } else {
        methods = [];
    }
    let services = [];
    if (node.services && node.services.length > 0) {
        services = JSON.parse(node.services);
    } else {
        services = [];
    }
    // let listens = [];
    // if (node.listens && node.listens.length > 0) {
    //     listens = JSON.parse(node.listens);
    // } else {
    //     listens = [];
    // }

    if (node.type && node.type === 'listener') {
        console.log(node.type);
    } else if (type !== 'file') {
        if (node.javaAnnotation) {
            tableName = parseJavaAnnotation(JSON.parse(node.javaAnnotation), /Table\(.*/).match(
                /"(\S*)"/,
            )[1];
        }

        // if (typeof node.fields !== 'string') {
        //     return node;
        // }
        fields = node.fields;
        oneToMany = JSON.parse(node.oneToMany);
        if (node.oneToOne) {
            oneToOne = JSON.parse(node.oneToOne);
        }
        manyToMany = JSON.parse(node.manyToMany);
    } else {
        if (node.javaAnnotation) {
            tableName = parseJavaAnnotation(node.javaAnnotation, /Table\(.*/).match(/"(\S*)"/)[1];
        }
        fields = node.fields;
        oneToMany = node.oneToMany;
        oneToOne = node.oneToOne;
        manyToMany = node.manyToMany;
    }

    const arr = fields.map(field => {
        let key = '';
        if (field.javaAnnotation) {
            key = parseJavaAnnotation(field.javaAnnotation, /^Id/) === 'Id' ? 'Id' : '';
        }

        let str = '';
        let special = '';
        if (/Transient/.test(field.javaAnnotation)) {
            special = 'mapper';
        } else if (field.is_encrypt === '1') {
            special = 'is_encrypt';
        } else if (/CreatedDate/.test(field.javaAnnotation)) {
            special = 'create_dt';
        } else if (/LastModifiedDate/.test(field.javaAnnotation)) {
            special = 'lastupd';
        } else if (/Version/.test(field.javaAnnotation)) {
            special = 'op_lock';
        }
        if (field.vertAuth && Object.keys(field.vertAuth).length > 0) {
            console.log('transferAvscModel', field.vertAuth);
            special = 'vertAuth';
        } else {
            field.vertAuth = {
                nameCascaderVal: [],
                name: '',
                key: '',
                userMapCascaderVal: [],
                userMap: '',
                userKey: '',
                mapKey: '',
                cascadeLvl: '',
            };
        }
        // if (special !== 'op_lock') {
        //     try {
        //         str = parseJavaAnnotation(field.javaAnnotation, /Column\(.*/).match(/\(([^()]+)\)/)[1];
        //     } catch (e) {
        //         // console.log(e, field, node);
        //     }
        // }
        try {
            str = parseJavaAnnotation(field.javaAnnotation, /Column\(.*/).match(/\(([^()]+)\)/)[1];
        } catch (e) {
            // console.log(e, field, node);
        }
        if (node.modelSubType === 'fact') {
            special = field.special;
        }
        const getColumn = name => {
            const reg = new RegExp(`(^|,\\s*)${name}\\s*=\\s*([^,]*)(,|$)`, 'i');
            const r = str.match(reg);
            if (name === 'name') return r ? r[2].match(/"(\S*)"/)[1] : '';
            return r !== null ? r[2] : null;
        };
        const keys = ['lastupd', 'create_dt', 'op_lock', 'is_encrypt'];
        //  console.log('transferAvscModel/field', field)
        // console.log('transferAvscModel/special', special);
        let tlength = null;
        if (keys.indexOf(field.name) > -1) {
            tlength = '--';
        } else if (Number(getColumn('length'))) {
            tlength = Number(getColumn('length'));
        } else {
            tlength = getColumn('length');
        }
        if (!tlength) {
            tlength = '--';
        }

        return {
            vertAuth: field.vertAuth,
            mapper: field.mapper,
            name: field.name,
            columnName: getColumn('name'),
            type: field.type,
            // length: keys.indexOf(field.name) > -1 ? '' : Number(getColumn('length')),
            length: tlength,
            nullable: keys.indexOf(field.name) > -1 ? false : getColumn('nullable') !== 'false',
            doc: node.topic === 'inner_domain' ? field.doc || field.name : field.doc || '',
            primary: !!key,
            manyToOne: field.manyToOne || '',
            oneToOne: field.oneToOne || '',
            parent: field.parent || false,
            precision: '',
            special,
            rule: field.rule,
            domain: '',
            keyWords: '',
            modaModelRelation: field.modaModelRelation,
        };
    });
    const data = {
        id: node.id,
        modelId: node.modelId ? node.modelId : null,
        namespace: node.namespace,
        doc: node.doc || '',
        topic: node.topic || '',
        loc: node.loc || '',
        appName: node.appName,
        language: 'zh-cn',
        expand: false,
        type: node.type,
        name: node.name,
        modelType: node.modelType,
        modelSubType: node.modelSubType,
        valueObjectSql: node.valueObjectSql,
        tableName,
        oneToMany,
        oneToOne,
        manyToMany,
        fields: arr,
        modaModelListenerList: node.modaModelListenerList,

        // 过滤掉映射字段
        fieldsDelMappers: arr.filter(field => {
            if (/Transient/.test(field.javaAnnotation)) {
                field.special = 'mapper';
            }
            return field.special !== 'mapper';
        }),
        mappers: arr.filter(field => {
            if (/Transient/.test(field.javaAnnotation)) {
                field.special = 'mapper';
            }
            return field.special === 'mapper';
        }),
        methods: methods.map((item, index) => ({
            key: index,
            name: getMethodName(item),
            script: item,
        })),
        services: services.map((item, index) => ({
            key: index,
            name: getMethodName(item),
            script: item,
        })),
        // listens: listens.map(item => {
        //     return item;
        //     // return {
        //     //     name: this.getMethodName(item),
        //     //     script: item
        //     // };
        // }),
        data: node.data,
    };
    return data;
};