import React, { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import {
  Input,
  Button,
  Pagination,
  Spin,
  Empty,
  Tag,
  Divider,
  Modal,
  Link,
  Form,
  FormInstance,
  Select,
  Message,
  Tooltip,
} from '@arco-design/web-react';
import {
  IconAdd,
  IconDocumentEditColor,
  IconEdit,
  IconDelete,
  IconEye,
  IconDocumentColor,
  IconCopy,
  IconInformationColor,
} from 'modo-design/icon';
import UserIcon from './images/user-icon.png';
import './index.less';
import { ReactComponent as ReturnIcon } from './images/return-icon.svg';
import { ReactComponent as GoOnIcon } from './images/go-on-icon.svg';
import { ReactComponent as CardIcon1 } from './images/card-icon1.svg';
import { ReactComponent as CardIcon2 } from './images/card-icon2.svg';
import PolishIcon from './images/polish-icon.svg';
import PolishActiveIcon from './images/polish-active-icon.svg';
import {
  promptExplorePage,
  promptDetail,
  promptSave,
  promptEdit,
  promptDelete,
  promptRdf,
} from './api';
import axios from 'modo-plugin-common/src/core/src/http';

const InputSearch = Input.Search;
const FormItem = Form.Item;

export interface ItemProps {
  id?: string;
  promptType?: 0 | 1;
  defaultType?: 0 | 1;
  promptName?: string;
  promptDesc?: string;
  promptContent?: string;
  ownerId?: string;
  lastUpdate?: string;
  charNum?: number;
}

interface PromptProps {
  ontologyId: string;
  identity: any;
}

let promptValues = [''];
let currentPromptValueIndex = 0;
const Prompt: React.FC<PromptProps> = ({ ontologyId, identity }) => {
  const [searchKeywords, setSearchKeywords] = useState('');
  const [promptType, setPromptType] = useState<number | string>('');
  const [ownerId, setOwnerId] = useState('');

  const [loading, setLoading] = useState(false);

  const [total, setTotal] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);

  const [listData, setListData] = useState<Array<ItemProps>>([]);

  const [formData, setFormData] = useState<ItemProps>({});
  const getListData = async (pageNumber = 1, pageSize = 10, params = {}) => {
    setLoading(true);
    try {
      const res = await promptExplorePage({
        ontologyId,
        keyword: searchKeywords,
        promptType,
        page: pageNumber,
        limit: pageSize,
        ...params,
      });

      const { data, success } = res.data;

      if (success) {
        setListData(data.content);
        setTotal(data.totalElements);
      }

      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const [RDFContent, setRDFContent] = useState('');
  const getPromptRdf = async () => {
    try {
      const res = await promptRdf({
        id: ontologyId,
      });

      const { success, data } = res.data;

      if (success) {
        setRDFContent(data.prompt);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = (params = {}) => {
    setCurrentPage(1);
    getListData(1, 10, params);
  };

  const handlePaginationChange = (newPageNumber: number, newPageSize: number) => {
    setCurrentPage(newPageNumber);
    getListData(newPageNumber, newPageSize);
  };

  const [selectValue, setSelectValue] = useState<string | undefined>();

  const [userOptions, setUserOptions] = useState<Array<{ label: string; value: string }>>([]);
  useEffect(() => {
    getListData();
    getPromptRdf();

    axios
      .get(
        `${window.location.origin}/_common_/_api/_/teamMember/listMemberByTeamName?teamName=${
          identity.teamName || 'ceshiheader'
        }`,
      )
      .then(res => {
        const { data, success } = res.data;
        if (success) {
          setUserOptions(
            data.map(item => ({
              label: item.userName,
              value: item.userId,
            })),
          );
        }
      });
  }, []);

  const [detailVisible, setDetailVisible] = useState(false);

  const [editorVisible, setEditorVisible] = useState(false);

  const formRef = useRef<FormInstance<any, any, string | number | symbol>>(null);

  const [editorTitle, setEditorTitle] = useState('新建');

  const [selectOptions, setSelectOptions] = useState<
    Array<{ label: string; value: string; type?: number }>
  >([]);
  const getSelectOptions = async (currentId = '') => {
    try {
      setSelectOptions([]);

      const res = await promptExplorePage({
        ontologyId,
        keyword: '',
        page: 1,
        limit: 999999,
      });

      const { data, success } = res.data;

      if (success) {
        const allSelectOptions = data.content.map((item: ItemProps) => ({
          label: item.promptName,
          value: item.id,
          type: item.promptType,
        }));
        setSelectOptions(
          currentId
            ? allSelectOptions.filter(
                (item: { label: string; value: string }) => item.value !== currentId,
              )
            : allSelectOptions,
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAdd = () => {
    setEditorTitle('新建');
    promptValues = [''];
    currentPromptValueIndex = 0;
    setEditorVisible(true);
    setTimeout(() => {
      formRef.current?.clearFields();
      setFormData({});
    }, 0);
    getSelectOptions();
    setSelectValue(undefined);
  };

  const [loadingDetail, setLoadingDetail] = useState(false);

  const getDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const res = await promptDetail({ id });
      const { data, success } = res.data;
      if (success) {
        setFormData(data);
        setTimeout(() => {
          formRef.current?.setFieldsValue(data);
        }, 0);
        promptValues = [data.promptContent || ''];
      }
    } catch (error) {
      console.error(error);
    }
    setLoadingDetail(false);
  };

  const handleDetail = (item: ItemProps) => {
    setDetailVisible(true);
    getDetail(item.id || '');
  };

  const handleEdit = (item: ItemProps) => {
    setEditorTitle('编辑');
    currentPromptValueIndex = 0;
    setEditorVisible(true);
    getSelectOptions(item.id);
    getDetail(item.id || '');
    setSelectValue(undefined);
  };

  const handleDelete = (ids: Array<string | number>) => {
    Modal.confirm({
      title: '是否确认删除？',
      okButtonProps: {
        status: 'danger',
      },
      onOk: () => {
        promptDelete({ idList: ids }).then(res => {
          const { success } = res.data;
          if (success) {
            Message.success({
              content: '删除成功！',
            });
            setCurrentPage(1);
            getListData(1);
          } else {
            Message.error({
              content: '删除失败！',
            });
          }
        });
      },
    });
  };

  const handleSave = async () => {
    try {
      await formRef.current?.validate();

      const res = formData.id
        ? await promptEdit({ ontologyId, ...formData })
        : await promptSave({ ontologyId, ...formData });

      const { success } = res.data;

      if (success) {
        Message.success({
          content: '保存成功！',
        });

        setCurrentPage(1);
        getListData(1);
        setEditorVisible(false);
      } else {
        Message.error({
          content: '保存失败！',
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const changePromptValue = (value: string) => {
    promptValues.push(value);
    currentPromptValueIndex += 1;
  };

  const handleValueReturn = () => {
    if (!currentPromptValueIndex) {
      return;
    }

    currentPromptValueIndex -= 1;
    formRef.current?.setFieldValue('promptContent', promptValues[currentPromptValueIndex]);
  };

  const handleValueGoOn = () => {
    if (currentPromptValueIndex === promptValues.length - 1) {
      return;
    }

    currentPromptValueIndex += 1;
    formRef.current?.setFieldValue('promptContent', promptValues[currentPromptValueIndex]);
  };

  const handleReset = () => {
    currentPromptValueIndex = 0;
    formRef.current?.setFieldValue('promptContent', promptValues[0]);
  };

  const handleCopy = async containerElement => {
    if (!formData.promptContent) {
      return;
    }

    // const text = `${formData.promptType === 1 ? ontologyIdContent : RDFContent}\n${
    //   formData.promptContent
    // }`;

    const text =
      formData.promptType === 1
        ? `${formData.promptContent}${ontologyIdContent}`
        : `${formData.promptContent}\n${RDFContent}`;

    // 方法1: 使用现代 Clipboard API
    // if (navigator.clipboard && window.isSecureContext) {
    //   try {
    //     await navigator.clipboard.writeText(text);
    //     Message.success({
    //       content: '复制成功！',
    //     });
    //     return;
    //   } catch (err) {
    //     console.warn('Clipboard API 失败:', err);
    //     // 继续尝试其他方法
    //   }
    // }

    // 方法2: 使用 document.execCommand
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;

      // 使 textarea 在视口外
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';

      const container = containerElement || document.body;
      container.appendChild(textArea);

      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      container.removeChild(textArea);

      if (successful) {
        Message.success({
          content: '复制成功！',
        });
        return;
      }

      console.error('execCommand 失败:');
    } catch (err) {
      console.error('execCommand 失败:', err);
    }
  };

  const handleSelect = (id: string) => {
    setSelectValue(id);

    if (!id) {
      return;
    }

    setLoadingDetail(true);
    promptDetail({ id })
      .then(res => {
        const { data, success } = res.data;
        if (success) {
          formRef.current?.setFieldValue('promptContent', data.promptContent);
          currentPromptValueIndex += 1;
          promptValues.push(data.promptContent);
        }
        setLoadingDetail(false);
      })
      .catch(error => {
        console.error(error);
        setLoadingDetail(false);
      });
  };

  const [currentStringNumber, setCurrentStringNumber] = useState(0);

  const ontologyIdContent = `\n\n# 本体基础信息\nontology id: "${ontologyId}"`;

  return (
    <div className="prompt">
      <div className="prompt-header">
        <div className="prompt-header__title">提示词库(Prompt Library)</div>
        <div className="prompt-header__content">
          管理该本体下的所有AI角色定义。不同的提示词可用于支持搜索、分析或决策建议等不同场景。系统提供提示词模板直接使用，同时支持自定义添加更多提示词。
        </div>
      </div>

      <Spin loading={loading} className="prompt-main">
        <div className="prompt-main-filter">
          <div className="prompt-main-filter__title">提示词列表</div>
          <div className="prompt-main-filter__right">
            <InputSearch
              allowClear
              placeholder="搜索提示词"
              style={{ width: 262 }}
              searchButton
              onChange={value => setSearchKeywords(value)}
              onSearch={() => handleSearch()}
            />
            <Select
              placeholder="类型"
              style={{ width: 200 }}
              allowClear
              options={[
                { label: '全部', value: '' },
                { label: '通用', value: 0 },
                { label: 'OAG', value: 1 },
              ]}
              onChange={value => {
                setPromptType(value);
                handleSearch({ promptType: value });
              }}
            />
            <Select
              placeholder="创建人"
              style={{ width: 200 }}
              allowClear
              // options={[{ label: '全部', value: '' }].concat(userOptions)}
              options={userOptions}
              onChange={value => {
                setOwnerId(value);
                handleSearch({ ownerIdList: value });
              }}
              mode="multiple"
              filterOption={(inputValue, option) =>
                option.props.value.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0 ||
                option.props.children.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0
              }
            />
            <Button type="primary" onClick={handleAdd}>
              <IconAdd /> 新建提示词
            </Button>
          </div>
        </div>

        <div className="prompt-main-content">
          {listData?.length ? (
            <div className="prompt-main-content-list">
              {listData.map(item => (
                <div className="prompt-card" onDoubleClick={() => handleDetail(item)}>
                  <div className="prompt-card-body">
                    <div className="prompt-card-body__top">
                      <div
                        className="prompt-card-icon"
                        style={{
                          background: item.defaultType === 1 ? '#F4F2FF' : '#E5F4FE',
                          color: item.defaultType === 1 ? '#977AE7' : '#2E90FA',
                        }}
                      >
                        {item.defaultType === 1 ? <CardIcon1 /> : <CardIcon2 />}
                      </div>
                      <div className="prompt-card-title">{item.promptName}</div>
                      {item.promptType === 0 ? (
                        <Tag color="arcoblue" bordered style={{ fontSize: '12px' }}>
                          通用
                        </Tag>
                      ) : (
                        <Tag color="orangered" bordered style={{ fontSize: '12px' }}>
                          OAG
                        </Tag>
                      )}
                    </div>
                    <div className="prompt-card-body__center" style={{ WebkitLineClamp: 2 }}>
                      {item.promptDesc || '暂无描述'}
                    </div>
                    <div className="prompt-card-body__bottom">
                      <div className="prompt-card-body__bottom-item">
                        <div className="prompt-card-body__bottom-item-label">字符数</div>
                        <div className="prompt-card-body__bottom-item-value">{item.charNum}</div>
                      </div>
                      {item.defaultType === 0 ? (
                        <>
                          <div className="prompt-card-body__bottom-item">
                            <div className="prompt-card-body__bottom-item-label">创建人</div>
                            <div
                              className="prompt-card-body__bottom-item-value"
                              title={item.ownerId}
                            >
                              <img src={UserIcon} alt="user-icon" height={24} width={24} />{' '}
                              {item.ownerId}
                            </div>
                          </div>
                          <div className="prompt-card-body__bottom-item">
                            <div className="prompt-card-body__bottom-item-label">最后更新时间</div>
                            <div className="prompt-card-body__bottom-item-value">
                              {item.lastUpdate}
                            </div>
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div className="prompt-card-footer">
                    <div className="prompt-card-footer-item" onClick={() => handleDetail(item)}>
                      <IconEye />
                      查看详情
                    </div>
                    {item.defaultType === 0 ? (
                      <>
                        <Divider type="vertical" />
                        <div className="prompt-card-footer-item" onClick={() => handleEdit(item)}>
                          <IconEdit />
                          编辑
                        </div>
                        <Divider type="vertical" />
                        <div
                          className="prompt-card-footer-item"
                          onClick={() => handleDelete([item.id])}
                        >
                          <IconDelete />
                          删除
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty />
          )}
        </div>

        <Pagination
          total={total}
          showTotal
          showJumper
          sizeCanChange
          onChange={handlePaginationChange}
          current={currentPage}
        />
      </Spin>

      <Modal
        title={<div style={{ textAlign: 'left' }}>提示词详情</div>}
        visible={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        style={{ width: '60%' }}
      >
        <Spin loading={loadingDetail} className="prompt-detail prompt-modal">
          <div className="prompt-detail-header">
            <div
              className="prompt-detail-icon"
              style={{
                background: formData.defaultType === 1 ? '#F4F2FF' : '#E5F4FE',
                color: formData.defaultType === 1 ? '#977AE7' : '#2E90FA',
              }}
            >
              {formData.defaultType === 1 ? <CardIcon1 /> : <CardIcon2 />}
            </div>
            <div className="prompt-detail-title">{formData.promptName}</div>

            {formData.promptType === 0 ? (
              <Tag color="arcoblue" bordered style={{ fontSize: '12px' }}>
                通用
              </Tag>
            ) : (
              <Tag color="orangered" bordered style={{ fontSize: '12px' }}>
                OAG
              </Tag>
            )}
          </div>

          <div className="prompt-detail-main">
            <div className="prompt-detail-item">
              <div className="prompt-detail-item__label">描述</div>
              <div className="prompt-detail-item__value">{formData.promptDesc || '暂无描述'}</div>
            </div>
            <div className="prompt-detail-item">
              <div className="prompt-detail-item__label">
                {formData.promptType === 0 ? '通用' : 'OAG'}指令
                <Button
                  type="text"
                  icon={<IconCopy />}
                  disabled={!formData.promptContent}
                  onClick={() => handleCopy(document.querySelector('.prompt-detail'))}
                >
                  复制
                </Button>
              </div>
              <div className="prompt-detail-item__wrap">
                {/* {formData.promptType === 1 ? <div>{ontologyIdContent}</div> : null} */}
                <div className="prompt-detail-item__value">{formData.promptContent}</div>
              </div>
            </div>
          </div>
        </Spin>
      </Modal>

      <Modal
        title={<div style={{ textAlign: 'left' }}>提示词{editorTitle}</div>}
        visible={editorVisible}
        okText="保存"
        onOk={handleSave}
        onCancel={() => setEditorVisible(false)}
        style={{ width: '60%' }}
      >
        <Spin loading={loadingDetail} className="prompt-editor prompt-modal">
          <Form
            ref={formRef}
            autoComplete="off"
            layout="vertical"
            onValuesChange={(v, vs) => {
              setFormData({ ...formData, ...vs });
              vs.promptType === 1
                ? setCurrentStringNumber(ontologyIdContent.length + (vs.promptContent?.length || 0))
                : setCurrentStringNumber(RDFContent.length + vs.promptContent?.length || 0);
            }}
          >
            <FormItem
              label="提示词名称"
              field="promptName"
              rules={[
                { required: true, message: '请输入中文名称' },
                // {
                //   validator: (value: any, cb: (err?: string) => void) => {
                //     if (!value) {
                //       cb();
                //       return;
                //     }
                //     const formatRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/;
                //     // 必须包含中文或字母的校验
                //     const chineseOrLetterRegex = /[\u4e00-\u9fa5a-zA-Z]/;

                //     if (!formatRegex.test(value)) {
                //       cb('仅支持中文、字母、数字和下划线');
                //       return;
                //     }
                //     if (!chineseOrLetterRegex.test(value)) {
                //       cb('必须包含中文或字母');
                //       return;
                //     }
                //     cb();
                //   },
                // },
                // {
                //   validator: async (value: any, cb: (err?: string) => void) => {
                //     if (!value) {
                //       cb();
                //       return;
                //     }
                //     await sceneIsLabelExists({
                //       sceneLabel: value,
                //     })
                //       .then(res => {
                //         if (res.data.data) {
                //           cb('中文名称已存在');
                //         } else {
                //           cb();
                //         }
                //       })
                //       .catch(err => {
                //         cb(err);
                //       });
                //   },
                // },
              ]}
            >
              <Input placeholder="请输入" maxLength={50} />
            </FormItem>
            <FormItem
              label={
                <span>
                  <span style={{ marginRight: '8px' }}>指令类型</span>
                  <Tooltip content="1、通用指令默认将本体完整RDF作为提示词附加内容提供智能体，适用于体量较小的本体；2、OAG指令将基于提问范围，将剪枝后的RDF作为提示词附加内容提供智能体，适用于体量较大，场景复杂的本体。">
                    <IconInformationColor />
                  </Tooltip>
                </span>
              }
              field="promptType"
              rules={[{ required: true, message: '请选择类型' }]}
            >
              <Select
                placeholder="请选择类型"
                options={[
                  { label: 'OAG', value: 1 },
                  { label: '通用', value: 0 },
                ]}
              />
            </FormItem>
            <FormItem label="描述" field="promptDesc">
              <Input.TextArea placeholder="请输入" maxLength={500} />
            </FormItem>
            <FormItem
              label={
                <span>
                  指令
                  <span style={{ fontSize: '10px', margin: '0 8px', color: '#7D8999' }}>
                    当前字符数: {currentStringNumber}
                  </span>
                  <Tooltip content="统计当前指令框中的字符数，通用类的指令包含RDF的字符数，OAG类的包含本体ID。">
                    <IconInformationColor />
                  </Tooltip>
                </span>
              }
              required
            >
              <div className="prompt-editor-item-wrap">
                {/* {formRef.current?.getFieldValue('promptType') === 1 ? (
                  <div>{ontologyIdContent}</div>
                ) : null} */}
                <FormItem field="promptContent" rules={[{ required: true, message: '请输入指令' }]}>
                  <Input.TextArea
                    placeholder="请输入"
                    style={{ height: '320px' }}
                    onChange={changePromptValue}
                  />
                </FormItem>
                <div className="prompt-editor-item-wrap__bottom">
                  <div className="prompt-editor-item-wrap__bottom-left">
                    <div className="special-button">
                      <ReturnIcon
                        onClick={handleValueReturn}
                        style={{
                          fill: currentPromptValueIndex ? '#202939' : '#7D8999',
                          cursor: currentPromptValueIndex ? 'pointer' : 'not-allowed',
                        }}
                      />
                      <GoOnIcon
                        onClick={handleValueGoOn}
                        style={{
                          fill:
                            currentPromptValueIndex === promptValues.length - 1
                              ? '#7D8999'
                              : '#202939',
                          cursor:
                            currentPromptValueIndex === promptValues.length - 1
                              ? 'not-allowed'
                              : 'pointer',
                        }}
                      />
                    </div>
                    <Select
                      value={selectValue}
                      allowClear
                      style={{ width: '185px' }}
                      placeholder="可选择已有提示词直接导入"
                      // options={selectOptions}
                      onChange={handleSelect}
                      filterOption={(inputValue, option) =>
                        option.props.value.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0 ||
                        option.props.children.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0
                      }
                    >
                      {selectOptions.map(option => (
                        <Select.Option key={option.value} value={option.value}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              width: '100%',
                            }}
                          >
                            <div
                              style={{
                                flex: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={option.label}
                            >
                              {option.label}
                            </div>
                            {option.type === 0 ? (
                              <Tag
                                color="arcoblue"
                                bordered
                                style={{
                                  fontSize: '12px',
                                  marginLeft: 8,
                                  height: '20px',
                                  lineHeight: '20px',
                                  padding: '0 6px',
                                }}
                              >
                                通用
                              </Tag>
                            ) : (
                              <Tag
                                color="orangered"
                                bordered
                                style={{
                                  fontSize: '12px',
                                  marginLeft: 8,
                                  height: '20px',
                                  lineHeight: '20px',
                                  padding: '0 6px',
                                }}
                              >
                                OAG
                              </Tag>
                            )}
                          </div>
                        </Select.Option>
                      ))}
                    </Select>

                    <img className="cursor-pointer" src={PolishIcon} alt="" />
                  </div>
                  <div className="prompt-editor-item-wrap__bottom-right">
                    <Button
                      type="outline"
                      shape="round"
                      onClick={() => handleCopy(document.querySelector('.prompt-editor'))}
                    >
                      复制
                    </Button>
                    <Button type="outline" shape="round" onClick={handleReset}>
                      重置
                    </Button>
                  </div>
                </div>
              </div>
            </FormItem>
          </Form>
        </Spin>
      </Modal>
    </div>
  );
};

export default connect(state => ({ identity: state.identity }))(Prompt);
