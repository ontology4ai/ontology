export default function(model) {
	let { doc, name } = model;
    name = name.substring(0, 1).toLocaleLowerCase() + name.substring(1);
	return [
        {

            type: 'GET',
            modelName: `${name}`,
            url: `/_api/${name}/{id}`,
            descr: `${doc}-通过{id}获取对象`,
            successMsg: '',
            errorMsg: ''
        },
        {
            type: 'POST',
            modelName: `${name}`,
            url: `/_api/${name}/create`,
            descr: `${doc}-保存对象信息`,
            successMsg: '新建成功',
            errorMsg: '新建失败'
        },
        {
            type: 'POST',
            modelName: `${name}`,
            url: `/_api/${name}/create/cascade`,
            descr: `${doc}-保存一对多信息`,
            successMsg: '新建成功',
            errorMsg: '新建失败'
        },
        {
            type: 'POST',
            modelName: `${name}`,
            url: `/_api/${name}/createBatch`,
            descr: `${doc}-批量保存对象信息`,
            successMsg: '保存成功',
            errorMsg: '保存失败'
        },
        {
            type: 'POST',
            modelName: `${name}`,
            url: `/_api/${name}/delete/{id}`,
            descr: `${doc}-删除对象`,
            successMsg: '删除成功',
            errorMsg: '删除失败'
        },
        {
            type: 'POST',
            modelName: `${name}`,
            url: `/_api/${name}/deleteBatch`,
            descr: `${doc}-批量删除对象信息`,
            successMsg: '删除成功',
            errorMsg: '删除失败'
        },
        {
            type: 'GET',
            modelName: `${name}`,
            url: `/_api/${name}/find`,
            descr: `${doc}-通过参数查询对象`,
            successMsg: '',
            errorMsg: ''
        },
        {
            type: 'GET',
            modelName: `${name}`,
            url: `/_api/${name}/list`,
            descr: `${doc}-获取所有对象`,
            successMsg: '',
            errorMsg: ''
        },
        {
            type: 'GET',
            modelName: `${name}`,
            url: `/_api/${name}/list/{ids}`,
            descr: `${doc}-通过{ids}获取对象列表,逗号拼接`,
            successMsg: '',
            errorMsg: ''
        },
        {
            type: 'GET',
            modelName: `${name}`,
            url: `/_api/${name}/search`,
            descr: `${doc}-通过参数分页查询对象`,
            successMsg: '',
            errorMsg: ''
        },
        {
            type: 'POST',
            modelName: `${name}`,
            url: `/_api/${name}/update`,
            descr: `${doc}-更新对象信息`,
            successMsg: '保存成功',
            errorMsg: '保存失败'
        },
        {
            type: 'POST',
            modelName: `${name}`,
            url: `/_api/${name}/update/cascade`,
            descr: `${doc}-更新一对多对象信息`,
            successMsg: '保存成功',
            errorMsg: '保存失败'
        },
        {
            type: 'POST',
            modelName: `${name}`,
            url: `/_api/${name}/updateBatch`,
            descr: `${doc}-批量更新对象信息`,
            successMsg: '保存成功',
            errorMsg: '保存失败'
        }
    ]
}