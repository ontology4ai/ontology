import React, {useEffect, useRef, useState,useCallback} from 'react';
import {Card, Input, Space, Tag, Progress, Button, Spin, Empty} from '@arco-design/web-react';
import {IconDown} from '@arco-design/web-react/icon';
import { IconDataResDirColor, IconSearchColor,IconResourcesColor } from 'modo-design/icon';
import './index.less'
import {getDetail,getSummaryData} from '../../../api'
import emptyIcon from "@/pages/object/images/empty.svg";
import ObjectTypeDetail from "@/pages/object-browser/object-type-detail";
import { debounce } from 'lodash';

const InputSearch = Input.Search;

const initAttrData = [
    {attributeName:'test1',
        isPrimaryKey:1,
        isTitle:0,
        data:[
            {value:'1111',num:1},
            {value:'11221',num:11},
            {value:'14341',num:13},
            {value:'1431',num:14},
            {value:'11144223',num:6},
        ]
    },
    {attributeName:'test2',
        isPrimaryKey:0,
        isTitle:1,
        data:[
            {value:'1111',num:1},
            {value:'11221',num:11},
            {value:'14341',num:13},
            {value:'1431',num:14},
            {value:'11144223',num:6},
        ]
    },
    {attributeName:'test3',
        isPrimaryKey:0,
        isTitle:0,
        data:[
            {value:'1111',num:1},
            {value:'11221',num:11},
            {value:'14341',num:13},
            {value:'1431',num:14},
            {value:'11144223',num:6},
        ]
    },
    {attributeName:'test4',
        isPrimaryKey:1,
        isTitle:0,
        data:[
            {value:'1111',num:1},
            {value:'11221',num:11},
            {value:'14341',num:13},
            {value:'1431',num:14},
            {value:'11144223',num:6},
        ]
    },
    {attributeName:'test5',
        isPrimaryKey:0,
        isTitle:1,
        data:[
            {value:'1111',num:1},
            {value:'11221',num:11},
            {value:'14341',num:13},
            {value:'1431',num:14},
            {value:'11144223',num:6},
        ]
    },
    {attributeName:'test6',
        isPrimaryKey:0,
        isTitle:0,
        data:[
            {value:'1111',num:1},
            {value:'11221',num:11},
            {value:'14341',num:13},
            {value:'1431',num:14},
            {value:'11144223',num:6},
        ]
    },
];

const Summary = (props) => {
    const {object} = props;
    const [attrData, setAttrData] = useState([]);
    const [objectId, setObjectId] = useState('');
    const [titleAttr, setTitleAttr] = useState({});
    const [titleData, setTitleData] = useState([]);
    const [titleDataTotal, setTitleDataTotal] = useState(0);
    const [objectData, setObjectData] = useState([
        {id:'12323',name:'fefwef'},
        {id:'1fsdf2323',name:'f32rrtrdef'},
        {id:'1few2323',name:'fe323ef'},
        {id:'12fw323',name:'fef2323ef'},
        {id:'123sfw23',name:'fefwef'},
        {id:'1fs323',name:'f32rrtrdef'},
        {id:'1ffw2323',name:'fe323ef'},
        {id:'12ccs3',name:'fef2323ef'},
        {id:'12wef3',name:'fefwef'},
        {id:'1ee2323',name:'f32rrtrdef'},
        {id:'1ffw323',name:'fe323ef'},
        {id:'1324323',name:'fef2323ef'},
        {id:'12fcs3',name:'fefwef'},
        {id:'3fe323',name:'f32rrtrdef'},
        {id:'sdfw2323',name:'fe323ef'},
        {id:'vvwdw323',name:'fef2323ef'},
    ]);
    const [searchStates, setSearchStates] = useState({});
    const [searchKeywords, setSearchKeywords] = useState({});
    const [attributesMap, setAttributesMap] = useState({});
    const [attrKeywords,setAttrKeywords] =useState('');
    const [cardLoading,setCardLoading] =useState({});
    const [loading,setLoading] =useState(false);
    const [titleLoading,setTitleLoading] =useState(false);
    const itemRefs = useRef([]);
    // 使用 ref 来跟踪所有可能变化的状态
    const stateRef = useRef({
        searchKeywords: {},
        attrData: []
    });

    // 当状态变化时更新 ref
    useEffect(() => {
        stateRef.current = {
            searchKeywords,
            attrData
        };
    }, [searchKeywords, attrData]);
    const renderTitle = (item,total)=>{
        return (
          <div>
              <div className="dot"></div>
              <Space>
                  {item.attributeName}

                  {total != null ?
                    <Tag size="mini">{total}</Tag>
                    :
                    <>
                        {item.isPrimaryKey ? (<Tag size="mini" effect="plain" color="arcoblue">主键</Tag>) : null}
                        {item.isTitle ? (<Tag size="mini" effect="plain" color="cyan">标题</Tag>) : null}
                    </>
                  }
              </Space>
          </div>
        )
    };
    useEffect(()=>{
        const objectId = object.id;
        setObjectId(objectId);
        console.log('objectId',objectId);
        objectId && getObjectDetail();
    },[]);
    useEffect(()=>{
        if(titleAttr.id){
            setTitleLoading(true);
            getSummaryData({
                objectTypeId: object.id,
                attributeId: titleAttr.id,
                limit: 1000,
                title: true,
            }).then(res => {
                if (res.data.success) {
                    const data = res.data.data;
                    setTitleData(data);
                    setTitleDataTotal(data.length||0);
                }
            }).finally(() => {
                setTitleLoading(false);
            })
        }
    },[titleAttr]);
    useEffect(()=>{
        const initCardLoading = {};
        const initAttributesMap = {};

        const initialSearchStates = {};
        const initialSearchKeywords = {};
        attrData.forEach(item => {
            initialSearchStates[item.id] = false;
            initialSearchKeywords[item.id] = '';
            initAttributesMap[item.id] = [];
            initCardLoading[item.id] = true;
            if(item.isTitle==1){
                setTitleAttr(item);
            }

        });
        setAttributesMap(initAttributesMap);
        setCardLoading(initCardLoading);
        setSearchStates(initialSearchStates);
        setSearchKeywords(initialSearchKeywords);
        attrData.forEach(item => {
            getSummaryData({
                objectTypeId: object.id,
                attributeId: item.id,
                limit: 5,
                title: false,
            }).then(res => {
                if (res.data.success) {
                    const data = res.data.data;
                    const nums = data.map(i => i.cnt);
                    const currentMax = Math.max(...nums);
                    data.forEach(i=>{
                        i.maxNum = currentMax;
                        i.progress = (i.cnt / currentMax) * 100;
                    });
                    setAttributesMap(prev => ({
                        ...prev,
                        [item.id]: data
                    }));
                }
            }).finally(() => {
                setCardLoading(prev => ({
                    ...prev,
                    [item.id]: false
                }));
            })
        })
    },[attrData]);
    const getObjectDetail = ()=>{
        setLoading(true);

        getDetail({objectTypeId:object.id}).then(res=>{
            if(res.data.success){
                setAttrData(res.data.data.attributes);
                setObjectData(res.data.data.linkObjectTypes);
            }
        }).finally(()=>{
            setLoading(false);
        })
    };

    const addCardList = (cardData) => {
        /*const newItems = [
            {value:'11fsdf11',num:1},
            {value:'11fsdf221',num:11},
            {value:'14fwf341',num:13},
            {value:'143fw1',num:14},
            {value:'111fw44223',num:6},
        ];

        const updatedAttrData = [...attrData];
        updatedAttrData[index] = {
            ...updatedAttrData[index],
            data: [...updatedAttrData[index].data, ...newItems]
        };

        setAttrData(updatedAttrData);*/
        const id = cardData.id;
        setCardLoading(prev => ({
            ...prev,
            [id]: true
        }));
        const prevData = [...attributesMap[id]];
        const query: any = [];
        Object.keys(searchKeywords).forEach(key => {
            if (searchKeywords[key].length > 0) {
                query.push({attributeId: key, keyword: searchKeywords[key]})
            }
        });
        const param = {
            objectTypeId: object.id,
            attributeId: id,
            limit: prevData.length + 10,
            title: false
        };
        if (query.length > 0) {
            param.query = JSON.stringify(query)
        }
        getSummaryData(param).then(res => {
            if (res.data.success) {
                const data = res.data.data;
                const nums = data.map(i => i.cnt);
                const currentMax = Math.max(...nums);
                data.forEach(i=>{
                    i.maxNum = currentMax;
                    i.progress = (i.cnt / currentMax) * 100;
                });
                setAttributesMap(prev => ({
                    ...prev,
                    [id]: data
                }));

                if(data && data.length>prevData.length){
                    const firstNewItemIndex = prevData.length;
                    const itemRef = itemRefs.current[`${id}-${firstNewItemIndex}`];
                    if (itemRef) {
                        itemRef.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                    }
                }
            }
        }).finally(() => {
            setCardLoading(prev => ({
                ...prev,
                [id]: false
            }));
        })


    };

    /*const toggleSearch = (attributeName) => {
        setSearchStates(prev => ({
            ...prev,
            [attributeName]: !prev[attributeName]
        }));
    };*/
    // 添加防抖的搜索函数
    const debouncedSearch = useCallback(
      debounce(async (id, keyword) => {
          try {
              setCardLoading(prev => ({
                  ...prev,
                  [id]: true
              }));
              await getSummaryData({
                  objectTypeId: object.id,
                  attributeId: id,
                  limit: 5,
                  title: false,
                  keyword:keyword,
              }).then(res => {
                  if (res.data.success) {
                      const data = res.data.data;
                      const nums = data.map(i => i.cnt);
                      const currentMax = Math.max(...nums);
                      data.forEach(i=>{
                          i.maxNum = currentMax;
                          i.progress = (i.cnt / currentMax) * 100;
                      });
                      setAttributesMap(prev => ({
                          ...prev,
                          [id]: data
                      }));
                  }
              }).finally(() => {
                  setCardLoading(prev => ({
                      ...prev,
                      [id]: false
                  }));
              })
          } catch (error) {
              console.log('搜索失败:', error);
          }
      }, 500), // 500毫秒防抖延迟
      []
    );
    // 使用useRef来存储防抖函数，确保它在组件生命周期内保持不变
    const debouncedGlobalSearchRef = useRef(
      debounce(async (keyword, id) => {
          try {
              const { searchKeywords: currentKeywords, attrData: currentAttrData } = stateRef.current;
              // 设置所有卡片为加载状态
              const loadingState = {};
              currentAttrData.forEach(item => {
                  loadingState[item.id] = true;
              });
              setCardLoading(prev => ({ ...prev, ...loadingState }));

              // 构建查询条件
              const query = [];
              // 使用最新的searchKeywords，但替换当前id的关键词
              const updatedKeywords = { ...currentKeywords, [id]: keyword };
              Object.keys(updatedKeywords).forEach(key => {
                  if (updatedKeywords[key].length > 0) {
                      query.push({ attributeId: key, keyword: updatedKeywords[key] });
                  }
              });

              // 并行获取所有属性的数据
              const promises = currentAttrData.map(item => {
                    const param = {
                        objectTypeId: object.id,
                        attributeId: item.id,
                        limit: 5,
                        title: false
                    };
                    if (query.length > 0) {
                        param.query = JSON.stringify(query)
                    }
                    return getSummaryData(param)
                }
              );

              const results = await Promise.all(promises);

              // 处理所有属性的返回数据
              const newAttributesMap = {};
              results.forEach((res, index) => {
                  if (res.data.success) {
                      const data = res.data.data;
                      const nums = data.map(i => i.cnt);
                      const currentMax = Math.max(...nums);
                      data.forEach(i => {
                          i.maxNum = currentMax;
                          i.progress = (i.cnt / currentMax) * 100;
                      });
                      newAttributesMap[currentAttrData[index].id] = data;
                  }
              });

              setAttributesMap(newAttributesMap);
          } catch (error) {
              console.error('搜索失败:', error);
          } finally {
              setCardLoading(prev => {
                  const newState = { ...prev };
                  stateRef.current.attrData.forEach(item => {
                      newState[item.id] = false;
                  });
                  return newState;
              });
          }
      }, 600)
    );


    const handleSearchChange = async (id, value) => {
        const keyword = value.trim();
        await setSearchKeywords(prev => ({
            ...prev,
            [id]: keyword
        }));
       // debouncedSearch(id,keyword);
        debouncedGlobalSearchRef.current(keyword,id);
    };

    const filterData = (data, keyword) => {
        if (!keyword) return data;
        return data.filter(item =>
          item.value.toLowerCase().includes(keyword.toLowerCase())
        );
    };
    const toggleSearch = (id) => {
        setSearchStates(prev => ({
            ...prev,
            [id]: !prev[id]
        }));

        // 如果当前是关闭状态，清空搜索关键词
        if (!searchStates[id]) {
            setSearchKeywords(prev => ({
                ...prev,
                [id]: ''
            }));
        }
    };

    const searchInputRefs = useRef({});

    // 添加点击外部区域的监听
    useEffect(() => {
        const handleClickOutside = (event) => {
            Object.keys(searchInputRefs.current).forEach(key => {
                const ref = searchInputRefs.current[key];
                if (ref && !ref.contains(event.target) && searchKeywords[key]?.trim() === '') {
                    setSearchStates(prev => ({
                        ...prev,
                        [key]: false
                    }));
                }
            });
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [searchKeywords]);

    const handleClear = async (id) => {
        await setSearchKeywords(prev => ({
            ...prev,
            [id]: ''
        }));
        await setSearchStates(prev => ({
            ...prev,
            [id]: false
        }));
        debouncedGlobalSearchRef.current('', id);
    };

    const handleAddTab = (data)=>{
        data.ontology=object.ontology;
        props.addTab({
            key: data.id,
            title: data.objectTypeLabel,
            view: <ObjectTypeDetail object={data} addTab={props.addTab}/>,
        })
    };

    const filterAttrData =attrData.filter(item=>item.attributeName.toLowerCase().includes(attrKeywords.toLowerCase()));
    return (
      <div className='summary-container'>
          <Spin style={{display: 'block', height: '100%', width: '100%'}} loading={loading}>
              <InputSearch
                allowClear
                placeholder='请输入关键字搜索属性'
                style={{ width: 350 }}
                value={attrKeywords}
                onChange={setAttrKeywords}
              />
              <div className="summary-cards">
                  <div className="summary-left">
                      {filterAttrData.map((item, cardIndex) => {
                          const filteredData = attributesMap[item.id];//filterData(attributesMap[item.id], searchKeywords[item.id]);
                          return (
                            <Card
                              key={item.id}
                              title={renderTitle(item)}
                              extra={
                                  <div className="search-container">
                                      <div
                                        className={`search-icon ${searchStates[item.id] ? 'hide' : 'show'}`}
                                        onClick={() => toggleSearch(item.id)}
                                      >
                                          <IconSearchColor/>
                                      </div>
                                      <div
                                        ref={el => searchInputRefs.current[item.id] = el}
                                        className={`search-input-wrapper ${searchStates[item.id] ? 'show' : 'hide'}`}
                                      >
                                          <InputSearch
                                            allowClear
                                            placeholder='请输入关键字搜索'
                                            value={searchKeywords[item.id]}
                                            onChange={(value) => handleSearchChange(item.id, value)}
                                            onClear={() => handleClear(item.id)}
                                          />
                                      </div>
                                  </div>
                              }
                            >
                                <Spin style={{display: 'block', height: '100%', width: '100%'}}
                                      loading={cardLoading[item.id]}>
                                    {filteredData?.length > 0 ?
                                      <ul>
                                          {filteredData?.map((data, itemIndex) => (
                                            <li
                                              className='data-info'
                                              key={itemIndex}
                                              ref={el => itemRefs.current[`${item.id}-${itemIndex}`] = el}
                                            >
                                                <div className="left-content">{data.value}</div>
                                                <div className="right-content">
                                                    <Progress
                                                      status='normal'
                                                      percent={data.progress}
                                                      showText={false}
                                                    />
                                                    <div className="num-text">{data.cnt}</div>
                                                </div>
                                            </li>
                                          ))}
                                      </ul>
                                      :
                                      <Empty
                                        className='card-empty'
                                        icon={
                                            <div
                                              style={{
                                                  display: 'inline-flex',
                                                  width: 48,
                                                  height: 48,
                                              }}
                                            >
                                                <img src={emptyIcon} alt="暂无数据"/>
                                            </div>
                                        }
                                      />
                                    }

                                    {filteredData?.length > 0 ?
                                      <div className="more-btn" onClick={() => addCardList(item)}>
                                          <Space><span>更多</span><IconDown/></Space>
                                      </div> : ''}

                                </Spin>
                            </Card>
                          );
                      })}
                  </div>
                  <div className="summary-right">
                      <Card
                        title={renderTitle(titleAttr,titleDataTotal)}
                        extra={
                            <Space onClick={() => {
                                props.setActiveTab && props.setActiveTab('preview')
                            }}>
                                <IconResourcesColor/>
                                更多
                            </Space>}
                        className='title-card'
                      > <Spin style={{display: 'block', height: '100%', width: '100%'}}
                              loading={titleLoading}>
                          {titleData?.length > 0 ? <ul>
                              {titleData?.slice(0,20).map(data => (
                                <li className='data-info' key={data.value}>
                                    <Space>
                                        <IconDataResDirColor/>
                                        {data.value}
                                    </Space>
                                </li>
                              ))}
                          </ul> : <Empty
                            className='title-empty'
                            icon={<div>
                                    <img src={emptyIcon} alt="暂无数据"/>
                                </div>
                            }
                          />}
                      </Spin>
                      </Card>
                      <Card
                        title={
                            <div>
                                <div className="dot"></div>
                                链接对象类型
                            </div>
                        }
                        className='object-card'>
                          <ul>
                              {objectData.map(data => (
                                <li className='data-info' key={data.id}>
                                    <Button type='text' onClick={()=>handleAddTab(data)}>
                                        <Space>
                                            <IconDataResDirColor/>
                                            {data.objectTypeLabel}
                                        </Space>
                                    </Button>

                                </li>
                              ))}
                          </ul>

                      </Card>
                  </div>
              </div>
          </Spin>
      </div>
    );
};

export default Summary;
