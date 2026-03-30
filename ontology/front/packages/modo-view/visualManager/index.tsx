import React, { useState, useRef, useEffect } from 'react';

import {
  Layout,
  Card,
  Pagination,
  Modal,
  Form,
  Input,
  Button,
  Radio,
  Typography,
  Space,
  Dropdown,
  Menu,
  Message
} from '@arco-design/web-react';

import FilterForm from '@/components/FilterForm';
import { IconPlus } from 'modo-design/icon';
import { IconMore, IconUser, IconSchedule } from '@arco-design/web-react/icon';

import './style/index.less';
import {
  getCardList,
  deleteView,
  getModelList,
  saveView,
  updateView
} from './api';

import model1Img from './img/3dModel1.png';
import model2Img from './img/3dModel2.png';
import model3Img from './img/3dModel3.png';

const Header = Layout.Header;
const Footer = Layout.Footer;
const Content = Layout.Content;
const FormItem = Form.Item;
const { Meta } = Card;
const TextArea = Input.TextArea;

const defaultForm = {
  id: '',
  name: '',
  label: '',
  modelId: '',
  descr: ''
};

const visualManager: React.FC = (props) => {
  const [listData, setListData] = useState([]);
  const [modelData, setModelData] = useState([]);
  const [size, setSize] = useState('default');
  const [visible, setVisible] = useState();
  const [formValue, setFormValue] = useState();
  const [modelImgMap, setModelImgMap] = useState({});

  const [pagination, setPagination] = useState({
    pageSize: 10,
    current: 1
  });
  const [totalPage, setTotalPage] = useState(0);

  const currentView = useRef();
  const formRef = useRef();
  const typeRef = useRef();
  const pageRef = useRef();
  const [form] = Form.useForm();

  pageRef.current = pagination;

  const dropList = (
    <Menu onClickMenuItem={(val)=>{toDo(val)}} >
      <Menu.Item key='edit'>编辑</Menu.Item>
      <Menu.Item key='design'>设计</Menu.Item>
      <Menu.Item key='delete'>删除</Menu.Item>
    </Menu>
  );

  useEffect(() => {
    searchCardList({name: ''});
    searchModelList();
  }, []);

  const onChangePage = (current:number, pageSize:number) => {
    setPagination({
      pageSize: pageSize,
      current: current
    });
    pageRef.current = {
      pageSize: pageSize,
      current: current
    };
    searchCardList();
  };

  // 查询卡片列表
  const searchCardList = (values: any) => {
    // 可传可以不传filter
    console.log('values', values);
    // setFilterData(values);
    const name = values && values.name ? values.name : '~%%';
    const params = {
      _orGroup_: `name,label=${name}`,
      sort: '-time',
      offset: (pageRef.current.current - 1) * pageRef.current.pageSize,
      limit: pageRef.current.pageSize
    };
    getCardList(params)
    .then(res => {
      console.log('saveTreeNodeData', res);
      if (res && res.data && res.data.success) {
        setListData(res.data.data.content);
        setTotalPage(res.data.data.totalElements);
      } else {
        Message.error('查询失败!');
      }
    })
    .catch(error => {
      console.log(error);
      Message.error('查询失败!');
    });
    // getList(values, pagination.pageSize, 1);
  };

  // 查询3D模型
  const searchModelList = () => {
    console.log('searchModelList');
    getModelList()
    .then(res => {
      console.log('saveTreeNodeData', res);
      if (res && res.data && res.data.success) {
        setModelData(res.data.data);
        let map = {};
        for(var i in res.data.data) {
          map[res.data.data[i].id] = res.data.data[i].img;
        }
        setModelImgMap(map);
      } else {
        Message.error('查询失败!');
      }
    })
    .catch(error => {
      console.log(error);
      Message.error('查询失败!');
    });
    // getList(values, pagination.pageSize, 1);
  };

  const toDo = (val) => {
    console.log('toDo', val, currentView.current);
    if(val === 'edit') {
      setVisible(true);
      form.resetFields();
      form.setFieldsValue({ ...currentView.current });
    } else if(val === 'design') {
      window.open('');
    } else {
      delView(currentView.current)
    }
  };

  const delView = (val) => {
    console.log('deleteView', val);
    deleteView(val)
    .then(res => {
      console.log('deleteView', res);
      if (res && res.data && res.data.success) {
        Message.success('删除成功!');
        searchCardList();
      } else {
        Message.error('删除失败!');
      }
    })
    .catch(error => {
      console.log(error);
      Message.error('删除失败!');
    });
  };

  const toSaveView = (type) => {
    const formData = form.getFieldsValue();
    let datas = { ...formData };
    datas.img = modelImgMap[datas.modelId];
    console.log('toSaveView', datas);
    form.validate().then(values => {
      if (currentView.current.id && currentView.current.id !== '') {
        let datas = { ...currentView.current, ...formData };
        datas.img = modelImgMap[datas.modelId];
        update(datas);
      } else {
        let datas = { ...formData };
        datas.img = modelImgMap[datas.modelId];
        save(datas);
      }

    }).catch(error => {
      console.log(error);
      Message.error('保存失败!');
    });
  };

  const save = (datas) => {
    console.log('save', datas);
    saveView(datas)
    .then(res => {
      console.log('saveTreeNodeData', res);
      if (res && res.data && res.data.success) {
        Message.success('保存成功!');
        searchCardList();
        setVisible(false);
      } else {
        console.log(error);
        Message.error('保存失败!');
      }
    })
    .catch(error => {
      console.log(error);
      Message.error('保存失败!');
    });
  };

  const update = (datas) => {
    console.log('update', datas);
    updateView(datas)
    .then(res => {
      console.log('saveTreeNodeData', res);
      if (res && res.data && res.data.success) {
        Message.success('保存成功!');
        searchCardList();
        setVisible(false);
      } else {
        console.log(error);
        Message.error('保存失败!');
      }
    })
    .catch(error => {
      console.log(error);
      Message.error('保存失败!');
    });
  };

  const onValuesChange = (changeValue, values) => {
    console.log('onValuesChange: ', changeValue, values);

    // setFormValue({...formValue, ...values});

  };

  return (
    <div className="page-visual-manager">
      <Layout>
        <Header>
          <FilterForm
              initialValues={{ name: '' }}
              fields={[
                {
                  type: 'input',
                  field: 'name',
                  label: '页面名称',
                  options: {
                    placeholder: '请输入页面名称',
                  },
                }
              ]}
              search={searchCardList}
            ></FilterForm>
        </Header>
        <Content>
           {/*<div className='card-add-style'>
             <div className='add-block'>
               <IconPlus />
             </div>
           </div>*/}
           <Card
              hoverable
              bordered={false}
              className='card-hover-style card-add-style'
            >
              <div className='add-block' onClick={()=>{currentView.current={...defaultForm};form.resetFields();form.setFieldsValue({...defaultForm});setVisible(true)}} >
                <IconPlus />
              </div>
            </Card>
           {
             listData.map((item, index)=>{
               return (
                 <Card
                  key={index}
                  bordered={false}
                  className='card-hover-style'
                  hoverable
                  cover={
                    <div style={{ height: 190, overflow: 'hidden' }}>
                      <img
                        style={{ width: '100%', height: '100%' }}
                        alt='dessert'
                        src={item.img}
                      />
                    </div>
                  } >
                    {/*<Meta
                    title={item.label}
                    description={
                      <>
                        {item.time}
                      </>
                    }
                    />*/}
                    <div className="card-content-info" >
                      <span className="card-content-item item-title">{item.label}</span>
                      <span className="card-content-item item-oper oper-show">
                        <Dropdown droplist={dropList} position='bl' onVisibleChange={ (val)=>{ if(val) { currentView.current =  item} } } getPopupContainer={(val) => document.getElementsByClassName('item-oper')[index] }>
                          <IconMore />
                        </Dropdown>
                      </span>
                    </div>
                    <div className="card-content-info" >
                      <span className="card-content-item"><IconSchedule />{item.time}</span>
                      <span className="card-content-item item-user"><IconUser />{item.createUser}</span>
                    </div>
                  </Card>)
            })}
          </Content>
          {  totalPage > pagination.pageSize && (<Footer>
                      <Pagination total={totalPage} current={pagination.current} pageSize={pagination.pageSize} onChange={onChangePage} showTotal showJumper sizeCanChange />
                    </Footer>)
          }
          </Layout>
          <Modal
            className="add-modal"
            title={currentView.current && currentView.current.id ? '编辑': '新建'}
            visible={visible}
            okText='保存'
            cancelText='取消'
            onOk={() => { toSaveView('new'); } }
            onCancel={() => setVisible(false)}
            autoFocus={false}
            focusLock={true}
          >
            <Form
              form={form}
              labelCol={{ style: { flexBasis: 80 } }}
              wrapperCol={{ style: { flexBasis: 'calc(100% - 100px)' } }}
              autoComplete='off'
              onValuesChange={onValuesChange}
            >
              <FormItem
                label='英文名'
                field='name'
                required
                rules={[
                  {
                    validator(value, cb) {
                      if (!value) {
                        return cb('请填写英文名');
                      }
                      return cb();
                    },
                  },
                ]}>
                <Input placeholder='请输入页面英文名' />
              </FormItem>
              <FormItem
                label='中文名'
                field='label'
                required
                rules={[
                  {
                    validator(value, cb) {
                      if (!value) {
                        return cb('请填写中文名');
                      }
                      return cb();
                    },
                  },
                ]}>
                <Input placeholder='请输入页面中文名' />
              </FormItem>
              <FormItem
                label='3D模型'
                field='modelId'
                required
                rules={[
                  {
                    validator(value, cb) {
                      if (!value) {
                        return cb('请选择3D模型');
                      }
                      return cb();
                    },
                  },
                ]}>
                <Radio.Group name='card-radio-group'>
                  {modelData.map((item) => {
                    return (
                      <Radio key={item.id} value={item.id}>
                        {({ checked }) => {
                          return (
                            <Space
                              align='start'
                              className={`custom-radio-card ${checked ? 'custom-radio-card-checked' : ''}`}
                            >
                              {/*<div className='custom-radio-card-mask'>
                                <div className='custom-radio-card-mask-dot'></div>
                              </div>*/}
                              <div>
                                <div style={{ height: 120, overflow: 'hidden', borderRadius: '4px 4px 0px 0px' }}>
                                  <img
                                    style={{ width: '100%'}}
                                    alt='dessert'
                                    src={item.img}
                                  />
                                </div>
                                <div className='custom-radio-card-title'>{item.label}</div>
                              </div>
                            </Space>
                          );
                        }}
                      </Radio>
                    );
                  })}
                </Radio.Group>
              </FormItem>
              <FormItem label='描述' field='descr'>
                <TextArea placeholder='请输入页面描述' style={{ minHeight: 64 }} />
              </FormItem>
            </Form>
          </Modal>
        </div>
  );
};

export default visualManager;
