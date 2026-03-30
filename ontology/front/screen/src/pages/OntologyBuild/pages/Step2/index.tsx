import React, { forwardRef, useCallback, useState, useImperativeHandle, useRef, useEffect } from 'react';
import { Button, Modal, Dropdown, Menu } from '@arco-design/web-react';
import { IconDown } from '@arco-design/web-react/icon';
// import Flow from './pages/Flow/index1';
import Flow from '../../components/Graph';
import RoundRect from '../../../../components/RoundRect';
import CreateObj from './pages/CreateObj';
import ImportOntologyModal from '../../components/ImportOntologyModal';
import ObjectDrawer from '../../components/ObjectDrawer';
import ObjectDetailDrawer from '../../components/ObjectDetailDrawer';
import mockObjects from './mock/objects';
import iconMap from './icon';
import axios from 'axios';
import './style/index.less';
import RelationDrawer from '../../components/relationDrawer';
import ActionDrawer from '../../components/ActionDrawer';
import LogicDrawer from '../../components/LogicDrawer';
import PublishDrawer from '../../components/PublishDrawer';
import { ObjectIcon } from '../../components/ObjectIcon';
import { useTranslation } from 'react-i18next';

const Step2 = forwardRef((props, ref) => {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.language === 'en-US';
  const [dataMap, setDataMap] = useState({
    object: [],
    action: [],
    logic: [],
  });
  const [active, setActive] = useState('object');
  const [visible, setVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [addIconVisible, setAddIconVisible] = useState(false);
  const [activeNode, setActiveNode] = useState(null);
  const [activeEdge, setActiveEdge] = useState(null);
  const [importType, setImportType] = useState('file');
  const flowRef = useRef();
  const dataMapRef = useRef(dataMap);

  // 翻译映射表
  const labelMap = {
    object: t('objects'), // "对象"
    action: t('actions'), // "动作"
    logic: t('logic.list'), // "逻辑"
  };

  useEffect(() => {
    axios.get(`/ontology_show/_api/object/type/list`).then(res => {
      if (Array.isArray(res.data.data)) {
        const currentDataMap = { ...dataMapRef.current };
        currentDataMap['object'] = res.data.data;
        dataMapRef.current = currentDataMap;
        setDataMap({
          ...currentDataMap,
        });
      }
    });
    axios.get(`/ontology_show/_api/action/type/list`).then(res => {
      if (Array.isArray(res.data.data)) {
        const currentDataMap = { ...dataMapRef.current };
        currentDataMap['action'] = res.data.data;
        dataMapRef.current = currentDataMap;
        setDataMap({
          ...currentDataMap,
        });
      }
    });
    axios.get('/ontology_show/_api/logic/type/list').then(res => {
      if (Array.isArray(res.data.data)) {
        const currentDataMap = { ...dataMapRef.current };
        currentDataMap['logic'] = res.data.data;
        dataMapRef.current = currentDataMap;
        setDataMap({
          ...currentDataMap,
        });
      }
    });
  }, []);

  const exportOntology = (key: string) => {
    setVisible(true);
    setImportType(key);
  };

  const [objectDrawerVisible, setObjectDrawerVisible] = useState(false);
  const [objectId, setObjectId] = useState('');

  const createObject = () => {
    setObjectDrawerVisible(true);
  };

  const [actionDrawerVisible, setActionDrawerVisible] = useState(false);
  const [actionId, setActionId] = useState('');
  const createAction = () => {
    setActionDrawerVisible(true);
  };

  const [logicDrawerVisible, setLogicDrawerVisible] = useState(false);
  const [logicId, setLogicId] = useState('');
  const createLogic = () => {
    setLogicDrawerVisible(true);
  };

  const create = () => {
    switch (active) {
      case 'object':
        setObjectId('');
        createObject();
        break;
      case 'action':
        setActionId('');
        createAction();
        break;
      case 'logic':
        setLogicId('');
        createLogic();
        break;
    }
  };

  const editObject = () => {
    setObjectDrawerVisible(true);
  };

  const editAction = () => {
    setActionDrawerVisible(true);
  };

  const editLogic = () => {
    setLogicDrawerVisible(true);
  };

  const [relationDrawer, setRelationDrawer] = useState(false);
  const [relationSourceId, setRelationSourceId] = useState('');
  const [relationTargetId, setRelationTargetId] = useState('');
  const [relationText, setRelationText] = useState('');
  const editRelation = edge => {
    const item = flowRef.current.getEdgeData(edge);
    setRelationSourceId(edge?.source?.cell || '');
    setRelationTargetId(edge?.target?.cell || '');
    setRelationText(item?.text || '');
    setRelationDrawer(true);
  };

  const edit = item => {
    console.log(item);
    switch (active) {
      case 'object':
        setObjectId(item.id);
        editObject();
        break;
      case 'action':
        setActionId(item.id);
        editAction();
        break;
      case 'logic':
        setLogicId(item.id);
        editLogic();
        break;
    }
  };

  const [objectDetailDrawerVisible, setObjectDetailDrawerVisible] = useState(false);

  const openObjectDetail = item => {
    // setObjectId(item.id);
    // setObjectDetailDrawerVisible(true);
  };

  const [publishDrawerVisible, setPublishDrawerVisible] = useState(false);
  const publish = () => {
    setPublishDrawerVisible(true);
  };

  const handleCreate = (type, data) => {
    const currentDataMap = {
      ...dataMap,
    };
    currentDataMap[type] = [...currentDataMap[type], data];
    dataMapRef.current = currentDataMap;
    setDataMap(currentDataMap);
    if (type === 'object') {
      flowRef.current.addNode(data);
    }
  };

  const handleUpdate = (type, data) => {
    console.log(type, data);
    const currentDataMap = {
      ...dataMap,
    };
    const currentNode = currentDataMap[type].find(n => n.id === data.id);
    if (currentNode) {
      const index = currentDataMap[type].indexOf(currentNode);
      currentDataMap[type].splice(index, 1, {
        ...currentNode,
        ...data,
      });
      dataMapRef.current = currentDataMap;
      setDataMap(currentDataMap);
      if (type === 'object') {
        flowRef.current.setNodeData(data.id, data);
      }
    }
  };

  const handleUpdateEdge = data => {
    flowRef.current.setEdgeData(activeEdge, data);
  };

  useImperativeHandle(ref, () => ({
    publish
  }), [publish]);

  // 获取新建按钮的文本
  const getCreateButtonText = () => {
    return `${labelMap[active]}`; // "新建${labelMap[active]}"
  };

  return (
    <div className={`build-step-2 ${isEnglish ? 'en' : ''}`}>
      {!previewVisible && (
        <div className="build-flow-header">
          <div className="type-list">
            {[
              {
                icon: 'obj-icon',
                key: 'object',
              },
              {
                icon: 'logic-icon',
                key: 'logic',
              },
              {
                icon: 'action-icon',
                key: 'action',
              },
            ].map((item, index) => {
              const iconSrc = active === item.key 
              ? new URL(`./imgs/${item.icon}-active.png`, import.meta.url).href
              : new URL(`./imgs/${item.icon}.png`, import.meta.url).href;
              return (
                <div
                  className={`type-item ${active === item.key ? 'active' : ''}`}
                  onClick={() => {
                    setActive(item.key);
                  }}
                  key={index}
                >
                  <img src={iconSrc} />
                  <span className='type-item-text'>{labelMap[item.key]}</span>
                  {active === item.key && <img className='bottom-line' src={new URL(`./imgs/line.png`, import.meta.url).href} />}
                </div>
              );
            })}
          </div>
          <div className="oper-group">
            <Dropdown
              className="import-ontology-dropdown"
              trigger={'click'}
              position={'bottom'}
              triggerProps={{
                position: 'bottom',
                className: 'import-ontology-trigger',
              }}
              droplist={
                <Menu
                  className="import-ontology-dropdown-menu"
                  style={{
                    transform: `scale(${document.body.offsetWidth / 1920})`,
                    transformOrigin: 'top center',
                  }}
                  onClickMenuItem={exportOntology}
                >
                  <Menu.Item key="file">{t('ontology.file')}</Menu.Item> {/* "本体文件" */}
                  <Menu.Item key="code">{t('ontology.code')}</Menu.Item> {/* "本体代码" */}
                </Menu>
              }
            >
              <Button className="import-ontology-btn">
                <span className="text">
                  {t('import.ontology')} {/* "导入本体" */}
                  <IconDown />
                </span>
              </Button>
            </Dropdown>
          </div>
        </div>
      )}
      <div className="build-flow-content">
        {!previewVisible && (
          <div className="build-flow-menu">
            <Button className="create-obj-btn" onClick={create}>
              <img src={new URL(`./imgs/add-icon.png`, import.meta.url).href} />
              <span>{getCreateButtonText()}</span>
            </Button>
            <div className="menu-list">
              {dataMap[active].map(item => {
                return (
                  <div
                    className="menu-item"
                    onClick={() => edit(item)}
                    onMouseEnter={() => {
                      let addVisible = true;
                      flowRef.current.graphRef.current.getCells().forEach(cell => {
                        if (cell.getData()?.id === item.id) {
                          addVisible = false;
                        }
                      });
                      setAddIconVisible(addVisible);
                    }}
                    onMouseLeave={() => {
                      setAddIconVisible(false);
                    }}
                    key={item.id}
                  >
                    <div className="icon">
                      <ObjectIcon objectName={item.name} />
                    </div>
                    <div className="text">{item.label}</div>
                    {addIconVisible && active === 'object' && (
                      <div
                        className="oper"
                        onClick={e => {
                          e.stopPropagation();
                          e.preventDefault();
                          flowRef.current.addNode(item);
                        }}
                      >
                        <img src={new URL(`./imgs/add-icon.png`, import.meta.url).href} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="build-flow-graph">
          <Flow
            scene="build"
            ref={flowRef}
          />
        </div>
      </div>
      <ImportOntologyModal
        visible={visible}
        ontologyId="1"
        importType={importType}
        onCancel={() => {
          setVisible(false);
        }}
        onOk={() => {
          setVisible(false);
          axios.get(`/ontology_show/_api/object/type/refresh`);
          flowRef.current.initData();
        }}
      />
      <ObjectDrawer
        visible={objectDrawerVisible}
        id={objectId}
        objectList={dataMap['object']}
        onCancel={() => {
          setObjectDrawerVisible(false);
        }}
        onOk={item => {
          objectId ? handleUpdate('object', item) : handleCreate('object', item);
          setObjectDrawerVisible(false);
        }}
      />
      <ObjectDetailDrawer
        visible={objectDetailDrawerVisible}
        id={objectId}
        onCancel={() => {
          setObjectDetailDrawerVisible(false);
        }}
        onDelete={(id) => {
          flowRef.current.deleteNode(id);
        }}
        onOk={() => {
          setObjectDetailDrawerVisible(false);
        }}
      />
      <RelationDrawer
        visible={relationDrawer}
        sourceId={relationSourceId}
        targetId={relationTargetId}
        sourceText={relationText}
        onCancel={() => {
          setRelationDrawer(false);
        }}
        onOk={item => {
          handleUpdateEdge(item);
          setRelationDrawer(false);
        }}
      />
      <ActionDrawer
        visible={actionDrawerVisible}
        id={actionId}
        onCancel={() => {
          setActionDrawerVisible(false);
        }}
        onOk={item => {
          actionId ? handleUpdate('action', item) : handleCreate('action', item);
          setActionDrawerVisible(false);
        }}
      />
      <LogicDrawer
        visible={logicDrawerVisible}
        id={logicId}
        onCancel={() => {
          setLogicDrawerVisible(false);
        }}
        onOk={item => {
          logicId ? handleUpdate('logic', item) : handleCreate('logic', item);
          setLogicDrawerVisible(false);
        }}
      />
      <PublishDrawer
        visible={publishDrawerVisible}
        ontologyId="1"
        actionList={dataMap['action']}
        logicList={dataMap['logic']}
        onCancel={() => {
          setPublishDrawerVisible(false);
        }}
        onOk={() => {
          setPublishDrawerVisible(false);
        }}
      />
    </div>
  );
});

export default Step2;