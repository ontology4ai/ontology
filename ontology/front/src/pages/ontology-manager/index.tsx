import Tabs from '@/components/Tabs';
import Action from '@/pages/action-modal';
import Obj from '@/pages/object';
import OntologyOverview from '@/pages/ontology-overview';
import Relation from '@/pages/relationModal';
import {
  Badge,
  Button,
  Dropdown,
  Form,
  Input,
  Menu,
  Message,
  Modal,
  Pagination,
  Popconfirm,
  Select,
  Space,
  Spin,
  Switch,
  Tooltip,
  Upload,
} from '@arco-design/web-react';
import React from 'react';

import { connect } from 'react-redux';
import {
  checkExistOntology,
  createOntology,
  deleteOntology,
  downloadTemple,
  exportOntology,
  getData,
  getOntologyData,
  importFile,
  publishOntology,
  updateOntology,
  migrateOut,
  migrateIn,
  processStart,
  processStatus,
  ontologyUploadFile,
} from './api';

import { addAttrData } from '@/pages/attr-manager/api';
import {
  IconAdd,
  IconAddColor,
  IconBackupsShareColor,
  IconCalendarColor,
  IconComputerChainColor,
  IconCounterColor,
  IconDataGovernanceColor,
  IconDataIntegrationColor,
  IconDataMiningColor,
  IconDataResDirColor,
  IconDeleteColor,
  IconDocumentColor,
  IconDonutChartFill,
  IconDownloadColor,
  IconInformationColor,
  IconMgmtNodeColor,
  IconModelMgrColor,
  IconMoreRowColor,
  IconPaperColor,
  IconSearchColor,
  IconSendColor,
  IconShareColor,
  IconTextareaColor,
  IconTick,
  IconTopologyColor,
  IconUnitMgrColor,
  IconUploadColor,
  IconArrowDown,
} from 'modo-design/icon';
import PublishModel from './publish-model';
import ShareServiceModel from './share-service-model';
import './style/index.less';
import SubmitShareModel from './submit-share-model';
import GraphLegend from '../diagram/legend';
import GraphRelationshipCard from '../diagram/relationship-card';
import GraphStatistics from '../diagram/statistics';
import SideCard from '../diagram/side-card';
import getAppName from 'modo-plugin-common/src/core/src/utils/getAppName';

import ProgressModal from './progress-modal';

const typeOptions = [
  { value: 'string', label: '字符型' },
  { value: 'int', label: '整数型' },
  { value: 'decimal', label: '浮点数型' },
  { value: 'date', label: '日期型' },
  { value: 'bool', label: '布尔型' },
];
class OntologyManager extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = {
      ontologyId: props.params?.id,
      ontologyTab: {},
      prevUseSaveBtn: false,
      loading: true,
      saveLoading: false,
      importBtnLoading: false,
      saveBtnLoading: false,
      deleteLoading: {},
      updateLoading: {},
      data: [],
      pagination: {
        total: 0,
        current: 1,
        pageSize: 20,
      },
      tabs: [],
      tabSaveBtnStates: {},
      filterVal: '',
      filterInfoShow: false,
      modalVisible: false,
      createObjVisible: false,
      attrModalVisible: false,
      linkModalVisible: false,
      actionModalVisible: false,
      isMulti: false,
      rdfImportVisible: false,
      codeImportVisible: false,
      fileImportVisible: false,
      excelImportVisible: false,
      submitShareVisible: false,
      shareServiceVisible: false,
      publishModelVisible: false,
      isPublishing: false,
      publishProgress: 0,
      fileList: [],
      uploadOntology: false,
      buildingOntologyIds: [], // 存储正在构建中的ontology ID列表
      buildingOntologyStatusLabelMap: {}, // 正在构建的ontology状态映射 排队中 | 执行中
      buildingOntologyProgressMap: {}, // 正在构建的ontology进度映射
      buildingOntologyFileNameMap: {}, // 正在构建的ontology文件名映射
    };
    this.tabsRef = React.createRef();
    this.tabViewRef = React.createRef();
    this.formRef = React.createRef();
    this.attrFormRef = React.createRef();
    this.tabViewRef.current = {};
    this.tabViewMapRef = React.createRef();
    this.tabViewMapRef.current = {};

    // 定时器管理，key为taskId
    this.pollingTimers = new Map();
  }
  getData = params => {
    this.setState({
      loading: true,
    });
    const param = {
      keyword: this.state.filterVal,
      page: 1,
      limit: 20,
      ...(params || {}),
    };
    getData(param)
      .then(res => {
        if (Array.isArray(res?.data?.data?.content)) {
          const { data } = res.data;
          this.setState({
            data: data.content,
            filterInfoShow: this.state.filterVal,
            filterInfo: this.state.filterVal,
            pagination: {
              total: data.totalElements,
              current: param.page,
              pageSize: param.limit,
            },
          });
        }
      })
      .finally(() => {
        this.setState({
          loading: false,
        });
      });
  };
  addTab = item => {
    /* const tab = {
            id: item.id,
            key: item.ontologyName,
            title: item.ontologyLabel,
            icon: null,
            view: <></>
        } */
    const { view, ...tab } = item;
    this.tabViewRef.current[item.key] = view;
    console.log('addTab', tab);
    this.tabsRef.current.addTab(tab);
    setTimeout(() => {
      this.setState({
        tabs: this.tabsRef.current.state.tabs,
      });
    });
  };
  getOntologyDetail = (id, callback) => {
    this.setState({
      loading: true,
    });
    getOntologyData(id)
      .then(res => {
        if (res.data.data) {
          const { data } = res.data;
          callback(data);
        }
      })
      .catch(err => {})
      .finally(() => {
        this.setState({
          loading: false,
        });
      });
  };
  viewOntology = data => {
    const tab = {
      key: data.id,
      title: data.ontologyLabel,
      icon: null,
    };
    tab.view = (
      <OntologyOverview
        key={data.id}
        changeActiveTab={async (tab, callback) => {
          await this.setState({
            activeTab: tab,
          });
          await this.tabsRef.current.setActive(tab);
          await callback();
        }}
        ontology={data}
        // 提供更新状态的方法
        onUpdateUseSaveBtn={(id, useSaveBtn) => {
          this.setState(prevState => ({
            tabSaveBtnStates: {
              ...prevState.tabSaveBtnStates,
              [id]: useSaveBtn,
            },
          }));
        }}
        ref={ref => {
          this.tabViewMapRef.current[data.id] = ref;
        }}
        getRef={() => this.tabViewMapRef.current[data.id]}
        push={data => {
          this.addTab(data);
        }}
      />
    );
    this.addTab(tab);
    return tab;
  };
  createOntology = async () => {
    this.setState({
      saveLoading: true,
    });
    let valid = true;
    try {
      await this.formRef.current.validate();
    } catch (e) {
      valid = false;
      this.setState({
        saveLoading: false,
      });
    }
    if (!valid) {
      return;
    }
    createOntology({
      ...this.formRef.current.getFieldsValue(),
      status: 0,
    })
      .then(res => {
        if (res.data.success) {
          this.setState(
            () => {
              return {
                modalVisible: false,
              };
            },
            () => {
              this.getData();
            },
          );
          Message.success('保存成功！');
          return;
        }
        throw 'err';
      })
      .catch(err => {
        Message.error('保存失败！');
      })
      .finally(() => {
        this.setState({
          saveLoading: false,
        });
        this.formRef.current.resetFields();
      });
  };
  deleteOntology = data => {
    const deleteLoading = {};
    deleteLoading[data.id] = true;
    this.setState({
      deleteLoading: {
        ...this.state.deleteLoading,
        ...deleteLoading,
      },
    });
    deleteOntology([data.id])
      .then(res => {
        if (res.data.success) {
          this.getData();
          Message.success('删除成功！');
          return;
        }
        throw 'err';
      })
      .catch(err => {
        Message.error('删除失败！');
      })
      .finally(() => {
        const deleteLoading = {};
        deleteLoading[data.id] = false;
        this.setState({
          deleteLoading: {
            ...this.state.deleteLoading,
            ...deleteLoading,
          },
        });
      });
  };
  updateOntology = data => {
    const updateLoading = {};
    updateLoading[data.id] = true;
    const statusText = data.status ? '启用' : '禁用';
    this.setState({
      updateLoading: {
        ...this.state.updateLoading,
        ...updateLoading,
      },
    });
    updateOntology(data.id, {
      ontologyName: data.ontologyName,
      ontologyLabel: data.ontologyLabel,
      ontologyDesc: data.ontologyDesc,
      status: data.status,
    })
      .then(res => {
        if (res.data.success) {
          this.getData();
          Message.success(`${statusText}成功！`);
          return;
        }
        throw 'err';
      })
      .catch(err => {
        Message.error(`${statusText}失败！`);
      })
      .finally(() => {
        const updateLoading = {};
        updateLoading[data.id] = false;
        this.setState({
          updateLoading: {
            ...this.state.updateLoading,
            ...updateLoading,
          },
        });
      });
  };

  // 设置ontology为构建中状态
  setOntologyBuilding = ontologyId => {
    // 将ontologyId添加到构建中列表
    if (!this.state.buildingOntologyIds.includes(ontologyId)) {
      this.setState({
        buildingOntologyIds: [...this.state.buildingOntologyIds, ontologyId],
      });
    }
  };

  // 取消ontology的构建中状态
  removeOntologyBuilding = ontologyId => {
    // 从构建中列表中移除ontologyId
    this.setState({
      buildingOntologyIds: this.state.buildingOntologyIds.filter(id => id !== ontologyId),
    });
  };

  // 停止定时查询
  stopPolling = taskId => {
    const timer = this.pollingTimers.get(taskId);
    if (timer) {
      clearInterval(timer);
      this.pollingTimers.delete(taskId);
    }
  };

  // 定时查询任务状态
  startPollingTaskStatus = (taskId, ontologyId, originFile) => {
    // 设置ontology为构建中状态
    this.setOntologyBuilding(ontologyId);

    // 初始化相关映射
    this.setState({
      buildingOntologyStatusLabelMap: {
        ...this.state.buildingOntologyStatusLabelMap,
        [ontologyId]: '排队中',
      },
      buildingOntologyProgressMap: {
        ...this.state.buildingOntologyProgressMap,
        [ontologyId]: 1,
      },
      buildingOntologyFileNameMap: {
        ...this.state.buildingOntologyFileNameMap,
        [ontologyId]: originFile?.name,
      },
    });

    // 清除可能存在的旧定时器
    this.stopPolling(taskId);

    // 启动定时查询，每3秒查询一次
    const timer = setInterval(() => {
      processStatus(taskId)
        .then(res => {
          if (res.data) {
            const taskState = res.data?.state;

            // 如果任务完成
            if (taskState === 'completed' || taskState === 'failed') {
              // 停止定时查询
              this.stopPolling(taskId);

              // 取消构建中状态
              this.removeOntologyBuilding(ontologyId);

              // 清理相关映射
              this.setState({
                buildingOntologyStatusLabelMap: {
                  ...this.state.buildingOntologyStatusLabelMap,
                  [ontologyId]: undefined,
                },
                buildingOntologyProgressMap: {
                  ...this.state.buildingOntologyProgressMap,
                  [ontologyId]: undefined,
                },
                buildingOntologyFileNameMap: {
                  ...this.state.buildingOntologyFileNameMap,
                  [ontologyId]: undefined,
                },
              });

              // 刷新数据
              // this.getData();
              taskState === 'completed' ? Message.success('构建完成') : Message.error('构建失败');
              taskState === 'completed' && this.updateOntologyTab(ontologyId);
            } else if (taskState === 'running') {
              this.setState({
                buildingOntologyStatusLabelMap: {
                  ...this.state.buildingOntologyStatusLabelMap,
                  [ontologyId]: '执行中',
                },
              });
            } else {
              this.setState({
                buildingOntologyStatusLabelMap: {
                  ...this.state.buildingOntologyStatusLabelMap,
                  [ontologyId]: '排队中',
                },
              });
            }

            // 每查询返回一次进度条就+1，直到99停止
            const progress = this.state.buildingOntologyProgressMap[ontologyId];
            if (!progress || progress < 99) {
              this.setState({
                buildingOntologyProgressMap: {
                  ...this.state.buildingOntologyProgressMap,
                  [ontologyId]: progress ? progress + 1 : 1,
                },
              });
            }

            // 从列表进入，通过接口获取文件名
            if (res.data?.fileName) {
              this.setState({
                buildingOntologyFileNameMap: {
                  ...this.state.buildingOntologyFileNameMap,
                  [ontologyId]: res.data?.fileName,
                },
              });
            }
          }
        })
        .catch(err => {
          console.error('查询任务状态失败:', err);
          // 查询失败时不停止定时器，继续查询
        });
    }, 5000); // 每5秒查询一次

    // 保存定时器
    this.pollingTimers.set(taskId, timer);
  };

  onValuesChange = (changeValue, values) => {
    if (changeValue.hasOwnProperty('isMulti')) {
      this.setState({ isMulti: values.isMulti });
      this.attrFormRef.current?.setFieldValue('attributeTypes', changeValue.isMulti ? [] : '');
    }
  };

  saveAttr = () => {
    this.attrFormRef.current?.validate((errors, values) => {
      if (!errors) {
        console.log(values);
        values.status = values.status ? 1 : 0;
        Array.isArray(values.attributeTypes)
          ? ''
          : (values.attributeTypes = [values.attributeTypes]);

        const activeTab = this.state.tabs.find(item => item.key == this.state.activeTab);
        const ontologyId = activeTab.ontology ? activeTab.ontology.id : activeTab.key;
        values.ontologyId = ontologyId;
        addAttrData(values)
          .then(res => {
            if (res.data.success) {
              Message.success('保存成功');
              this.updateOntologyTab(ontologyId);
            } else {
              Message.error('保存失败');
            }
          })
          .catch(err => {
            console.log(err);
            Message.error('保存失败');
          })
          .finally(() => {
            this.setState({ attrModalVisible: false });
            // this.attrFormRef.current.resetFields();
            // this.getData()
          });
      }
    });
  };
  renderOption = option => {
    let labelIcon = '';
    switch (option.value) {
      case 'string':
        labelIcon = <IconTextareaColor />;
        break;
      case 'int':
        labelIcon = <IconCounterColor />;
        break;
      case 'decimal':
        labelIcon = <IconDataIntegrationColor />;
        break;
      case 'bool':
        labelIcon = <IconUnitMgrColor />;
        break;
      case 'date':
        labelIcon = <IconCalendarColor />;
        break;
    }
    return (
      <Space>
        {labelIcon}
        {option.children}
      </Space>
    );
  };
  handleTest = ontology => {
    const activeTab = this.state.tabs.find(item => item.key == this.state.activeTab);
    const ontologyId = activeTab.ontology ? activeTab.ontology.id : ontology.id;
    const appName = getAppName();
    const url = `${window.location.protocol}//${location.host}/${appName}/test_chats/${ontologyId}`;
    window.open(url);
  };
  handleSimulate = ontology => {
    // const activeTab = this.state.tabs.find(item => item.key == this.state.activeTab);
    // const ontologyId = activeTab.ontology ? activeTab.ontology.id : ontology.id;
    const appName = getAppName();
    let { href } = window.location;
    if (href.endsWith('ontology_manager')) {
      href = `${href.slice(0, href.indexOf('ontology_manager'))}ontology_simulation`;
    }
    window.open(href);
  };
  handleSave = () => {
    const { activeTab } = this.state;
    const getRef = this.tabViewRef.current[activeTab]?.props?.getRef;
    const tabRef = getRef && getRef();
    if (tabRef && typeof tabRef.handleSave === 'function') {
      //this.setState({ saveBtnLoading: true });
      tabRef.handleSave(
        arg => {
          this.setState({ saveBtnLoading: false });
          !this.state.ontologyId && this.getData();
          if (typeof arg === 'string') {
            const tab = this.tabsRef.current.state.tabs.find(tab => tab.key === activeTab);
            if (!tab) {
              return;
            }
            const tabTitle = arg;
            tab.title = tabTitle;
          }
          if (arg.tabName) {
            const tab = this.tabsRef.current.state.tabs.find(tab => tab.key === activeTab);
            if (tab) {
              const tabTitle = arg.tabName;
              tab.title = tabTitle;
            }
          }
          if (arg.type == 'updateTab') {
            debugger;
            //更新tabId页面
            const getRef = this.tabViewRef.current[arg.tabId]?.props?.getRef;
            const tabRef = getRef && getRef();
            if (tabRef.viewMapRef?.current) {
              for (const key in tabRef.viewMapRef.current) {
                if (tabRef.viewMapRef.current.hasOwnProperty(key)) {
                  // 确保只是自身属性
                  const ref = tabRef.viewMapRef.current[key];
                  ref.getData && typeof ref.getData === 'function' && ref.getData();
                }
              }
            }
          }
          this.tabsRef.current.setState({
            tabs: [...this.tabsRef.current.state.tabs],
          });
        },
        () => {
          this.setState({ saveBtnLoading: false });
        },
      );
    }
  };
  exportOntologyFile = () => {
    const activeTab = this.state.tabs.find(item => item.key == this.state.activeTab);
    const ontologyId = activeTab.ontology ? activeTab.ontology.id : activeTab.key;
    exportOntology({ ontologyId }).then(res => {
      if (res.data) {
        const blob = new Blob([res.data]);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${ontology.ontologyLabel}.ttl`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    });
  };
  handleExport = () => {};
  handleCodeImport = () => {};
  handleDownRdfTpl = () => {
    const appName = getAppName();
    const url = `${window.location.protocol}//${window.location.host}/${appName}/_api/ontology/downTemplate`;
    window.open(url);
    // downloadTemple().then(res => {
    //   if (res.data) {
    //     const filename =
    //       res.headers['content-disposition']?.match(/filename="?(.+?)"?$/)?.[1] || '模板.ttl';

    //     const blob = new Blob([res.data]);
    //     const url = window.URL.createObjectURL(blob);
    //     const a = document.createElement('a');
    //     a.href = url;
    //     a.download = filename;
    //     a.click();
    //     window.URL.revokeObjectURL(url);
    //   }
    // });
  };
  handleDownExcelTpl = () => {
    const appName = getAppName();
    const url = `${window.location.protocol}//${window.location.host}/${appName}/_api/ontology/downTemplate?type=excel`;
    window.open(url);
    // downloadTemple({ type: 'excel' }).then(res => {
    //   if (res.data) {
    //     const filename =
    //       res.headers['content-disposition']?.match(/filename="?(.+?)"?$/)?.[1] ||
    //       '数智本体文档导入模板.xlsx';
    //     const blob = new Blob([res.data]);
    //     const url = window.URL.createObjectURL(blob);
    //     const a = document.createElement('a');
    //     a.href = url;
    //     // a.download = filename;
    //     a.click();
    //     window.URL.revokeObjectURL(url);
    //   }
    // });
  };

  renderUploadList = (fileList, props) => {
    return (
      <div className="arco-upload-list arco-upload-list-type-text rdf-upload">
        {fileList.map((file, index) => {
          return (
            <div
              key={`${index}-${file.name}`}
              className="arco-upload-list-item arco-upload-list-item-done"
            >
              <div className="arco-upload-list-item-text">
                <div className="arco-upload-list-item-text-content">
                  <div className="arco-upload-list-item-text-name">
                    <span className="arco-upload-list-file-icon">
                      <IconDocumentColor />
                    </span>
                    <span className="arco-upload-list-item-text-name-text">
                      <a>{file.name}</a>
                    </span>
                  </div>
                </div>
              </div>
              <div className="arco-upload-list-item-operation">
                {file.status == 'success' && (
                  <span className="arco-icon-hover">
                    <span className="arco-upload-list-remove-icon">
                      <IconTick style={{ fontSize: 12, color: '#55BC8A' }} />
                    </span>
                  </span>
                )}
                {file.status == 'fail' && (
                  <span className="arco-icon-hover">
                    <span className="arco-upload-list-remove-icon">
                      <span
                        style={{ fontSize: 12, color: '#3261CE' }}
                        onClick={() => {
                          this.handleUpload(file.originFile);
                        }}
                      >
                        点击重试
                      </span>
                    </span>
                  </span>
                )}
                {file.status == 'uploading' && (
                  <span className="arco-icon-hover">
                    <span className="arco-upload-list-remove-icon">
                      <IconDonutChartFill style={{ fontSize: 12, color: '#3261CE' }} spin />
                    </span>
                  </span>
                )}
                {file.status !== 'uploading' && (
                  <span className="arco-icon-hover">
                    <span className="arco-upload-list-remove-icon">
                      <IconDeleteColor
                        style={{ fontSize: 12 }}
                        onClick={() => {
                          this.deleteFile(file);
                        }}
                      />
                    </span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  onFileUploadChange = (fileList, file) => {
    console.log('onFileUploadChange', fileList, file);
    /*if(file.originFile.size > 15728640){
            Message.error('文件最大不超过15MB！')
            return;
        }*/
    this.setState({ fileList: [file] });
  };
  deleteFile = file => {
    const { fileList } = this.state;
    const index = fileList.findIndex(item => item.name == file.name);
    fileList.splice(index, 1);
    this.setState({ fileList });
  };
  //更新对应本体总览tab
  updateOntologyTab = ontologyId => {
    const getRef = this.tabViewRef.current[ontologyId]?.props?.getRef;
    const tabRef = getRef && getRef();
    if (tabRef && typeof tabRef.getData === 'function') {
      tabRef.getData();
      tabRef.setState({ menuKey: 'detail' });
      for (const key in tabRef.viewMapRef.current) {
        if (tabRef.viewMapRef.current.hasOwnProperty(key)) {
          // 确保只是自身属性
          const ref = tabRef.viewMapRef.current[key];
          ref.getData && typeof ref.getData === 'function' && ref.getData();
        }
      }
      this.setState({
        activeTab: ontologyId,
      });
      this.tabsRef.current.setActive(ontologyId);
    }
  };
  handleUpload = file => {
    const activeTab = this.state.tabs.find(item => item.key == this.state.activeTab);
    const ontologyId = activeTab.ontology ? activeTab.ontology.id : activeTab.key;
    const params = {
      ontologyId,
      ownerId: this.props.identity.userId,
    };
    const formData = this.buildFormData(params);
    formData.append('file', file);
    const close = Message.loading({
      content: '正在导入...',
      id: 'upload_need_update',
      duration: 0,
    });
    importFile(formData)
      .then(res => {
        if (res.data.success) {
          Message.success({ content: '导入成功', id: 'upload_need_update' });
          close();
          this.updateOntologyTab(ontologyId);
        } else {
          Message.error({ content: '导入失败', id: 'upload_need_update' });
          close();
        }
      })
      .catch(e => {
        close();
      });
  };
  uploadRequest = option => {
    const { onProgress, onError, onSuccess, file } = option;
    this.handleUpload(file);
  };
  buildFormData = (params: any) => {
    if (params) {
      const data = new FormData();
      for (const p in params) {
        if (p) {
          data.append(p, params[p] ?? '');
        }
      }
      return data;
    }
  };

  handleImport = async (urlKeyName: string, params: Object, successCallback = () => {}) => {
    const { fileList } = this.state;
    if (fileList.length == 0) {
      Message.error('请先上传文件');
      return;
    }

    try {
      const form = new FormData();
      const { originFile } = fileList[0];
      form.append('file', originFile);

      // Message.info('导入中...');
      this.setState({ importBtnLoading: true });
      const uploadRes = await ontologyUploadFile(form);

      if (uploadRes.data.success) {
        const activeTab = this.state.tabs.find(item => item.key == this.state.activeTab);
        const ontologyId = activeTab.ontology ? activeTab.ontology.id : activeTab.key;

        const res = await processStart({
          ontology_id: ontologyId,
          owner_id: this.props.identity.userId,
          file_name: originFile.name,
          [urlKeyName]: uploadRes.data.data.url,
          ...params,
        });

        if (res.data.success) {
          Message.success(res.data.message ?? '导入提交成功');

          // this.tabsRef.current.deleteTab(activeTab.key);
          // this.tabsRef.current.setActive(null);

          // 获取taskId并启动定时查询
          const { taskId } = res.data;
          if (taskId) {
            this.startPollingTaskStatus(taskId, ontologyId, originFile);
          }

          this.setState({ fileList: [] });
          successCallback();
          // this.getData();

          const { activeTab } = this.state;
          const getRef = this.tabViewRef.current[activeTab]?.props?.getRef;
          const tabRef = getRef && getRef();

          tabRef.getData();
        } else {
          Message.error(res.data.message ?? '导入提交失败');
        }
      } else {
        Message.error('导入提交失败');
      }

      this.setState({ importBtnLoading: false });
    } catch (error) {
      Message.error('导入提交失败');
      console.error(error);
      this.setState({ importBtnLoading: false });
    }
  };
  handleImportRdf = () => {
    // const { fileList } = this.state;
    // if (fileList.length == 0) {
    //   Message.error('请先上传文件');
    //   return;
    // }
    // this.handleUpload(fileList[0].originFile);
    this.handleImport(
      'owl_url',
      {
        task_type: 'owl_import',
      },
      () => this.setState({ rdfImportVisible: false }),
    );
  };
  handleImportCode = async () => {
    this.handleImport(
      'code_url',
      {
        task_type: 'doc_import',
        code_language: 'python',
      },
      () => this.setState({ codeImportVisible: false }),
    );
  };
  handleImportFile = async () => {
    this.handleImport(
      'document_url',
      {
        task_type: 'doc_import',
        document_type: 'markdown',
      },
      () => this.setState({ fileImportVisible: false }),
    );
  };
  handleImportExcel = async () => {
    this.handleImport(
      'data_url',
      {
        task_type: 'csv_import',
      },
      () => this.setState({ excelImportVisible: false }),
    );
  };

  handleUploadOntology = async () => {
    const { fileList } = this.state;
    if (fileList.length == 0) {
      Message.error('请先上传文件');
      return;
    }
    let valid = true;
    try {
      this.setState({
        saveLoading: true,
      });
      await this.formRef.current.validate();
      const form = this.formRef.current.getFieldsValue();
      const formData = this.buildFormData(form);
      formData.append('file', fileList[0].originFile);
      const close = Message.loading({
        content: '正在导入...',
        id: 'upload_file_update',
        duration: 0,
      });
      this.setState({
        modalVisible: false,
      });
      migrateIn(formData)
        .then(res => {
          if (res.data.success) {
            Message.success({ content: '导入成功', id: 'upload_file_update' });
            this.getData();
          } else {
            Message.error({ content: res.data.message || '导入失败', id: 'upload_file_update' });
          }
        })
        .catch(e => {
          Message.error({ content: '导入失败', id: 'upload_file_update' });
        });
    } catch (e) {
      console.log(e);
      valid = false;
      this.setState({
        saveLoading: false,
      });
    }
    if (!valid) {
    }
  };
  handlePublish = () => {
    const activeOntology = this.state.data.find(item => item.id === this.state.activeTab);

    // 先显示弹窗，进度为0
    this.setState({
      isPublishing: true,
      publishProgress: 0,
      showPublishProgress: true,
    });

    // 使用 Promise 确保进度条完成后再处理接口结果
    const progressPromise = new Promise(resolve => {
      let progress = 0;

      const animateProgress = () => {
        progress += 2; // 每次增加2%
        this.setState({ publishProgress: Math.min(progress, 100) });

        if (progress < 100) {
          setTimeout(animateProgress, 20); // 20ms 间隔，总共约1秒到100%
        } else {
          resolve(); // 进度条完成
        }
      };

      animateProgress();
    });

    this.setState({ publishModelVisible: false });

    // 同时等待进度条完成和接口请求
    Promise.all([progressPromise, publishOntology([activeOntology.id])])
      .then(([, res]) => {
        // 进度条已经100%，保持显示，稍后关闭
        setTimeout(() => {
          this.setState({ showPublishProgress: false });

          if (res?.data?.data) {
            Message.success('发布成功');
            const tabRef = this.tabViewMapRef.current[activeOntology.id];
            this.getData();
            if (tabRef?.onPublishSuccess) {
              tabRef.onPublishSuccess();
            }
          } else {
            Message.error(res?.data?.message || '发布失败');
          }
        }, 300);
      })
      .catch(error => {
        // 即使出错也要等进度条完成
        progressPromise.then(() => {
          setTimeout(() => {
            this.setState({ showPublishProgress: false });
            Message.error('发布失败');
          }, 300);
        });
      })
      .finally(() => {
        this.setState({
          isPublishing: false,
          // 不在 finally 中重置进度，让进度保持在100%直到弹窗关闭
        });
      });
  };

  componentDidMount() {
    if (this.state.ontologyId) {
      this.getOntologyDetail(this.state.ontologyId, data => {
        this.setState({ data: [data] });
        const tab = this.viewOntology(data);
        this.setState({ ontologyTab: tab });
      });
    } else {
      this.getData();
    }

    // this.addTab();
  }

  componentWillUnmount() {
    // 清理所有定时器
    this.pollingTimers.forEach((timer, taskId) => {
      clearInterval(timer);
    });
    this.pollingTimers.clear();
  }

  shouldEnableSaveBtnForTab = tabKey => {
    const { tabSaveBtnStates } = this.state;

    // 返回该 tab 之前保存的状态，如果没有则默认为 false
    return tabSaveBtnStates[tabKey] !== undefined ? tabSaveBtnStates[tabKey] : false;
  };
  getInitialSaveBtnStateForTab = tabKey => {
    const { tabSaveBtnStates } = this.state;
    console.log('tabSaveBtnStates', tabSaveBtnStates);
    console.log(
      'tabSaveBtnStates.hasOwnProperty(tabKey)',
      tabKey,
      tabSaveBtnStates.hasOwnProperty(tabKey),
    );
    // 如果之前保存过状态，使用保存的状态
    if (tabSaveBtnStates.hasOwnProperty(tabKey)) {
      return tabSaveBtnStates[tabKey];
    }
    // 否则根据 tab 类型设置默认状态
    // 例如：OntologyOverview 类型默认启用
    const tab = this.state.tabs.find(t => t.key === tabKey);
    if (tab && tab.ontology) {
      return true;
    }
    return false;
  };

  render() {
    const {
      loading,
      saveLoading,
      saveBtnLoading,
      importBtnLoading,
      deleteLoading,
      updateLoading,
      filterVal,
      filterInfo,
      filterInfoShow,
      data,
      pagination,
      tabs,
      activeTab,
      modalVisible,
      createObjVisible,
      linkModalVisible,
      attrModalVisible,
      actionModalVisible,
      rdfImportVisible,
      codeImportVisible,
      fileImportVisible,
      excelImportVisible,
      submitShareVisible,
      shareServiceVisible,
      publishModelVisible,
      fileList,
      tabSaveBtnStates,
      uploadOntology,
    } = this.state;

    let ontology = data.find(item => item.id == activeTab);
    if (!ontology) {
      ontology = tabs.find(item => item.key == activeTab)?.ontology;
    }

    return (
      <>
        <Spin className="ontology-manager-spin" loading={loading}>
          <div className="ontology-manager">
            <div className="ontology-manager-header">
              <div className={`pos-left ${this.state.ontologyId ? 'single-ontology' : ''}`}>
                <div
                  className="title-container"
                  onClick={() => {
                    if (this.state.ontologyId) {
                      this.tabsRef.current.setActive(this.state.ontologyId);
                      return;
                    }
                    this.tabsRef.current.setActive(null);
                  }}
                >
                  <span className="icon">
                    <IconMgmtNodeColor />
                  </span>
                  <span className="title">{this.state.ontologyTab?.title || '本体设计'}</span>
                </div>
                <Tabs
                  ref={this.tabsRef}
                  onChange={tab => {
                    this.setState({
                      activeTab: tab,
                    });
                    setTimeout(() => {
                      this.setState({
                        tabs: this.tabsRef.current.state.tabs,
                      });
                    });
                  }}
                />
              </div>
              <div className="pos-right">
                {!activeTab && (
                  <Input
                    value={filterVal}
                    suffix={
                      <IconSearchColor
                        onClick={() => {
                          this.getData();
                        }}
                      />
                    }
                    placeholder="搜索本体"
                    onChange={val => {
                      this.setState({
                        filterVal: val,
                      });
                    }}
                    onPressEnter={() => {
                      this.getData();
                    }}
                  />
                )}
                {activeTab && !this.state.buildingOntologyIds.includes(activeTab) ? (
                  <>
                    {/* <Badge count={0}> */}
                    <Dropdown
                      droplist={
                        <Menu
                          className="more-action-menu"
                          onClickMenuItem={key => {
                            switch (key) {
                              case 'import-rdf':
                                this.setState({ rdfImportVisible: true, fileList: [] });
                                break;
                              case 'import-code':
                                this.setState({
                                  codeImportVisible: true,
                                  fileList: [],
                                });
                                break;
                              case 'import-file':
                                this.setState({ fileImportVisible: true, fileList: [] });
                                break;
                              case 'import-excel':
                                this.setState({ excelImportVisible: true, fileList: [] });
                                break;
                              case 'share-service':
                                this.setState({ shareServiceVisible: true });
                                break;
                              case 'export-ontology':
                                if (ontology) {
                                  const close = Message.loading({
                                    content: '正在导出...',
                                    duration: 0,
                                  });
                                  migrateOut({ ontologyId: ontology.id })
                                    .then(res => {
                                      close();
                                      if (res.data) {
                                        // 处理文件流下载
                                        const blob = new Blob([res.data]);
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `${
                                          ontology.ontologyLabel || ontology.ontologyName
                                        }.tar`;
                                        a.click();
                                        window.URL.revokeObjectURL(url);
                                        Message.success('导出成功！');
                                      } else {
                                        Message.error('导出失败！');
                                      }
                                    })
                                    .catch(error => {
                                      close();
                                      Message.error('导出失败！');
                                      console.error('导出本体失败:', error);
                                    });
                                }
                                break;
                              default:
                                break;
                            }
                          }}
                        >
                          <Menu.SubMenu
                            key="import-submenu"
                            title={
                              <div className="menu-label">
                                <IconUploadColor />
                                导入
                              </div>
                            }
                          >
                            <Menu.Item key="import-rdf">
                              <div className="menu-label">
                                <IconUploadColor />
                                RDF导入
                              </div>
                            </Menu.Item>
                            <Menu.Item key="import-file">
                              <div className="menu-label">
                                <IconDataMiningColor />
                                文档导入
                              </div>
                            </Menu.Item>
                            {/* <Menu.Item key="import-code">
                              <div className="menu-label">
                                <IconDataMiningColor />
                                代码导入
                              </div>
                            </Menu.Item> */}
                            <Menu.Item key="import-excel">
                              <div className="menu-label">
                                <IconDataMiningColor />
                                Excel导入
                              </div>
                            </Menu.Item>
                          </Menu.SubMenu>
                          <Menu.SubMenu
                            key="share-submenu"
                            title={
                              <div className="menu-label">
                                <IconPaperColor />
                                导出
                              </div>
                            }
                          >
                            <Menu.Item key="share-service">
                              <div className="menu-label">
                                <IconPaperColor />
                                导出RDF
                              </div>
                            </Menu.Item>
                            <Menu.Item key="export-ontology">
                              <div className="menu-label">
                                <IconPaperColor />
                                工程导出
                              </div>
                            </Menu.Item>
                          </Menu.SubMenu>
                        </Menu>
                      }
                      position="bl"
                    >
                      <Button className="save" type="secondary">
                        导入与导出
                        <IconArrowDown />
                      </Button>
                    </Dropdown>
                    <Button
                      className="save"
                      type="secondary"
                      onClick={() => this.handleTest(ontology)}
                    >
                      测试
                    </Button>
                    <Button
                      className="save"
                      type="secondary"
                      onClick={() => this.handleSimulate(ontology)}
                    >
                      仿真
                    </Button>
                    <Dropdown
                      droplist={
                        <Menu
                          className="more-action-menu"
                          onClickMenuItem={key => {
                            switch (key) {
                              case 'share-submit':
                                this.setState({ submitShareVisible: true });
                                break;
                              case 'publish':
                                if (ontology.status === 0) {
                                  Modal.confirm({
                                    title: '当前本体为"禁用"状态，发布后将自动更新为"启用"状态。',
                                    content: '',
                                    getPopupContainer: () =>
                                      document.querySelector('.ontology-manager') || document.body,
                                    onOk: () => {
                                      this.setState({ publishModelVisible: true });
                                    },
                                  });
                                } else {
                                  this.setState({ publishModelVisible: true });
                                }
                                break;
                              default:
                                break;
                            }
                          }}
                        >
                          <Menu.Item key="share-submit">
                            <div className="menu-label">
                              <IconComputerChainColor />
                              提交共享中心
                            </div>
                          </Menu.Item>
                          <Menu.Item key="publish">
                            <div className="menu-label">
                              <IconSendColor />
                              本体发布
                            </div>
                          </Menu.Item>
                        </Menu>
                      }
                      position="bl"
                    >
                      <Button className="save" type="secondary">
                        共享发布
                        <IconArrowDown />
                      </Button>
                    </Dropdown>
                    <Button
                      className="save"
                      type="primary"
                      onClick={this.handleSave}
                      disabled={!tabSaveBtnStates[activeTab]}
                      loading={saveBtnLoading}
                    >
                      保存
                    </Button>
                    {/* </Badge> */}
                    {false && (
                      <Dropdown
                        droplist={
                          <Menu
                            className="more-action-menu"
                            onClickMenuItem={key => {
                              switch (key) {
                                // 新建子菜单项
                                case 'create-object':
                                  this.setState({ createObjVisible: true });
                                  break;
                                case 'create-attr':
                                  this.setState({ attrModalVisible: true, isMulti: false });
                                  break;
                                case 'create-relation':
                                  this.setState({ linkModalVisible: true });
                                  break;
                                case 'create-action':
                                  this.setState({ actionModalVisible: true });
                                  break;
                                // 导入子菜单项
                                case 'import-rdf':
                                  this.setState({ rdfImportVisible: true, fileList: [] });
                                  break;
                                case 'import-code':
                                  this.setState({
                                    codeImportVisible: true,
                                    fileList: [],
                                  });
                                  break;
                                case 'import-file':
                                  this.setState({ fileImportVisible: true, fileList: [] });
                                  break;
                                case 'import-excel':
                                  this.setState({ excelImportVisible: true, fileList: [] });
                                  break;
                                // 共享子菜单项
                                case 'share-submit':
                                  this.setState({ submitShareVisible: true });
                                  break;
                                case 'share-service':
                                  this.setState({ shareServiceVisible: true });
                                  break;
                                // 发布项（无二级菜单）
                                case 'publish':
                                  if (ontology.status === 0) {
                                    Modal.confirm({
                                      title: '当前本体为"禁用"状态，发布后将自动更新为"启用"状态。',
                                      content: '',
                                      getPopupContainer: () =>
                                        document.querySelector('.ontology-manager') ||
                                        document.body,
                                      onOk: () => {
                                        this.setState({ publishModelVisible: true });
                                      },
                                    });
                                  } else {
                                    this.setState({ publishModelVisible: true });
                                  }
                                  break;
                                case 'export-ontology':
                                  if (ontology) {
                                    const close = Message.loading({
                                      content: '正在导出...',
                                      duration: 0,
                                    });
                                    migrateOut({ ontologyId: ontology.id })
                                      .then(res => {
                                        close();
                                        if (res.data) {
                                          // 处理文件流下载
                                          const blob = new Blob([res.data]);
                                          const url = window.URL.createObjectURL(blob);
                                          const a = document.createElement('a');
                                          a.href = url;
                                          a.download = `${
                                            ontology.ontologyLabel || ontology.ontologyName
                                          }.tar`;
                                          a.click();
                                          window.URL.revokeObjectURL(url);
                                          Message.success('导出成功！');
                                        } else {
                                          Message.error('导出失败！');
                                        }
                                      })
                                      .catch(error => {
                                        close();
                                        Message.error('导出失败！');
                                        console.error('导出本体失败:', error);
                                      });
                                  }
                                  break;
                                default:
                                  break;
                              }
                            }}
                          >
                            <Menu.SubMenu
                              key="create-submenu"
                              title={
                                <div className="menu-label">
                                  <IconAddColor />
                                  新建
                                </div>
                              }
                            >
                              <Menu.Item key="create-object">
                                <div className="menu-label">
                                  <IconDataResDirColor />
                                  对象定义
                                </div>
                              </Menu.Item>
                              <Menu.Item key="create-attr" disabled>
                                <div className="menu-label">
                                  <IconBackupsShareColor />
                                  共享属性
                                </div>
                              </Menu.Item>
                              <Menu.Item key="create-relation">
                                <div className="menu-label">
                                  <IconDataGovernanceColor />
                                  关系定义
                                </div>
                              </Menu.Item>
                              <Menu.Item key="create-action">
                                <div className="menu-label">
                                  <IconTopologyColor />
                                  动作定义
                                </div>
                              </Menu.Item>
                            </Menu.SubMenu>
                            <Menu.SubMenu
                              key="import-submenu"
                              title={
                                <div className="menu-label">
                                  <IconUploadColor />
                                  导入
                                </div>
                              }
                            >
                              <Menu.Item key="import-rdf">
                                <div className="menu-label">
                                  <IconUploadColor />
                                  RDF导入
                                </div>
                              </Menu.Item>
                              {/* <Menu.Item key="import-code">
                              <div className="menu-label">
                                <IconDataMiningColor />
                                代码导入
                              </div>
                            </Menu.Item> */}
                              <Menu.Item key="import-file">
                                <div className="menu-label">
                                  <IconDataMiningColor />
                                  文档导入
                                </div>
                              </Menu.Item>
                              <Menu.Item key="import-excel">
                                <div className="menu-label">
                                  <IconDataMiningColor />
                                  Excel导入
                                </div>
                              </Menu.Item>
                            </Menu.SubMenu>
                            <Menu.SubMenu
                              key="share-submenu"
                              title={
                                <div className="menu-label">
                                  <IconShareColor />
                                  共享
                                </div>
                              }
                            >
                              <Menu.Item key="share-submit">
                                <div className="menu-label">
                                  <IconComputerChainColor />
                                  提交共享中心
                                </div>
                              </Menu.Item>
                              <Menu.Item key="share-service">
                                <div className="menu-label">
                                  <IconPaperColor />
                                  导出RDF
                                </div>
                              </Menu.Item>
                              <Menu.Item key="export-ontology">
                                <div className="menu-label">
                                  <IconPaperColor />
                                  导出本体
                                </div>
                              </Menu.Item>
                            </Menu.SubMenu>
                            <Menu.Item key="publish">
                              <div className="menu-label">
                                <IconSendColor />
                                发布
                              </div>
                            </Menu.Item>
                          </Menu>
                        }
                        position="bl"
                      >
                        <Button className="more-action">
                          <IconMoreRowColor />
                        </Button>
                      </Dropdown>
                    )}
                  </>
                ) : null}
              </div>
            </div>
            <div
              className="placeholder"
              style={{
                visibility: !activeTab && !this.state.ontologyId ? 'visible' : 'hidden',
                zIndex: !activeTab ? 1 : -1,
              }}
            >
              <div className="ontology-manager-content">
                {filterInfoShow && (
                  <div className="filter-result-info">
                    已检索出
                    <span className="key">{` ${filterInfo} `}</span>
                    相关的本体
                    <span className="key">{` ${pagination.total} `}</span>个
                  </div>
                )}
                <div className="ontology-list">
                  <div
                    className="ontology-item create"
                    onClick={() => {
                      this.setState({
                        modalVisible: true,
                        uploadOntology: false,
                        fileList: [],
                        saveLoading: false,
                      });
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="text-link create-actions">
                      <span>
                        <IconAdd />
                        新建本体
                      </span>
                    </div>
                    <div
                      className="upload-file"
                      onClick={e => {
                        e.stopPropagation(); // 阻止事件冒泡，避免触发父元素的点击事件
                      }}
                    >
                      <span style={{ marginRight: 8, color: 'var(--color-text-3)' }}>或</span>
                      <a
                        href="#"
                        style={{ color: 'var(--color-primary-6)' }}
                        onClick={() => {
                          this.setState({
                            modalVisible: true,
                            uploadOntology: true,
                            fileList: [],
                            saveLoading: false,
                          });
                        }}
                      >
                        导入现有文件
                      </a>
                      {/*<Upload
                        accept=".tar"
                        customRequest={option => {
                          const { onProgress, onError, onSuccess, file } = option;
                          const close = Message.loading({ content: '正在导入...', duration: 0 });

                          const formData = new FormData();
                          formData.append('file', file);

                          migrateIn(formData)
                            .then(res => {
                              close();
                              if (res.data.success) {
                                onSuccess(res.data, res);
                                Message.success('导入成功！');
                                this.getData();
                              } else {
                                onError(res.data.message);
                                Message.error(res.data.message || '导入失败');
                              }
                            })
                            .catch(error => {
                              close();
                              onError(error);
                              Message.error('导入失败！');
                            });

                          return {
                            abort: () => {
                              close();
                            },
                          };
                        }}
                        showUploadList={false}
                      >
                        <>
                          <span style={{ marginRight: 8, color: 'var(--color-text-3)' }}>或</span>
                          <a href="#" style={{ color: 'var(--color-primary-6)' }}>
                            导入现有文件
                          </a>
                        </>
                      </Upload>*/}
                    </div>
                  </div>
                  {data.map(item => {
                    return (
                      <div
                        key={item.id}
                        className="ontology-item"
                        onDoubleClick={() => {
                          // if (this.state.buildingOntologyIds.includes(item.id)) {
                          //   Message.warning('正在构建本体，请构建完成后再查看');
                          //   return;
                          // }
                          this.viewOntology(item);
                        }}
                      >
                        <div className="ontology-item-header">
                          <div className="icon">
                            <div className="icon-bg">
                              <IconModelMgrColor />
                            </div>
                          </div>
                          <div className="info">
                            <div className="ontology-item-label">
                              <Tooltip content={item.ontologyLabel}>
                                <span>{item.ontologyLabel}</span>
                              </Tooltip>
                            </div>
                            <div className="ontology-item-name">{item.ontologyName}</div>
                          </div>
                          <div className="oper-group">
                            {this.state.buildingOntologyIds.includes(item.id) ? (
                              <Button
                                shape="round"
                                type="primary"
                                loading
                                className="build-status-button"
                              >
                                构建中
                              </Button>
                            ) : (
                              <Popconfirm
                                focusLock
                                title={`${
                                  item.status === 1
                                    ? '禁用本体时，将取消本体发布，用户无法在对象探索和本体图谱中查询，确认禁用本体？'
                                    : '启用后可对本体进行发布，发布后的本体支持用户在对象探索和本体图片中查询，确认启用本体？'
                                }`}
                                onOk={() => {
                                  this.updateOntology({
                                    ...item,
                                    status: item.status ? 0 : 1,
                                  });
                                }}
                                onCancel={() => {}}
                              >
                                <Switch
                                  loading={updateLoading[item?.id]}
                                  checked={Boolean(item.status)}
                                  checkedText="启用"
                                  uncheckedText="禁用"
                                  onChange={() => {}}
                                />
                              </Popconfirm>
                            )}
                          </div>
                        </div>
                        <div className="ontology-item-content">
                          <div>
                            <span className="label">描述：</span>
                            <Tooltip content={item.ontologyDesc} disabled={!item.ontologyDesc}>
                              <span className="descr value">{item.ontologyDesc || '--'}</span>
                            </Tooltip>
                          </div>
                          <div className="sub-info">
                            <div className="owner">
                              <span className="label">拥有者：</span>
                              <span className="value">{item.owner || '--'}</span>
                            </div>
                            <div className="version">
                              <span className="label">版本：</span>
                              <span className="value">{item.versionName || '--'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="ontology-item-footer">
                          <div className="info">
                            <div>
                              <span className="label">更新时间：</span>
                              <span className="value">{item.lastUpdate}</span>
                            </div>
                          </div>
                          <div className="oper-group">
                            {/* <Button
                                                      type="text"
                                                      size="mini"
                                                      onClick={() => {
                                                          // this.addTab(item)
                                                      }}>
                                                      <IconUpSquareColor/>
                                                      RDF导出
                                                  </Button>
                                                  <div className="split"></div> */}
                            {/*<Button
                                                      type="text"
                                                      size="mini"
                                                      onClick={() => {
                                                          // this.addTab(item)
                                                      }}>
                                                      <IconEyeColor/>
                                                      预览
                                                  </Button>
                                                  <div className="split"></div>
                                                  <Button
                                                      type="text"
                                                      size="mini"
                                                      onClick={() => {
                                                          this.viewOntology(item)
                                                      }}>
                                                      <IconReportEditColor/>
                                                      管理
                                                  </Button>*/}
                            {!item.status ? (
                              <>
                                {/*<div className="split"></div>*/}
                                <Popconfirm
                                  focusLock
                                  title="删除本体时，本体下的各资源及映射关系将一并删除，确认删除本体？"
                                  onOk={() => {
                                    this.deleteOntology(item);
                                  }}
                                  onCancel={() => {}}
                                >
                                  <Button type="text" loading={deleteLoading[item?.id]} size="mini">
                                    <IconDeleteColor />
                                    删除
                                  </Button>
                                </Popconfirm>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="ontology-manager-footer">
                <Pagination
                  size="mini"
                  total={pagination.total}
                  pageSize={pagination.pageSize}
                  current={pagination.current}
                  showTotal
                  showJumper
                  sizeCanChange
                  onChange={(pageNumber, pageSize) => {
                    this.getData({
                      page: pageNumber,
                      limit: pageSize,
                    });
                  }}
                />
              </div>
            </div>
            {tabs.map(tab => {
              return (
                <div
                  className="overview"
                  style={{
                    visibility: activeTab === tab.key ? 'visible' : 'hidden',
                    zIndex: activeTab === tab.key ? 1 : -1,
                  }}
                >
                  {this.tabViewRef.current[tab.key]}
                  {this.state.buildingOntologyIds.includes(tab.key) ? (
                    <ProgressModal
                      fileName={this.state.buildingOntologyFileNameMap[tab.key]}
                      statusLabel={this.state.buildingOntologyStatusLabelMap[tab.key]}
                      progressPercent={this.state.buildingOntologyProgressMap[tab.key]}
                      onBack={() => {
                        this.tabsRef.current.setActive(null);
                      }}
                    />
                  ) : null}
                </div>
              );
            })}
            {/* <GraphRelationshipCard />
                   <GraphLegend />
                   <GraphStatistics /> */}
            {/* <SideCard/> */}
          </div>
        </Spin>
        {publishModelVisible && (
          <PublishModel
            visible={publishModelVisible}
            ontologyList={[ontology]}
            onClose={() => {
              this.setState({ publishModelVisible: false });
            }}
            handlePublish={this.handlePublish}
          />
        )}
        {submitShareVisible && (
          <SubmitShareModel
            visible={submitShareVisible}
            ontology={ontology}
            onClose={() => {
              this.setState({ submitShareVisible: false });
            }}
          />
        )}
        {shareServiceVisible && (
          <ShareServiceModel
            visible={shareServiceVisible}
            ontology={ontology}
            onClose={() => {
              this.setState({ shareServiceVisible: false });
            }}
          />
        )}
        <Modal
          wrapClassName="ontology-create-modal"
          title={
            <div
              style={{
                textAlign: 'left',
              }}
            >
              {uploadOntology ? '导入本体' : '新建本体'}
            </div>
          }
          footer={
            <>
              <Button
                onClick={() => {
                  this.setState({
                    modalVisible: false,
                  });
                }}
              >
                取消
              </Button>
              <Button
                type="primary"
                loading={saveLoading}
                disabled={saveLoading}
                onClick={() => {
                  if (uploadOntology) {
                    this.handleUploadOntology();
                  } else {
                    this.createOntology();
                  }
                }}
              >
                {uploadOntology ? '导入' : '保存'}
              </Button>
            </>
          }
          key={modalVisible}
          visible={modalVisible}
          onCancel={() => {
            if (!saveLoading) {
              this.setState({
                modalVisible: false,
              });
            }
          }}
          onOk={() => {
            if (!saveLoading) {
              this.setState({
                modalVisible: false,
              });
            }
          }}
        >
          <Form
            ref={this.formRef}
            autoComplete="off"
            layout="vertical"
            initialValues={{
              createType: 1,
            }}
          >
            {/*<Form.Item
                            label='选择创建方式'
                            field='createType'>
                            <Radio.Group name='card-radio-group'>
                                {[
                                    {
                                        value: 1,
                                        label: '普通创建'
                                    },
                                    {
                                        value: 2,
                                        label: 'RDF上传'
                                    },
                                    {
                                        value: 3,
                                        label: ' 代码上传'
                                    }
                                ].map((item) => {
                                    return (
                                        <Radio
                                            disabled={item.value !== 1}
                                            key={item.value}
                                            value={item.value}>
                                            {({ checked }) => {
                                                return (
                                                    <Space
                                                        align='start'
                                                        className={`custom-radio-card ${checked ? 'custom-radio-card-checked' : ''}`}>
                                                        <div className='custom-radio-card-mask'>
                                                            <div className='custom-radio-card-mask-dot'></div>
                                                        </div>
                                                        <div>
                                                            <div className='custom-radio-card-title'>{item.label}</div>
                                                        </div>
                                                    </Space>
                                                );
                                            }}
                                        </Radio>
                                    );
                                })}
                            </Radio.Group>
                        </Form.Item>*/}
            <Form.Item
              label="英文名称"
              field="ontologyName"
              rules={[
                {
                  required: true,
                  message: '必须填写英文名称',
                },
                {
                  validator: async (val, callback) => {
                    if (!/^(?=.*[a-zA-Z])[a-zA-Z0-9_]+$/.test(val)) {
                      callback('必须包含英文字母，且只能输入英文字母、数字和下划线');
                      return;
                    }
                    const value = val.trim();
                    const res = await checkExistOntology({
                      ontologyName: value,
                    });
                    if (res.data && res.data.success) {
                      const { data } = res.data;
                      if (data && data.exists) {
                        callback(`${value}已存在`);
                      }
                    }
                    callback();
                  },
                },
              ]}
            >
              <Input placeholder="请输入本体英文名称" maxLength={25} showWordLimit />
            </Form.Item>
            <Form.Item
              label="中文名称"
              field="ontologyLabel"
              rules={[
                {
                  required: true,
                  message: '必须填写中文名称',
                },
                {
                  validator: async (val, callback) => {
                    const value = val.trim();
                    const res = await checkExistOntology({
                      ontologyLabel: value,
                    });
                    if (res.data && res.data.success) {
                      const { data } = res.data;
                      if (data && data.exists) {
                        callback(`${value}已存在`);
                      }
                    }
                    callback();
                  },
                },
              ]}
            >
              <Input placeholder="请输入本体中文名称" maxLength={25} showWordLimit />
            </Form.Item>
            <Form.Item label="描述" field="ontologyDesc">
              <Input.TextArea
                style={{
                  height: '62px',
                }}
                maxLength={{ length: 200 }}
                showWordLimit
                placeholder="请输入属性描述"
              />
            </Form.Item>
            {uploadOntology && (
              <Form.Item label="上传文件">
                <Upload
                  autoUpload={false}
                  accept=".tar"
                  renderUploadList={this.renderUploadList}
                  onChange={this.onFileUploadChange}
                  fileList={fileList}
                >
                  <div className="upload-trigger">
                    <IconAdd className="icon" />
                    <div className="text">
                      将文件拖到此处，或
                      <span style={{ color: 'var(--color-primary-6)', padding: '0 4px' }}>
                        点击上传
                      </span>
                    </div>
                    <div className="tips">支持tar格式文件</div>
                  </div>
                </Upload>
              </Form.Item>
            )}
          </Form>
        </Modal>
        {createObjVisible && (
          <Obj
            ontology={ontology}
            close={() => {
              this.setState({ createObjVisible: false });
            }}
            afterCreated={ontologyId => {
              this.updateOntologyTab(ontologyId);
            }}
          />
        )}
        {linkModalVisible && (
          <Relation
            ontology={ontology}
            close={() => {
              this.setState({ linkModalVisible: false });
            }}
            afterCreated={ontologyId => {
              this.updateOntologyTab(ontologyId);
            }}
          />
        )}
        {actionModalVisible && (
          <Action
            ontology={ontology}
            close={() => {
              this.setState({ actionModalVisible: false });
            }}
            afterCreated={ontologyId => {
              this.updateOntologyTab(ontologyId);
            }}
          />
        )}
        <Modal
          title={<div style={{ textAlign: 'left', fontWeight: 600 }}>RDF导入</div>}
          visible={rdfImportVisible}
          footer={
            <Space>
              <Button onClick={() => this.setState({ rdfImportVisible: false, fileList: [] })}>
                取消
              </Button>
              <Button
                type="primary"
                onClick={() => this.handleImportRdf()}
                loading={importBtnLoading}
              >
                导入
              </Button>
            </Space>
          }
          onCancel={() => {
            this.setState({ rdfImportVisible: false, fileList: [] });
          }}
          autoFocus={false}
          focusLock
          className="import-modal"
        >
          <Form key={rdfImportVisible} autoComplete="off" layout="vertical">
            <Form.Item label="下载模版" field="down">
              <Button
                type="outline"
                onClick={this.handleDownRdfTpl}
                style={{ color: 'var(--color-primary-6)' }}
              >
                <IconDownloadColor />
                下载模板
              </Button>
            </Form.Item>
            <Form.Item label="上传文件" field="upload">
              <Upload
                autoUpload={false}
                accept=".ttl,.owl"
                renderUploadList={this.renderUploadList}
                onChange={this.onFileUploadChange}
                fileList={fileList}
              >
                <div className="upload-trigger">
                  <IconAdd className="icon" />
                  <div className="text">
                    将文件拖到此处，或
                    <span style={{ color: 'var(--color-primary-6)', padding: '0 4px' }}>
                      点击上传
                    </span>
                  </div>
                  <div className="tips">支持ttl，owl格式文件</div>
                </div>
              </Upload>
            </Form.Item>
          </Form>
        </Modal>
        <Modal
          title={<div style={{ textAlign: 'left', fontWeight: 600 }}>代码导入</div>}
          visible={codeImportVisible}
          footer={
            <Space>
              <Button onClick={() => this.setState({ codeImportVisible: false })}>取消</Button>
              <Button
                type="primary"
                onClick={() => this.handleImportCode()}
                loading={importBtnLoading}
              >
                导入
              </Button>
            </Space>
          }
          onCancel={() => {
            this.setState({ codeImportVisible: false });
          }}
          autoFocus={false}
          focusLock
          className="import-modal"
        >
          <Form key={codeImportVisible} autoComplete="off" layout="vertical">
            <Form.Item label="上传文件" field="upload">
              <Upload
                accept=".zip"
                autoUpload={false}
                renderUploadList={this.renderUploadList}
                onChange={this.onFileUploadChange}
                fileList={fileList}
              >
                <div className="upload-trigger">
                  <IconAdd className="icon" />
                  <div className="text">
                    将文件拖到此处，或
                    <span style={{ color: 'var(--color-primary-6)', padding: '0 4px' }}>
                      点击上传
                    </span>
                  </div>
                  <div className="tips">支持zip格式文件</div>
                </div>
              </Upload>
            </Form.Item>
          </Form>
        </Modal>
        <Modal
          title={<div style={{ textAlign: 'left', fontWeight: 600 }}>文档导入</div>}
          visible={fileImportVisible}
          footer={
            <Space>
              <Button onClick={() => this.setState({ fileImportVisible: false })}>取消</Button>
              <Button
                type="primary"
                onClick={() => this.handleImportFile()}
                loading={importBtnLoading}
              >
                导入
              </Button>
            </Space>
          }
          onCancel={() => {
            this.setState({ fileImportVisible: false });
          }}
          autoFocus={false}
          focusLock
          className="import-modal"
        >
          <Form key={fileImportVisible} autoComplete="off" layout="vertical">
            <Form.Item label="上传文件" field="upload">
              <Upload
                accept=".md"
                autoUpload={false}
                renderUploadList={this.renderUploadList}
                onChange={this.onFileUploadChange}
                fileList={fileList}
              >
                <div className="upload-trigger">
                  <IconAdd className="icon" />
                  <div className="text">
                    将文件拖到此处，或
                    <span style={{ color: 'var(--color-primary-6)', padding: '0 4px' }}>
                      点击上传
                    </span>
                  </div>
                  <div className="tips">支持markdown格式文件</div>
                </div>
              </Upload>
            </Form.Item>
          </Form>
        </Modal>
        <Modal
          title={<div style={{ textAlign: 'left', fontWeight: 600 }}>Excel导入</div>}
          visible={excelImportVisible}
          footer={
            <Space>
              <Button onClick={() => this.setState({ excelImportVisible: false })}>取消</Button>
              <Button
                type="primary"
                onClick={() => this.handleImportExcel()}
                loading={importBtnLoading}
              >
                导入
              </Button>
            </Space>
          }
          onCancel={() => {
            this.setState({ excelImportVisible: false });
          }}
          autoFocus={false}
          focusLock
          className="import-modal"
        >
          <Form key={excelImportVisible} autoComplete="off" layout="vertical">
            <Form.Item label="下载模版" field="down">
              <Button
                type="outline"
                onClick={this.handleDownExcelTpl}
                style={{ color: 'var(--color-primary-6)' }}
              >
                <IconDownloadColor />
                下载模板
              </Button>
            </Form.Item>
            <Form.Item label="上传文件" field="upload">
              <Upload
                accept=".xlsx,.xls,.csv"
                autoUpload={false}
                renderUploadList={this.renderUploadList}
                onChange={this.onFileUploadChange}
                fileList={fileList}
              >
                <div className="upload-trigger">
                  <IconAdd className="icon" />
                  <div className="text">
                    将文件拖到此处，或
                    <span style={{ color: 'var(--color-primary-6)', padding: '0 4px' }}>
                      点击上传
                    </span>
                  </div>
                  <div className="tips">支持xlsx、xls、csv格式文件</div>
                </div>
              </Upload>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={<div style={{ textAlign: 'left', fontWeight: 600 }}>新建属性</div>}
          okText="保存"
          style={{ width: '500px' }}
          visible={attrModalVisible}
          onOk={this.saveAttr}
          onCancel={() => {
            this.setState({ attrModalVisible: false });
          }}
          autoFocus={false}
          focusLock
          className="attr-modal"
        >
          <div className="attr-container">
            <Form
              ref={this.attrFormRef}
              key={attrModalVisible}
              autoComplete="off"
              layout="vertical"
              className="metaData-form"
              onValuesChange={this.onValuesChange}
              validateMessages={{
                required: (_, { label }) => `${'请输入'}${label} `,
              }}
            >
              <Form.Item label="中文名" field="attributeLabel" rules={[{ required: true }]}>
                <Input placeholder="请输入属性中文名称" maxLength={100} showWordLimit />
              </Form.Item>
              <Form.Item label="英文名" field="attributeName" rules={[{ required: true }]}>
                <Input placeholder="请输入属性英文名称" maxLength={100} showWordLimit />
              </Form.Item>
              <Form.Item label="描述" field="attributeDesc">
                <Input.TextArea
                  placeholder="请输入属性描述"
                  maxLength={200}
                  showWordLimit
                  style={{ minHeight: 62 }}
                />
              </Form.Item>
              <Form.Item label="基础类型允许多选" field="isMulti">
                <Switch />
              </Form.Item>
              <Form.Item label="基础类型" field="attributeTypes">
                <Select
                  mode={this.state.isMulti ? 'multiple' : false}
                  placeholder="请选择"
                  allowClear
                  options={typeOptions}
                  renderFormat={(option, value) => {
                    return option ? this.renderOption(option) : value;
                  }}
                ></Select>
              </Form.Item>
              <Form.Item label="属性启用" field="status">
                <Switch checkedText="启用" uncheckedText="禁用" />
              </Form.Item>
            </Form>
          </div>
        </Modal>
        <Modal
          visible={this.state.showPublishProgress}
          footer={null}
          closable={false}
          maskClosable={false}
          alignCenter={false}
          className="progress-modal"
        >
          <div className="publish-progress">
            <div className="title">
              <IconInformationColor /> 正在发布
            </div>
            <div className="progress-wrapper">
              <div className="progress" style={{ width: `${this.state.publishProgress}%` }}></div>
            </div>
          </div>
        </Modal>
      </>
    );
  }
}

export default connect(state => ({ identity: state.identity }))(OntologyManager);
