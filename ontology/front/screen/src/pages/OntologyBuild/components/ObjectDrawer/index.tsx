import {
  Button,
  Checkbox,
  Drawer,
  Form,
  Grid,
  Input,
  Message,
  Select,
  Spin,
  Table
} from '@arco-design/web-react';
import {
  IconArrowLeft,
  IconArrowRight,
} from '@arco-design/web-react/icon';
import React, { useEffect, useState } from 'react';
import { ObjectIcon, ObjectIconMap } from '../ObjectIcon';
import Title from '../Title';
import {
  objectTypeDetail,
  objectTypeSave,
  objectTypeTableColumn,
  objectTypeTableList,
  objectTypeUpdate,
} from './api';
import './index.less';
import { useTranslation } from 'react-i18next';

const FormItem = Form.Item;
const Option = Select.Option;

interface ObjectDrawerProps {
  visible: boolean;
  id?: string;
  objectList: any[];
  onCancel: () => void;
  onOk: (data: any) => void;
}

const ObjectDrawer: React.FC<ObjectDrawerProps> = ({ visible, id, objectList, onCancel, onOk }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [reversedStates, setReversedStates] = useState<Record<string, boolean>>({});
  const [relations, setRelations] = useState<any[]>([]);
  const [checkedRelations, setCheckedRelations] = useState<string[]>([]);
  const [relationInputs, setRelationInputs] = useState<Record<string, string>>({});
  const toggleDirection = (itemId: string) => {
    setReversedStates(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleOk = async () => {
    setLoading(true);

    try {
      let res = { data: { success: false, data: {} } };
      const formData = form.getFieldsValue();
      const _actions = actions.map(item => {
        const labelMap = {
          create: t('create'), // "创建"
          update: t('edit'), // "编辑"
          delete: t('delete'), // "删除"
        };
        return {
          id: `${formData.name}_${item}`,
          label: `${labelMap[item]}${formData.label}`,
          name: `${formData.name}_${item}`,
          objectId: formData.name,
          type: item
        };
      });
      if (id) {
        res = await objectTypeUpdate({
          id,
          ...formData,
          attrs: datasetFields,
          action: _actions,
        });
      } else {
        res = await objectTypeSave({
          ...formData,
          attrs: datasetFields,
          action: _actions,
        });
      }

      const { success, data } = res.data;

      if (success) {
        onOk(data);
        Message.success(t('save.success')); // "保存成功"
      } else {
        Message.error(t('save.failed')); // "保存失败"
      }
    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  };

  const [dataset, setDataset] = useState([]);

  const getDataset = async () => {
    try {
      const res = await objectTypeTableList({});

      const { data, success } = res.data;

      if (success) {
        setDataset(data || []);
      }
    } catch (error) {}
  };

  const getFields = async (id: string) => {
    try {
      const res = await objectTypeTableColumn({ id });

      const { data, success } = res.data;

      if (success) {
        setDatasetFields(data || []);
      }
    } catch (error) {}
    return [];
  };

  const columns = [
    {
      title: t('serial.number'), // "序号"
      dataIndex: 'index',
      width: 80,
      align: 'center' as const,
      render: (text: any, record: any, index: number) => index + 1,
    },
    {
      title: t('property.chinese.name'), // "属性中文名"
      dataIndex: 'label',
    },
    {
      title: t('property.english.name'), // "属性英文名"
      dataIndex: 'name',
    },
    {
      title: t('description.field'), // "属性描述"
      dataIndex: 'attrName',
      render: (text: any, record: any, index: number) => record.attrName || '-',
    },
  ];

  const [actions, setActions] = useState([]);

  const [form] = Form.useForm();

  const [datasetFields, setDatasetFields] = useState([]);
  const changeDataset = (val: string) => {
    getFields(val);
  };
  const processRelationData = (links: any[], currentObjectName: string) => {
    const checkedIds: string[] = [];
    const inputs: Record<string, string> = {};
    const reverses: Record<string, boolean> = {};
  
    links.forEach(link => {
      // 如果当前对象是源对象
      if (link.sourceName === currentObjectName) {
        checkedIds.push(link.targetName);
        inputs[link.targetName] = link.sourceTag || link.desc || '';
        reverses[link.targetName] = false; // 正向关系
      }
      // 如果当前对象是目标对象
      else if (link.targetName === currentObjectName) {
        checkedIds.push(link.sourceName);
        inputs[link.sourceName] = link.sourceTag || link.desc || '';
        reverses[link.sourceName] = true; // 反向关系
      }
    });
  
    setRelations(links);
    setCheckedRelations(checkedIds);
    setRelationInputs(inputs);
    setReversedStates(reverses);
  };
  const getData = async () => {
    try {
      const res = await objectTypeDetail({
        id,
      });

      const { data, success } = res.data;
      if (success) {
        console.log(data);
        // 确保设置初始值时包含默认的 icon 值
        const formData = data.info || {};
        if (!formData.icon) {
          form.setFieldsValue({ icon: 'customer' }); // 总是设置默认值
        }
        form.setFieldsValue(formData);
        setDatasetFields(data.column || []);
        setActions(
          (data.action || []).map(item => {
            const nameArr = (item.name || '').split('_');
            return nameArr[1];
          }),
        );
        if (data.link && Array.isArray(data.link)) {
          processRelationData(data.link, formData.name);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };
  // 处理关系变更
  const handleRelationChange = (values: string[]) => {
    setCheckedRelations(values);
  };

  // 处理关系描述输入
  const handleRelationInputChange = (itemId: string, value: string) => {
    setRelationInputs(prev => ({
      ...prev,
      [itemId]: value
    }));
  };
  useEffect(() => {
    if (visible) {
      if (id) {
        getData();
      } else {
        form.setFieldsValue({ icon: 'customer' });
      }
      getDataset();
    } else {
      form.resetFields();
      setDatasetFields([]);
      setActions([]);
    }
  }, [visible, id]);
  
  const watchedIcon = Form.useWatch('icon', form);
  const watchedLabel = Form.useWatch('label', form);

  const getDrawerTitle = () => {
    return id ? t('edit.object') : t('new.object'); // "编辑对象" : "新建对象"
  };

 return (
  <Drawer
    getPopupContainer={() => {
      return document.querySelector('.screen-content') || document.body;
    }}
    width="50%"
    title={null}
    visible={visible}
    closable={false}
    footer={null}
    onOk={() => {
      handleOk();
    }}
    onCancel={() => {
      onCancel();
    }}
    className="object-drawer"
  >
    <div className='object-drawer-bg'>
      <img src={new URL(`./assets/bg.png`, import.meta.url).href} />
    </div>
    <div className='object-drawer-wrap'>
      <div className='object-drawer-title'>
        {getDrawerTitle()}
        <img onClick={() => { onCancel(); }} src={new URL(`./assets/close.png`, import.meta.url).href} />
      </div>
      <Spin loading={loading} className="object-drawer-content">
        <Form form={form} layout="vertical" initialValues={{ icon: 'customer' }}>
          <Title className="object-drawer-content-title">{t('basic.info')}</Title>
          <Grid.Row gutter={24}>
            <Grid.Col span={12}>
              <FormItem label={t('name.and.icon')} required className="icon-name-form">
                <Grid.Row gutter={8}>
                  <Grid.Col span={5}>
                    <FormItem field="icon" rules={[{ required: true, message: t('please.select.icon') }]}>
                      <Select
                        dropdownMenuClassName="icon-select-container"
                        getPopupContainer={node => {
                          return node;
                        }}
                        triggerProps={{
                          popupAlign: {
                            bottom: 20,
                          },
                        }}
                        onChange={(val) => {
                          console.log('val', val)
                        }}
                      >
                        {Object.keys(ObjectIconMap).map(key => (
                          <Option key={key} value={key}>
                            <ObjectIcon objectName={key} />
                          </Option>
                        ))}
                      </Select>
                    </FormItem>
                  </Grid.Col>
                  <Grid.Col span={19}>
                    <FormItem field="label" rules={[{ required: true, message: t('enter.chinese.name.required') }]}>
                      <Input placeholder={t('enter.chinese.name')} />
                    </FormItem>
                  </Grid.Col>
                </Grid.Row>
              </FormItem>
            </Grid.Col>
            <Grid.Col span={11} offset={1}>
              <FormItem
                label={t('english.name')}
                field="name"
                rules={[{ required: true, message: t('enter.english.name.required') }]}
              >
                <Input placeholder={t('enter.english.name')} />
              </FormItem>
            </Grid.Col>
          </Grid.Row>

          <FormItem label={t('description.field')} field="desc">
            <Input.TextArea
              placeholder={t('enter.description')}
              maxLength={50}
              showWordLimit
              style={{ minHeight: 62 }}
            />
          </FormItem>
          
          <Title className="object-drawer-content-title">{t('select.dataset')}</Title>
          <FormItem label={t('select.dataset')} field="table" required>
            <Select
              getPopupContainer={node => {
                return node;
              }}
              triggerProps={{
                popupAlign: {
                  bottom: 20,
                },
              }}
              placeholder={t('please.select')}
              style={{ width: '300px' }}
              onChange={changeDataset}
            >
              {(dataset || []).map((item: any) => {
                return (
                  <Option key={item.name} value={item.name}>
                    {item.label}
                  </Option>
                );
              })}
            </Select>
          </FormItem>
          
          <Title className="object-drawer-content-title">{t('configure.properties')}</Title>
          <Grid.Row gutter={24}>
            <Grid.Col span={11}>
              <FormItem
                label={t('primary.key')}
                field="primaryKey"
                rules={[{ required: true, message: t('select.primary.key.required') }]}
              >
                <Select
                  getPopupContainer={node => {
                    return node;
                  }}
                  triggerProps={{
                    popupAlign: {
                      bottom: 20,
                    },
                  }}
                  placeholder={t('please.select')}
                >
                  {(datasetFields || []).map((option: any) => (
                    <Option key={option.name} value={option.name}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </FormItem>
            </Grid.Col>
            <Grid.Col span={11} offset={2}>
              <FormItem
                label={t('title')}
                field="title"
                rules={[{ required: true, message: t('select.title.required') }]}
              >
                <Select
                  placeholder={t('please.select')}
                  getPopupContainer={node => {
                    return node;
                  }}
                  triggerProps={{
                    popupAlign: {
                      bottom: 20,
                    },
                  }}
                >
                  {(datasetFields || []).map((option: any) => (
                    <Option key={option.name} value={option.name}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </FormItem>
            </Grid.Col>
          </Grid.Row>
        </Form>
        
        <Table
          columns={columns}
          data={datasetFields || []}
          pagination={false}
          style={{ marginBottom: '30px' }}
        />
        
        <Title className="object-drawer-content-title">{t('configure.relationships')}</Title>
        <div className="actionConfig-container" style={{ flex: 'none' }}>
          <div className="action-setting-head">
            <div>
              <div className="tip">
                {t('select.related.object')}
              </div>
            </div>
          </div>
          <div className="action-list">
            <Checkbox.Group value={checkedRelations} onChange={handleRelationChange}>
              {objectList
                .filter(item => item.name !== form.getFieldValue('name')) // 排除当前对象自己
                .map((item) => {
                  const isReversed = reversedStates[item.name] || false;
                  const inputValue = relationInputs[item.name] || '';
                  const objectName = item.name || 'default';
                  const itemId = item.id || item.name || `item-${Date.now()}`;
                  return (
                    <Checkbox value={item.name} key={itemId}>
                      <div className="check-content">
                        <div className='name'>
                          <ObjectIcon objectName={objectName} />
                          <div className="action-title">{item.label}</div>
                        </div>
                        <Input 
                          className='desc-input' 
                          value={inputValue}
                          onChange={(value) => handleRelationInputChange(item.name, value)}
                          placeholder={t('enter.relationship.description')}
                        />
                        <div 
                          className='direction' 
                          onClick={(e) => {
                            e.preventDefault();
                            toggleDirection(item.name);
                          }}
                        >
                          {isReversed ? <IconArrowLeft /> : <IconArrowRight />}
                          {t('switch.direction')}
                        </div>
                        <div className='name'>
                          <ObjectIcon objectName={watchedIcon} /> {watchedLabel}
                        </div>
                      </div>
                    </Checkbox>
                  );
                })}
            </Checkbox.Group>
          </div>
        </div>
      </Spin>
      <div className='object-drawer-footer'>
        <Button onClick={() => handleOk()} type="primary">
          {t('save')}
        </Button>
      </div>
    </div>
  </Drawer>
);
};

export default ObjectDrawer;
