export interface ServiceActionInterface {
    name: string;
	label: string;
    descr: string;
    method: string;
    autoLoad: Boolean;
    loadType: string;
    fields: Array<any>;
    serviceId: string | null;
    condition: Boolean;
    conditionBindVar: string;
    data: string;
    dataBindVar: string;
    // showConfirm: Boolean;
    // confirmText: string;
    placeholders: string;
    before: string;
    success: string;
    fail: string;
    value: string;
    // successActions: Array<any>;
    // successMsg: string;
    // errorMsg: string;
}

export default class ServiceAction implements ServiceActionInterface {
    name = '';
    stateName = '';
	label = '服务';
    descr = '';
    method = 'get';
    autoLoad = true;
    loadType = '1';
    fields = [];
    serviceId = null;
    condition = true;
    conditionBindVar = '';
    data = '{}';
    dataBindVar = '';
    // showConfirm = false
    // confirmText = ''
    placeholders = '[]';
    before = `function beforeCallback(vars, config) {
    // 通过 vars.params 可以更改查询参数
    // 通过 vars.data 可以更改requestdata
    // 通过 config.header 可以更改 header
    // 通过 config.url 可以更改  url
    /* vars.data = {
    } */
    // console.log(vars, config);
    // 可以查看还有哪些参数可以修改。
}`;
    success = `function successCallback(data) {
    // data.data.b = 1; 修改返回数据结构中的 b 字段为1
    return data.data; // 重要，需返回 data
}`;
    fail = `function failCallback(error){
    // console.log(error);
    // 可以在这里做弹框提示等操作
}`
    // successActions = []
    // successMsg = ''
    // errorMsg = ''
}
