import React, { useState, useEffect, use } from 'react';
import { Drawer, Descriptions, Input, Table, Button, Message, Spin } from '@arco-design/web-react';
import Title from '../Title';
import './index.less';
import icon from './assets/icon.svg';
import { IconSearch } from '@arco-design/web-react/icon';
import createActionIcon from '../ObjectDrawer/assets/create-action-icon.svg';
import editActionIcon from '../ObjectDrawer/assets/edit-action-icon.svg';
import deleteActionIcon from '../ObjectDrawer/assets/delete-action-icon.svg';
import codeViewTitleIcon from './assets/code-view-title-icon.svg';
import { objectTypeDetail, objectTypeDelete } from '../ObjectDrawer/api';
import { objectTypeTableData } from './api';
import { actionTypeDetail } from '../ActionDrawer/api';

interface ObjectDetailDrawerProps {
  visible: boolean;
  id?: string;
  onCancel: () => void;
  onOk: (data: any) => void;
  onDelete:(id?:string) => void;
}
const ObjectDetailDrawer: React.FC<ObjectDetailDrawerProps> = ({ visible, id, onCancel, onOk,onDelete }) => {
  const [loading, setLoading] = useState(false);
  const handleOk = () => {
    onOk({});
  };

  const descriptionsItem = [
    {
      label: '描述',
      key: 'desc',
      value: '',
      span: 3,
    },
   /* {
      label: '分组',
      key: 'group',
      value: '',
    },
    {
      label: '数据源',
      key: 'dataSource',
      value: '',
    },
    {
      label: '模式',
      key: 'mode',
      value: '',
    },*/
    {
      label: '数据集',
      key: 'table',
      value: '',
      span: 3,
    },
  ];
  const [descriptionsData, setDescriptionsData] = useState([]);

  const [attrList, setAttrList] = useState([]);

  const [columns, setColumns] = useState([]);
  const [tableData, setTableData] = useState([]);

  const getTableData = async () => {
    try {
      const res = await objectTypeTableData({ id });

      const { data, success } = res.data;

      if (success) {
        setTableData(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const [code, setCode] = useState('');
  const getActionCode = async actionId => {
    try {
      const res = await actionTypeDetail({
        id: actionId,
      });
      const { data, success } = res.data;
      if (success) {
        setCode(data.code);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const [objectName, setObjectName] = useState('');
  const [objectLabel, setObjectLabel] = useState('');
  const [actions, setActions] = useState([]);
  const getData = async () => {
    setLoading(true);
    try {
      const res = await objectTypeDetail({ id });

      const { success, data } = res.data;

      if (success) {
        setDescriptionsData(
          descriptionsItem.map(item => {
            return {
              ...item,
              value: data.info[item.key],
            };
          }),
        );

        const indexColumn = [
          {
            title: '序号',
            dataIndex: 'index',
            width: 80,
            align: 'center',
            render: (text, record, index) => {
              return index + 1;
            },
          },
        ];
        setColumns(
          indexColumn.concat(
            (data.column || []).map(item => {
              return {
                title: (
                  <div>
                    <div>{item.name}</div>
                    <div>{item.type}</div>
                  </div>
                ),
                dataIndex: item.name,
                align: 'center',
              };
            }),
          ),
        );

        setAttrList(data.column || []);

        setObjectName(data.info.name);
        setObjectLabel(data.info.label);

        setActions(data.action || []);

        getActionCode(data.action?.[0] ? data.action[0].id : '');
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (visible) {
      if (id) {
        getData();
        getTableData();
      }
    } else {
      setDescriptionsData(
        descriptionsItem.map(item => {
          return {
            ...item,
            value: '',
          };
        }),
      );
    }
  }, [visible]);

  const handleDelete = async () => {
    try {
      const res = await objectTypeDelete({ ids: [id] });

      const { data, success, message } = res.data;

      if (success) {
        Message.success('删除成功');
        onOk(data);
      } else {
        Message.error(message || '删除失败');
      }
    } catch (error) {}
  };
  const handleDeleteNode = ()=>{
    onCancel();
    onDelete(id);
  };
  return (
    <Drawer
      getPopupContainer={() => {
        return document.querySelector('.screen-content') || document.body;
      }}
      width="70%"
      title="对象详情"
      visible={visible}
      footer={
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button onClick={() => handleDeleteNode()} type="primary" status="danger">
            删除
          </Button>
          <Button onClick={() => handleOk()} type="primary">
            关闭
          </Button>
        </div>
      }
      onOk={() => {
        handleOk();
      }}
      onCancel={() => {
        onCancel();
      }}
      className="object-detail-drawer"
    >
      <Spin loading={loading} className="object-detail-content">
        <div className="object-detail-content-item">
          <Descriptions
            colon=":"
            layout="inline-horizontal"
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={icon} alt="icon" />
                <span>
                  {objectLabel || ''}（{objectName || ''}）
                </span>
              </div>
            }
            data={descriptionsData}
          />
        </div>
        <div className="object-detail-content-item">
          <Title className="object-detail-title">属性</Title>
          <div className="object-detail-attr">
            <div className="object-detail-attr__left">
              {/*<Input
                style={{ width: '100%', height: 45 }}
                placeholder="请输入关键字"
                suffix={<IconSearch />}
              />*/}
              <div className="object-detail-attr-list">
                {attrList.map(item => {
                  return (
                    <div key={item.name} className="object-detail-attr-list-item">
                      <div className="object-detail-attr-list-item__name">{item.name}</div>
                      <div className="object-detail-attr-list-item__label">{item.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="object-detail-attr__right">
              <Table
                columns={columns}
                data={tableData}
                pagination={false}
                scroll={{
                  y: 256,
                }}
              />
            </div>
          </div>
        </div>
        <div className="object-detail-content-item">
          <Title className="object-detail-title">动作类型</Title>
          <div className="object-detail-action">
            <div className="object-detail-action__left">
              {actions.map(item => {
                return (
                  <div
                    className="object-detail-action-item"
                    onClick={() => {
                      getActionCode(item.id);
                    }}
                  >
                    <img src={createActionIcon} />
                    {item.label}对象实例
                  </div>
                );
              })}
            </div>
            <div className="object-detail-action__right">
              <div className="object-detail-action-view-header">
                <img src={codeViewTitleIcon} alt="icon" />
                代码预览
              </div>
              <div className="object-detail-action-view-code">{code}</div>
            </div>
          </div>
        </div>
      </Spin>
    </Drawer>
  );
};

export default ObjectDetailDrawer;
